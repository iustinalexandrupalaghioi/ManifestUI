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

  const createColumns = rawColumns
    ? typeof rawColumns === "function"
      ? rawColumns
      : isColumnConfig(rawColumns)
        ? (locale: string) =>
            createColumnsFromConfig<TItem>(rawColumns as ColumnConfig[], locale)
        : () => rawColumns as any
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
  const columnConfigs = isColumnConfig(rawColumns)
    ? (rawColumns as ColumnConfig[])
    : null;
  const pickupColumnConfigs = isColumnConfig(rawPickupColumns)
    ? (rawPickupColumns as ColumnConfig[])
    : null;

  const columnVisibility =
    config.list?.defaultVisibility ??
    (columnConfigs
      ? createVisibilityFromConfig(columnConfigs, "default")
      : undefined);

  const listColumnVisibility =
    config.list?.listColumnVisibility ??
    (columnConfigs
      ? createVisibilityFromConfig(columnConfigs, "card")
      : undefined);

  const navigationColumnVisibility =
    config.list?.navigationColumnVisibility ??
    (columnConfigs
      ? createVisibilityFromConfig(columnConfigs, "navigation")
      : undefined);

  const cardNavigationColumnVisibility =
    config.list?.cardNavigationColumnVisibility ??
    (columnConfigs
      ? createVisibilityFromConfig(columnConfigs, "card-navigation")
      : undefined);

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
