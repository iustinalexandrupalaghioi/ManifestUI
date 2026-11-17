import type { FilterInput } from "@/framework/components/data-view/features/filtering";
import type { OverviewSlots } from "../../../types/define-resource-type";
import type { OverviewRenderProps, ResourceComponentsConfig } from "../../../types/resource-components-types";

/** What `createOverview` reads from a resource's components config. */
export type OverviewConfig<TItem, TFormValues> = ResourceComponentsConfig<TItem, TFormValues> & {
  overviewSlots?: OverviewSlots<TItem>;
  renderOverview?: (props: OverviewRenderProps<TItem>) => React.ReactNode;
  getOverviewTitle?: (preFilters: FilterInput[]) => string;
};

/** Props of the overview component `createOverview` returns. */
export interface OverviewProps {
  preFilters?: FilterInput[];
  slotId?: string;
  height?: number;
  popOutUrl?: string;
}
