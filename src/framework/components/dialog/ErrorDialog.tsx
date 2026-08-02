"use client";

import { Button } from "@/framework/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/framework/components/ui/collapsible";
import { DialogClose } from "@/framework/components/ui/dialog";
import type { AppError } from "@/framework/types/global/AppError";
import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import { ReactNode, useState, type Dispatch, type SetStateAction } from "react";
import { BaseDialog } from "./BaseDialog";

interface ErrorDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  error: AppError | null;
}

export function ErrorDialog({ open, setOpen, error }: ErrorDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const hasDetails = error.code || error.details || error.hint;
  const extra = renderErrorExtra(error);

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
          Close
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
            Copied
          </>
        ) : (
          <>
            <CopyIcon className="h-4 w-4" />
            Copy error
          </>
        )}
      </Button>
    </div>
  );

  return (
    <BaseDialog
      open={open}
      setOpen={setOpen}
      title="Error"
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
                Technical details
                <ChevronDownIcon className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="flex flex-col gap-2 border-t px-3 py-3">
              <Row label="Message" value={error.originalMessage} />
              {error.code && <Row label="Code" value={error.code} />}
              {error.details && <Row label="Details" value={error.details} />}
              {error.hint && <Row label="Hint" value={error.hint} />}
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

type ErrorExtraRenderer = (meta: Record<string, unknown>) => ReactNode;

const registry = new Map<string, ErrorExtraRenderer>();

export function registerErrorExtra(type: string, renderer: ErrorExtraRenderer) {
  registry.set(type, renderer);
}

export function renderErrorExtra(error: AppError): ReactNode {
  if (!error.meta?.type) return null;
  const renderer = registry.get(error.meta.type);
  return renderer ? renderer(error.meta) : null;
}
