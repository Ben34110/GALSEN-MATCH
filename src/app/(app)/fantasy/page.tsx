import Link from "next/link";
import { Shirt, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

const GAMES = [
  {
    href: "/fantasy/xi",
    icon: Shirt,
    title: "Le XI",
    description: "Compose ton onze de la semaine avec des joueurs africains.",
  },
  {
    href: "/fantasy/ballon-dor",
    icon: Trophy,
    title: "Ballon d'Or Africain",
    description: "Pronostique le podium du Ballon d'Or africain.",
  },
  {
    href: "/fantasy/quiz",
    icon: Zap,
    title: "Quizz Foot Africain",
    description: "Un sprint d'une minute sur le foot africain.",
  },
] as const;

export default function FantasyPage() {
  return (
    <div>
      <SectionHeader eyebrow="Fantasy" title="Fantasy" subtitle="Choisis un mini-jeu." />
      <div className="flex flex-col gap-3">
        {GAMES.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href}>
            <Card interactive className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-2/15 text-accent-2">
                <Icon size={22} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-foreground">{title}</span>
                <span className="block text-sm text-muted">{description}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
