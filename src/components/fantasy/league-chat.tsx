"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn, formatRelativeTime } from "@/lib/utils";
import { getRecentChatMessages, getChatMessagesSince, sendChatMessage } from "@/app/actions/chat";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { useCurrentIdentity, isCurrentIdentity } from "@/hooks/use-current-identity";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { CountryFlag } from "@/components/ui/country-flag";
import type { ChatMessage } from "@/types";

// Reuses the exact same chat_messages table/actions as the country/general
// rooms in components/chat/chat-room.tsx — room_id is already a plain,
// generic string there, so a league just gets its own room id
// ("league:{leagueId}") instead of a country code. A single fixed room
// (no switcher, no country flag picker) rather than reusing <ChatRoom>
// directly, which carries the multi-room UI this doesn't need.
const POLL_INTERVAL_MS = 3000;

export function LeagueChat({ leagueId }: { leagueId: string }) {
  const t = useTranslations("fantasy.leagues");
  const profile = useOnboardingProfile();
  const identity = useCurrentIdentity();
  const roomId = `league:${leagueId}`;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState(false);
  const lastCreatedAtRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getRecentChatMessages(roomId).then((initial) => {
      if (cancelled) return;
      setMessages(initial);
      lastCreatedAtRef.current = initial.at(-1)?.createdAt ?? null;
    });

    const interval = setInterval(async () => {
      const fresh = await getChatMessagesSince(roomId, lastCreatedAtRef.current);
      if (cancelled || fresh.length === 0) return;
      lastCreatedAtRef.current = fresh.at(-1)?.createdAt ?? lastCreatedAtRef.current;
      setMessages((current) => [...current, ...fresh]);
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage() {
    const trimmed = draft.trim();
    if (!trimmed || !profile) return;
    setDraft("");
    setSendError(false);
    const result = await sendChatMessage(getOrCreateDeviceId(), roomId, profile.username, profile.countryId, trimmed);
    if (!result.ok || !result.message) {
      setSendError(true);
      return;
    }
    setMessages((current) => [...current, result.message!]);
    lastCreatedAtRef.current = result.message.createdAt;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-y-auto rounded-2xl border border-border bg-surface p-3">
        {messages.length === 0 && <p className="py-8 text-center text-sm text-muted">{t("chatEmpty")}</p>}
        {messages.map((message) => {
          const isOwn = isCurrentIdentity(message, identity);
          return (
            <div key={message.id} className={cn("max-w-[85%] text-left sm:max-w-[70%]", isOwn && "self-end")}>
              <div className={cn("rounded-2xl px-3 py-2 text-sm", isOwn ? "bg-accent text-accent-ink" : "bg-surface-2 text-foreground")}>
                {!isOwn && (
                  <p className="mb-0.5 flex items-center gap-1 text-[11px] font-bold opacity-70">
                    {message.countryId && (
                      <CountryFlag countryId={message.countryId} size={12} className="size-3 shrink-0 object-contain" />
                    )}
                    {message.authorName}
                  </p>
                )}
                <p className="leading-snug">{message.content}</p>
              </div>
              <p className={cn("mt-0.5 px-1 text-[10px] text-muted", isOwn && "text-right")} suppressHydrationWarning>
                {formatRelativeTime(message.createdAt)}
              </p>
            </div>
          );
        })}
      </div>

      {sendError && <p className="mt-2 text-center text-xs font-semibold text-accent-3">{t("chatSendError")}</p>}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
        className="mt-3 flex shrink-0 items-center gap-2"
      >
        <label htmlFor="league-chat-draft" className="sr-only">
          {t("chatPlaceholder")}
        </label>
        <input
          id="league-chat-draft"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setSendError(false);
          }}
          placeholder={t("chatPlaceholder")}
          maxLength={500}
          autoComplete="off"
          className="min-h-11 flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          aria-label={t("chatSend")}
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
