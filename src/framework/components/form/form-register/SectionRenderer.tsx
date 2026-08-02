"use client";

import { cn } from "@/framework/lib/utils";
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { SectionConfig } from "../types/types";
import { FieldRenderer } from "./FieldRenderer";
import SectionCard from "../partials/SectionCard";
import { useContainerCols } from "../hooks/useContainerCols";

interface SectionRendererProps<TFormValues> {
  section: SectionConfig<TFormValues>;
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
  slots?: Record<string, ReactNode | (() => ReactNode)>;
}

const GRID_COLS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function SectionRenderer<TFormValues extends Record<string, any>>({
  section,
  item,
  disabled,
  readOnly,
  slots,
}: SectionRendererProps<TFormValues>) {
  const maxCols =
    section.type && section.type !== "fields"
      ? 1
      : ((section as any).cols ?? 1);

  const breakpoints = [
    { minWidth: 0, cols: 1 },
    { minWidth: 480, cols: Math.min(2, maxCols) },
    { minWidth: 720, cols: Math.min(3, maxCols) },
    { minWidth: 960, cols: Math.min(4, maxCols) },
  ];

  const { ref, cols } = useContainerCols(breakpoints);

  // `section.render` below used to get only the static `item` snapshot
  // passed into `ResourceForm` — unlike fields (see FieldRenderer), which
  // merge in `useWatch` so conditions react to live edits. That left `item`
  // permanently `undefined` on add screens (nothing is passed there) and
  // stale on edit screens once the user changed a field the section's
  // `render` depends on. Watching here and merging over `item` puts custom
  // sections on the same live-data footing as field-level conditions.
  const { control } = useFormContext<TFormValues>();
  const values = useWatch({ control });
  const context = { ...item, ...values } as Record<string, unknown>;

  if (section.type === "slot") {
    return <>{slots?.[section.name] ?? null}</>;
  }

  if (section.type === "custom") {
    const isHidden =
      typeof section.hidden === "function"
        ? section.hidden(context)
        : section.hidden;
    return isHidden ? null : <>{section.render(context)}</>;
  }

  const colsClass = GRID_COLS_CLASS[cols] ?? "grid-cols-1";

  const grid = (
    <div ref={ref} className={cn("grid gap-4", colsClass)}>
      {section.fields.map((field, i) => (
        <FieldRenderer<TFormValues>
          key={field.name ?? i}
          field={field}
          item={item}
          disabled={disabled}
          readOnly={readOnly}
          activeCols={cols}
        />
      ))}
    </div>
  );

  if (!section.title) {
    return <div className={section.className}>{grid}</div>;
  }

  return (
    <SectionCard title={section.title} className={section.className}>
      {grid}
    </SectionCard>
  );
}
