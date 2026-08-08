import { AFRICAN_NATIONS } from "@/lib/data/african-nations";
import type { ChatRoom } from "@/types";

// One room per African nation (54), generated from the same source of
// truth as onboarding/theme (lib/data/african-nations.ts) — room id is the
// lowercase ISO code, independent from the onboarding theme id scheme
// (chat has no persisted per-room state, so there's no legacy id to keep
// stable the way accent-themes.ts has to for the 5 original nations).
export const chatRooms: ChatRoom[] = [
  { id: "general", type: "general", name: "Général", flag: "🌍" },
  ...AFRICAN_NATIONS.map(
    (nation): ChatRoom => ({
      id: nation.countryCode.toLowerCase(),
      type: "country",
      countryCode: nation.countryCode,
      name: nation.label,
      flag: nation.flag,
      logo: nation.logo,
    })
  ),
];
