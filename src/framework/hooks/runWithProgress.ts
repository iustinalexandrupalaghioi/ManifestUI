import type { BulkActionFailure } from "@/framework/lib/actionResult";

export interface PerIdCallResult {
  succeededIds: string[];
  failures: BulkActionFailure[];
}

// Calls `callOne` once per id — not once with the whole array — so progress
// is real: each network round trip resolving is what advances the counter.
// A small worker pool (not full concurrency) keeps a large batch from
// opening one connection per row.
export async function runWithProgress<TId extends string | number>(
  ids: TId[],
  callOne: (id: TId) => Promise<PerIdCallResult>,
  onTick?: (completed: number, total: number) => void,
  concurrency = 4,
): Promise<PerIdCallResult> {
  const succeededIds: string[] = [];
  const failures: BulkActionFailure[] = [];
  let completed = 0;
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < ids.length) {
      const id = ids[nextIndex++];
      const result = await callOne(id);
      succeededIds.push(...result.succeededIds);
      failures.push(...result.failures);
      completed++;
      onTick?.(completed, ids.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, ids.length) }, worker),
  );

  return { succeededIds, failures };
}
