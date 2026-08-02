import type { FilterRule } from "./filters"

/**
 * FilteringFeatureApi
 *
 * The public surface of the filtering feature. Scoped to tableId:viewId so
 * table views and list views each have fully independent filter state.
 *
 * Replaces the previous pattern of passing ReturnType<typeof useTableViews>
 * into useFilterDrawer — consumers now depend on this interface, not on the
 * concrete hook.
 */
export interface FilteringFeatureApi {
  rules: FilterRule[]
  panelOpen: boolean
  focusColumnId: string | null
  setRules(rules: FilterRule[]): void
  openPanel(columnId?: string): void
  closePanel(): void
}
