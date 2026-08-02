"use client"

import { useMemo, useState } from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/framework/components/ui/popover"
import { Button } from "@/framework/components/ui/button"
import { Clock } from "lucide-react"
import React from "react"
import { cn } from "@/framework/lib/utils"

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  intervalMinutes?: number
  disabled?: boolean
  className?: string
}

export const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  function TimePicker(
    { value, onChange, intervalMinutes = 15, disabled, className },
    ref
  ) {
    const [open, setOpen] = useState(false)

    const times = useMemo(() => {
      const interval = Number(intervalMinutes) || 15 // force number
      return Array.from({ length: Math.ceil((24 * 60) / interval) }, (_, i) => {
        const totalMinutes = i * interval
        const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0")
        const minutes = String(totalMinutes % 60).padStart(2, "0")
        return `${hours}:${minutes}`
      })
    }, [intervalMinutes])

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            disabled={disabled}
            className={cn("justify-between text-sm", className)}
          >
            <span>{value || "Select time"}</span>
            <Clock className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-40 p-0">
          <div className="scrollbar-thin max-h-64 overflow-y-auto scrollbar-thumb-accent scrollbar-track-transparent">
            {times.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onChange(t)
                  setOpen(false)
                }}
                className={`w-full rounded-md px-3 py-2 text-left transition ${
                  t === value
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)
