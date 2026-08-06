# Notifications — setup

Real push notifications (lineup announced, goals, kickoff/fulltime, cards, end-of-match ratings) for favorited clubs and players. Three things need to exist before this works end to end: a Supabase project, the VAPID/cron env vars in Vercel, and an external scheduler hitting the poll endpoint every 1–2 minutes.

## 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the SQL Editor, paste the contents of `supabase/schema.sql`, run it. This creates 4 tables (`push_subscriptions`, `favorite_club_notifications`, `favorite_player_notifications`, `notified_events`) — no auth, no RLS policies needed, every access goes through server code using the service role key.
3. From Settings → API, copy the **Project URL** and the **`service_role`** secret key (not the `anon` key — the service role key is what bypasses RLS from server code).

## 2. Environment variables

Already generated locally in `.env.local` (gitignored, never pushed) — copy these same values into your Vercel project's Settings → Environment Variables (Production + Preview), then add the two Supabase values from step 1:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<from .env.local>
VAPID_PRIVATE_KEY=<from .env.local>
VAPID_SUBJECT=<from .env.local>
CRON_SECRET=<from .env.local>
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<your Supabase service_role key>
```

Redeploy after saving — env var changes don't apply to an already-built deployment.

## 3. External scheduler

Vercel Cron on the free Hobby plan only runs once a day, far too rare for "notify me when a goal happens." Instead, use a free external scheduler to call the poll endpoint every 1–2 minutes:

**Option A — cron-job.org (simplest):**
1. Create a free account at [cron-job.org](https://cron-job.org).
2. New cron job:
   - URL: `https://<your-app>.vercel.app/api/cron/poll`
   - Schedule: every 1–2 minutes
   - Request method: GET
   - Custom header: `Authorization: Bearer <CRON_SECRET>` (same value as the env var above)
3. Save and enable it.

**Option B — GitHub Actions**, if you'd rather keep it in the repo: a workflow on a `schedule: cron` trigger calling the same URL with `curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"`. GitHub Actions' scheduled minimum interval is 5 minutes, less "live" than option A but keeps everything in one place.

## How it works

`GET /api/cron/poll` (see `src/app/api/cron/poll/route.ts`), on every call:

1. Loads every device's favorite-club/player notification preferences and push subscriptions from Supabase.
2. Fetches **today's fixtures globally** (one API call) to catch kickoff/lineup-announced/fulltime for favorited clubs, and **all live fixtures globally** (one API call) to catch goals/assists/cards for favorited clubs and players — regardless of how many users have favorited how many things, this stays at 2 base API calls plus one `/fixtures/lineups` or `/fixtures/events` call per *relevant* fixture only.
3. Dedups via the `notified_events` table (one row per fixture+event ever sent) so re-scanning the same in-progress match on the next poll cycle never re-sends the same notification.
4. Sends real Web Push notifications via `web-push`, using each device's stored subscription. A subscription the push service reports as gone (410/404 — e.g. the user uninstalled the PWA) gets cleaned up automatically.

Tapping a notification opens the app at `/live/match/<fixtureId>`, which now also renders the announced lineup (see `src/components/live/match-lineups.tsx`).

### Tone and images

Copy is casual on purpose (several random variants per event, see the `*_TEMPLATES` arrays at the top of `route.ts`) — e.g. a goal notification might read "GOAL !! 🔥 Bayern München vient de marquer (H. Kane) — 2-1" one time and "🎉 Ça tremble ! Bayern München fait trembler les filets (H. Kane) (2-1)" the next. Goal notifications always include the current score. Each notification's icon is the specific player's photo (for player-scoped events: goal/assist/card/rating/starting-lineup) or the scoring/relevant club's crest (for club-scoped events: kickoff/lineup/fulltime/goal) — not the generic app icon.

## Testing

The service worker (`public/sw.js`) only registers in production builds (see `components/pwa/service-worker-register.tsx`) to avoid fighting Next's dev-mode hot reload — so the actual "grant permission → subscribe → receive a push" flow can only be tested on a deployed build, not `next dev`. Once deployed with the above configured: favorite a club with notifications on, wait for its next live match, and the poll endpoint should pick up kickoff/goals/fulltime automatically.
