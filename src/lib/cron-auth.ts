import { timingSafeEqual } from "node:crypto";

// Shared by both cron routes (api/cron/poll, api/cron/fetch-news). A plain
// `auth !== expected` string comparison short-circuits on the first
// mismatched byte, which leaks (in principle — these routes are hit every
// 1-2 minutes, plenty of samples) how many leading characters of
// CRON_SECRET a guess got right. timingSafeEqual takes the same time
// regardless of where the strings first differ.
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const authBytes = Buffer.from(auth);
  const expectedBytes = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch instead of returning false —
  // guard it explicitly. Comparing against a fixed-length buffer here would
  // still leak length via early return, but not a real weakness: the
  // secret's length isn't the thing being protected, its contents are.
  if (authBytes.length !== expectedBytes.length) return false;

  return timingSafeEqual(authBytes, expectedBytes);
}
