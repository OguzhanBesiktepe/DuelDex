// Streaming AI chat API — powers the DuelDex AI chat widget.
//
// Uses Vercel AI SDK (streamText) with Claude Haiku for cost-efficient streaming.
// Tools allow the AI to fetch live card prices, price history, movers, and ban list changes.
// Rate-limited per authenticated user (20 msg/day) via Firestore transactions.

import { NextRequest, NextResponse } from "next/server";
import { streamText, tool, stepCountIs } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
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

export async function POST(req: NextRequest) {
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
      const { allowed, remaining } = await checkAndIncrementUsage(userId);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "usage_exceeded",
            message:
              "You've reached your 20 messages/day limit. Resets at midnight UTC.",
          },
          { status: 429 },
        );
      }
      void remaining; // used by caller if needed
    }

    // Keep last 10 messages to control context costs
    const recentMessages = messages.slice(-10) as {
      role: "user" | "assistant";
      content: string;
    }[];

    const result = streamText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system: SYSTEM_PROMPT,
      messages: recentMessages,
      stopWhen: stepCountIs(3),
      maxOutputTokens: 600,
      temperature: 0.3,
      tools: {
        searchCards: tool({
          description:
            "Search for TCG cards by name. Returns cards with current prices and page links. Use this when a user asks about a specific card.",
          inputSchema: z.object({
            query: z.string().describe("Card name or partial name to search for"),
            game: z
              .enum(["yugioh", "pokemon", "both"])
              .optional()
              .default("both")
              .describe("Which game to search"),
          }),
          execute: async ({ query, game }) => {
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
          inputSchema: z.object({
            cardId: z.string().describe("The card ID (numeric for YGO, e.g. swsh1-1 for Pokémon)"),
            game: z.enum(["yugioh", "pokemon"]),
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
          inputSchema: z.object({
            game: z
              .enum(["yugioh", "pokemon", "both"])
              .optional()
              .default("both"),
          }),
          execute: async ({ game }) => {
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
          inputSchema: z.object({
            cardId: z.string(),
            game: z.enum(["yugioh", "pokemon"]),
            days: z.number().optional().default(30).describe("Number of days of history to fetch (max 30)"),
          }),
          execute: async ({ cardId, game, days }) => {
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
          inputSchema: z.object({}),
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

    return result.toTextStreamResponse();
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    if (status === 429) {
      return NextResponse.json(
        { error: "ai_rate_limit", message: "AI service is busy. Please try again in a moment." },
        { status: 503 },
      );
    }
    console.error("[chat]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
