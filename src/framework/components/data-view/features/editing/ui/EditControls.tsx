"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import { PencilIcon, SaveIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDataViewCore } from "../../../core/stores/DataViewProvider";
import { useActiveMode } from "../../../core/stores/ViewModeStore";
import { useBeforeUnloadWarning } from "@/framework/hooks/useBeforeUnloadWarning";
import { getEditingStore } from "../editing.store";

export function EditControls() {
  const t = useTranslations("Editing");
  const { table, tableId } = useDataViewCore();
  const activeMode = useActiveMode(tableId);
  const store = getEditingStore(tableId);
  const storeArmed = store((s) => s.armed);
  const storePendingEdits = store((s) => s.pendingEdits);
  const [saving, setSaving] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const armed = storeArmed;
  const pendingEdits = storePendingEdits;

  const canUpdate = !!table.options.meta?.updateManyAsync;
  const dirtyRowIds = Object.keys(pendingEdits);
  const isDirty = dirtyRowIds.length > 0;

  useBeforeUnloadWarning(isDirty || saving);

  // Inline editing is a table-only affordance — no double-click/type-to-edit
  // wiring exists for the card list, so the toolbar button has nothing to do there.
  if (!mounted || !canUpdate || activeMode === "list") return null;

  const handleSave = async () => {
    const { updateManyAsync, getRecordId } = table.options.meta!;
    if (!updateManyAsync || !getRecordId || dirtyRowIds.length === 0) return;

    setSaving(true);
    const items = dirtyRowIds.map((rowId) => {
      const row = table.getRow(rowId);
      const patch = store.getState().pendingEdits[rowId] ?? {};
      return {
        id: getRecordId(row.original),
        data: { ...(row.original as Record<string, unknown>), ...patch },
      };
    });

    const { succeededIds } = await updateManyAsync(items);
    store.getState().clearRows(succeededIds);
    setSaving(false);
  };

  const handleDiscard = () => store.getState().discardAll();

  if (armed) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="default"
          size="sm"
          type="button"
          disabled={saving || !isDirty}
          onClick={handleSave}
          className="relative"
        >
          <SaveIcon />
          {t("save")}
          {isDirty && (
            <span
              className={cn(
                "absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center",
                "rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground",
              )}
            >
              {dirtyRowIds.length}
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={saving}
          onClick={handleDiscard}
          title={t("discard")}
        >
          <XIcon />
          {t("discard")}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => store.getState().setArmed(true)}
      title={t("edit")}
    >
      <PencilIcon />
      {t("edit")}
    </Button>
  );
}
