import { NextResponse } from "next/server";
import webpush from "web-push";
import { syncAllNewsSources } from "@/lib/news/rss-sync";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getAfricanNation } from "@/lib/data/african-nations";

// Called every ~30 minutes by an external scheduler (cron-job.org / GitHub
// Actions — see docs/notifications.md's "External scheduler" section for
// the same setup pattern), protected by CRON_SECRET so it can't be
// triggered by anyone else.
export const dynamic = "force-dynamic";

function countryLabel(country: string): string {
  if (country === "general") return "Actu Afrique";
  return getAfricanNation(country)?.label ?? country;
}

interface CountryBatch {
  titles: string[];
  // First article in the batch that actually has one (some sources, or a
  // Cloudflare-blocked CDN caught by rss-sync's reachability check, come
  // through with none) — shown as the notification's expandable cover
  // image (the `image` field the Notification API defines for exactly
  // this: on iOS 16.4+ and Android, it's what appears when you press and
  // hold / expand the notification, not the small icon).
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
    .select("device_id, country")
    .in("country", Array.from(insertedByCountry.keys()));
  if (!prefs || prefs.length === 0) return 0;

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("device_id, endpoint, p256dh, auth")
    .in(
      "device_id",
      prefs.map((p) => p.device_id)
    );
  const subsByDevice = new Map((subs ?? []).map((s) => [s.device_id, s]));

  let sent = 0;
  const staleDeviceIds = new Set<string>();
  await Promise.allSettled(
    prefs.map(async (pref) => {
      const sub = subsByDevice.get(pref.device_id);
      const batch = insertedByCountry.get(pref.country);
      if (!sub || !batch || batch.titles.length === 0) return;

      // iOS/Safari always renders web push notifications as [bold title] /
      // "from <manifest app name>" / [body] — that "from" line is native
      // Safari chrome tied to the manifest name and isn't something the
      // payload can remove or replace. What IS ours to control is the bold
      // title, so it's the app's own name ("Galsen Match") rather than a
      // country name — which used to leave "from Galsen Match" as the only
      // place the app's identity showed up at all, with "Sénégal" reading
      // as if it were the sender. The country now lives in the body instead.
      const articleSummary = batch.titles.length === 1 ? batch.titles[0] : `${batch.titles.length} nouveaux articles disponibles`;
      const body = `📰 ${countryLabel(pref.country)} · ${articleSummary}`;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: "Galsen Match",
            body,
            url: `/actu?country=${pref.country}`,
            image: batch.imageUrl ?? undefined,
          })
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) staleDeviceIds.add(pref.device_id);
      }
    })
  );

  if (staleDeviceIds.size > 0) {
    await supabase.from("push_subscriptions").delete().in("device_id", Array.from(staleDeviceIds));
  }

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
