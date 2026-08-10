import { cn } from "@/lib/utils";

// Single neutral SVG template, recolored entirely through props — no
// per-team image assets. Same viewBox/size convention as CustomAvatar
// (components/ui/custom-avatar.tsx): a 0 0 100 100 box, `size` mapped to a
// Tailwind size-N class on the wrapping <span>.
//
// Pure <svg>/<circle>/<path>/<clipPath>/<image>/<text> tags only, no web-only
// APIs (no CSS gradients, no <Image> from next/image) — porting to React
// Native only means swapping the element names for react-native-svg's
// PascalCase equivalents (svg->Svg, circle->Circle, path->Path, clipPath->
// ClipPath, image->Image, text->Text) and the geometry/props are unchanged.
export interface JerseyAvatarProps {
  // Jersey body fill.
  primaryColor: string;
  // Collar (V-neck trim) and shoulder stripes.
  secondaryColor: string;
  size?: 10 | 14 | 20 | 28;
  className?: string;
  // Head circle content, tried in this order:
  // 1. flagUrl — a real flag/crest image, cover-cropped into the circle.
  // 2. flagColors — 3 hex values stacked as horizontal bands, for a
  //    stylized flag when no image is available/wanted.
  // 3. countryCode — plain text (e.g. "SN") on a neutral circle.
  // 4. nothing — an empty neutral circle.
  flagUrl?: string;
  flagColors?: [string, string, string];
  countryCode?: string;
}

const SIZE_CLASSES: Record<NonNullable<JerseyAvatarProps["size"]>, string> = {
  10: "size-10",
  14: "size-14",
  20: "size-20",
  28: "size-28",
};

function HeadContent({ flagUrl, flagColors, countryCode }: Pick<JerseyAvatarProps, "flagUrl" | "flagColors" | "countryCode">) {
  if (flagUrl) {
    return <image href={flagUrl} x="17" y="2" width="66" height="66" preserveAspectRatio="xMidYMid slice" clipPath="url(#jersey-avatar-head)" />;
  }
  if (flagColors) {
    const [top, mid, bottom] = flagColors;
    return (
      <g clipPath="url(#jersey-avatar-head)">
        <rect x="17" y="2" width="66" height="22" fill={top} />
        <rect x="17" y="24" width="66" height="22" fill={mid} />
        <rect x="17" y="46" width="66" height="22" fill={bottom} />
      </g>
    );
  }
  return (
    <>
      <circle cx="50" cy="35" r="33" fill="#d9dadd" />
      {countryCode && (
        <text x="50" y="41" textAnchor="middle" fontSize="18" fontWeight="700" fill="#6b6f76">
          {countryCode}
        </text>
      )}
    </>
  );
}

export function JerseyAvatar({ primaryColor, secondaryColor, size = 14, className, flagUrl, flagColors, countryCode }: JerseyAvatarProps) {
  return (
    <span className={cn("inline-block shrink-0 overflow-hidden rounded-full", SIZE_CLASSES[size], className)}>
      <svg viewBox="0 0 100 100" className="size-full">
        <defs>
          <clipPath id="jersey-avatar-head">
            <circle cx="50" cy="35" r="33" />
          </clipPath>
        </defs>

        {/* Jersey body, cropped at the canvas edge like a bust portrait. */}
        <path
          d="M 50 62 C 38 62, 30 66, 22 72 C 10 80, 2 90, 0 100 L 100 100 C 98 90, 90 80, 78 72 C 70 66, 62 62, 50 62 Z"
          fill={primaryColor}
        />

        {/* Shoulder stripes — a nod to the collar/rayures ask, independent
            of the collar trim below. */}
        <path d="M 24 74 L 34 84" stroke={secondaryColor} strokeWidth="4" strokeLinecap="round" />
        <path d="M 76 74 L 66 84" stroke={secondaryColor} strokeWidth="4" strokeLinecap="round" />

        {/* V-neck collar trim, drawn last so it sits on top of the body fill. */}
        <path d="M 30 68 L 50 82 L 70 68" stroke={secondaryColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Head circle, with a thin ring so it reads as a separate "crest"
            element from the jersey behind it, same as the reference art. */}
        <circle cx="50" cy="35" r="33" fill="none" stroke="#ffffff" strokeWidth="2" />
        <HeadContent flagUrl={flagUrl} flagColors={flagColors} countryCode={countryCode} />
      </svg>
    </span>
  );
}
