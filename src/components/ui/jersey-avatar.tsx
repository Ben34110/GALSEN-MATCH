import { cn } from "@/lib/utils";
import { shadeColor } from "@/lib/color-utils";

// Single neutral SVG template, recolored entirely through props — no
// per-team image assets. Same viewBox/size convention as CustomAvatar
// (components/ui/custom-avatar.tsx): a 0 0 100 100 box, `size` mapped to a
// Tailwind size-N class on the wrapping <span>.
//
// Deliberately plain: just the jersey silhouette in primaryColor and one
// off-center chest badge (a shade of primaryColor, see lib/color-utils.ts's
// shadeColor — not an unrelated second color). Earlier versions added a
// V-neck collar stroke and shoulder stripes; both read as clutter/stray
// marks rather than part of the jersey, so this version has neither.
//
// Pure <svg>/<circle>/<path>/<clipPath>/<image>/<text> tags only, no web-only
// APIs (no CSS gradients, no <Image> from next/image) — porting to React
// Native only means swapping the element names for react-native-svg's
// PascalCase equivalents (svg->Svg, circle->Circle, path->Path, clipPath->
// ClipPath, image->Image, text->Text) and the geometry/props are unchanged.
export interface JerseyAvatarProps {
  // Jersey body fill — every other jersey detail shades off this one color.
  primaryColor: string;
  // Chest "crest" dot — defaults to a darker shade of primaryColor.
  badgeColor?: string;
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
    // Crest source images (media.api-sports.io) have a lot of transparent
    // margin baked in around the actual badge artwork — sized exactly to
    // the 66x66 circle bounds, that margin made the crest look tiny inside
    // the circle. Oversizing the image (rendered well past the circle,
    // still clipped to it) zooms past that margin so the crest itself
    // fills the circle instead.
    return <image href={flagUrl} x="-5" y="-20" width="110" height="110" preserveAspectRatio="xMidYMid slice" clipPath="url(#jersey-avatar-head)" />;
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

export function JerseyAvatar({ primaryColor, badgeColor, size = 14, className, flagUrl, flagColors, countryCode }: JerseyAvatarProps) {
  const badge = badgeColor ?? shadeColor(primaryColor, -0.32);

  return (
    <span className={cn("inline-block shrink-0 overflow-hidden rounded-full", SIZE_CLASSES[size], className)}>
      <svg viewBox="0 0 100 100" className="size-full">
        <defs>
          <clipPath id="jersey-avatar-head">
            <circle cx="50" cy="35" r="33" />
          </clipPath>
        </defs>

        {/* Jersey body, cropped at the canvas edge like a bust portrait —
            plain fill, no collar or other markings: just the shape and the
            badge below. */}
        <path
          d="M 50 62 C 38 62, 30 66, 22 72 C 10 80, 2 90, 0 100 L 100 100 C 98 90, 90 80, 78 72 C 70 66, 62 62, 50 62 Z"
          fill={primaryColor}
        />

        {/* Chest crest — off-center toward the wearer's left (viewer's
            right), like a real jersey badge, not centered on the chest. */}
        <circle cx="64" cy="88" r="5" fill={badge} stroke="#ffffff" strokeWidth="1" />

        {/* Head circle, with a thin ring so it reads as a separate "crest"
            element from the jersey behind it, same as the reference art. */}
        <circle cx="50" cy="35" r="33" fill="none" stroke="#ffffff" strokeWidth="2" />
        <HeadContent flagUrl={flagUrl} flagColors={flagColors} countryCode={countryCode} />
      </svg>
    </span>
  );
}
