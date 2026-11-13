"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ActionResultError,
  toBulkActionResult,
  toFailureResult,
  unwrapAction,
  type BulkActionResult,
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
import type { FieldValues } from "react-hook-form";
import type {
  ResourceConfig,
  ResourceId,
} from "../../types/resource-hook-types";
import type { createKeys } from "./create-list-hooks";
import { getItemId } from "../resource-id";
import type { Cursor } from "../../types/pagination";

interface ListPage<TItem> {
  items: TItem[];
  total: number;
  nextCursor: Cursor | null;
}

interface ListCacheData<TItem> {
  pages: ListPage<TItem>[];
  pageParams: unknown[];
}

export function createMutationsHook<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  config: ResourceConfig<TItem, TFormValues, TId>,
  keys: ReturnType<typeof createKeys<TItem, TFormValues, TId>>,
) {
  const { mutationFns, relations = [] } = config;
  const idField = (config.idField ?? "id") as string;
  const listKeyPrefix = [...keys.all, "list"];

  return function useMutations() {
    const queryClient = useQueryClient();
    const [error, setError] = useState<BulkActionResult | null>(null);
    const locale = useLocale();
    const t = useTranslations("Toast");
    const resolvedLabels = {
      singular: resolveLabel(config.labels.singular, locale),
      plural: resolveLabel(config.labels.plural, locale),
    };

    const handleError = (err: unknown, ids: ResourceId[] = []) => {
      setError(toFailureResult(mapErr(err, locale), ids));
    };

    // Only ever touches this resource's own cached infinite-list pages
    // (matched by the shared ["list", ...] prefix, regardless of active
    // sorting/filters) — never triggers a network request on its own.
    const patchListCache = (
      updater: (pages: ListPage<TItem>[]) => ListPage<TItem>[],
    ) => {
      queryClient.setQueriesData<ListCacheData<TItem>>(
        { queryKey: listKeyPrefix, exact: false },
        (old) => (old ? { ...old, pages: updater(old.pages) } : old),
      );
    };

    const patchListItems = (byId: Map<string, TItem>) => {
      if (byId.size === 0) return;
      patchListCache((pages) =>
        pages.map((page) => ({
          ...page,
          items: page.items.map((item) => {
            const patch = byId.get(
              String(getItemId(item as Record<string, unknown>, idField)),
            );
            return patch ?? item;
          }),
        })),
      );
    };

    const removeListItems = (ids: Set<string>) => {
      if (ids.size === 0) return;
      patchListCache((pages) => {
        let removed = 0;
        const filtered = pages.map((page) => {
          const items = page.items.filter((item) => {
            const hit = ids.has(
              String(getItemId(item as Record<string, unknown>, idField)),
            );
            if (hit) removed++;
            return !hit;
          });
          return { ...page, items };
        });
        if (removed === 0) return pages;
        return filtered.map((page) => ({
          ...page,
          total: Math.max(0, page.total - removed),
        }));
      });
    };

    const resetListPagination = () => {
      patchListCache((pages) => (pages.length > 1 ? [pages[0]] : pages));
    };

    const invalidateDetailAndRelations = (
      action: "add" | "update" | "delete",
      ids: ResourceId[],
    ) => {
      ids.forEach((id) =>
        queryClient.invalidateQueries({ queryKey: keys.detail(id as TId) }),
      );
      relations.forEach((relation) => {
        if (!relation.invalidateOn?.includes(action)) return;
        queryClient.invalidateQueries({
          queryKey: relation.childResource.hooks.keys.all,
          refetchType: "all",
        });
      });
    };

    const invalidateSelfAndRelations = (action: "add" | "delete") => {
      resetListPagination();
      queryClient.invalidateQueries({ queryKey: listKeyPrefix, exact: false });
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
      onError: (err) => handleError(err),
    });

    const {
      mutate: update,
      mutateAsync: updateAsync,
      isPending: isUpdating,
      reset: resetUpdate,
    } = useMutation({
      mutationFn: ({ id, data }: { id: ResourceId; data: TFormValues }) =>
        mutationFns.update(id as TId, data).then(unwrapAction),

      onSuccess: (_data, { id }) => {
        resetListPagination();
        queryClient.invalidateQueries({
          queryKey: listKeyPrefix,
          exact: false,
        });
        invalidateDetailAndRelations("update", [id]);
      },
      onError: (err, { id }) => handleError(err, [id]),
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

      onSuccess: (data) => {
        removeListItems(new Set(data.succeededIds));
        invalidateDetailAndRelations("delete", data.succeededIds);
      },
      onError: (err, ids) => handleError(err, ids),
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
                    ...(err instanceof ActionResultError
                      ? err.error
                      : { message: String(err) }),
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

      onSuccess: (bulkResult, items) => {
        const succeeded = new Set(bulkResult.succeededIds);
        const byId = new Map(
          items
            .filter((item) => succeeded.has(String(item.id)))
            .map((item) => [String(item.id), item.data as unknown as TItem]),
        );
        patchListItems(byId);
        invalidateDetailAndRelations("update", [...succeeded]);
      },
      onError: (err, items) => handleError(err, items.map((i) => i.id)),
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
