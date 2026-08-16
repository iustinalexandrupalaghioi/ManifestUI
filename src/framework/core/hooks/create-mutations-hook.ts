"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ActionResultError,
  toBulkActionResult,
  unwrapAction,
} from "@/framework/lib/actionResult";
import {
  dismissToast,
  toastLoading,
  toastLoadingUpdate,
  toastUpdate,
} from "@/framework/lib/toast";
import { runWithProgress } from "@/framework/hooks/runWithProgress";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { mapErr } from "../resource-helpers";
import type { AppError } from "@/framework/types/global/AppError";
import type { FieldValues } from "react-hook-form";
import type {
  ResourceConfig,
  ResourceId,
} from "../../types/resource-hook-types";
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
    const locale = useLocale();
    const t = useTranslations("Toast");
    const resolvedLabels = {
      singular: resolveLabel(config.labels.singular, locale),
      plural: resolveLabel(config.labels.plural, locale),
    };

    const handleError = (err: unknown) => {
      setError(mapErr(err, locale));
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
            ? t("deletingSingle", {
                label: resolvedLabels.singular.toLowerCase(),
              })
            : t("deletingMulti", {
                completed,
                total,
                label: resolvedLabels.plural.toLowerCase(),
              });

        const toastId = toastLoading(loadingText(0));
        const result = await runWithProgress(
          ids as TId[],
          (id) => mutationFns.delete([id]).then(unwrapAction),
          (completed) => toastLoadingUpdate(toastId, loadingText(completed)),
        );

        const noun = (n: number) =>
          (n === 1
            ? resolvedLabels.singular
            : resolvedLabels.plural
          ).toLowerCase();
        const gender = config.labels.gender ?? "masculine";

        const bulkResult = toBulkActionResult(total, result, {
          success: (count) =>
            t("deleted", { count, label: noun(count), gender }),
          partial: (succeeded, total) =>
            t("deletedOf", { succeeded, total, label: noun(total), gender }),
          failure: (count) =>
            t("failedToDelete", { count, label: noun(count), gender }),
        });

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

    const {
      mutate: updateMany,
      mutateAsync: updateManyAsync,
      isPending: isUpdatingMany,
      reset: resetUpdateMany,
    } = useMutation({
      mutationFn: async (items: { id: ResourceId; data: TFormValues }[]) => {
        const total = items.length;
        const dataById = new Map(items.map((item) => [item.id, item.data]));
        const loadingText = (completed: number) =>
          total === 1
            ? t("updatingSingle", {
                label: resolvedLabels.singular.toLowerCase(),
              })
            : t("updatingMulti", {
                completed,
                total,
                label: resolvedLabels.plural.toLowerCase(),
              });

        const toastId = toastLoading(loadingText(0));
        const result = await runWithProgress(
          items.map((item) => item.id) as TId[],
          (id) =>
            mutationFns
              .update(id, dataById.get(id as ResourceId)!)
              .then(unwrapAction)
              .then(() => ({ succeededIds: [String(id)], failures: [] }))
              .catch((err) => ({
                succeededIds: [],
                failures: [
                  {
                    id: String(id),
                    message:
                      err instanceof ActionResultError
                        ? err.error.message
                        : String(err),
                  },
                ],
              })),
          (completed) => toastLoadingUpdate(toastId, loadingText(completed)),
        );

        const noun = (n: number) =>
          (n === 1
            ? resolvedLabels.singular
            : resolvedLabels.plural
          ).toLowerCase();
        const gender = config.labels.gender ?? "masculine";

        const bulkResult = toBulkActionResult(total, result, {
          success: (count) =>
            t("updatedCount", { count, label: noun(count), gender }),
          partial: (succeeded, total) =>
            t("updatedOf", { succeeded, total, label: noun(total), gender }),
          failure: (count) =>
            t("failedToUpdate", { count, label: noun(count), gender }),
        });

        if (bulkResult.failures.length === 0) {
          toastUpdate(toastId, "success", bulkResult.summary);
        } else {
          dismissToast(toastId);
        }

        return bulkResult;
      },
      onSuccess: () => invalidateSelfAndRelations("update"),
      onError: handleError,
    });

    return useMemo(
      () => ({
        add,
        addAsync,
        update,
        updateAsync,
        updateMany,
        updateManyAsync,
        remove,
        removeAsync,
        isAdding,
        isUpdating,
        isUpdatingMany,
        isRemoving,
        error,
        clearError: () => setError(null),
        resetMutation: () => {
          setError(null);
          resetUpdate();
          resetUpdateMany();
          resetRemove();
        },
      }),
      [
        add,
        addAsync,
        update,
        updateAsync,
        updateMany,
        updateManyAsync,
        remove,
        removeAsync,
        isAdding,
        isUpdating,
        isUpdatingMany,
        isRemoving,
        error,
        resetUpdate,
        resetUpdateMany,
        resetRemove,
      ],
    );
  };
}
