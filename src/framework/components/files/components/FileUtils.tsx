import { FileIcon, ImageIcon, FileTextIcon } from "lucide-react"
import { cn } from "@/framework/lib/utils"

export type FileCategory = "image" | "pdf" | "other"

export function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType === "application/pdf") return "pdf"
  return "other"
}

export function getMimeTypeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    txt: "text/plain",
    csv: "text/csv",
  }
  return map[ext ?? ""] ?? "application/octet-stream"
}

export function FileCategoryIcon({
  mimeType,
  className,
}: {
  mimeType: string
  className?: string
}) {
  const category = getFileCategory(mimeType)
  if (category === "image")
    return <ImageIcon className={cn("text-primary", className)} />
  if (category === "pdf")
    return <FileTextIcon className={cn("text-destructive", className)} />
  return <FileIcon className={cn("text-muted-foreground", className)} />
}
