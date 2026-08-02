"use client";

import { useQueryClient } from "@tanstack/react-query";
import { completeTodos } from "@/components/features/main/todos/config/api";
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

  return async (items: Todo[], data?: TData): Promise<void> => {
    const ids = items.map((t) => t.id);
    const total = ids.length;
    const loadingText = (completed: number) =>
      total === 1
        ? "Completing to do..."
        : `Completing ${completed} of ${total} to dos...`;

    const toastId = toastLoading(loadingText(0));
    const result = await runWithProgress(
      ids,
      (id) => completeTodos([id], data).then(unwrapAction),
      (completed) => toastLoadingUpdate(toastId, loadingText(completed)),
    );

    await queryClient.invalidateQueries({ queryKey: ["todos"] });

    const bulkResult = toBulkActionResult(
      total,
      result,
      { infinitive: "complete", pastTense: "Completed" },
      { singular: "to do", plural: "to dos" },
    );

    if (bulkResult.failures.length === 0) {
      toastUpdate(toastId, "success", bulkResult.summary);
      return;
    }

    dismissToast(toastId);
    throw new BulkActionError(bulkResult);
  };
}
