"use client";

import { X } from "lucide-react";

// Explains the Starting XI scoring rules — see real-player-scoring.ts's
// comment for why every score is 0 for now (no per-journée rating feed
// wired up yet); this describes the *intended* rules regardless, so
// players know what to expect once real scoring lands.
export function GameRulesSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/40" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] overflow-y-auto rounded-t-3xl bg-background p-6 pb-[calc(1.5rem+var(--safe-bottom))] shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-bold text-foreground">Comment ça marche</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:text-foreground"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-4 text-sm leading-relaxed text-muted">
          <p>
            Le classement du Starting XI se calcule à la fin de chaque journée. La note reçue de l&apos;API pour
            chaque joueur (sur 10) est multipliée par 10 pour donner son score — un joueur noté 7/10 rapporte donc
            70 points.
          </p>
          <p>
            Le score de ton équipe est l&apos;addition des scores de tes 11 joueurs. Ton capitaine reçoit un bonus
            de +0,5 sur sa note — un capitaine noté 7/10 rapporte donc 75 points au lieu de 70. Désigne-le en
            appuyant sur l&apos;étoile à côté d&apos;un joueur pendant que tu composes ton équipe.
          </p>
          <p>
            Si un joueur ne joue pas lors de la journée, il reçoit automatiquement la note de 5/10, soit 50 points.
          </p>
          <p>
            Une fois ton équipe enregistrée, le bouton reste actif pour confirmer qu&apos;elle est bien sauvegardée
            — tu peux la modifier jusqu&apos;au coup d&apos;envoi.
          </p>
          <p>
            Appuie sur un joueur du terrain pour voir son prochain match : date, heure et adversaire.
          </p>
        </div>
      </div>
    </div>
  );
}
