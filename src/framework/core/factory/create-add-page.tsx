"use client";

import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import { popNavigationState } from "@/framework/lib/navigationHandoff";
import type { ResourceHooks } from "../hooks/create-resource-hooks";
import type { ResourceComponentsConfig } from "../../types/resource-components-types";
import type { ResourceId } from "../../types/resource-hook-types";
import type { FieldTabConfig } from "../../types/tab-config-type";
import { FormPage } from "@/framework/components/page/FormPage";
import { AddTabs } from "@/framework/components/screen/components/AddTabs";
import { RecordFormShell } from "@/framework/components/screen/components/RecordFormShell";
import {
  RecordScreen,
  RegistryCapture,
} from "@/framework/components/screen/components/RecordScreen";
import { useAddSave } from "@/framework/components/screen/hooks/useAddSave";
import { ErrorDialog } from "@/framework/components/dialog/ErrorDialog";
import { resolvePermission } from "@/framework/lib/resolvePermissions";
import { usePermissions } from "@/framework/authorization/usePermissions";

export function createAddPage<
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

  return function AddPage() {
    const pathname = usePathname();
    const router = useTransitionRouter();

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

    const { addAsync, updateAsync, isAdding, error, clearError } =
      hooks.useMutations();

    const [initialState] = useState(() =>
      popNavigationState<Partial<TFormValues>>(pathname),
    );
    const { form, isDirty, canSave, handleSubmit, reset } =
      hooks.useAddForm(initialState);

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
        onComplete: () => router.back(),
      });

    return (
      <RecordScreen form={form} formId={formId} onSubmit={onSave}>
        <RegistryCapture registryRef={registryRef} />
        <FormPage
          isDirty={isDirty || hasFileChanges}
          isSaving={isAdding}
          canSave={canAdd && canSave}
          readOnly={!canAdd}
          onSave={onSave}
          onReset={() => onReset(reset)}
        >
          <FormPage.Toolbar />

          <RecordFormShell
            hasTabs={hasAddTabs}
            isAddScreen
            title={resolvedLabels.new}
            titleBadge={<span className="text-accent"> {tr("newItemBadge")}</span>}
            isOpen={formOpen}
            setOpen={setFormOpen}
            form={<Form layout="grid" readOnly={!canAdd} />}
            tabs={
              <AddTabs
                addTabs={addTabs}
                allTabs={hooks.tabs}
                activeTab={activeAddTab}
                setActiveTab={setActiveAddTab}
                Form={Form}
                readOnly={!canAdd}
              />
            }
          />
        </FormPage>
        <ErrorDialog
          open={!!error}
          setOpen={(o) => {
            if (!o) clearError();
          }}
          error={error}
        />
      </RecordScreen>
    );
  };
}
