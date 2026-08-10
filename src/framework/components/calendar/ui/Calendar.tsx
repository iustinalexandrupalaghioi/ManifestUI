"use client";

import { Card } from "@/components/ui/card";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useCalendarViewMode } from "../hooks/useCalendarViewMode";
import { useCalendarNavigation } from "../hooks/useCalendarNavigation";
import { useCalendarHours } from "../hooks/useCalendarHours";
import {
  EventTemplate,
  CalendarEvent,
  CalendarHours,
  CalendarMode,
} from "../types";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarWeekView } from "./CalendarWeekView";

const DEFAULT_VIEWS: CalendarMode[] = ["month", "week", "day"];
const DEFAULT_STORAGE_KEY = "calendar-view-mode";

export interface CalendarProps<TData = unknown> {
  events?: CalendarEvent<TData>[];
  templates?: Record<string, EventTemplate<TData>>;
  allDayTypes?: string[];
  calendarHours?: CalendarHours | null;
  today: Date;
  initialDate?: Date;
  initialMode?: CalendarMode;
  views?: CalendarMode[];
  storageKey?: string;
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  hourHeight?: number;
  maxDotsPerDay?: number;
  onAddEvent?: () => void;
  onRangeChange?: (start: Date, end: Date, mode: CalendarMode) => void;
  onSelectedDateChange?: (date: Date) => void;
  loading?: boolean;
  emptyLabel?: string;
  className?: string;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectOnly?: (id: string) => void;
}

export default function Calendar<TData = unknown>({
  events = [],
  templates = {},
  allDayTypes = [],
  calendarHours = null,
  today,
  initialDate,
  initialMode = "month",
  views = DEFAULT_VIEWS,
  storageKey = DEFAULT_STORAGE_KEY,
  startHour = 7,
  endHour = 20,
  slotMinutes = 15,
  hourHeight = 56,
  maxDotsPerDay = 3,
  onAddEvent,
  onRangeChange,
  onSelectedDateChange,
  loading = false,
  emptyLabel,
  className = "",
  selectedIds,
  onToggleSelect,
  onSelectOnly,
}: CalendarProps<TData>) {
  const t = useTranslations("Calendar");
  const resolvedEmptyLabel = emptyLabel ?? t("noEventsScheduled");
  const FALLBACK_TEMPLATE: EventTemplate = useMemo(
    () => ({
      block: (ev) => (
        <p className="truncate text-[12px] leading-tight font-medium text-primary-foreground">
          {ev.title ?? t("untitled")}
        </p>
      ),
      agenda: (ev) => (
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-medium text-primary-foreground">
            {ev.title ?? t("untitled")}
          </span>
        </div>
      ),
      tooltip: (ev) => (
        <p className="text-sm font-medium text-foreground">
          {ev.title ?? t("untitled")}
        </p>
      ),
    }),
    [t],
  );
  const [mode, setMode] = useCalendarViewMode(views, storageKey, initialMode);

  const {
    anchor,
    selectedDate,
    setSelectedDate,
    weekStart,
    monthGrid,
    weekDays,
    goPrev,
    goNext,
    goToday,
    monthLabel,
    rangeLabel,
  } = useCalendarNavigation({
    today,
    initialDate,
    mode,
    onRangeChange,
    onSelectedDateChange,
  });

  const { effectiveStartHour, hours, slots } = useCalendarHours(
    calendarHours,
    startHour,
    endHour,
    slotMinutes,
    events,
  );

  const allDaySet = useMemo(() => new Set(allDayTypes), [allDayTypes]);
  const getTemplate = (ev: CalendarEvent<TData>): EventTemplate<TData> =>
    (ev.type && templates[ev.type]) ||
    (FALLBACK_TEMPLATE as EventTemplate<TData>);

  return (
    <Card
      className={`flex h-full w-full flex-col gap-0 overflow-hidden rounded-none py-0 ${className}`}
    >
      {loading && (
        <div className="h-0.5 shrink-0 overflow-hidden bg-muted">
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
      )}

      <CalendarHeader
        monthLabel={monthLabel}
        rangeLabel={rangeLabel}
        mode={mode}
        views={views}
        onModeChange={setMode}
        onAddEvent={onAddEvent}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
      />

      {mode === "month" ? (
        <CalendarMonthView
          monthGrid={monthGrid}
          anchor={anchor}
          today={today}
          selectedDate={selectedDate}
          events={events}
          maxDotsPerDay={maxDotsPerDay}
          emptyLabel={resolvedEmptyLabel}
          getTemplate={getTemplate}
          onSelectDate={setSelectedDate}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectOnly={onSelectOnly}
        />
      ) : (
        <CalendarWeekView
          weekDays={weekDays}
          today={today}
          hours={hours}
          slots={slots}
          hourHeight={hourHeight}
          startHour={effectiveStartHour}
          events={events}
          allDaySet={allDaySet}
          calendarHours={calendarHours}
          getTemplate={getTemplate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          onSelectOnly={onSelectOnly}
        />
      )}
    </Card>
  );
}

export { formatHour } from "../calendar-utils";
export type {
  CalendarEvent,
  EventTemplate,
  CalendarMode,
  CalendarHours,
} from "../types";
