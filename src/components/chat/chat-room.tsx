"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Send } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getRecentChatMessages, getChatMessagesSince, sendChatMessage } from "@/app/actions/chat";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { COUNTRY_CODE_BY_THEME_ID, COUNTRY_LOGOS, initialsFromUsername } from "@/lib/onboarding";
import { CountryAvatar } from "@/components/ui/country-avatar";
import { ChatProfileSheet } from "@/components/chat/chat-profile-sheet";
import { useCurrentIdentity, isCurrentIdentity } from "@/hooks/use-current-identity";
import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { HAS_CHATTED_KEY } from "@/lib/badges";
import type { AfricanPlayer, ChatMessage, ChatRoom as ChatRoomType } from "@/types";

// How often an open room re-checks for new messages while mounted — a
// plain client-side setInterval, not Supabase Realtime (which would need
// an anon key + RLS policies that don't exist anywhere in this app; see
// lib/supabase.ts's "no client ever talks to Supabase directly" rule) and
// not the external-scheduler poller either (that's for push notifications
// when the app is closed — this only runs while a room is actually open).
const POLL_INTERVAL_MS = 3000;

export function ChatRoom({ rooms, playerPool }: { rooms: ChatRoomType[]; playerPool: AfricanPlayer[] }) {
  const profile = useOnboardingProfile();
  const countryCode = profile ? COUNTRY_CODE_BY_THEME_ID[profile.countryId] : undefined;

  const identity = useCurrentIdentity();
  const deviceId = identity.deviceId;

  // Surface the user's own country room right after "Général" — the room
  // they're most likely to want, per the onboarding country selection.
  const orderedRooms = useMemo(() => {
    if (!countryCode) return rooms;
    const homeRoom = rooms.find((room) => room.countryCode === countryCode);
    if (!homeRoom) return rooms;
    const generalRooms = rooms.filter((room) => room.type === "general");
    const otherRooms = rooms.filter((room) => room.id !== homeRoom.id && room.type !== "general");
    return [...generalRooms, homeRoom, ...otherRooms];
  }, [rooms, countryCode]);

  const homeRoomId = rooms.find((room) => room.countryCode === countryCode)?.id;
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const activeRoomId = selectedRoomId ?? homeRoomId ?? rooms[0]?.id ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState(false);
  const [openProfileTarget, setOpenProfileTarget] = useState<{ deviceId: string; userId: string | null } | null>(null);
  const lastCreatedAtRef = useRef<string | null>(null);

  const activeRoom = rooms.find((room) => room.id === activeRoomId);

  // Full reload on mount and every room switch; a lightweight cursor poll
  // the rest of the time (cleared whenever the room changes or the
  // component unmounts).
  useEffect(() => {
    if (!activeRoomId) return;
    let cancelled = false;

    getRecentChatMessages(activeRoomId).then((initial) => {
      if (cancelled) return;
      setMessages(initial);
      lastCreatedAtRef.current = initial.at(-1)?.createdAt ?? null;
    });

    const interval = setInterval(async () => {
      const fresh = await getChatMessagesSince(activeRoomId, lastCreatedAtRef.current);
      if (cancelled || fresh.length === 0) return;
      lastCreatedAtRef.current = fresh.at(-1)?.createdAt ?? lastCreatedAtRef.current;
      setMessages((current) => {
        const seen = new Set(current.map((message) => message.id));
        return [...current, ...fresh.filter((message) => !seen.has(message.id))];
      });
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activeRoomId]);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || !profile || !deviceId) return;
    setDraft("");
    setSendError(false);

    const { message } = await sendChatMessage(deviceId, activeRoomId, profile.username, profile.countryId, content);
    if (message) {
      lastCreatedAtRef.current = message.createdAt;
      setMessages((current) => [...current, message]);
      writeLocalStorageValue(HAS_CHATTED_KEY, "true");
    } else {
      // A failed send (Supabase unreachable, unconfigured, or — as happened
      // once — a schema mismatch after a code change outran the migration)
      // used to just vanish with no feedback: the draft was already cleared
      // and nothing else happened, which looked exactly like chat being
      // broken. Restore the draft so the message isn't lost, and say so.
      setDraft(content);
      setSendError(true);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="-mx-4 mb-3 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
        {orderedRooms.map((room) => (
          <button
            key={room.id}
            onClick={() => setSelectedRoomId(room.id)}
            aria-pressed={room.id === activeRoomId}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold",
              "transition-colors duration-[var(--duration-fast)] active:scale-95",
              room.id === activeRoomId
                ? "border-accent bg-accent text-accent-ink"
                : "border-border bg-surface text-muted hover:text-foreground"
            )}
          >
            {room.logo ? (
              <Image src={room.logo} alt="" width={16} height={16} className="size-4 shrink-0 object-contain" unoptimized />
            ) : (
              <span aria-hidden>{room.flag}</span>
            )}
            {room.name}
          </button>
        ))}
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-label={`Messages de ${activeRoom?.name ?? "la conversation"}`}
        className="flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-y-auto rounded-2xl border border-border bg-surface p-3"
      >
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Aucun message pour l&apos;instant dans {activeRoom?.name}.</p>
        )}
        {messages.map((message) => {
          const isOwn = isCurrentIdentity(message, identity);
          return (
            <button
              key={message.id}
              type="button"
              onClick={() => setOpenProfileTarget({ deviceId: message.deviceId, userId: message.userId })}
              className={cn("max-w-[85%] text-left sm:max-w-[70%]", isOwn && "self-end")}
            >
              {isOwn && profile && (
                <div className="mb-1 flex items-center justify-end gap-1.5">
                  <span className="text-xs font-semibold text-foreground">{profile.username}</span>
                  {COUNTRY_LOGOS[profile.countryId] && (
                    <Image
                      src={COUNTRY_LOGOS[profile.countryId]}
                      alt=""
                      width={14}
                      height={14}
                      className="size-3.5 shrink-0 object-contain"
                      unoptimized
                    />
                  )}
                  <CountryAvatar initials={initialsFromUsername(profile.username)} size={10} />
                </div>
              )}
              <div className={cn("rounded-2xl px-3 py-2 text-sm", isOwn ? "bg-accent text-accent-ink" : "bg-surface-2 text-foreground")}>
                {!isOwn && (
                  <p className="mb-0.5 flex items-center gap-1 text-[11px] font-bold opacity-70">
                    {message.countryId && COUNTRY_LOGOS[message.countryId] && (
                      <Image
                        src={COUNTRY_LOGOS[message.countryId]}
                        alt=""
                        width={12}
                        height={12}
                        className="size-3 shrink-0 object-contain"
                        unoptimized
                      />
                    )}
                    {message.authorName}
                  </p>
                )}
                <p className="leading-snug">{message.content}</p>
              </div>
              <p className={cn("mt-0.5 px-1 text-[10px] text-muted", isOwn && "text-right")} suppressHydrationWarning>
                {formatRelativeTime(message.createdAt)}
              </p>
            </button>
          );
        })}
      </div>

      {sendError && (
        <p className="mt-2 text-center text-xs font-semibold text-accent-3">
          Le message n&apos;a pas pu être envoyé. Réessaie.
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
        className="mt-3 flex shrink-0 items-center gap-2"
      >
        <label htmlFor="chat-draft" className="sr-only">
          Message pour {activeRoom?.name ?? "la conversation"}
        </label>
        <input
          id="chat-draft"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setSendError(false);
          }}
          placeholder={`Écrire dans ${activeRoom?.name ?? ""}…`}
          maxLength={500}
          autoComplete="off"
          className="min-h-11 flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
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

      {openProfileTarget && (
        <ChatProfileSheet
          deviceId={openProfileTarget.deviceId}
          userId={openProfileTarget.userId}
          playerPool={playerPool}
          onClose={() => setOpenProfileTarget(null)}
        />
      )}
    </div>
  );
}
