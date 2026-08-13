# App iOS (Capacitor) — mode "remote URL"

L'app iOS n'est pas une réécriture : c'est une coquille native (Capacitor)
qui charge `https://galsen-match.vercel.app` dans une WebView, exactement
comme le fait déjà la PWA. Aucun changement côté serveur — Next.js, Vercel,
Supabase, et les deux jobs cron-job.org (`/api/cron/poll`,
`/api/cron/fetch-news`) restent identiques, quel que soit le client qui
appelle l'app.

## Déjà fait (dans ce repo)

- `@capacitor/core`, `@capacitor/ios`, `@capacitor/cli` installés.
- `capacitor.config.ts` — `appId: "com.afrolive.app"`, pointe vers l'URL
  Vercel en prod. **Change `appId` si tu veux un autre identifiant avant de
  l'enregistrer chez Apple** (impossible à changer facilement après coup).
- `ios/` — projet Xcode généré (`npx cap add ios`), synchronisé
  (`npx cap sync ios`). Committé dans git (voir `.gitignore` pour ce qui
  est exclu — seulement les artefacts de build locaux).
- Scripts npm : `npm run ios:sync` (après tout changement à
  `capacitor.config.ts`), `npm run ios:open` (ouvre Xcode).

## ⚠️ Limite connue : les notifications push ne marcheront pas telles quelles

Le système actuel (compos, buts, rappels de deadline Fantasy...) utilise le
**Web Push standard** (VAPID, `web-push` npm, Service Worker). Ça marche en
PWA parce qu'iOS 16.4+ autorise le Web Push pour une PWA ajoutée à l'écran
d'accueil **via Safari** — mais Apple n'expose PAS cette même API à une
WKWebView intégrée dans une app tierce (ce que fait Capacitor). Concrètement :
dans l'app Capacitor, `Notification.requestPermission()` /
`pushManager.subscribe()` ne fonctionneront simplement pas.

Pour de vraies notifications dans l'app native, il faut en plus :
1. Un certificat/clé Apple Push (APNs) — se génère dans le compte Apple
   Developer.
2. Le plugin `@capacitor/push-notifications` côté app.
3. Côté serveur : envoyer via APNs (pas seulement `web-push`) quand la
   cible est l'app native plutôt qu'un abonnement navigateur — un vrai
   ajout de code, pas juste de la config.

**Pas fait dans ce tour** — à traiter séparément si tu veux les push dans le
test d'une semaine. Sans ça, l'app fonctionne normalement, juste sans
notifications.

## Prérequis à faire toi-même

1. **Xcode complet** (pas seulement les Command Line Tools, déjà présentes) —
   App Store → "Xcode" → Obtenir. ~15 Go, prévoir du temps.
2. **Compte Apple Developer Program** (99 $/an) si pas déjà fait —
   [developer.apple.com](https://developer.apple.com) → Enroll. Nécessaire
   pour signer l'app et publier sur TestFlight (un compte Apple gratuit
   suffit seulement pour tester sur ton propre appareil via Xcode, pas pour
   TestFlight).

## Étapes une fois Xcode installé

1. `npm run ios:open` — ouvre `ios/App/App.xcworkspace` dans Xcode.
2. Dans Xcode, sélectionne le projet **App** → onglet **Signing &
   Capabilities** :
   - Team : ton compte Apple Developer.
   - Bundle Identifier : doit correspondre à `appId` dans
     `capacitor.config.ts` (`com.afrolive.app`), ou modifie les deux pour
     qu'ils correspondent.
3. **Test rapide sur simulateur** : sélectionne un simulateur iPhone en
   haut, ▶️ Run. L'app doit s'ouvrir et charger `/actu` en direct.
4. **Test sur ton iPhone** : connecte-le en USB, sélectionne-le comme
   destination, ▶️ Run (la première fois, il faudra faire confiance au
   développeur dans Réglages → Général → VPN et gestion des appareils sur
   l'iPhone).
5. **Icône et écran de lancement** : Capacitor a copié une icône par
   défaut. Remplace-la via Xcode → `App/Assets.xcassets/AppIcon` (utilise
   `public/icon-512.png`, idéalement en 1024×1024 pour l'App Store — à
   générer si besoin).

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

## Après le test : soumission App Store définitive

Apple peut recaler une app qui ressemble trop à "un simple site web dans
une WebView" (règle 4.2, minimum functionality). Avant la soumission
finale (pas nécessaire pour TestFlight), prévoir d'ajouter des touches
natives : push APNs (voir plus haut), et éventuellement des retours
haptiques (`@capacitor/haptics`) sur les interactions clés (verrouillage
d'équipe Fantasy, etc.).
