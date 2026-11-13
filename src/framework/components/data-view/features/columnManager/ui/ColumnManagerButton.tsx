"use client";

import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useDataViewCore } from "../../../core/stores/DataViewProvider";
import { useActiveMode } from "../../../core/stores/ViewModeStore";
import {
  getViewsStore,
  useActiveTableView,
  useActiveListView,
  DEFAULT_LIST_VIEW_ID,
} from "../../views";
import { DataListColumnManager } from "./ColumnManager";

export function ColumnManagerButton({ type }: { type: "list" | "table" }) {
  const t = useTranslations("ColumnManager");
  const { table, tableId, featureIds } = useDataViewCore();
  const pinningEnabled = featureIds.has("pinning");
  const viewMode = useActiveMode(tableId);
  const viewsStore = getViewsStore(tableId);
  const [open, setOpen] = useState(false);
  const isList = viewMode === "list";

  const activeTableView = useActiveTableView(tableId);
  const activeListView = useActiveListView(tableId);
  const tableDraft = viewsStore((s) => s.tableDraft);
  const listDraft = viewsStore((s) => s.listDraft);
  const defaultListColumnVisibility = viewsStore(
    (s) =>
      s.persisted.listViews.views.find((v) => v.id === DEFAULT_LIST_VIEW_ID)
        ?.listColumnVisibility ?? {},
  );

  const columnOrder = isList
    ? []
    : (tableDraft?.columnOrder ?? activeTableView?.columnOrder ?? []);
  const columnPinning = isList
    ? { left: [] }
    : (tableDraft?.columnPinning ??
      activeTableView?.columnPinning ?? { left: [] });
  const listColumnVisibility =
    listDraft?.listColumnVisibility ??
    activeListView?.listColumnVisibility ??
    {};
  const listColumnOrder =
    listDraft?.listColumnOrder ?? activeListView?.listColumnOrder ?? [];

  const handleApplyTableColumns = (
    order: string[],
    pinning: { left: string[] },
    visibility: Record<string, boolean>,
  ) => {
    viewsStore.getState().updateTableDraft({
      columnOrder: order,
      columnPinning: pinning,
      columnVisibility: visibility,
    });
  };

  const handleApplyListColumns = (
    visibility: Record<string, boolean>,
    order: string[],
  ) => {
    viewsStore.getState().updateListDraft({
      listColumnVisibility: visibility,
      listColumnOrder: order,
    });
  };

  return (
    <>
      {type === "list" ? (
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="w-fit"
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
          {t("columns")}
        </Button>
      ) : (
        <Button
          variant="ghost"
          type="button"
          className="size-10 w-fit"
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
        </Button>
      )}

      <DataListColumnManager
        open={open}
        onOpenChange={setOpen}
        table={table}
        mode={isList ? "list" : "table"}
        columnOrder={columnOrder}
        columnPinning={columnPinning}
        pinningEnabled={pinningEnabled}
        onApplyTableColumns={handleApplyTableColumns}
        listColumnVisibility={listColumnVisibility}
        listColumnOrder={listColumnOrder}
        defaultListColumnVisibility={defaultListColumnVisibility}
        onApplyListColumns={handleApplyListColumns}
      />
    </>
  );
}
