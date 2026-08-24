// Single import point for everything a feature's config/* files need from the
// framework's type layer. Import from "@/framework/types" instead of reaching
// into individual files (define-resource-type, resource-hook-types, ...) —
// those still exist because DefinedResourceConfig is assembled from them, but
// nothing outside framework/core should need to know that split.

export type {
  DefinedResourceConfig,
  ResourcePresentationConfig,
  ResourceDataConfig,
  ResourceFormConfig,
  ResourceDetailConfig,
  ResourceActionsConfig,
  ResourceDataViewConfig,
  ResourceDataViewOverviewConfig,
  ResourceDataViewPickupConfig,
  OverviewSlots,
  DetailSlots,
} from "./define-resource-type";

export type {
  ResourceActionConfig,
  ResourceActionSurfaces,
} from "../core/resource-action-config";

export type {
  ResourceConfig,
  ResourceRoutes,
  ResourceLabels,
  ResourceMutationFns,
  ResourceActions,
  ActionFormConfig,
  BulkActionsHookResult,
} from "./resource-hook-types";

export type {
  ResourceComponentsConfig,
  FormProps,
  DialogConfig,
  PermissionValue,
  ResourcePermissions,
  OverviewRenderProps,
} from "./resource-components-types";

export type { RelationConfig, ChildResource } from "./relation-config-type";
export type { SplitConfig } from "./split-config-type";
export type {
  FormConfig,
  FormLayoutConfig,
  ColumnLayout,
  SectionConfig,
  FieldConfig,
  BaseField,
  PickupConfig,
} from "../components/form/types/types";
export type { ColumnConfig } from "../components/data-view/core/ui/createColumnsFromConfig";
export type { TabConfig, FieldTabConfig, TabRenderContext } from "./tab-config-type";
export type { AppError } from "./global/AppError";
export type { Enum } from "./global/Enum";
export type { Cursor } from "./pagination";
