"use client";

import { useState } from "react";
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

const VIEWS = [
  { id: "matchs", label: "Matchs" },
  { id: "classement", label: "Classement" },
];

export function CanQualifiersSection({
  fixtures,
  fixturesError,
  groups,
  groupsError,
  groupsProvisional,
}: CanQualifiersSectionProps) {
  const [view, setView] = useState<string>("matchs");

  return (
    <div>
      <SectionHeader
        eyebrow="CAN 2027"
        title="Qualifications"
        subtitle="Les deux premières journées de septembre 2026, groupe par groupe."
        action={<SegmentedControl items={VIEWS} activeId={view} onChange={setView} />}
      />
      {view === "matchs" ? (
        <CanQualifiersFixturesList fixtures={fixtures} error={fixturesError} />
      ) : (
        <CanQualifiersStandings groups={groups} error={groupsError} isProvisional={groupsProvisional} />
      )}
    </div>
  );
}
