import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

const CONTACT_EMAIL = "fulgalsen@gmail.com";
const UPDATED_AT = "14 août 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Politique de confidentialité" updatedAt={UPDATED_AT}>
      <p>
        AfroLive («&nbsp;l’application&nbsp;», «&nbsp;nous&nbsp;») est une application éditée à titre indépendant,
        dédiée à l’actualité et aux statistiques du football africain. Cette page décrit, en langage clair, quelles
        données AfroLive traite, pourquoi, et comment les gérer.
      </p>

      <section>
        <h2>1. Aucun compte n’est obligatoire</h2>
        <p>
          AfroLive fonctionne sans inscription&nbsp;: à la première ouverture, l’application génère un identifiant
          aléatoire propre à votre appareil/navigateur (<strong>device_id</strong>), stocké uniquement en local
          (localStorage), et l’utilise pour rattacher vos préférences, votre équipe Fantasy, vos scores de quiz,
          etc. Cet identifiant ne contient aucune information personnelle et n’est pas relié à votre identité
          civile.
        </p>
        <p>
          Créer un compte (email/mot de passe ou Google) est optionnel. Il permet de retrouver vos données sur un
          nouvel appareil. La création de compte et l’authentification sont gérées par notre prestataire technique
          Supabase (voir section 4)&nbsp;; nous ne stockons jamais votre mot de passe en clair.
        </p>
      </section>

      <section>
        <h2>2. Données que nous traitons</h2>
        <ul>
          <li>
            <strong>Identifiant d’appareil et jeton local de sécurité</strong> — l’identifiant lui-même, plus un
            jeton technique stocké dans un cookie inaccessible au JavaScript de la page (cookie «&nbsp;httpOnly&nbsp;»),
            qui sert uniquement à confirmer qu’un appareil est bien celui qui a créé son propre identifiant
            (protection contre l’usurpation d’un profil invité).
          </li>
          <li>
            <strong>Compte (si créé)</strong> — adresse email, mot de passe (géré et chiffré par Supabase Auth) ou,
            en cas de connexion via Google, les informations transmises par Google (nom, email, photo de profil
            selon votre choix).
          </li>
          <li>
            <strong>Profil AfroLive</strong> — pseudo, pays représenté, joueurs favoris, club favori, pseudo TikTok
            (si renseigné).
          </li>
          <li>
            <strong>Contenu que vous créez</strong> — messages envoyés dans le chat (associés à votre pseudo et
            votre drapeau de pays), votre composition Fantasy XI (Starting 6), vos pronostics Ballon d’Or, vos
            scores de quiz, les ligues d’amis que vous créez ou rejoignez.
          </li>
          <li>
            <strong>Notifications</strong> — si vous les activez&nbsp;: un identifiant d’abonnement push
            (navigateur) ou un jeton APNs (application iOS), et vos préférences (club, joueur, pays suivis).
          </li>
          <li>
            <strong>Activité minimale</strong> — la date de votre dernière ouverture de l’application, utilisée
            uniquement pour éviter de vous envoyer une notification de retour si vous êtes déjà actif.
          </li>
        </ul>
        <p>
          Nous ne collectons ni géolocalisation, ni accès à votre caméra/microphone, ni liste de contacts. Aucun
          identifiant publicitaire n’est utilisé et aucun outil d’analyse/traçage tiers (type Google Analytics)
          n’est intégré à l’application.
        </p>
      </section>

      <section>
        <h2>3. Pourquoi nous traitons ces données</h2>
        <p>
          Uniquement pour faire fonctionner les fonctionnalités que vous utilisez&nbsp;: afficher votre équipe
          Fantasy et le classement, afficher le chat et vos messages, retrouver votre profil si vous changez
          d’appareil, vous envoyer les notifications que vous avez explicitement activées, et empêcher qu’un tiers
          usurpe les données d’un profil invité qui n’est pas le sien.
        </p>
      </section>

      <section>
        <h2>4. Prestataires et services tiers</h2>
        <p>AfroLive s’appuie sur les services suivants pour fonctionner&nbsp;:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — hébergement de la base de données et gestion optionnelle des comptes
            (authentification).
          </li>
          <li>
            <strong>Vercel</strong> — hébergement de l’application.
          </li>
          <li>
            <strong>API-Football / API-Sports</strong> — fourniture des données sportives (scores, classements) et
            des visuels (photos de joueurs, logos de clubs).
          </li>
          <li>
            <strong>Sources d’actualité</strong> — les articles affichés dans l’onglet Actu proviennent de flux RSS
            publics de médias sportifs partenaires (wiwsport, GHANAsoccernet, DZfoot, Complete Sports, Brila FM
            Sports, Kawowo Sports, Le Site Info, Actu Cameroun, Journal du Mali, Afrik-Foot, RFI, RMC Sport),
            chacun crédité sur les articles concernés. Aucune donnée personnelle vous concernant ne leur est
            transmise.
          </li>
          <li>
            <strong>MyMemory</strong> — traduction automatique des titres/résumés d’articles&nbsp;; seul le texte
            de l’article est transmis, jamais de donnée vous concernant.
          </li>
          <li>
            <strong>Apple (APNs) / navigateurs (Web Push)</strong> — acheminement technique des notifications.
          </li>
          <li>
            <strong>Google</strong> — uniquement si vous choisissez de vous connecter via «&nbsp;Continuer avec
            Google&nbsp;».
          </li>
        </ul>
        <p>Aucune de ces données n’est vendue à un tiers, à quelque fin que ce soit.</p>
      </section>

      <section>
        <h2>5. Conservation et suppression</h2>
        <p>
          Vos données sont conservées tant que votre profil (invité ou compte) existe. Si vous êtes connecté avec un
          compte, vous pouvez le supprimer vous-même depuis Profil → «&nbsp;Supprimer mon compte&nbsp;»&nbsp;: la
          suppression est immédiate et efface votre compte ainsi que toutes les données qui lui sont rattachées
          (profil, historique de chat, équipe Fantasy, scores, pronostics, abonnements aux notifications). Une
          ligue d’amis que vous avez créée n’est pas supprimée si d’autres membres en font encore partie — seule
          votre appartenance à cette ligue l’est.
        </p>
        <p>
          Pour un profil invité (sans compte), la suppression se fait en effaçant les données du site depuis votre
          navigateur/appareil, ou en nous écrivant à l’adresse indiquée en section 7.
        </p>
      </section>

      <section>
        <h2>6. Vos droits</h2>
        <p>
          Selon votre pays de résidence, vous pouvez disposer d’un droit d’accès, de rectification, de suppression
          ou de portabilité de vos données. Pour exercer l’un de ces droits, contactez-nous à l’adresse ci-dessous.
        </p>
      </section>

      <section>
        <h2>7. Contact</h2>
        <p>
          Pour toute question sur cette politique ou sur vos données&nbsp;:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section>
        <h2>8. Modifications</h2>
        <p>
          Cette politique peut évoluer avec l’application&nbsp;; la date de dernière mise à jour en haut de cette
          page reflète toujours la version en vigueur.
        </p>
      </section>
    </LegalPageShell>
  );
}
