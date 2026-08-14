"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { DeleteAccountSheet } from "@/components/profil/delete-account-sheet";

// Nothing to delete for a guest identity (no account exists server-side —
// device_id data is only ever local until an account links it) — self-
// contained on useAuthIdentity() rather than a prop, same pattern as
// ConnectionStatus in profile-identity-card.tsx, so it renders null on its
// own instead of profil-page-content.tsx needing to know when to hide it.
export function DeleteAccountButton() {
  const t = useTranslations("profil.deleteAccount");
  const identity = useAuthIdentity();
  const [open, setOpen] = useState(false);

  if (!identity) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-semibold text-accent-3 transition-colors hover:border-accent-3/30 hover:bg-accent-3/5"
      >
        <Trash2 size={16} aria-hidden />
        {t("button")}
      </button>
      {open && <DeleteAccountSheet onClose={() => setOpen(false)} />}
    </>
  );
}
