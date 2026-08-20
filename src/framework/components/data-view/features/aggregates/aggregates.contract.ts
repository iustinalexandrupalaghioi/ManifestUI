import type { AggregateRule } from "./aggregates"

// Scoped to tableId:viewId, same as filtering/sorting.
export interface AggregatesFeatureApi {
  rules: AggregateRule[]
  panelOpen: boolean
  focusColumnId: string | null
  setRules(rules: AggregateRule[]): void
  openPanel(columnId?: string): void
  closePanel(): void
}
