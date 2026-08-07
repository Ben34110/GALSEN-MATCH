import { ActuPageClient } from "@/components/actu/actu-page-client";
import { getArticles } from "@/lib/data/news";

// Always read the news table fresh. ISR (a timed revalidate) sounded like a
// good match for the cron's 30-minute cadence, but Next's stale-while-
// revalidate means the page freezes at whatever existed at build/deploy
// time and needs up to two requests spanning the revalidate window before
// a visitor actually sees new rows — confusing right after first deploying
// this feature, when the very first build ran before the `news` table even
// had data. A live Supabase read per request is a non-issue at this app's
// traffic, and it's what every other Supabase-backed read in this app
// already does (see fantasy-leaderboard.ts).
export const dynamic = "force-dynamic";

export default async function ActuPage() {
  const articles = await getArticles();
  return <ActuPageClient articles={articles} />;
}
