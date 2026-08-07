-- Galsen Match — notifications schema.
--
-- No user accounts exist in this app (everything else is localStorage-only,
-- device-scoped) — notifications follow the same model: each browser/device
-- generates a stable random id (see lib/device-id.ts), stored alongside its
-- push subscription and per-favorite notification preferences. Run this
-- once against a fresh Supabase project (SQL Editor -> paste -> Run).

create extension if not exists "pgcrypto";

-- One row per subscribed browser/device. A device can have at most one
-- active subscription (re-subscribing replaces it via upsert on device_id).
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Per-device, per-favorited-club notification preferences. A row only
-- exists if the device has favorited that club — deleting the row is how
-- un-favoriting stops its notifications.
create table if not exists favorite_club_notifications (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  team_id integer not null,
  notify_lineup boolean not null default true,
  notify_goals boolean not null default true,
  notify_kickoff boolean not null default true,
  notify_fulltime boolean not null default true,
  created_at timestamptz not null default now(),
  unique (device_id, team_id)
);

-- Same idea, per favorited player.
create table if not exists favorite_player_notifications (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  player_id integer not null,
  notify_lineup boolean not null default true,
  notify_goal boolean not null default true,
  notify_assist boolean not null default true,
  notify_card boolean not null default true,
  notify_rating boolean not null default true,
  created_at timestamptz not null default now(),
  unique (device_id, player_id)
);

-- Dedup log: one row per (fixture, event) ever pushed, so the poller (which
-- runs every 1-2 minutes and re-scans in-progress matches from scratch each
-- time) never sends the same "Teungueth a marqué !" twice. event_key
-- encodes enough to be unique per real event, e.g.:
--   "lineup", "kickoff", "fulltime"
--   "goal-<elapsed>-<teamId>-<playerId>"
--   "card-<elapsed>-<playerId>-<yellow|red>"
--   "rating-<playerId>"
create table if not exists notified_events (
  id uuid primary key default gen_random_uuid(),
  fixture_id integer not null,
  event_key text not null,
  created_at timestamptz not null default now(),
  unique (fixture_id, event_key)
);

create index if not exists notified_events_fixture_idx on notified_events (fixture_id);

-- One row per device per journée — synced up whenever the local squad
-- changes (see app/actions/fantasy-sync.ts), so the leaderboard
-- (app/(app)/fantasy/leaderboard/page.tsx) can rank every device's squad
-- for a given journée. Points aren't stored here — computed at read time
-- from `seats` against the same real player stats Fantasy itself uses, so
-- a leaderboard read never goes stale relative to a stat update.
create table if not exists fantasy_squads (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  journee integer not null,
  username text not null,
  seats jsonb not null,
  captain_id text,
  updated_at timestamptz not null default now(),
  unique (device_id, journee)
);

create index if not exists fantasy_squads_journee_idx on fantasy_squads (journee);

-- Aggregated news articles, pulled from each source's RSS/XML feed by
-- GET /api/cron/fetch-news (see src/lib/news/sources.ts for the source
-- list and src/lib/news/rss-sync.ts for the fetch/parse/upsert logic).
-- `content_url` is the dedup key — the cron endpoint upserts on it with
-- ignoreDuplicates, so re-fetching the same feed every 30 minutes never
-- creates duplicate rows for an article it's already stored.
create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  content_url text not null unique,
  image_url text,
  author text,
  source_name text not null,
  country text not null default 'general',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists news_country_idx on news (country);
create index if not exists news_published_at_idx on news (published_at desc);

-- No RLS policies: every read/write goes through server-only code using the
-- service_role key (see lib/supabase.ts) — the anon key is never used, so
-- there's no client-side access path to lock down.
alter table push_subscriptions enable row level security;
alter table favorite_club_notifications enable row level security;
alter table favorite_player_notifications enable row level security;
alter table notified_events enable row level security;
alter table fantasy_squads enable row level security;
alter table news enable row level security;
