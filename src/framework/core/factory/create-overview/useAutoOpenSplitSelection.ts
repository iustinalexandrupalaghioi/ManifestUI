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
  setOpeningItem,
  setRowSelection,
}: {
  isSplitDesktop: boolean;
  isLoading: boolean;
  allItems: TItem[];
  openingItem: TItem | null;
  idField: string;
  splitOnOpen: SplitConfig["onOpen"];
  setOpeningItem: (item: TItem) => void;
  setRowSelection: (selection: Record<string, boolean>) => void;
}) {
  const didAutoOpenRef = useRef(false);
  useEffect(() => {
    if (!isSplitDesktop || didAutoOpenRef.current) return;
    if (isLoading || allItems.length === 0) return;
    if (openingItem) {
      didAutoOpenRef.current = true;
      return;
    }
    didAutoOpenRef.current = true;
    if (splitOnOpen === "selectFirst") {
      setOpeningItem(allItems[0]);
      setRowSelection({
        [getItemId(
          allItems[0] as Record<string, unknown>,
          idField,
        ).toString()]: true,
      });
    } else if (splitOnOpen === "selectAll") {
      setRowSelection(
        Object.fromEntries(
          allItems.map((i) => [
            getItemId(i as Record<string, unknown>, idField).toString(),
            true,
          ]),
        ),
      );
    }
  }, [isSplitDesktop, isLoading, allItems, idField, openingItem]);
}
