// Static, decorative-only ambient light — sits behind all content to give the
// dark surface a cinematic depth without competing with foreground contrast.
// Fixed + pointer-events-none so it never intercepts touch/scroll, and static
// (no animation) so it doesn't trip prefers-reduced-motion or distract.
export function AmbientGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-accent/15 blur-[110px] sm:size-96" />
      <div className="absolute -right-16 bottom-24 size-64 rounded-full bg-accent-2/10 blur-[110px] sm:size-80" />
    </div>
  );
}
