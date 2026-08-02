"use client";

import { Button } from "@/framework/components/ui/button";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BaseDialog } from "./BaseDialog";
import { usePendingChanges } from "@/framework/hooks/usePendingChanges";
import { stashNavigationState } from "@/framework/lib/navigationHandoff";

interface FormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: ReactNode;
  itemId: number | string;
  popOutPath?: string;
  children: ReactNode;
  isDirty: boolean;
  isSaving: boolean;
  canSave?: boolean;
  readOnly?: boolean;
  onSave: () => void;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  onClose?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onPopOut?: () => void;
  popOutState?: Record<string, unknown>;
}

export function FormDialog({
  open,
  setOpen,
  title,
  itemId,
  popOutPath,
  children,
  isDirty,
  isSaving,
  canSave = true,
  readOnly = false,
  onSave,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  onClose,
  onKeyDown,
  onPopOut,
  popOutState,
}: FormDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { guard, pendingChangesDialog } = usePendingChanges(isDirty);

  const close = () =>
    guard(() => {
      onClose?.();
      setOpen(false);
    });

  const popOut = () => {
    onPopOut?.();
    setOpen(false);
    const destination = popOutPath ?? `${pathname}/${itemId}`;
    if (popOutState) stashNavigationState(destination, popOutState);
    router.push(destination);
  };

  return (
    <>
      <BaseDialog
        headerClassName={headerClassName}
        contentClassName={contentClassName}
        footerClassName={footerClassName}
        className={className}
        open={open}
        setOpen={setOpen}
        title={title}
        onClose={close}
        headerAction={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={popOut}
            title="Open in full screen"
          >
            <ExternalLinkIcon className="h-4 w-4" />
          </Button>
        }
        footer={
          readOnly ? (
            <div className="flex w-full">
              <Button className="w-full" onClick={close} type="button">
                Ok
              </Button>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2 md:flex-row-reverse">
              <Button
                className="w-full md:flex-1"
                disabled={isSaving || !isDirty || !canSave}
                onClick={onSave}
              >
                {isSaving ? (
                  <>
                    <Loader2Icon className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                className="w-full md:flex-1"
                onClick={close}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          )
        }
      >
        <div
          onKeyDown={onKeyDown}
          className="scrollbar-thumb-rounded scrollbar-thin overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80"
        >
          {children}
        </div>
      </BaseDialog>
      {pendingChangesDialog}
    </>
  );
}
