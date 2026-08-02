import { Button } from "@/framework/components/ui/button";
import { Calendar } from "@/framework/components/ui/calendar";
import { Input } from "@/framework/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/framework/components/ui/popover";
import { cn } from "@/framework/lib/utils";
import { format, isValid, parse, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

const DISPLAY_FORMAT = "dd-MM-yyyy";

const startMonth = new Date(new Date().getFullYear() - 100, 0);
const endMonth = new Date(new Date().getFullYear() + 50, 11);

function toDisplayValue(isoValue: string | undefined): string {
  if (!isoValue) return "";
  const date = parseISO(isoValue);
  return isValid(date) ? format(date, DISPLAY_FORMAT) : "";
}

function fromDisplayValue(display: string): Date | null {
  if (display.length !== DISPLAY_FORMAT.length) return null;
  const date = parse(display, DISPLAY_FORMAT, new Date());
  return isValid(date) ? date : null;
}

interface DateInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "onBlur"
> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (hasFormatError?: boolean) => void;
  hasError?: boolean;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    "mode" | "selected" | "onSelect"
  >;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value,
      onChange,
      onBlur,
      disabled,
      hasError,
      className,
      calendarProps,
      readOnly,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(() =>
      toDisplayValue(value),
    );

    React.useEffect(() => {
      setInputValue(toDisplayValue(value));
    }, [value]);

    const selectedDate = value ? parseISO(value) : undefined;

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      const raw = e.target.value;
      setInputValue(raw);

      const date = fromDisplayValue(raw);
      if (date) {
        onChange?.(format(date, "yyyy-MM-dd"));
      } else if (raw === "") {
        onChange?.("");
      }
    }

    function handleInputBlur() {
      const date = fromDisplayValue(inputValue);
      if (!date && inputValue !== "") {
        onBlur?.(true);
      } else {
        setInputValue(toDisplayValue(value));
        onBlur?.(false);
      }
    }

    function handleCalendarSelect(date: Date | undefined) {
      if (!date || !isValid(date)) return;
      onChange?.(format(date, "yyyy-MM-dd"));
      setInputValue(format(date, DISPLAY_FORMAT));
      setOpen(false);
    }

    return (
      <div className={cn("flex gap-1", className)}>
        <Input
          ref={ref}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="dd-MM-yyyy"
          readOnly={readOnly}
          disabled={disabled}
          data-invalid={hasError}
          className={cn(
            "data-[invalid=true]:border-destructive data-[invalid=true]:focus-visible:border-destructive data-[invalid=true]:focus-visible:ring-destructive/20 dark:data-[invalid=true]:focus-visible:ring-destructive/40",
            readOnly && "bg-muted text-muted-foreground cursor-default",
          )}
          {...props}
        />
        {!(disabled || readOnly) && (
          <Popover open={open} onOpenChange={readOnly ? undefined : setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled || readOnly}
                className={cn("shrink-0", hasError && "border-destructive")}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                captionLayout="dropdown"
                mode="single"
                startMonth={startMonth}
                endMonth={endMonth}
                selected={selectedDate}
                defaultMonth={selectedDate ?? new Date()}
                onSelect={handleCalendarSelect}
                {...calendarProps}
              />
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const today = new Date();
                    onChange?.(format(today, "yyyy-MM-dd"));
                    setInputValue(format(today, DISPLAY_FORMAT));
                    setOpen(false);
                  }}
                >
                  Today
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  },
);
DateInput.displayName = "DateInput";

export { DateInput };
