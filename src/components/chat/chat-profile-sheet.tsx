"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { getNationalityFlag } from "@/lib/data/nationality-flags";
import { getChatProfile, type ChatProfileBundle } from "@/app/actions/chat-profile";
import { CountryFlag } from "@/components/ui/country-flag";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { getAccentTheme } from "@/lib/mock/accent-themes";
import { TiktokIcon } from "@/components/icons/tiktok-icon";
import type { AfricanPlayer } from "@/types";

interface ChatProfileSheetProps {
  deviceId: string;
  userId: string | null;
  playerPool: AfricanPlayer[];
  onClose: () => void;
}

function PlayerRow({ player, rank }: { player: AfricanPlayer; rank?: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      {rank !== undefined && (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
          {rank}
        </span>
      )}
      <Image src={player.photo} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full bg-surface-2 object-cover" unoptimized />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
          <span aria-hidden>{getNationalityFlag(player.nationality)}</span> {player.name}
        </span>
        <span className="block truncate text-[11px] text-muted">{player.nationality} · {player.teamName ?? "—"}</span>
      </span>
    </div>
  );
}

// Opened by clicking any chat message (see chat-room.tsx) — the first place
// in this app that reads another device's synced profile data (see
// app/actions/chat-profile.ts's own comment on why that's new). id
// resolution (playerIds/ballonDorTop3 -> AfricanPlayer) happens here,
// client-side, against the pool already loaded by the chat page — same
// convention as ballon-dor-view.tsx/preferences-editor.tsx.
export function ChatProfileSheet({ deviceId, userId, playerPool, onClose }: ChatProfileSheetProps) {
  const t = useTranslations("chat.profileSheet");
  const [bundle, setBundle] = useState<ChatProfileBundle | null | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    // Both setBundle calls go through a resolved promise rather than
    // running synchronously in the effect body — react-hooks/set-state-in-
    // effect, same fix used elsewhere in this app (e.g. quiz-session-view.tsx).
    Promise.resolve("loading" as const).then((value) => {
      if (!cancelled) setBundle(value);
    });
    getChatProfile(deviceId, userId).then((result) => {
      if (!cancelled) setBundle(result);
    });
    return () => {
      cancelled = true;
    };
  }, [deviceId, userId]);

  const countryLabel = bundle && bundle !== "loading" && bundle.countryId ? getAccentTheme(bundle.countryId).label : null;
  const favoritePlayers =
    bundle && bundle !== "loading"
      ? bundle.playerIds.map((id) => playerPool.find((player) => String(player.id) === id)).filter((p): p is AfricanPlayer => Boolean(p))
      : [];
  const ballonDorPlayers =
    bundle && bundle !== "loading"
      ? bundle.ballonDorTop3.map((id) => playerPool.find((player) => String(player.id) === id)).filter((p): p is AfricanPlayer => Boolean(p))
      : [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-[calc(0.75rem+var(--safe-top))]">
        <h2 className="font-serif text-lg font-bold text-foreground">{t("title")}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-foreground"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {bundle === "loading" && <p className="py-10 text-center text-sm text-muted">{t("loading")}</p>}

        {bundle === null && <p className="py-10 text-center text-sm text-muted">{t("unavailable")}</p>}

        {bundle && bundle !== "loading" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <ProfileAvatar countryId={bundle.countryId} size={14} />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">{bundle.username}</p>
                {bundle.countryId && countryLabel && (
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    <CountryFlag countryId={bundle.countryId} size={16} className="size-4 shrink-0 object-contain" />
                    {countryLabel}
                  </span>
                )}
              </div>
              {bundle.tiktokHandle && (
                <a
                  href={`https://www.tiktok.com/@${bundle.tiktokHandle}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={t("tiktokAriaLabel", { handle: bundle.tiktokHandle })}
                  className="ml-auto grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-foreground transition-transform active:scale-90"
                >
                  <TiktokIcon size={18} />
                </a>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{t("favoritePlayers")}</h3>
              {favoritePlayers.length === 0 ? (
                <p className="text-sm text-muted">{t("noFavoritePlayers")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {favoritePlayers.map((player) => (
                    <PlayerRow key={player.id} player={player} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{t("ballonDor")}</h3>
              {ballonDorPlayers.length === 0 ? (
                <p className="text-sm text-muted">{t("noBallonDor")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {ballonDorPlayers.map((player, index) => (
                    <PlayerRow key={player.id} player={player} rank={index + 1} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
