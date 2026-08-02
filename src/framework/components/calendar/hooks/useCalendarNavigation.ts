"use client";

import { addDays, addMonths, format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { getMonthGrid, sameDay, startOfWeek } from "../calendar-utils";
import type { CalendarMode } from "../types";

interface UseCalendarNavigationArgs {
  today: Date;
  initialDate?: Date;
  mode: CalendarMode;
  onRangeChange?: (start: Date, end: Date, mode: CalendarMode) => void;
  onSelectedDateChange?: (date: Date) => void;
}

export function useCalendarNavigation({
  today,
  initialDate,
  mode,
  onRangeChange,
  onSelectedDateChange,
}: UseCalendarNavigationArgs) {
  const [anchor, setAnchor] = useState<Date>(() => initialDate ?? today);
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => initialDate ?? today,
  );

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const monthGrid = useMemo(() => getMonthGrid(anchor), [anchor]);

  const weekDays = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) arr.push(addDays(weekStart, i));
    return mode === "day" ? arr.filter((d) => sameDay(d, anchor)) : arr;
  }, [weekStart, mode, anchor]);

  const visibleRange = useMemo(() => {
    const startOfDay = (d: Date) => {
      const c = new Date(d);
      c.setHours(0, 0, 0, 0);
      return c;
    };
    const endOfDay = (d: Date) => {
      const c = new Date(d);
      c.setHours(23, 59, 59, 999);
      return c;
    };
    if (mode === "month")
      return { start: startOfDay(monthGrid[0]), end: endOfDay(monthGrid[41]) };
    if (mode === "week")
      return {
        start: startOfDay(weekStart),
        end: endOfDay(weekDays[weekDays.length - 1]),
      };
    return { start: startOfDay(anchor), end: endOfDay(anchor) };
  }, [mode, monthGrid, weekStart, weekDays, anchor]);

  useEffect(() => {
    onRangeChange?.(visibleRange.start, visibleRange.end, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleRange.start.toISOString(), visibleRange.end.toISOString(), mode]);

  useEffect(() => {
    onSelectedDateChange?.(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate.toDateString()]);

  const goPrev = () => {
    if (mode === "month") {
      setAnchor((d) => addMonths(d, -1));
      setSelectedDate((d) => addMonths(d, -1));
    } else {
      const delta = mode === "day" ? -1 : -7;
      setAnchor((d) => addDays(d, delta));
      setSelectedDate((d) => addDays(d, delta));
    }
  };
  const goNext = () => {
    if (mode === "month") {
      setAnchor((d) => addMonths(d, 1));
      setSelectedDate((d) => addMonths(d, 1));
    } else {
      const delta = mode === "day" ? 1 : 7;
      setAnchor((d) => addDays(d, delta));
      setSelectedDate((d) => addDays(d, delta));
    }
  };
  const goToday = () => {
    setAnchor(today);
    setSelectedDate(today);
  };

  const monthLabel = format(anchor, "MMMM yyyy");
  const rangeLabel =
    mode === "day"
      ? format(anchor, "EEEE d")
      : mode === "week"
        ? `${format(weekStart, "d")} – ${format(weekDays[weekDays.length - 1], "d MMM")}`
        : `${format(monthGrid[0], "d MMM")} – ${format(monthGrid[41], "d MMM")}`;

  return {
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
  };
}
