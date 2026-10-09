"use server";

import { searchGlobal, type GlobalSearchResult } from "@/lib/data/global-search";

// The only way the global search sheet (a "use client" component) reaches
// search data — it never imports lib/data/global-search.ts or the static
// generated/*.json directly, so neither the Supabase service-role key nor
// the ~1.3MB player dataset ever reach the browser bundle. Also the one
// place that enforces "search never calls API-Football": this action only
// ever queries Supabase (see global-search.ts), so there is no code path
// from a user keystroke to api-football.ts at all.
export async function searchGlobalAction(query: string): Promise<GlobalSearchResult[]> {
  return searchGlobal(query);
}
