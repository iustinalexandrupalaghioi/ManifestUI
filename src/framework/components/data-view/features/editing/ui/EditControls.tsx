"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import { PencilIcon, SaveIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDataViewCore } from "../../../core/stores/DataViewProvider";
import { useActiveMode } from "../../../core/stores/ViewModeStore";
import { useBeforeUnloadWarning } from "@/framework/hooks/useBeforeUnloadWarning";
import { ResultDialog } from "@/framework/components/dialog/ResultDialog";
import type { BulkActionResult } from "@/framework/lib/actionResult";
import { getEditingStore } from "../editing.store";

export function EditControls() {
  const t = useTranslations("Editing");
  const { table, tableId } = useDataViewCore();
  const activeMode = useActiveMode(tableId);
  const store = getEditingStore(tableId);
  const editMode = store((s) => s.editMode);
  const pendingEdits = store((s) => s.pendingEdits);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<BulkActionResult | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const canUpdate = !!table.options.meta?.updateManyAsync;
  const dirtyRowIds = Object.keys(pendingEdits);
  const isDirty = dirtyRowIds.length > 0;

  useBeforeUnloadWarning(isDirty || saving);

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

    const bulkResult = await updateManyAsync(items);
    store.getState().clearRows(bulkResult.succeededIds);
    if (bulkResult.failures.length > 0) setResult(bulkResult);
    setSaving(false);
  };

  const handleDiscard = () => store.getState().discardAll();

  if (editMode) {
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
        <ResultDialog
          open={!!result}
          setOpen={(open) => !open && setResult(null)}
          result={result}
        />
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={() => store.getState().setEditMode(true)}
      title={t("edit")}
    >
      <PencilIcon />
      {t("edit")}
    </Button>
  );
}
