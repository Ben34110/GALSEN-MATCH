"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { generateBallonDorShareImage } from "@/lib/share/generate-ballon-dor-image";
import type { AfricanPlayer } from "@/types";

// Mirrors components/fantasy/share-squad-button.tsx's share/download
// fallback exactly — see that file's own comment for why AbortError from a
// cancelled native share sheet isn't logged as an error.
export function ShareBallonDorButton({
  username,
  countryId,
  ranking,
}: {
  username: string;
  countryId: string | null;
  ranking: AfricanPlayer[];
}) {
  const t = useTranslations("fantasy.ballonDor");
  const [loading, setLoading] = useState(false);

  async function handleShare() {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await generateBallonDorShareImage({ username, countryId, ranking });
      if (!blob) return;

      const fileName = "afrolive-ballon-dor.png";
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t("shareTitle") });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
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
