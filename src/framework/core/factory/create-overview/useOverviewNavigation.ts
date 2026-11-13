import type { FormConfig } from "@/framework/components/form/types/types";
import {
  preFilterToFormKey,
  type FilterInput,
} from "@/framework/components/data-view/features/filtering";
import { stashNavigationState } from "@/framework/lib/navigationHandoff";
import { getItemId } from "../../resource-id";
import type { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import type { SplitConfig } from "@/framework/types/split-config-type";

export function useOverviewNavigation<TItem>({
  canAdd,
  addMode,
  preFilters,
  formConfig,
  addRoute,
  detailRoute,
  router,
  setAddOpen,
  isSplitDesktop,
  splitOnOpen,
  selectedRows,
  idField,
  openMode,
  overviewKey,
  currentPath,
  clearNavigator,
  setNavigator,
  setOpeningItem,
}: {
  canAdd: boolean;
  addMode?: "dialog" | "page";
  preFilters: FilterInput[];
  formConfig?: FormConfig<any>;
  addRoute: string;
  detailRoute: (id: string) => string;
  router: ReturnType<typeof useTransitionRouter>;
  setAddOpen: (open: boolean) => void;
  isSplitDesktop: boolean;
  splitOnOpen: SplitConfig["onOpen"];
  selectedRows: TItem[];
  idField: string;
  openMode?: "dialog" | "page" | "split";
  overviewKey: string;
  currentPath: string;
  clearNavigator: (key: string) => void;
  setNavigator: (ids: string[], key: string, path: string) => void;
  setOpeningItem: (item: TItem) => void;
}) {
  const handleAdd = () => {
    if (!canAdd) return;
    if (addMode === "dialog") {
      setAddOpen(true);
    } else {
      if (preFilters.length > 0) {
        stashNavigationState(
          addRoute,
          Object.fromEntries(
            preFilters.map((f) => [preFilterToFormKey(f, formConfig), f.value]),
          ),
        );
      }
      router.push(addRoute);
    }
  };

  const handleOpen = (items: TItem[]) => {
    const item = items[0];
    if (!item) return;
    const itemId = getItemId(
      item as Record<string, unknown>,
      idField,
    ).toString();
    const targetRoute = detailRoute(itemId);

    const isPartOfAmbientSelection =
      !isSplitDesktop &&
      selectedRows.length > 1 &&
      items.length === 1 &&
      selectedRows.some(
        (r) =>
          getItemId(r as Record<string, unknown>, idField).toString() ===
          itemId,
      );

    if (
      (openMode === "dialog" || isSplitDesktop) &&
      items.length === 1 &&
      !isPartOfAmbientSelection
    ) {
      if (isSplitDesktop && splitOnOpen !== "open-all") {
        clearNavigator(overviewKey);
      }
      setOpeningItem(item);
    } else {
      const isMultiSelection = items.length > 1 || isPartOfAmbientSelection;
      if (isMultiSelection) {
        const navigatorIds = isPartOfAmbientSelection
          ? selectedRows.map((i) =>
              getItemId(i as Record<string, unknown>, idField).toString(),
            )
          : items.map((i) =>
              getItemId(i as Record<string, unknown>, idField).toString(),
            );
        setNavigator(navigatorIds, overviewKey, currentPath);
      } else {
        clearNavigator(overviewKey);
      }
      router.push(targetRoute);
    }
  };

  return { handleAdd, handleOpen };
}
