"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/framework/components/dialog/ConfirmDialog";
import { hasPermission } from "@/framework/authorization/cache/permissions";
import { usePermissions } from "@/framework/authorization/hooks/usePermissions";
import type { ActionResult } from "@/framework/lib/actionResult";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { toastError, toastSuccess } from "@/framework/lib/toast";
import type { BulkActionsHookResult } from "@/framework/types/resource-hook-types";
import type { ContentDraft } from "./api";
import { contentDraftsDescriptor } from "./descriptor";
import { discardAction } from "./actions/discard";

type Ids = ContentDraft["id"][];

/** Each button's server action (./actions/<key>.ts), by key. */
const RUN: Record<string, (ids: Ids) => Promise<ActionResult<unknown>>> = {
  "discard": discardAction,
};

/**
 * The toolbar buttons declared in descriptor.actions: shown to users with "<resource>:<key>",
 * they run their server action for the open record or the selected rows.
 */
export function useContentDraftActions(): BulkActionsHookResult<ContentDraft> {
  const locale = useLocale();
  usePermissions();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<{ key: string; rows: ContentDraft[] } | null>(null);
  const declared = contentDraftsDescriptor.actions ?? [];

  const run = async (key: string, rows: ContentDraft[]) => {
    const action = declared.find((item) => item.key === key);
    const result = await RUN[key]?.(rows.map((row) => row["id"]));
    if (!result) return;
    if (!result.ok) {
      toastError(result.error.message);
      return;
    }
    if (action) toastSuccess(resolveLabel(action.label, locale));
    // An action may change other records too (a discard changes the entry's status): reload what's shown.
    await queryClient.invalidateQueries();
  };

  const confirming = pending ? declared.find((item) => item.key === pending.key) : undefined;

  return {
    actions: declared.map((action) => ({
      key: action.key,
      label: resolveLabel(action.label, locale),
      destructive: action.destructive,
      isEligible: () => hasPermission(`${contentDraftsDescriptor.id}:${action.key}`),
      onSelect: (rows) => (action.confirm ? setPending({ key: action.key, rows }) : run(action.key, rows)),
    })),
    bulkResult: null,
    clearBulkResult: () => {},
    confirmDialog: (
      <ConfirmDialog
        open={!!confirming}
        setOpen={(open) => !open && setPending(null)}
        title={confirming ? resolveLabel(confirming.label, locale) : ""}
        description={confirming?.confirm ? resolveLabel(confirming.confirm, locale) : ""}
        confirmLabel={confirming ? resolveLabel(confirming.label, locale) : ""}
        variant={confirming?.destructive ? "destructive" : "default"}
        onConfirm={() => {
          const current = pending;
          setPending(null);
          if (current) void run(current.key, current.rows);
        }}
      />
    ),
  };
}
