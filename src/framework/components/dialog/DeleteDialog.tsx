"use client";

import { Button } from "@/framework/components/ui/button";
import { DialogClose } from "@/framework/components/ui/dialog";
import type { BulkActionResult } from "@/framework/lib/actionResult";
import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { BaseDialog } from "./BaseDialog";
import { ErrorDialog } from "./ErrorDialog";
import { mapErr } from "@/framework/core/resource-helpers";
import type { AppError } from "@/framework/types/global/AppError";

interface DeleteDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  noun?: string;
  confirmationMessage?: ReactNode;
  id: string | number | (string | number)[];
  queryKeys: QueryKey[];
  deleteFn: () => Promise<BulkActionResult>;
  onSuccess?: () => void;
  onBulkResult?: (result: BulkActionResult) => void;
}

export function DeleteDialog({
  open,
  setOpen,
  id,
  noun,
  confirmationMessage,
  queryKeys,
  deleteFn,
  onSuccess,
  onBulkResult,
}: DeleteDialogProps) {
  const queryClient = useQueryClient();
  const ids = Array.isArray(id) ? id : [id];
  const isMulti = ids.length > 1;

  const label = noun ?? "item";
  const labelPlural = `${label}s`;

  const defaultConfirmation = isMulti
    ? `Are you sure you want to delete ${ids.length} ${labelPlural}?`
    : `Are you sure you want to delete this ${label}?`;

  const [error, setError] = useState<AppError | null>(null);
  const [errorOpen, setErrorOpen] = useState(false);

  const { mutate } = useMutation({
    mutationFn: deleteFn,
    onSuccess: async (result) => {
      if (result.failures.length === 0) {
        onSuccess?.();
      } else {
        onBulkResult?.(result);
      }

      if (result.succeededIds.length > 0) {
        for (const queryKey of queryKeys) {
          await queryClient.invalidateQueries({ queryKey });
        }
      }
    },
    onError: (err: unknown) => {
      setError(mapErr(err));
      setErrorOpen(true);
    },
  });

  const footer = (
    <div className="flex w-full flex-col gap-2 md:flex-row-reverse">
      <Button
        className="w-full md:flex-1"
        type="button"
        onClick={() => {
          setOpen(false);
          mutate();
        }}
      >
        Delete
      </Button>

      <DialogClose className="w-full md:flex-1" asChild>
        <Button type="button" variant="outline">
          Cancel
        </Button>
      </DialogClose>
    </div>
  );

  return (
    <>
      <BaseDialog
        open={open}
        setOpen={setOpen}
        title={isMulti ? `Delete ${labelPlural}` : `Delete ${label}`}
        description={confirmationMessage ?? defaultConfirmation}
        className="md:min-w-2xl"
        footer={footer}
      />

      <ErrorDialog open={errorOpen} setOpen={setErrorOpen} error={error} />
    </>
  );
}
