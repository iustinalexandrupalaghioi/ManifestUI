"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/framework/lib/utils";
import { XIcon } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export interface BaseDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>> | ((open: boolean) => void);
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  trigger?: ReactNode;
  headerAction?: ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export function BaseDialog({
  open,
  setOpen,
  title,
  description,
  children,
  footer,
  trigger,
  headerAction,
  onClose,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
}: BaseDialogProps) {
  const t = useTranslations("Common");
  const handleClose = onClose ?? (() => setOpen(false));

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0 });

  useEffect(() => {
    if (!open) setOffset({ x: 0, y: 0 });
  }, [open]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;

    dragRef.current = {
      dragging: true,
      startX: e.clientX - offset.x,
      startY: e.clientY - offset.y,
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      setOffset({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY,
      });
    };

    const onMouseUp = () => {
      dragRef.current.dragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => (!o ? handleClose() : setOpen(true))}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-slot="dialog-content"], [role="dialog"]')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-slot="dialog-content"], [role="dialog"]')) {
            e.preventDefault();
          }
        }}
        style={{
          top: `1rem`,
          left: `50%`,
          translate: `calc(-50% + ${offset.x}px) ${offset.y}px`,
        }}
        className={cn(
          "flex max-h-[80vh] max-w-full flex-col gap-2 overflow-hidden px-0 md:max-h-[90vh] md:min-w-xl",
          className,
        )}
      >
        <DialogHeader
          onMouseDown={handleHeaderMouseDown}
          className={cn(
            "shrink-0 cursor-move px-4 text-start select-none",
            children && "border-b pb-3",
            headerClassName,
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-primary">{title}</DialogTitle>
            <DialogDescription className="hidden">{title}</DialogDescription>
            <div className="flex shrink-0 items-center gap-1">
              {headerAction}
              <Button
                title={t("close")}
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleClose}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {children && (
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden",
              contentClassName,
            )}
          >
            {children}
          </div>
        )}

        {footer && (
          <div
            data-slot="dialog-footer"
            className={cn(
              "flex shrink-0 flex-col-reverse gap-2 px-4 sm:flex-row sm:justify-end",
              children && "border-t pt-3",
              footerClassName,
            )}
          >
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
