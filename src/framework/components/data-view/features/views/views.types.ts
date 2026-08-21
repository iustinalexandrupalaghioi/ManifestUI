import type {
  ColumnSizingState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import type { FilterRule } from "../filtering/filters";
import type { AggregateRule } from "../aggregates/aggregates";
import type { GroupByRule } from "../grouping/grouping";

/**
 * TableViewRecord
 *
 * A named view for table mode. Owns its own sort and filter state —
 * these are never shared with list views.
 */
export interface TableViewRecord {
  id: string;
  name: string;
  type: "table";
  // Table layout state
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
  columnOrder: string[];
  columnPinning: { left: string[] };
  // Table data state — independent from list view data state
  sorting: SortingState;
  filters: FilterRule[];
  aggregates: AggregateRule[];
  grouping: GroupByRule[];
}

/**
 * ListViewRecord
 *
 * A named view for list mode. Owns its own sort and filter state —
 * these are never shared with table views.
 */
export interface ListViewRecord {
  id: string;
  name: string;
  type: "list";
  // List layout state
  listColumnVisibility: VisibilityState;
  listColumnOrder: string[];
  // List data state — independent from table view data state
  sorting: SortingState;
  filters: FilterRule[];
  aggregates: AggregateRule[];
  grouping: GroupByRule[];
}

export type ViewRecord = TableViewRecord | ListViewRecord;

/**
 * PersistedViewState
 *
 * The shape written to storage. Two completely separate lists — one for
 * table views, one for list views. The old mixed shape (one list with both
 * table and list fields on every record) is gone.
 */
export interface PersistedViewState {
  tableViews: {
    activeViewId: string;
    views: TableViewRecord[];
  };
  listViews: {
    activeViewId: string;
    views: ListViewRecord[];
  };
}

export const DEFAULT_TABLE_VIEW_ID = "__default_table__";
export const DEFAULT_LIST_VIEW_ID = "__default_list__";
