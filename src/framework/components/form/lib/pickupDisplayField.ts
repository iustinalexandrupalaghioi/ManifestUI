"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { getResource } from "../../../registry/ResourceRegistry";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { EnumOptions } from "@/framework/lib/resolveLabel";

export interface DisplayField<TRelated = any> {
  from: string;
  label: TranslatableText;
  span?: number;
  type?:
    | "input"
    | "switch"
    | "combobox"
    | "select"
    | "textarea"
    | "date"
    | "time"
    | "datetime"
    | "json";
  options?: EnumOptions;
  targetField?: string;
  maxRows?: number;
  accessorFn?: (record: TRelated) => unknown;
}

// Resolves a display value from a record, preferring accessorFn (for nested
// or computed values) and falling back to a plain `record[from]` lookup.
export function resolveDisplayValue<TRelated>(
  field: Pick<DisplayField<TRelated>, "from" | "accessorFn">,
  record: TRelated | Record<string, unknown> | null | undefined,
): unknown {
  if (!record) return undefined;
  return field.accessorFn
    ? field.accessorFn(record as TRelated)
    : (record as Record<string, unknown>)[field.from];
}

interface UseLookupFieldOptions<TRelated> {
  fieldName: string;
  resourceId: string;
  displayFields?: DisplayField<TRelated>[];
}

export function useLookupField<TRelated extends { id: number }>({
  fieldName,
  resourceId,
  displayFields = [],
}: UseLookupFieldOptions<TRelated>) {
  const { watch, setValue } = useFormContext();
  const currentId = watch(fieldName) as number | null | undefined;

  const entry = getResource<TRelated>(resourceId);

  const [selected, setSelected] = useState<TRelated | null>(null);
  const [cleared, setCleared] = useState(false);

  const queryResult = entry?.hooks.useDetail(currentId ?? undefined);
  const fetchedRecord = queryResult?.data;
  const isLoading = queryResult?.isLoading ?? false;

  useEffect(() => {
    if (cleared) return;
    if (fetchedRecord && !selected) {
      setSelected(fetchedRecord as TRelated);
    }
  }, [fetchedRecord, cleared]);

  const displayRecord = cleared ? null : (selected ?? fetchedRecord ?? null);

  const handleSelect = (record: TRelated) => {
    setSelected(record);
    setCleared(false);
    setValue(fieldName, record.id, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleClear = () => {
    setSelected(null);
    setCleared(true);
    setValue(fieldName, 0, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
    return () => {
      setSelected(null);
      setCleared(false);
    };
  }, []);

  return {
    displayRecord,
    isLoading,
    handleSelect,
    handleClear,
    displayFields,
    LookupDialog: entry?.LookupDialog,
  };
}
