"use client";

import type { FieldValues, UseFormHandleSubmit } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useSaveWithUploads } from "./useSaveWithUploads";

interface UseAddSaveOptions<TFormValues extends FieldValues> {
  formId: string;
  handleSubmit: UseFormHandleSubmit<TFormValues>;
  addAsync: (data: TFormValues) => Promise<number | string>;
  updateAsync: (payload: {
    id: number | string;
    data: TFormValues;
  }) => Promise<void>;
  reset: () => void;
  label: string;
  gender?: "masculine" | "feminine" | "neuter";
  onComplete: () => void;
  trackFileUploads?: boolean;
}

/**
 * Creates a new record. Wraps useSaveWithUploads: "persist" is a create,
 * and the form is reset afterwards so the screen is ready for another add.
 */
export function useAddSave<TFormValues extends FieldValues>({
  formId,
  handleSubmit,
  addAsync,
  updateAsync,
  reset,
  label,
  gender = "masculine",
  onComplete,
  trackFileUploads = true,
}: UseAddSaveOptions<TFormValues>) {
  const t = useTranslations("Toast");
  return useSaveWithUploads<TFormValues>({
    formId,
    handleSubmit,
    persist: (data) => addAsync(data),
    onPersisted: () => reset(),
    updateAsync,
    label,
    successMessage: t("created", { label, gender }),
    onComplete,
    trackFileUploads,
  });
}
