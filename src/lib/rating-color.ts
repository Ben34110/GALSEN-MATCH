// Color stops for a post-match rating badge (see pitch-view.tsx) — a
// 4-point piecewise gradient rather than a simple 0/10 lerp, so 5 (an
// average game) reads as a clear, deliberate orange rather than a
// muddy red-green midpoint, and 7 (a good game) already reads as green
// instead of only the very top of the scale doing so.
const STOPS: { rating: number; rgb: [number, number, number] }[] = [
  { rating: 0, rgb: [127, 29, 29] }, // dark red
  { rating: 5, rgb: [217, 119, 6] }, // orange
  { rating: 7, rgb: [101, 163, 13] }, // light green
  { rating: 10, rgb: [20, 83, 45] }, // dark green
];

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function ratingColor(rating: number): string {
  const clamped = Math.max(0, Math.min(10, rating));
  let lower = STOPS[0];
  let upper = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (clamped >= STOPS[i].rating && clamped <= STOPS[i + 1].rating) {
      lower = STOPS[i];
      upper = STOPS[i + 1];
      break;
    }
  }
  const span = upper.rating - lower.rating;
  const t = span === 0 ? 0 : (clamped - lower.rating) / span;
  const [r, g, b] = [
    lerp(lower.rgb[0], upper.rgb[0], t),
    lerp(lower.rgb[1], upper.rgb[1], t),
    lerp(lower.rgb[2], upper.rgb[2], t),
  ];
  return `rgb(${r}, ${g}, ${b})`;
}
