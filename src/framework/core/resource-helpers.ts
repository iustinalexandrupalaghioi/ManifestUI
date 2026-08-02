"use client";

import { mapPgError } from "@/framework/lib/mapPgError";
import { ActionResultError } from "@/framework/lib/actionResult";
import type { AppError } from "@/framework/types/global/AppError";
import { useState } from "react";
import { toastLoading, toastUpdate } from "@/framework/lib/toast";
import { useUploadStore } from "../components/form/hooks/useUploadStore";
import type { UploadEntry } from "../registry/UploadRegistryContext";

export function mapErr(err: any): AppError {
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
  return mapPgError({
    message: e?.message ?? "An unexpected error occurred.",
    code: e?.code,
    details: e?.details ?? e?.detail,
    hint: e?.hint,
  });
}

export function useFileErrorState() {
  const [fileError, setFileError] = useState<AppError | null>(null);
  const [fileErrorOpen, setFileErrorOpen] = useState(false);

  const setError = (err: any) => {
    setFileError(mapErr(err));
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
): Promise<void> {
  if (!pending.length) {
    useUploadStore.getState().clearAll(formId);
    return;
  }

  useUploadStore.getState().setUploading(formId, true);
  const toastId = toastLoading(`Uploading ${label} files...`);
  try {
    const patches: Record<string, string> = {};
    for (const entry of pending) {
      const existingPath = data[entry.pathField] as string | undefined;
      const result = await entry.handleOperation(id, existingPath);
      if (result.action !== "none") {
        patches[entry.pathField] = result.path ?? "";
      }
    }
    if (Object.keys(patches).length) {
      await updateAsync({ id, data: { ...data, ...patches } as TFormValues });
    }
    useUploadStore.getState().clearAll(formId);
    toastUpdate(toastId, "success", `${label} files uploaded!`);
  } catch {
    useUploadStore.getState().setUploading(formId, false);
    toastUpdate(toastId, "error", `Failed to upload ${label} files.`);
  }
}
