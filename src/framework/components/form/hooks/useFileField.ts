"use client"

import { getStorageHandler } from "@/framework/components/files"
import { getMimeTypeFromPath } from "@/framework/components/files/components/FileUtils"
import { useContext, useEffect, useRef } from "react"
import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { FormIdContext } from "../contexts/FormIdContext"
import { UploadRegistryContext } from "../../../registry/UploadRegistryContext"
import { selectIsUploading, useUploadStore } from "./useUploadStore"
import type { FieldCondition } from "../types/types"
import type { TranslatableText } from "@/framework/types/i18n-types"

export interface FileFieldConfig {
  type: "file"
  name: string
  label: TranslatableText
  span?: number
  className?: string
  disabled?: boolean | FieldCondition
  bucket: string
  accept?: string
  maxSize?: number
  maxFiles?: number
  preview?: boolean
}

export function useFileField(fieldName: string, bucket: string) {
  const t = useTranslations("Files")
  const { watch, setValue } = useFormContext()
  const registry = useContext(UploadRegistryContext)
  const formId = useContext(FormIdContext)

  const { storeFile, clearFile, markDelete, clearField, setOriginalPath } =
    useUploadStore()

  // Reactive selectors scoped to this form
  const storedFile = useUploadStore(
    (state) => state.files.get(`${formId}:${fieldName}`) ?? null
  )
  const pendingDelete = useUploadStore((state) =>
    state.deletes.has(`${formId}:${fieldName}`)
  )
  const isUploading = useUploadStore(selectIsUploading(formId))

  // Refs for synchronous access inside async handleOperation
  const storedFileRef = useRef<File | null>(storedFile)
  const pendingDeleteRef = useRef(pendingDelete)
  const fieldNameRef = useRef(fieldName)

  useEffect(() => {
    storedFileRef.current = storedFile
  }, [storedFile])
  useEffect(() => {
    pendingDeleteRef.current = pendingDelete
  }, [pendingDelete])

  // Track original path for cleanup on replace/delete
  const currentPath = watch(fieldName) as string | undefined
  useEffect(() => {
    if (currentPath) setOriginalPath(formId, fieldName, currentPath)
  }, [currentPath])

  // --- Handlers ---
  const handleFilesAdded = (incoming: File[]) => {
    const f = incoming[0]
    if (!f) return
    storeFile(formId, fieldName, f)
  }

  const handleFileRemove = () => {
    clearFile(formId, fieldName)
  }

  const handleDelete = async () => {
    markDelete(formId, fieldName, currentPath ?? "")
    setValue(fieldName, "", { shouldDirty: true })
  }

  const handleOperation = async (existingPath?: string) => {
    const storage = getStorageHandler()
    const currentFile = storedFileRef.current
    const isPendingDelete = pendingDeleteRef.current
    const originalPath = useUploadStore
      .getState()
      .originalPaths.get(`${formId}:${fieldName}`)
    const pathToRemove = existingPath || originalPath || currentPath

    const safeRemove = async (path: string) => {
      try {
        await storage.remove({ bucket, path })
      } catch {
        /* file may not exist */
      }
    }

    if (isPendingDelete && !currentFile) {
      if (pathToRemove) await safeRemove(pathToRemove)
      return { action: "deleted" as const, path: "" }
    }

    if (currentFile) {
      if (pathToRemove) await safeRemove(pathToRemove)
      const result = await storage.upload(currentFile, {
        bucket,
        // A client-generated key, not the record id — keeps the upload
        // decoupled from whatever id the record ends up with.
        path: `${crypto.randomUUID()}/${currentFile.name}`,
      })
      return { action: "uploaded" as const, path: result.path }
    }

    return { action: "none" as const, path: undefined }
  }
  const reset = () => {
    clearField(formId, fieldName)
  }

  // Re-register on every render so registry always has fresh closures
  if (registry) {
    registry.register(fieldNameRef.current, {
      pathField: fieldName,
      handleOperation,
      reset,
    })
  }

  // Unregister only on unmount
  useEffect(() => {
    return () => registry?.unregister(fieldNameRef.current)
  }, [])

  // --- Derived display values ---
  const isDirty = storedFile !== null || pendingDelete
  const currentPathForDisplay = pendingDelete ? undefined : currentPath
  const previewUrl = currentPathForDisplay
    ? getStorageHandler().getPublicUrl({ bucket, path: currentPathForDisplay })
    : null

  return {
    files: storedFile
      ? [
          {
            id: "current",
            file: storedFile,
            status: "idle" as const,
            progress: 0,
          },
        ]
      : [],
    previewUrl,
    mimeType: currentPathForDisplay
      ? getMimeTypeFromPath(currentPathForDisplay)
      : undefined,
    filename: currentPathForDisplay
      ? (currentPathForDisplay.split("/").pop() ?? t("file"))
      : undefined,
    isDirty,
    isUploading,
    handleFilesAdded,
    handleFileRemove,
    handleDelete,
    handleOperation,
    reset,
  }
}
