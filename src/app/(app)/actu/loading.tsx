import { Card } from "@/components/ui/card";

// Actu is force-dynamic (see page.tsx's comment) — a live Supabase read on
// every visit, so navigating back to this tab always has a beat of network
// latency. Without this file, Next shows nothing during that wait and the
// previously-rendered tab just sits there inert until the new page arrives,
// reading as a freeze. This renders instantly (no data dependency) while
// the real page streams in behind it.
function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-2 ${className}`} />;
}

export default function ActuLoading() {
  return (
    <div>
      <header className="mb-6 flex items-center justify-between gap-3 lg:mb-8">
        <div className="flex flex-col gap-2">
          <Block className="h-4 w-20" />
          <Block className="h-7 w-40" />
        </div>
        <div className="size-12 shrink-0 animate-pulse rounded-full bg-surface-2" />
      </header>

      <Card className="mb-6 flex items-center justify-between gap-3 lg:mb-8">
        <div className="flex flex-col gap-2">
          <Block className="h-3 w-16" />
          <Block className="h-4 w-44" />
        </div>
        <div className="h-11 w-24 shrink-0 animate-pulse rounded-full bg-surface-2" />
      </Card>

      <div className="mb-7 flex gap-2.5 overflow-x-auto pb-1 lg:mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-11 w-32 shrink-0 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>

      <Block className="mb-4 h-6 w-32" />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-surface-2" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex h-full flex-col gap-0 overflow-hidden p-0">
            <div className="aspect-[16/9] w-full shrink-0 animate-pulse bg-surface-2" />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <Block className="h-5 w-24 rounded-full" />
              <Block className="h-4 w-full" />
              <Block className="h-4 w-3/4" />
              <Block className="mt-2 h-3 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
