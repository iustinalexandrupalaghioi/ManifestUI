import type { TableAction } from "@/framework/components/toolbar/Toolbar";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import type { ComponentType, ReactNode } from "react";
import type { DetailExtensionRef, OverviewExtensionRef } from "@/framework/extensions/registry";
import type { DataViewDefaults } from "../components/data-view/features/views/viewDefaults";
import type { SortRule } from "../components/data-view/core/tanstack-augmentations";
import type { DataViewFeaturesConfig } from "../components/data-view/core/features/catalog";
import type { DataTableConfig } from "../components/data-view/core/types";
import type {
  FilterInput,
  FilterRule,
} from "../components/data-view/features/filtering";
import type { FormConfig, SectionConfig } from "../components/form/types/types";
import type { TranslatableText } from "./i18n-types";
import type { ResourceActionConfig } from "../core/resource-action-config";

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
  pickupListColumnVisibility?: VisibilityState;
  listColumnVisibility?: VisibilityState;
  overviewSlots?: OverviewSlots<TItem>;
  renderOverview?: (props: OverviewRenderProps<TItem>) => ReactNode;
  detailSlots?: DetailSlots<TItem>;
  permissions?: ResourcePermissions;
  dataView?: {
    overview?: {
      features?: DataViewFeaturesConfig;
      defaultView?: DataViewDefaults;
      navigationView?: DataViewDefaults;
      navigationViewName?: TranslatableText;
    };
    pickup?: {
      features?: DataViewFeaturesConfig;
      defaultView?: DataViewDefaults;
      defaultViewName?: TranslatableText;
    };
    dataTable?: DataTableConfig;
  };
  add?: ResourceActionConfig;
  open?: ResourceActionConfig;
  delete?: ResourceActionConfig;
}

/** Each slot takes a render function or a registered overview component ref. */
export interface OverviewSlots<TItem> {
  beforeToolbar?: ((items: TItem[], total: number) => ReactNode) | OverviewExtensionRef;
  afterToolbar?: ((items: TItem[], total: number) => ReactNode) | OverviewExtensionRef;
  toolbarExtra?: ((selectedRows: TItem[]) => ReactNode) | OverviewExtensionRef;
  afterTable?: ((items: TItem[]) => ReactNode) | OverviewExtensionRef;
}

/** Each slot takes a render function or a registered detail component ref. */
export interface DetailSlots<TItem> {
  beforeForm?: ((item: TItem) => ReactNode) | DetailExtensionRef;
  afterForm?: ((item: TItem) => ReactNode) | DetailExtensionRef;
  afterTabs?: ((item: TItem) => ReactNode) | DetailExtensionRef;
  left?: ((item: TItem) => ReactNode) | DetailExtensionRef;
  right?: ((item: TItem) => ReactNode) | DetailExtensionRef;
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
