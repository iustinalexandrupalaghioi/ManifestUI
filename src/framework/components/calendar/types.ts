import type { ReactNode } from "react";

export interface CalendarEvent<TData = unknown> {
  id: string;
  type?: string;
  date: Date;
  title?: string;
  start?: number;
  end?: number;
  data?: TData;
  className?: string;
  dotClassName?: string;
}

export interface EventTemplate<TData = unknown> {
  block?: (ev: CalendarEvent<TData>) => ReactNode;
  agenda: (ev: CalendarEvent<TData>) => ReactNode;
  tooltip?: (ev: CalendarEvent<TData>) => ReactNode;
}

export type CalendarMode = "month" | "week" | "day";

export interface CalendarHoursDay {
  start: number;
  end: number;
}

export type CalendarHours = Record<number, CalendarHoursDay | null>;

export interface PlacedEvent<TData> extends CalendarEvent<TData> {
  col: number;
  colCount: number;
}
