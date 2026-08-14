"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, LogOut, Plus, Share2, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getOrCreateDeviceId } from "@/lib/device-id";
import {
  createLeague,
  joinLeague,
  leaveLeague,
  getMyLeagues,
  getLeagueLeaderboard,
  type FriendLeague,
  type LeagueLeaderboardEntry,
} from "@/app/actions/leagues";

const RANK_COLORS = ["text-accent-2", "text-muted", "text-accent-3"];

// The "Ligue" tab of /fantasy/xi/leaderboard (see leaderboard-view.tsx) —
// entirely self-contained: unlike the weekly/monthly modes, creating/
// joining a league needs interactive round-trips that don't fit the
// page's searchParams-driven server rendering, so this manages its own
// state and calls the Server Actions directly instead.
export function FriendLeaguePanel({ journee }: { journee: number }) {
  const t = useTranslations("fantasy");
  const deviceId = getOrCreateDeviceId();

  const [leagues, setLeagues] = useState<FriendLeague[] | null>(null);
  const [selected, setSelected] = useState<FriendLeague | null>(null);
  const [entries, setEntries] = useState<LeagueLeaderboardEntry[] | null | undefined>(undefined);

  const [formMode, setFormMode] = useState<"create" | "join" | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    getMyLeagues(deviceId).then(setLeagues);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deviceId is stable for the component's lifetime
  }, []);

  useEffect(() => {
    // Nothing renders `entries` while `selected` is null (see the two
    // return branches below), so there's nothing to reset in that case —
    // deferred to a microtask either way to avoid a synchronous setState
    // inside the effect body (react-hooks/set-state-in-effect).
    if (!selected) return;
    Promise.resolve().then(() => setEntries(undefined));
    getLeagueLeaderboard(deviceId, selected.id, journee).then(setEntries);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deviceId is stable for the component's lifetime
  }, [selected, journee]);

  async function handleCreate() {
    if (!nameInput.trim() || pending) return;
    setPending(true);
    setError(null);
    const result = await createLeague(deviceId, nameInput.trim());
    setPending(false);
    if (!result.ok) {
      setError(t("leagues.createError"));
      return;
    }
    setLeagues((current) => [...(current ?? []), result.league]);
    setSelected(result.league);
    setFormMode(null);
    setNameInput("");
  }

  async function handleJoin() {
    if (!codeInput.trim() || pending) return;
    setPending(true);
    setError(null);
    const result = await joinLeague(deviceId, codeInput.trim());
    setPending(false);
    if (!result.ok) {
      setError(t(result.reason === "not-found" ? "joinNotFound" : "joinError"));
      return;
    }
    setLeagues((current) => [...(current ?? []).filter((l) => l.id !== result.league.id), result.league]);
    setSelected(result.league);
    setFormMode(null);
    setCodeInput("");
  }

  async function handleLeave(league: FriendLeague) {
    await leaveLeague(deviceId, league.id);
    setLeagues((current) => (current ?? []).filter((l) => l.id !== league.id));
    setSelected(null);
  }

  async function handleShare(league: FriendLeague) {
    const text = t("leagues.shareText", { name: league.name, code: league.code });
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // cancelled — fall through to clipboard as a courtesy, harmless either way
      }
    }
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  // --- A league is selected: show its filtered leaderboard ---
  if (selected) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mb-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft size={16} aria-hidden />
          {t("leagues.backToLeagues")}
        </button>

        <Card className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{selected.name}</p>
            <p className="text-[11px] text-muted">{t("leagues.codeLabel", { code: selected.code })}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => handleShare(selected)}
              aria-label={t("leagues.shareAriaLabel")}
              className="grid size-9 place-items-center rounded-full border border-border bg-surface text-foreground transition-transform active:scale-90"
            >
              <Share2 size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => handleLeave(selected)}
              aria-label={t("leagues.leaveAriaLabel")}
              className="grid size-9 place-items-center rounded-full border border-accent-3/30 bg-accent-3/5 text-accent-3 transition-transform active:scale-90"
            >
              <LogOut size={16} aria-hidden />
            </button>
          </div>
        </Card>

        {entries === undefined ? (
          <p className="py-10 text-center text-sm text-muted">{t("common.loading")}</p>
        ) : entries === null ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">
            {t("common.leaderboardUnavailable")}
          </p>
        ) : entries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">{t("leagues.empty")}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {entries.map((entry, index) => (
              <li key={`${entry.username}-${index}`}>
                <div
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3",
                    entry.isMe ? "border-accent bg-accent/10" : "border-border bg-surface"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center text-sm font-extrabold tabular-nums",
                      index < 3 ? RANK_COLORS[index] : "text-muted"
                    )}
                  >
                    {index < 3 ? <Trophy size={16} aria-hidden /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {entry.username}
                      {entry.isMe && t("common.you")}
                    </span>
                    <span className="block text-[11px] text-muted">{t("leagues.membersPlayers", { filled: entry.filled })}</span>
                  </span>
                  <span className="shrink-0 text-lg font-extrabold tabular-nums text-accent">{entry.points}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  }

  // --- No league selected: list + create/join ---
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setFormMode(formMode === "create" ? null : "create");
            setError(null);
          }}
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors",
            formMode === "create" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-foreground"
          )}
        >
          <Plus size={16} aria-hidden />
          {t("leagues.createButton")}
        </button>
        <button
          type="button"
          onClick={() => {
            setFormMode(formMode === "join" ? null : "join");
            setError(null);
          }}
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors",
            formMode === "join" ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-foreground"
          )}
        >
          <Users size={16} aria-hidden />
          {t("leagues.joinButton")}
        </button>
      </div>

      {formMode === "create" && (
        <Card className="mb-4 flex flex-col gap-2.5">
          <input
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder={t("leagues.namePlaceholder")}
            maxLength={40}
            className="min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
          />
          {error && <p className="text-xs font-semibold text-accent-3">{error}</p>}
          <button
            type="button"
            onClick={handleCreate}
            disabled={!nameInput.trim() || pending}
            className="flex min-h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-bold text-accent-ink transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {t("leagues.createConfirm")}
          </button>
        </Card>
      )}

      {formMode === "join" && (
        <Card className="mb-4 flex flex-col gap-2.5">
          <input
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
            placeholder={t("leagues.codePlaceholder")}
            maxLength={6}
            className="min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-base uppercase tracking-widest text-foreground placeholder:text-muted placeholder:normal-case placeholder:tracking-normal focus:border-accent focus:outline-none"
          />
          {error && <p className="text-xs font-semibold text-accent-3">{error}</p>}
          <button
            type="button"
            onClick={handleJoin}
            disabled={!codeInput.trim() || pending}
            className="flex min-h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-bold text-accent-ink transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {t("leagues.joinConfirm")}
          </button>
        </Card>
      )}

      {leagues === null ? (
        <p className="py-10 text-center text-sm text-muted">{t("common.loading")}</p>
      ) : leagues.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted">{t("leagues.noLeagues")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {leagues.map((league) => (
            <button
              key={league.id}
              type="button"
              onClick={() => setSelected(league)}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition-colors hover:border-accent/40"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <Trophy size={16} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{league.name}</span>
                <span className="block text-[11px] text-muted">{t("leagues.memberCount", { count: league.memberCount })}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
