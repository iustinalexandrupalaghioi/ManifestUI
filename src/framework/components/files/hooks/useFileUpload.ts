"use client"

import { useCallback, useState } from "react"
import { getStorageHandler } from "../storage/handler"
import type { UploadedFile } from "../storage/types"
import { mapError } from "@/framework/lib/mapError"
import type { AppError } from "@/framework/types/global/AppError"

interface UseFileUploadOptions {
  bucket?: string
  uploadImmediately?: boolean
  onUploadComplete?: (file: UploadedFile) => void
  onUploadError?: (file: UploadedFile, error: AppError) => void
  onRemoveError?: (error: AppError) => void
}

export function useFileUpload({
  bucket = "uploads",
  uploadImmediately = false,
  onUploadComplete,
  onUploadError,
  onRemoveError,
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<UploadedFile[]>([])

  const updateFile = useCallback((id: string, patch: Partial<UploadedFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }, [])

  const addFiles = useCallback(
    async (incoming: File[]) => {
      const newEntries: UploadedFile[] = incoming.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: uploadImmediately ? "uploading" : "idle",
        progress: 0,
      }))

      setFiles((prev) => [...prev, ...newEntries])

      if (!uploadImmediately) return

      const handler = getStorageHandler()

      await Promise.all(
        newEntries.map(async (entry) => {
          try {
            const result = await handler.upload(entry.file, {
              bucket,
              onProgress: ({ percentage }) =>
                updateFile(entry.id, { progress: percentage }),
            })

            const completed: UploadedFile = {
              ...entry,
              url: result.url,
              storagePath: result.path,
              status: "done",
              progress: 100,
            }

            updateFile(entry.id, completed)
            onUploadComplete?.(completed)
          } catch (err) {
            const error = mapError(
              err instanceof Error ? err : new Error(String(err))
            )
            const failed: UploadedFile = {
              ...entry,
              status: "error",
              error: error.message,
            }
            updateFile(entry.id, failed)
            onUploadError?.(failed, error)
          }
        })
      )
    },
    [bucket, uploadImmediately, updateFile, onUploadComplete, onUploadError]
  )

  const removeFile = useCallback(
    async (id: string) => {
      const entry = files.find((f) => f.id === id)

      if (entry?.storagePath) {
        try {
          const handler = getStorageHandler()
          await handler.remove({ bucket, path: entry.storagePath })
        } catch (err) {
          onRemoveError?.(
            mapError(err instanceof Error ? err : new Error(String(err)))
          )
          return
        }
      }

      setFiles((prev) => prev.filter((f) => f.id !== id))
    },
    [files, bucket, onRemoveError]
  )

  return { files, addFiles, removeFile }
}
