-- Galsen Match — notifications schema.
--
-- No user accounts are required to use this app — every browser/device
-- generates a stable random id (see lib/device-id.ts), and by default all
-- data (push subscription, favorites, fantasy squad, chat, etc.) is scoped
-- to that device_id, guest-style. Real accounts (email/password or Google,
-- see lib/auth.ts + the "user_id" migration near the end of this file) are
-- optional, additive, and coexist with guest devices — signing in doesn't
-- require or replace the device_id model. Run this once against a fresh
-- Supabase project (SQL Editor -> paste -> Run); safe to re-run any time
-- something new is added, every statement here is idempotent.

create extension if not exists "pgcrypto";

-- One row per subscribed browser/device. A device can have at most one
-- active subscription (re-subscribing replaces it via upsert on device_id)
-- — device_id is the one identity key that matters here. `endpoint` is
-- deliberately NOT unique: the browser's push service (e.g. Apple's
-- web.push.apple.com) can hand back the very same endpoint for a device
-- that generated a fresh device_id — reinstalling the PWA or clearing site
-- data resets lib/device-id.ts's random id, but doesn't necessarily change
-- what the OS push service considers "this subscription". A unique
-- constraint on endpoint made that legitimate case fail outright: upserting
-- on device_id would try to INSERT a new row (no conflict on device_id, a
-- brand new id), which then hit "duplicate key value violates unique
-- constraint push_subscriptions_endpoint_key" because some OTHER device_id
-- already owned that endpoint — silently breaking every notification type
-- for that device from that point on (confirmed live: reproduced this
-- exact 23505 error by re-inserting a real endpoint under a new device_id).
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- Migration for a project created before this was caught — see the comment
-- above for why the constraint shouldn't exist at all.
alter table push_subscriptions drop constraint if exists push_subscriptions_endpoint_key;

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

-- Added after the table's first release — `create table if not exists`
-- above is a no-op once the table already exists, so these columns need
-- their own explicit, idempotent migration to reach an existing project.
-- The language the source actually publishes `title`/`summary` in ("fr" or
-- "en"). title_translated/summary_translated hold a machine translation
-- into whichever of the two `language` ISN'T, computed once at sync time
-- (see lib/news/rss-sync.ts's translateArticle) — the Actu page picks
-- whichever pair matches the reader's locale (lib/news/localize.ts),
-- falling back to the original if a translation call ever fails.
alter table news add column if not exists language text not null default 'fr';
alter table news add column if not exists title_translated text;
alter table news add column if not exists summary_translated text;

create index if not exists news_country_idx on news (country);
create index if not exists news_published_at_idx on news (published_at desc);

-- One row per device per country the device wants a push notification for
-- when a new article lands (see app/actions/notifications.ts's
-- save/deleteNewsNotificationPref and api/cron/fetch-news/route.ts, which
-- sends after every sync). `country` is either an id from
-- lib/data/african-nations.ts or "general" — same values news.country
-- uses, so a lookup is a plain equality match. Deleting the row is how
-- turning a country's notifications off works, same model as
-- favorite_club_notifications above.
create table if not exists news_notification_prefs (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  country text not null,
  created_at timestamptz not null default now(),
  unique (device_id, country)
);

create index if not exists news_notification_prefs_country_idx on news_notification_prefs (country);

-- Best score per device per quiz theme (src/lib/data/quiz-questions.ts's
-- QUIZ_THEMES ids, e.g. "senegal", "can"). The questions themselves live in
-- a bundled static JSON file, not here — fixed content that never changes
-- from a user action, same reasoning as african-players.json, and a 60s
-- timed sprint can't afford a network round-trip per question. Only the
-- *result* of playing (best_score) is real user-generated data, so only
-- that goes to Supabase — written by the client only when it already knows
-- locally that a run beat its previous best, no server-side compare needed.
create table if not exists quiz_scores (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  theme text not null,
  username text not null,
  best_score integer not null,
  updated_at timestamptz not null default now(),
  unique (device_id, theme)
);

create index if not exists quiz_scores_theme_idx on quiz_scores (theme);

-- One row per device, holding its current Ballon d'Or Africain top-10
-- prediction (ranked, index 0 = predicted winner). True 1-row-per-device
-- (device_id itself is unique, not a composite key like fantasy_squads'
-- device_id+journée) — there's exactly one live prediction at a time,
-- always overwritable. Never read back to hydrate the UI: local storage is
-- the source of truth for what a device sees, same reason fantasy_squads
-- is never read back into the pitch builder — there's no server-side
-- device identity to query by on first load, only device_id itself, which
-- the client already has.
create table if not exists ballon_dor_predictions (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  username text not null,
  rankings jsonb not null,
  updated_at timestamptz not null default now()
);

-- One row per player, always their latest known transfer — upserted by
-- scripts/sync-mercato.mjs every 3 days via a GitHub Actions schedule (see
-- that script for details). Recency window + result cap are applied at read
-- time (lib/data/mercato.ts), not here, so a row simply ages out of the
-- feed on its own once no longer recent, no cleanup job needed.
create table if not exists mercato_transfers (
  id uuid primary key default gen_random_uuid(),
  player_id integer not null unique,
  player_name text not null,
  player_photo text not null,
  nationality text not null,
  transfer_date date not null,
  type text,
  club_from jsonb,
  club_to jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists mercato_transfers_date_idx on mercato_transfers (transfer_date desc);

-- One row per chat message. room_id = ChatRoom.id (lowercase ISO code or
-- "general" — see lib/mock/chat.ts; rooms stay a static/derived list, no
-- chat_rooms table needed since nothing about a room is user-editable).
-- author_name/country_id are a snapshot at send time (same denormalization
-- as fantasy_squads/quiz_scores/ballon_dor_predictions' username column) —
-- lets the message list render a flag next to every sender without a
-- profile lookup per message. device_id lets a click on a message resolve
-- back to that sender's user_profiles row. Capped at 100 most recent rows
-- per room_id, pruned in TypeScript right after each insert (see
-- app/actions/chat.ts) — not a trigger, no stored procedures exist
-- anywhere in this schema.
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  device_id text not null,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_room_created_idx on chat_messages (room_id, created_at desc);

-- Added after chat_messages' first release — nullable (not backfillable
-- for any pre-existing rows) so older messages simply render without a
-- flag rather than breaking.
alter table chat_messages add column if not exists country_id text;

-- One row per device — a server-side mirror of the onboarding profile that
-- otherwise only lives in localStorage (see lib/onboarding.ts's own "point
-- de bascule" comment). Unlike ballon_dor_predictions, this table IS read
-- back for devices other than the caller's own: clicking a chat message
-- needs to show *that* device's profile.
create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  username text not null,
  country_id text not null,
  player_ids jsonb not null default '[]'::jsonb,
  favorite_club_id integer,
  tiktok_handle text,
  updated_at timestamptz not null default now()
);

-- Optional real accounts (email/password or Google via Supabase Auth — see
-- lib/auth.ts, lib/supabase-server.ts, lib/supabase-browser.ts). Additive,
-- not a migration: device_id is untouched and keeps working exactly as
-- before for guests. Every device-scoped table gets a nullable user_id
-- alongside its device_id — a Server Action sets one or the other
-- depending on whether a session exists when it's called (see
-- app/actions/*.ts), never both. The partial unique indexes (`where
-- user_id is not null`) mirror each table's existing device_id constraint,
-- just for the signed-in side. app/actions/link-device-data.ts is what
-- moves a guest's existing rows onto their new account's user_id after
-- they sign up, so signing in doesn't look like losing everything.
alter table push_subscriptions add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists push_subscriptions_user_idx on push_subscriptions (user_id) where user_id is not null;

alter table favorite_club_notifications add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists favorite_club_notifications_user_team_idx on favorite_club_notifications (user_id, team_id) where user_id is not null;

alter table favorite_player_notifications add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists favorite_player_notifications_user_player_idx on favorite_player_notifications (user_id, player_id) where user_id is not null;

alter table fantasy_squads add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists fantasy_squads_user_journee_idx on fantasy_squads (user_id, journee) where user_id is not null;

alter table news_notification_prefs add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists news_notification_prefs_user_country_idx on news_notification_prefs (user_id, country) where user_id is not null;

alter table quiz_scores add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists quiz_scores_user_theme_idx on quiz_scores (user_id, theme) where user_id is not null;

alter table ballon_dor_predictions add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists ballon_dor_predictions_user_idx on ballon_dor_predictions (user_id) where user_id is not null;

alter table chat_messages add column if not exists user_id uuid references auth.users(id) on delete cascade;
create index if not exists chat_messages_user_idx on chat_messages (user_id);

alter table user_profiles add column if not exists user_id uuid references auth.users(id) on delete cascade;
create unique index if not exists user_profiles_user_idx on user_profiles (user_id) where user_id is not null;

-- No RLS policies: every read/write goes through server-only code using the
-- service_role key (see lib/supabase.ts) — the anon key is never used to
-- touch app data (only Supabase Auth's own endpoints, for accounts above),
-- so there's no client-side data access path to lock down.
alter table push_subscriptions enable row level security;
alter table favorite_club_notifications enable row level security;
alter table favorite_player_notifications enable row level security;
alter table notified_events enable row level security;
alter table fantasy_squads enable row level security;
alter table news enable row level security;
alter table news_notification_prefs enable row level security;
alter table quiz_scores enable row level security;
alter table ballon_dor_predictions enable row level security;
alter table mercato_transfers enable row level security;
alter table chat_messages enable row level security;
alter table user_profiles enable row level security;
