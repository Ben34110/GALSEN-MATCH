"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, BellOff, Globe2, Search } from "lucide-react";
import { cn, normalizeForSearch } from "@/lib/utils";
import { AFRICAN_NATIONS } from "@/lib/data/african-nations";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { ensurePushSubscription } from "@/hooks/use-push-subscription";
import {
  deleteNewsNotificationPref,
  getNewsNotificationCountries,
  saveNewsNotificationPref,
} from "@/app/actions/notifications";

interface CountryOption {
  id: string;
  label: string;
  logo: string | null;
}

const GENERAL_OPTION: CountryOption = { id: "general", label: "Actu Afrique (panafricain)", logo: null };
const ALL_OPTIONS: CountryOption[] = [GENERAL_OPTION, ...AFRICAN_NATIONS.map((n) => ({ id: n.id, label: n.label, logo: n.logo }))];

// "donne la possibilité de mettre par exemple actus du sénégal en
// notification" — one on/off toggle per country (no sub-options like club/
// player notifications have), delivered by api/cron/fetch-news/route.ts
// right after a sync inserts new rows for that country. Mirrors the
// search-gated country grid used in onboarding/preferences-editor: with 54
// possible entries, only currently-subscribed countries show by default,
// the full grid appears once the user starts typing.
export function NewsNotificationsSection() {
  const [search, setSearch] = useState("");
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    getNewsNotificationCountries(deviceId).then((countries) => setSubscribed(new Set(countries)));
  }, []);

  const visibleOptions = useMemo(() => {
    const query = normalizeForSearch(search.trim());
    if (!query) return ALL_OPTIONS.filter((option) => subscribed.has(option.id));
    return ALL_OPTIONS.filter((option) => normalizeForSearch(option.label).includes(query));
  }, [search, subscribed]);

  async function toggle(countryId: string) {
    if (pendingId) return;
    setPendingId(countryId);
    setFailedId(null);
    const deviceId = getOrCreateDeviceId();
    const active = subscribed.has(countryId);

    if (active) {
      await deleteNewsNotificationPref(deviceId, countryId);
      setSubscribed((current) => {
        const next = new Set(current);
        next.delete(countryId);
        return next;
      });
    } else {
      // ensurePushSubscription()'s result must gate the save — skipping this
      // check previously saved a news_notification_prefs row (and showed
      // "Activé") even when no push subscription actually got created (no
      // permission granted, no service worker in dev, etc.), leaving a
      // preference with nothing in push_subscriptions to match it at send
      // time — the toggle looked successful but nothing was ever delivered.
      const granted = await ensurePushSubscription();
      if (!granted) {
        setFailedId(countryId);
        setPendingId(null);
        return;
      }
      await saveNewsNotificationPref(deviceId, countryId);
      setSubscribed((current) => new Set(current).add(countryId));
    }
    setPendingId(null);
  }

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        <Bell size={13} aria-hidden />
        Notifications actu
      </h2>
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Reçois une notification dès qu&apos;un nouvel article sort pour les pays que tu choisis.
      </p>

      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Chercher un pays à suivre…"
          className={cn(
            "min-h-11 w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-base text-foreground",
            "placeholder:text-muted focus:border-accent focus:outline-none"
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {visibleOptions.map((option) => {
          const active = subscribed.has(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              disabled={pendingId === option.id}
              aria-pressed={active}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl border p-2.5 text-left",
                "transition-[transform,border-color,background-color] duration-[var(--duration-fast)] active:scale-95",
                active ? "border-accent bg-accent/10" : "border-border bg-surface hover:border-accent/30",
                pendingId === option.id && "opacity-60"
              )}
            >
              {option.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- small fixed-domain crest, not worth the Image pipeline
                <img src={option.logo} alt="" className="size-5 shrink-0 object-contain" />
              ) : (
                <Globe2 size={18} className="shrink-0 text-muted" aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">{option.label}</span>
              {active ? (
                <Bell size={15} className="shrink-0 text-accent" aria-hidden />
              ) : (
                <BellOff size={15} className="shrink-0 text-muted" aria-hidden />
              )}
            </button>
          );
        })}
        {visibleOptions.length === 0 && search.trim() && (
          <p className="col-span-2 py-2 text-center text-xs text-muted">Aucun pays trouvé.</p>
        )}
        {visibleOptions.length === 0 && !search.trim() && (
          <p className="col-span-2 py-2 text-center text-xs text-muted">
            Aucune notification activée pour l&apos;instant — cherche un pays ci-dessus.
          </p>
        )}
      </div>

      {failedId && (
        <p className="mt-2.5 text-xs leading-relaxed text-accent-3">
          Impossible d&apos;activer les notifications — vérifie que tu as autorisé les notifications pour Galsen Match
          dans les réglages de ton téléphone/navigateur, puis réessaie.
        </p>
      )}
    </section>
  );
}
