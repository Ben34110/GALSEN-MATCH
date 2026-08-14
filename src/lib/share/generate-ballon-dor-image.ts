"use client";

import { getAccentTheme, OTHER_COUNTRY_ID } from "@/lib/mock/accent-themes";
import { getAfricanNation, jerseyColorFromHue } from "@/lib/data/african-nations";
import { COUNTRY_LOGOS } from "@/lib/onboarding";
import type { AfricanPlayer } from "@/types";

const WIDTH = 900;
const HEIGHT = 1300;
const FONT = "system-ui, -apple-system, 'Segoe UI', sans-serif";

// Same CORS-safe loading approach as generate-squad-image.ts (see that
// file's own comment) — fetch the bytes explicitly and load from a
// same-origin blob: URL instead of crossOrigin="anonymous" on a remote
// <img src>, which is unreliable once the browser has already cached that
// exact URL from an ordinary (non-CORS-mode) <Image> elsewhere in the app.
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

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number, zoom = 1) {
  const scale = Math.max((r * 2) / img.width, (r * 2) / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

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

function drawPlayerCircle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  player: AfricanPlayer,
  cx: number,
  cy: number,
  r: number,
  ringColor: string
) {
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    drawCoverImage(ctx, img, cx, cy, r);
    ctx.restore();
  } else {
    drawFallbackAvatar(ctx, cx, cy, r, player.name, "#3a4150");
  }
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
}

export interface ShareBallonDorOptions {
  username: string;
  countryId: string | null;
  ranking: AfricanPlayer[]; // index 0 = predicted winner, already resolved from ids
}

const PODIUM_COLORS = ["#f5c518", "#c7ccd6", "#cd8a4e"]; // gold, silver, bronze

// Hand-drawn on a <canvas>, same reasoning as generate-squad-image.ts (full
// layout control, no html2canvas-style dependency): a classic 3-block
// podium for the top 3 (rank 1 tallest/center), then a plain numbered list
// for ranks 4-10 below it.
export async function generateBallonDorShareImage(options: ShareBallonDorOptions): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready.catch(() => {});
  }

  const podium = options.ranking.slice(0, 3);
  const rest = options.ranking.slice(3, 10);

  const crestUrl = options.countryId ? COUNTRY_LOGOS[options.countryId] : undefined;
  const [logoImg, crestImg, ...playerImgs] = await Promise.all([
    loadImage("/logo-mark.png"),
    loadImage(crestUrl),
    ...options.ranking.map((p) => loadImage(p.photo)),
  ]);
  const playerImageById = new Map(options.ranking.map((p, i) => [p.id, playerImgs[i]]));

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

  // --- User row: avatar + username ---
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
  ctx.fillStyle = "#f5c518";
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText("🏆 Mon Ballon d'Or africain", 146, 196);

  // --- Podium: 2nd (left) / 1st (center, tallest) / 3rd (right) ---
  const podiumBaseY = 720;
  const blockW = 220;
  const gap = 24;
  const totalW = blockW * 3 + gap * 2;
  const startX = (WIDTH - totalW) / 2;
  // [order index -> podium rank] left-to-right is 2nd, 1st, 3rd; heights
  // follow the same classic proportions.
  const slots = [
    { rank: 2, x: startX, height: 170 },
    { rank: 1, x: startX + blockW + gap, height: 230 },
    { rank: 3, x: startX + (blockW + gap) * 2, height: 130 },
  ];

  for (const slot of slots) {
    const player = podium[slot.rank - 1];
    const blockX = slot.x;
    const blockY = podiumBaseY - slot.height;
    const color = PODIUM_COLORS[slot.rank - 1];
    const photoR = slot.rank === 1 ? 58 : 48;
    const photoCx = blockX + blockW / 2;
    const photoCy = blockY - photoR - 14;

    if (player) drawPlayerCircle(ctx, playerImageById.get(player.id) ?? null, player, photoCx, photoCy, photoR, color);

    // Podium block itself — drawn BEFORE the name label below, not after:
    // the block used to paint over the name (both landed in the same
    // region, block drawn last), which is what made it "barely visible"
    // rather than just low-contrast.
    roundedRect(ctx, blockX, blockY, blockW, slot.height, 14);
    const blockGradient = ctx.createLinearGradient(0, blockY, 0, blockY + slot.height);
    blockGradient.addColorStop(0, color);
    blockGradient.addColorStop(1, "rgba(255,255,255,0.08)");
    ctx.fillStyle = blockGradient;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = slot.rank === 1 ? "#1a1a1a" : "#ffffff";
    ctx.font = `800 48px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(String(slot.rank), blockX + blockW / 2, blockY + slot.height / 2 + 8);
    ctx.textAlign = "left";

    // Player name — bigger, always black (the block's gold/silver/bronze
    // fill is light enough that black reads clearly on all three, see
    // drawPlayerCircle's own ring-color reasoning), and given real
    // breathing room: +40 from the photo's edge instead of +26, so it's
    // clearly separated from both the photo above it and the block's own
    // top edge, not crowded against either.
    if (player) {
      const label = truncate(player.name, 16);
      ctx.font = `800 24px ${FONT}`;
      ctx.fillStyle = "#1a1a1a";
      ctx.textAlign = "center";
      ctx.fillText(label, photoCx, photoCy + photoR + 40);
      ctx.textAlign = "left";
    }
  }

  // --- Ranks 4-10, plain numbered list ---
  const listStartY = podiumBaseY + 60;
  const rowH = 66;
  ctx.font = `600 20px ${FONT}`;
  for (let i = 0; i < rest.length; i++) {
    const player = rest[i];
    const rank = i + 4;
    const rowY = listStartY + i * rowH;
    const rowCx = 48;

    ctx.fillStyle = "#9aa0ab";
    ctx.font = `800 22px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(String(rank), rowCx + 12, rowY + 26);
    ctx.textAlign = "left";

    const img = playerImageById.get(player.id) ?? null;
    drawPlayerCircle(ctx, img, player, rowCx + 74, rowY + 26, 26, "rgba(255,255,255,0.4)");

    ctx.fillStyle = "#ffffff";
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText(truncate(player.name, 28), rowCx + 118, rowY + 26);

    if (i < rest.length - 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rowCx, rowY + rowH - 8);
      ctx.lineTo(WIDTH - 48, rowY + rowH - 8);
      ctx.stroke();
    }
  }

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}
