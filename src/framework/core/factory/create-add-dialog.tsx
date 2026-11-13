"use client";

import { ResultDialog } from "@/framework/components/dialog/ResultDialog";
import { FormDialog } from "@/framework/components/dialog/FormDialog";
import { AddTabs } from "@/framework/components/screen/components/AddTabs";
import { RecordFormShell } from "@/framework/components/screen/components/RecordFormShell";
import {
  RecordScreen,
  RegistryCapture,
} from "@/framework/components/screen/components/RecordScreen";
import { useAddSave } from "@/framework/components/screen/hooks/useAddSave";
import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { ResourceComponentsConfig } from "../../types/resource-components-types";
import type { ResourceId } from "../../types/resource-hook-types";
import type { FieldTabConfig } from "../../types/tab-config-type";
import type { ResourceHooks } from "../hooks/create-resource-hooks";
import { resolvePermission } from "@/framework/lib/resolvePermissions";
import { usePermissions } from "@/framework/authorization/hooks/usePermissions";

export function createAddDialog<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  hooks: ResourceHooks<TItem, TFormValues, TId>,
  config: ResourceComponentsConfig<TItem, TFormValues>,
  addTabs: FieldTabConfig<TFormValues>[] = [],
) {
  const Form = config.AddForm ?? config.Form;
  if (!Form) throw new Error(`No Form component provided for ${hooks.noun}`);

  const { noun, labels } = hooks;
  const hasAddTabs = addTabs.length > 0;

  return function AddDialog({
    open,
    setOpen,
    initial,
  }: {
    open: boolean;
    setOpen: (o: boolean) => void;
    initial?: Partial<TFormValues>;
  }) {
    usePermissions();

    const locale = useLocale();
    const tr = useTranslations("Resource");
    const resolvedLabels = {
      singular: resolveLabel(labels.singular, locale),
      plural: resolveLabel(labels.plural, locale),
      new: resolveLabel(labels.new, locale),
      gender: labels.gender,
    };

    const canAdd = resolvePermission(config.permissions?.add);
    const hasInitial = initial && Object.keys(initial).length > 0;

    const { addAsync, updateAsync, isAdding, error, clearError } =
      hooks.useMutations();
    const { form, isDirty, canSave, handleSubmit, reset } =
      hooks.useAddForm(initial);

    const formId = `${noun}-add`;
    const [formOpen, setFormOpen] = useState(true);
    const [activeAddTab, setActiveAddTab] = useState(addTabs[0]?.value ?? "");

    const { registryRef, hasFileChanges, onSave, onReset } =
      useAddSave<TFormValues>({
        formId,
        handleSubmit,
        addAsync,
        updateAsync,
        reset,
        label: resolvedLabels.singular,
        gender: labels.gender,
        onComplete: () => setOpen(false),
      });

    return (
      <>
        <RecordScreen form={form} formId={formId}>
          <RegistryCapture registryRef={registryRef} />
          <FormDialog
            open={open}
            setOpen={setOpen}
            title={resolvedLabels.new}
            itemId="new"
            popOutPath={hooks.routes.add}
            popOutState={
              hasInitial ? (initial as Record<string, unknown>) : undefined
            }
            className={config.dialog?.className}
            contentClassName={hasAddTabs ? undefined : "px-4"}
            isDirty={isDirty || hasFileChanges}
            isSaving={isAdding}
            canSave={canAdd && canSave}
            readOnly={!canAdd}
            onSave={onSave}
            onClose={() => onReset()}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                (e.target as HTMLElement).tagName !== "TEXTAREA"
              ) {
                e.preventDefault();
                onSave();
              }
            }}
          >
            <RecordFormShell
              hasTabs={hasAddTabs}
              isAddScreen
              title={resolvedLabels.new}
              titleBadge={<span className="text-muted"> {tr("newItemBadge")}</span>}
              titleClassName="dark:bg-card"
              collapsibleClassName="px-4"
              collapsibleTriggerClassName="dark:bg-card"
              isOpen={formOpen}
              setOpen={setFormOpen}
              form={<Form layout="grid" readOnly={!canAdd} />}
              tabs={
                <div className="px-4">
                  <AddTabs
                    addTabs={addTabs}
                    allTabs={hooks.tabs}
                    activeTab={activeAddTab}
                    setActiveTab={setActiveAddTab}
                    Form={Form}
                    readOnly={!canAdd}
                  />
                </div>
              }
            />
          </FormDialog>
        </RecordScreen>
        <ResultDialog
          open={!!error}
          setOpen={(o) => {
            if (!o) clearError();
          }}
          result={error}
          itemLabel={resolvedLabels.singular}
        />
      </>
    );
  };
}
