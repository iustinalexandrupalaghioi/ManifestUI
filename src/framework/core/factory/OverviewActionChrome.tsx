"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ActionFormDialog } from "@/framework/components/dialog/ActionFormDialog";
import { DeleteDialog } from "@/framework/components/dialog/DeleteDialog";
import { ErrorDialog } from "@/framework/components/dialog/ErrorDialog";
import { BulkResultDialog } from "@/framework/components/dialog/BulkResultDialog";
import {
  Toolbar,
  type TableAction,
  type ToolbarVariant,
} from "@/framework/components/toolbar/Toolbar";
import type { Dispatch, SetStateAction } from "react";
import type {
  ActionFormConfig,
  ResourceId,
  ResourceLabels,
} from "@/framework/types/resource-hook-types";
import type { AppError } from "@/framework/types/global/AppError";
import type { BulkActionResult } from "@/framework/lib/actionResult";
import type { FilterInput } from "@/framework/components/data-view/features/filtering";
import { getItemId } from "../resource-id";

interface OverviewActionChromeProps<TItem> {
  variant?: ToolbarVariant;
  slotId?: string;
  idField: string;
  selectedRows: TItem[];
  actions: TableAction<TItem>[];
  getRowUrl?: (item: TItem) => string;
  isDeleteEligible: (item: TItem) => boolean;
  onOpen?: (rows: TItem[]) => void;
  onAdd?: () => void;
  onBack?: () => void;
  setRowSelection: (s: Record<string, boolean>) => void;
  preFilters?: FilterInput[];
  popOutUrl?: string;
  toolbarChildren?: ReactNode;

  noun: string;
  routes?: { detail?: (id: string) => string };
  queryKeyAll: readonly string[];
  labels: ResourceLabels;

  deleteOpen: boolean;
  setDeleteOpen: Dispatch<SetStateAction<boolean>>;
  pendingDeleteItems: TItem[];
  openDeleteDialog: (items: TItem[]) => void;
  removeAsync: (ids: ResourceId[]) => Promise<BulkActionResult>;
  onDeleteSuccess?: () => void;

  activeActionForm: ActionFormConfig<TItem, any> | undefined;
  activeActionItems: TItem[];
  activeActionKey: string | null;
  closeActionForm: () => void;

  error: AppError | null;
  clearError: () => void;

  bulkResult?: BulkActionResult | null;
  clearBulkResult?: () => void;
  confirmDialog?: ReactNode;
}

export function OverviewActionChrome<TItem>({
  variant = "overview",
  slotId,
  idField,
  selectedRows,
  actions,
  getRowUrl,
  isDeleteEligible,
  onOpen,
  onAdd,
  onBack,
  setRowSelection,
  preFilters,
  popOutUrl,
  toolbarChildren,
  noun,
  routes,
  queryKeyAll,
  labels,
  deleteOpen,
  setDeleteOpen,
  pendingDeleteItems,
  openDeleteDialog,
  removeAsync,
  onDeleteSuccess,
  activeActionForm,
  activeActionItems,
  activeActionKey,
  closeActionForm,
  error,
  clearError,
  bulkResult = null,
  clearBulkResult,
  confirmDialog,
}: OverviewActionChromeProps<TItem>) {
  const [actionFormError, setActionFormError] =
    useState<BulkActionResult | null>(null);

  const activeBulkResult = actionFormError ?? bulkResult;
  const clearActiveBulkResult = () => {
    setActionFormError(null);
    clearBulkResult?.();
  };

  return (
    <>
      <Toolbar
        slotId={slotId}
        variant={variant}
        selectedRows={selectedRows}
        selectedCount={selectedRows.length}
        actions={actions}
        onDelete={openDeleteDialog}
        isDeleteEligible={isDeleteEligible}
        onOpen={onOpen}
        onAdd={onAdd}
        getRowUrl={getRowUrl}
        onBack={onBack}
        setRowSelection={setRowSelection}
        preFilters={preFilters}
        popOutUrl={popOutUrl}
      >
        {toolbarChildren}
      </Toolbar>

      <DeleteDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        noun={noun}
        id={pendingDeleteItems.map((i) =>
          getItemId(i as Record<string, unknown>, idField),
        )}
        queryKeys={[queryKeyAll]}
        deleteFn={() =>
          removeAsync(
            pendingDeleteItems.map((i) =>
              getItemId(i as Record<string, unknown>, idField),
            ),
          )
        }
        onSuccess={() => {
          setRowSelection({});
          onDeleteSuccess?.();
        }}
        onBulkResult={(result) => {
          if (result.succeededIds.length > 0) setRowSelection({});
          setActionFormError(result);
        }}
      />

      {activeActionForm && activeActionItems.length > 0 && (
        <ActionFormDialog
          labels={labels}
          config={activeActionForm}
          items={activeActionItems}
          idField={idField}
          open={!!activeActionKey}
          onClose={closeActionForm}
          onError={setActionFormError}
        />
      )}

      <BulkResultDialog
        open={!!activeBulkResult}
        setOpen={(open) => !open && clearActiveBulkResult()}
        result={activeBulkResult}
        itemLabel={labels.singular}
        pluralLabel={labels.plural}
        getItemHref={routes?.detail}
      />

      {confirmDialog}

      <ErrorDialog
        open={!!error}
        setOpen={(o) => {
          if (!o) clearError();
        }}
        error={error}
      />
    </>
  );
}
