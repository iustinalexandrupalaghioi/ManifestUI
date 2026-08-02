// hooks/useInfiniteTable.ts
import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import type { Cursor } from "@/framework/types/pagination"
import { ActionResultError } from "@/framework/lib/actionResult"

interface PageResult<TItem> {
  items: TItem[]
  total: number
  nextCursor: Cursor | null
}

interface UseInfiniteQuery<TItem> {
  queryKey: ReadonlyArray<unknown>
  fetchPage: (cursor: Cursor | null) => Promise<PageResult<TItem>>
  pageSize: number
  // Skip the fetch entirely when the caller already knows (from the cached
  // permissions snapshot) that it's going to be denied — avoids the round
  // trip and retry backoff just to arrive at a result already known.
  enabled?: boolean
}

// A permission denial isn't going to fix itself on retry — only back off
// and retry for everything else (network blips, transient DB errors).
function isForbiddenError(error: unknown): boolean {
  return (
    error instanceof ActionResultError && error.error.meta?.type === "forbidden"
  )
}

export function useInfiniteTable<TItem>({
  queryKey,
  fetchPage,
  pageSize: _,
  enabled,
}: UseInfiniteQuery<TItem>) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam as Cursor | null),
    initialPageParam: null as Cursor | null,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, p) => sum + p.items.length, 0)
      if (!lastPage.nextCursor || totalLoaded >= lastPage.total) return undefined
      return lastPage.nextCursor
    },
    staleTime: 1000 * 60,
    enabled,
    retry: (failureCount, error) =>
      !isForbiddenError(error) && failureCount < 3,
  })

  const allItems = useMemo(
    () => query.data?.pages.flatMap((p) => p.items) ?? [],
    [query.data]
  )

  return {
    ...query,
    allItems,
    total: query.data?.pages[0]?.total ?? 0,
  }
}
