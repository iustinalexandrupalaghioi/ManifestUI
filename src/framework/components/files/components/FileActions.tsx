"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { DownloadIcon, Trash2Icon } from "lucide-react"
import { cn } from "@/framework/lib/utils"

interface FileActionsProps {
  url: string
  filename: string
  onDelete?: () => Promise<void>
  disabled?: boolean
  size?: "default" | "lg"
}

export function FileActions({
  url,
  filename,
  onDelete,
  disabled,
  size = "default",
}: FileActionsProps) {
  const t = useTranslations("Files")
  const [deleting, setDeleting] = useState(false)
  const buttonSize = size === "lg" ? "size-9" : "size-7"
  const iconSize = size === "lg" ? "size-5" : "size-3.5"

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
        className={buttonSize}
        title={t("download")}
        disabled={disabled}
        onClick={handleDownload}
      >
        <DownloadIcon className={iconSize} />
      </Button>

      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(buttonSize, "text-destructive hover:text-destructive")}
          title={t("delete")}
          disabled={deleting || disabled}
          onClick={handleDelete}
        >
          <Trash2Icon className={iconSize} />
        </Button>
      )}
    </div>
  )
}
