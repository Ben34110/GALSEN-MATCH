"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchCompactList } from "@/components/profile/match-compact-list";
import { getNationalityFlag } from "@/lib/data/nationality-flags";
import { positionCode } from "@/lib/data/african-players";
import { formatDate } from "@/lib/utils";
import type { PlayerDetail, PlayerTransferRecord } from "@/types";

const BACK_HREF = "/joueur";

const PRICE_RE = /[€$£]|(?:\d\s*[MK])\b/i;

// Same fee-classification heuristic as components/mercato/mercato-transfer-
// list.tsx's FeeBadge (kept local rather than shared — this is the only
// other call site, and the two pages' surrounding markup differs enough
// that extracting a shared component would need its own prop plumbing for
// no real savings).
function FeeBadge({ type }: { type: string | null }) {
  const t = useTranslations("mercato");
  if (!type || /n\/a|free|libre/i.test(type)) return <Badge>{t("fee.free")}</Badge>;
  if (/loan|prêt/i.test(type)) return <Badge tone="accent">{t("fee.loan")}</Badge>;
  if (PRICE_RE.test(type)) return <Badge tone="accent">{type}</Badge>;
  return null;
}

function ClubCrest({ club, freeAgentLabel }: { club: { name: string; logo: string } | null; freeAgentLabel: string }) {
  return (
    <span className="flex flex-col items-center gap-1 text-center">
      {club ? (
        <Image src={club.logo} alt="" width={28} height={28} className="size-7 object-contain" unoptimized />
      ) : (
        <span className="grid size-7 place-items-center rounded-full bg-surface-2 text-[9px] font-bold text-muted">FA</span>
      )}
      <span className="max-w-[76px] truncate text-[11px] text-muted">{club?.name ?? freeAgentLabel}</span>
    </span>
  );
}

function TransferRow({ transfer, freeAgentLabel }: { transfer: PlayerTransferRecord; freeAgentLabel: string }) {
  return (
    <Card className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1.5">
          <FeeBadge type={transfer.type} />
          <span className="shrink-0 text-[11px] text-muted">{formatDate(transfer.date)}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ClubCrest club={transfer.clubFrom} freeAgentLabel={freeAgentLabel} />
          <ArrowRight size={14} className="shrink-0 text-muted" aria-hidden />
          <ClubCrest club={transfer.clubTo} freeAgentLabel={freeAgentLabel} />
        </div>
      </div>
    </Card>
  );
}

// A smaller sub-section heading than components/ui/section-header.tsx's
// SectionHeader — that one renders a page-level h1, wrong for the 4
// stacked sub-sections a player/team profile page needs (currentSeason,
// recentMatches, upcomingMatches, careerTransfers/standing).
function Subheading({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div className="mb-2">
      <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
      {subtitle && <p className="text-[11px] text-muted/70">{subtitle}</p>}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl bg-surface-2 px-2 py-3 text-center">
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</span>
    </div>
  );
}

export function PlayerProfileView({ player, backHref }: { player: PlayerDetail; backHref: string }) {
  const t = useTranslations("search.player");
  const code = positionCode(player.position);

  return (
    <div>
      <Link
        href={backHref}
        className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft size={18} aria-hidden />
        {t("back")}
      </Link>

      <Card className="mb-6 flex items-center gap-4">
        <span className="relative shrink-0">
          <Image
            src={player.photo}
            alt=""
            width={72}
            height={72}
            className="size-[72px] rounded-full bg-surface-2 object-cover"
            unoptimized
          />
          <span
            className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-surface text-base shadow-sm"
            aria-hidden
          >
            {getNationalityFlag(player.nationality)}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-serif text-xl font-bold text-foreground">{player.name}</h1>
          <p className="mt-0.5 truncate text-sm text-muted">
            {player.nationality} {code && `· ${t(`positions.${code}`)}`}
          </p>
          {player.teamName && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {player.teamLogo && (
                <Image src={player.teamLogo} alt="" width={18} height={18} className="size-[18px] object-contain" unoptimized />
              )}
              <span className="truncate text-sm font-semibold text-foreground">{player.teamName}</span>
            </div>
          )}
        </div>
      </Card>

      <div className="mb-6">
        <Subheading
          title={player.currentSeason ? `${t("currentSeason")} · ${player.currentSeason.displaySeason}` : t("currentSeason")}
          subtitle={player.currentSeason?.leagueName}
        />
        {player.currentSeason ? (
          <div className="grid grid-cols-3 gap-2">
            <StatCell label={t("appearances")} value={player.currentSeason.appearances} />
            <StatCell label={t("goals")} value={player.currentSeason.goals} />
            <StatCell label={t("assists")} value={player.currentSeason.assists} />
            <StatCell label={t("rating")} value={player.currentSeason.rating?.toFixed(1) ?? "—"} />
            <StatCell label={t("yellowCards")} value={player.currentSeason.yellowCards} />
            <StatCell label={t("redCards")} value={player.currentSeason.redCards} />
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
            {t("noCurrentSeason")}
          </p>
        )}
      </div>

      <div className="mb-6">
        <Subheading title={t("recentMatches")} />
        <MatchCompactList
          matches={player.recentMatches}
          backHref={`${BACK_HREF}/${player.id}`}
          emptyLabel={t("noRecentMatches")}
          eventsByMatchId={player.recentMatchEvents}
          goalLabel={(count) => t("goalsScored", { count })}
          assistLabel={(count) => t("assistsMade", { count })}
        />
      </div>

      <div className="mb-6">
        <Subheading title={t("upcomingMatches")} />
        <MatchCompactList
          matches={player.upcomingMatches}
          backHref={`${BACK_HREF}/${player.id}`}
          emptyLabel={t("noUpcomingMatches")}
        />
      </div>

      <div>
        <Subheading title={t("careerTransfers")} />
        {player.transfers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
            {t("noTransfers")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {player.transfers.map((transfer) => (
              <TransferRow key={`${transfer.date}-${transfer.clubTo.id}`} transfer={transfer} freeAgentLabel={t("freeAgent")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
