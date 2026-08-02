import { format } from "date-fns";
import { Checkbox } from "@/framework/components/ui/checkbox";
import {
  sameDay,
  sortKey,
  DAY_LABELS,
  resolveSelectionClick,
} from "../calendar-utils";
import { CalendarEvent, EventTemplate } from "../types";
import { EventDot } from "./EventDot";

interface CalendarMonthViewProps<TData> {
  monthGrid: Date[];
  anchor: Date;
  today: Date;
  selectedDate: Date;
  events: CalendarEvent<TData>[];
  maxDotsPerDay: number;
  emptyLabel: string;
  getTemplate: (ev: CalendarEvent<TData>) => EventTemplate<TData>;
  onSelectDate: (d: Date) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectOnly?: (id: string) => void;
}

export function CalendarMonthView<TData>({
  monthGrid,
  anchor,
  today,
  selectedDate,
  events,
  maxDotsPerDay,
  emptyLabel,
  getTemplate,
  onSelectDate,
  selectedIds,
  onToggleSelect,
  onSelectOnly,
}: CalendarMonthViewProps<TData>) {
  const isToday = (d: Date) => sameDay(d, today);

  const selectedDayEvents = events
    .filter((e) => sameDay(e.date, selectedDate))
    .sort((a, b) => sortKey(a) - sortKey(b));

  return (
    <div className="scrollbar-thumb-rounded scrollbar-thin min-h-0 flex-1 overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted/80">
      <div className="grid grid-cols-7 border-b border-border">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-3 text-center text-[11px] tracking-wide text-muted-foreground uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthGrid.map((d) => {
          const inMonth = d.getMonth() === anchor.getMonth();
          const dayEvents = events
            .filter((e) => sameDay(e.date, d))
            .sort((a, b) => sortKey(a) - sortKey(b));
          const visible = dayEvents.slice(0, maxDotsPerDay);
          const overflow = dayEvents.length - visible.length;
          const selected = sameDay(d, selectedDate);

          return (
            <div
              key={d.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate(d)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDate(d);
                }
              }}
              className={`min-h-19 cursor-pointer border-r border-b border-border px-2 pt-2 pb-3 text-left transition-colors ${
                selected ? "bg-primary/10" : "hover:bg-muted"
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-sm ${
                  isToday(d)
                    ? "bg-primary font-semibold text-primary-foreground"
                    : selected
                      ? "border border-primary text-foreground"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/50"
                }`}
              >
                {d.getDate()}
              </span>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {visible.map((ev) => (
                  <EventDot
                    key={ev.id}
                    content={getTemplate(ev).tooltip?.(ev)}
                    className={ev.dotClassName}
                    selected={selectedIds?.has(ev.id)}
                    onToggle={() => onToggleSelect?.(ev.id)}
                    onSelectOnly={() => onSelectOnly?.(ev.id)}
                  />
                ))}
              </div>
              {overflow > 0 && (
                <span className="mt-1 block text-[10px] text-muted-foreground">
                  {overflow} more
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border p-5">
        <p className="mb-3 text-sm font-medium text-foreground">
          {format(selectedDate, "EEEE d MMMM")}
        </p>
        {selectedDayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedDayEvents.map((ev) => {
              const isSelected = selectedIds?.has(ev.id) ?? false;
              return (
                <div
                  key={ev.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) =>
                    resolveSelectionClick(
                      e,
                      ev.id,
                      onToggleSelect,
                      onSelectOnly,
                    )
                  }
                  className={`flex cursor-pointer items-start gap-2 rounded-md px-3 py-2 transition-shadow ${
                    ev.className ?? "border-primary bg-primary/10"
                  } ${
                    isSelected
                      ? "ring-1 ring-primary ring-offset-1 ring-offset-primary"
                      : ""
                  }`}
                >
                  <div
                    className="mt-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelect?.(ev.id)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    {getTemplate(ev).agenda(ev)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
