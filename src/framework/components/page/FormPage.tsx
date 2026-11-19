"use client";

import type { TableAction } from "@/framework/components/toolbar/Toolbar";
import { TOOLBAR_BUTTON, Toolbar } from "@/framework/components/toolbar/Toolbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import { Loader2Icon, RotateCcwIcon, SaveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { createContext, use, useEffect, useRef } from "react";
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
  /** Action forms that can be opened for the current record (detail pages). */
  actionForms?: FormPageActionForm[];
  onOpenActionForm?: (key: string) => void;
}

export interface FormPageActionForm {
  key: string;
  label: ReactNode;
}

const FormPageContext = createContext<FormPageState | null>(null);

/** Like `useFormPageContext`, but returns `null` outside a `<FormPage>`. */
export function useOptionalFormPage() {
  return use(FormPageContext);
}

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
  /** Action forms available for this record; lets form buttons open them. */
  actionForms?: FormPageActionForm[];
  onOpenActionForm?: (key: string) => void;
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
  actionForms,
  onOpenActionForm,
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
        actionForms,
        onOpenActionForm,
      }}
    >
      <div
        className={cn(
          // The space under the CMS navbar (52px on phones, 48px from sm).
          "scrollbar-thumb-rounded scrollbar-thin flex h-[calc(100dvh-52px)] flex-col gap-4 overflow-y-auto px-4 scrollbar-thumb-primary scrollbar-track-muted/80 sm:h-[calc(100dvh-48px)]",
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
  /** Render the toolbar without its own bar, for a title bar that already
   *  is one (the split-view detail panel). When true, pass the returned
   *  element as RecordFormShell's `toolbar` prop rather than rendering it
   *  as a sibling — it needs to live inside the title bar's own sticky
   *  container (see FormHeader/FormHeaderCollapsible) so the two never need
   *  to coordinate sticky offsets. */
  inline?: boolean;
}

/**
 * A record's toolbar, in the page under the navbar: Back | Save (also
 * Ctrl/⌘+S), Reload, Add, Delete, Actions ▾, ⋯ | ● Unsaved changes.
 */
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
  const t = useTranslations("Toolbar");
  const canSave = !!form && !form.readOnly && form.canSave && form.isDirty && !form.isSaving;

  // Ctrl/⌘+S saves (and never opens the browser's "Save page" dialog here).
  const saveRef = useRef<() => void>(() => {});
  saveRef.current = () => {
    if (canSave) form.onSave();
  };
  useEffect(() => {
    if (!form || form.readOnly) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [form?.readOnly, !!form]);

  if (!form) return null;
  const toolbar = (
    <Toolbar
      slotId={inline ? false : undefined}
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
      trailing={
        form.isDirty && !form.readOnly ? (
          <span role="status" className="flex items-center gap-1.5 text-sm text-warning">
            <span aria-hidden className="size-2 rounded-full bg-warning" />
            {t("unsaved")}
          </span>
        ) : undefined
      }
    >
      {!form.readOnly && (
        <Button
          type="button"
          size="sm"
          className={TOOLBAR_BUTTON}
          aria-keyshortcuts="Control+S Meta+S"
          title={`${t("save")} (Ctrl+S)`}
          disabled={!canSave}
          onClick={form.onSave}
        >
          {form.isSaving ? <Loader2Icon className="animate-spin" aria-hidden /> : <SaveIcon aria-hidden />}
          {t("save")}
        </Button>
      )}

      {!form.readOnly && form.onReset && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={t("reload")}
          title={t("reload")}
          className={TOOLBAR_BUTTON}
          disabled={form.isRefreshing || (!form.alwaysAllowReset && !form.isDirty)}
          onClick={() => form.guard(form.onReset!)}
        >
          {form.isRefetching ? <Loader2Icon className="animate-spin" aria-hidden /> : <RotateCcwIcon aria-hidden />}
          <span className="hidden sm:inline">{t("reload")}</span>
        </Button>
      )}
    </Toolbar>
  );

  return toolbar;
};

FormPage.Collapsible = function FormPageCollapsible(
  props: FormHeaderCollapsibleProps,
) {
  return <FormHeaderCollapsible {...props} />;
};

FormPage.Title = function FormPageTitle(props: FormHeaderProps) {
  return <FormHeader {...props} />;
};
