"use client";

import { useEffect, useRef, useState } from "react";
import type { Cell } from "@tanstack/react-table";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";
import { FieldRenderer } from "@/framework/components/form/form-register/FieldRenderer";
import { getPickupConfig } from "@/framework/components/form/lib/flattenFormFields";
import { resolveDisplayValue } from "@/framework/components/form/hooks/useLookupfield";
import { getResource } from "@/framework/registry/ResourceRegistry";
import type { FieldConfig } from "@/framework/components/form/types/types";
import { useDataViewCore } from "../../../core/stores/DataViewProvider";
import { getEditingStore } from "../editing.store";
import { isFieldEditableForRow } from "../editing.contract";
import type { EditableFieldMeta } from "../../../core/tanstack-augmentations";

interface EditableCellProps {
  cell: Cell<any, unknown>;
}

const FIELD_WRAPPER_CLASS = cn(
  "flex h-full w-full min-w-0 items-center px-1 text-xs",
  "[&_input]:!h-auto [&_input]:!min-h-0 [&_input]:!w-full [&_input]:!rounded-none [&_input]:!border-0",
  "[&_input]:!bg-transparent [&_input]:!p-0 [&_input]:!text-xs [&_input]:!shadow-none [&_input]:!ring-0",
  "[&_input]:!outline-none",
  "[&_textarea]:!h-auto [&_textarea]:!min-h-0 [&_textarea]:!w-full [&_textarea]:!resize-none [&_textarea]:!rounded-none",
  "[&_textarea]:!border-0 [&_textarea]:!bg-transparent [&_textarea]:!p-0 [&_textarea]:!text-xs",
  "[&_textarea]:!shadow-none [&_textarea]:!ring-0 [&_textarea]:!outline-none",
  "[&_textarea]:![field-sizing:fixed]",
  "[&_textarea]:!overflow-x-auto [&_textarea]:!overflow-y-hidden [&_textarea]:!whitespace-nowrap",
  "[&_textarea]:!scrollbar-none",
  "[&_[data-slot=select-trigger]]:!h-auto [&_[data-slot=select-trigger]]:!w-full",
  "[&_[data-slot=select-trigger]]:!rounded-none [&_[data-slot=select-trigger]]:!border-0",
  "[&_[data-slot=select-trigger]]:!bg-transparent [&_[data-slot=select-trigger]]:!p-0",
  "[&_[data-slot=select-trigger]]:!text-xs [&_[data-slot=select-trigger]]:!shadow-none",
  "[&_[data-slot=select-trigger]]:!ring-0",
  "[&_label]:!hidden [&_p]:!hidden",
);

export function EditableCell({ cell }: EditableCellProps) {
  const tCommon = useTranslations("Common");
  const { table, tableId } = useDataViewCore();
  const store = getEditingStore(tableId);
  const seed = store((s) => s.editingCell?.seed);

  const rowId = cell.row.id;
  const meta = cell.column.columnDef.meta!.editableField!;
  const pending = store((s) => s.pendingEdits[rowId]);
  const seedItem = {
    ...(cell.row.original as Record<string, unknown>),
    ...pending,
  };

  const { useDetailForm } = table.options.meta!;
  const { form } = useDetailForm!(seedItem as any);

  const containerRef = useRef<HTMLDivElement>(null);
  const cancelledRef = useRef(false);

  const popupOpenRef = useRef(false);

  const fieldName =
    meta.kind === "direct"
      ? meta.field.name
      : getPickupConfig(meta.owningField)!.targetField;

  const editableNow = isFieldEditableForRow(meta, seedItem);

  useEffect(() => {
    if (!editableNow) return;

    if (seed !== undefined) {
      form.setValue(fieldName, seed, { shouldDirty: true, shouldTouch: true });
    }

    const popupTrigger = containerRef.current?.querySelector<HTMLElement>(
      "[aria-haspopup], [role='combobox']",
    );
    if (popupTrigger) {
      popupTrigger.click();
      return;
    }

    const el = containerRef.current?.querySelector<HTMLElement>(
      "input, select, button, textarea",
    );
    if (el instanceof HTMLTextAreaElement) {
      el.rows = 1;
    }
    el?.focus();
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, []);

  const commit = () => {
    const dirty = Object.keys(form.formState.dirtyFields);
    if (dirty.length === 0) {
      store.getState().stopEditing();
      return;
    }
    const values = form.getValues() as Record<string, unknown>;
    const fields: Record<string, unknown> = {};
    dirty.forEach((name) => {
      fields[name] = values[name];
    });
    store.getState().commitCellEdit(rowId, fields);
  };

  const checkStillFocused = () => {
    if (cancelledRef.current || popupOpenRef.current) return;
    const active = document.activeElement;
    if (active && containerRef.current?.contains(active)) return;
    if (active?.closest("[data-radix-popper-content-wrapper]")) return;
    commit();
  };

  const handleBlur = () => {
    setTimeout(checkStillFocused, 0);
  };

  const handlePopupOpenChange = (open: boolean) => {
    popupOpenRef.current = open;
    if (!open) requestAnimationFrame(checkStillFocused);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      cancelledRef.current = true;
      store.getState().stopEditing();
      return;
    }

    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      commit();
    }
  };

  let content: React.ReactNode;
  if (!editableNow) {
    const label =
      meta.kind === "pickup"
        ? String(seedItem[meta.fillField.from] ?? "")
        : meta.field.type === "switch"
          ? seedItem[fieldName]
            ? tCommon("yes")
            : tCommon("no")
          : String(seedItem[fieldName] ?? "");
    content = <span className="truncate text-muted-foreground">{label}</span>;
  } else if (meta.kind === "pickup") {
    const pendingLabel = pending?.[meta.fillField.from];
    const currentLabel =
      pendingLabel !== undefined
        ? String(pendingLabel)
        : String(cell.getValue() ?? "");
    content = (
      <PickupCell
        owningField={meta.owningField}
        currentLabel={currentLabel}
        onOpenChange={handlePopupOpenChange}
        onPick={(record) => {
          const pickup = getPickupConfig(meta.owningField)!;
          const fields: Record<string, unknown> = {
            [pickup.targetField]: record[pickup.mapField],
          };
          pickup.fillFields?.forEach((f) => {
            fields[f.from] = resolveDisplayValue(f, record);
          });
          store.getState().commitCellEdit(rowId, fields);
        }}
      />
    );
  } else if (meta.field.type === "switch") {
    content = (
      <BooleanSelect
        name={meta.field.name}
        onOpenChange={handlePopupOpenChange}
      />
    );
  } else if (meta.field.type === "custom") {
    const fallback: FieldConfig<any> = {
      type: "input",
      name: meta.field.name,
      label:
        typeof meta.field.label === "string"
          ? meta.field.label
          : meta.field.name,
    };
    content = <FieldRenderer field={fallback} item={seedItem} activeCols={1} />;
  } else {
    content = (
      <FieldRenderer field={meta.field} item={seedItem} activeCols={1} />
    );
  }

  return (
    <FormProvider {...form}>
      <div
        ref={containerRef}
        className={FIELD_WRAPPER_CLASS}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 flex-1">{content}</div>
      </div>
    </FormProvider>
  );
}

function BooleanSelect({
  name,
  onOpenChange,
}: {
  name: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Common");
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          value={field.value ? "true" : "false"}
          onValueChange={(v) => field.onChange(v === "true")}
          onOpenChange={onOpenChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">{t("yes")}</SelectItem>
            <SelectItem value="false">{t("no")}</SelectItem>
          </SelectContent>
        </Select>
      )}
    />
  );
}

function PickupCell({
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
  const LookupDialog = entry?.components?.LookupDialog;

  const setOpenAndNotify = (next: boolean) => {
    setOpen(next);
    onOpenChange(next);
  };

  if (!LookupDialog)
    return <span className="min-w-0 truncate">{currentLabel}</span>;

  return (
    <div className="flex min-w-0 items-center gap-1">
      <span className="min-w-0 truncate">{currentLabel}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-5 shrink-0"
        onClick={() => setOpenAndNotify(true)}
      >
        <SearchIcon className="size-3.5" />
      </Button>
      {open && (
        <LookupDialog
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
