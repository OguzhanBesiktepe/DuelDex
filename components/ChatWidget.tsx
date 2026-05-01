"use client";

import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import ChatMessageBubble, { type ChatMessage } from "./ChatMessageBubble";

const ANON_DAILY_LIMIT = 5;
const HISTORY_KEY = "dueldex_chat_history";

function getAnonKey() {
  const date = new Date().toISOString().slice(0, 10);
  return `dueldex_chat_anon_${date}`;
}

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    // localStorage full — silently skip
  }
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-1 rounded-2xl rounded-tl-sm px-3 py-2"
        style={{ background: "var(--border)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-1.5 h-1.5 rounded-full animate-bounce"
            style={{
              background: "var(--text-muted)",
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function WelcomeMessage() {
  return (
    <div
      className="rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed"
      style={{ background: "var(--border)", color: "var(--text-primary)" }}
    >
      Hi! I&apos;m the DuelDex AI. Ask me about card prices, price history,
      what&apos;s trending, or what&apos;s worth investing in right now.
    </div>
  );
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [anonCount, setAnonCount] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Load history on mount
  useEffect(() => {
    setMessages(loadHistory());
  }, []);

  // Load anon counter
  useEffect(() => {
    if (!user) {
      const count = parseInt(localStorage.getItem(getAnonKey()) ?? "0", 10);
      setAnonCount(count);
    } else {
      setAnonCount(0);
    }
  }, [user, isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;

      // Track anonymous usage
      if (!user) {
        const next = anonCount + 1;
        setAnonCount(next);
        localStorage.setItem(getAnonKey(), String(next));
      }

      const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      // Placeholder for streaming assistant message
      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        abortRef.current = new AbortController();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map(({ role, content }) => ({ role, content })),
            userId: user?.uid,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const errMsg =
            res.status === 429
              ? (err.message ?? "You've reached your daily message limit. Resets at midnight UTC.")
              : res.status === 503
              ? "AI service is busy. Please try again in a moment."
              : "Something went wrong. Please try again.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: errMsg } : m,
            ),
          );
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          const current = accumulated;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: current } : m,
            ),
          );
        }

        // Fallback: if stream completed with no content, show an error
        if (!accumulated.trim()) {
          accumulated = "I didn't receive a response. Please check that the AI service is configured and try again.";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m,
            ),
          );
        }

        // Persist complete history
        setMessages((prev) => {
          saveHistory(prev);
          return prev;
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Connection error. Please try again." }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, user, anonCount],
  );

  function clearChat() {
    abortRef.current?.abort();
    setMessages([]);
    localStorage.removeItem(HISTORY_KEY);
  }

  const inputBlocked = !user && anonCount >= ANON_DAILY_LIMIT;
  const remaining = ANON_DAILY_LIMIT - anonCount;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
        style={{ background: "var(--ygo-accent)", zIndex: 45 }}
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#080B14" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#080B14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 md:hidden"
          style={{ background: "rgba(0,0,0,0.4)", zIndex: 44 }}
        />
      )}

      {/* Chat drawer — bottom sheet on mobile, floating panel on desktop */}
      <div
        className="fixed flex flex-col overflow-hidden shadow-2xl transition-all duration-300"
        style={{
          ...(isDesktop
            ? { right: 24, bottom: 96, width: 380, height: "min(560px, calc(100dvh - 140px))" }
            : { left: 12, right: 12, bottom: 88, height: "min(75dvh, calc(100dvh - 120px))" }),
          borderRadius: 20,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          zIndex: 45,
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "linear-gradient(135deg, rgba(255,122,0,0.08) 0%, rgba(0,170,255,0.06) 100%)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Image src="/Logo.png" alt="DuelDex" width={28} height={28} className="rounded-md" />
            <div>
              <p
                className="text-sm font-bold leading-none tracking-wide"
                style={{ fontFamily: "var(--font-cinzel, serif)", color: "var(--text-primary)" }}
              >
                DuelDex AI
              </p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: "var(--text-muted)" }}>
                TCG Price Assistant
              </p>
            </div>
            <span
              className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--ygo-accent)", color: "#080B14" }}
            >
              AI
            </span>
          </div>
          <button
            onClick={clearChat}
            className="text-xs px-2 py-1 rounded-lg transition hover:bg-white/5"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {messages.length === 0 && <WelcomeMessage />}
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.content === "" && (
            <TypingIndicator />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="px-3 py-3 shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {inputBlocked ? (
            <div className="text-center py-2">
              <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
                Daily limit reached
              </p>
              <Link
                href="/signin"
                className="text-sm font-semibold px-4 py-1.5 rounded-lg inline-block transition hover:opacity-90"
                style={{
                  background: "var(--pkmn-accent, #00AAFF)",
                  color: "#080B14",
                }}
              >
                Sign in for 20/day
              </Link>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about card prices…"
                maxLength={500}
                disabled={isLoading}
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-60"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-lg px-3 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-40"
                style={{ background: "var(--ygo-accent)", color: "#080B14" }}
              >
                →
              </button>
            </form>
          )}
          {!user && !inputBlocked && (
            <p
              className="mt-1.5 text-center text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {remaining} free message{remaining !== 1 ? "s" : ""} remaining ·{" "}
              <Link
                href="/signin"
                style={{ color: "var(--pkmn-accent, #00AAFF)" }}
              >
                Sign in for 20/day
              </Link>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
