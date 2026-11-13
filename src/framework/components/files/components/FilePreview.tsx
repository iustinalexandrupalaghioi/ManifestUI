import { useTranslations } from "next-intl";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCoarsePointer } from "../hooks/useCoarsePointer";
import { FileActions } from "./FileActions";
import { FileCategoryIcon, getFileCategory } from "./FileUtils";

export interface PreviewBodyProps {
  src: string;
  alt: string;
  filename: string;
  mimeType: string;
  onDelete?: () => Promise<void>;
}

export function PreviewBody({ src, alt, mimeType }: PreviewBodyProps) {
  const category = getFileCategory(mimeType);

  return (
    <div className="flex flex-col overflow-hidden rounded-md">
      {category === "image" && (
        <img
          src={src}
          alt={alt}
          className="h-48 w-48 object-cover md:h-64 md:w-64"
          loading="lazy"
        />
      )}
      {category === "pdf" && (
        <iframe
          src={`${src}#toolbar=0&navpanes=0&view=FitH`}
          className="h-[60vh] w-[90vw] border-0 md:h-150 md:w-125"
          title={alt}
        />
      )}
    </div>
  );
}

export interface FilePreviewProps {
  src: string;
  mimeType: string;
  filename: string;
  alt?: string;
  onDelete?: () => Promise<void>;
  disabled: boolean;
}

export function FilePreview({
  src,
  mimeType,
  filename,
  alt = filename,
  onDelete,
  disabled,
}: FilePreviewProps) {
  const t = useTranslations("Files");
  const isCoarse = useCoarsePointer();
  const category = getFileCategory(mimeType);

  const categoryLabel =
    category === "image"
      ? t("image")
      : category === "pdf"
        ? t("pdf")
        : t("file");

  const trigger = (
    <div className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-2 text-sm">
      <FileCategoryIcon mimeType={mimeType} className="size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{filename}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("clickToPreview", { category: categoryLabel })}
        </p>
      </div>
      <FileActions
        url={src}
        filename={filename}
        onDelete={onDelete}
        disabled={disabled}
      />
    </div>
  );

  if (category === "other") {
    return trigger;
  }

  const body = (
    <PreviewBody
      src={src}
      alt={alt}
      filename={filename}
      mimeType={mimeType}
      onDelete={onDelete}
    />
  );

  if (isCoarse) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          side="bottom"
          className="w-fit max-w-none p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {body}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-none p-0">
          {body}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
