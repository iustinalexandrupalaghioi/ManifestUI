import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import { getResource } from "@/framework/registry/ResourceRegistry";

import type { BaseField, FieldConfig, PickupFillField } from "../types/types";
import { DisplayFieldRenderer } from "../form-register/LookupFieldRenderer";
import { resolveDisplayValue } from "../hooks/useLookupfield";
import {
  isBasicFieldConfig,
  renderFieldInput,
} from "./renderFieldInput";
// ─── Types ────────────────────────────────────────────────────────────────────

type FieldConfigWithPickup<TFormValues> = Extract<
  FieldConfig<TFormValues>,
  BaseField<TFormValues>
> & {
  pickup: NonNullable<BaseField<TFormValues>["pickup"]>;
};

interface FieldWithPickupProps<TFormValues> {
  field: FieldConfigWithPickup<TFormValues>;
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
  className: string;
  activeCols?: number;
  locale: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function usePickupRecord(
  targetField: string,
  resource: string,
  mapField: string,
  embeddedField: string | undefined,
  item?: Record<string, unknown>,
) {
  const { watch } = useFormContext();
  const targetValue = watch(targetField);

  const entry = getResource(resource);
  const useDetail = entry?.hooks?.useDetail;

  const hasTarget = !!targetValue && targetValue !== 0 && targetValue !== "";

  const embeddedRecord = embeddedField
    ? (item?.[embeddedField] as Record<string, unknown> | undefined)
    : undefined;

  const canUseEmbedded =
    hasTarget &&
    item?.[targetField] === targetValue &&
    !!embeddedRecord &&
    embeddedRecord[mapField] === targetValue;

  const detailResult = useDetail?.(
    hasTarget && !canUseEmbedded ? targetValue : undefined,
  );

  const rawRecord = detailResult?.data as Record<string, unknown> | undefined;

  const isFresh = rawRecord ? rawRecord[mapField] === targetValue : false;

  const selectedRecord: Record<string, unknown> | null = !hasTarget
    ? null
    : canUseEmbedded
      ? (embeddedRecord ?? null)
      : detailResult?.isLoading || !isFresh
        ? null
        : (rawRecord ?? null);

  return { selectedRecord, targetValue, hasTarget, entry };
}

// ─── Field renderer ───────────────────────────────────────────────────────────

// Delegates to the same renderFieldInput used by FieldRenderer, instead of
// keeping a second copy of the type switch here. Previously this local copy
// had drifted from FieldRenderer's — e.g. it dropped `readOnly` for
// select/textarea/input, so a readonly+pickup field silently stopped
// rendering as readonly. Going through one function makes that class of bug
// structurally impossible.
function renderPickupField<TFormValues>(
  field: FieldConfigWithPickup<TFormValues>,
  disabled: boolean | undefined,
  readOnly: boolean | undefined,
  className: string,
  locale: string,
) {
  if (!isBasicFieldConfig(field)) return null;
  return renderFieldInput(field, { disabled, readOnly, className, locale });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FieldWithPickup<TFormValues>({
  field,
  item,
  disabled,
  readOnly,
  className,
  activeCols,
  locale,
}: FieldWithPickupProps<TFormValues>) {
  const [open, setOpen] = useState(false);
  const { setValue, getValues } = useFormContext();
  const pickup = field.pickup;

  const { selectedRecord, targetValue, hasTarget, entry } = usePickupRecord(
    pickup.targetField,
    pickup.resource,
    pickup.mapField,
    pickup.embeddedField,
    item,
  );

  const LookupDialog = entry?.components?.LookupDialog;
  const readonlyFields =
    pickup.fillFields?.filter(
      (f): f is Extract<PickupFillField, { readonly: true }> => !!f.readonly,
    ) ?? [];

  const lastFilledValueRef = useRef<unknown>(undefined);
  const prevHasTargetRef = useRef(hasTarget);

  const isFirstFillRef = useRef(true);

  useEffect(() => {
    const wasTarget = prevHasTargetRef.current;
    prevHasTargetRef.current = hasTarget;

    if (!hasTarget) {
      lastFilledValueRef.current = undefined;

      if (wasTarget) {
        // A real clear (target had a value, now it doesn't) — wipe dependent fields.
        pickup.fillFields?.forEach((f) => {
          if (f.readonly || !f.to) return;
          setValue(f.to, "", { shouldDirty: true, shouldTouch: true });
        });
        isFirstFillRef.current = false;
      }

      return;
    }

    if (!selectedRecord) return;
    if (lastFilledValueRef.current === targetValue) return;

    lastFilledValueRef.current = targetValue;

    const isInitialFill = isFirstFillRef.current;
    isFirstFillRef.current = false;

    pickup.fillFields?.forEach((f) => {
      if (f.readonly || !f.to) return;

      if (isInitialFill) {
        const currentValue = getValues(f.to);
        const isEmpty =
          currentValue === undefined ||
          currentValue === null ||
          currentValue === "" ||
          currentValue === 0;
        if (!isEmpty) return;
      }

      setValue(f.to, resolveDisplayValue(f, selectedRecord), {
        shouldDirty: !isInitialFill,
        shouldTouch: true,
      });
    });
  }, [targetValue, hasTarget, selectedRecord]);

  const handleSelect = (record: Record<string, unknown>) => {
    setValue(pickup.targetField, record[pickup.mapField], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    pickup.fillFields?.forEach((f) => {
      if (!f.readonly && f.to) {
        setValue(f.to, resolveDisplayValue(f, record), {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    });

    lastFilledValueRef.current = record[pickup.mapField];
    isFirstFillRef.current = false;
    setOpen(false);
  };

  const resolvedPreFilters = open
    ? typeof pickup.preFilters === "function"
      ? pickup.preFilters(getValues() as TFormValues)
      : pickup.preFilters
    : undefined;

  return (
    <>
      <div className={cn("flex items-start gap-1", className)}>
        <div className="flex-1">
          {renderPickupField(field, disabled, readOnly, className, locale)}
        </div>
        {LookupDialog && !disabled && !readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-5 shrink-0"
            onClick={() => setOpen(true)}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {readonlyFields.map((df) => (
        <DisplayFieldRenderer
          key={df.from}
          field={df}
          value={resolveDisplayValue(df, selectedRecord)}
          activeCols={activeCols}
        />
      ))}

      {LookupDialog && open && (
        <LookupDialog
          open={open}
          setOpen={setOpen}
          onSelect={handleSelect as any}
          preFilters={resolvedPreFilters}
        />
      )}
    </>
  );
}
