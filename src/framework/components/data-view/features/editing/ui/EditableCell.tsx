"use client";

import { useEffect, useRef, useState } from "react";
import type { Cell } from "@tanstack/react-table";
import {
  Controller,
  FormProvider,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { Command as CommandPrimitive } from "cmdk";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";
import { FieldRenderer } from "@/framework/components/form/form-register/FieldRenderer";
import { getPickupConfig } from "@/framework/components/form/lib/flattenFormFields";
import { resolveDisplayValue } from "@/framework/components/form/hooks/useLookupfield";
import { resolveOptions } from "@/framework/lib/resolveLabel";
import { toastError } from "@/framework/lib/toast";
import { getResource } from "@/framework/registry/ResourceRegistry";
import { getStorageHandler } from "@/framework/components/files";
import {
  FileCategoryIcon,
  getMimeTypeFromPath,
} from "@/framework/components/files/components/FileUtils";
import type { FieldConfig } from "@/framework/components/form/types/types";
import { useDataViewCore } from "../../../core/stores/DataViewProvider";
import { getEditingStore } from "../editing.store";
import { isFieldEditableForRow } from "../editing.contract";
import type { EditableFieldMeta } from "../../../core/tanstack-augmentations";

interface EditableCellProps {
  cell: Cell<any, unknown>;
}

const SELECTABLE_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "tel",
  "password",
]);

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

function buildPickupFields(
  pickup: NonNullable<ReturnType<typeof getPickupConfig>>,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    [pickup.targetField]: record[pickup.mapField],
  };
  pickup.fillFields?.forEach((f) => {
    fields[f.from] = resolveDisplayValue(f, record);
  });
  if (pickup.embeddedField) {
    fields[pickup.embeddedField] = record;
  }
  return fields;
}

function formatFillFieldValue(
  fillField: { type?: string },
  value: unknown,
  t: (key: string) => string,
): string {
  if (fillField.type === "switch") return value ? t("yes") : t("no");
  return String(value ?? "");
}

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
    if (
      el instanceof HTMLTextAreaElement ||
      (el instanceof HTMLInputElement && SELECTABLE_INPUT_TYPES.has(el.type))
    ) {
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
        ? formatFillFieldValue(
            meta.fillField,
            seedItem[meta.fillField.from],
            tCommon,
          )
        : meta.field.type === "switch"
          ? seedItem[fieldName]
            ? tCommon("yes")
            : tCommon("no")
          : String(seedItem[fieldName] ?? "");
    content = <span className="truncate text-muted-foreground">{label}</span>;
  } else if (meta.kind === "pickup") {
    const pendingLabel = pending?.[meta.fillField.from];
    const currentLabel = formatFillFieldValue(
      meta.fillField,
      pendingLabel !== undefined ? pendingLabel : cell.getValue(),
      tCommon,
    );
    content = (
      <PickupCell
        owningField={meta.owningField}
        currentLabel={currentLabel}
        onOpenChange={handlePopupOpenChange}
        onPick={(record) => {
          const pickup = getPickupConfig(meta.owningField)!;
          store
            .getState()
            .commitCellEdit(rowId, buildPickupFields(pickup, record));
        }}
      />
    );
  } else if (meta.kind === "direct" && getPickupConfig(meta.field)) {
    const pickup = getPickupConfig(meta.field)!;
    content = (
      <DirectPickupCell
        field={meta.field}
        resource={pickup.resource}
        item={seedItem}
        onOpenChange={handlePopupOpenChange}
        onPick={(record) => {
          store
            .getState()
            .commitCellEdit(rowId, buildPickupFields(pickup, record));
        }}
      />
    );
  } else if (meta.kind === "direct" && meta.field.type === "combobox") {
    content = (
      <DirectComboboxCell
        field={meta.field}
        onOpenChange={handlePopupOpenChange}
        onPick={(optionValue) => {
          store
            .getState()
            .commitCellEdit(rowId, { [meta.field.name]: optionValue });
        }}
      />
    );
  } else if (meta.kind === "direct" && meta.field.type === "select") {
    content = (
      <DirectSelectCell
        field={meta.field}
        onOpenChange={handlePopupOpenChange}
      />
    );
  } else if (meta.kind === "direct" && meta.field.type === "file") {
    content = (
      <DirectFileCell
        field={meta.field}
        value={seedItem[meta.field.name] as string | undefined}
        onChange={(path) => {
          store.getState().commitCellEdit(rowId, { [meta.field.name]: path });
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

function DirectSelectCell({
  field,
  onOpenChange,
}: {
  field: Extract<FieldConfig<any>, { type: "select" }>;
  onOpenChange: (open: boolean) => void;
}) {
  const locale = useLocale();
  const { control } = useFormContext();
  const options = resolveOptions(field.options, locale) ?? [];

  return (
    <Controller
      control={control}
      name={field.name}
      render={({ field: rhfField }) => (
        <Select
          value={rhfField.value ?? ""}
          onValueChange={rhfField.onChange}
          onOpenChange={onOpenChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
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

function DirectPickupCell({
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
  const LookupDialog = entry?.components?.LookupDialog;

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
      {LookupDialog && (
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
      {open && LookupDialog && (
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

function DirectComboboxCell({
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

function DirectFileCell({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldConfig<any>, { type: "file" }>;
  value: string | undefined;
  onChange: (path: string) => void;
}) {
  const t = useTranslations("Files");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const filename = value ? (value.split("/").pop() ?? undefined) : undefined;
  const mimeType = value ? getMimeTypeFromPath(value) : undefined;
  const previewUrl = value
    ? getStorageHandler().getPublicUrl({ bucket: field.bucket, path: value })
    : null;

  const removeExisting = async () => {
    if (!value) return;
    try {
      await getStorageHandler().remove({ bucket: field.bucket, path: value });
    } catch {
      /* file may not exist */
    }
  };

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      await removeExisting();
      const result = await getStorageHandler().upload(file, {
        bucket: field.bucket,
        path: `${crypto.randomUUID()}/${file.name}`,
      });
      onChange(result.path);
    } catch {
      toastError(t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await removeExisting();
      onChange("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-1">
      {previewUrl && filename ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-muted-foreground hover:underline"
        >
          <FileCategoryIcon
            mimeType={mimeType ?? "application/octet-stream"}
            className="size-3 shrink-0"
          />
          <span className="truncate" title={filename}>
            {filename}
          </span>
        </a>
      ) : (
        <span className="min-w-0 flex-1 truncate text-muted-foreground">—</span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <UploadIcon className="size-3.5" />
        )}
      </Button>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
          disabled={busy}
          onClick={handleDelete}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={field.accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}
