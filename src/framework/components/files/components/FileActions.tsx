"use client"

import { useState } from "react"
import { Button } from "@/framework/components/ui/button"
import { DownloadIcon, Trash2Icon } from "lucide-react"

interface FileActionsProps {
  url: string
  filename: string
  onDelete?: () => Promise<void>
  disabled?: boolean
}

export function FileActions({
  url,
  filename,
  onDelete,
  disabled,
}: FileActionsProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDownload = async () => {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-1 p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        title="Download"
        disabled={disabled}
        onClick={handleDownload}
      >
        <DownloadIcon className="size-3.5" />
      </Button>

      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          title="Delete"
          disabled={deleting || disabled}
          onClick={handleDelete}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
