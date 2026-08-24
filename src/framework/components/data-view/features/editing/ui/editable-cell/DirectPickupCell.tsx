"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";
import { FieldRenderer } from "@/framework/components/form/form-register/FieldRenderer";
import { getResource } from "@/framework/registry/ResourceRegistry";
import type { FieldConfig } from "@/framework/components/form/types/types";

export function DirectPickupCell({
  field,
  resource,
  item,
  onOpenChange,
  onPick,
}: {
  field: FieldConfig<any>;
  resource: string;
  item: Record<string, unknown>;
  onOpenChange: (open: boolean) => void;
  onPick: (record: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  const entry = getResource(resource);
  const PickupDialog = entry?.components?.PickupDialog;

  const setOpenAndNotify = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };

  const bareField = { ...field, pickup: undefined } as FieldConfig<any>;

  return (
    <div className="flex min-w-0 items-center justify-between gap-1">
      <div className="min-w-0 flex-1">
        <FieldRenderer field={bareField} item={item} activeCols={1} />
      </div>
      {PickupDialog && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => setOpenAndNotify(true)}
        >
          <SearchIcon className="size-3.5" />
        </Button>
      )}
      {open && PickupDialog && (
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
