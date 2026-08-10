"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/ui/section-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CanQualifiersFixturesList } from "@/components/upcoming/can-qualifiers-fixtures-list";
import { CanQualifiersStandings } from "@/components/upcoming/can-qualifiers-standings";
import type { CanQualifierFixture, CanQualifierGroup } from "@/lib/data/can-qualifiers";

interface CanQualifiersSectionProps {
  fixtures: CanQualifierFixture[];
  fixturesError: string | null;
  groups: CanQualifierGroup[] | null;
  groupsError: string | null;
  groupsProvisional: boolean;
}

export function CanQualifiersSection({
  fixtures,
  fixturesError,
  groups,
  groupsError,
  groupsProvisional,
}: CanQualifiersSectionProps) {
  const t = useTranslations("upcoming.canQualifiers");
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
        <CanQualifiersFixturesList fixtures={fixtures} error={fixturesError} />
      ) : (
        <CanQualifiersStandings groups={groups} error={groupsError} isProvisional={groupsProvisional} />
      )}
    </div>
  );
}
