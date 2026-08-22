import type { DataViewFeature } from "../contracts";
import { viewsFeature } from "../../features/views/views.feature";
import { sortingFeature } from "../../features/sorting/sorting.feature";
import { selectionFeature } from "../../features/selection/selection.feature";
import { filteringFeature } from "../../features/filtering/filtering.feature";
import { aggregatesFeature } from "../../features/aggregates/aggregates.feature";
import { groupingFeature } from "../../features/grouping/grouping.feature";
import { editingFeature } from "../../features/editing/editing.feature";
import { listFeature } from "../../data-list/DataList.feature";
import { resizingFeature } from "../../features/resizing/resizing.feature";
import { pinningFeature } from "../../features/pinning/pinning.feature";
import { columnManagerFeature } from "../../features/columnManager/columnManager.feature";
import { quickSearchFeature } from "../../features/quickSearch/quickSearch.feature";
import { viewModeToggleFeature } from "../../features/viewModeToggle/viewModeToggle.feature";
import { openFeature } from "../../features/open/open.feature";

export type DataViewFeatureId =
  | "views"
  | "sorting"
  | "selection"
  | "filtering"
  | "aggregates"
  | "grouping"
  | "editing"
  | "list"
  | "resizing"
  | "pinning"
  | "columnManager"
  | "quickSearch"
  | "viewModeToggle"
  | "open";

export type DataViewFeaturesConfig = Partial<
  Record<DataViewFeatureId, boolean>
>;

export const FEATURE_CATALOG_ORDER: DataViewFeatureId[] = [
  "views",
  "sorting",
  "selection",
  "filtering",
  "aggregates",
  "grouping",
  "editing",
  "list",
  "resizing",
  "pinning",
  "columnManager",
  "quickSearch",
  "viewModeToggle",
  "open",
];

export const FEATURE_CATALOG: Record<DataViewFeatureId, DataViewFeature> = {
  views: viewsFeature,
  sorting: sortingFeature,
  selection: selectionFeature,
  filtering: filteringFeature,
  aggregates: aggregatesFeature,
  grouping: groupingFeature,
  editing: editingFeature,
  list: listFeature,
  resizing: resizingFeature,
  pinning: pinningFeature,
  columnManager: columnManagerFeature,
  quickSearch: quickSearchFeature,
  viewModeToggle: viewModeToggleFeature,
  open: openFeature,
};

export const DEFAULT_FEATURES: DataViewFeature[] = FEATURE_CATALOG_ORDER.map(
  (id) => FEATURE_CATALOG[id],
);
