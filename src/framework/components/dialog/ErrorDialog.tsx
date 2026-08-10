"use client";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DialogClose } from "@/components/ui/dialog";
import type { AppError } from "@/framework/types/global/AppError";
import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ReactNode, useState, type Dispatch, type SetStateAction } from "react";
import { BaseDialog } from "./BaseDialog";

interface ErrorDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  error: AppError | null;
}

export function ErrorDialog({ open, setOpen, error }: ErrorDialogProps) {
  const t = useTranslations("ErrorDialog");
  const tc = useTranslations("Common");
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const hasDetails = error.code || error.details || error.hint;
  const extra = renderErrorDetails(error, t);

  const handleCopy = () => {
    const lines = [
      `Message: ${error.originalMessage}`,
      error.code && `Code:   ${error.code}`,
      error.details && `Details: ${error.details}`,
      error.hint && `Hint:    ${error.hint}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const footer = (
    <div className="flex w-full flex-col gap-2 md:flex-row-reverse">
      <DialogClose asChild>
        <Button type="button" className="w-full md:flex-1">
          {tc("close")}
        </Button>
      </DialogClose>
      <Button
        type="button"
        variant="outline"
        className="w-full md:flex-1"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <CheckIcon className="h-4 w-4" />
            {t("copied")}
          </>
        ) : (
          <>
            <CopyIcon className="h-4 w-4" />
            {t("copyError")}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      title={error.title ?? t("title")}
      className="md:min-w-lg"
      footer={footer}
    >
      <div className="scrollbar-thumb-rounded scrollbar-thin flex flex-col gap-3 overflow-y-auto px-4 scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80">
        <p className="text-sm">{error.message}</p>

        {extra}

        {hasDetails && (
          <Collapsible className="rounded-md border">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="group w-full justify-between px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                {t("technicalDetails")}
                <ChevronDownIcon className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-2 border-t px-3 py-3">
              <Row label={t("message")} value={error.originalMessage} />
              {error.code && <Row label={t("code")} value={error.code} />}
              {error.details && <Row label={t("details")} value={error.details} />}
              {error.hint && <Row label={t("hint")} value={error.hint} />}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </BaseDialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="font-mono text-xs break-all text-foreground">
        {value}
      </span>
    </div>
  );
}

type Translator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

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

export function renderErrorDetails(error: AppError, t: Translator): ReactNode {
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
    <div className="flex flex-col gap-1.5 text-sm">
      <p className="text-xs font-medium text-muted-foreground">
        {t("referencedByExisting")}
      </p>
      <ul className="flex flex-col gap-1">
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
        {moreCount > 0 && (
          <li className="text-muted-foreground">{t("andMore", { count: moreCount })}</li>
        )}
      </ul>
    </div>
  );
});
