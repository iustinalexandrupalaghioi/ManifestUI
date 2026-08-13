import type { FieldValues } from "react-hook-form";
import type { TableAction } from "@/framework/components/toolbar/Toolbar";
import type {
  ResourceConfig,
  ResourceActions,
  ResourceId,
  BulkActionsHookResult,
} from "../../types/resource-hook-types";
import { hasPermission } from "@/framework/authorization/cache/permissions";

export function createActionsHook<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(config: ResourceConfig<TItem, TFormValues, TId>) {
  const { id, isDeleteEligible = () => true, getRowUrl, bulkActions } = config;

  return function useActions({
    setRowSelection,
    onOpen,
    extraActions = [],
    getRowUrl: getRowUrlOverride,
  }: {
    setRowSelection: (s: Record<string, boolean>) => void;
    onOpen: (item: TItem) => void;
    extraActions?: TableAction<TItem>[];
    getRowUrl?: (item: TItem) => string;
  }): ResourceActions<TItem> {
    const bulkActionsResult = (bulkActions ?? useNoBulkActions)();

    const combinedActions = [...bulkActionsResult.actions, ...extraActions];

    return {
      actions: combinedActions.map((action) => ({
        ...action,
        isEligible: (row: TItem) =>
          hasPermission(`${id}:${action.key}`) &&
          (action.isEligible ? action.isEligible(row) : true),
        onSelect: async (items: TItem[]) => {
          await action.onSelect(items);
          setRowSelection({});
        },
      })),
      getRowUrl: getRowUrlOverride ?? getRowUrl,
      onOpen,
      isDeleteEligible,
      bulkResult: bulkActionsResult.bulkResult,
      clearBulkResult: bulkActionsResult.clearBulkResult,
      confirmDialog: bulkActionsResult.confirmDialog ?? null,
    };
  };
}

function useNoBulkActions<TItem>(): BulkActionsHookResult<TItem> {
  return {
    actions: [],
    bulkResult: null,
    clearBulkResult: () => {},
    confirmDialog: null,
  };
}
