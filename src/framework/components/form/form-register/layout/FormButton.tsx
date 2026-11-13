"use client";

import { useState, type ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import { ConfirmDialog } from "@/framework/components/dialog/ConfirmDialog";
import { useOptionalFormPage } from "@/framework/components/page/FormPage";
import type { ButtonContext, ButtonNode } from "../../types/layout-types";
import { BUTTON_ICONS } from "./buttonIcons";
import { useLayoutRenderContext } from "./LayoutContext";

const BUILTIN_DEFAULTS = {
  save: { icon: "save", variant: "default", labelKey: "save" },
  reset: { icon: "reset", variant: "outline", labelKey: "reset" },
  back: { icon: "back", variant: "outline", labelKey: "goBack" },
} as const;

export function FormButton({ node }: { node: ButtonNode }) {
  const locale = useLocale();
  const t = useTranslations("Common");
  const router = useTransitionRouter();
  const formPage = useOptionalFormPage();
  const methods = useFormContext();
  const values = useWatch({ control: methods.control });
  const { item } = useLayoutRenderContext();

  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const builtin = typeof node.action === "string" ? node.action : undefined;
  const defaults = builtin ? BUILTIN_DEFAULTS[builtin] : undefined;

  const isDirty = formPage?.isDirty ?? methods.formState.isDirty;
  const isSaving = formPage?.isSaving ?? false;
  const guard = formPage?.guard ?? ((fn: () => void) => fn());

  const ctx: ButtonContext = {
    values: values as Record<string, unknown>,
    item,
    isDirty,
    isSaving,
    hasFormPage: !!formPage,
    setValue: (name, value, options) =>
      methods.setValue(name, value as never, options),
    getValues: () => methods.getValues() as Record<string, unknown>,
    save: () => formPage?.onSave(),
    reset: () => {
      if (formPage?.onReset) guard(formPage.onReset);
    },
    navigate: (path) => guard(() => router.push(path)),
    back: () => guard(() => router.back()),
    openActionForm: (key) => {
      if (formPage?.actionForms?.some((a) => a.key === key))
        formPage.onOpenActionForm?.(key);
    },
  };

  // `{ actionForm: key }` buttons only exist where that action form can be
  // opened: a detail page, for a record the form is eligible for.
  const actionFormKey =
    typeof node.action === "object" && "actionForm" in node.action
      ? node.action.actionForm
      : undefined;
  const actionForm = actionFormKey
    ? formPage?.actionForms?.find((a) => a.key === actionFormKey)
    : undefined;
  if (actionFormKey && (!actionForm || !formPage?.onOpenActionForm)) return null;

  // save/reset only make sense inside a <FormPage>, and never on read-only forms.
  if ((builtin === "save" || builtin === "reset") && (!formPage || formPage.readOnly))
    return null;
  if (builtin === "reset" && !formPage?.onReset) return null;

  const evalFlag = (
    flag: boolean | ((c: ButtonContext) => boolean) | undefined,
  ) => (typeof flag === "function" ? flag(ctx) : !!flag);

  let builtinDisabled = false;
  if (builtin === "save")
    builtinDisabled = isSaving || !isDirty || !formPage!.canSave;
  if (builtin === "reset")
    builtinDisabled =
      !!formPage!.isRefreshing || (!formPage!.alwaysAllowReset && !isDirty);

  const loading =
    busy ||
    evalFlag(node.loading) ||
    (builtin === "save" && isSaving) ||
    (builtin === "reset" && !!formPage?.isRefetching);
  const disabled = evalFlag(node.disabled) || builtinDisabled || loading;

  const execute = async () => {
    const action = node.action;
    if (action === "save") return ctx.save();
    if (action === "reset") return ctx.reset();
    if (action === "back") return ctx.back();
    if ("actionForm" in action) return ctx.openActionForm(action.actionForm);
    if ("navigate" in action) {
      const path =
        typeof action.navigate === "function"
          ? action.navigate(ctx)
          : action.navigate;
      return ctx.navigate(path);
    }
    setBusy(true);
    try {
      await action.run(ctx);
    } finally {
      setBusy(false);
    }
  };

  const onClick = () => (node.confirm ? setConfirmOpen(true) : void execute());

  const iconSource = node.icon ?? defaults?.icon;
  const iconEl = loading ? (
    <Loader2Icon className="animate-spin" />
  ) : typeof iconSource === "string" ? (
    (() => {
      const Icon = BUTTON_ICONS[iconSource as keyof typeof BUTTON_ICONS];
      return Icon ? <Icon /> : null;
    })()
  ) : (
    (iconSource ?? null)
  );

  // Action-form buttons fall back to the action form's own label (a ReactNode).
  const label: ReactNode = node.label
    ? resolveLabel(node.label, locale)
    : defaults
      ? t(defaults.labelKey)
      : actionForm?.label;

  const size = node.size ?? (label ? "default" : "icon");
  const variant = node.variant ?? defaults?.variant ?? "default";

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        title={node.tooltip ? resolveLabel(node.tooltip, locale) : undefined}
        aria-busy={loading || undefined}
        className={cn(node.fullWidth && "w-full")}
        onClick={onClick}
      >
        {node.iconPosition !== "end" && iconEl}
        {label}
        {node.iconPosition === "end" && iconEl}
      </Button>

      {node.confirm && (
        <ConfirmDialog
          open={confirmOpen}
          setOpen={setConfirmOpen}
          title={resolveLabel(node.confirm.title, locale)}
          description={
            node.confirm.message
              ? resolveLabel(node.confirm.message, locale)
              : null
          }
          confirmLabel={
            node.confirm.confirmLabel
              ? resolveLabel(node.confirm.confirmLabel, locale)
              : typeof label === "string"
                ? label
                : t("ok")
          }
          variant={node.variant === "destructive" ? "destructive" : "default"}
          onConfirm={() => void execute()}
        />
      )}
    </>
  );
}
