"use client";

import type { TableAction } from "@/framework/components/toolbar/Toolbar";
import { Toolbar } from "@/framework/components/toolbar/Toolbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import { Loader2Icon, RotateCcwIcon, SaveIcon } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, use } from "react";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";

import { usePendingChanges } from "../../hooks/usePendingChanges";
import {
  FormHeaderCollapsible,
  type FormHeaderCollapsibleProps,
} from "../form/partials/FormHeaderCollapsible";
import { FormHeader, type FormHeaderProps } from "../form/partials/FormHeader";

interface FormPageState {
  isDirty: boolean;
  isSaving: boolean;
  isRefreshing?: boolean;
  isRefetching?: boolean;
  alwaysAllowReset?: boolean;
  canSave: boolean;
  readOnly: boolean;
  onSave: () => void;
  onReset?: () => void;
  guard: (fn: () => void) => void;
}

const FormPageContext = createContext<FormPageState | null>(null);

export function useFormPageContext() {
  const ctx = use(FormPageContext);
  if (!ctx)
    throw new Error("FormPage sub-components must be used inside <FormPage>");
  return ctx;
}

interface FormPageProps {
  isDirty: boolean;
  isSaving: boolean;
  isRefreshing?: boolean;
  isRefetching?: boolean;
  alwaysAllowReset?: boolean;
  canSave?: boolean;
  readOnly?: boolean;
  onSave: () => void;
  onReset?: () => void;
  children: ReactNode;
  className?: string;
}

export function FormPage({
  isDirty,
  isSaving,
  isRefreshing,
  isRefetching,
  alwaysAllowReset,
  canSave = true,
  readOnly = false,
  onSave,
  onReset,
  children,
  className,
}: FormPageProps) {
  const { guard, pendingChangesDialog } = usePendingChanges(isDirty);

  return (
    <FormPageContext
      value={{
        isDirty,
        isSaving,
        isRefreshing,
        isRefetching,
        alwaysAllowReset,
        canSave,
        readOnly,
        onSave,
        onReset,
        guard,
      }}
    >
      <div
        className={cn(
          "scrollbar-thumb-rounded scrollbar-thin flex h-[calc(100vh-5rem)] flex-col gap-4 overflow-y-auto px-4 scrollbar-thumb-primary scrollbar-track-muted/80",
          className,
        )}
      >
        {children}
        {pendingChangesDialog}
      </div>
    </FormPageContext>
  );
}

interface FormPageToolbarProps<T> {
  selectedRows?: T[];
  mutations?: TableAction<T>[];
  onDelete?: () => void;
  isDeleteEligible?: (row: T) => boolean;
  onAdd?: () => void;
  onBack?: () => void;
  popOutUrl?: string;
  /** Render the toolbar inline (e.g. inside a split-view detail panel)
   *  instead of portaling to the navbar's #toolbar-slot. When true, pass
   *  the returned element as RecordFormShell's `toolbar` prop rather than
   *  rendering it as a sibling — it needs to live inside the title bar's
   *  own sticky container (see FormHeader/FormHeaderCollapsible) so the
   *  two never need to coordinate sticky offsets. */
  inline?: boolean;
}

FormPage.Toolbar = function FormPageToolbar<T>({
  selectedRows = [],
  mutations = [],
  onDelete,
  isDeleteEligible,
  onAdd,
  onBack,
  popOutUrl,
  inline,
}: FormPageToolbarProps<T>) {
  const form = useFormPageContext();
  const router = useTransitionRouter();
  if (!form) return null;
  const toolbar = (
    <Toolbar
      slotId={inline ? false : "toolbar-slot"}
      variant="detail"
      onBack={() => form.guard(() => (onBack ? onBack() : router.back()))}
      selectedRows={selectedRows}
      selectedCount={selectedRows.length}
      actions={mutations}
      onDelete={onDelete}
      isDeleteEligible={isDeleteEligible}
      onAdd={onAdd}
      popOutUrl={popOutUrl}
      setRowSelection={() => {}}
    >
      {!form.readOnly && (
        <Button
          variant="outline"
          size="icon"
          title="Save"
          disabled={form.isSaving || !form.isDirty || !form.canSave}
          onClick={form.onSave}
        >
          {form.isSaving ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
        </Button>
      )}

      {!form.readOnly && form.onReset && (
        <Button
          size="icon"
          type="button"
          variant="outline"
          disabled={
            form.isRefreshing || (!form.alwaysAllowReset && !form.isDirty)
          }
          onClick={() => form.guard(form.onReset!)}
        >
          {form.isRefetching ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <RotateCcwIcon className="size-4" />
          )}
        </Button>
      )}
    </Toolbar>
  );

  return inline ? <div className="h-10 shrink-0">{toolbar}</div> : toolbar;
};

FormPage.Collapsible = function FormPageCollapsible(
  props: FormHeaderCollapsibleProps,
) {
  return <FormHeaderCollapsible {...props} />;
};

FormPage.Title = function FormPageTitle(props: FormHeaderProps) {
  return <FormHeader {...props} />;
};
