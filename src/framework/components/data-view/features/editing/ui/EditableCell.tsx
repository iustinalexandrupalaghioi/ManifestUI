"use client";

import { useEffect, useRef } from "react";
import type { Cell } from "@tanstack/react-table";
import { FormProvider } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FieldRenderer } from "@/framework/components/form/form-register/FieldRenderer";
import { getPickupConfig } from "@/framework/components/form/lib/flattenFormFields";
import type { FieldConfig } from "@/framework/components/form/types/types";
import { useDataViewCore } from "../../../core/stores/DataViewProvider";
import { getEditingStore } from "../editing.store";
import { isFieldEditableForRow } from "../editing.contract";
import {
  SELECTABLE_INPUT_TYPES,
  FIELD_WRAPPER_CLASS,
  buildPickupFields,
  formatFillFieldValue,
} from "./editable-cell/helpers";
import { BooleanSelect } from "./editable-cell/BooleanSelect";
import { DirectSelectCell } from "./editable-cell/DirectSelectCell";
import { PickupCell } from "./editable-cell/PickupCell";
import { DirectPickupCell } from "./editable-cell/DirectPickupCell";
import { DirectComboboxCell } from "./editable-cell/DirectComboboxCell";
import { DirectFileCell } from "./editable-cell/DirectFileCell";

interface EditableCellProps {
  cell: Cell<any, unknown>;
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
