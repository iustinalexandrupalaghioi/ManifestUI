import type { TableAction } from "@/framework/components/toolbar/Toolbar";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type {
  FieldTabConfig,
  TabConfig,
} from "@/framework/types/tab-config-type";
import type { FieldValues } from "react-hook-form";
import type { ZodType } from "zod";
import type { SortRule } from "../components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "../components/data-view/features/filtering";
import type { FormConfig } from "../components/form/types/types";
import {
  ActionResult,
  BulkActionFailure,
  BulkActionResult,
} from "../lib/actionResult";
import type { Cursor } from "./pagination";
import { ReactNode } from "react";

export type ResourceId = number | string;

export interface ResourceRoutes {
  list: string;
  add: string;
  detail: (id: string) => string;
}

export interface ResourceLabels {
  singular: string;
  plural: string;
  new: string;
}

// Result of a per-id transactional action (see runPerId/runWithProgress):
// each id in the request either succeeded or failed independently.
export interface PerIdResult {
  succeededIds: string[];
  failures: BulkActionFailure[];
}

export interface ResourceMutationFns<
  TFormValues,
  TId extends ResourceId = number,
> {
  add: (data: TFormValues) => Promise<ActionResult<TId>>;
  update: (id: TId, data: TFormValues) => Promise<ActionResult<void>>;
  delete: (ids: TId[]) => Promise<ActionResult<PerIdResult>>;
}

export interface BulkActionsHookResult<TItem> {
  actions: TableAction<TItem>[];
  bulkResult: BulkActionResult | null;
  clearBulkResult: () => void;
  confirmDialog?: ReactNode;
}

export interface ResourceConfig<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
> {
  id: string;
  idField?: keyof TItem & string;
  queryKey: readonly string[];
  schema: ZodType<TFormValues, any, any>;
  emptyValues: TFormValues;
  noun: string;
  routes: ResourceRoutes;
  labels: ResourceLabels;
  openMode?: "dialog" | "page";
  addMode?: "dialog" | "page";
  fetchList: (
    sorting: SortRule[],
    filters: FilterRule[],
    cursor: Cursor | null,
  ) => Promise<
    ActionResult<{ items: TItem[]; total: number; nextCursor: Cursor | null }>
  >;
  pageSize?: number;
  isDeleteEligible?: (item: TItem) => boolean;
  getRowUrl?: (item: TItem) => string;
  bulkActions?: () => BulkActionsHookResult<TItem>;
  fetchDetail: (id: TId) => Promise<ActionResult<TItem>>;
  afterAdd?: (id: TId, data: TFormValues) => Promise<void>;
  afterUpdate?: (id: TId, data: TFormValues) => Promise<void>;
  mutationFns: ResourceMutationFns<TFormValues, TId>;
  tabs?: TabConfig<TItem, TFormValues>[];
  relations?: RelationConfig<TItem, any, any>[];
  defaultTab?: string;
  defaultFormOpen?: boolean;
  addTabs?: FieldTabConfig<TFormValues>[];
  actionForms?: ActionFormConfig<TItem, any>[];
}

export interface ResourceActions<TItem> {
  actions: TableAction<TItem>[];
  getRowUrl?: (item: TItem) => string;
  onOpen: (item: TItem) => void;
  isDeleteEligible: (item: TItem) => boolean;
  bulkResult: BulkActionResult | null;
  clearBulkResult: () => void;
  confirmDialog?: ReactNode;
}

export interface ActionFormConfig<TItem, TFormValues> {
  key: string;
  label: React.ReactNode;
  title: string;
  successMessage: string;
  form: FormConfig<TFormValues> | ((item: TItem) => FormConfig<TFormValues>);
  actionSchema: ZodType<TFormValues, any, any>;
  actionEmptyValues: TFormValues | ((item: TItem) => TFormValues);
  useSubmit: () => (items: TItem[], data: TFormValues) => Promise<void>;
  isEligible?: (item: TItem) => boolean;
  singleOnly?: boolean;
}
