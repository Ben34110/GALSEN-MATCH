"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { U17WorldCupFixturesList } from "@/components/upcoming/u17-world-cup-fixtures-list";
import { U17WorldCupStandings } from "@/components/upcoming/u17-world-cup-standings";
import type { U17WorldCupFixture, U17WorldCupGroup } from "@/lib/data/u17-world-cup";

interface U17WorldCupSectionProps {
  fixtures: U17WorldCupFixture[];
  fixturesError: string | null;
  groups: U17WorldCupGroup[] | null;
  groupsError: string | null;
  groupsProvisional: boolean;
}

export function U17WorldCupSection({
  fixtures,
  fixturesError,
  groups,
  groupsError,
  groupsProvisional,
}: U17WorldCupSectionProps) {
  const t = useTranslations("upcoming.u17WorldCup");
  const [view, setView] = useState<string>("matchs");
  const views = [
    { id: "matchs", label: t("views.matches") },
    { id: "classement", label: t("views.standings") },
  ];

  return (
    <div>
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        action={<SegmentedControl items={views} activeId={view} onChange={setView} />}
      />
      {view === "matchs" ? (
        <U17WorldCupFixturesList fixtures={fixtures} error={fixturesError} />
      ) : (
        <U17WorldCupStandings groups={groups} error={groupsError} isProvisional={groupsProvisional} />
      )}
    </div>
  );
}
