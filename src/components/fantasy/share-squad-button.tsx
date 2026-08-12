"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { generateSquadShareImage } from "@/lib/share/generate-squad-image";
import { fetchMyLeaderboardStanding } from "@/app/(app)/live/actions";
import { getOrCreateDeviceId } from "@/lib/device-id";
import type { AfricanPlayer } from "@/types";
import type { SeatMap } from "@/lib/fantasy-lineup";

// The share icon in fantasy-view.tsx's header — draws a branded image of
// the squad (see lib/share/generate-squad-image.ts) and hands it to the
// OS share sheet (navigator.share, mobile) or triggers a plain download
// (desktop/unsupported browsers) so it can be posted anywhere, not just
// inside this app.
export function ShareSquadButton({
  username,
  countryId,
  journee,
  seats,
  captainId,
  pool,
}: {
  username: string;
  countryId: string | null;
  journee: number;
  seats: SeatMap;
  captainId: string | null;
  pool: AfricanPlayer[];
}) {
  const t = useTranslations("fantasy.xi");
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (loading) return;
    setLoading(true);
    try {
      const standing = await fetchMyLeaderboardStanding(getOrCreateDeviceId(), journee);
      const blob = await generateSquadShareImage({ username, countryId, journee, seats, captainId, pool, standing });
      if (!blob) return;

      const fileName = `afrolive-journee-${journee}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t("shareTitle", { journee }) });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // A cancelled share sheet rejects with AbortError — that's the user
      // changing their mind, not a failure worth logging.
      if (err instanceof Error && err.name !== "AbortError") console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={loading}
      aria-label={t("shareAriaLabel")}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground transition-transform duration-[var(--duration-fast)] active:scale-90 disabled:opacity-60"
    >
      {loading ? <Loader2 size={20} className="animate-spin" aria-hidden /> : <Share2 size={20} aria-hidden />}
    </button>
  );
}
