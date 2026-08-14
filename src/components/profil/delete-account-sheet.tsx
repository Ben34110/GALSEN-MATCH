"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { deleteAccount } from "@/app/actions/account";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { removeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";
import { FAVORITE_TEAMS_STORAGE_KEY } from "@/lib/favorites";
import { FANTASY_LINEUP_STORAGE_KEY } from "@/lib/fantasy-lineup";
import { DEVICE_ID_KEY } from "@/lib/device-id";

// Opened from delete-account-button.tsx (Profil, signed-in only). A single
// warning screen + one red confirm button — no typed "SUPPRIMER" gate: this
// deletes one person's own football-fan account, not a shared workspace, so
// that extra friction wasn't judged worth the UX cost, same reasoning
// LogoutButton's plain window.confirm() already applies at a lower stakes
// level. What actually happens server-side is explained in
// app/actions/account.ts's own comment (cascading FK deletes, not a
// per-table loop here).
export function DeleteAccountSheet({ onClose }: { onClose: () => void }) {
  const t = useTranslations("profil.deleteAccount");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "deleting" | "error">("idle");

  async function handleConfirm() {
    setStatus("deleting");
    const result = await deleteAccount();
    if (!result.ok) {
      setStatus("error");
      return;
    }

    // Same local wipe as LogoutButton — the account (and every row it
    // owned) is already gone server-side at this point, this just clears
    // what's left on this device so nothing stale re-hydrates on reload.
    const supabase = getSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    removeLocalStorageValue(ONBOARDING_STORAGE_KEY);
    removeLocalStorageValue(FAVORITE_TEAMS_STORAGE_KEY);
    removeLocalStorageValue(FANTASY_LINEUP_STORAGE_KEY);
    removeLocalStorageValue(DEVICE_ID_KEY);
    router.push("/onboarding");
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/40" onClick={status === "deleting" ? undefined : onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="rounded-t-3xl bg-background p-6 pb-[calc(1.5rem+var(--safe-bottom))] shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-foreground">{t("title")}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={status === "deleting"}
            aria-label={t("close")}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:text-foreground disabled:opacity-40"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-accent-3/30 bg-accent-3/5 p-3.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-accent-3" aria-hidden />
          <p className="text-sm leading-relaxed text-foreground">{t("warning")}</p>
        </div>

        <ul className="mb-5 flex flex-col gap-1.5 pl-5 text-sm text-muted [&>li]:list-disc">
          <li>{t("itemProfile")}</li>
          <li>{t("itemChat")}</li>
          <li>{t("itemFantasy")}</li>
          <li>{t("itemScores")}</li>
          <li>{t("itemNotifications")}</li>
        </ul>

        {status === "error" && <p className="mb-3 text-xs leading-relaxed text-accent-3">{t("error")}</p>}

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={status === "deleting"}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent-3 text-base font-bold text-white transition-transform duration-[var(--duration-fast)] active:scale-[0.98] disabled:opacity-60"
          >
            {status === "deleting" ? "…" : t("confirm")}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={status === "deleting"}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground transition-transform duration-[var(--duration-fast)] active:scale-[0.98] disabled:opacity-40"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
