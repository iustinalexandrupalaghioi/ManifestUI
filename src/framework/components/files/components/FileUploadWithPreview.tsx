"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { UploadCloud } from "lucide-react";
import { cn } from "@/framework/lib/utils";
import { FileActions } from "./FileActions";
import { FileCategoryIcon, getFileCategory } from "./FileUtils";

export interface FileUploadWithPreviewProps {
  src: string | null;
  mimeType?: string;
  filename: string;
  alt?: string;
  fallback?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  rounded?: string;
  onDelete?: () => Promise<void>;
  onFilesAdded?: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUploadWithPreview({
  src,
  mimeType = "application/octet-stream",
  filename,
  alt = filename,
  fallback,
  width = 96,
  height = 96,
  rounded = "rounded-lg",
  onDelete,
  onFilesAdded,
  accept,
  maxSize,
  disabled,
  className,
}: FileUploadWithPreviewProps) {
  const t = useTranslations("Files");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  const style = { width, height };

  if (!src) {
    if (!onFilesAdded) {
      return (
        <div
          className={cn(
            "flex items-center justify-center border bg-muted text-muted-foreground",
            rounded,
            className,
          )}
          style={style}
        >
          {fallback}
        </div>
      );
    }

    const processFiles = (incoming: FileList | File[]) => {
      setSizeError(null);
      const arr = Array.from(incoming);
      const oversized = arr.filter((f) => maxSize && f.size > maxSize);
      if (oversized.length) {
        setSizeError(
          t("exceedsLimit", {
            count: oversized.length,
            files: oversized.map((f) => f.name).join(", "),
            size: (maxSize! / 1024 / 1024).toFixed(0),
          }),
        );
        return;
      }
      if (arr.length) onFilesAdded(arr);
    };

    return (
      <div className="flex flex-col items-start gap-1.5">
        <p className="text-xs text-muted-foreground">{t("clickToUpload")}</p>

        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={t("uploadArea")}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (!disabled) processFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed p-2 text-center transition-colors",
            rounded,
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            disabled && "cursor-not-allowed opacity-50",
            className,
          )}
          style={style}
        >
          {fallback ?? <UploadCloud className="size-5 text-muted-foreground" />}
        </div>

        {sizeError && <p className="text-xs text-destructive">{sizeError}</p>}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) processFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    );
  }

  const category = getFileCategory(mimeType);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setActionsOpen((v) => !v)}
      className={cn(
        "group relative flex cursor-pointer items-center justify-center overflow-hidden border bg-muted",
        rounded,
        className,
      )}
      style={style}
    >
      {category === "image" ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <FileCategoryIcon mimeType={mimeType} className="size-8" />
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-black/60 to-transparent pt-6 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
          actionsOpen && "opacity-100",
        )}
      >
        <FileActions
          url={src}
          filename={filename}
          onDelete={onDelete}
          disabled={disabled}
          size="lg"
        />
      </div>
    </div>
  );
}
