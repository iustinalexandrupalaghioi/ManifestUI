import type { FilterRule } from "./filters";

/**
 * FilteringFeatureApi
 *
 * The public surface of the filtering feature. Scoped to tableId:viewId so
 * table views and list views each have fully independent filter state.
 */
export interface FilteringFeatureApi {
  rules: FilterRule[];
  panelOpen: boolean;
  focusColumnId: string | null;
  setRules(rules: FilterRule[]): void;
  openPanel(columnId?: string): void;
  closePanel(): void;
}
