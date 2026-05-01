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

// Renders **bold** and *italic* markdown inline — no external dependency needed.
function renderMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function BotAvatar() {
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1"
      style={{ background: "linear-gradient(135deg, var(--ygo-accent), var(--pkmn-accent, #00AAFF))", fontSize: 10, color: "#080B14", fontWeight: 700 }}
    >
      AI
    </div>
  );
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
    <div className="flex gap-2 items-start">
      <BotAvatar />
      <div className="flex flex-col gap-2 items-start min-w-0">
        {text && (
          <div
            className="max-w-[100%] rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed"
            style={{ background: "var(--border)", color: "var(--text-primary)" }}
          >
            {text.split("\n").map((line, i) => (
              <span key={i}>
                {renderMarkdown(line)}
                {i < text.split("\n").length - 1 && <br />}
              </span>
            ))}
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
    </div>
  );
}
