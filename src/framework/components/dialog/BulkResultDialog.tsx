"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DialogClose } from "@/components/ui/dialog";
import type { BulkActionFailure, BulkActionResult } from "@/framework/lib/actionResult";
import { renderErrorDetails } from "./ErrorDialog";
import { AlertTriangleIcon, ChevronDownIcon } from "lucide-react";
import { BaseDialog } from "./BaseDialog";

interface BulkResultDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  result: BulkActionResult | null;
  itemLabel?: string;
  pluralLabel?: string;
  getItemHref?: (id: string) => string;
}

export function BulkResultDialog({
  open,
  setOpen,
  result,
  itemLabel,
  pluralLabel,
  getItemHref,
}: BulkResultDialogProps) {
  const t = useTranslations("BulkResult");
  const tc = useTranslations("Common");
  const tErr = useTranslations("ErrorDialog");

  if (!result) return null;

  const resolvedItemLabel = itemLabel ?? t("defaultItemLabel");
  const plural = pluralLabel ?? `${resolvedItemLabel}s`;

  const footer = (
    <DialogClose asChild>
      <Button type="button" className="w-full">
        {tc("close")}
      </Button>
    </DialogClose>
  );

  const itemLink = (id: string) =>
    getItemHref ? (
      <Link
        target="_blank"
        href={getItemHref(id)}
        onClick={(e) => e.stopPropagation()}
        className="underline underline-offset-2"
      >
        {resolvedItemLabel} #{id}
      </Link>
    ) : (
      <span>
        {resolvedItemLabel} #{id}
      </span>
    );

  const failureExtra = (failure: BulkActionFailure) =>
    renderErrorDetails(
      {
        message: failure.message,
        originalMessage: failure.message,
        meta: failure.meta,
      },
      tErr,
    );

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      title={result.summary}
      className="md:min-w-lg"
      footer={footer}
    >
      <div className="scrollbar-thumb-rounded scrollbar-thin flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-4 scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80">
        {result.failures.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("failed", {
                label: (result.failures.length === 1
                  ? resolvedItemLabel
                  : plural
                ).toLowerCase(),
              })}
            </p>

            {result.failures.length === 1 ? (
              <div className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                  {itemLink(result.failures[0].id)}
                </div>
                <p className="text-sm text-foreground">
                  {result.failures[0].message}
                </p>
                {failureExtra(result.failures[0])}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {result.failures.map((failure) => (
                  <Collapsible key={failure.id} className="rounded-md border">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="group w-full justify-between px-3 text-xs font-medium"
                      >
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <AlertTriangleIcon className="h-3.5 w-3.5" />
                          {itemLink(failure.id)}
                        </span>
                        <ChevronDownIcon className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="flex flex-col gap-2 border-t px-3 py-3">
                      <p className="text-sm text-foreground">{failure.message}</p>
                      {failureExtra(failure)}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </BaseDialog>
  );
}
