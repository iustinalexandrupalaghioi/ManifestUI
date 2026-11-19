"use client";

import { CustomTableBody, CustomTableCell, CustomTableRow } from "@/framework/components/ui/CustomTable";
import { memo, useMemo, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { VirtualDataTableBodyProps } from "../../core/types";
import { useDataViewCore } from "../../core/stores/DataViewProvider";
import { DataTableGroupTotalsRow } from "./DataTableGroupTotalsRow";
import { DataTableRow } from "./DataTableRow";
import { SkeletonRows } from "./DataTableSkeletonRows";
import { buildDisplayItems } from "./displayItems";
import { useRowVirtualizer } from "./useRowVirtualizer";

/** The grid body: skeleton, empty state, or the virtualized rows with group totals. */
function VirtualTableBodyInner<TData>({
  rows,
  table,
  lastColumnId,
  columnsLength,
  grouping,
  groupAggregateLookup,
  isGroupAggregatesFetching,
  scrollContainerRef,
  isResizing,
  onCellContextMenu,
  onRowClick,
  onRowDoubleClick,
  onCellDoubleClick,
  onRowContextClick,
  isLoading,
  rowSelection,
  activeRowId,
  isCellSelected,
  isCellEditing,
  editingKey,
  onCellClick,
  onCellContextClick,
  columnStateKey,
}: VirtualDataTableBodyProps<TData>) {
  const t = useTranslations("DataView");
  const { dataTableConfig } = useDataViewCore();
  // Visible pinned columns only: a hidden one (the grouping column) has no size, so counting it would break every offset after it.
  const pinnedLeftIds = table.getLeftVisibleLeafColumns().map((column) => column.id);

  const displayItems = useMemo(() => buildDisplayItems(rows, grouping), [rows, grouping]);

  const { virtualRows, paddingTop, paddingBottom, measureRef } = useRowVirtualizer({
    count: displayItems.length,
    scrollContainerRef,
    isResizing,
    columnStateKey,
    editingKey,
  });

  if (isLoading) {
    return (
      <CustomTableBody>
        <SkeletonRows
          columnsLength={columnsLength}
          lastColumnId={lastColumnId}
        />
      </CustomTableBody>
    );
  }

  if (!rows.length) {
    return (
      <CustomTableBody>
        <CustomTableRow>
          <CustomTableCell colSpan={columnsLength} className="h-24 text-center">
            {t("noResults")}
          </CustomTableCell>
        </CustomTableRow>
      </CustomTableBody>
    );
  }

  return (
    <CustomTableBody>
      {paddingTop > 0 && (
        <CustomTableRow>
          <CustomTableCell
            colSpan={columnsLength}
            style={{ height: paddingTop, padding: 0, border: 0 }}
          />
        </CustomTableRow>
      )}

      {virtualRows.map((virtualRow) => {
        const item = displayItems[virtualRow.index];

        if (item.kind === "totals") {
          return (
            <DataTableGroupTotalsRow
              key={`${item.row.id}__totals`}
              row={item.row}
              table={table}
              grouping={grouping}
              groupAggregateLookup={groupAggregateLookup}
              isGroupAggregatesFetching={isGroupAggregatesFetching}
              dataIndex={virtualRow.index}
              measureRef={measureRef}
            />
          );
        }

        return (
          <DataTableRow
            key={item.row.id}
            row={item.row}
            table={table}
            virtualRowIndex={virtualRow.index}
            lastColumnId={lastColumnId}
            pinnedLeftIds={pinnedLeftIds}
            activeRowId={activeRowId}
            alternateRowColor={dataTableConfig.alternateRowColor}
            rowSelection={rowSelection}
            isCellSelected={isCellSelected}
            isCellEditing={isCellEditing}
            onRowClick={onRowClick}
            onRowDoubleClick={onRowDoubleClick}
            onRowContextClick={onRowContextClick}
            onCellClick={onCellClick}
            onCellDoubleClick={onCellDoubleClick}
            onCellContextClick={onCellContextClick}
            onCellContextMenu={onCellContextMenu}
            measureRef={measureRef}
          />
        );
      })}

      {paddingBottom > 0 && (
        <CustomTableRow>
          <CustomTableCell
            colSpan={columnsLength}
            style={{ height: paddingBottom, padding: 0, border: 0 }}
          />
        </CustomTableRow>
      )}
    </CustomTableBody>
  );
}
export const VirtualDataTableBody = memo(VirtualTableBodyInner) as <TData>(
  props: VirtualDataTableBodyProps<TData>,
) => ReactNode;
