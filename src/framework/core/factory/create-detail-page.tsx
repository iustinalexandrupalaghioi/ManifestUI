"use client";

import { ActionFormDialog } from "@/framework/components/dialog/ActionFormDialog";
import { DeleteDialog } from "@/framework/components/dialog/DeleteDialog";
import { ResultDialog } from "@/framework/components/dialog/ResultDialog";
import { FormPage } from "@/framework/components/page/FormPage";
import Loader from "@/framework/components/partials/Loader";
import {
  RecordScreen,
  RegistryCapture,
} from "@/framework/components/screen/components/RecordScreen";
import { RecordTabs } from "@/framework/components/screen/components/RecordTabs";
import { RecordFormShell } from "@/framework/components/screen/components/RecordFormShell";
import { useRecordSave } from "@/framework/components/screen/hooks/useRecordSave";
import {
  EMPTY_NAVIGATOR_IDS,
  useNavigatorStore,
} from "@/framework/components/screen/stores/useNavigatorStore";
import type { ActionFormConfig } from "@/framework/types/resource-hook-types";
import { useEffect, useState } from "react";
import type { FieldValues } from "react-hook-form";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { ResourceComponentsConfig } from "../../types/resource-components-types";
import type { ResourceId } from "../../types/resource-hook-types";
import type { ResourceHooks } from "../hooks/create-resource-hooks";
import { getItemId } from "../resource-id";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import { resolvePermission } from "@/framework/lib/resolvePermissions";
import { hasPermission } from "@/framework/authorization/cache/permissions";
import { usePermissions } from "@/framework/authorization/hooks/usePermissions";
import { BulkActionResult } from "@/framework/lib/actionResult";

export function createDetailPage<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  hooks: ResourceHooks<TItem, TFormValues, TId>,
  config: ResourceComponentsConfig<TItem, TFormValues>,
) {
  const Form = config.Form;
  if (!Form) throw new Error(`No Form component provided for ${hooks.noun}`);

  const {
    idField,
    keys,
    noun,
    routes,
    labels,
    tabs,
    relations,
    isDeleteEligible,
    actionForms,
  } = hooks;

  return function DetailPage({
    id: idProp,
    onClose,
  }: { id?: string; onClose?: () => void } = {}) {
    const params = useParams();
    const id = idProp ?? (params.id as string);

    const isEmbedded = !!onClose;
    const overviewKey = config.overviewKey;

    usePermissions();

    const canUpdate = resolvePermission(config.permissions?.update);
    const canDelete = resolvePermission(config.permissions?.delete);
    const canAdd = resolvePermission(config.permissions?.add);

    const ids = useNavigatorStore(
      (s) => s.byKey[overviewKey] ?? EMPTY_NAVIGATOR_IDS,
    );

    const currentIndex = ids.indexOf(id!);
    const prevId = currentIndex > 0 ? ids[currentIndex - 1] : undefined;
    const nextId =
      currentIndex !== -1 && currentIndex < ids.length - 1
        ? ids[currentIndex + 1]
        : undefined;
    const positionLabel =
      currentIndex !== -1 && ids.length > 0
        ? `${currentIndex + 1} / ${ids.length}`
        : undefined;

    const router = useTransitionRouter();
    const locale = useLocale();
    const tr = useTranslations("Resource");
    const resolvedLabels = {
      singular: resolveLabel(labels.singular, locale),
      plural: resolveLabel(labels.plural, locale),
      new: resolveLabel(labels.new, locale),
      gender: labels.gender,
    };
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
    const [actionFormError, setActionFormError] =
      useState<BulkActionResult | null>(null);
    const {
      updateAsync,
      isUpdating,
      removeAsync,
      error,
      clearError,
      resetMutation,
    } = hooks.useMutations();

    const {
      actions: bulkActions,
      bulkResult,
      clearBulkResult,
      confirmDialog,
    } = hooks.useActions({
      setRowSelection: () => {},
      onOpen: () => {},
      extraActions: [],
    });

    // Only one result dialog is shown at a time — whichever fired last.
    const activeResult = actionFormError ?? bulkResult ?? error;
    const clearActiveResult = () => {
      setActionFormError(null);
      clearBulkResult();
      clearError();
    };

    useEffect(() => {
      resetMutation();
    }, [id]);

    const {
      form,
      item,
      isError,
      isDirty,
      handleSubmit,
      confirmSaved,
      dataUpdatedAt,
      refetch,
      isFetching: isRefreshing,
      isRefetching,
    } = hooks.useDetailPageForm(id!);

    const { formOpen, setFormOpen, activeTab, setActiveTab, hasTabs } =
      hooks.useDetailTabs();

    const itemId = item
      ? getItemId<TId>(item as Record<string, unknown>, idField)
      : undefined;
    const formId = item ? `${noun}-${itemId}` : "";

    const { registryRef, hasFileChanges, onSave, onReset } =
      useRecordSave<TFormValues>({
        formId,
        itemId: itemId ?? 0,
        handleSubmit,
        updateAsync,
        confirmSaved,
        label: resolvedLabels.singular,
        gender: labels.gender,
        onComplete: () => {
          if (nextId) router.replace(routes.detail(nextId));
        },
      });

    const navProps = {
      prevPath: prevId ? routes.detail(prevId) : undefined,
      nextPath: nextId ? routes.detail(nextId) : undefined,
      firstPath:
        ids.length > 0 && currentIndex > 0 ? routes.detail(ids[0]) : undefined,
      lastPath:
        ids.length > 0 && currentIndex < ids.length - 1
          ? routes.detail(ids[ids.length - 1])
          : undefined,
      positionLabel,
    };

    const detailPageActionForms = actionForms.filter(
      (a) =>
        hasPermission(`${config.id}:${a.key}`) &&
        (!a.isEligible || !item || a.isEligible(item)),
    );

    const actionFormMutations = detailPageActionForms.map((a) => ({
      key: a.key,
      label: a.label,
      onSelect: () => setActiveActionKey(a.key),
    }));

    const activeActionForm = detailPageActionForms.find(
      (a) => a.key === activeActionKey,
    );

    const toolbarElement = (
      <FormPage.Toolbar
        inline={isEmbedded}
        onBack={isEmbedded ? onClose : () => router.back()}
        popOutUrl={isEmbedded ? routes.detail(id!) : undefined}
        selectedRows={item ? [item] : []}
        mutations={[...bulkActions, ...actionFormMutations]}
        isDeleteEligible={canDelete ? isDeleteEligible : undefined}
        onDelete={canDelete ? () => setDeleteOpen(true) : undefined}
        onAdd={canAdd ? () => router.push(routes.add) : undefined}
      />
    );

    return (
      <RecordScreen
        form={form}
        formId={formId}
        onSubmit={onSave}
        className={isEmbedded ? "flex h-full min-h-0 flex-col" : undefined}
      >
        <RegistryCapture registryRef={registryRef} />
        <FormPage
          isDirty={isDirty || hasFileChanges}
          isSaving={isUpdating}
          isRefreshing={isRefreshing}
          isRefetching={isRefetching}
          alwaysAllowReset
          canSave={canUpdate}
          readOnly={!canUpdate}
          onSave={onSave}
          onReset={() => onReset(refetch)}
          className={isEmbedded ? "h-full px-4" : undefined}
        >
          {!isEmbedded && toolbarElement}

          <RecordFormShell
            hasTabs={hasTabs}
            title={resolvedLabels.singular}
            isOpen={formOpen}
            setOpen={setFormOpen}
            navProps={navProps}
            toolbar={isEmbedded ? toolbarElement : undefined}
            formRowLeft={item ? config.detailSlots?.left?.(item) : undefined}
            formRowRight={item ? config.detailSlots?.right?.(item) : undefined}
            beforeForm={item && config.detailSlots?.beforeForm?.(item)}
            afterForm={item && config.detailSlots?.afterForm?.(item)}
            afterTabs={item && config.detailSlots?.afterTabs?.(item)}
            form={
              item ? (
                <Form
                  key={`${itemId}-${dataUpdatedAt}`}
                  item={item}
                  layout="grid"
                  readOnly={!canUpdate}
                />
              ) : (
                <Loader className="items-center" />
              )
            }
            tabs={
              item && (
                <RecordTabs
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
              )
            }
          />

          {isError && (
            <p className="text-sm text-destructive">
              {tr("failedToLoad", {
                resource: resolvedLabels.singular.toLowerCase(),
              })}
            </p>
          )}
          {item && (
            <DeleteDialog
              open={deleteOpen}
              setOpen={setDeleteOpen}
              itemLabel={resolvedLabels.singular}
              pluralLabel={resolvedLabels.plural}
              gender={resolvedLabels.gender}
              id={[itemId!]}
              queryKeys={[keys.all]}
              deleteFn={() => removeAsync([itemId!])}
              onSuccess={isEmbedded ? onClose! : () => router.back()}
              onBulkResult={setActionFormError}
            />
          )}
          {item && activeActionForm && (
            <ActionFormDialog<TItem>
              config={activeActionForm as ActionFormConfig<TItem, any>}
              items={[item]}
              labels={resolvedLabels}
              open={!!activeActionKey}
              onClose={() => setActiveActionKey(null)}
              onError={setActionFormError}
            />
          )}

          <ResultDialog
            open={!!activeResult}
            setOpen={(o) => !o && clearActiveResult()}
            result={activeResult}
            itemLabel={resolvedLabels.singular}
            getItemHref={routes.detail}
          />

          {confirmDialog}
        </FormPage>
      </RecordScreen>
    );
  };
}
