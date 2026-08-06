import { NextResponse } from "next/server";
import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  getAllLiveFixtures,
  getFixtureEvents,
  getFixtureLineups,
  getFixturePlayerStats,
  getFixturesByDate,
  type ApiFixture,
} from "@/lib/api-football";
import { getAfricanPlayers } from "@/lib/data/african-players";

// Called every 1-2 minutes by an external scheduler (cron-job.org / GitHub
// Actions — see docs/notifications.md), protected by CRON_SECRET so it
// can't be triggered by anyone else. Two global API calls per run (today's
// fixtures + all live fixtures) instead of one per favorited team/player —
// this is what keeps quota usage flat regardless of how many users favorite
// things.
export const dynamic = "force-dynamic";

interface ClubPrefRow {
  device_id: string;
  team_id: number;
  notify_lineup: boolean;
  notify_goals: boolean;
  notify_kickoff: boolean;
  notify_fulltime: boolean;
}

interface PlayerPrefRow {
  device_id: string;
  player_id: number;
  notify_lineup: boolean;
  notify_goal: boolean;
  notify_assist: boolean;
  notify_card: boolean;
  notify_rating: boolean;
}

interface SubscriptionRow {
  device_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const STARTED_STATUSES = new Set(["1H", "2H", "HT", "ET", "P", "LIVE", "BT"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);
const NOT_STARTED_STATUSES = new Set(["NS", "TBD"]);

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const [{ data: clubPrefs }, { data: playerPrefs }, { data: subs }] = await Promise.all([
    supabase.from("favorite_club_notifications").select("*"),
    supabase.from("favorite_player_notifications").select("*"),
    supabase.from("push_subscriptions").select("*"),
  ]);

  const clubPrefRows = (clubPrefs ?? []) as ClubPrefRow[];
  const playerPrefRows = (playerPrefs ?? []) as PlayerPrefRow[];
  const subsByDevice = new Map((subs ?? []).map((s) => [s.device_id, s as SubscriptionRow]));

  if (clubPrefRows.length === 0 && playerPrefRows.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: "no favorites with notifications enabled" });
  }

  const clubTeamIds = new Set(clubPrefRows.map((r) => r.team_id));
  const africanPlayers = getAfricanPlayers();
  const favoritedPlayerMeta = new Map(
    playerPrefRows
      .map((r) => r.player_id)
      .filter((id, index, arr) => arr.indexOf(id) === index)
      .map((id) => [id, africanPlayers.find((p) => p.id === id)] as const)
      .filter((entry): entry is [number, NonNullable<(typeof entry)[1]>] => Boolean(entry[1]))
  );
  const favoritedPlayerTeamIds = new Set(
    Array.from(favoritedPlayerMeta.values())
      .map((p) => p.teamId)
      .filter((id): id is number => id !== null)
  );

  const pending: { deviceId: string; title: string; body: string; url: string }[] = [];
  function queue(deviceId: string, title: string, body: string, fixtureId: number) {
    pending.push({ deviceId, title, body, url: `/live/match/${fixtureId}` });
  }

  async function notifiedKey(fixtureId: number, eventKey: string): Promise<boolean> {
    const { data } = await supabase!
      .from("notified_events")
      .select("id")
      .eq("fixture_id", fixtureId)
      .eq("event_key", eventKey)
      .maybeSingle();
    return Boolean(data);
  }

  async function markKey(fixtureId: number, eventKey: string) {
    await supabase!.from("notified_events").insert({ fixture_id: fixtureId, event_key: eventKey });
  }

  const today = new Date().toISOString().slice(0, 10);
  const [todayResult, liveResult] = await Promise.all([getFixturesByDate(today), getAllLiveFixtures()]);
  const todayFixtures = todayResult.error ? [] : todayResult.data;
  const liveFixtures = liveResult.error ? [] : liveResult.data;

  function involvesFavoritedClub(fixture: ApiFixture): boolean {
    return clubTeamIds.has(fixture.teams.home.id) || clubTeamIds.has(fixture.teams.away.id);
  }
  function involvesFavoritedPlayerTeam(fixture: ApiFixture): boolean {
    return favoritedPlayerTeamIds.has(fixture.teams.home.id) || favoritedPlayerTeamIds.has(fixture.teams.away.id);
  }

  // --- Kickoff / lineup / fulltime, for today's fixtures involving a favorited club ---
  const clubFixturesToday = todayFixtures.filter(involvesFavoritedClub);
  for (const fixture of clubFixturesToday) {
    const fixtureId = fixture.fixture.id;
    const status = fixture.fixture.status.short;
    const homeId = fixture.teams.home.id;
    const awayId = fixture.teams.away.id;
    const matchLabel = `${fixture.teams.home.name} vs ${fixture.teams.away.name}`;

    for (const teamId of [homeId, awayId]) {
      if (!clubTeamIds.has(teamId)) continue;
      const devices = clubPrefRows.filter((r) => r.team_id === teamId);

      if (!NOT_STARTED_STATUSES.has(status)) {
        const lineupKey = `lineup-${teamId}`;
        if (!(await notifiedKey(fixtureId, lineupKey))) {
          const lineupResult = await getFixtureLineups(fixtureId);
          if (!lineupResult.error && lineupResult.data.length > 0) {
            for (const device of devices.filter((d) => d.notify_lineup)) {
              queue(device.device_id, "Compo annoncée", `${matchLabel} — la compo est sortie.`, fixtureId);
            }
            await markKey(fixtureId, lineupKey);
          }
        }
      }

      if (STARTED_STATUSES.has(status) || FINISHED_STATUSES.has(status)) {
        const kickoffKey = `kickoff-${teamId}`;
        if (!(await notifiedKey(fixtureId, kickoffKey))) {
          for (const device of devices.filter((d) => d.notify_kickoff)) {
            queue(device.device_id, "Coup d'envoi", `${matchLabel} vient de commencer.`, fixtureId);
          }
          await markKey(fixtureId, kickoffKey);
        }
      }

      if (FINISHED_STATUSES.has(status)) {
        const fulltimeKey = `fulltime-${teamId}`;
        if (!(await notifiedKey(fixtureId, fulltimeKey))) {
          const score = `${fixture.goals.home ?? 0}-${fixture.goals.away ?? 0}`;
          for (const device of devices.filter((d) => d.notify_fulltime)) {
            queue(device.device_id, "Fin du match", `${matchLabel} (${score})`, fixtureId);
          }
          await markKey(fixtureId, fulltimeKey);
        }
      }
    }
  }

  // --- Goals/assists/cards, for every live fixture touching a favorited club or player's team ---
  const relevantLiveFixtures = liveFixtures.filter((f) => involvesFavoritedClub(f) || involvesFavoritedPlayerTeam(f));
  for (const fixture of relevantLiveFixtures) {
    const fixtureId = fixture.fixture.id;
    const eventsResult = await getFixtureEvents(fixtureId);
    if (eventsResult.error) continue;

    for (const event of eventsResult.data) {
      const elapsedKey = `${event.time.elapsed}-${event.time.extra ?? 0}`;

      if (event.type === "Goal") {
        if (clubTeamIds.has(event.team.id)) {
          const key = `club-goal-${elapsedKey}-${event.team.id}`;
          if (!(await notifiedKey(fixtureId, key))) {
            const scorer = event.player.name ? ` (${event.player.name})` : "";
            for (const device of clubPrefRows.filter((r) => r.team_id === event.team.id && r.notify_goals)) {
              queue(device.device_id, "But !", `${event.team.name} marque${scorer}.`, fixtureId);
            }
            await markKey(fixtureId, key);
          }
        }
        if (event.player.id && favoritedPlayerMeta.has(event.player.id)) {
          const key = `player-goal-${elapsedKey}-${event.player.id}`;
          if (!(await notifiedKey(fixtureId, key))) {
            const name = favoritedPlayerMeta.get(event.player.id)!.name;
            for (const device of playerPrefRows.filter((r) => r.player_id === event.player.id && r.notify_goal)) {
              queue(device.device_id, "But !", `${name} vient de marquer.`, fixtureId);
            }
            await markKey(fixtureId, key);
          }
        }
        if (event.assist.id && favoritedPlayerMeta.has(event.assist.id)) {
          const key = `player-assist-${elapsedKey}-${event.assist.id}`;
          if (!(await notifiedKey(fixtureId, key))) {
            const name = favoritedPlayerMeta.get(event.assist.id)!.name;
            for (const device of playerPrefRows.filter((r) => r.player_id === event.assist.id && r.notify_assist)) {
              queue(device.device_id, "Passe décisive !", `${name} vient de délivrer une passe décisive.`, fixtureId);
            }
            await markKey(fixtureId, key);
          }
        }
      }

      if (event.type === "Card" && event.player.id && favoritedPlayerMeta.has(event.player.id)) {
        const key = `player-card-${elapsedKey}-${event.player.id}-${event.detail}`;
        if (!(await notifiedKey(fixtureId, key))) {
          const name = favoritedPlayerMeta.get(event.player.id)!.name;
          const cardLabel = event.detail.toLowerCase().includes("red") ? "carton rouge" : "carton jaune";
          for (const device of playerPrefRows.filter((r) => r.player_id === event.player.id && r.notify_card)) {
            queue(device.device_id, "Carton", `${name} reçoit un ${cardLabel}.`, fixtureId);
          }
          await markKey(fixtureId, key);
        }
      }
    }
  }

  // --- Ratings, for fixtures that finished today and involve a favorited player ---
  const finishedFixturesWithFavoritedPlayers = todayFixtures.filter(
    (f) => FINISHED_STATUSES.has(f.fixture.status.short) && involvesFavoritedPlayerTeam(f)
  );
  for (const fixture of finishedFixturesWithFavoritedPlayers) {
    const fixtureId = fixture.fixture.id;
    const ratingsFetchedKey = "ratings-fetched";
    if (await notifiedKey(fixtureId, ratingsFetchedKey)) continue;

    const statsResult = await getFixturePlayerStats(fixtureId);
    if (statsResult.error) continue;

    for (const teamStats of statsResult.data) {
      for (const entry of teamStats.players) {
        if (!favoritedPlayerMeta.has(entry.player.id)) continue;
        const rating = entry.statistics[0]?.games.rating;
        if (!rating) continue;
        const name = favoritedPlayerMeta.get(entry.player.id)!.name;
        for (const device of playerPrefRows.filter((r) => r.player_id === entry.player.id && r.notify_rating)) {
          queue(device.device_id, "Note de fin de match", `${name} a été noté ${rating}/10.`, fixtureId);
        }
      }
    }
    await markKey(fixtureId, ratingsFetchedKey);
  }

  // --- Send everything, dropping subscriptions the push service reports as gone ---
  let sent = 0;
  const staleDeviceIds = new Set<string>();
  await Promise.allSettled(
    pending.map(async (message) => {
      const sub = subsByDevice.get(message.deviceId);
      if (!sub) return;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: message.title, body: message.body, url: message.url })
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) staleDeviceIds.add(message.deviceId);
      }
    })
  );

  if (staleDeviceIds.size > 0) {
    await supabase.from("push_subscriptions").delete().in("device_id", Array.from(staleDeviceIds));
  }

  return NextResponse.json({ ok: true, sent, queued: pending.length, staleRemoved: staleDeviceIds.size });
}
