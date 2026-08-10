// Small HSL helpers used to generate the 54-nation accent theme palette
// (lib/mock/accent-themes.ts) from real flag-color hue anchors, using a
// fixed saturation/lightness formula per slot instead of 162 hand-picked
// hex values — keeps the whole set visually consistent (same "muted, not
// neon" style as the original hand-picked Sénégal/Côte d'Ivoire/etc.
// entries) while staying maintainable.
export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Mixes a hex color toward black (negative percent) or white (positive),
// e.g. shadeColor("#21a366", -0.25) for a 25%-darker tone — used for jersey
// details (collar trim, chest badge, see components/ui/jersey-avatar.tsx)
// that should read as "the same color, shaded" instead of an unrelated
// second color competing with it.
export function shadeColor(hex: string, percent: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const target = percent < 0 ? 0 : 255;
  const mix = (channel: number) => Math.round(channel + (target - channel) * Math.abs(percent));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

// Relative luminance (WCAG) to pick a contrast-safe ink color automatically
// instead of hand-choosing white/near-black per palette.
export function pickInkColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const linear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return luminance > 0.42 ? "#1a1a1a" : "#ffffff";
}
