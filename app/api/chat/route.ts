// Streaming AI chat API — powers the DuelDex AI chat widget.
//
// Uses Vercel AI SDK (streamText) with Claude Haiku for cost-efficient streaming.
// Tools use jsonSchema() instead of Zod to avoid Zod v4/v3 compatibility issues.
// Rate-limited per authenticated user (20 msg/day) via Firestore transactions.

import { NextRequest, NextResponse } from "next/server";
import { streamText, tool, isLoopFinished, stepCountIs, jsonSchema } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { checkAndIncrementUsage } from "@/lib/chat-ratelimit";
import { getAdminDb } from "@/lib/firebase-admin";
import { searchYGOCards } from "@/lib/yugioh";
import { searchPokemonCards, getBestTcgPrice, getCardMarketPrice } from "@/lib/pokemon";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are DuelDex Assistant, an expert advisor for Yu-Gi-Oh! and Pokémon Trading Card Games.

You help users:
1. Find card prices and check what specific cards are worth
2. Understand market trends and which cards are gaining or losing value
3. Get investment advice based on price data, momentum, and ban list changes
4. Navigate to specific card detail pages on DuelDex

Rules:
- ALWAYS use your tools to fetch real data before stating any prices
- Keep responses concise: 2-4 sentences unless detail is truly needed
- Never invent prices — only state prices from tool results
- For price history questions: call getCardPriceHistory, describe the trend in words, then mention the user can see the full chart on the card's detail page
- When you recommend specific cards, end your message with a JSON block using this EXACT format:
  <cards>[{"id":"89631139","name":"Blue-Eyes White Dragon","game":"yugioh","price":12.50,"currency":"USD","href":"/yugioh/card/89631139","image":"https://..."}]</cards>
- For Pokémon cards use game:"pokemon" and href:"/pokemon/card/{id}"
- Only include the <cards> block when you have specific card recommendations with real data from tools
- Investment advice: always add a brief disclaimer that TCG prices are volatile`;

const encoder = new TextEncoder();

function errorStream(message: string): Response {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(message));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return errorStream("AI service is not configured yet. Add ANTHROPIC_API_KEY in Vercel settings.");
  }

  try {
    const body = await req.json();
    const { messages, userId } = body as {
      messages: { role: string; content: string }[];
      userId?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Server-side rate limit for authenticated users
    if (userId) {
      const { allowed } = await checkAndIncrementUsage(userId);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "usage_exceeded",
            message: "You've reached your 20 messages/day limit. Resets at midnight UTC.",
          },
          { status: 429 },
        );
      }
    }

    const recentMessages = messages.slice(-10) as {
      role: "user" | "assistant";
      content: string;
    }[];

    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: SYSTEM_PROMPT,
      messages: recentMessages,
      stopWhen: [isLoopFinished(), stepCountIs(5)],
      maxOutputTokens: 600,
      temperature: 0.3,
      onError: (err) => console.error("[chat streamText]", err),
      tools: {
        searchCards: tool({
          description:
            "Search for TCG cards by name. Returns cards with current prices and page links. Use this when a user asks about a specific card.",
          inputSchema: jsonSchema<{ query: string; game?: "yugioh" | "pokemon" | "both" }>({
            type: "object",
            properties: {
              query: { type: "string", description: "Card name or partial name to search for" },
              game: {
                type: "string",
                enum: ["yugioh", "pokemon", "both"],
                description: "Which game to search. Defaults to both.",
              },
            },
            required: ["query"],
          }),
          execute: async ({ query, game = "both" }) => {
            const results: {
              id: string;
              name: string;
              game: "yugioh" | "pokemon";
              price: number;
              currency: string;
              href: string;
              image: string;
            }[] = [];

            const [ygoCards, pkmnCards] = await Promise.allSettled([
              game !== "pokemon" ? searchYGOCards(query) : Promise.resolve([]),
              game !== "yugioh" ? searchPokemonCards(query) : Promise.resolve([]),
            ]);

            if (ygoCards.status === "fulfilled") {
              for (const c of ygoCards.value.slice(0, 5)) {
                results.push({
                  id: String(c.id),
                  name: c.name,
                  game: "yugioh",
                  price: parseFloat(c.card_prices?.[0]?.tcgplayer_price ?? "0") || 0,
                  currency: "USD",
                  href: `/yugioh/card/${c.id}`,
                  image: c.card_images?.[0]?.image_url_small ?? "",
                });
              }
            }

            if (pkmnCards.status === "fulfilled") {
              for (const c of (pkmnCards.value as { id: string; name: string; image?: string }[]).slice(0, 5)) {
                results.push({
                  id: c.id,
                  name: c.name,
                  game: "pokemon",
                  price: 0,
                  currency: "USD",
                  href: `/pokemon/card/${c.id}`,
                  image: c.image ? `${c.image}/low.webp` : "",
                });
              }
            }

            return results;
          },
        }),

        getCardPrice: tool({
          description:
            "Get the current price for a specific card by its ID. Use after searchCards to get an accurate price.",
          inputSchema: jsonSchema<{ cardId: string; game: "yugioh" | "pokemon" }>({
            type: "object",
            properties: {
              cardId: { type: "string", description: "The card ID (numeric for YGO, e.g. swsh1-1 for Pokémon)" },
              game: { type: "string", enum: ["yugioh", "pokemon"] },
            },
            required: ["cardId", "game"],
          }),
          execute: async ({ cardId, game }) => {
            if (game === "yugioh") {
              const res = await fetch(
                `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}&tcgplayer_data=true`,
                { cache: "no-store" },
              );
              if (!res.ok) return { error: "Card not found" };
              const data = await res.json();
              const card = data.data?.[0];
              if (!card) return { error: "Card not found" };
              return {
                id: String(card.id),
                name: card.name,
                price: parseFloat(card.card_prices?.[0]?.tcgplayer_price ?? "0") || 0,
                currency: "USD",
                href: `/yugioh/card/${card.id}`,
                image: card.card_images?.[0]?.image_url_small ?? "",
              };
            } else {
              const res = await fetch(
                `https://api.tcgdex.net/v2/en/cards/${cardId}`,
                { cache: "no-store" },
              );
              if (!res.ok) return { error: "Card not found" };
              const card = await res.json();
              const tcgPrice = getBestTcgPrice(card);
              const cmPrice = getCardMarketPrice(card);
              return {
                id: card.id,
                name: card.name,
                price: tcgPrice ?? cmPrice ?? 0,
                currency: tcgPrice != null ? "USD" : "EUR",
                href: `/pokemon/card/${card.id}`,
                image: card.image ? `${card.image}/low.webp` : "",
              };
            }
          },
        }),

        getPriceMovers: tool({
          description:
            "Get today's top price movers — cards with the biggest price changes. Use for trend and investment questions.",
          inputSchema: jsonSchema<{ game?: "yugioh" | "pokemon" | "both" }>({
            type: "object",
            properties: {
              game: {
                type: "string",
                enum: ["yugioh", "pokemon", "both"],
                description: "Which game's movers to fetch. Defaults to both.",
              },
            },
          }),
          execute: async ({ game = "both" }) => {
            const db = getAdminDb();
            const out: {
              game: string;
              movers: { name: string; price: number; prevPrice: number; pct: number; href: string }[];
              hasHistory: boolean;
            }[] = [];

            const games = game === "both" ? ["yugioh", "pokemon"] : [game];
            for (const g of games) {
              try {
                const snap = await db.collection("price_movers").doc(g).get();
                if (snap.exists) {
                  const data = snap.data() as {
                    movers: { name: string; price: number; prevPrice: number; pct: number; href: string }[];
                    hasHistory: boolean;
                  };
                  out.push({ game: g, movers: data.movers ?? [], hasHistory: data.hasHistory ?? false });
                }
              } catch {
                // Firestore unavailable — skip
              }
            }
            return out;
          },
        }),

        getCardPriceHistory: tool({
          description:
            "Get historical price data for a specific card over the past N days. Use for price trend and investment questions about a specific card.",
          inputSchema: jsonSchema<{ cardId: string; game: "yugioh" | "pokemon"; days?: number }>({
            type: "object",
            properties: {
              cardId: { type: "string" },
              game: { type: "string", enum: ["yugioh", "pokemon"] },
              days: { type: "number", description: "Number of days of history to fetch (max 30). Defaults to 30." },
            },
            required: ["cardId", "game"],
          }),
          execute: async ({ cardId, game, days = 30 }) => {
            const db = getAdminDb();
            try {
              const snap = await db
                .collection("price_history")
                .doc(game)
                .collection(cardId)
                .orderBy("date", "desc")
                .limit(Math.min(days, 30))
                .get();

              if (snap.empty) {
                return { cardId, game, history: [], message: "No price history available yet — history builds over time." };
              }

              const history = snap.docs
                .map((d) => d.data() as { date: string; price: number; currency: string })
                .reverse();

              const first = history[0].price;
              const last = history[history.length - 1].price;
              const pctChange = first > 0 ? ((last - first) / first) * 100 : 0;

              return {
                cardId,
                game,
                history,
                summary: {
                  days: history.length,
                  startPrice: first,
                  currentPrice: last,
                  pctChange: Math.round(pctChange * 10) / 10,
                  currency: history[0].currency,
                },
              };
            } catch {
              return { cardId, game, history: [], message: "Unable to fetch price history." };
            }
          },
        }),

        getBanListChanges: tool({
          description:
            "Get the latest Yu-Gi-Oh! TCG ban list changes. Use when users ask about YGO investment, banned cards, or what's affecting prices.",
          inputSchema: jsonSchema<Record<string, never>>({
            type: "object",
            properties: {},
          }),
          execute: async () => {
            const db = getAdminDb();
            try {
              const snap = await db.collection("ban_list_changes").doc("latest").get();
              if (!snap.exists) {
                return { message: "No ban list data available yet." };
              }
              return snap.data();
            } catch {
              return { message: "Unable to fetch ban list data." };
            }
          },
        }),
      },
    });

    // Pipe textStream manually so mid-stream errors surface as readable text
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const delta of result.textStream) {
            controller.enqueue(encoder.encode(delta));
          }
          controller.close();
        } catch (streamErr) {
          console.error("[chat stream]", streamErr);
          const msg =
            (streamErr as { status?: number }).status === 429
              ? "AI service is busy. Please try again in a moment."
              : "Something went wrong while generating a response. Please try again.";
          controller.enqueue(encoder.encode(msg));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: unknown) {
    console.error("[chat]", err);
    const status = (err as { status?: number }).status;
    const msg =
      status === 429
        ? "AI service is busy. Please try again in a moment."
        : "Something went wrong. Please try again.";
    return errorStream(msg);
  }
}
