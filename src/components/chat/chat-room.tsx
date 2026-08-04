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
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setActiveRoomId(room.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              room.id === activeRoomId
                ? "border-accent bg-accent text-accent-ink"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            <span>{room.flag}</span>
            {room.name}
          </button>
        ))}
      </div>

      <div className="flex min-h-[50vh] flex-col justify-end gap-2.5 rounded-2xl border border-border bg-surface p-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Aucun message pour l&apos;instant dans {activeRoom?.name}.</p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={cn("max-w-[85%]", message.authorName === "Toi" && "self-end")}>
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
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Écrire dans ${activeRoom?.name ?? ""}…`}
          maxLength={500}
          className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Envoyer"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-40"
          disabled={!draft.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
