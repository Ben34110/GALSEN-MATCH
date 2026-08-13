import { NextResponse } from "next/server";
import webpush from "web-push";
import { syncAllNewsSources } from "@/lib/news/rss-sync";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAfricanNation } from "@/lib/data/african-nations";
import { dispatchToTarget } from "@/lib/push-dispatch";

// Called every ~30 minutes by an external scheduler (cron-job.org / GitHub
// Actions — see docs/notifications.md's "External scheduler" section for
// the same setup pattern), protected by CRON_SECRET so it can't be
// triggered by anyone else.
export const dynamic = "force-dynamic";
// 14 sources synced concurrently (see rss-sync.ts's syncAllNewsSources) can
// still take longer than a typical serverless default (10s) in the worst
// case — a slow RSS host or a burst of new articles needing translation.
// 60s is Vercel's Hobby-plan ceiling; raise it if the account is ever on a
// higher plan and this route still times out.
export const maxDuration = 60;

function countryLabel(country: string): string {
  if (country === "general") return "Actu Afrique";
  return getAfricanNation(country)?.label ?? country;
}

interface CountryBatch {
  titles: string[];
  // First article in the batch that actually has one (some sources, or a
  // Cloudflare-blocked CDN caught by rss-sync's reachability check, come
  // through with none) — shown as the notification's expandable cover
  // image via the Notification API's `image` field. Android/desktop
  // Chrome only: iOS Safari's push implementation doesn't actually honor
  // `image` at all (confirmed: https://github.com/mdn/browser-compat-data/issues/19318),
  // no workaround exists there today. Sent regardless since it's free and
  // works everywhere else.
  imageUrl: string | null;
}

// Sends one push per (country, device) — not one per article — so five new
// Sénégal articles in the same sync produce a single "5 nouveaux articles"
// notification instead of spamming five. Same web-push/stale-subscription-
// cleanup pattern as api/cron/poll/route.ts.
async function notifySubscribers(insertedByCountry: Map<string, CountryBatch>): Promise<number> {
  if (insertedByCountry.size === 0) return 0;

  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate || !vapidSubject) return 0;
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const { data: prefs } = await supabase
    .from("news_notification_prefs")
    .select("device_id, user_id, country")
    .in("country", Array.from(insertedByCountry.keys()));
  if (!prefs || prefs.length === 0) return 0;

  // Correlated by user_id when present (a signed-in account's pref and push
  // subscription rows may have been last written from different devices —
  // see poll/route.ts's targetKey for the same reasoning), device_id
  // otherwise. Fetches every subscription rather than filtering by the
  // prefs' device_ids up front, since that list can no longer stand in for
  // the full set of relevant identities once user_id exists too.
  const targetKey = (row: { device_id: string; user_id: string | null }) => row.user_id ?? row.device_id;
  const [{ data: subs }, { data: apnsRows }] = await Promise.all([
    supabase.from("push_subscriptions").select("device_id, user_id, endpoint, p256dh, auth"),
    supabase.from("apns_tokens").select("device_id, user_id, token"),
  ]);
  const subsByTarget = new Map((subs ?? []).map((s) => [targetKey(s), s]));
  const apnsByTarget = new Map((apnsRows ?? []).map((r) => [targetKey(r), r.token]));

  let sent = 0;
  const staleWebTargets = new Set<string>();
  const staleApnsTargets = new Set<string>();
  await Promise.allSettled(
    prefs.map(async (pref) => {
      const sub = subsByTarget.get(targetKey(pref));
      const apnsToken = apnsByTarget.get(targetKey(pref));
      const batch = insertedByCountry.get(pref.country);
      if ((!sub && !apnsToken) || !batch || batch.titles.length === 0) return;

      // iOS/Safari always renders web push notifications as [bold title] /
      // "from <manifest app name>" / [body] — that "from" line is native
      // Safari chrome tied to the manifest name and isn't something the
      // payload can remove or replace. What IS ours to control is the bold
      // title, so it's the app's own name ("AfroLive") rather than a
      // country name — which used to leave "from AfroLive" as the only
      // place the app's identity showed up at all, with "Sénégal" reading
      // as if it were the sender. The country now lives in the body instead.
      const articleSummary = batch.titles.length === 1 ? batch.titles[0] : `${batch.titles.length} nouveaux articles disponibles`;
      const body = `📰 ${countryLabel(pref.country)} · ${articleSummary}`;
      const result = await dispatchToTarget(sub, apnsToken, {
        title: "AfroLive",
        body,
        url: `/actu?country=${pref.country}`,
        image: batch.imageUrl ?? undefined,
      });
      if (result.sent) sent += 1;
      if (result.staleWebPush) staleWebTargets.add(targetKey(pref));
      if (result.staleApns) staleApnsTargets.add(targetKey(pref));
    })
  );

  async function pruneStaleTargets(table: "push_subscriptions" | "apns_tokens", targets: Set<string>, byTarget: Map<string, { user_id: string | null }>) {
    if (targets.size === 0) return;
    const staleDeviceIds = Array.from(targets).filter((target) => byTarget.get(target)?.user_id === null);
    const staleUserIds = Array.from(targets).filter((target) => byTarget.get(target)?.user_id !== null);
    if (staleDeviceIds.length > 0) await supabase!.from(table).delete().in("device_id", staleDeviceIds);
    if (staleUserIds.length > 0) await supabase!.from(table).delete().in("user_id", staleUserIds);
  }
  await Promise.all([
    pruneStaleTargets("push_subscriptions", staleWebTargets, subsByTarget),
    pruneStaleTargets("apns_tokens", staleApnsTargets, new Map((apnsRows ?? []).map((r) => [targetKey(r), r]))),
  ]);

  return sent;
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await syncAllNewsSources();
  const fetched = results.reduce((sum, r) => sum + r.fetched, 0);
  const inserted = results.reduce((sum, r) => sum + r.inserted, 0);

  const insertedByCountry = new Map<string, CountryBatch>();
  for (const result of results) {
    for (const article of result.insertedArticles) {
      const batch = insertedByCountry.get(article.country) ?? { titles: [], imageUrl: null };
      batch.titles.push(article.title);
      if (!batch.imageUrl && article.imageUrl) batch.imageUrl = article.imageUrl;
      insertedByCountry.set(article.country, batch);
    }
  }
  const notified = await notifySubscribers(insertedByCountry);

  return NextResponse.json({ ok: true, fetched, inserted, notified, sources: results });
}
