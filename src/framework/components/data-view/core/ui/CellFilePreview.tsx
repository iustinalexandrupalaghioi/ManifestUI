import { useTranslations } from "next-intl"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  TooltipContent,
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useCoarsePointer } from "../../../files"
import {
  getMimeTypeFromPath,
  getFileCategory,
  FileCategoryIcon,
} from "../../../files/components/FileUtils"

interface CellFilePreviewProps {
  src: string
  path: string
  filename?: string
  mimeType?: string
}

export function CellFilePreview({
  src,
  path,
  filename,
  mimeType,
}: CellFilePreviewProps) {
  const t = useTranslations("Files")
  const isCoarse = useCoarsePointer()
  const resolvedFilename = filename || path.split("/").pop() || t("file")
  const resolvedMimeType = mimeType || getMimeTypeFromPath(path)
  const category = getFileCategory(resolvedMimeType)

  const trigger = (
    <button
      type="button"
      className="touch-action-manipulation flex min-w-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline"
      style={{ touchAction: "manipulation" }}
    >
      <FileCategoryIcon
        mimeType={resolvedMimeType}
        className="size-3 shrink-0"
      />
      <span className="truncate" title={resolvedFilename}>
        {resolvedFilename}
      </span>
    </button>
  )

  const preview = (
    <div className="flex flex-col overflow-hidden rounded-md">
      {category === "image" && (
        <img
          src={src}
          alt={resolvedFilename}
          className="h-48 w-48 object-cover"
          loading="lazy"
        />
      )}
      {category === "pdf" && (
        <iframe
          src={`${src}#toolbar=0&navpanes=0&view=FitH`}
          className="h-[60vh] w-[90vw] border-0 md:h-96 md:w-80"
          title={resolvedFilename}
        />
      )}
      {category === "other" && (
        <div className="p-3 text-xs text-muted-foreground">
          {t("noPreviewAvailable")}
        </div>
      )}
    </div>
  )

  if (category === "other") {
    return trigger
  }

  if (isCoarse) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          className="w-fit max-w-none p-1"
          collisionPadding={8}
        >
          {preview}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-none p-1">
          {preview}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
