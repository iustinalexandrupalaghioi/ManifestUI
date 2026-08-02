"use client"

import type { FieldValues, UseFormHandleSubmit } from "react-hook-form"
import type { ResourceId } from "@/framework/types/resource-hook-types"
import { useSaveWithUploads } from "./useSaveWithUploads"

interface UseRecordSaveOptions<TFormValues extends FieldValues> {
  formId: string
  itemId: ResourceId
  handleSubmit: UseFormHandleSubmit<TFormValues>
  updateAsync: (payload: {
    id: ResourceId
    data: TFormValues
  }) => Promise<void>
  confirmSaved: (data: TFormValues) => void
  label: string
  onComplete: () => void
  trackFileUploads?: boolean
}

/**
 * Saves an existing record. Wraps useSaveWithUploads: "persist" is an
 * update, and the form isn't reset afterwards — confirmSaved() just tells
 * react-hook-form the current values are now the clean baseline.
 */
export function useRecordSave<TFormValues extends FieldValues>({
  formId,
  itemId,
  handleSubmit,
  updateAsync,
  confirmSaved,
  label,
  onComplete,
  trackFileUploads = true,
}: UseRecordSaveOptions<TFormValues>) {
  return useSaveWithUploads<TFormValues>({
    formId,
    handleSubmit,
    persist: (data) => updateAsync({ id: itemId, data }).then(() => itemId),
    onPersisted: confirmSaved,
    updateAsync,
    label,
    successMessage: `${label} updated!`,
    onComplete,
    trackFileUploads,
  })
}
