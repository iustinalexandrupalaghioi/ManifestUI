import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/framework/lib/utils"
import { Button } from "@/framework/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/framework/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/framework/components/ui/popover"
import type { Enum } from "@/framework/types/global/Enum"
import { Input } from "./input"

interface ComboboxProps {
  items: Enum[]
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  readOnly?: boolean
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  function Combobox(
    {
      items,
      value,
      onChange,
      placeholder = "Select…",
      className,
      disabled,
      readOnly,
    },
    ref
  ) {
    const [open, setOpen] = React.useState(false)

    return (
      <Popover
        modal={true}
        open={open && !readOnly}
        onOpenChange={(o) => !readOnly && setOpen(o)}
      >
        {readOnly ? (
          <Input
            value={
              value
                ? (items.find((item) => item.value === value)?.label ?? "")
                : ""
            }
            placeholder={placeholder}
            readOnly
            className={cn("w-full text-start", className)}
          />
        ) : (
          <PopoverTrigger asChild>
            <Button
              disabled={disabled}
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn("w-full justify-between", className)}
            >
              {value
                ? items.find((item) => item.value === value)?.label
                : placeholder}
              <ChevronsUpDown className="shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        )}

        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search..." className="h-9" />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup className="scrollbar-thumb-rounded scrollbar-thin max-h-60 w-full overflow-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80">
                {items.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={() => {
                      onChange &&
                        onChange(item.value === value ? "" : item.value)
                      setOpen(false)
                    }}
                    className="flex w-full items-center justify-between"
                  >
                    <span className="flex-1">{item.label}</span>
                    <Check
                      className={cn(
                        value === item.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)
