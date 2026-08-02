"use client";

import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import type { FilterInput } from "../../data-view/features/filtering/filters";

const NO_VALUE_OPERATORS = [
  "is_true",
  "is_false",
  "is_empty",
  "is_not_empty",
] as const;

export function useBrowserNavigation() {
  const router = useTransitionRouter();

  function navigateTo(path: string, filters?: FilterInput[]) {
    if (filters && filters.length > 0) {
      const params = new URLSearchParams();
      filters.forEach((f) => {
        const key = f.origin ? `${f.origin}.${f.columnName}` : f.columnName;

        if (f.operator === "equals") {
          params.set(key, String(f.value ?? ""));
        } else if (NO_VALUE_OPERATORS.includes(f.operator as any)) {
          params.set(key, f.operator);
        } else if (Array.isArray(f.value)) {
          params.set(key, `${f.operator}|${f.value.join(",")}`);
        } else {
          params.set(key, `${f.operator}|${f.value}`);
        }
      });
      router.push(`${path}?${params.toString()}`);
    } else {
      router.push(path);
    }
  }

  function navigateBack() {
    router.back();
  }

  return { navigateTo, navigateBack, isPending: router.isPending };
}
