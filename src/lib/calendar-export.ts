"use client";

import { writeLocalStorageValue } from "@/hooks/use-local-storage-value";
import { HAS_ADDED_CALENDAR_EVENT_KEY } from "@/lib/badges";
import type { KeyEvent } from "@/lib/data/key-events";

// Standard iCalendar (.ics) export — works universally (iOS Safari offers
// "Add to Calendar" on the downloaded file via Apple Calendar, Android/
// desktop Chrome hands it to Google Calendar or whatever's the default .ics
// handler) without needing a platform-specific URL scheme. All-day event
// (VALUE=DATE, not a UTC timestamp) since these are informational target
// dates, not exact kickoff times — avoids the date shifting a day depending
// on the viewer's timezone.
function formatICSDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function escapeICSText(text: string): string {
  return text.replace(/[\\,;]/g, (match) => `\\${match}`).replace(/\n/g, "\\n");
}

function buildICS(event: KeyEvent): string {
  const dtstamp = `${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
  const dtstart = formatICSDate(event.date);
  const dtend = formatICSDate(new Date(event.date.getTime() + 24 * 60 * 60 * 1000)); // DTEND is exclusive
  const description = escapeICSText(event.subtitle + (event.estimated ? " (date estimée, à confirmer)" : ""));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AfroLive//FR",
    "BEGIN:VEVENT",
    `UID:${event.id}@galsenmatch.app`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${escapeICSText(event.title)}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadEventToCalendar(event: KeyEvent) {
  const blob = new Blob([buildICS(event)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  writeLocalStorageValue(HAS_ADDED_CALENDAR_EVENT_KEY, "true");
}
