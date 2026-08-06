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
    const id = setInterval(() => setParts(getCountdownParts(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return parts;
}
