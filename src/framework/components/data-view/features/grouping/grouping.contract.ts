import type { GroupByRule } from "./grouping"

// Scoped to tableId:viewId, same as aggregates/filtering/sorting.
export interface GroupingFeatureApi {
  grouping: GroupByRule[]
  panelOpen: boolean
  setGrouping(grouping: GroupByRule[]): void
  openPanel(): void
  closePanel(): void
}
