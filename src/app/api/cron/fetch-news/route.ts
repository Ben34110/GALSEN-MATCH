import { NextResponse } from "next/server";
import { syncAllNewsSources } from "@/lib/news/rss-sync";

// Called every ~30 minutes by an external scheduler (cron-job.org / GitHub
// Actions — see docs/notifications.md's "External scheduler" section for
// the same setup pattern), protected by CRON_SECRET so it can't be
// triggered by anyone else.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await syncAllNewsSources();
  const fetched = results.reduce((sum, r) => sum + r.fetched, 0);
  const inserted = results.reduce((sum, r) => sum + r.inserted, 0);

  return NextResponse.json({ ok: true, fetched, inserted, sources: results });
}
