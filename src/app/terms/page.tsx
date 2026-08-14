import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Conditions d’utilisation",
};

const CONTACT_EMAIL = "bpriorediouf@gmail.com";
const UPDATED_AT = "13 août 2026";

export default function TermsPage() {
  return (
    <LegalPageShell title="Conditions d’utilisation" updatedAt={UPDATED_AT}>
      <p>
        En utilisant AfroLive («&nbsp;l’application&nbsp;»), vous acceptez les conditions ci-dessous. Si vous n’êtes
        pas d’accord, merci de ne pas utiliser l’application.
      </p>

      <section>
        <h2>1. Le service</h2>
        <p>
          AfroLive est une application indépendante d’actualité et de statistiques dédiée au football africain&nbsp;:
          scores en direct, actualités, jeu Fantasy XI, chat communautaire, quiz, prédictions Ballon d’Or et suivi
          du mercato. L’application est fournie «&nbsp;en l’état&nbsp;», à titre gratuit.
        </p>
      </section>

      <section>
        <h2>2. Absence d’affiliation officielle</h2>
        <p>
          AfroLive n’est affiliée, sponsorisée ni approuvée par la FIFA, la CAF, aucune fédération, ligue ou club
          mentionné dans l’application. Les mentions de classements ou compétitions officielles (par exemple le
          «&nbsp;Classement FIFA&nbsp;») sont purement descriptives et informatives.
        </p>
        <p>
          Les données sportives, logos de clubs et photos de joueurs affichés proviennent d’un fournisseur de
          données tiers (API-Football/API-Sports)&nbsp;; les droits sur ces visuels appartiennent à leurs
          détenteurs respectifs (fédérations, clubs, ligues) et non à AfroLive. AfroLive ne revendique aucun droit
          de propriété sur ce contenu.
        </p>
        <p>
          Les articles de l’onglet Actu sont des résumés d’actualités tierces, chacun crédité et associé à un lien
          vers l’article original&nbsp;; AfroLive n’en est pas l’auteur.
        </p>
      </section>

      <section>
        <h2>3. Votre profil et votre compte</h2>
        <p>
          Un profil peut être créé sans compte (voir la Politique de confidentialité). Si vous créez un compte,
          vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis
          votre compte.
        </p>
      </section>

      <section>
        <h2>4. Contenu que vous publiez</h2>
        <p>
          En utilisant le chat, les prédictions ou tout autre espace où vous saisissez du texte, vous vous engagez
          à ne publier aucun contenu illégal, injurieux, discriminatoire, harcelant ou portant atteinte aux droits
          d’un tiers. AfroLive se réserve le droit de supprimer tout contenu contraire à ces règles et, en cas
          d’abus répété, de restreindre l’accès à ces fonctionnalités pour l’appareil ou le compte concerné.
        </p>
      </section>

      <section>
        <h2>5. Disponibilité et exactitude</h2>
        <p>
          Les scores, statistiques et actualités affichés proviennent de services tiers et sont fournis à titre
          informatif&nbsp;; AfroLive ne garantit pas leur exactitude, exhaustivité ou disponibilité en temps réel,
          et ne peut être tenue responsable d’une décision prise sur la base de ces informations (par exemple un
          pari ou un pronostic). Le service peut être interrompu ou modifié à tout moment, notamment en cas
          d’indisponibilité d’un fournisseur tiers.
        </p>
      </section>

      <section>
        <h2>6. Limitation de responsabilité</h2>
        <p>
          Dans la mesure permise par la loi applicable, AfroLive est fournie sans garantie d’aucune sorte et ne
          saurait être tenue responsable des dommages indirects résultant de l’utilisation ou de l’impossibilité
          d’utiliser l’application.
        </p>
      </section>

      <section>
        <h2>7. Résiliation</h2>
        <p>
          Vous pouvez cesser d’utiliser l’application à tout moment et demander la suppression de vos données (voir
          la Politique de confidentialité). Nous pouvons suspendre l’accès d’un appareil ou d’un compte en cas de
          non-respect de ces conditions.
        </p>
      </section>

      <section>
        <h2>8. Contact</h2>
        <p>
          Pour toute question sur ces conditions&nbsp;: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section>
        <h2>9. Modifications</h2>
        <p>
          Ces conditions peuvent évoluer&nbsp;; la poursuite de l’utilisation de l’application après une mise à
          jour vaut acceptation de la nouvelle version.
        </p>
      </section>
    </LegalPageShell>
  );
}
