import type { ComponentType, ReactNode } from "react";
import type { FieldValues } from "react-hook-form";
import type { ZodType } from "zod";
import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import type {
  ActionFormConfig,
  BulkActionsHookResult,
  ResourceId,
  ResourceMutationFns,
} from "@/framework/types/resource-hook-types";
import type {
  DetailSlots,
  DialogConfig,
  OverviewRenderProps,
  OverviewSlots,
} from "@/framework/types/resource-components-types";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type {
  FieldTabConfig,
  TabConfig,
} from "@/framework/types/tab-config-type";
import type { SplitConfig } from "@/framework/types/split-config-type";
import type { Cursor } from "@/framework/types/pagination";
import type { FormConfig } from "../components/form/types/types";
import type { SortRule } from "../components/data-view/core/tanstack-augmentations";
import type {
  FilterInput,
  FilterRule,
} from "../components/data-view/features/filtering";
import type {
  AggregateResult,
  AggregateRule,
} from "../components/data-view/features/aggregates/aggregates";
import type {
  GroupAggregateRow,
  GroupByRule,
} from "../components/data-view/features/grouping/grouping";
import type { DataViewFeaturesConfig } from "../components/data-view/core/features/catalog";
import type { DataTableConfig } from "../components/data-view/core/types";
import type { ColumnConfig } from "../components/data-view/core/ui/createColumnsFromConfig";
import type { ActionResult } from "../lib/actionResult";
import type { ResourceActionConfig } from "../core/resource-action-config";

export type {
  OverviewSlots,
  DetailSlots,
} from "@/framework/types/resource-components-types";

// ── How the record opens/adds, and in what chrome ───────────────────────────
export interface ResourcePresentationConfig {
  open?: "dialog" | "page" | "split";
  add?: "dialog" | "page";
  split?: SplitConfig;
  dialog?: DialogConfig;
}

// ── Server I/O ────────────────────────────────────────────────────────────
export interface ResourceDataConfig<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
> {
  fetchList: (
    sorting: SortRule[],
    filters: FilterRule[],
    cursor: Cursor | null,
    groupBy: GroupByRule[],
  ) => Promise<
    ActionResult<{ items: TItem[]; total: number; nextCursor: Cursor | null }>
  >;
  pageSize?: number;
  fetchAggregates?: (
    rules: AggregateRule[],
    filters: FilterRule[],
  ) => Promise<ActionResult<AggregateResult>>;
  fetchGroupAggregates?: (
    rules: AggregateRule[],
    filters: FilterRule[],
    groupBy: GroupByRule[],
  ) => Promise<ActionResult<GroupAggregateRow[]>>;
  fetchDetail: (id: TId) => Promise<ActionResult<TItem>>;
  mutations: ResourceMutationFns<TFormValues, TId>;
}

// ── RHF/zod ───────────────────────────────────────────────────────────────
export interface ResourceFormConfig<TItem, TFormValues extends FieldValues> {
  schema: ZodType<TFormValues, any, any>;
  emptyValues: TFormValues;
  layout?: FormConfig<TFormValues>;
  addLayout?: FormConfig<TFormValues>;
  component?: ComponentType<{ item?: TItem; disabled?: boolean }>;
  addTabs?: FieldTabConfig<TFormValues>[];
}

// ── Detail page/dialog only ──────────────────────────────────────────────
export interface ResourceDetailConfig<TItem, TFormValues extends FieldValues> {
  tabs?: TabConfig<TItem, TFormValues>[];
  relations?: RelationConfig<TItem, any, any>[];
  defaultTab?: string;
  slots?: DetailSlots<TItem>;
  defaultFormOpen?: boolean;
}

// ── Beyond plain CRUD ─────────────────────────────────────────────────────
export interface ResourceActionsConfig<TItem> {
  forms?: ActionFormConfig<TItem, any>[];
  bulk?: () => BulkActionsHookResult<TItem>;
  isDeleteEligible?: (item: TItem) => boolean;
  getRowUrl?: (item: TItem) => string;
}

// ── Grid/table + lookup display ──────────────────────────────────────────
export interface ResourceDataViewOverviewConfig<TItem> {
  dataTableColumns: ColumnConfig[];
  dataListColumns?: ColumnConfig[];
  // "open"/"delete" are configured via the top-level open/delete fields on
  // DefinedResourceConfig instead — see ResourceActionConfig.
  features?: Omit<DataViewFeaturesConfig, "open">;
  slots?: OverviewSlots<TItem>;
  render?: (props: OverviewRenderProps<TItem>) => ReactNode;
  title?: (preFilters: FilterInput[]) => string;
}

export interface ResourceDataViewPickupConfig {
  dataTableColumns?: ColumnConfig[];
  dataListColumns?: ColumnConfig[];
  features?: DataViewFeaturesConfig;
}

export interface ResourceDataViewConfig<TItem> {
  overview: ResourceDataViewOverviewConfig<TItem>;
  pickup?: ResourceDataViewPickupConfig;
  dataTable?: DataTableConfig;
}

export interface DefinedResourceConfig<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
> {
  descriptor: ResourceDescriptor;
  idField?: keyof TItem & string;

  presentation?: ResourcePresentationConfig;
  data: ResourceDataConfig<TItem, TFormValues, TId>;
  form: ResourceFormConfig<TItem, TFormValues>;
  detail?: ResourceDetailConfig<TItem, TFormValues>;
  actions?: ResourceActionsConfig<TItem>;
  dataView: ResourceDataViewConfig<TItem>;
  // Each accepts a plain boolean (on/off everywhere it could appear) or a
  // { toolbar?, row? } object narrowing specific surfaces — "row" means
  // the overview's context menu / card-item menu (and, for "open" only,
  // also the row chevron and row click). "toolbar" covers every toolbar
  // the resource renders: overview, embedded/nav, and the detail page's
  // own toolbar. "add" has no row surface, so its `row` field is unused.
  add?: ResourceActionConfig;
  open?: ResourceActionConfig;
  delete?: ResourceActionConfig;
}
