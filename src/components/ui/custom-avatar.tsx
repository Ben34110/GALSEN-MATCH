import { cn } from "@/lib/utils";
import type { AvatarConfig, FaceShape, HairStyle } from "@/lib/avatar-options";

const INK = "#2b2320";

// Per-shape layout so every part (ears, eyebrows, hair) actually keys off
// the real geometry of the selected face shape instead of one hardcoded
// set of coordinates reused everywhere — that mismatch (hair sized for a
// circle, reused as-is under an oval/square face) was reported as hair
// visibly floating off / not following the face. brow/temple half-widths
// are the x-distance from center hair should meet the head at forehead vs
// temple height; hairlineY/topY bound the cap vertically.
interface FaceGeometry {
  cx: number;
  cy: number;
  browHalfWidth: number;
  templeHalfWidth: number;
  hairlineY: number;
  topY: number;
  earY: number;
}

function geometry(shape: FaceShape): FaceGeometry {
  if (shape === "oval") {
    return { cx: 50, cy: 53, browHalfWidth: 25, templeHalfWidth: 27.5, hairlineY: 36, topY: 15, earY: 53 };
  }
  if (shape === "square") {
    return { cx: 50, cy: 52, browHalfWidth: 31, templeHalfWidth: 32, hairlineY: 40, topY: 17, earY: 52 };
  }
  return { cx: 50, cy: 53, browHalfWidth: 29, templeHalfWidth: 32, hairlineY: 38, topY: 19, earY: 53 };
}

function FaceBase({ shape, skinTone }: { shape: FaceShape; skinTone: string }) {
  if (shape === "oval") return <ellipse cx="50" cy="53" rx="27" ry="35" fill={skinTone} />;
  if (shape === "square") return <rect x="18" y="19" width="64" height="64" rx="22" fill={skinTone} />;
  return <circle cx="50" cy="53" r="32" fill={skinTone} />;
}

function Ears({ g, skinTone }: { g: FaceGeometry; skinTone: string }) {
  return (
    <>
      {[-1, 1].map((side) => {
        const x = g.cx + side * g.templeHalfWidth;
        return (
          <g key={side}>
            <ellipse cx={x} cy={g.earY} rx="4.2" ry="6.5" fill={skinTone} />
            <ellipse cx={x + side * 1.2} cy={g.earY} rx="2" ry="3.4" fill="#00000022" />
          </g>
        );
      })}
    </>
  );
}

function Eyebrows({ g, color }: { g: FaceGeometry; color: string }) {
  const cx = g.cx;
  return (
    <>
      <path d={`M${cx - 15} 42q5 -4 11 -2.5`} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <path d={`M${cx + 4} 39.5q6 -1.5 11 2.5`} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </>
  );
}

function Nose({ g }: { g: FaceGeometry }) {
  const cx = g.cx;
  return (
    <path
      d={`M${cx - 1.5} 51q-2 4 -0.5 6.5q1.2 1.6 3.4 0.6`}
      fill="none"
      stroke="#0000002e"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  );
}

function Mouth({ g }: { g: FaceGeometry }) {
  const cx = g.cx;
  return <path d={`M${cx - 10} 61.5q10 9 20 0q-10 5.5 -20 0z`} fill="#8a3b3b" />;
}

function Eyes({ style, cx }: { style: AvatarConfig["eyeStyle"]; cx: number }) {
  if (style === "almond") {
    return (
      <>
        <ellipse cx={cx - 12} cy="48" rx="5.2" ry="3" fill={INK} />
        <ellipse cx={cx + 12} cy="48" rx="5.2" ry="3" fill={INK} />
      </>
    );
  }
  if (style === "happy") {
    return (
      <>
        <path d={`M${cx - 17} 50q5 -7 10 0`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <path d={`M${cx + 7} 50q5 -7 10 0`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </>
    );
  }
  if (style === "sleepy") {
    return (
      <>
        <path d={`M${cx - 17} 48q5 4 10 0`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <path d={`M${cx + 7} 48q5 4 10 0`} fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle cx={cx - 12} cy="48" r="3.6" fill={INK} />
      <circle cx={cx + 12} cy="48" r="3.6" fill={INK} />
    </>
  );
}

// The cap outline every non-afro, non-bald hairstyle is built from (short
// as-is, locs/bun add strands or a top-knot on top of the same base) — a
// single curve shaped to this face's exact brow/temple width and top/
// hairline height, instead of one fixed path reused under every shape.
function capPath(g: FaceGeometry, extraThickness = 0): string {
  const { cx, templeHalfWidth: th, browHalfWidth: bh, hairlineY: hy } = g;
  const topY = g.topY - extraThickness;
  const leftX = cx - th;
  const rightX = cx + th;
  return [
    `M${leftX} ${hy + 6}`,
    `Q${leftX - 2} ${topY + 10} ${cx - bh * 0.5} ${topY}`,
    `Q${cx} ${topY - 3} ${cx + bh * 0.4} ${topY + 1}`,
    `Q${rightX + 2} ${topY + 9} ${rightX} ${hy + 6}`,
    `Q${rightX - 3} ${hy - 4} ${cx + bh * 0.55} ${hy - 6}`,
    `Q${cx} ${hy - 8} ${cx - bh * 0.55} ${hy - 6}`,
    `Q${leftX + 3} ${hy - 4} ${leftX} ${hy + 6}`,
    "Z",
  ].join(" ");
}

// Rendered *behind* FaceBase — an afro puffs out past the face's own
// edges, so the face shape painted on top of it is what actually gives it
// its silhouette (same trick as a full moon behind a smaller circle).
function HairBack({ style, color, g }: { style: HairStyle; color: string; g: FaceGeometry }) {
  if (style !== "afro") return null;
  return <circle cx={g.cx} cy={g.topY + 6} r={g.templeHalfWidth + 10} fill={color} />;
}

function HairFront({ style, color, g }: { style: HairStyle; color: string; g: FaceGeometry }) {
  if (style === "bald" || style === "afro") return null;

  if (style === "curly") {
    const { cx, templeHalfWidth: th, topY } = g;
    const xs = [cx - th * 0.85, cx - th * 0.42, cx, cx + th * 0.42, cx + th * 0.85];
    return (
      <>
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={topY + (i % 2 ? 4 : -1)} r="9.5" fill={color} />
        ))}
      </>
    );
  }

  if (style === "locs") {
    const { cx, templeHalfWidth: th, topY } = g;
    const xs = [cx - th * 0.85, cx - th * 0.55, cx - th * 0.22, cx + th * 0.1, cx + th * 0.42, cx + th * 0.72];
    return (
      <>
        <path d={capPath(g, 2)} fill={color} />
        {xs.map((x, i) => (
          <rect key={i} x={x - 2.9} y={topY + 2} width="5.8" height={34 + (i % 3) * 4} rx="2.9" fill={color} />
        ))}
      </>
    );
  }

  if (style === "bun") {
    return (
      <>
        <path d={capPath(g)} fill={color} />
        <circle cx={g.cx} cy={g.topY - 9} r="8.5" fill={color} />
      </>
    );
  }

  // short
  const { cx, browHalfWidth: bh, topY } = g;
  return (
    <>
      <path d={capPath(g)} fill={color} />
      {[-bh * 0.35, -bh * 0.05, bh * 0.2].map((dx, i) => (
        <path
          key={i}
          d={`M${cx + dx} ${topY + 4}q-1 8 -2 14`}
          fill="none"
          stroke="#00000030"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

export function CustomAvatar({ config, size = 14 }: { config: AvatarConfig; size?: 10 | 14 | 20 }) {
  const outer = size === 20 ? "size-20 p-[3px]" : size === 14 ? "size-14 p-[3px]" : "size-10 p-[2px]";
  const g = geometry(config.faceShape);

  return (
    <span className={cn("gradient-accent inline-grid shrink-0 place-items-center rounded-full", outer)}>
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-surface">
        <svg viewBox="0 0 100 100" className="size-full">
          <HairBack style={config.hairStyle} color={config.hairColor} g={g} />
          <FaceBase shape={config.faceShape} skinTone={config.skinTone} />
          <Ears g={g} skinTone={config.skinTone} />
          <Eyebrows g={g} color={config.hairColor} />
          <Eyes style={config.eyeStyle} cx={g.cx} />
          <Nose g={g} />
          <Mouth g={g} />
          <HairFront style={config.hairStyle} color={config.hairColor} g={g} />
        </svg>
      </span>
    </span>
  );
}
