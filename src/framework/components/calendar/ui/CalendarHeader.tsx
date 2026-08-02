import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { Button } from "@/framework/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/framework/components/ui/select";
import type { CalendarMode } from "../types";

const MODE_LABELS: Record<CalendarMode, string> = {
  month: "Month view",
  week: "Week view",
  day: "Day view",
};

interface CalendarHeaderProps {
  monthLabel: string;
  rangeLabel: string;
  mode: CalendarMode;
  views: CalendarMode[];
  onModeChange: (mode: CalendarMode) => void;
  onAddEvent?: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  monthLabel,
  rangeLabel,
  mode,
  views,
  onModeChange,
  onAddEvent,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border px-5 pt-5 pb-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{monthLabel}</h2>
        <span className="rounded-md border border-border px-2 py-0.5 text-muted-foreground">
          {rangeLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-1">
        <div className="w-fit flex items-center overflow-hidden rounded-md border border-border">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="rounded-none" onClick={onToday}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-none"
            onClick={onNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {views.length > 1 && (
          <Select
            value={mode}
            onValueChange={(v) => onModeChange(v as CalendarMode)}
          >
            <SelectTrigger className="w-35">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {views.map((v) => (
                <SelectItem key={v} value={v}>
                  {MODE_LABELS[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
