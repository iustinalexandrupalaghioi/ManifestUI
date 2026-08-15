import type { ColumnDef } from "@tanstack/react-table";
import type { ComponentType } from "react";
import type { FieldValues } from "react-hook-form";
import type {
  ResourceConfig,
  ResourceId,
} from "@/framework/types/resource-hook-types";
import type {
  DialogConfig,
  ResourceComponentsConfig,
} from "@/framework/types/resource-components-types";
import type { FormConfig } from "../components/form/types/types";
import type { Enum } from "@/framework/types/global/Enum";
import type { ColumnType } from "../components/data-view/features/filtering";
import type { ColumnConfig } from "../components/data-view/core/ui/createColumnsFromConfig";

// Re-exported for backwards-compatible import paths — canonical definitions
// live in resource-components-types.ts, alongside ResourceComponentsConfig,
// which is what actually carries them through the factory pipeline.
export type {
  OverviewSlots,
  DetailSlots,
} from "@/framework/types/resource-components-types";

export type ColumnInput<TItem> = string | ColumnDef<TItem>;

export interface CardField<TItem> {
  key: keyof TItem & string;
  label?: string;
  type?: ColumnType;
  options?: Enum[];
  bucket?: string;
  format?: (value: unknown, item: TItem) => string;
}

export interface ListConfig<TItem> {
  columns: ((params: any) => ColumnDef<TItem>[]) | ColumnInput<TItem>[];
  pickupColumns?:
    | ((onSelect: (item: TItem) => void) => ColumnDef<TItem>[])
    | ColumnInput<TItem>[];
  defaultVisibility?: Record<string, boolean>;
  pickupColumnVisibility?: Record<string, boolean>;
  navigationColumnVisibility?: Record<string, boolean>;
  cardNavigationColumnVisibility?: Record<string, boolean>;
  listColumnVisibility?: Record<string, boolean>;
  cardFields?: CardField<TItem>[];
}

type ComponentsFieldsWithDifferentAuthoringShape =
  | "Form"
  | "AddForm"
  | "createColumns"
  | "createPickupColumns"
  | "columnVisibility"
  | "pickupColumnVisibility"
  // Not author-settable: permissions are always derived from the resource's
  // own `id` against RBAC data (see defineResourceComponents), never
  // hand-written per resource.
  | "permissions";

export interface DefinedResourceConfig<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>
  extends
    ResourceConfig<TItem, TFormValues, TId>,
    Omit<
      ResourceComponentsConfig<TItem, TFormValues>,
      ComponentsFieldsWithDifferentAuthoringShape
    > {
  id: string;

  form?: FormConfig<TFormValues>;

  addForm?: FormConfig<TFormValues>;
  dialog?: DialogConfig;

  Form?: ComponentType<{ item?: TItem; disabled?: boolean }>;

  list?: ListConfig<TItem>;

  columns?: ColumnConfig[];

  listColumns?: ColumnConfig[];

  pickupColumns?: ColumnConfig[];
}
