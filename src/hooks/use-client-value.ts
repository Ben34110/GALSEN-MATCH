"use client";

import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

// Pour une valeur calculée uniquement disponible côté client (ex. lecture de
// navigator.userAgent) et qui ne change jamais après le montage.
export function useClientValue<T>(compute: () => T, serverValue: T): T {
  return useSyncExternalStore(noSubscribe, compute, () => serverValue);
}
