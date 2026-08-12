"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { FifaRankingSection } from "@/components/upcoming/fifa-ranking-section";
import { CanQualifiersSection } from "@/components/upcoming/can-qualifiers-section";
import { U17WorldCupSection } from "@/components/upcoming/u17-world-cup-section";
import { UpcomingEventsView } from "@/components/upcoming/upcoming-events-view";
import type { FifaRankingRow } from "@/types";
import type { CanQualifierFixture, CanQualifierGroup } from "@/lib/data/can-qualifiers";
import type { U17WorldCupFixture, U17WorldCupGroup } from "@/lib/data/u17-world-cup";

interface UpcomingTabsProps {
  fifaRanking: { rows: FifaRankingRow[]; rankingDate: string };
  canFixtures: CanQualifierFixture[];
  canFixturesError: string | null;
  canGroups: CanQualifierGroup[] | null;
  canGroupsError: string | null;
  canGroupsProvisional: boolean;
  u17Fixtures: U17WorldCupFixture[];
  u17FixturesError: string | null;
  u17Groups: U17WorldCupGroup[] | null;
  u17GroupsError: string | null;
  u17GroupsProvisional: boolean;
}

// Top-level tab switcher for the Matchs page — CAN 2027 and the U17 World
// Cup used to sit below the (long) FIFA ranking table, so reaching them
// meant scrolling past it every time. Tabbing the four sections instead
// puts CAN/CDM U17 one tap away by default while keeping FIFA ranking and
// Événements just as reachable, only a tap away instead of gone.
export function UpcomingTabs({
  fifaRanking,
  canFixtures,
  canFixturesError,
  canGroups,
  canGroupsError,
  canGroupsProvisional,
  u17Fixtures,
  u17FixturesError,
  u17Groups,
  u17GroupsError,
  u17GroupsProvisional,
}: UpcomingTabsProps) {
  const t = useTranslations("upcoming.tabs");
  const [tab, setTab] = useState<string>("can");
  const tabs = [
    { id: "can", label: t("can") },
    { id: "u17", label: t("u17") },
    { id: "fifa", label: t("fifa") },
    { id: "events", label: t("events") },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* self-start: without it, being the first child of this flex-col
          stretches the pill row to the column's full width (align-items:
          stretch is the flex default) — right up under the fixed global
          search button (components/search/global-search-button.tsx) at
          the top-right of every page. Content-width + left-aligned avoids
          the overlap and also just looks like a normal tab row. */}
      <SegmentedControl items={tabs} activeId={tab} onChange={setTab} className="self-start" />

      {tab === "can" && (
        <CanQualifiersSection
          fixtures={canFixtures}
          fixturesError={canFixturesError}
          groups={canGroups}
          groupsError={canGroupsError}
          groupsProvisional={canGroupsProvisional}
        />
      )}
      {tab === "u17" && (
        <U17WorldCupSection
          fixtures={u17Fixtures}
          fixturesError={u17FixturesError}
          groups={u17Groups}
          groupsError={u17GroupsError}
          groupsProvisional={u17GroupsProvisional}
        />
      )}
      {tab === "fifa" && <FifaRankingSection rows={fifaRanking.rows} rankingDate={fifaRanking.rankingDate} />}
      {tab === "events" && <UpcomingEventsView />}
    </div>
  );
}
