"use client";

import { useLocale } from "next-intl";
import { mapPgError } from "@/framework/lib/mapPgError";
import { ActionResultError } from "@/framework/lib/actionResult";
import type { AppError } from "@/framework/types/global/AppError";
import { useState } from "react";
import { dismissToast, toastLoading, toastUpdate } from "@/framework/lib/toast";
import { useUploadStore } from "../components/form/hooks/useUploadStore";
import type { UploadEntry } from "../registry/UploadRegistryContext";

export function mapErr(err: any, locale: string): AppError {
  if (err instanceof ActionResultError) {
    return {
      ...err.error,
      originalMessage: err.error.originalMessage ?? err.error.message,
    };
  }

  const e = err as {
    message?: string;
    code?: string;
    details?: string;
    detail?: string;
    hint?: string;
  };
  return mapPgError(
    {
      message: e?.message ?? "",
      code: e?.code,
      details: e?.details ?? e?.detail,
      hint: e?.hint,
    },
    locale,
  );
}

export function useFileErrorState() {
  const locale = useLocale();
  const [fileError, setFileError] = useState<AppError | null>(null);
  const [fileErrorOpen, setFileErrorOpen] = useState(false);

  const setError = (err: any) => {
    setFileError(mapErr(err, locale));
    setFileErrorOpen(true);
  };

  return { fileError, fileErrorOpen, setFileErrorOpen, setError };
}

export async function runUploadsInBackground<
  TFormValues extends Record<string, unknown>,
>(
  formId: string,
  id: number | string,
  data: TFormValues,
  pending: UploadEntry[],
  updateAsync: (payload: {
    id: number | string;
    data: TFormValues;
  }) => Promise<void>,
  label: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): Promise<void> {
  if (!pending.length) {
    useUploadStore.getState().clearAll(formId);
    return;
  }

  const lowerLabel = label.toLowerCase();
  useUploadStore.getState().setUploading(formId, true);

  // Read what's actually queued before running any of it, so the loading
  // toast says "uploading"/"deleting" correctly instead of always assuming
  // an upload — `pending` is every registered file field, not just changed
  // ones, so this can't be inferred from `pending.length` alone.
  const store = useUploadStore.getState();
  const prefix = `${formId}:`;
  const pendingUploadCount = [...store.files.keys()].filter((k) =>
    k.startsWith(prefix),
  ).length;
  const pendingDeleteCount = [...store.deletes].filter(
    (k) => k.startsWith(prefix) && !store.files.has(k),
  ).length;
  const toastId =
    pendingUploadCount > 0
      ? toastLoading(
          t("uploadingFiles", { label: lowerLabel, count: pendingUploadCount }),
        )
      : toastLoading(
          t("deletingFiles", {
            label: lowerLabel,
            count: pendingDeleteCount || 1,
          }),
        );
  try {
    const patches: Record<string, string> = {};
    let uploadedCount = 0;
    let deletedCount = 0;
    for (const entry of pending) {
      const existingPath = data[entry.pathField] as string | undefined;
      const result = await entry.handleOperation(existingPath);
      if (result.action !== "none") {
        patches[entry.pathField] = result.path ?? "";
      }
      if (result.action === "uploaded") uploadedCount++;
      if (result.action === "deleted") deletedCount++;
    }
    if (Object.keys(patches).length) {
      await updateAsync({ id, data: { ...data, ...patches } as TFormValues });
    }
    useUploadStore.getState().clearAll(formId);
    if (uploadedCount > 0) {
      toastUpdate(
        toastId,
        "success",
        t("filesUploaded", { label: lowerLabel, count: uploadedCount }),
      );
    } else if (deletedCount > 0) {
      toastUpdate(
        toastId,
        "success",
        t("filesDeleted", { label: lowerLabel, count: deletedCount }),
      );
    } else {
      dismissToast(toastId);
    }
  } catch {
    useUploadStore.getState().setUploading(formId, false);
    toastUpdate(toastId, "error", t("failedToUpload", { label: lowerLabel }));
  }
}
