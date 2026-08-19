"use client";

import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import {
  toFailureResult,
  type BulkActionResult,
} from "@/framework/lib/actionResult";
import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BaseDialog } from "./BaseDialog";
import { mapErr } from "@/framework/core/resource-helpers";

interface DeleteDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  itemLabel?: string;
  pluralLabel?: string;
  gender?: "masculine" | "feminine" | "neuter";
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
  itemLabel,
  pluralLabel,
  gender,
  confirmationMessage,
  queryKeys,
  deleteFn,
  onSuccess,
  onBulkResult,
}: DeleteDialogProps) {
  const t = useTranslations("Dialog");
  const tc = useTranslations("Common");
  const tBulk = useTranslations("BulkResult");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const ids = Array.isArray(id) ? id : [id];
  const isMulti = ids.length > 1;

  const label = (itemLabel ?? tBulk("defaultItemLabel")).toLowerCase();
  const labelPlural = (pluralLabel ?? itemLabel ?? tBulk("defaultItemLabel")).toLowerCase();

  const defaultConfirmation = isMulti
    ? t("deleteConfirmMulti", {
        count: ids.length,
        label: labelPlural,
        gender: gender ?? "masculine",
      })
    : t("deleteConfirmSingle", { label, gender: gender ?? "masculine" });

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
      onBulkResult?.(toFailureResult(mapErr(err, locale), ids));
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
        {tc("delete")}
      </Button>

      <DialogClose className="w-full md:flex-1" asChild>
        <Button type="button" variant="outline">
          {tc("cancel")}
        </Button>
      </DialogClose>
    </div>
  );

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      title={t("deleteTitle", { label: isMulti ? labelPlural : label })}
      description={confirmationMessage ?? defaultConfirmation}
      className="md:min-w-2xl"
      footer={footer}
    />
  );
}
