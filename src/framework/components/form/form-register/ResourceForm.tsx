"use client";

import { cn } from "@/framework/lib/utils";
import type { ReactNode } from "react";
import type { FormConfig, ColumnLayout, SectionConfig } from "../types/types";
import { SectionRenderer } from "./SectionRenderer";
import { useContainerCols } from "../hooks/useContainerCols";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ResourceFormProps<TFormValues> {
  config: FormConfig<TFormValues>;
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
  slots?: Record<string, ReactNode | (() => ReactNode)>;
  layout?: "grid" | "stack";
  sections?: SectionConfig<TFormValues>[];
}

// ─── ResourceForm ─────────────────────────────────────────────────────────────

export function ResourceForm<TFormValues extends Record<string, any>>({
  config,
  item,
  disabled,
  readOnly,
  slots,
  layout: layoutOverride,
  sections,
}: ResourceFormProps<TFormValues>) {
  const className = config.className ?? "max-w-7xl";

  if (sections) {
    return (
      <StackLayout<TFormValues>
        sections={sections}
        item={item}
        disabled={disabled}
        readOnly={readOnly}
        slots={slots}
        className={className}
      />
    );
  }

  const effectiveLayout =
    layoutOverride === "stack"
      ? ({ mode: "stack", sections: flattenSections(config.layout) } as const)
      : config.layout;

  return effectiveLayout.mode === "stack" ? (
    <StackLayout<TFormValues>
      sections={effectiveLayout.sections}
      item={item}
      disabled={disabled}
      readOnly={readOnly}
      slots={slots}
      className={className}
    />
  ) : (
    <GridLayout<TFormValues>
      cols={effectiveLayout.cols}
      areas={effectiveLayout.areas}
      columns={effectiveLayout.columns}
      item={item}
      disabled={disabled}
      readOnly={readOnly}
      slots={slots}
      className={className}
    />
  );
}

// ─── Layouts ──────────────────────────────────────────────────────────────────

function StackLayout<TFormValues extends Record<string, any>>({
  sections,
  item,
  disabled,
  readOnly,
  slots,
  className,
}: {
  sections: SectionConfig<TFormValues>[];
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
  slots?: Record<string, ReactNode | (() => ReactNode)>;
  className: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {sections.map((section, i) => (
        <SectionRenderer<TFormValues>
          key={
            "name" in section
              ? section.name
              : "title" in section
                ? section.title
                : i
          }
          section={section}
          item={item}
          disabled={disabled}
          readOnly={readOnly}
          slots={slots}
        />
      ))}
    </div>
  );
}

function GridLayout<TFormValues extends Record<string, any>>({
  cols,
  areas,
  columns,
  item,
  disabled,
  readOnly,
  slots,
  className,
}: {
  cols: number;
  areas: string;
  columns: ColumnLayout<TFormValues>[];
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
  slots?: Record<string, ReactNode | (() => ReactNode)>;
  className: string;
}) {
  // Measure the whole form's width to decide side-by-side vs stacked,
  // instead of relying on viewport or CSS container queries.
  const { ref, cols: layoutCols } = useContainerCols([
    { minWidth: 0, cols: 1 },
    { minWidth: 900, cols: 2 },
  ]);

  const sideBySide = layoutCols === 2;

  if (!sideBySide) {
    return (
      <div ref={ref} className={className}>
        <div className="flex flex-col gap-6">
          {columns.map((col, i) => (
            <div key={i} className="flex flex-col gap-6">
              {col.sections.map((section, j) => (
                <SectionRenderer<TFormValues>
                  key={
                    "name" in section
                      ? section.name
                      : "title" in section
                        ? section.title
                        : j
                  }
                  section={section}
                  item={item}
                  disabled={disabled}
                  readOnly={readOnly}
                  slots={slots}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateAreas: areas,
        }}
      >
        {columns.map((col, i) => {
          const area =
            typeof col.column === "string" ? col.column : `col${col.column}`;
          return (
            <div
              key={i}
              style={{ gridArea: area }}
              className="flex flex-col gap-6"
            >
              {col.sections.map((section, j) => (
                <SectionRenderer<TFormValues>
                  key={
                    "name" in section
                      ? section.name
                      : "title" in section
                        ? section.title
                        : j
                  }
                  section={section}
                  item={item}
                  disabled={disabled}
                  readOnly={readOnly}
                  slots={slots}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenSections<TFormValues extends Record<string, any>>(
  layout: FormConfig<TFormValues>["layout"],
): SectionConfig<TFormValues>[] {
  if (layout.mode === "stack") return layout.sections;
  return layout.columns.flatMap((col) => col.sections);
}
