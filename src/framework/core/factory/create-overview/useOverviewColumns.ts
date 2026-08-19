import { useMemo } from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { createActionsColumn } from "@/framework/components/data-view/core/ui/createActionsColumn";
import { createBufferColumn } from "@/framework/components/data-view/core/ui/createBufferColumn";
import { createSelectionColumn } from "@/framework/components/data-view/core/ui/createSelectionColumn";
import type { FieldConfig } from "@/framework/components/form/types/types";
import type { PickupFillFieldMatch } from "@/framework/components/form/lib/flattenFormFields";
import type { TableAction } from "@/framework/components/toolbar/Toolbar";

export function useOverviewColumns<TItem>({
  createColumns,
  locale,
  canRead,
  canDelete,
  gridEditable,
  directFields,
  pickupFillFields,
  handleOpen,
  openDeleteDialog,
  getRowUrl,
  isDeleteEligible,
  actions,
}: {
  createColumns?: (locale: string) => ColumnDef<TItem>[];
  locale: string;
  canRead: boolean;
  canDelete: boolean;
  gridEditable: boolean;
  directFields: Map<string, FieldConfig<any>>;
  pickupFillFields: Map<string, PickupFillFieldMatch<any>>;
  handleOpen: (items: TItem[]) => void;
  openDeleteDialog: (items: TItem[]) => void;
  getRowUrl?: (item: TItem) => string;
  isDeleteEligible: (item: TItem) => boolean;
  actions: TableAction<TItem>[];
}) {
  return useMemo(() => {
    const cols = [
      createSelectionColumn<TItem>(),
      createActionsColumn<TItem>({
        onOpen: canRead
          ? (rows) => handleOpen(rows.map((r) => r.original))
          : undefined,
        onDelete: canDelete
          ? (rows) => openDeleteDialog(rows.map((r) => r.original))
          : undefined,
        getRowUrl: getRowUrl ? (row) => getRowUrl(row.original) : undefined,
        isDeleteEligible: canDelete
          ? (row) => isDeleteEligible(row.original)
          : () => false,
        actions: () =>
          actions.map((action) => ({
            label: action.label,
            isEligible: action.isEligible
              ? (row: Row<TItem>) => action.isEligible!(row.original)
              : undefined,
            onSelect: (rows: Row<TItem>[]) =>
              action.onSelect(rows.map((r) => r.original)),
          })),
      }),
      ...(createColumns?.(locale) ?? []),
      createBufferColumn<TItem>(),
    ];

    if (!gridEditable) return cols;

    return cols.map((col) => {
      const columnName = col.meta?.columnName ?? col.id;
      if (!columnName) return col;

      const direct = directFields.get(col.meta?.editingField ?? columnName);
      if (direct) {
        return {
          ...col,
          meta: {
            ...col.meta,
            editableField: { kind: "direct" as const, field: direct },
          },
        };
      }

      if (col.meta?.origin) {
        const match = pickupFillFields.get(columnName);
        if (match) {
          return {
            ...col,
            meta: {
              ...col.meta,
              editableField: {
                kind: "pickup" as const,
                owningField: match.owningField,
                fillField: match.fillField,
              },
            },
          };
        }
      }

      return col;
    });
  }, [
    getRowUrl,
    handleOpen,
    isDeleteEligible,
    actions,
    canRead,
    canDelete,
    gridEditable,
    directFields,
    pickupFillFields,
    locale,
  ]);
}
