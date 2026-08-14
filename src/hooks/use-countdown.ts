"use client";

import { useEffect, useState } from "react";
import { getCountdownParts, type CountdownParts } from "@/lib/countdown";

// Ticks once a second. Deliberately not driven by useSyncExternalStore —
// unlike the localStorage-backed hooks elsewhere, there's no external
// store to subscribe to here, just wall-clock time, so a plain interval is
// the simplest correct approach and avoids any SSR/client mismatch (first
// render always computes from `deadline` fresh on the client).
export function useCountdown(deadline: Date): CountdownParts {
  const [parts, setParts] = useState(() => getCountdownParts(deadline));

  useEffect(() => {
    // Recompute immediately (not just on the next tick) so a deadline that
    // moves — e.g. the quiz's per-wrong-answer time penalty — is reflected
    // right away instead of up to 1s late. Deferred through a resolved
    // promise rather than called synchronously in the effect body — same
    // react-hooks/set-state-in-effect fix used elsewhere in this app (e.g.
    // quiz-session-view.tsx).
    Promise.resolve(deadline).then((value) => setParts(getCountdownParts(value)));
    const id = setInterval(() => setParts(getCountdownParts(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return parts;
}
