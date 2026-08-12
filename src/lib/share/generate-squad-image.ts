"use client";

import { FORMATION_SEATS } from "@/lib/fantasy-formation";
import { getAccentTheme, OTHER_COUNTRY_ID } from "@/lib/mock/accent-themes";
import { getAfricanNation, jerseyColorFromHue } from "@/lib/data/african-nations";
import { COUNTRY_LOGOS } from "@/lib/onboarding";
import type { AfricanPlayer } from "@/types";
import type { SeatMap } from "@/lib/fantasy-lineup";

const WIDTH = 900;
const HEIGHT = 1260;
const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

// Fetches the image as a blob and loads it from a same-origin blob: URL,
// rather than setting crossOrigin="anonymous" directly on an <img src=
// remoteUrl>. The direct approach silently produced blank circles in
// practice — the browser had already cached these exact player-photo/
// crest URLs from the ordinary (non-CORS-mode) <Image> tags used
// throughout the rest of the app, and reusing that cache entry for a
// crossOrigin-mode request is inconsistent across browsers. Fetching the
// bytes explicitly and handing the resulting blob: URL to <img> sidesteps
// that entirely — a blob: URL is always same-origin, so the canvas is
// never at risk of being tainted regardless of how the original request
// was cached elsewhere on the page.
async function loadImage(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return null;
  try {
    const response = await fetch(src, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to decode image: ${src}`));
        img.src = objectUrl;
      });
    } finally {
      // Safe to revoke as soon as onload has fired — the pixel data is
      // already owned by the <img> element by then, drawImage doesn't
      // re-read the URL.
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draws `img` cover-fit (and slightly overscaled, same reasoning as
// JerseyAvatar: crest source images have a lot of transparent margin
// baked in, so a small zoom keeps the actual artwork filling the circle)
// inside a circle already set up as the current clip region.
function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number, zoom = 1) {
  const scale = Math.max((r * 2) / img.width, (r * 2) / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

// Drawn in place of a photo that failed to load (network hiccup, ad
// blocker, etc.) — a plain initial on a flat tint reads as "no photo yet"
// instead of the export silently looking broken.
function drawFallbackAvatar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, label: string, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.round(r * 0.9)}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(label.slice(0, 1).toUpperCase(), cx, cy + r * 0.05);
  ctx.textAlign = "left";
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Mirrors components/fantasy/pitch-view.tsx's own pitch markings 1:1 (same
// 300x400 source coordinates, same border/halfway-circle/penalty-box/
// goal-box/spot/arc) so the exported image looks like the actual pitch
// instead of an approximation — scale is uniform (one `s` for both axes)
// specifically so circles stay circular instead of turning into ellipses,
// which is also why the pitch rect passed in must already be a 3:4 box.
function drawPitchMarkings(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const s = w / 300; // === (pitch height) / 400 by construction — see caller
  const px = (vx: number) => x + vx * s;
  const py = (vy: number) => y + vy * s;

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;

  // Outer border.
  ctx.strokeRect(px(6), py(6), 288 * s, 388 * s);

  // Halfway line's center circle — cy=6 means most of it sits above the
  // pitch's own top edge; only clipping (applied by the caller before this
  // runs) crops it down to the same bottom arc the real SVG shows.
  ctx.beginPath();
  ctx.arc(px(150), py(6), 55 * s, 0, Math.PI * 2);
  ctx.stroke();

  // Penalty box, goal box, penalty spot.
  ctx.strokeRect(px(80), py(316), 140 * s, 78 * s);
  ctx.strokeRect(px(115), py(360), 70 * s, 34 * s);
  ctx.beginPath();
  ctx.arc(px(150), py(330), 2.5 * s, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fill();

  // Penalty arc — SVG path "M 115 316 A 40 40 0 0 0 185 316": a circular
  // arc of radius 40 between those two points. Center computed rather than
  // hardcoded so the geometry is self-evidently correct: for a chord with
  // half-length `half` on a circle of radius `r`, the center sits
  // `sqrt(r^2 - half^2)` away from the chord's midpoint, on whichever side
  // makes the *minor* arc bulge away from goal (upward here, smaller y) —
  // i.e. the center is on the opposite (larger-y) side of the chord.
  const [ax, ay, bx, by, r] = [115, 316, 185, 316, 40];
  const mx = (ax + bx) / 2;
  const half = (bx - ax) / 2;
  const cy = ay + Math.sqrt(Math.max(r * r - half * half, 0));
  const startAngle = Math.atan2(ay - cy, ax - mx);
  const endAngle = Math.atan2(by - cy, bx - mx);
  ctx.beginPath();
  ctx.arc(px(mx), py(cy), r * s, startAngle, endAngle, false);
  ctx.stroke();
}

export interface ShareStanding {
  points: number;
  rank: number;
  totalParticipants: number;
}

export interface ShareSquadOptions {
  username: string;
  countryId: string | null;
  journee: number;
  seats: SeatMap;
  captainId: string | null;
  pool: AfricanPlayer[];
  standing: ShareStanding | null;
}

// Hand-drawn on a <canvas> rather than snapshotting the live DOM (no
// html2canvas-style dependency) — full control over layout and no risk of
// capturing loading spinners/partial state, at the cost of duplicating the
// pitch's visual language here by hand (formation percentages from
// fantasy-formation.ts, pitch markings from pitch-view.tsx's own SVG,
// rating colors from rating-color.ts, jersey colors from
// african-nations.ts — same sources the real UI uses, so this stays
// visually consistent with it).
export async function generateSquadShareImage(options: ShareSquadOptions): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready.catch(() => {});
  }

  const filledPlayerIds = Object.values(options.seats).filter((id): id is string => id !== null);
  const filledPlayers = filledPlayerIds
    .map((id) => options.pool.find((p) => String(p.id) === id))
    .filter((p): p is AfricanPlayer => Boolean(p));

  const crestUrl = options.countryId ? COUNTRY_LOGOS[options.countryId] : undefined;
  const [logoImg, crestImg, ...playerImgs] = await Promise.all([
    loadImage("/logo-mark.png"),
    loadImage(crestUrl),
    ...filledPlayers.map((p) => loadImage(p.photo)),
  ]);
  const playerImageById = new Map(filledPlayers.map((p, i) => [p.id, playerImgs[i]]));

  // --- Background ---
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, "#12151b");
  bg.addColorStop(1, "#1b1f28");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // --- Header: app logo + name ---
  if (logoImg) ctx.drawImage(logoImg, 48, 44, 56, 56);
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 32px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText("AfroLive", 116, 72);

  // --- User row: avatar + username + journée ---
  const avatarCx = 76;
  const avatarCy = 178;
  const avatarR = 46;
  const primaryColor = options.countryId
    ? (getAfricanNation(options.countryId) && jerseyColorFromHue(getAfricanNation(options.countryId)!.hues[0])) ||
      getAccentTheme(options.countryId).accent
    : "#9ca3af";

  if (crestImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = "#d9dadd";
    ctx.fill();
    ctx.clip();
    drawCoverImage(ctx, crestImg, avatarCx, avatarCy, avatarR, 1.5);
    ctx.restore();
  } else if (options.countryId === OTHER_COUNTRY_ID) {
    ctx.fillStyle = "#d9dadd";
    ctx.beginPath();
    ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `28px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("🌍", avatarCx, avatarCy);
    ctx.textAlign = "left";
  } else {
    drawFallbackAvatar(ctx, avatarCx, avatarCy, avatarR, options.username || "?", primaryColor);
  }
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText(truncate(options.username, 18), 146, 160);
  ctx.fillStyle = "#9aa0ab";
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText(`Journée ${options.journee}`, 146, 196);

  // --- Points/rank badge, top-right ---
  if (options.standing) {
    const label = `${options.standing.points} pts · #${options.standing.rank}/${options.standing.totalParticipants}`;
    ctx.font = `800 24px ${FONT}`;
    const textWidth = ctx.measureText(label).width;
    const badgeW = textWidth + 44;
    const badgeH = 50;
    const badgeX = WIDTH - 48 - badgeW;
    const badgeY = 140;
    ctx.fillStyle = "rgba(37, 99, 235, 0.18)";
    roundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fill();
    ctx.fillStyle = "#60a5fa";
    ctx.textAlign = "center";
    ctx.fillText(label, badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.textAlign = "left";
  }

  // --- Pitch: forced to a real 3:4 box (same aspect-[3/4] the real pitch
  // view uses) so drawPitchMarkings' uniform scale keeps circles circular,
  // centered in the available width. ---
  const pitchH = 860;
  const pitchW = pitchH * 0.75;
  const pitchX = (WIDTH - pitchW) / 2;
  const pitchY = 250;

  roundedRect(ctx, pitchX, pitchY, pitchW, pitchH, 20);
  ctx.fillStyle = "#278a4d";
  ctx.fill();
  ctx.save();
  roundedRect(ctx, pitchX, pitchY, pitchW, pitchH, 20);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let y = pitchY; y < pitchY + pitchH; y += 84) {
    ctx.fillRect(pitchX, y, pitchW, 42);
  }
  drawPitchMarkings(ctx, pitchX, pitchY, pitchW);
  ctx.restore();

  // --- Players, laid out with the same formation percentages the real pitch view uses ---
  const photoR = 42;
  for (const seat of FORMATION_SEATS) {
    const playerId = options.seats[seat.id];
    if (!playerId) continue;
    const player = filledPlayers.find((p) => String(p.id) === playerId);
    if (!player) continue;

    const cx = pitchX + (seat.leftPercent / 100) * pitchW;
    const cy = pitchY + 70 + (seat.topPercent / 100) * (pitchH - 140);

    const img = playerImageById.get(player.id);
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      drawCoverImage(ctx, img, cx, cy, photoR);
      ctx.restore();
    } else {
      drawFallbackAvatar(ctx, cx, cy, photoR, player.name, "#3a4150");
    }

    const isCaptain = options.captainId === String(player.id);
    ctx.strokeStyle = isCaptain ? "#f5c518" : "rgba(255,255,255,0.85)";
    ctx.lineWidth = isCaptain ? 4 : 3;
    ctx.beginPath();
    ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
    ctx.stroke();

    if (isCaptain) {
      ctx.fillStyle = "#f5c518";
      ctx.beginPath();
      ctx.arc(cx + photoR - 6, cy - photoR + 6, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `800 17px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("C", cx + photoR - 6, cy - photoR + 7);
      ctx.textAlign = "left";
    }

    const label = truncate(player.name, 16);
    ctx.font = `700 14px ${FONT}`;
    const labelWidth = ctx.measureText(label).width + 18;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundedRect(ctx, cx - labelWidth / 2, cy + photoR + 8, labelWidth, 26, 13);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + photoR + 21);
    ctx.textAlign = "left";
  }

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}
