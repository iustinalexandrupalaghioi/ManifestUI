import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import type { ResourceHooks } from "../hooks/create-resource-hooks";
import type { ResourceId } from "../../types/resource-hook-types";

export function useOverviewActionsBundle<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  hooks: ResourceHooks<TItem, TFormValues, TId>,
  selectedItems: TItem[],
  clearSelection: () => void,
  onOpen: (item: TItem) => void,
) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteItems, setPendingDeleteItems] = useState<TItem[]>([]);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [activeActionItems, setActiveActionItems] = useState<TItem[]>([]);

  const { removeAsync, error, clearError } = hooks.useMutations();

  const actionFormActions = hooks.actionForms.map((a) => ({
    key: a.key,
    label: a.label,
    isEligible: (row: TItem) => {
      if (a.singleOnly && selectedItems.length > 1) return false;
      return a.isEligible ? a.isEligible(row) : true;
    },
    onSelect: (items: TItem[]) => {
      if (items.length === 0) return;
      if (a.singleOnly && items.length > 1) return;
      setActiveActionItems(items);
      setActiveActionKey(a.key);
    },
  }));

  const activeActionForm = hooks.actionForms.find(
    (a) => a.key === activeActionKey,
  );

  const {
    actions,
    getRowUrl,
    isDeleteEligible,
    bulkResult,
    clearBulkResult,
    confirmDialog,
  } = hooks.useActions({
    setRowSelection: clearSelection,
    onOpen,
    extraActions: actionFormActions,
  });

  const openDeleteDialog = (items: TItem[]) => {
    setPendingDeleteItems(items);
    setDeleteOpen(true);
  };

  const closeActionForm = () => {
    setActiveActionKey(null);
    setActiveActionItems([]);
  };

  return {
    actions,
    getRowUrl,
    isDeleteEligible,
    removeAsync,
    error,
    clearError,
    deleteOpen,
    setDeleteOpen,
    pendingDeleteItems,
    openDeleteDialog,
    activeActionForm,
    activeActionItems,
    activeActionKey,
    closeActionForm,
    bulkResult,
    clearBulkResult,
    confirmDialog,
  };
}
