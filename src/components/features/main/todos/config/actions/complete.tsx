"use client";

import { useState } from "react";
import type { Todo } from "@/app/types/main/Todo";
import { CheckIcon } from "lucide-react";
import { useCompleteTodos } from "../../hooks/useCompleteTodo";
import { BulkActionError, type BulkActionResult } from "@/framework/lib/actionResult";

export function useTodoBulkActions() {
  const complete = useCompleteTodos();
  const [bulkResult, setBulkResult] = useState<BulkActionResult | null>(null);

  const actions = [
    {
      key: "complete",
      label: (
        <>
          <CheckIcon className="h-4 w-4" /> Complete
        </>
      ),
      isEligible: (todo: Todo) => !todo.completed,
      onSelect: (todos: Todo[]) =>
        complete(todos).catch((err: unknown) => {
          if (err instanceof BulkActionError) setBulkResult(err.result);
        }),
    },
  ];

  return {
    actions,
    bulkResult,
    clearBulkResult: () => setBulkResult(null),
    confirmDialog: null,
  };
}
