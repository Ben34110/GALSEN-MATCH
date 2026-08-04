"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, Radio, Trophy, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/actu", label: "Actu", icon: Newspaper },
  { href: "/live", label: "Live", icon: Radio },
  { href: "/fantasy", label: "Fantasy", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profil", label: "Profil", icon: User },
] as const;

export function FloatingNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Mobile / tablet (<1024px): floating pill bar above the home-indicator safe area. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(0.75rem+var(--safe-bottom))] pt-2 lg:hidden"
        aria-label="Navigation principale"
      >
        <ul
          className={cn(
            "flex items-center gap-1 rounded-2xl border border-white/10",
            "bg-surface/80 px-2 py-1.5 shadow-lg shadow-black/40",
            "backdrop-blur-xl backdrop-saturate-150"
          )}
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-3.5 py-1.5",
                    "text-[11px] font-medium transition-[color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] active:scale-90",
                    active ? "text-accent-ink" : "text-muted hover:text-foreground"
                  )}
                >
                  {active && (
                    <span className="absolute inset-0 -z-10 rounded-xl bg-accent" aria-hidden />
                  )}
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop (≥1024px): persistent sidebar replaces the bottom bar entirely. */}
      <nav
        className="sticky top-8 hidden h-fit w-56 shrink-0 flex-col gap-6 self-start lg:flex"
        aria-label="Navigation principale"
      >
        <Link href="/actu" className="flex items-center gap-2 rounded-lg px-2 focus-visible:outline-offset-4">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-extrabold text-accent-ink">
            GM
          </span>
          <span className="text-base font-extrabold tracking-tight text-foreground">Galsen Match</span>
        </Link>

        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                    "transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]",
                    active ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface hover:text-foreground"
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
