"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getInitialMessages } from "@/lib/data/chat";
import type { ChatMessage, ChatRoom as ChatRoomType } from "@/types";

// Les messages vivent en mémoire côté client pour cette démo. Le passage à
// Supabase Realtime remplacera useState par un canal souscrit sur
// `chat_messages` filtré par room_id (insert émis en direct à tous les membres).
export function ChatRoom({ rooms }: { rooms: ChatRoomType[] }) {
  const [activeRoomId, setActiveRoomId] = useState(rooms[0]?.id ?? "");
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>(() =>
    Object.fromEntries(rooms.map((room) => [room.id, getInitialMessages(room.id)]))
  );
  const [draft, setDraft] = useState("");

  const activeRoom = rooms.find((room) => room.id === activeRoomId);
  const messages = messagesByRoom[activeRoomId] ?? [];

  function sendMessage() {
    const content = draft.trim();
    if (!content) return;

    const message: ChatMessage = {
      id: `local-${Date.now()}`,
      roomId: activeRoomId,
      authorName: "Toi",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessagesByRoom((current) => ({
      ...current,
      [activeRoomId]: [...(current[activeRoomId] ?? []), message],
    }));
    setDraft("");
  }

  return (
    <div className="flex flex-col">
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setActiveRoomId(room.id)}
            aria-pressed={room.id === activeRoomId}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold",
              "transition-colors duration-[var(--duration-fast)] active:scale-95",
              room.id === activeRoomId
                ? "border-accent bg-accent text-accent-ink"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            <span aria-hidden>{room.flag}</span>
            {room.name}
          </button>
        ))}
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label={`Messages de ${activeRoom?.name ?? "la conversation"}`}
        className="flex min-h-[60dvh] flex-col justify-end gap-2.5 rounded-2xl border border-border bg-surface p-3 sm:min-h-[50dvh]"
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Aucun message pour l&apos;instant dans {activeRoom?.name}.</p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={cn("max-w-[85%] sm:max-w-[70%]", message.authorName === "Toi" && "self-end")}>
            <div
              className={cn(
                "rounded-2xl px-3 py-2 text-sm",
                message.authorName === "Toi" ? "bg-accent text-accent-ink" : "bg-surface-2 text-foreground"
              )}
            >
              {message.authorName !== "Toi" && (
                <p className="mb-0.5 text-[11px] font-bold opacity-70">{message.authorName}</p>
              )}
              <p className="leading-snug">{message.content}</p>
            </div>
            <p
              className={cn(
                "mt-0.5 px-1 text-[10px] text-muted",
                message.authorName === "Toi" && "text-right"
              )}
              // Le mock génère createdAt relatif à Date.now() : le rendu serveur et
              // l'hydratation client tombent parfois de part et d'autre d'une minute,
              // ce qui ferait dévier ce texte d'un cran sans affecter le contenu réel.
              suppressHydrationWarning
            >
              {formatRelativeTime(message.createdAt)}
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
        className="mt-3 flex items-center gap-2"
      >
        <label htmlFor="chat-draft" className="sr-only">
          Message pour {activeRoom?.name ?? "la conversation"}
        </label>
        <input
          id="chat-draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Écrire dans ${activeRoom?.name ?? ""}…`}
          maxLength={500}
          autoComplete="off"
          className="min-h-11 flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Envoyer"
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink",
            "transition-[transform,opacity] duration-[var(--duration-fast)] active:scale-90 disabled:opacity-40"
          )}
          disabled={!draft.trim()}
        >
          <Send size={17} aria-hidden />
        </button>
      </form>
    </div>
  );
}
