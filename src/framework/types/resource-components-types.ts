import type { TableAction } from "@/framework/components/toolbar/Toolbar";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { ComponentType, ReactNode } from "react";
import type { SortRule } from "../components/data-view/core/tanstack-augmentations";
import type {
  FilterInput,
  FilterRule,
} from "../components/data-view/features/filtering";
import type { FormConfig, SectionConfig } from "../components/form/types/types";
import type { TranslatableText } from "./i18n-types";

export interface FormProps<TItem, TFormValues> {
  item?: TItem;
  disabled?: boolean;
  readOnly?: boolean;
  layout?: "grid" | "stack";
  sections?: SectionConfig<TFormValues>[];
}

export interface ResourceColumnMeta<TItem> {
  getRowUrl?: (item: TItem) => string;
  onOpen: (item: TItem) => void;
  openDeleteDialog: (items: TItem[]) => void;
  isDeleteEligible: (item: TItem) => boolean;
  actions: TableAction<TItem>[];
}

export interface DialogConfig {
  className?: string;
}

export type PermissionValue = boolean | (() => boolean);

export interface ResourcePermissions {
  read?: PermissionValue;
  add?: PermissionValue;
  update?: PermissionValue;
  delete?: PermissionValue;
}

export interface ResourceComponentsConfig<TItem, TFormValues> {
  id: string;
  Form?: ComponentType<FormProps<TItem, TFormValues>>;
  AddForm?: ComponentType<FormProps<TItem, TFormValues>>;
  formConfig?: FormConfig<TFormValues>;
  createColumns?: (locale: string) => ColumnDef<TItem>[];
  createPickupColumns?: (
    onSelect: (item: TItem) => void,
    locale: string,
  ) => ColumnDef<TItem>[];
  overviewKey: string;
  defaultViewName: TranslatableText;
  getOverviewTitle?: (preFilters: FilterInput[]) => string;
  dialog?: DialogConfig;
  columnVisibility?: VisibilityState;
  navigationColumnVisibility?: VisibilityState;
  cardNavigationColumnVisibility?: VisibilityState;
  pickupColumnVisibility?: VisibilityState;
  listColumnVisibility?: VisibilityState;
  overviewSlots?: OverviewSlots<TItem>;
  renderOverview?: (props: OverviewRenderProps<TItem>) => ReactNode;
  detailSlots?: DetailSlots<TItem>;
  permissions?: ResourcePermissions;
  editable?: boolean;
}

export interface OverviewSlots<TItem> {
  beforeToolbar?: (items: TItem[], total: number) => ReactNode;
  afterToolbar?: (items: TItem[], total: number) => ReactNode;
  toolbarExtra?: (selectedRows: TItem[]) => ReactNode;
  afterTable?: (items: TItem[]) => ReactNode;
}

export interface DetailSlots<TItem> {
  beforeForm?: (item: TItem) => ReactNode;
  afterForm?: (item: TItem) => ReactNode;
  afterTabs?: (item: TItem) => ReactNode;
  left?: (item: TItem) => ReactNode;
  right?: (item: TItem) => ReactNode;
}

export interface OverviewRenderProps<TItem> {
  data: TItem[];
  total: number;
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  rowSelection: Record<string, boolean>;
  setRowSelection: (s: Record<string, boolean>) => void;
  selectedRows: TItem[];
  sorting: SortRule[];
  filters: FilterRule[];
  Table: ReactNode;
  ToolbarNode: ReactNode;
  AddDialogNode: ReactNode;
  DeleteDialogNode: ReactNode;
}
