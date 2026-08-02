import { addDays, isSameDay } from "date-fns";
import type { CalendarEvent, PlacedEvent, CalendarHours } from "./types";

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function startOfWeek(date: Date): Date {
  const day = (date.getDay() + 6) % 7;
  const d = addDays(date, -day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function sameDay(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

export function getMonthGrid(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(gridStart, i));
  }
  return days;
}

export function formatHour(h?: number): string {
  if (h == null) return "";
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const period = hour < 12 ? "am" : "pm";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}${min ? ":" + String(min).padStart(2, "0") : ""}${period}`;
}

export function sortKey(ev: CalendarEvent): number {
  return ev.start ?? -1;
}

export function layoutDayEvents<TData>(
  events: CalendarEvent<TData>[],
): PlacedEvent<TData>[] {
  const sorted = [...events].sort(
    (a, b) => (a.start ?? 0) - (b.start ?? 0) || (a.end ?? 0) - (b.end ?? 0),
  );
  const clusters: CalendarEvent<TData>[][] = [];
  let current: CalendarEvent<TData>[] = [];
  let clusterEnd = -Infinity;

  for (const ev of sorted) {
    if (current.length && (ev.start ?? 0) >= clusterEnd) {
      clusters.push(current);
      current = [];
      clusterEnd = -Infinity;
    }
    current.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.end ?? 0);
  }
  if (current.length) clusters.push(current);

  const placed: PlacedEvent<TData>[] = [];
  for (const cluster of clusters) {
    const columns: number[] = [];
    const withCol = cluster.map((ev) => {
      let col = columns.findIndex((endTime) => endTime <= (ev.start ?? 0));
      if (col === -1) {
        col = columns.length;
        columns.push(ev.end ?? 0);
      } else {
        columns[col] = ev.end ?? 0;
      }
      return { ...ev, col };
    });
    const colCount = columns.length;
    withCol.forEach((ev) => placed.push({ ...ev, colCount }));
  }
  return placed;
}

export function computeCalendarHoursRange<TData>(
  calendarHours: CalendarHours | null,
  fallbackStart: number,
  fallbackEnd: number,
  events: CalendarEvent<TData>[] = [],
): { startHour: number; endHour: number } {
  const activeDays = calendarHours
    ? Object.values(calendarHours).filter(
        (d): d is NonNullable<typeof d> => d != null,
      )
    : [];

  const eventStarts = events
    .map((e) => e.start)
    .filter((v): v is number => v != null);
  const eventEnds = events
    .map((e) => e.end)
    .filter((v): v is number => v != null);

  const candidates: number[] = [
    ...activeDays.map((d) => d.start),
    ...eventStarts,
  ];
  const endCandidates: number[] = [
    ...activeDays.map((d) => d.end),
    ...eventEnds,
  ];

  if (candidates.length === 0 && endCandidates.length === 0) {
    return { startHour: fallbackStart, endHour: fallbackEnd };
  }

  const earliestStart =
    candidates.length > 0 ? Math.min(...candidates) : fallbackStart;
  const latestEnd =
    endCandidates.length > 0 ? Math.max(...endCandidates) : fallbackEnd;

  return {
    startHour: Math.floor(earliestStart),
    endHour: Math.ceil(latestEnd),
  };
}

export function formatHour24(h?: number): string {
  if (h == null) return "";
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function resolveSelectionClick(
  e: React.MouseEvent | React.KeyboardEvent,
  id: string,
  onToggleSelect?: (id: string) => void,
  onSelectOnly?: (id: string) => void,
) {
  const isModified = "ctrlKey" in e && (e.ctrlKey || e.metaKey);
  if (isModified) onToggleSelect?.(id);
  else (onSelectOnly ?? onToggleSelect)?.(id);
}
