import type { ColumnDef } from "@tanstack/react-table";
import type { FieldValues } from "react-hook-form";
import { ResourceForm } from "../components/form/form-register/ResourceForm";
import { registerResource } from "../registry/ResourceRegistry";
import type { DefinedResourceConfig } from "../types/define-resource-type";
import type {
  ResourceComponentsConfig,
  ResourcePermissions,
} from "../types/resource-components-types";
import type { ResourceId } from "../types/resource-hook-types";
import type { FormConfig, SectionConfig } from "../components/form/types/types";
import type { ResourceHooks } from "./hooks/create-resource-hooks";
import { createResourceComponents } from "./factory/create-resource-components";
import { hasPermission } from "@/framework/authorization/cache/permissions";
import {
  createColumnsFromConfig,
  createVisibilityFromConfig,
  type ColumnConfig,
} from "../components/data-view/core/ui/createColumnsFromConfig";

export function defineResourceComponents<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  hooks: ResourceHooks<TItem, TFormValues, TId>,
  config: DefinedResourceConfig<TItem, TFormValues, TId>,
) {
  const detailFormConfig = config.form.layout;
  const addFormConfig = config.form.addLayout ?? config.form.layout;

  const Form =
    config.form.component ??
    (detailFormConfig
      ? ({
          item,
          disabled,
          readOnly,
          layout,
          sections,
        }: {
          item?: TItem;
          disabled?: boolean;
          readOnly?: boolean;
          layout?: "grid" | "stack";
          sections?: SectionConfig<TFormValues>[];
        }) => (
          <ResourceForm
            config={detailFormConfig}
            item={item as Record<string, unknown>}
            disabled={disabled}
            readOnly={readOnly}
            layout={layout}
            sections={sections}
          />
        )
      : undefined);

  const AddForm =
    config.form.component ??
    (addFormConfig
      ? ({
          item,
          disabled,
          readOnly,
          layout,
          sections,
        }: {
          item?: TItem;
          disabled?: boolean;
          readOnly?: boolean;
          layout?: "grid" | "stack";
          sections?: SectionConfig<TFormValues>[];
        }) => (
          <ResourceForm
            config={addFormConfig}
            item={item as Record<string, unknown>}
            disabled={disabled}
            readOnly={readOnly}
            layout={layout}
            sections={sections}
          />
        )
      : undefined);

  // ── Columns ────────────────────────────────────────────────────────────
  const isColumnConfig = (cols: any): cols is ColumnConfig[] =>
    Array.isArray(cols) && cols.length > 0 && "field" in cols[0];

  const rawColumns = config.dataView.overview.dataTableColumns;
  const rawListColumns = config.dataView.overview.dataListColumns;
  const rawPickupColumns = config.dataView.pickup?.dataTableColumns;
  const rawPickupListColumns = config.dataView.pickup?.dataListColumns;

  const buildColumnsFn = (raw: ColumnConfig[] | undefined) =>
    raw
      ? typeof raw === "function"
        ? raw
        : isColumnConfig(raw)
          ? (locale: string) =>
              createColumnsFromConfig<TItem>(raw as ColumnConfig[], locale)
          : () => raw as any
      : undefined;

  const mergeByColumnId = <T extends ColumnDef<TItem>>(
    tableCols: T[],
    listCols: T[],
  ) => {
    const listById = new Map(listCols.map((c) => [c.id, c]));
    const merged = tableCols.map((c) => {
      const listCol = c.id ? listById.get(c.id) : undefined;
      if (!listCol) return c;
      listById.delete(c.id!);
      return { ...c, meta: { ...c.meta, ...listCol.meta } };
    });
    return [...merged, ...listById.values()];
  };

  const createTableColumnsFn = buildColumnsFn(rawColumns);
  const createListColumnsFn = buildColumnsFn(rawListColumns);

  const createColumns =
    createTableColumnsFn || createListColumnsFn
      ? (locale: string) =>
          mergeByColumnId(
            createTableColumnsFn?.(locale) ?? [],
            createListColumnsFn?.(locale) ?? [],
          )
      : undefined;

  const buildPickupColumnsFn = (raw: ColumnConfig[] | undefined) =>
    raw
      ? typeof raw === "function"
        ? raw
        : isColumnConfig(raw)
          ? (_onSelect: (item: TItem) => void, locale: string) =>
              createColumnsFromConfig<TItem>(raw as ColumnConfig[], locale)
          : (onSelect: (item: TItem) => void) => (raw as any)(onSelect)
      : undefined;

  const createPickupTableColumnsFn = buildPickupColumnsFn(rawPickupColumns);
  const createPickupListColumnsFn = buildPickupColumnsFn(rawPickupListColumns);

  const createPickupColumns =
    createPickupTableColumnsFn || createPickupListColumnsFn
      ? (onSelect: (item: TItem) => void, locale: string) =>
          mergeByColumnId(
            createPickupTableColumnsFn?.(onSelect, locale) ?? [],
            createPickupListColumnsFn?.(onSelect, locale) ?? [],
          )
      : undefined;

  // ── Visibility — always auto-derived from ColumnConfig ────────────────────
  const tableColumnConfigs = isColumnConfig(rawColumns)
    ? (rawColumns as ColumnConfig[])
    : null;
  const listColumnConfigs = isColumnConfig(rawListColumns)
    ? (rawListColumns as ColumnConfig[])
    : null;
  const pickupColumnConfigs = isColumnConfig(rawPickupColumns)
    ? (rawPickupColumns as ColumnConfig[])
    : null;
  const pickupListColumnConfigs = isColumnConfig(rawPickupListColumns)
    ? (rawPickupListColumns as ColumnConfig[])
    : null;

  const computeVisibility = (
    own: ColumnConfig[] | null,
    other: ColumnConfig[] | null,
    mode: "default" | "navigation" | "pickup",
  ) => {
    if (!own) return undefined;
    const visibility = createVisibilityFromConfig(own, mode);
    for (const col of other ?? []) {
      if (!(col.field in visibility)) visibility[col.field] = false;
    }
    return visibility;
  };

  const columnVisibility = computeVisibility(
    tableColumnConfigs,
    listColumnConfigs,
    "default",
  );
  const navigationColumnVisibility = computeVisibility(
    tableColumnConfigs,
    listColumnConfigs,
    "navigation",
  );
  const listColumnVisibility = computeVisibility(
    listColumnConfigs,
    tableColumnConfigs,
    "default",
  );
  const cardNavigationColumnVisibility = computeVisibility(
    listColumnConfigs,
    tableColumnConfigs,
    "navigation",
  );
  const pickupColumnVisibility = computeVisibility(
    pickupColumnConfigs,
    pickupListColumnConfigs,
    "pickup",
  );
  const pickupListColumnVisibility = computeVisibility(
    pickupListColumnConfigs,
    pickupColumnConfigs,
    "pickup",
  );

  const addTabs = config.form.addTabs ?? [];

  const dialogWidths = {
    1: "sm:max-w-lg",
    2: "sm:max-w-3xl",
    3: "sm:max-w-5xl",
    default: "sm:max-w-7xl",
  } as const;

  function getDefaultDialogClassName(form?: FormConfig<any>) {
    if (!form) return dialogWidths.default;

    if (form.layout.mode !== "stack") {
      return dialogWidths.default;
    }

    const maxCols = Math.max(
      ...form.layout.sections.map((section) =>
        "cols" in section ? (section.cols ?? 1) : 1,
      ),
    );

    return (
      dialogWidths[maxCols as keyof typeof dialogWidths] ?? dialogWidths.default
    );
  }

  const resourceId = config.descriptor.id;

  const permissions: ResourcePermissions = {
    read: () => hasPermission(`${resourceId}:read`),
    add: () => hasPermission(`${resourceId}:add`),
    update: () => hasPermission(`${resourceId}:update`),
    delete: () => hasPermission(`${resourceId}:delete`),
  };

  const componentsConfig: ResourceComponentsConfig<TItem, TFormValues> = {
    id: resourceId,
    Form,
    AddForm,
    createColumns,
    createPickupColumns,
    formConfig: addFormConfig,
    overviewKey: config.descriptor.overviewKey,
    defaultViewName: config.descriptor.defaultViewName,
    getOverviewTitle: config.dataView.overview.title,
    dialog: {
      className:
        config.presentation?.dialog?.className ??
        getDefaultDialogClassName(detailFormConfig),
    },
    columnVisibility,
    pickupColumnVisibility,
    pickupListColumnVisibility,
    navigationColumnVisibility,
    cardNavigationColumnVisibility,
    listColumnVisibility,
    overviewSlots: config.dataView.overview.slots,
    renderOverview: config.dataView.overview.render,
    detailSlots: config.detail?.slots,
    permissions,
    dataView: {
      overview: { features: config.dataView.overview.features },
      pickup: { features: config.dataView.pickup?.features },
      dataTable: config.dataView.dataTable,
    },
    add: config.add,
    open: config.open,
    delete: config.delete,
  };

  const components = createResourceComponents(hooks, componentsConfig, addTabs);

  registerResource(resourceId, {
    hooks,
    PickupDialog: components.PickupDialog,
    components: {
      Overview: components.Overview,
      AddPage: components.AddPage,
      AddDialog: components.AddDialog,
      DetailPage: components.DetailPage,
      DetailDialog: components.DetailDialog,
      PickupDialog: components.PickupDialog,
    },
  });

  return { components, config };
}
