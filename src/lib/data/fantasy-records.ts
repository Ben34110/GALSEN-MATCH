import { getGameweekInfo } from "@/lib/fantasy-gameweek";
import { getLeaderboard } from "@/lib/data/fantasy-leaderboard";

// "Ever finished rank #1 in a journée's leaderboard" — a permanent record
// (see lib/badges.ts's "top-semaine" badge), so every past journée is
// checked rather than just the current one: a bad week later shouldn't
// revoke it. Only journées strictly before the active one count as final
// (the active journée's ranking is still moving as matches get played), and
// a journée needs at least 2 participants — finishing "#1" alone isn't a
// record. O(activeJournee) leaderboard reads, each already real-time
// scored (see fantasy-leaderboard.ts) — fine at this app's scale; revisit
// with a cap or a stored flag if a season ever runs to many dozens of
// journées.
export async function hasEverRankedFirst(deviceId: string, userId: string | null): Promise<boolean> {
  const { activeJournee } = getGameweekInfo();

  for (let journee = 1; journee < activeJournee; journee++) {
    const entries = await getLeaderboard(journee);
    if (!entries || entries.length < 2) continue;
    const top = entries[0];
    const isMe = userId ? top.userId === userId : top.deviceId === deviceId;
    if (isMe && top.points > 0) return true;
  }

  return false;
}
