"use client";

import { ErrorDialog } from "@/framework/components/dialog/ErrorDialog";
import { FormDialog } from "@/framework/components/dialog/FormDialog";
import { RecordFormShell } from "@/framework/components/screen/components/RecordFormShell";
import {
  RecordScreen,
  RegistryCapture,
} from "@/framework/components/screen/components/RecordScreen";
import { RecordTabs } from "@/framework/components/screen/components/RecordTabs";
import { useRecordSave } from "@/framework/components/screen/hooks/useRecordSave";
import { useNavigatorStore } from "@/framework/components/screen/stores/useNavigatorStore";
import { useEffect } from "react";
import type { FieldValues } from "react-hook-form";
import type { ResourceComponentsConfig } from "../../types/resource-components-types";
import type { ResourceId } from "../../types/resource-hook-types";
import type { ResourceHooks } from "../hooks/create-resource-hooks";
import { getItemId } from "../resource-id";
import { resolvePermission } from "@/framework/lib/resolvePermissions";
import { usePermissions } from "@/framework/authorization/usePermissions";

export function createDetailDialog<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  hooks: ResourceHooks<TItem, TFormValues, TId>,
  config: ResourceComponentsConfig<TItem, TFormValues>,
) {
  const Form = config.Form;
  if (!Form)
    throw new Error(`No Form component provided for ${hooks.labels.singular}`);

  const { idField, labels, tabs, relations } = hooks;

  return function DetailDialog({
    item,
    open,
    setOpen,
  }: {
    item: TItem;
    open: boolean;
    setOpen: (o: boolean) => void;
  }) {
    usePermissions();

    const canUpdate = resolvePermission(config.permissions?.update);

    const { updateAsync, isUpdating, error, clearError, resetMutation } =
      hooks.useMutations();

    const itemId = getItemId<TId>(item as Record<string, unknown>, idField);

    useEffect(() => {
      resetMutation();
    }, [itemId, open]);

    const { form, isDirty, handleSubmit, confirmSaved } =
      hooks.useDetailForm(item);
    const { formOpen, setFormOpen, activeTab, setActiveTab, hasTabs } =
      hooks.useDetailTabs();

    const formId = `${labels.singular}-${itemId}`;
    const formKey = `${itemId}-${JSON.stringify(item)}`;

    const { registryRef, hasFileChanges, onSave, onReset } =
      useRecordSave<TFormValues>({
        formId,
        itemId,
        handleSubmit,
        updateAsync,
        confirmSaved,
        label: labels.singular,
        onComplete: () => setOpen(false),
      });

    const clearNavigator = useNavigatorStore((s) => s.clear);

    return (
      <>
        <RecordScreen form={form} formId={formId}>
          <RegistryCapture registryRef={registryRef} />
          <FormDialog
            open={open}
            setOpen={setOpen}
            title={labels.singular}
            itemId={itemId}
            popOutPath={hooks.routes.detail(itemId.toString())}
            className={config.dialog?.className}
            isDirty={isDirty || hasFileChanges}
            isSaving={isUpdating}
            canSave={canUpdate}
            readOnly={!canUpdate}
            onSave={onSave}
            onClose={() => onReset()}
            onPopOut={() => clearNavigator(config.overviewKey)}
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
              hasTabs={hasTabs}
              title={labels.singular}
              isOpen={formOpen}
              setOpen={setFormOpen}
              titleClassName="dark:bg-card"
              collapsibleClassName="px-4"
              collapsibleTriggerClassName="dark:bg-card"
              plainWrapperClassName="px-4"
              formRowLeft={config.detailSlots?.left?.(item)}
              formRowRight={config.detailSlots?.right?.(item)}
              beforeForm={config.detailSlots?.beforeForm?.(item)}
              afterForm={config.detailSlots?.afterForm?.(item)}
              afterTabs={config.detailSlots?.afterTabs?.(item)}
              form={
                <Form
                  key={formKey}
                  item={item}
                  layout="grid"
                  readOnly={!canUpdate}
                />
              }
              tabs={
                <RecordTabs
                  contentClassName="px-4"
                  tabs={tabs}
                  relations={relations}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  item={item}
                  idField={idField}
                  Form={Form}
                  formOpen={formOpen}
                  readOnly={!canUpdate}
                />
              }
            />
          </FormDialog>
        </RecordScreen>
        <ErrorDialog
          open={!!error}
          setOpen={(o) => {
            if (!o) clearError();
          }}
          error={error}
        />
      </>
    );
  };
}
