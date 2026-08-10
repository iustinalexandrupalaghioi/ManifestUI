"use client";

import { CustomTimeInput } from "@/framework/components/ui/CustomTimeInput";
import { cn } from "@/framework/lib/utils";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { CustomDateInput } from "./CustomDateInput";

const TZ = process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "Europe/Bucharest";

// Matches a trailing Z or ±HH[:mm] offset — i.e. this string is timezone-aware.
// Postgres's own text output (e.g. from a `timestamp with time zone` column
// read in string mode) uses offsets like "+00" or "+02", without the colon
// and minutes that a strict ISO offset would have — those must match too.
const HAS_OFFSET = /(Z|[+-]\d{2}(:?\d{2})?)$/;

interface DateTimeInputProps {
  value?: string; // naive "yyyy-MM-ddTHH:mm:ss" OR offset-aware ISO ("...+03:00" / "...Z")
  onChange?: (value: string) => void;
  onBlur?: (hasFormatError?: boolean) => void;
  hasError?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
}

export const CustomDateTimeInput = React.forwardRef<
  HTMLInputElement,
  DateTimeInputProps
>(function CustomDateTimeInput(
  { value, onChange, onBlur, hasError, disabled, className, readonly },
  ref,
) {
  const t = useTranslations("Validation");
  const normalizedValue =
    value && HAS_OFFSET.test(value)
      ? formatInTimeZone(value, TZ, "yyyy-MM-dd'T'HH:mm:ss")
      : value;

  const [datePart, timePart] = (normalizedValue ?? "").split(/[T ]/);
  const [dateError, setDateError] = useState(false);
  const [timeError, setTimeError] = useState(false);

  const handleDateChange = (isoDate: string) => {
    setDateError(false);
    if (!isoDate) {
      onChange?.("");
      return;
    }
    onChange?.(timePart ? `${isoDate}T${timePart}` : isoDate);
  };

  const handleTimeChange = (time: string) => {
    setTimeError(false);
    const date = datePart ?? format(new Date(), "yyyy-MM-dd");
    onChange?.(`${date}T${time}`);
  };

  const handleDateBlur = (hasFormatError?: boolean) => {
    setDateError(!!hasFormatError);
    onBlur?.(!!hasFormatError || timeError);
  };

  const handleTimeBlur = (hasFormatError?: boolean) => {
    setTimeError(!!hasFormatError);
    onBlur?.(dateError || !!hasFormatError);
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
        <CustomDateInput
          ref={ref}
          value={datePart}
          onChange={handleDateChange}
          onBlur={handleDateBlur}
          hasError={hasError || dateError}
          disabled={disabled}
          readOnly={readonly}
        />
        <CustomTimeInput
          value={timePart}
          onChange={handleTimeChange}
          onBlur={handleTimeBlur}
          hasError={hasError || timeError}
          disabled={disabled}
          readOnly={readonly}
        />
      </div>
      {dateError && !disabled && !readonly && (
        <p className="text-xs text-destructive">{t("dateFormat")}</p>
      )}
      {timeError && !disabled && !readonly && (
        <p className="text-xs text-destructive">{t("timeFormat")}</p>
      )}
    </div>
  );
});
