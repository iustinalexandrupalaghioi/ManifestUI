"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDownIcon,
  Trash2,
  Pencil,
  PlusIcon,
  CheckIcon,
  XIcon,
  SaveIcon,
  RotateCcw,
  CircleXIcon,
} from "lucide-react";
import { cn } from "@/framework/lib/utils";
import { useTranslations } from "next-intl";
import { DEFAULT_TABLE_VIEW_ID } from "../views.types";
import { getSortingStore } from "../../sorting/sorting.store";
import { getFilteringStore } from "../../filtering/filtering.store";
import { getViewsStore } from "../views.store";
import type { TableViewsApi } from "../views.contract";

interface TableViewBarProps {
  viewsApi: TableViewsApi;
  tableId: string;
  viewId: string;
}

export function TableViewBar({ viewsApi, tableId, viewId }: TableViewBarProps) {
  const t = useTranslations("Views");
  const {
    views,
    activeView,
    hasChanges,
    switchView,
    saveChanges,
    discardChanges,
    saveAsView,
    deleteView,
    renameView,
  } = viewsApi;

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);

  const handleRename = (id: string) => {
    if (renameValue.trim()) renameView(id, renameValue.trim());
    setRenamingId(null);
  };

  const handleSaveAs = () => {
    if (!newName.trim()) return;
    const currentSorting = getSortingStore(tableId, viewId).getState().sorting;
    const currentFilters = getFilteringStore(tableId, viewId).getState().rules;
    getViewsStore(tableId).getState().updateTableDraft({
      sorting: currentSorting,
      filters: currentFilters,
    });
    saveAsView(newName.trim());
    setNewName("");
    setCreatingNew(false);
  };

  return (
    <div className="flex min-w-0 items-start gap-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <p className="flex min-w-0 flex-1 items-center gap-1 text-lg font-medium text-primary transition-opacity hover:opacity-70">
            <span className="min-w-0 flex-1 truncate">{activeView.name}</span>
            <ChevronDownIcon
              className={cn(
                "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </p>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-52">
          {views.map((view) => (
            <DropdownMenuItem
              key={view.id}
              onSelect={() => switchView(view.id)}
              className={cn(
                "flex items-center justify-between gap-2",
                view.id === activeView.id && "font-medium text-primary",
              )}
            >
              {renamingId === view.id ? (
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRename(view.id)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") handleRename(view.id);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 text-xs"
                />
              ) : (
                <>
                  <span className="flex-1 truncate">{view.name}</span>
                  {view.id !== DEFAULT_TABLE_VIEW_ID && (
                    <span className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        title={t("editView")}
                        className="rounded p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(view.id);
                          setRenameValue(view.name);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        title={t("deleteView")}
                        className="rounded p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteView(view.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </>
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {creatingNew ? (
            <div className="flex items-center gap-1 px-2 py-1">
              <Input
                autoFocus
                placeholder={t("viewNamePlaceholder")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") handleSaveAs();
                  if (e.key === "Escape") setCreatingNew(false);
                }}
                className="h-6 text-xs"
              />

              <Button
                size="icon"
                type="button"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={handleSaveAs}
              >
                <CheckIcon className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => setCreatingNew(false)}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <DropdownMenuItem
              disabled={!hasChanges}
              onSelect={(e) => {
                e.preventDefault();
                setCreatingNew(true);
              }}
              className="text-muted-foreground"
            >
              <PlusIcon className="h-3 w-3" />
              {t("saveView")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasChanges && (
        <div className="flex items-center gap-1">
          <Button
            title={t("saveChanges")}
            variant="ghost"
            size="icon"
            type="button"
            className="size-7"
            onClick={() => {
              // Merge current sort/filter state into draft before saving
              const currentSorting = getSortingStore(tableId, viewId).getState()
                .sorting;
              const currentFilters = getFilteringStore(
                tableId,
                viewId,
              ).getState().rules;
              getViewsStore(tableId).getState().updateTableDraft({
                sorting: currentSorting,
                filters: currentFilters,
              });
              if (activeView.id === DEFAULT_TABLE_VIEW_ID) {
                setCreatingNew(true);
                setOpen(true);
              } else {
                saveChanges();
              }
            }}
          >
            <SaveIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            title={t("discardChanges")}
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={discardChanges}
          >
            <CircleXIcon className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
