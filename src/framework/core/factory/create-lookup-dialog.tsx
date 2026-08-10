import { useActiveMode } from "@/framework/components/data-view/core/stores/ViewModeStore";
import { createSelectColumn } from "@/framework/components/data-view/core/ui/createActionsColumn";
import { createBufferColumn } from "@/framework/components/data-view/core/ui/createBufferColumn";
import DataView from "@/framework/components/data-view/DataView";
import {
  getFilteringStore,
  toFilterRuleFallback,
  type FilterInput,
  type FilterRule,
} from "@/framework/components/data-view/features/filtering";
import { getSortingStore } from "@/framework/components/data-view/features/sorting";
import {
  DEFAULT_LIST_VIEW_ID,
  DEFAULT_TABLE_VIEW_ID,
  getViewsStore,
  useActiveListView,
  useActiveTableView,
} from "@/framework/components/data-view/features/views";
import { BaseDialog } from "@/framework/components/dialog/BaseDialog";
import {
  memo,
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { FieldValues } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { ResourceComponentsConfig } from "../../types/resource-components-types";
import type { ResourceId } from "../../types/resource-hook-types";
import type { ResourceHooks } from "../hooks/create-resource-hooks";
import { getItemId } from "../resource-id";

export function createLookupDialog<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  hooks: ResourceHooks<TItem, TFormValues, TId>,
  config: ResourceComponentsConfig<TItem, TFormValues>,
) {
  const {
    createPickupColumns,
    overviewKey,
    pickupColumnVisibility,
    listColumnVisibility,
  } = config;
  const { labels, idField } = hooks;

  return memo(function LookupDialog({
    open,
    setOpen,
    onSelect,
    preFilters = [],
  }: {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    onSelect?: (item: TItem) => void;
    preFilters?: FilterInput[];
  }) {
    const locale = useLocale();
    const tr = useTranslations("Resource");
    const resolvedPlural = resolveLabel(labels.plural, locale);
    const resolvedSingular = resolveLabel(labels.singular, locale);

    const tableId = `${overviewKey}-pickup`;

    getViewsStore(
      tableId,
      resolvedPlural,
      pickupColumnVisibility ?? {},
      listColumnVisibility ?? {},
    );

    const activeMode = useActiveMode(tableId);
    const activeTableView = useActiveTableView(tableId);
    const activeCardView = useActiveListView(tableId);

    const tableViewId = activeTableView?.id ?? DEFAULT_TABLE_VIEW_ID;
    const cardViewId = activeCardView?.id ?? DEFAULT_LIST_VIEW_ID;
    const activeViewId = activeMode === "list" ? cardViewId : tableViewId;

    const sorting = getSortingStore(tableId, activeViewId)((s) => s.sorting);
    const userFilters = getFilteringStore(
      tableId,
      activeViewId,
    )((s) => s.rules);

    const activeFilters = useMemo<FilterRule[]>(
      () => [...preFilters.map(toFilterRuleFallback), ...userFilters],
      [preFilters, userFilters],
    );

    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>(
      {},
    );

    const {
      allItems,
      total,
      isError,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      isLoading,
    } = hooks.useList(sorting, activeFilters);

    const handleSelect = useCallback(
      (item: TItem) => {
        onSelect?.(item);
        setOpen(false);
      },
      [onSelect, setOpen],
    );

    const columns = useMemo(
      () => [
        createSelectColumn<TItem>({
          onSelect: (rows) => handleSelect(rows[0]?.original),
        }),
        ...(createPickupColumns?.(handleSelect, locale) ?? []),
        createBufferColumn<TItem>(),
      ],
      [handleSelect, locale],
    );

    if (isError) return null;

    return (
      <BaseDialog
        open={open}
        setOpen={setOpen}
        title={tr("selectResource", { resource: resolvedSingular.toLowerCase() })}
        onClose={() => setOpen(false)}
        className="gap-2 bg-background md:max-w-5xl"
      >
        <div className="flex min-h-0 w-full flex-1 flex-col px-4">
          <DataView
            isLoading={isLoading}
            defaultViewName={resolvedPlural}
            tableId={tableId}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            getRowId={(row) =>
              getItemId(row as Record<string, unknown>, idField).toString()
            }
            totalCount={total}
            columns={columns}
            initialColumnVisibility={pickupColumnVisibility}
            initialListColumnVisibility={listColumnVisibility}
            data={allItems}
            preFilters={preFilters}
            height={450}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
          />
        </div>
      </BaseDialog>
    );
  });
}
