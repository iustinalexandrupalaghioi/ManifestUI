import { useEffect, useRef } from "react";
import { getItemId } from "../../resource-id";
import type { SplitConfig } from "@/framework/types/split-config-type";

export function useAutoOpenSplitSelection<TItem>({
  isSplitDesktop,
  isLoading,
  allItems,
  openingItem,
  idField,
  splitOnOpen,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  overviewKey,
  currentPath,
  setOpeningItem,
  setNavigator,
}: {
  isSplitDesktop: boolean;
  isLoading: boolean;
  allItems: TItem[];
  openingItem: TItem | null;
  idField: string;
  splitOnOpen: SplitConfig["onOpen"];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  overviewKey: string;
  currentPath: string;
  setOpeningItem: (item: TItem) => void;
  setNavigator: (ids: string[], overviewKey: string, originPath?: string) => void;
}) {
  const didAutoOpenRef = useRef(false);

  // "open-all" opens the split pane onto the whole dataset, not just the
  // first page — drive the infinite query to completion first.
  useEffect(() => {
    if (!isSplitDesktop || didAutoOpenRef.current) return;
    if (splitOnOpen !== "open-all") return;
    if (isLoading || isFetchingNextPage) return;
    if (hasNextPage) fetchNextPage();
  }, [
    isSplitDesktop,
    splitOnOpen,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  ]);

  useEffect(() => {
    if (!isSplitDesktop || didAutoOpenRef.current) return;
    if (isLoading || allItems.length === 0) return;
    if (openingItem) {
      didAutoOpenRef.current = true;
      return;
    }
    if (splitOnOpen === "open-all" && (hasNextPage || isFetchingNextPage)) {
      return;
    }

    didAutoOpenRef.current = true;
    if (splitOnOpen === "open-first" || splitOnOpen === "open-all") {
      setOpeningItem(allItems[0]);
    }
  }, [
    isSplitDesktop,
    isLoading,
    allItems,
    idField,
    openingItem,
    splitOnOpen,
    hasNextPage,
    isFetchingNextPage,
  ]);

  // Keeps the record-navigator's id list in sync with the fully-loaded
  // dataset for as long as we're browsing it in "open-all" split mode — so
  // the detail pane's prev/next arrows can walk the entire dataset, not
  // just whichever page happened to be loaded when a row was opened.
  useEffect(() => {
    if (!isSplitDesktop || splitOnOpen !== "open-all") return;
    if (allItems.length === 0) return;
    setNavigator(
      allItems.map((i) =>
        getItemId(i as Record<string, unknown>, idField).toString(),
      ),
      overviewKey,
      currentPath,
    );
  }, [isSplitDesktop, splitOnOpen, allItems, idField, overviewKey, currentPath]);
}
