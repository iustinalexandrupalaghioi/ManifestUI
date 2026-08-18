import { FilePreview, FileUploadDropzone } from "@/framework/components/files"
import { cn } from "@/framework/lib/utils"
import { type FileFieldConfig, useFileField } from "../hooks/useFileField"
import { spanClass } from "./FieldRenderer"
import type { FieldCondition } from "../types/types"

export function FileFieldRenderer({
  field,
  disabled,
}: {
  field: FileFieldConfig
  disabled?: boolean | FieldCondition
}) {
  const {
    files,
    previewUrl,
    mimeType,
    filename,
    isUploading,
    handleFilesAdded,
    handleFileRemove,
    handleDelete,
  } = useFileField(field.name, field.bucket)

  const rawDisabled = typeof disabled === "function" ? disabled() : disabled
  const effectiveDisabled =
    rawDisabled ||
    (typeof field.disabled === "function" ? field.disabled() : field.disabled)

  return (
    <div className={cn("min-w-0", spanClass(field.span), field.className)}>
      <div className="flex flex-col gap-4">
        {previewUrl && mimeType && filename && (
          <FilePreview
            src={previewUrl}
            mimeType={mimeType}
            filename={filename}
            onDelete={effectiveDisabled ? undefined : handleDelete}
            disabled={isUploading}
          />
        )}
        {!effectiveDisabled && (
          <FileUploadDropzone
            files={files}
            onFilesAdded={handleFilesAdded}
            onFileRemove={handleFileRemove}
            accept={field.accept}
            maxFiles={field.maxFiles ?? 1}
            maxSize={field.maxSize ?? 50 * 1024 * 1024}
            disabled={isUploading}
          />
        )}
      </div>
    </div>
  )
}
