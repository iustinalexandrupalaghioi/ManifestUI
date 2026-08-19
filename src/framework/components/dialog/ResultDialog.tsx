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
import type {
  BulkActionFailure,
  BulkActionResult,
} from "@/framework/lib/actionResult";
import { AlertTriangleIcon, ChevronDownIcon } from "lucide-react";
import { ReactNode } from "react";
import { BaseDialog } from "./BaseDialog";

interface ResultDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  result: BulkActionResult | null;
  itemLabel?: string;
  getItemHref?: (id: string) => string;
}

export function ResultDialog({
  open,
  setOpen,
  result,
  itemLabel,
  getItemHref,
}: ResultDialogProps) {
  const t = useTranslations("BulkResult");
  const tc = useTranslations("Common");
  const tErr = useTranslations("ErrorDialog");

  if (!result) return null;

  const resolvedItemLabel = itemLabel ?? t("defaultItemLabel");

  const footer = (
    <DialogClose asChild>
      <Button type="button" className="w-full">
        {tc("close")}
      </Button>
    </DialogClose>
  );

  const itemLink = (failure: BulkActionFailure) => {
    const label = failure.id
      ? `${resolvedItemLabel} #${failure.id}`
      : resolvedItemLabel;
    return getItemHref && failure.id ? (
      <Link
        target="_blank"
        href={getItemHref(failure.id)}
        onClick={(e) => e.stopPropagation()}
        className="underline underline-offset-2"
      >
        {label}
      </Link>
    ) : (
      <span>{label}</span>
    );
  };

  const failureExtra = (failure: BulkActionFailure) =>
    renderErrorDetails(
      {
        message: failure.message,
        originalMessage: failure.originalMessage ?? failure.message,
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
            {result.failures.length === 1 ? (
              <div className="flex flex-col gap-2 rounded-md border border-destructive/30 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <AlertTriangleIcon className="h-4 w-4 shrink-0 text-destructive" />
                  {itemLink(result.failures[0])}
                </div>
                <p className="text-sm text-foreground">
                  {result.failures[0].message}
                </p>
                {failureExtra(result.failures[0])}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {result.failures.map((failure, index) => {
                  const extra = failureExtra(failure);
                  const header = (
                    <span className="flex items-center gap-2 text-foreground">
                      <AlertTriangleIcon className="h-4 w-4 shrink-0 text-destructive" />
                      {itemLink(failure)}
                    </span>
                  );

                  if (!extra) {
                    return (
                      <div
                        key={failure.id ?? index}
                        className="flex items-center rounded-md border border-destructive/30 px-3 py-2.5 text-sm font-medium"
                      >
                        {header}
                      </div>
                    );
                  }

                  return (
                    <Collapsible
                      key={failure.id ?? index}
                      className="overflow-hidden rounded-md border border-destructive/30"
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="group w-full justify-between rounded-none px-3 text-sm font-medium hover:bg-transparent aria-expanded:bg-transparent aria-expanded:text-foreground"
                        >
                          {header}
                          <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Button>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="flex flex-col gap-2 border-t px-3 py-3">
                        <p className="text-sm text-foreground">
                          {failure.message}
                        </p>
                        {extra}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </BaseDialog>
  );
}

type Translator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

interface ErrorDetailsSource {
  message: string;
  originalMessage: string;
  meta?: { type: string; [key: string]: unknown };
}

type ErrorExtraRenderer = (
  meta: Record<string, unknown>,
  t: Translator,
) => ReactNode;

const registry = new Map<string, ErrorExtraRenderer>();

export function registerErrorDetails(
  type: string,
  renderer: ErrorExtraRenderer,
) {
  registry.set(type, renderer);
}

export function renderErrorDetails(
  error: ErrorDetailsSource,
  t: Translator,
): ReactNode {
  if (!error.meta?.type) return null;
  const renderer = registry.get(error.meta.type);
  return renderer ? renderer(error.meta, t) : null;
}

interface FkReference {
  id: string;
  label: string;
  href?: string;
}

registerErrorDetails("fk-references", (meta, t) => {
  const references = (meta.references as FkReference[] | undefined) ?? [];
  const moreCount = (meta.moreCount as number | undefined) ?? 0;
  if (references.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
      {references.map((ref) => (
        <li key={ref.id}>
          {ref.href ? (
            <Link
              target="_blank"
              href={ref.href}
              className="underline underline-offset-2"
            >
              {ref.label} #{ref.id}
            </Link>
          ) : (
            <span>
              {ref.label} #{ref.id}
            </span>
          )}
        </li>
      ))}
      {moreCount > 0 && <li>{t("andMore", { count: moreCount })}</li>}
    </ul>
  );
});
