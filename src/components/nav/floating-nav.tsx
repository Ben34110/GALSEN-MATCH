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

  return (
    <nav className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" aria-label="Navigation principale">
      <ul
        className={cn(
          "flex items-center gap-1 rounded-2xl border border-white/10",
          "bg-surface/70 px-2 py-2 shadow-lg shadow-black/40",
          "backdrop-blur-xl backdrop-saturate-150"
        )}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2",
                  "text-[11px] font-medium transition-colors",
                  active ? "text-accent-ink" : "text-muted hover:text-foreground"
                )}
              >
                {active && <span className="absolute inset-0 -z-10 rounded-xl bg-accent" aria-hidden />}
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
