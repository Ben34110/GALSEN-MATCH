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

// A little variety so it doesn't read like a robot filled out a form —
// picks a random title/body template per event so the same person scoring
// twice in one game doesn't get the exact same sentence twice.
function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

const KICKOFF_TEMPLATES = [
  (match: string) => ({ title: "⚽️ C'est parti !", body: `${match} vient de démarrer, installe-toi confortablement.` }),
  (match: string) => ({ title: "🟢 Coup d'envoi !", body: `${match} a commencé, prépare le café.` }),
  (match: string) => ({ title: "🚀 Ça y est !", body: `${match} — le ballon roule enfin.` }),
];

const LINEUP_TEMPLATES = [
  (match: string) => ({ title: "📋 La compo est tombée !", body: `${match} — les 22 acteurs du jour sont connus.` }),
  (match: string) => ({ title: "🚨 Compo dispo !", body: `${match}, va vite checker qui commence.` }),
];

const PLAYER_LINEUP_TEMPLATES = [
  (player: string) => ({ title: "🌟 Titulaire !", body: `${player} commence le match, en pleine confiance.` }),
  (player: string) => ({ title: "✅ Sur la feuille de match !", body: `${player} est titulaire aujourd'hui, à toi de stresser.` }),
];

const CLUB_GOAL_TEMPLATES = [
  (team: string, scorer: string, score: string) => ({ title: "GOAL !! 🔥", body: `${team} vient de marquer${scorer} — ${score}` }),
  (team: string, scorer: string, score: string) => ({
    title: "⚽️💥 But !",
    body: `${team} trouve le chemin des filets${scorer}, score : ${score}`,
  }),
  (team: string, scorer: string, score: string) => ({ title: "🎉 Ça tremble !", body: `${team} fait trembler les filets${scorer} (${score})` }),
];

const PLAYER_GOAL_TEMPLATES = [
  (player: string, score: string) => ({ title: "BUUUUT ! 🎉🔥", body: `${player} vient de marquer ! Score actuel : ${score}` }),
  (player: string, score: string) => ({ title: "⚽️👑 Il l'a fait !", body: `${player} plante son but, score : ${score}` }),
  (player: string, score: string) => ({ title: "🚀 Quel missile !", body: `${player} envoie le ballon au fond — ${score}` }),
];

const ASSIST_TEMPLATES = [
  (player: string) => ({ title: "🎯 Caviar servi !", body: `${player} régale avec une passe décisive.` }),
  (player: string) => ({ title: "✨ Le petit plus !", body: `${player} offre une passe décisive en or.` }),
];

const CARD_TEMPLATES: Record<"yellow" | "red", ((player: string) => { title: string; body: string })[]> = {
  yellow: [
    (player: string) => ({ title: "🟨 Petit avertissement", body: `${player} prend un carton jaune, faut se calmer un peu.` }),
    (player: string) => ({ title: "🟨 Oups", body: `${player} écope d'un jaune, l'arbitre n'a pas rigolé.` }),
  ],
  red: [
    (player: string) => ({ title: "🟥 Douche direct !", body: `${player} voit rouge et rentre aux vestiaires plus tôt que prévu.` }),
    (player: string) => ({ title: "🟥 Aïe aïe aïe", body: `${player} est expulsé — soirée compliquée.` }),
  ],
};

const FULLTIME_TEMPLATES = [
  (match: string, score: string) => ({ title: "🏁 Terminé !", body: `${match} : ${score}. GG à tous.` }),
  (match: string, score: string) => ({ title: "🔚 C'est fini !", body: `${match} se termine sur le score de ${score}.` }),
];

const RATING_TEMPLATES = [
  (player: string, rating: string) => ({ title: "📊 La note tombe", body: `${player} termine avec un ${rating}/10 ce soir.` }),
  (player: string, rating: string) => ({ title: "🧾 Bulletin de note", body: `${player} repart avec un ${rating}/10.` }),
];

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

  // icon: shown as the notification's avatar-style image (player photo or
  // team logo) — see public/sw.js's push handler, which reads payload.icon.
  const pending: { deviceId: string; title: string; body: string; url: string; icon?: string }[] = [];
  function queue(deviceId: string, title: string, body: string, fixtureId: number, icon?: string) {
    pending.push({ deviceId, title, body, url: `/live/match/${fixtureId}`, icon });
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
  function logoFor(fixture: ApiFixture, teamId: number): string | undefined {
    if (fixture.teams.home.id === teamId) return fixture.teams.home.logo;
    if (fixture.teams.away.id === teamId) return fixture.teams.away.logo;
    return undefined;
  }

  // --- Kickoff / lineup / fulltime, for today's fixtures involving a favorited club or player ---
  const clubOrPlayerFixturesToday = todayFixtures.filter((f) => involvesFavoritedClub(f) || involvesFavoritedPlayerTeam(f));
  for (const fixture of clubOrPlayerFixturesToday) {
    const fixtureId = fixture.fixture.id;
    const status = fixture.fixture.status.short;
    const homeId = fixture.teams.home.id;
    const awayId = fixture.teams.away.id;
    const matchLabel = `${fixture.teams.home.name} vs ${fixture.teams.away.name}`;

    for (const teamId of [homeId, awayId]) {
      const clubDevices = clubPrefRows.filter((r) => r.team_id === teamId);
      const teamLogo = logoFor(fixture, teamId);

      if (!NOT_STARTED_STATUSES.has(status)) {
        const lineupKey = `lineup-${teamId}`;
        if (clubDevices.some((d) => d.notify_lineup) && !(await notifiedKey(fixtureId, lineupKey))) {
          const lineupResult = await getFixtureLineups(fixtureId);
          if (!lineupResult.error && lineupResult.data.length > 0) {
            const { title, body } = pick(LINEUP_TEMPLATES)(matchLabel);
            for (const device of clubDevices.filter((d) => d.notify_lineup)) {
              queue(device.device_id, title, body, fixtureId, teamLogo);
            }
            await markKey(fixtureId, lineupKey);

            // Same lineup fetch also answers "is my favorited player starting?" —
            // check it here instead of a second /fixtures/lineups call.
            const teamLineup = lineupResult.data.find((l) => l.team.id === teamId);
            if (teamLineup) {
              for (const slot of teamLineup.startXI) {
                if (!favoritedPlayerMeta.has(slot.player.id)) continue;
                const playerKey = `player-lineup-${slot.player.id}`;
                if (await notifiedKey(fixtureId, playerKey)) continue;
                const player = favoritedPlayerMeta.get(slot.player.id)!;
                const { title: pTitle, body: pBody } = pick(PLAYER_LINEUP_TEMPLATES)(player.name);
                for (const device of playerPrefRows.filter((r) => r.player_id === slot.player.id && r.notify_lineup)) {
                  queue(device.device_id, pTitle, pBody, fixtureId, player.photo);
                }
                await markKey(fixtureId, playerKey);
              }
            }
          }
        }
      }

      if ((STARTED_STATUSES.has(status) || FINISHED_STATUSES.has(status)) && clubDevices.some((d) => d.notify_kickoff)) {
        const kickoffKey = `kickoff-${teamId}`;
        if (!(await notifiedKey(fixtureId, kickoffKey))) {
          const { title, body } = pick(KICKOFF_TEMPLATES)(matchLabel);
          for (const device of clubDevices.filter((d) => d.notify_kickoff)) {
            queue(device.device_id, title, body, fixtureId, teamLogo);
          }
          await markKey(fixtureId, kickoffKey);
        }
      }

      if (FINISHED_STATUSES.has(status) && clubDevices.some((d) => d.notify_fulltime)) {
        const fulltimeKey = `fulltime-${teamId}`;
        if (!(await notifiedKey(fixtureId, fulltimeKey))) {
          const score = `${fixture.goals.home ?? 0}-${fixture.goals.away ?? 0}`;
          const { title, body } = pick(FULLTIME_TEMPLATES)(matchLabel, score);
          for (const device of clubDevices.filter((d) => d.notify_fulltime)) {
            queue(device.device_id, title, body, fixtureId, teamLogo);
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
    const currentScore = `${fixture.goals.home ?? 0}-${fixture.goals.away ?? 0}`;
    const eventsResult = await getFixtureEvents(fixtureId);
    if (eventsResult.error) continue;

    for (const event of eventsResult.data) {
      const elapsedKey = `${event.time.elapsed}-${event.time.extra ?? 0}`;

      if (event.type === "Goal") {
        if (clubTeamIds.has(event.team.id)) {
          const key = `club-goal-${elapsedKey}-${event.team.id}`;
          if (!(await notifiedKey(fixtureId, key))) {
            const scorer = event.player.name ? ` (${event.player.name})` : "";
            const teamLogo = logoFor(fixture, event.team.id);
            const { title, body } = pick(CLUB_GOAL_TEMPLATES)(event.team.name, scorer, currentScore);
            for (const device of clubPrefRows.filter((r) => r.team_id === event.team.id && r.notify_goals)) {
              queue(device.device_id, title, body, fixtureId, teamLogo);
            }
            await markKey(fixtureId, key);
          }
        }
        if (event.player.id && favoritedPlayerMeta.has(event.player.id)) {
          const key = `player-goal-${elapsedKey}-${event.player.id}`;
          if (!(await notifiedKey(fixtureId, key))) {
            const player = favoritedPlayerMeta.get(event.player.id)!;
            const { title, body } = pick(PLAYER_GOAL_TEMPLATES)(player.name, currentScore);
            for (const device of playerPrefRows.filter((r) => r.player_id === event.player.id && r.notify_goal)) {
              queue(device.device_id, title, body, fixtureId, player.photo);
            }
            await markKey(fixtureId, key);
          }
        }
        if (event.assist.id && favoritedPlayerMeta.has(event.assist.id)) {
          const key = `player-assist-${elapsedKey}-${event.assist.id}`;
          if (!(await notifiedKey(fixtureId, key))) {
            const player = favoritedPlayerMeta.get(event.assist.id)!;
            const { title, body } = pick(ASSIST_TEMPLATES)(player.name);
            for (const device of playerPrefRows.filter((r) => r.player_id === event.assist.id && r.notify_assist)) {
              queue(device.device_id, title, body, fixtureId, player.photo);
            }
            await markKey(fixtureId, key);
          }
        }
      }

      if (event.type === "Card" && event.player.id && favoritedPlayerMeta.has(event.player.id)) {
        const key = `player-card-${elapsedKey}-${event.player.id}-${event.detail}`;
        if (!(await notifiedKey(fixtureId, key))) {
          const player = favoritedPlayerMeta.get(event.player.id)!;
          const color = event.detail.toLowerCase().includes("red") ? "red" : "yellow";
          const { title, body } = pick(CARD_TEMPLATES[color])(player.name);
          for (const device of playerPrefRows.filter((r) => r.player_id === event.player.id && r.notify_card)) {
            queue(device.device_id, title, body, fixtureId, player.photo);
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
        const player = favoritedPlayerMeta.get(entry.player.id)!;
        const { title, body } = pick(RATING_TEMPLATES)(player.name, rating);
        for (const device of playerPrefRows.filter((r) => r.player_id === entry.player.id && r.notify_rating)) {
          queue(device.device_id, title, body, fixtureId, player.photo);
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
          JSON.stringify({ title: message.title, body: message.body, url: message.url, icon: message.icon })
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
