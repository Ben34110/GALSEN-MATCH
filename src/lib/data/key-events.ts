export interface KeyEvent {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  // True when the exact date isn't officially confirmed yet — shown with a
  // "date estimée" note instead of presenting it as certain.
  estimated: boolean;
  emoji: string;
}

// Verified via web search (Aug 2026) against CAF/FIFA announcements — dated
// events genuinely aren't all confirmed to the day yet, marked estimated
// where that's the case rather than presenting a guess as fact:
// - CAN 2027 qualifiers group stage: confirmed (CAF official calendar).
// - CAN 2027 itself: confirmed (Kenya/Uganda/Tanzania, CAF announcement).
// - CAF Awards (Ballon d'Or Africain) 2026: venue confirmed (Lagos), exact
//   date not yet announced — "fin d'année 2026" is CAF's own phrasing.
// - World Cup 2030: confirmed (FIFA), centenary openers in South America
//   then the main tournament in Spain/Portugal/Morocco.
// - African Nations League: confirmed to launch in 2029, hosted by
//   Nigeria, "games in September and October, finals in November" — no
//   exact day announced yet.
export const KEY_EVENTS: KeyEvent[] = [
  {
    id: "can-2027-qualifiers",
    title: "Qualifications CAN 2027",
    subtitle: "Phase de groupes, journées 1-4",
    date: new Date(Date.UTC(2026, 8, 21)), // 2026-09-21
    estimated: false,
    emoji: "🎟️",
  },
  {
    id: "caf-awards-2026",
    title: "Ballon d'Or Africain",
    subtitle: "CAF Awards 2026 — Lagos, Nigeria",
    date: new Date(Date.UTC(2026, 11, 15)), // mid-Dec 2026 placeholder — CAF hasn't announced the exact day
    estimated: true,
    emoji: "🏆",
  },
  {
    id: "can-2027",
    title: "CAN 2027",
    subtitle: "Kenya · Ouganda · Tanzanie",
    date: new Date(Date.UTC(2027, 5, 19)), // 2027-06-19
    estimated: false,
    emoji: "⚽️",
  },
  {
    id: "anl-2029",
    title: "Ligue des Nations Africaine",
    subtitle: "1ère édition — Nigeria (phase Ouest)",
    date: new Date(Date.UTC(2029, 8, 1)), // Sept 2029 placeholder — CAF hasn't announced the exact day
    estimated: true,
    emoji: "🌍",
  },
  {
    id: "world-cup-2030",
    title: "Coupe du Monde 2030",
    subtitle: "Espagne · Portugal · Maroc (+ ouverture centenaire)",
    date: new Date(Date.UTC(2030, 5, 8)), // 2030-06-08
    estimated: false,
    emoji: "🌐",
  },
];

export function getUpcomingKeyEvents(now: Date = new Date()): KeyEvent[] {
  return KEY_EVENTS.filter((event) => event.date.getTime() > now.getTime()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}
