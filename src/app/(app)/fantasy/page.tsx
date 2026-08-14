"use client";

import Link from "next/link";
import { Shirt, Trophy, Users, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

const GAMES = [
  { href: "/fantasy/xi", icon: Shirt, key: "xi" },
  { href: "/fantasy/leagues", icon: Users, key: "leagues" },
  { href: "/fantasy/ballon-dor", icon: Trophy, key: "ballonDor" },
  { href: "/fantasy/quiz", icon: Zap, key: "quiz" },
] as const;

export default function FantasyPage() {
  const t = useTranslations("fantasy");

  return (
    <div>
      <SectionHeader eyebrow={t("common.eyebrow")} title={t("hub.title")} subtitle={t("hub.subtitle")} />
      <div className="flex flex-col gap-3">
        {GAMES.map(({ href, icon: Icon, key }) => (
          <Link key={href} href={href}>
            <Card interactive className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-2/15 text-accent-2">
                <Icon size={22} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-foreground">{t(`hub.${key}Title`)}</span>
                <span className="block text-sm text-muted">{t(`hub.${key}Description`)}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
