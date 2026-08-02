import { useEffect, useRef } from "react";
import {
  sameDay,
  DAY_LABELS,
  layoutDayEvents,
  formatHour24,
  resolveSelectionClick,
} from "../calendar-utils";
import { CalendarEvent, CalendarHours, EventTemplate } from "../types";
import { EventHoverCard } from "./EventHoverCard";
import { Checkbox } from "@/framework/components/ui/checkbox";

const TIME_COL_WIDTH = 56;
const MIN_DAY_COL_WIDTH = 120;

interface CalendarWeekViewProps<TData> {
  weekDays: Date[];
  today: Date;
  hours: number[];
  slots: number[];
  hourHeight: number;
  startHour: number;
  events: CalendarEvent<TData>[];
  allDaySet: Set<string>;
  calendarHours: CalendarHours | null;
  getTemplate: (ev: CalendarEvent<TData>) => EventTemplate<TData>;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectOnly?: (id: string) => void;
}

export function CalendarWeekView<TData>({
  weekDays,
  today,
  hours,
  slots,
  hourHeight,
  startHour,
  events,
  allDaySet,
  calendarHours,
  getTemplate,
  selectedDate,
  onSelectDate,
  selectedIds,
  onToggleSelect,
  onSelectOnly,
}: CalendarWeekViewProps<TData>) {
  const isToday = (d: Date) => sameDay(d, today);
  const endHour = hours[hours.length - 1] ?? startHour;
  const totalHeight = (hours.length - 1) * hourHeight;
  const yFor = (hour: number) => (hour - startHour) * hourHeight;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [weekDays[0]?.toISOString()]);

  const gridTemplateColumns = `${TIME_COL_WIDTH}px repeat(${weekDays.length}, minmax(${MIN_DAY_COL_WIDTH}px, 1fr))`;
  const gridMinWidth = TIME_COL_WIDTH + weekDays.length * MIN_DAY_COL_WIDTH;

  return (
    <div
      ref={scrollRef}
      className="scrollbar-thumb-rounded scrollbar-thin min-h-0 flex-1 overflow-auto scrollbar-thumb-primary scrollbar-track-muted/80"
    >
      <div style={{ minWidth: gridMinWidth }}>
        <div
          className="sticky top-0 z-30 grid border-b border-border bg-card"
          style={{ gridTemplateColumns }}
        >
          <div className="sticky left-0 z-30 bg-card" />
          {weekDays.map((d) => {
            const selected = sameDay(d, selectedDate);
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => onSelectDate(d)}
                className={`border-l border-border py-3 text-center transition-colors ${
                  selected ? "bg-primary/10" : "hover:bg-muted"
                }`}
              >
                <div className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  {DAY_LABELS[(d.getDay() + 6) % 7]}
                </div>
                <div
                  className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-sm ${
                    isToday(d)
                      ? "bg-primary font-semibold text-primary-foreground"
                      : selected
                        ? "border border-primary text-foreground"
                        : "text-foreground"
                  }`}
                >
                  {d.getDate()}
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="relative grid border-b border-border"
          style={{
            gridTemplateColumns,
            height: totalHeight,
          }}
        >
          <div className="sticky left-0 z-20 bg-card">
            {hours.slice(0, -1).map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
                style={{ top: yFor(h) + hourHeight }}
              >
                {formatHour24(h + 1)}
              </div>
            ))}
          </div>

          {weekDays.map((d) => {
            const dayEvents = layoutDayEvents(
              events.filter(
                (e) => sameDay(e.date, d) && !(e.type && allDaySet.has(e.type)),
              ),
            );
            const dayIndex = (d.getDay() + 6) % 7;
            const dayHours = calendarHours ? calendarHours[dayIndex] : undefined;

            return (
              <div
                key={d.toISOString()}
                role="button"
                tabIndex={0}
                onClick={() => onSelectDate(d)}
                className="relative cursor-pointer border-l border-border"
              >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  {hours.slice(0, -1).map((h) => (
                    <div
                      key={h}
                      className="absolute right-0 left-0 border-t border-border/70"
                      style={{ top: yFor(h) + hourHeight }}
                    />
                  ))}
                  {slots.map((h) => (
                    <div
                      key={h}
                      className="absolute right-0 left-0 border-t border-border/30"
                      style={{ top: yFor(h) }}
                    />
                  ))}

                  {calendarHours &&
                    (dayHours ? (
                      <>
                        {dayHours.start > startHour && (
                          <div
                            className="absolute top-0 right-0 left-0 bg-muted/50"
                            style={{ height: yFor(dayHours.start) }}
                          />
                        )}
                        {dayHours.end < endHour && (
                          <div
                            className="absolute right-0 bottom-0 left-0 bg-muted/50"
                            style={{ top: yFor(dayHours.end) }}
                          />
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-muted/50" />
                    ))}
                </div>

                {dayEvents.map((ev) => {
                  const top = yFor(ev.start ?? 0);
                  const height = Math.max(
                    28,
                    ((ev.end ?? 0) - (ev.start ?? 0)) * hourHeight - 2,
                  );
                  const width = 100 / ev.colCount;
                  const tooltip = getTemplate(ev).tooltip?.(ev);
                  const isSelected = selectedIds?.has(ev.id) ?? false;

                  return (
                    <EventHoverCard key={ev.id} content={tooltip}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveSelectionClick(
                            e,
                            ev.id,
                            onToggleSelect,
                            onSelectOnly,
                          );
                        }}
                        className={`absolute z-10 flex cursor-pointer items-start gap-1 overflow-hidden rounded-md px-2 py-1 transition-shadow ${
                          ev.className ?? "border-primary bg-primary/15"
                        } ${
                          isSelected
                            ? "ring-1 ring-primary ring-offset-1 ring-offset-primary"
                            : ""
                        }`}
                        style={{
                          top,
                          height,
                          left: `${ev.col * width}%`,
                          width: `calc(${width}% - 4px)`,
                        }}
                      >
                        <div
                          className="mt-0.5 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            className="h-3.5 w-3.5"
                            onCheckedChange={() => onToggleSelect?.(ev.id)}
                          />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          {getTemplate(ev).block?.(ev)}
                        </div>
                      </div>
                    </EventHoverCard>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
