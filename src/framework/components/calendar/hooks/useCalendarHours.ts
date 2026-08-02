"use client";

import { useMemo } from "react";
import { computeCalendarHoursRange } from "../calendar-utils";
import type { CalendarEvent, CalendarHours } from "../types";

export function useCalendarHours<TData>(
  calendarHours: CalendarHours | null,
  startHour: number,
  endHour: number,
  slotMinutes: number,
  events: CalendarEvent<TData>[],
) {
  const { startHour: effectiveStartHour, endHour: effectiveEndHour } = useMemo(
    () => computeCalendarHoursRange(calendarHours, startHour, endHour, events),
    [calendarHours, startHour, endHour, events],
  );

  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = effectiveStartHour; h <= effectiveEndHour; h++) arr.push(h);
    return arr;
  }, [effectiveStartHour, effectiveEndHour]);

  const slots = useMemo(() => {
    const step = slotMinutes / 60;
    const arr: number[] = [];
    for (let h = effectiveStartHour; h < effectiveEndHour; h += step) {
      if (Math.abs(h % 1) > 1e-6) arr.push(h);
    }
    return arr;
  }, [effectiveStartHour, effectiveEndHour, slotMinutes]);

  return { effectiveStartHour, effectiveEndHour, hours, slots };
}
