"use client";

import { useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";
import { resolveOptions } from "@/framework/lib/resolveLabel";
import type { FieldConfig } from "@/framework/components/form/types/types";

export function DirectComboboxCell({
  field,
  onOpenChange,
  onPick,
}: {
  field: Extract<FieldConfig<any>, { type: "combobox" }>;
  onOpenChange: (open: boolean) => void;
  onPick: (optionValue: string) => void;
}) {
  const t = useTranslations("DataView");
  const locale = useLocale();
  const { control } = useFormContext();
  const value = useWatch({ control, name: field.name });
  const options = resolveOptions(field.options, locale) ?? [];
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const setOpenAndNotify = (next: boolean) => {
    if (next && !open) setQuery("");
    setOpen(next);
    onOpenChange(next);
  };

  const commitValue = (optionValue: string) => {
    setOpenAndNotify(false);
    onPick(optionValue);
  };

  return (
    <Command className="contents">
      <Popover open={open} onOpenChange={setOpenAndNotify}>
        <div className="flex min-w-0 items-center gap-1">
          <PopoverAnchor asChild>
            <CommandPrimitive.Input
              value={open ? query : selectedLabel}
              onFocus={() => setOpenAndNotify(true)}
              onValueChange={(v) => {
                setQuery(v);
                if (!open) {
                  setOpen(true);
                  onOpenChange(true);
                }
              }}
            />
          </PopoverAnchor>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => setOpenAndNotify(!open)}
          >
            <ChevronsUpDownIcon className="size-3.5" />
          </Button>
        </div>
        <PopoverContent
          className="w-56 p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <CommandList className="max-h-60 overflow-auto">
            <CommandEmpty className="py-2 text-center text-xs">
              {t("noResultsFound")}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => commitValue(option.value)}
                >
                  <span className="flex-1">{option.label}</span>
                  <CheckIcon
                    className={cn(
                      "size-3.5",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </PopoverContent>
      </Popover>
    </Command>
  );
}
