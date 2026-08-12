"use client";

import { FORMATION_SEATS } from "@/lib/fantasy-formation";
import { ratingColor } from "@/lib/rating-color";
import { getAccentTheme, OTHER_COUNTRY_ID } from "@/lib/mock/accent-themes";
import { getAfricanNation, jerseyColorFromHue } from "@/lib/data/african-nations";
import { COUNTRY_LOGOS } from "@/lib/onboarding";
import { ratingCache, ratingCacheKey } from "@/lib/fantasy-rating-cache";
import type { AfricanPlayer } from "@/types";
import type { SeatMap } from "@/lib/fantasy-lineup";

const WIDTH = 900;
const HEIGHT = 1260;
const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

// crossOrigin="anonymous" is required for a remote image to be readable
// back out of the canvas afterwards (toBlob/toDataURL) instead of throwing
// a "tainted canvas" SecurityError — confirmed by hand that media.api-
// sports.io (player photos, team/country crests) serves
// access-control-allow-origin: * on every image this needs, so this works
// without a proxy. Resolves to null instead of rejecting on failure (a
// missing photo shouldn't block the whole share image).
function loadImage(src: string | undefined): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
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
  const scale = (Math.max((r * 2) / img.width, (r * 2) / img.height)) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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
// fantasy-formation.ts, rating colors from rating-color.ts, jersey colors
// from african-nations.ts — same sources the real UI uses, so this stays
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

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#d9dadd";
  ctx.fill();
  ctx.clip();
  if (crestImg) drawCoverImage(ctx, crestImg, avatarCx, avatarCy, avatarR, 1.5);
  ctx.restore();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
  ctx.stroke();
  if (options.countryId === OTHER_COUNTRY_ID) {
    ctx.font = `28px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText("🌍", avatarCx, avatarCy);
    ctx.textAlign = "left";
  }

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

  // --- Pitch ---
  const pitchX = 56;
  const pitchY = 250;
  const pitchW = WIDTH - 112;
  const pitchH = 860;
  roundedRect(ctx, pitchX, pitchY, pitchW, pitchH, 28);
  ctx.fillStyle = "#278a4d";
  ctx.fill();
  ctx.save();
  roundedRect(ctx, pitchX, pitchY, pitchW, pitchH, 28);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.035)";
  for (let y = pitchY - (pitchY % 84); y < pitchY + pitchH; y += 84) {
    ctx.fillRect(pitchX, y, pitchW, 42);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  roundedRect(ctx, pitchX + 8, pitchY + 8, pitchW - 16, pitchH - 16, 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pitchX + pitchW / 2, pitchY + 34, pitchH * 0.085, 0, Math.PI * 2);
  ctx.stroke();

  // --- Players, laid out with the same formation percentages the real pitch view uses ---
  const photoR = 46;
  for (const seat of FORMATION_SEATS) {
    const playerId = options.seats[seat.id];
    if (!playerId) continue;
    const player = filledPlayers.find((p) => String(p.id) === playerId);
    if (!player) continue;

    const cx = pitchX + (seat.leftPercent / 100) * pitchW;
    const cy = pitchY + 70 + (seat.topPercent / 100) * (pitchH - 140);

    const img = playerImageById.get(player.id);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = "#2a2f3a";
    ctx.fill();
    ctx.clip();
    if (img) drawCoverImage(ctx, img, cx, cy, photoR);
    ctx.restore();

    const isCaptain = options.captainId === String(player.id);
    ctx.strokeStyle = isCaptain ? "#f5c518" : "rgba(255,255,255,0.85)";
    ctx.lineWidth = isCaptain ? 4 : 3;
    ctx.beginPath();
    ctx.arc(cx, cy, photoR, 0, Math.PI * 2);
    ctx.stroke();

    if (isCaptain) {
      ctx.fillStyle = "#f5c518";
      ctx.beginPath();
      ctx.arc(cx + photoR - 8, cy - photoR + 8, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `800 18px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText("C", cx + photoR - 8, cy - photoR + 9);
      ctx.textAlign = "left";
    }

    const rating = ratingCache.get(ratingCacheKey(player.id, options.journee));
    if (rating && (rating.status === "rated" || rating.status === "live") && rating.rating !== null) {
      ctx.fillStyle = ratingColor(rating.rating);
      ctx.beginPath();
      ctx.arc(cx + photoR - 6, cy + photoR - 6, 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 16px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(rating.rating.toFixed(1).replace(".", ","), cx + photoR - 6, cy + photoR - 5);
      ctx.textAlign = "left";
    }

    const label = truncate(player.name, 16);
    ctx.font = `700 15px ${FONT}`;
    const labelWidth = ctx.measureText(label).width + 20;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    roundedRect(ctx, cx - labelWidth / 2, cy + photoR + 10, labelWidth, 28, 14);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + photoR + 24);
    ctx.textAlign = "left";
  }

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}
