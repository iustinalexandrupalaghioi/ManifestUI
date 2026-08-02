"use client"

import { useEffect, type RefObject } from "react"

interface UseInfiniteScrollOptions {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

/**
 * useInfiniteScroll
 *
 * Observes a sentinel div at the bottom of the scroll container.
 * Fires fetchNextPage when the sentinel enters the viewport (with a
 * 200px rootMargin buffer) and more pages are available.
 */
export function useInfiniteScroll(
  sentinelRef: RefObject<HTMLDivElement | null>,
  rootRef: RefObject<HTMLDivElement | null>,
  { hasNextPage, isFetchingNextPage, fetchNextPage }: UseInfiniteScrollOptions
) {
  useEffect(() => {
    const sentinel = sentinelRef.current
    const root = rootRef.current
    if (!sentinel || !root) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage)
          fetchNextPage()
      },
      { root, rootMargin: "200px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
}
