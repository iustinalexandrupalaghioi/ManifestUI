"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { BaseDialog } from "./BaseDialog";

interface ConfirmDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  setOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const t = useTranslations("Common");
  const resolvedCancelLabel = cancelLabel ?? t("goBack");
  const footer = (
    <div className="flex w-full flex-col gap-2 md:flex-row-reverse">
      <Button
        type="button"
        variant={variant}
        className="w-full md:flex-1"
        onClick={() => {
          onConfirm();
          setOpen(false);
        }}
      >
        {confirmLabel}
      </Button>
      <DialogClose asChild>
        <Button type="button" variant="outline" className="w-full md:flex-1">
          {resolvedCancelLabel}
        </Button>
      </DialogClose>
    </div>
  );

  return (
    <BaseDialog open={open} setOpen={setOpen} title={title} footer={footer}>
      <div className="px-4 text-sm text-muted-foreground">{description}</div>
    </BaseDialog>
  );
}
