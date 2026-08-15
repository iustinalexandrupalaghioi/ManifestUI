"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { completeTodos } from "@/components/features/main/todo/config/api";
import {
  BulkActionError,
  toBulkActionResult,
  unwrapAction,
} from "@/framework/lib/actionResult";
import { runWithProgress } from "@/framework/hooks/runWithProgress";
import {
  dismissToast,
  toastLoading,
  toastLoadingUpdate,
  toastUpdate,
} from "@/framework/lib/toast";
import type { Todo } from "@/app/types/main/Todo";

export function useCompleteTodos<
  TData extends Record<string, unknown> = Record<string, never>,
>() {
  const queryClient = useQueryClient();
  const t = useTranslations("Todos");

  return async (items: Todo[], data?: TData): Promise<void> => {
    const ids = items.map((item) => item.id);
    const total = ids.length;
    const loadingText = (completed: number) =>
      total === 1
        ? t("completingSingle")
        : t("completingMulti", { completed, total });

    const toastId = toastLoading(loadingText(0));
    const result = await runWithProgress(
      ids,
      (id) => completeTodos([id], data).then(unwrapAction),
      (completed) => toastLoadingUpdate(toastId, loadingText(completed)),
    );

    await queryClient.invalidateQueries({ queryKey: ["todos"] });

    const bulkResult = toBulkActionResult(total, result, {
      success: (count) => t("completed", { count }),
      partial: (succeeded, total) => t("completedOf", { succeeded, total }),
      failure: (count) => t("failedToComplete", { count }),
    });

    if (bulkResult.failures.length === 0) {
      toastUpdate(toastId, "success", bulkResult.summary);
      return;
    }

    dismissToast(toastId);
    throw new BulkActionError(bulkResult);
  };
}
