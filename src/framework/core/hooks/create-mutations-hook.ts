"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toBulkActionResult, unwrapAction } from "@/framework/lib/actionResult";
import { dismissToast, toastLoading, toastLoadingUpdate, toastUpdate } from "@/framework/lib/toast";
import { runWithProgress } from "@/framework/hooks/runWithProgress";
import { mapErr } from "../resource-helpers";
import type { AppError } from "@/framework/types/global/AppError";
import type { FieldValues } from "react-hook-form";
import type { ResourceConfig, ResourceId } from "../../types/resource-hook-types";
import type { createKeys } from "./create-list-hooks";

export function createMutationsHook<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  config: ResourceConfig<TItem, TFormValues, TId>,
  keys: ReturnType<typeof createKeys<TItem, TFormValues, TId>>,
) {
  const { mutationFns, relations = [] } = config;

  return function useMutations() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<AppError | null>(null);

    const handleError = (err: unknown) => {
      setError(mapErr(err));
    };

    const invalidateSelfAndRelations = (
      action: "add" | "update" | "delete",
    ) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      relations.forEach((relation) => {
        if (!relation.invalidateOn?.includes(action)) return;
        queryClient.invalidateQueries({
          queryKey: relation.childResource.hooks.keys.all,
          refetchType: "all",
        });
      });
    };

    const {
      mutate: add,
      mutateAsync: addAsync,
      isPending: isAdding,
    } = useMutation({
      mutationFn: (data: TFormValues) =>
        mutationFns.add(data).then(unwrapAction),
      onSuccess: () => invalidateSelfAndRelations("add"),
      onError: handleError,
    });

    const {
      mutate: update,
      mutateAsync: updateAsync,
      isPending: isUpdating,
      reset: resetUpdate,
    } = useMutation({
      mutationFn: ({ id, data }: { id: ResourceId; data: TFormValues }) =>
        mutationFns.update(id as TId, data).then(unwrapAction),
      onSuccess: () => invalidateSelfAndRelations("update"),
      onError: handleError,
    });

    const {
      mutate: remove,
      mutateAsync: removeAsync,
      isPending: isRemoving,
      reset: resetRemove,
    } = useMutation({
      mutationFn: async (ids: ResourceId[]) => {
        const total = ids.length;
        const loadingText = (completed: number) =>
          total === 1
            ? `Deleting ${config.labels.singular.toLowerCase()}...`
            : `Deleting ${completed} of ${total} ${config.labels.plural.toLowerCase()}...`;

        const toastId = toastLoading(loadingText(0));
        const result = await runWithProgress(
          ids as TId[],
          (id) => mutationFns.delete([id]).then(unwrapAction),
          (completed) => toastLoadingUpdate(toastId, loadingText(completed)),
        );

        const bulkResult = toBulkActionResult(
          total,
          result,
          { infinitive: "delete", pastTense: "Deleted" },
          config.labels,
        );

        if (bulkResult.failures.length === 0) {
          toastUpdate(toastId, "success", bulkResult.summary);
        } else {
          dismissToast(toastId);
        }

        return bulkResult;
      },
      onSuccess: () => invalidateSelfAndRelations("delete"),
      onError: handleError,
    });

    return useMemo(
      () => ({
        add,
        addAsync,
        update,
        updateAsync,
        remove,
        removeAsync,
        isAdding,
        isUpdating,
        isRemoving,
        error,
        clearError: () => setError(null),
        resetMutation: () => {
          setError(null);
          resetUpdate();
          resetRemove();
        },
      }),
      [
        add,
        addAsync,
        update,
        updateAsync,
        remove,
        removeAsync,
        isAdding,
        isUpdating,
        isRemoving,
        error,
        resetUpdate,
        resetRemove,
      ],
    );
  };
}
