"use client";

import { cn } from "@/framework/lib/utils";
import { ActionFormDialog } from "@/framework/components/dialog/ActionFormDialog";
import { DeleteDialog } from "@/framework/components/dialog/DeleteDialog";
import { ResultDialog } from "@/framework/components/dialog/ResultDialog";
import { FormPage } from "@/framework/components/page/FormPage";
import { recordTitle, usePublishRecordTitle } from "@/framework/components/page/recordTitle";
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
import { FormRelationsProvider } from "@/framework/components/relations/FormRelationsContext";
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
import { resolveResourceAction } from "../resource-action-config";
import { renderDetailSlot } from "@/framework/extensions/renderers";
import { ContentStatusBar, contentStateKey, useContentActionsMenu } from "@/framework/content/ui/ContentControls";
import { useQueryClient } from "@tanstack/react-query";
import { EntryLocaleContext } from "@/framework/content/ui/context";
import { recordActions, tabForField } from "@/framework/content/recordRules";
import { PreviewPane } from "@/framework/content/ui/PreviewPane";
import { revealField } from "@/framework/content/ui/revealField";
import { MonitorIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOOLBAR_BUTTON } from "@/framework/components/toolbar/Toolbar";
import { useHydrated } from "@/framework/hooks/useHydrated";

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

  // A singleton is one entry per locale: no Add, no Delete.
  const content = config.content;
  const contentRules = recordActions(content);
  const deleteToolbarEnabled = resolveResourceAction(config.delete).toolbarEnabled && contentRules.allowDelete;
  const addToolbarEnabled = resolveResourceAction(config.add).toolbarEnabled && contentRules.allowAdd;

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
    onNavigate,
  }: {
    id?: string;
    onClose?: () => void;
    onNavigate?: (id: string) => void;
  } = {}) {
    const params = useParams();
    const id = idProp ?? (params.id as string);

    const isEmbedded = !!onClose;
    const overviewKey = config.overviewKey;

    usePermissions();

    // `features.edit` is inline editing in the list; a record is editable with the update permission.
    // As the server renders it until hydration is done (the permission cache is browser-only).
    const hydrated = useHydrated();
    const canUpdate = hydrated && resolvePermission(config.permissions?.update);
    const canDelete =
      hydrated && resolvePermission(config.permissions?.delete) && deleteToolbarEnabled;
    const canAdd = hydrated && resolvePermission(config.permissions?.add) && addToolbarEnabled;

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
    const tContent = useTranslations("Content");
    // The live preview beside the tabs (previewable types with an address, every field in a tab).
    const canPreview = !!(content?.previewable && content.url && config.formInTabs);
    const [previewOpen, setPreviewOpen] = useState(false);
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
    // The navbar's breadcrumb names the record (not in the split view, where the list stays the page).
    usePublishRecordTitle(isEmbedded || !item ? null : recordTitle(item, itemId));

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
          if (!nextId) return;
          if (onNavigate) onNavigate(nextId);
          else router.replace(routes.detail(nextId));
        },
      });

    // In the split view, onNavigate is provided and prevPath/nextPath/etc.
    // carry raw ids instead of routes — see FormHeader.go.
    const toPath = (targetId: string) =>
      onNavigate ? targetId : routes.detail(targetId);

    const navProps = {
      prevPath: prevId ? toPath(prevId) : undefined,
      nextPath: nextId ? toPath(nextId) : undefined,
      firstPath:
        ids.length > 0 && currentIndex > 0 ? toPath(ids[0]) : undefined,
      lastPath:
        ids.length > 0 && currentIndex < ids.length - 1
          ? toPath(ids[ids.length - 1])
          : undefined,
      positionLabel,
      onNavigate,
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

    // Content types: Publish, Unpublish, Discard draft and Add translation join the Actions menu.
    const queryClient = useQueryClient();
    const recordRowId = itemId === undefined ? undefined : String(itemId);
    const openRow = (rowId: string) => (onNavigate ? onNavigate(rowId) : router.push(routes.detail(rowId)));
    const contentMenu = useContentActionsMenu({
      resourceId: config.id,
      options: content,
      rowId: recordRowId,
      isDirty: isDirty || hasFileChanges,
      refetch: () => void refetch(),
      openRow,
    });
    // The status, draft and history follow the record: refresh them whenever it reloads (after a save too).
    useEffect(() => {
      if (content && recordRowId) void queryClient.invalidateQueries({ queryKey: contentStateKey(content.type, recordRowId) });
    }, [dataUpdatedAt, recordRowId]);

    const toolbarElement = (
      <FormPage.Toolbar
        inline={isEmbedded}
        onBack={isEmbedded ? onClose : () => router.back()}
        popOutUrl={isEmbedded ? routes.detail(id!) : undefined}
        selectedRows={item ? [item] : []}
        mutations={[...bulkActions, ...actionFormMutations, ...(contentMenu.actions as typeof bulkActions)]}
        isDeleteEligible={canDelete ? isDeleteEligible : undefined}
        onDelete={canDelete ? () => setDeleteOpen(true) : undefined}
        onAdd={canAdd ? () => router.push(routes.add) : undefined}
        {...(content && {
          saveLabel: tContent("saveDraft"),
          extra: canPreview ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={cn(TOOLBAR_BUTTON, "max-lg:hidden", previewOpen && "border-primary text-primary")}
              aria-pressed={previewOpen}
              onClick={() => setPreviewOpen((open) => !open)}
            >
              <MonitorIcon aria-hidden />
              {tContent("preview.button")}
            </Button>
          ) : undefined,
          trailing: (
            <ContentStatusBar resourceId={config.id} options={content} rowId={recordRowId} refetch={() => void refetch()} openRow={openRow} />
          ),
        })}
      />
    );

    // Content types: the form knows its entry's locale (new blocks' defaults, pickers).
    const entryLocale = content && item ? String((item as Record<string, unknown>).locale ?? "") || null : null;

    return (
      <FormRelationsProvider value={{ relations: relations ?? [], idField: String(idField) }}>
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
          actionForms={detailPageActionForms.map((a) => ({
            key: a.key,
            label: a.label,
          }))}
          onOpenActionForm={setActiveActionKey}
          // Every field in a tab: the page doesn't scroll, the active tab's content does.
          className={cn(isEmbedded && "h-full px-4", config.formInTabs && "overflow-hidden")}
        >
          <EntryLocaleContext value={entryLocale}>
          <RecordFormShell
            hasTabs={hasTabs}
            title={resolvedLabels.singular}
            isOpen={formOpen}
            setOpen={setFormOpen}
            navProps={navProps}
            // In the sticky header, so it stays in view while the record scrolls.
            toolbar={toolbarElement}
            formRowLeft={renderDetailSlot(config.detailSlots?.left, item)}
            formRowRight={renderDetailSlot(config.detailSlots?.right, item)}
            beforeForm={renderDetailSlot(config.detailSlots?.beforeForm, item)}
            afterForm={renderDetailSlot(config.detailSlots?.afterForm, item)}
            afterTabs={renderDetailSlot(config.detailSlots?.afterTabs, item)}
            formInTabs={config.formInTabs}
            form={
              config.formInTabs ? (
                // The fields are in the tabs; only the loading state shows here.
                item ? null : <Loader className="items-center" />
              ) : item ? (
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
              config.formInTabs
                ? // The title bar joins the tabs' sticky header (alone while the record loads).
                  (header: React.ReactNode) =>
                    item ? (
                      <RecordTabs
                        tabs={tabs}
                        relations={relations}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        item={item}
                        idField={idField}
                        Form={Form}
                        // No form section above the tabs: a list in a tab gets the available height.
                        formOpen={false}
                        readOnly={!canUpdate}
                        header={header}
                        aside={
                          canPreview && previewOpen && recordRowId ? (
                            <PreviewPane
                              options={content!}
                              rowId={recordRowId}
                              entryId={String((item as Record<string, unknown>).entryId ?? "")}
                              locale={String((item as Record<string, unknown>).locale ?? "")}
                              version={dataUpdatedAt}
                              onClose={() => setPreviewOpen(false)}
                              onSelectField={(name) => {
                                // Clicked in the preview: show its tab, then the field (opening its block).
                                const tab = tabForField(tabs as never, name, (config.detailFormConfig ?? config.formConfig)?.layout);
                                if (tab) setActiveTab(tab);
                                revealField(name);
                              }}
                            />
                          ) : undefined
                        }
                      />
                    ) : (
                      header
                    )
                : item && (
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
          </EntryLocaleContext>

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
          {contentMenu.dialogs}
        </FormPage>
      </RecordScreen>
      </FormRelationsProvider>
    );
  };
}
