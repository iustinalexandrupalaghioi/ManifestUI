"use client";

import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/framework/components/dialog/BaseDialog";
import { ResourceForm } from "@/framework/components/form/form-register/ResourceForm";
import {
  BulkActionError,
  toFailureResult,
  type BulkActionResult,
} from "@/framework/lib/actionResult";
import type {
  ActionFormConfig,
  ResolvedResourceLabels,
} from "@/framework/types/resource-hook-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";

interface ActionFormDialogProps<TItem> {
  config: ActionFormConfig<TItem, any>;
  labels: ResolvedResourceLabels;
  items: TItem[];
  open: boolean;
  onClose: () => void;
  onError?: (result: BulkActionResult) => void;
  onSuccess?: () => void;
}

function resolveEmptyValues<TItem, TFormValues>(
  actionEmptyValues: TFormValues | ((item: TItem) => TFormValues),
  item: TItem,
): TFormValues {
  return typeof actionEmptyValues === "function"
    ? (actionEmptyValues as (item: TItem) => TFormValues)(item)
    : actionEmptyValues;
}

function resolveForm<TItem, TFormValues>(
  form:
    | import("@/framework/components/form/types/types").FormConfig<TFormValues>
    | ((
        item: TItem,
      ) => import("@/framework/components/form/types/types").FormConfig<TFormValues>),
  item: TItem,
) {
  return typeof form === "function"
    ? (form as (item: TItem) => any)(item)
    : form;
}

export function ActionFormDialog<TItem>({
  config,
  items,
  open,
  onClose,
  onError,
  onSuccess,
}: ActionFormDialogProps<TItem>) {
  const t = useTranslations("Common");
  const tErr = useTranslations("Errors");
  const [isSaving, setIsSaving] = useState(false);
  const submit = config.useSubmit();

  const resolvedEmptyValues = resolveEmptyValues(
    config.actionEmptyValues,
    items[0],
  );
  const resolvedForm = resolveForm(config.form, items[0]);

  const form = useForm({
    resolver: zodResolver(config.actionSchema),
    defaultValues: resolvedEmptyValues as any,
  });

  const handleSave = form.handleSubmit(async (data) => {
    setIsSaving(true);
    try {
      await submit(items, data);
      onSuccess?.();
    } catch (err) {
      const result: BulkActionResult =
        err instanceof BulkActionError
          ? err.result
          : toFailureResult({
              message: err instanceof Error ? err.message : tErr("unknownError"),
            });
      onError?.(result);
    } finally {
      setIsSaving(false);
      form.reset(resolvedEmptyValues as any);
      onClose();
    }
  });

  const handleClose = () => {
    form.reset(resolvedEmptyValues as any);
    onClose();
  };

  return (
    <FormProvider {...form}>
      <BaseDialog
        open={open}
        setOpen={(v: boolean) => {
          if (!v) handleClose();
        }}
        title={config.title}
        onClose={handleClose}
        footer={
          <div className="flex w-full flex-col gap-2 md:flex-row-reverse">
            <Button
              className="w-full md:flex-1"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? (
                <>
                  <Loader2Icon className="animate-spin" /> {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
            <Button
              className="w-full md:flex-1"
              onClick={handleClose}
              type="button"
              variant="outline"
            >
              {t("cancel")}
            </Button>
          </div>
        }
      >
        <div className="scrollbar-thumb-rounded scrollbar-thin overflow-y-auto p-4 scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80">
          <ResourceForm
            config={resolvedForm}
            item={items[0] as Record<string, unknown>}
          />
        </div>
      </BaseDialog>
    </FormProvider>
  );
}
