import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/framework/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Enum } from "@/framework/types/global/Enum"
import { Input } from "@/components/ui/input"

interface ComboboxProps {
  items: Enum[]
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  readOnly?: boolean
}

export const CustomCombobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  function CustomCombobox(
    {
      items,
      value,
      onChange,
      placeholder,
      className,
      disabled,
      readOnly,
    },
    ref
  ) {
    const [open, setOpen] = React.useState(false)
    const t = useTranslations("DataView")
    const resolvedPlaceholder = placeholder ?? t("selectPlaceholder")

    // Only group when the caller actually provided groups — everything
    // else keeps rendering as a single flat list, unchanged.
    const hasGroups = items.some((item) => item.group)
    const groups = hasGroups
      ? items.reduce<Map<string, Enum[]>>((acc, item) => {
          const key = item.group ?? ""
          const list = acc.get(key) ?? []
          list.push(item)
          acc.set(key, list)
          return acc
        }, new Map())
      : null

    const renderItem = (item: Enum) => (
      <CommandItem
        key={item.value}
        value={item.label}
        onSelect={() => {
          onChange && onChange(item.value === value ? "" : item.value)
          setOpen(false)
        }}
        className="flex w-full items-center justify-between"
      >
        <span className="flex-1">{item.label}</span>
        <Check
          className={cn(value === item.value ? "opacity-100" : "opacity-0")}
        />
      </CommandItem>
    )

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
            placeholder={resolvedPlaceholder}
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
                : resolvedPlaceholder}
              <ChevronsUpDown className="shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        )}

        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={t("searchPlaceholder")} className="h-9" />
            <CommandList className="scrollbar-thumb-rounded scrollbar-thin max-h-60 w-full overflow-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80">
              <CommandEmpty>{t("noResultsFound")}</CommandEmpty>
              {groups
                ? Array.from(groups.entries()).map(([group, groupItems]) => (
                    <CommandGroup key={group} heading={group || undefined}>
                      {groupItems.map(renderItem)}
                    </CommandGroup>
                  ))
                : <CommandGroup>{items.map(renderItem)}</CommandGroup>}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)
