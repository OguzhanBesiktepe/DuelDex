"use client";

import CardChip, { type CardResult } from "./CardChip";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function parseMessageContent(content: string): {
  text: string;
  cards: CardResult[];
} {
  const match = content.match(/<cards>(\[[\s\S]*?\])<\/cards>/);
  if (!match) return { text: content, cards: [] };
  try {
    const cards = JSON.parse(match[1]) as CardResult[];
    const text = content.replace(match[0], "").trim();
    return { text, cards };
  } catch {
    return { text: content, cards: [] };
  }
}

export default function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm leading-relaxed"
          style={{ background: "var(--ygo-accent)", color: "#080B14" }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const { text, cards } = parseMessageContent(message.content);

  return (
    <div className="flex flex-col gap-2 items-start">
      {text && (
        <div
          className="max-w-[90%] rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          {text}
        </div>
      )}
      {cards.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {cards.map((card) => (
            <CardChip key={`${card.game}-${card.id}`} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
