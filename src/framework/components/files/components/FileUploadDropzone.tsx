import * as React from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/framework/lib/utils";
import type { UploadedFile } from "../storage/types";
import { FileUploadItem } from "./FileUploadItem";

interface FileUploadDropzoneProps {
  files: UploadedFile[];
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUploadDropzone({
  files,
  onFilesAdded,
  onFileRemove,
  accept,
  multiple = true,
  maxFiles,
  maxSize,
  disabled,
  className,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [sizeError, setSizeError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const canAdd = !maxFiles || files.length < maxFiles;

  const processFiles = React.useCallback(
    (incoming: FileList | File[]) => {
      setSizeError(null);
      const arr = Array.from(incoming);

      const oversized = arr.filter((f) => maxSize && f.size > maxSize);
      if (oversized.length) {
        setSizeError(
          `${oversized.map((f) => f.name).join(", ")} exceed${oversized.length === 1 ? "s" : ""} the ${(maxSize! / 1024 / 1024).toFixed(0)} MB limit`,
        );
        return;
      }

      const toAdd = maxFiles ? arr.slice(0, maxFiles - files.length) : arr;
      if (toAdd.length) onFilesAdded(toAdd);
    },
    [maxFiles, maxSize, files.length, onFilesAdded],
  );

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || !canAdd) return;
      processFiles(e.dataTransfer.files);
    },
    [disabled, canAdd, processFiles],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={disabled || !canAdd ? -1 : 0}
        aria-label="File upload area"
        onClick={() => !disabled && canAdd && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled && canAdd) inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && canAdd) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
          (disabled || !canAdd) && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="rounded-full border bg-muted p-3">
          <UploadCloud className="size-5 text-muted-foreground" />
        </div>

        <div>
          <p className="text-sm font-medium">
            {isDragging ? "Drop files here" : "Drag & drop or click to upload"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[
              accept && `Accepted: ${accept}`,
              maxSize && `Max ${(maxSize / 1024 / 1024).toFixed(0)} MB`,
              maxFiles && `Up to ${maxFiles} file${maxFiles > 1 ? "s" : ""}`,
            ]
              .filter(Boolean)
              .join(" · ") || "Any file type"}
          </p>
        </div>
      </div>

      {sizeError && <p className="text-xs text-destructive">{sizeError}</p>}

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((entry) => (
            <FileUploadItem
              key={entry.id}
              entry={entry}
              onRemove={() => onFileRemove(entry.id)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={onInputChange}
      />
    </div>
  );
}
