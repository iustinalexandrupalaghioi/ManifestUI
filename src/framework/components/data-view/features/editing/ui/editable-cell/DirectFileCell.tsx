"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toastError } from "@/framework/lib/toast";
import { getStorageHandler } from "@/framework/components/files";
import {
  FileCategoryIcon,
  getMimeTypeFromPath,
} from "@/framework/components/files/components/FileUtils";
import type { FieldConfig } from "@/framework/components/form/types/types";

export function DirectFileCell({
  field,
  value,
  onChange,
}: {
  field: Extract<FieldConfig<any>, { type: "file" }>;
  value: string | undefined;
  onChange: (path: string) => void;
}) {
  const t = useTranslations("Files");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const filename = value ? (value.split("/").pop() ?? undefined) : undefined;
  const mimeType = value ? getMimeTypeFromPath(value) : undefined;
  const previewUrl = value
    ? getStorageHandler().getPublicUrl({ bucket: field.bucket, path: value })
    : null;

  const removeExisting = async () => {
    if (!value) return;
    try {
      await getStorageHandler().remove({ bucket: field.bucket, path: value });
    } catch {
      /* file may not exist */
    }
  };

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      await removeExisting();
      const result = await getStorageHandler().upload(file, {
        bucket: field.bucket,
        path: `${crypto.randomUUID()}/${file.name}`,
      });
      onChange(result.path);
    } catch {
      toastError(t("uploadFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await removeExisting();
      onChange("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-1">
      {previewUrl && filename ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-muted-foreground hover:underline"
        >
          <FileCategoryIcon
            mimeType={mimeType ?? "application/octet-stream"}
            className="size-3 shrink-0"
          />
          <span className="truncate" title={filename}>
            {filename}
          </span>
        </a>
      ) : (
        <span className="min-w-0 flex-1 truncate text-muted-foreground">—</span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <UploadIcon className="size-3.5" />
        )}
      </Button>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="size-4 shrink-0 text-muted-foreground hover:text-foreground"
          disabled={busy}
          onClick={handleDelete}
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={field.accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}
