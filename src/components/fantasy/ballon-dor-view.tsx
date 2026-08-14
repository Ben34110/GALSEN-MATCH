"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronDown, ChevronLeft, ChevronUp, Plus, Trophy, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { getNationalityFlag } from "@/lib/data/nationality-flags";
import { useBallonDorRanking, saveBallonDorRanking } from "@/hooks/use-ballon-dor-storage";
import { useOnboardingProfile } from "@/hooks/use-onboarding-profile";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { syncBallonDorPrediction } from "@/app/actions/ballon-dor-sync";
import { BALLON_DOR_SIZE } from "@/lib/ballon-dor";
import { BallonDorPickerSheet } from "@/components/fantasy/ballon-dor-picker-sheet";
import { ShareBallonDorButton } from "@/components/fantasy/share-ballon-dor-button";
import type { AfricanPlayer } from "@/types";

interface BallonDorViewProps {
  pool: AfricanPlayer[];
}

export function BallonDorView({ pool }: BallonDorViewProps) {
  const t = useTranslations("fantasy");
  const ranking = useBallonDorRanking();
  const profile = useOnboardingProfile();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const rankedPlayers = ranking
    .map((id) => pool.find((player) => String(player.id) === id))
    .filter((player): player is AfricanPlayer => Boolean(player));

  // Local write is synchronous/authoritative; the Supabase sync is
  // fire-and-forget best-effort, same pattern as fantasy-view.tsx's
  // syncRemote — never blocks the UI, silently no-ops with no profile yet.
  function persist(next: string[]) {
    saveBallonDorRanking(next);
    if (profile) syncBallonDorPrediction(getOrCreateDeviceId(), profile.username, next);
  }

  function addPlayer(player: AfricanPlayer) {
    if (ranking.length >= BALLON_DOR_SIZE) return;
    persist([...ranking, String(player.id)]);
    setPickerOpen(false);
  }

  function removePlayer(id: string) {
    persist(ranking.filter((playerId) => playerId !== id));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= ranking.length) return;
    const next = [...ranking];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  function save() {
    persist(ranking);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  }

  const candidates = pool.filter((player) => !ranking.includes(String(player.id)));

  return (
    <div>
      <Link
        href="/fantasy"
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("common.back")}
      </Link>

      <SectionHeader
        eyebrow={t("common.eyebrow")}
        title={t("ballonDor.title")}
        subtitle={t("ballonDor.subtitle")}
        action={
          rankedPlayers.length >= 3 && profile ? (
            <ShareBallonDorButton username={profile.username} countryId={profile.countryId} ranking={rankedPlayers} />
          ) : undefined
        }
      />

      {rankedPlayers.length === 0 ? (
        <Card className="mb-4 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-2/15 text-accent-2">
            <Trophy size={20} aria-hidden />
          </span>
          <p className="text-sm leading-snug text-muted">{t("ballonDor.emptyState", { size: BALLON_DOR_SIZE })}</p>
        </Card>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {rankedPlayers.map((player, index) => (
            <Card key={player.id} className="flex items-center gap-3 p-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {index + 1}
              </span>
              <Image
                src={player.photo}
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-full bg-surface-2 object-cover"
                unoptimized
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  <span aria-hidden>{getNationalityFlag(player.nationality)}</span> {player.name}
                </span>
                <span className="block truncate text-[11px] text-muted">
                  {player.nationality} · {player.teamName ?? "—"}
                </span>
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={t("ballonDor.moveUp")}
                  className="grid size-8 place-items-center rounded-full text-muted transition-colors disabled:opacity-30 hover:text-foreground"
                >
                  <ChevronUp size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rankedPlayers.length - 1}
                  aria-label={t("ballonDor.moveDown")}
                  className="grid size-8 place-items-center rounded-full text-muted transition-colors disabled:opacity-30 hover:text-foreground"
                >
                  <ChevronDown size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => removePlayer(String(player.id))}
                  aria-label={t("ballonDor.removePlayer")}
                  className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:text-accent-3"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {rankedPlayers.length < BALLON_DOR_SIZE && (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mb-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-border text-sm font-semibold text-muted transition-colors hover:border-accent/40 hover:text-foreground"
        >
          <Plus size={16} aria-hidden />
          {t("ballonDor.addPlayerButton", { count: rankedPlayers.length, size: BALLON_DOR_SIZE })}
        </button>
      )}

      <button
        type="button"
        disabled={rankedPlayers.length === 0}
        onClick={save}
        className={cn(
          "flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-base font-bold",
          "transition-transform duration-[var(--duration-fast)]",
          rankedPlayers.length > 0 ? "bg-accent text-accent-ink active:scale-[0.98]" : "cursor-not-allowed bg-surface-2 text-muted"
        )}
      >
        {justSaved ? (
          <>
            <Check size={18} aria-hidden />
            {t("ballonDor.saved")}
          </>
        ) : (
          t("ballonDor.save")
        )}
      </button>

      {pickerOpen && <BallonDorPickerSheet candidates={candidates} onPick={addPlayer} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
