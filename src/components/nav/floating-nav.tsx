"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Home, CalendarClock, Trophy, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/actu", label: "Accueil", icon: Home },
  { href: "/upcoming", label: "Sélections", icon: CalendarClock },
  { href: "/fantasy", label: "Fantasy", icon: Trophy },
  { href: "/chat", label: "Live Chat", icon: MessageCircle },
  { href: "/profil", label: "Profil", icon: User },
] as const;

interface IndicatorRect {
  offset: number;
  size: number;
}

// Measures the active <li>'s position/size relative to its <ul> so the pill
// indicator can slide+resize smoothly between tabs instead of snapping.
// Refs are created by the caller (see FloatingNav) so eslint's ref-safety
// analysis can see the useRef call directly, not through this hook's return.
function useIndicatorRect(
  containerRef: RefObject<HTMLUListElement | null>,
  itemRefs: RefObject<Map<string, HTMLLIElement>>,
  activeHref: string,
  axis: "x" | "y"
): IndicatorRect | null {
  const [rect, setRect] = useState<IndicatorRect | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const item = itemRefs.current.get(activeHref);
    if (!container || !item) return;

    function measure() {
      const containerRect = container!.getBoundingClientRect();
      const itemRect = item!.getBoundingClientRect();
      setRect(
        axis === "x"
          ? { offset: itemRect.left - containerRect.left, size: itemRect.width }
          : { offset: itemRect.top - containerRect.top, size: itemRect.height }
      );
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, itemRefs, activeHref, axis]);

  return rect;
}

export function FloatingNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const activeHref = NAV_ITEMS.find(({ href }) => isActive(href))?.href ?? NAV_ITEMS[0].href;

  const mobileContainerRef = useRef<HTMLUListElement>(null);
  const mobileItemRefs = useRef(new Map<string, HTMLLIElement>());
  const mobileRect = useIndicatorRect(mobileContainerRef, mobileItemRefs, activeHref, "x");

  const desktopContainerRef = useRef<HTMLUListElement>(null);
  const desktopItemRefs = useRef(new Map<string, HTMLLIElement>());
  const desktopRect = useIndicatorRect(desktopContainerRef, desktopItemRefs, activeHref, "y");

  return (
    <>
      {/* Mobile / tablet (<1024px): floating soft pill above the home-indicator safe area. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(0.75rem+var(--safe-bottom))] pt-2 lg:hidden"
        aria-label="Navigation principale"
      >
        <ul ref={mobileContainerRef} className="glass-panel relative flex items-center gap-1 rounded-full px-2 py-1.5">
          {mobileRect && (
            <span
              className="glass-accent absolute inset-y-1.5 left-0 rounded-full transition-[transform,width] duration-300 ease-[var(--ease-spring)]"
              style={{ width: mobileRect.size, transform: `translateX(${mobileRect.offset}px)` }}
              aria-hidden
            />
          )}
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} ref={(el) => void (el ? mobileItemRefs.current.set(href, el) : mobileItemRefs.current.delete(href))}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative z-10 flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-full px-3.5 py-1.5",
                    "text-[11px] font-medium transition-[color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-90",
                    active ? "text-accent" : "text-muted hover:text-foreground"
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop (≥1024px): persistent soft sidebar replaces the bottom bar entirely. */}
      <nav
        className="glass-panel sticky top-8 hidden h-fit w-60 shrink-0 flex-col gap-6 self-start rounded-2xl p-4 lg:flex"
        aria-label="Navigation principale"
      >
        <Link href="/actu" className="flex items-center gap-2 rounded-lg px-2 focus-visible:outline-offset-4">
          <span className="gradient-accent glow-accent grid size-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-accent-ink">
            GM
          </span>
          <span className="font-serif text-base font-bold tracking-tight text-foreground">Galsen Match</span>
        </Link>

        <ul ref={desktopContainerRef} className="relative flex flex-col gap-1">
          {desktopRect && (
            <span
              className="glass-accent absolute inset-x-0 left-0 rounded-xl transition-[transform,height] duration-300 ease-[var(--ease-spring)]"
              style={{ height: desktopRect.size, transform: `translateY(${desktopRect.offset}px)` }}
              aria-hidden
            />
          )}
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} ref={(el) => void (el ? desktopItemRefs.current.set(href, el) : desktopItemRefs.current.delete(href))}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative z-10 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                    "transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]",
                    active ? "text-accent" : "text-muted hover:bg-foreground/[0.04] hover:text-foreground"
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
