"use client";

import { useRef } from "react";
import type { FieldValues, UseFormHandleSubmit } from "react-hook-form";
import { toastSuccess } from "@/framework/lib/toast";
import {
  runUploadsInBackground,
  useFileErrorState,
} from "@/framework/core/resource-helpers";
import {
  useUploadStore,
  selectHasChanges,
  selectIsUploading,
} from "@/framework/components/form/hooks/useUploadStore";
import type { UploadRegistry } from "@/framework/registry/UploadRegistryContext";

interface UseSaveWithUploadsOptions<TFormValues extends FieldValues> {
  formId: string;
  handleSubmit: UseFormHandleSubmit<TFormValues>;
  /** Persists the form data (create or update) and returns the record id
   *  that any pending file uploads should attach to. */
  persist: (data: TFormValues) => Promise<number | string>;
  /** Runs right after persist succeeds — e.g. `confirmSaved(data)` on the
   *  detail screen, or `reset()` on the add screen. Order relative to
   *  reading the upload snapshot doesn't matter: neither touches uploads. */
  onPersisted?: (data: TFormValues) => void;
  /** Used to attach files that finish uploading after the record is saved. */
  updateAsync: (payload: {
    id: number | string;
    data: TFormValues;
  }) => Promise<void>;
  /** Bare noun, e.g. "User" — used for "Uploading {label} files..." toasts. */
  label: string;
  successMessage: string;
  onComplete: () => void;
  trackFileUploads?: boolean;
}

/**
 * Shared core of "submit a record form, then run any pending file uploads
 * in the background." useRecordSave (update) and useAddSave (create) both
 * wrap this — the only real difference between them is what "persist" and
 * "what happens right after persisting" mean.
 */
export function useSaveWithUploads<TFormValues extends FieldValues>({
  formId,
  handleSubmit,
  persist,
  onPersisted,
  updateAsync,
  label,
  successMessage,
  onComplete,
  trackFileUploads = true,
}: UseSaveWithUploadsOptions<TFormValues>) {
  const registryRef = useRef<UploadRegistry | null>(null);
  const { fileError, fileErrorOpen, setFileErrorOpen } = useFileErrorState();

  const hasFileChanges = useUploadStore((state) =>
    trackFileUploads
      ? selectHasChanges(formId)(state) && !selectIsUploading(formId)(state)
      : false,
  );

  const onSave = handleSubmit(async (data: TFormValues) => {
    try {
      const id = await persist(data);
      const pending = registryRef.current?.snapshot() ?? [];
      onPersisted?.(data);
      onComplete();
      toastSuccess(successMessage);
      runUploadsInBackground(
        formId,
        id,
        data as Record<string, unknown>,
        pending,
        updateAsync as any,
        label,
      );
    } catch {
      // Form save errors handled by useMutations.error
    }
  });

  const onReset = (reset?: () => void) => {
    registryRef.current?.resetAll();
    useUploadStore.getState().clearAll(formId);
    reset?.();
  };

  return {
    registryRef,
    hasFileChanges,
    onSave,
    onReset,
    fileError,
    fileErrorOpen,
    setFileErrorOpen,
  };
}
