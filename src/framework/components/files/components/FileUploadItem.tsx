import { Button } from "@/framework/components/ui/button"
import { Progress } from "@/framework/components/ui/progress"
import type { UploadedFile } from "../storage/types"
import { X } from "lucide-react"
import { FileCategoryIcon } from "./FileUtils"

interface FileUploadItemProps {
  entry: UploadedFile
  onRemove: () => void
  disabled?: boolean
}

export function FileUploadItem({
  entry,
  onRemove,
  disabled,
}: FileUploadItemProps) {
  const { file, status, progress, error } = entry

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-2 text-sm">
      <FileCategoryIcon mimeType={file.type} className="size-4 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{file.name}</p>

        {status === "idle" && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
        {status === "uploading" && (
          <Progress value={progress} className="mt-1 h-1" />
        )}
        {status === "done" && (
          <p className="mt-0.5 text-xs text-muted-foreground">Uploaded</p>
        )}
        {status === "error" && (
          <p className="mt-0.5 text-xs text-destructive">{error}</p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        disabled={disabled}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
