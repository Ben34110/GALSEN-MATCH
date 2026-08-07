import { ActuPageClient } from "@/components/actu/actu-page-client";
import { getArticles } from "@/lib/data/news";

// ISR, matching the cron sync cadence (see api/cron/fetch-news) — a static
// build would otherwise freeze articles at whatever existed at deploy time.
export const revalidate = 1800;

export default async function ActuPage() {
  const articles = await getArticles();
  return <ActuPageClient articles={articles} />;
}
