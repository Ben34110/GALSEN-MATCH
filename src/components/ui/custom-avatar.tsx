import { cn } from "@/lib/utils";
import type { AvatarConfig } from "@/lib/avatar-options";

// Flat-vector face built entirely from SVG primitives (no image assets) —
// each part (face shape, eyes, hair) renders from AvatarConfig. Wrapped in
// the same .gradient-accent ring CountryAvatar uses, so the country-colored
// border comes for free from the existing per-country accent theme
// (components/theme/accent-theme-provider.tsx) with no avatar-specific
// country logic needed here.
function FaceBase({ shape, skinTone }: { shape: AvatarConfig["faceShape"]; skinTone: string }) {
  if (shape === "oval") return <ellipse cx="50" cy="52" rx="29" ry="36" fill={skinTone} />;
  if (shape === "square") return <rect x="17" y="19" width="66" height="66" rx="20" fill={skinTone} />;
  return <circle cx="50" cy="52" r="34" fill={skinTone} />;
}

function Eyes({ style }: { style: AvatarConfig["eyeStyle"] }) {
  const ink = "#2b2320";
  if (style === "almond") {
    return (
      <>
        <ellipse cx="38" cy="49" rx="6" ry="3.2" fill={ink} />
        <ellipse cx="62" cy="49" rx="6" ry="3.2" fill={ink} />
      </>
    );
  }
  if (style === "happy") {
    return (
      <>
        <path d="M32 51q6 -8 12 0" fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M56 51q6 -8 12 0" fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
      </>
    );
  }
  if (style === "sleepy") {
    return (
      <>
        <path d="M32 49q6 4 12 0" fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M56 49q6 4 12 0" fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round" />
      </>
    );
  }
  return (
    <>
      <circle cx="38" cy="49" r="4" fill={ink} />
      <circle cx="62" cy="49" r="4" fill={ink} />
    </>
  );
}

// Drawn *behind* FaceBase (afro puffs out past the face's edges — the
// face shape painted on top is what gives it its rounded silhouette,
// same trick as a full moon behind a smaller circle).
function HairBack({ style, color }: { style: AvatarConfig["hairStyle"]; color: string }) {
  if (style !== "afro") return null;
  return <circle cx="50" cy="40" r="42" fill={color} />;
}

function HairFront({ style, color, shape }: { style: AvatarConfig["hairStyle"]; color: string; shape: AvatarConfig["faceShape"] }) {
  if (style === "bald" || style === "afro") return null;

  if (style === "curly") {
    const cx = shape === "square" ? [24, 36, 50, 64, 76] : [22, 34, 50, 66, 78];
    return (
      <>
        {cx.map((x, i) => (
          <circle key={i} cx={x} cy={i % 2 === 0 ? 24 : 19} r="10" fill={color} />
        ))}
      </>
    );
  }

  if (style === "locs") {
    return (
      <>
        <path d="M16 30q34 -26 68 0v10q-34 -22 -68 0z" fill={color} />
        {[20, 30, 40, 60, 70, 80].map((x, i) => (
          <rect key={i} x={x - 3} y="22" width="6" height="26" rx="3" fill={color} />
        ))}
      </>
    );
  }

  if (style === "bun") {
    return (
      <>
        <path d="M16 32q34 -28 68 0v6q-34 -20 -68 0z" fill={color} />
        <circle cx="50" cy="12" r="9" fill={color} />
      </>
    );
  }

  // short
  return <path d="M15 34q35 -30 70 0v8q-35 -22 -70 0z" fill={color} />;
}

export function CustomAvatar({ config, size = 14 }: { config: AvatarConfig; size?: 10 | 14 | 20 }) {
  const outer = size === 20 ? "size-20 p-[3px]" : size === 14 ? "size-14 p-[3px]" : "size-10 p-[2px]";

  return (
    <span className={cn("gradient-accent inline-grid shrink-0 place-items-center rounded-full", outer)}>
      <span className="grid size-full place-items-center overflow-hidden rounded-full bg-surface">
        <svg viewBox="0 0 100 100" className="size-full">
          <HairBack style={config.hairStyle} color={config.hairColor} />
          <FaceBase shape={config.faceShape} skinTone={config.skinTone} />
          <Eyes style={config.eyeStyle} />
          <path d="M40 62q10 8 20 0" fill="none" stroke="#2b2320" strokeWidth="2.6" strokeLinecap="round" />
          <HairFront style={config.hairStyle} color={config.hairColor} shape={config.faceShape} />
        </svg>
      </span>
    </span>
  );
}
