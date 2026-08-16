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
  const detailFormConfig = config.form;
  const addFormConfig = config.addForm ?? config.form;

  const Form =
    config.Form ??
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
    config.Form ??
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

  // ── Columns — support ColumnConfig[] or legacy function/array ────────────
  const isColumnConfig = (cols: any): cols is ColumnConfig[] =>
    Array.isArray(cols) && cols.length > 0 && "field" in cols[0];

  const rawColumns = config.list?.columns ?? config.columns;
  const rawListColumns = config.listColumns;

  const buildColumnsFn = (raw: typeof rawColumns) =>
    raw
      ? typeof raw === "function"
        ? raw
        : isColumnConfig(raw)
          ? (locale: string) =>
              createColumnsFromConfig<TItem>(raw as ColumnConfig[], locale)
          : () => raw as any
      : undefined;

  const createTableColumnsFn = buildColumnsFn(rawColumns);
  const createListColumnsFn = buildColumnsFn(rawListColumns);

  // Table and list share one TanStack table instance (for row selection /
  // actions), so both column sets must land in the single `columns` array
  // DataView is built from. A field authored in both configs (the common
  // case) keeps the table version's ColumnDef — accessor/cell/size stay
  // table-driven — but list-only meta (group/groupLabel/inlineLabel/
  // labelPosition) is merged in from the list config, since that's the
  // only place it's authored. A field exclusive to `listColumns` is
  // appended as its own column, hidden from table mode via the visibility
  // maps below.
  const createColumns =
    createTableColumnsFn || createListColumnsFn
      ? (locale: string) => {
          const tableCols: ColumnDef<TItem>[] = createTableColumnsFn?.(locale) ?? [];
          const listCols: ColumnDef<TItem>[] = createListColumnsFn?.(locale) ?? [];
          const listById = new Map(listCols.map((c) => [c.id, c]));
          const merged = tableCols.map((c) => {
            const listCol = c.id ? listById.get(c.id) : undefined;
            if (!listCol) return c;
            listById.delete(c.id!);
            return { ...c, meta: { ...c.meta, ...listCol.meta } };
          });
          return [...merged, ...listById.values()];
        }
      : undefined;

  // ── Pickup columns ────────────────────────────────────────────────────────
  const rawPickupColumns = config.list?.pickupColumns ?? config.pickupColumns;

  const createPickupColumns = rawPickupColumns
    ? typeof rawPickupColumns === "function"
      ? rawPickupColumns
      : isColumnConfig(rawPickupColumns)
        ? (_onSelect: (item: TItem) => void, locale: string) =>
            createColumnsFromConfig<TItem>(
              rawPickupColumns as ColumnConfig[],
              locale,
            )
        : (onSelect: (item: TItem) => void) =>
            (rawPickupColumns as any)(onSelect)
    : undefined;

  // ── Visibility — auto-generate from ColumnConfig or use manual ───────────
  const tableColumnConfigs = isColumnConfig(rawColumns)
    ? (rawColumns as ColumnConfig[])
    : null;
  const listColumnConfigs = isColumnConfig(rawListColumns)
    ? (rawListColumns as ColumnConfig[])
    : null;
  const pickupColumnConfigs = isColumnConfig(rawPickupColumns)
    ? (rawPickupColumns as ColumnConfig[])
    : null;

  // Computes visibility for one view's own config, then explicitly hides
  // any field that belongs exclusively to the other view — otherwise a
  // field absent from a VisibilityState defaults to visible in TanStack,
  // and it would leak across views.
  const computeVisibility = (
    own: ColumnConfig[] | null,
    other: ColumnConfig[] | null,
    mode: "default" | "navigation",
  ) => {
    if (!own) return undefined;
    const visibility = createVisibilityFromConfig(own, mode);
    for (const col of other ?? []) {
      if (!(col.field in visibility)) visibility[col.field] = false;
    }
    return visibility;
  };

  const columnVisibility =
    config.list?.defaultVisibility ??
    computeVisibility(tableColumnConfigs, listColumnConfigs, "default");

  const navigationColumnVisibility =
    config.list?.navigationColumnVisibility ??
    computeVisibility(tableColumnConfigs, listColumnConfigs, "navigation");

  const listColumnVisibility =
    config.list?.listColumnVisibility ??
    computeVisibility(listColumnConfigs, tableColumnConfigs, "default");

  const cardNavigationColumnVisibility =
    config.list?.cardNavigationColumnVisibility ??
    computeVisibility(listColumnConfigs, tableColumnConfigs, "navigation");

  const pickupColumnVisibility =
    config.list?.pickupColumnVisibility ??
    (pickupColumnConfigs
      ? createVisibilityFromConfig(pickupColumnConfigs, "pickup")
      : undefined);

  const addTabs = config.addTabs ?? [];

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

  // Always derived from the resource's own id against RBAC data — see
  // src/framework/authorization for the schema this reads from. Not
  // author-settable (see ComponentsFieldsWithDifferentAuthoringShape in
  // define-resource-type.ts): every resource is gated the same way, with no
  // way to accidentally bypass it.
  const permissions: ResourcePermissions = {
    read: () => hasPermission(`${config.id}:read`),
    add: () => hasPermission(`${config.id}:add`),
    update: () => hasPermission(`${config.id}:update`),
    delete: () => hasPermission(`${config.id}:delete`),
  };

  const componentsConfig: ResourceComponentsConfig<TItem, TFormValues> = {
    id: config.id,
    Form,
    AddForm,
    createColumns,
    createPickupColumns,
    formConfig: addFormConfig,
    overviewKey: config.overviewKey,
    defaultViewName: config.defaultViewName,
    getOverviewTitle: config.getOverviewTitle,
    dialog: {
      className:
        config.dialog?.className ?? getDefaultDialogClassName(detailFormConfig),
    },
    columnVisibility,
    pickupColumnVisibility,
    navigationColumnVisibility,
    cardNavigationColumnVisibility,
    listColumnVisibility,
    overviewSlots: config.overviewSlots,
    renderOverview: config.renderOverview,
    detailSlots: config.detailSlots,
    permissions,
    editable: config.editable,
  };

  const components = createResourceComponents(hooks, componentsConfig, addTabs);

  registerResource(config.id, {
    hooks,
    LookupDialog: components.LookupDialog,
    components: {
      Overview: components.Overview,
      AddPage: components.AddPage,
      AddDialog: components.AddDialog,
      DetailPage: components.DetailPage,
      DetailDialog: components.DetailDialog,
      LookupDialog: components.LookupDialog,
    },
  });

  return { components, config };
}
