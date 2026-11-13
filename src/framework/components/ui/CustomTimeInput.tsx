"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/framework/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

type TimeUnit = "hours" | "minutes" | "seconds";

const SCREENS: TimeUnit[] = ["hours", "minutes", "seconds"];

function generateOptions(unit: TimeUnit, intervalMinutes = 5): number[] {
  if (unit === "hours") return Array.from({ length: 24 }, (_, i) => i);
  return Array.from(
    { length: Math.ceil(60 / intervalMinutes) },
    (_, i) => i * intervalMinutes,
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseTime(value?: string): { h: number; m: number; s: number } {
  if (!value) return { h: 0, m: 0, s: 0 };
  const [h = 0, m = 0, s = 0] = value.split(":").map(Number);
  return { h, m, s };
}

const DISPLAY_FORMAT_WITH_SECONDS = /^\d{2}:\d{2}:\d{2}$/;

function fromInputValue(raw: string): string | null {
  if (!DISPLAY_FORMAT_WITH_SECONDS.test(raw)) return null;
  const [h, m, s] = raw.split(":").map(Number);
  if (h > 23 || m > 59 || s > 59) return null;
  return raw;
}

interface TimeInputProps {
  value?: string;
  onChange?: (time: string) => void;
  onBlur?: (hasFormatError?: boolean) => void;
  intervalMinutes?: number;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  readOnly?: boolean;
}

export const CustomTimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  function CustomTimeInput(
    {
      value,
      onChange,
      onBlur,
      intervalMinutes = 5,
      disabled,
      hasError,
      className,
      readOnly,
    },
    ref,
  ) {
    const t = useTranslations("Calendar");
    const SCREEN_LABELS: Record<TimeUnit, string> = {
      hours: t("hour"),
      minutes: t("minute"),
      seconds: t("second"),
    };
    const [open, setOpen] = useState(false);
    const [screen, setScreen] = useState<TimeUnit>("hours");
    const [inputValue, setInputValue] = useState(value ?? "");
    const [inputError, setInputError] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    // always HH:mm:ss
    const screens = SCREENS;

    useEffect(() => {
      setInputValue(value ?? "");
    }, [value]);
    useEffect(() => {
      if (open) {
        setScreen("hours");
        setSelected(parseTime(value));
      }
    }, [open]);
    useEffect(() => {
      if (!open) return;
      const el = listRef.current?.querySelector("[data-selected=true]");
      el?.scrollIntoView({ block: "center" });
    }, [screen, open]);

    const [selected, setSelected] = useState(parseTime(value));
    const currentIndex = screens.indexOf(screen);
    const options = generateOptions(screen, intervalMinutes);

    const getSelectedValue = (unit: TimeUnit) => {
      if (unit === "hours") return selected.h;
      if (unit === "minutes") return selected.m;
      return selected.s;
    };

    const handleSelect = (val: number) => {
      const next = {
        ...selected,
        ...(screen === "hours"
          ? { h: val }
          : screen === "minutes"
            ? { m: val }
            : { s: val }),
      };
      setSelected(next);

      // Apply to input immediately
      const time = `${pad(next.h)}:${pad(next.m)}:${pad(next.s)}`;
      onChange?.(time);
      setInputValue(time);
      setInputError(false);

      // Auto-advance, close on last
      if (currentIndex < screens.length - 1) {
        setScreen(screens[currentIndex + 1]);
      } else {
        setOpen(false);
      }
    };

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value;
      setInputValue(raw);
      setInputError(false);
      const time = fromInputValue(raw);
      if (time) onChange?.(time);
      else if (raw === "") onChange?.("");
    }

    function handleInputBlur() {
      // Auto-complete HH:mm → HH:mm:00
      let raw = inputValue;
      if (/^\d{2}:\d{2}$/.test(raw)) {
        raw = `${raw}:00`;
        setInputValue(raw);
      }

      const time = fromInputValue(raw);
      if (!time && raw !== "") {
        setInputError(true);
        onBlur?.(true);
      } else {
        setInputError(false);
        if (time) onChange?.(time);
        onBlur?.(false);
      }
    }

    const showError = (hasError || inputError) && !readOnly;

    return (
      <div className={cn("flex gap-1", className)}>
        <Input
          ref={ref}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="HH:mm:ss"
          disabled={disabled}
          readOnly={readOnly}
          data-invalid={showError}
          className={cn(
            "data-[invalid=true]:border-destructive data-[invalid=true]:focus-visible:border-destructive data-[invalid=true]:focus-visible:ring-destructive/20 dark:data-[invalid=true]:focus-visible:ring-destructive/40",
            readOnly && "bg-muted text-muted-foreground cursor-default",
          )}
        />
        {!disabled && !readOnly && (
          <Popover modal open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled}
                className={cn("shrink-0", showError && "border-destructive")}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-48 overflow-y-auto p-0" align="end">
              <div className="flex items-center justify-between border-b p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentIndex === 0}
                  onClick={() => setScreen(screens[currentIndex - 1])}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  {screens.map((s, i) => (
                    <React.Fragment key={s}>
                      <button
                        type="button"
                        onClick={() => setScreen(s)}
                        className={cn(
                          "rounded px-1.5 py-0.5 transition-colors",
                          s === screen
                            ? "bg-primary text-primary-foreground"
                            : "hover:text-foreground",
                        )}
                      >
                        {pad(getSelectedValue(s))}
                      </button>
                      {i < screens.length - 1 && <span>:</span>}
                    </React.Fragment>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={currentIndex === screens.length - 1}
                  onClick={() => setScreen(screens[currentIndex + 1])}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                {SCREEN_LABELS[screen]}
              </p>

              <div
                ref={listRef}
                className="scrollbar-thumb-rounded scrollbar-thin max-h-60 overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80"
              >
                <div className="grid grid-cols-4 gap-1 p-2">
                  {options.map((opt) => {
                    const isSelected = getSelectedValue(screen) === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        data-selected={isSelected}
                        onClick={() => handleSelect(opt)}
                        className={cn(
                          "rounded-md px-2 py-1.5 text-center text-sm transition-colors",
                          isSelected
                            ? "bg-primary font-semibold text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        {pad(opt)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  },
);
