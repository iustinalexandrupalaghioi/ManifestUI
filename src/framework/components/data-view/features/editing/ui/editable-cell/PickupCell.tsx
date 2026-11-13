"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { getPickupConfig } from "@/framework/components/form/lib/flattenFormFields";
import { getResource } from "@/framework/registry/ResourceRegistry";
import type { FieldConfig } from "@/framework/components/form/types/types";

export function PickupCell({
  owningField,
  currentLabel,
  onOpenChange,
  onPick,
}: {
  owningField: FieldConfig<any>;
  currentLabel: string;
  onOpenChange: (open: boolean) => void;
  onPick: (record: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickup = getPickupConfig(owningField)!;
  const entry = getResource(pickup.resource);
  const PickupDialog = entry?.components?.PickupDialog;

  const setOpenAndNotify = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };

  if (!PickupDialog)
    return <span className="min-w-0 truncate">{currentLabel}</span>;

  return (
    <div className="flex min-w-0 items-center justify-between gap-1">
      <span className="min-w-0 truncate">{currentLabel}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setOpenAndNotify(true)}
      >
        <SearchIcon className="size-3.5" />
      </Button>
      {open && (
        <PickupDialog
          open={open}
          setOpen={setOpenAndNotify}
          onSelect={(record: Record<string, unknown>) => {
            setOpenAndNotify(false);
            onPick(record);
          }}
        />
      )}
    </div>
  );
}
