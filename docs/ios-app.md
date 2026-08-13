# App iOS (Capacitor) — mode "remote URL"

L'app iOS n'est pas une réécriture : c'est une coquille native (Capacitor)
qui charge `https://galsen-match.vercel.app` dans une WebView, exactement
comme le fait déjà la PWA. Aucun changement côté serveur pour le reste de
l'app — Next.js, Vercel, Supabase, et les deux jobs cron-job.org
(`/api/cron/poll`, `/api/cron/fetch-news`) restent identiques, quel que
soit le client qui appelle l'app. Les notifications push sont la seule
vraie exception (voir plus bas) : elles avaient besoin d'un chemin séparé.

## Déjà fait (dans ce repo)

- `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli`,
  `@capacitor/status-bar`, `@capacitor/splash-screen`,
  `@capacitor/push-notifications` installés.
- `capacitor.config.ts` — `appId: "com.afrolive.app"`, pointe vers l'URL
  Vercel en prod, splash screen contrôlé manuellement (pas de timer fixe).
  **Change `appId` si tu veux un autre identifiant avant de l'enregistrer
  chez Apple** (impossible à changer facilement après coup).
- `ios/` — projet Xcode généré et synchronisé. Icône et écran de lancement
  déjà à l'identité AfroLive (générés depuis `public/icon-maskable-512.png`
  et `public/logo-mark.png`). Committé dans git (voir `.gitignore` pour ce
  qui est exclu — seulement les artefacts de build locaux).
- `src/app/layout.tsx` — balises meta complètes (Open Graph, Twitter card,
  `apple-mobile-web-app-*`, `robots`) + `public/og-image.png` généré pour
  l'aperçu de partage.
- `components/pwa/native-bridge.tsx` — tourne uniquement à l'intérieur de
  l'app Capacitor (no-op dans un navigateur/la PWA) : masque l'écran de
  lancement une fois l'UI montée, configure la barre de statut, demande la
  permission notifications et enregistre le token APNs, gère le tap sur
  une notification pour naviguer vers la bonne page.
- **Notifications push natives (APNs)** — la vraie partie "reconfigurer" :
  - `apns_tokens` (nouvelle table, voir `supabase/schema.sql` — **à
    re-exécuter dans Supabase** pour que la table existe réellement).
  - `saveApnsToken` (`app/actions/notifications.ts`) — enregistre le token
    envoyé par `native-bridge.tsx`.
  - `lib/apns.ts` — génère le JWT APNs (ES256) et envoie la notification en
    HTTP/2 directement à `api.push.apple.com`, sans dépendance externe.
  - `lib/push-dispatch.ts` — point commun utilisé par `/api/cron/poll` et
    `/api/cron/fetch-news` : envoie sur web-push **et/ou** APNs selon ce que
    l'appareil ciblé a d'enregistré, et nettoie automatiquement les tokens
    devenus invalides (désinstallation, etc.), exactement comme c'était déjà
    fait pour les abonnements web-push.
  - `AppDelegate.swift` — le boilerplate Capacitor standard pour relayer le
    résultat de l'enregistrement APNs à `native-bridge.tsx`.

Tout ça est codé et vérifié (`tsc`, `eslint`, build) mais **ne peut pas être
testé de bout en bout sans de vraies clés Apple** — impossible pour moi de
le faire à ta place. Suis les étapes ci-dessous.

## Prérequis à faire toi-même

1. **Xcode complet** (pas seulement les Command Line Tools, déjà présentes) —
   App Store → "Xcode" → Obtenir. ~15 Go, prévoir du temps.
2. **Compte Apple Developer Program** (99 $/an) si pas déjà fait —
   [developer.apple.com](https://developer.apple.com) → Enroll. Nécessaire
   pour signer l'app, publier sur TestFlight, et générer la clé APNs
   ci-dessous (un compte Apple gratuit suffit seulement pour tester sur ton
   propre appareil via Xcode).

## Configurer les vraies notifications push (APNs)

1. **Générer la clé APNs** : [developer.apple.com](https://developer.apple.com)
   → Certificates, Identifiers & Profiles → Keys → **+** → coche "Apple
   Push Notifications service (APNs)" → Continue → Register. Télécharge le
   fichier `.p8` (**une seule fois possible**, garde-le). Note le **Key ID**
   affiché.
2. Note aussi ton **Team ID** (en haut à droite de la page, ou Membership →
   Team ID).
3. Sur Vercel → ton projet → Settings → Environment Variables, ajoute :
   - `APNS_KEY_ID` — le Key ID de l'étape 1.
   - `APNS_TEAM_ID` — ton Team ID.
   - `APNS_TOPIC` — `com.afrolive.app` (le même que `appId` dans
     `capacitor.config.ts`).
   - `APNS_PRIVATE_KEY` — le contenu **complet** du fichier `.p8` (ouvre-le
     avec un éditeur de texte, copie-colle tel quel, en-têtes
     `-----BEGIN PRIVATE KEY-----`/`-----END-----` inclus — le champ Vercel
     accepte le multi-lignes directement).
4. Redéploie (un push sur `main` suffit, ou "Redeploy" dans Vercel) pour
   que les crons voient les nouvelles variables.
5. Dans Xcode, sur le projet **App** → **Signing & Capabilities** → **+
   Capability** → **Push Notifications**. C'est cette étape (GUI Xcode
   uniquement) qui crée le fichier `.entitlements` — pas fait dans ce repo
   pour éviter de modifier `project.pbxproj` à la main sans pouvoir
   vérifier que ça compile.
6. Teste : ouvre l'app sur un vrai appareil (**pas le simulateur** — APNs
   ne fonctionne pas sur simulateur), accepte la permission notifications,
   puis fais arriver un vrai événement (but d'un joueur suivi, etc.) ou
   attends le prochain rappel Fantasy.

## Étapes précises pour ouvrir et lancer le projet dans Xcode

**0. Prérequis, une seule fois** (terminal, nécessite ton mot de passe admin) :
```
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```
Vérifie que ça a marché : `xcodebuild -version` doit afficher un numéro de
version au lieu d'une erreur "requires Xcode".

**1. Connecte ton compte Apple Developer à Xcode** (une seule fois) :
Xcode → menu **Xcode** → **Settings…** (ou Preferences) → onglet
**Accounts** → **+** en bas à gauche → **Apple ID** → connecte-toi avec le
compte inscrit au programme Apple Developer. C'est ce compte qui apparaîtra
ensuite dans le menu déroulant "Team".

**2. Ouvre le projet** :
```
npm run ios:open
```
Ça ouvre `ios/App/App.xcworkspace`. **Important** : toujours ouvrir le
`.xcworkspace`, jamais `App.xcodeproj` directement — ce projet utilise
Swift Package Manager (`CapApp-SPM`), qui ne se résout correctement que via
le workspace.

**3. Configure la signature** : dans le panneau de gauche (le navigateur de
fichiers), clique sur **App** tout en haut (l'icône bleue, pas un dossier)
→ dans le panneau principal, sélectionne la cible **App** → onglet
**Signing & Capabilities** :
- **Team** : choisis ton compte (ajouté à l'étape 1).
- **Bundle Identifier** : déjà réglé sur `com.afrolive.app` (généré depuis
  `capacitor.config.ts`) — rien à changer sauf si tu veux un autre
  identifiant.
- Xcode doit afficher "✓ Signing Certificate: ..." sans erreur rouge. Une
  erreur "no signing certificate" ou "no account" à ce stade veut dire que
  l'étape 1 n'a pas abouti ou que le compte n'est pas encore inscrit au
  programme payant.

**4. Premier lancement, sur simulateur** (le plus rapide pour vérifier que
tout charge) : en haut de la fenêtre Xcode, à côté du bouton ▶️, le menu
déroulant de destination — choisis un simulateur (ex. "iPhone 16"). Appuie
sur ▶️ (ou `Cmd+R`). Le simulateur démarre, l'app s'ouvre et doit charger
`/actu` avec de vraies données. Les notifications push ne fonctionnent pas
sur simulateur (limitation Apple) — tout le reste oui.

**5. Test sur ton iPhone réel** : connecte-le en USB (ou Wi-Fi si déjà
configuré). Il apparaît dans le même menu déroulant de destination —
sélectionne-le, ▶️. La toute première fois, iOS refuse de lancer l'app tant
que tu n'as pas explicitement fait confiance au développeur : sur
l'iPhone, **Réglages → Général → VPN et gestion de l'appareil** → sous
"App développeur", tape sur ton compte → **Faire confiance**. Relance
ensuite depuis Xcode.

**6. Ce qu'il faut vérifier une fois l'app ouverte** : navigation entre les
onglets, une fiche joueur ou club (données API-Football en direct), et
que rien n'affiche d'erreur réseau — tout doit se comporter exactement
comme la version web.

## Distribuer pour le test d'une semaine (TestFlight)

1. Dans App Store Connect ([appstoreconnect.apple.com](https://appstoreconnect.apple.com)),
   crée une nouvelle app avec le même Bundle ID.
2. Dans Xcode : Product → Archive (uniquement possible avec un vrai
   appareil ou "Any iOS Device" sélectionné, pas un simulateur).
3. Une fois l'archive prête, Xcode propose "Distribute App" → App Store
   Connect → Upload.
4. Dans App Store Connect → ton app → **TestFlight**, le build apparaît
   après quelques minutes (traitement Apple). Ajoute-toi comme testeur
   interne (jusqu'à 100 testeurs internes sans review Apple) ou crée un
   groupe de testeurs externes (nécessite une review Apple, ~24-48h la
   première fois).
5. Les testeurs installent l'app **TestFlight** (App Store) puis ton app
   via le lien d'invitation — vraie app installée sur l'écran d'accueil,
   conditions réelles.

## Limite restante : les images dans les notifications

Le champ `icon`/`image` envoyé dans le payload de notification n'est
actuellement affiché que côté web-push (Android/desktop Chrome — iOS
Safari ne l'affiche déjà pas non plus). Pour qu'une image s'affiche sur une
notification native iOS, il faut une **Notification Service Extension**
(une deuxième cible Xcode qui télécharge l'image avant l'affichage) — pas
fait ici, se rajoute plus tard sans toucher au reste si besoin.

## Après le test : soumission App Store définitive

Apple peut recaler une app qui ressemble trop à "un simple site web dans
une WebView" (règle 4.2, minimum functionality) — les notifications
natives déjà en place aident, mais prévoir aussi des retours haptiques
(`@capacitor/haptics`) sur les interactions clés (verrouillage d'équipe
Fantasy, etc.) avant la soumission finale (pas nécessaire pour TestFlight).
