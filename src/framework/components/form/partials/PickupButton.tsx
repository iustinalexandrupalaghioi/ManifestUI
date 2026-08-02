import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { SearchIcon } from "lucide-react";
import { Button } from "@/framework/components/ui/button";
import { getResource } from "@/framework/registry/ResourceRegistry";
import type { PickupFillField } from "../types/types";
import { DisplayFieldRenderer } from "../form-register/LookupFieldRenderer";

interface PickupButtonProps {
  resource: string;
  mapField: string;
  targetField: string;
  fillFields?: PickupFillField[];
  item?: Record<string, unknown>;
}

export function PickupButton({
  resource,
  mapField,
  targetField,
  fillFields,
  item,
}: PickupButtonProps) {
  const [open, setOpen] = useState(false);
  const [displayValues, setDisplayValues] = useState<Record<string, unknown>>(
    {},
  );
  const { setValue, watch } = useFormContext();

  const entry = getResource(resource);
  const LookupDialog = entry?.components?.LookupDialog;

  const targetValue = watch(targetField);
  const hasTarget = !!targetValue && targetValue !== 0 && targetValue !== "";

  const shouldFetch = !item && hasTarget;
  const detailResult = entry?.hooks?.useDetail?.(
    shouldFetch ? targetValue : undefined,
  );

  const hasAutofilledRef = useRef(false);

  useEffect(() => {
    if (!item || !fillFields?.length) return;
    const initial: Record<string, unknown> = {};
    fillFields
      .filter((f) => f.readonly)
      .forEach(({ from }) => {
        if (item[from] !== undefined) initial[from] = item[from];
      });
    if (Object.keys(initial).length) setDisplayValues(initial);
  }, []);

  useEffect(() => {
    if (item || hasAutofilledRef.current) return;
    if (!detailResult?.data || detailResult.isLoading) return;
    if (!fillFields?.length) return;

    hasAutofilledRef.current = true;
    const record = detailResult.data as Record<string, unknown>;
    const newDisplayValues: Record<string, unknown> = {};

    fillFields.forEach((f) => {
      if (f.readonly) {
        newDisplayValues[f.from] = record[f.from];
      } else if (f.to) {
        setValue(f.to, record[f.from], {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    });

    if (Object.keys(newDisplayValues).length) {
      setDisplayValues((prev) => ({ ...prev, ...newDisplayValues }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, detailResult?.data, detailResult?.isLoading, fillFields]);

  if (!LookupDialog) return null;

  const handleSelect = (record: Record<string, unknown>) => {
    // Fill main target field
    setValue(targetField, record[mapField], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    const newDisplayValues: Record<string, unknown> = {};

    fillFields?.forEach((f) => {
      if (f.readonly) {
        // Display only — store for rendering
        newDisplayValues[f.from] = record[f.from];
      } else if (f.to) {
        // Editable — write to form
        setValue(f.to, record[f.from], {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    });

    if (Object.keys(newDisplayValues).length)
      setDisplayValues(newDisplayValues);
    setOpen(false);
  };

  const readonlyFields =
    fillFields?.filter(
      (f): f is Extract<PickupFillField, { readonly: true }> => !!f.readonly,
    ) ?? [];
  const hasDisplayValues = Object.keys(displayValues).length > 0;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title={`Pick from ${resource}`}
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4" />
      </Button>
      {open && (
        <LookupDialog
          open={open}
          setOpen={setOpen}
          onSelect={handleSelect as any}
        />
      )}
      {readonlyFields.length > 0 && hasDisplayValues && (
        <div className="col-span-full mt-2 grid grid-cols-3 gap-3">
          {readonlyFields.map((df) => (
            <DisplayFieldRenderer
              key={df.from}
              field={df}
              value={displayValues[df.from]}
            />
          ))}
        </div>
      )}
    </>
  );
}
