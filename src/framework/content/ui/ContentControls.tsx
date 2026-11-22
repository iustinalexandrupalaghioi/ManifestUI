"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfirmDialog } from "@/framework/components/dialog/ConfirmDialog";
import type { TableAction } from "@/framework/components/toolbar/Toolbar";
import { hasPermission } from "@/framework/authorization/cache/permissions";
import { usePermissions } from "@/framework/authorization/hooks/usePermissions";
import { toastError, toastSuccess } from "@/framework/lib/toast";
import { cn } from "@/framework/lib/utils";
import type { ActionResult } from "@/framework/lib/actionResult";
import type { ContentOptions } from "../options";
import { isLive } from "../status";
import { localeChoices } from "../recordRules";
import { useContentEditor } from "./context";
import { StatusPill } from "./StatusPill";

/** The query key of an entry's state; the record page invalidates it whenever the record reloads. */
export const contentStateKey = (type: string, rowId?: string) => (rowId ? ["content-state", type, rowId] : ["content-state", type]);

/** The entry's state: status, draft, history and its other locales. */
export function useContentState(type: string, rowId: string | undefined) {
  const { actions } = useContentEditor();
  return useQuery({
    queryKey: contentStateKey(type, rowId),
    enabled: !!rowId,
    queryFn: async () => {
      const result = await actions.state(type, rowId!);
      if (!result.ok) throw new Error(result.error.message);
      return result.data;
    },
  });
}

const LANGUAGE_NAMES: Record<string, { en: string; ro: string }> = {
  en: { en: "English", ro: "engleză" },
  ro: { en: "Romanian", ro: "română" },
};

function useLanguageName() {
  const uiLocale = useLocale();
  return (code: string) => LANGUAGE_NAMES[code]?.[uiLocale === "ro" ? "ro" : "en"] ?? code;
}

export interface ContentRecordProps {
  resourceId: string;
  options: ContentOptions;
  rowId: string | undefined;
  /** Reloads the record (after publish, discard, a new translation). */
  refetch: () => void;
  /** Opens another row of the entry (the language switch, a new translation). */
  openRow: (rowId: string) => void;
}

/**
 * The content actions for the record toolbar's Actions menu: Publish,
 * Unpublish, Discard draft, Add translation (per missing language). Each
 * shows only when it applies and the user has its permission; Unpublish and
 * Discard ask first (`dialogs` renders their confirmations).
 */
export function useContentActionsMenu({
  resourceId,
  options,
  rowId,
  refetch,
  openRow,
  isDirty,
}: Omit<ContentRecordProps, "options"> & { options: ContentOptions | undefined; isDirty: boolean }): {
  actions: TableAction<unknown>[];
  dialogs: ReactNode;
} {
  const t = useTranslations("Content");
  const language = useLanguageName();
  usePermissions();
  const { actions, locales } = useContentEditor();
  const queryClient = useQueryClient();
  // Resources that aren't content types call this too (hooks run on every render): nothing to offer.
  const state = useContentState(options?.type ?? "", options ? rowId : undefined);
  const [confirm, setConfirm] = useState<"discard" | "unpublish" | null>(null);
  const data = state.data;

  const run = async (action: () => Promise<ActionResult<unknown>>, done: string, after?: (result: unknown) => void) => {
    const result = await action();
    if (!result.ok) {
      toastError(result.error.message);
      return;
    }
    toastSuccess(done);
    await queryClient.invalidateQueries({ queryKey: contentStateKey(options!.type) });
    refetch();
    after?.(result.data);
  };

  if (!options || !rowId || !data) return { actions: [], dialogs: null };
  const can = (action: string) => hasPermission(`${resourceId}:${action}`);
  const missing = options.localized ? locales.filter((code) => data.locales[code]?.rowId === null) : [];
  const menu: TableAction<unknown>[] = [];

  if (can("publish"))
    menu.push({
      key: "content:publish",
      label: t("publish"),
      onSelect: () => {
        if (isDirty) toastError(t("saveFirst"));
        else return run(() => actions.publish(options.type, rowId), t("done.published"));
      },
    });
  if (can("publish") && isLive(data.status)) menu.push({ key: "content:unpublish", label: t("unpublish"), onSelect: () => setConfirm("unpublish") });
  if (can("update") && data.draft) menu.push({ key: "content:discard", label: t("discard"), onSelect: () => setConfirm("discard") });
  if (can("add"))
    for (const code of missing)
      menu.push({
        key: `content:translate:${code}`,
        label: `${t("addTranslation")} · ${code.toUpperCase()}`,
        onSelect: () =>
          run(() => actions.translate(options.type, rowId, code), t("done.translated", { language: language(code) }), (created) =>
            openRow((created as { rowId: string }).rowId),
          ),
      });

  const dialogs = (
    <>
      <ConfirmDialog
        open={confirm === "discard"}
        setOpen={(open) => !open && setConfirm(null)}
        title={t("confirm.discardTitle")}
        description={t("confirm.discardBody")}
        confirmLabel={t("discard")}
        variant="destructive"
        onConfirm={() => {
          setConfirm(null);
          void run(() => actions.discard(options.type, rowId), t("done.discarded"));
        }}
      />
      <ConfirmDialog
        open={confirm === "unpublish"}
        setOpen={(open) => !open && setConfirm(null)}
        title={t("confirm.unpublishTitle")}
        description={t("confirm.unpublishBody")}
        confirmLabel={t("unpublish")}
        variant="destructive"
        onConfirm={() => {
          setConfirm(null);
          void run(() => actions.unpublish(options.type, rowId), t("done.unpublished"));
        }}
      />
    </>
  );
  return { actions: menu, dialogs };
}

/** The status pill and the language switch (EN | RO), at the end of the record's toolbar. */
export function ContentStatusBar({ resourceId, options, rowId, openRow, refetch }: ContentRecordProps) {
  const t = useTranslations("Content");
  const language = useLanguageName();
  const { actions, locales } = useContentEditor();
  const queryClient = useQueryClient();
  const state = useContentState(options.type, rowId);
  const [creating, setCreating] = useState(false);
  const data = state.data;
  if (!rowId || !data) return state.isLoading ? <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-hidden /> : null;
  const canAdd = hasPermission(`${resourceId}:add`);

  const addTranslation = async (code: string) => {
    setCreating(true);
    try {
      const result = await actions.translate(options.type, rowId, code);
      if (!result.ok) {
        toastError(result.error.message);
        return;
      }
      toastSuccess(t("done.translated", { language: language(code) }));
      await queryClient.invalidateQueries({ queryKey: contentStateKey(options.type) });
      refetch();
      openRow(result.data.rowId);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <StatusPill status={data.status} />
      {options.localized && locales.length > 1 && (
        <div role="group" aria-label={t("language")} className="inline-flex overflow-hidden rounded-md border">
          {localeChoices(data, locales).map(({ locale: code, rowId: targetRow, status, current }) => {
            const label = code.toUpperCase();
            const base = "h-8 min-w-11 rounded-none border-0 px-3 text-xs font-semibold";
            if (targetRow)
              return (
                <Button
                  key={code}
                  type="button"
                  variant={current ? "default" : "ghost"}
                  className={base}
                  aria-current={current ? "true" : undefined}
                  title={t(`status.${status}`)}
                  onClick={() => !current && openRow(targetRow)}
                >
                  {label}
                </Button>
              );
            return (
              <Popover key={code}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" className={cn(base, "text-muted-foreground line-through decoration-1")} title={t("notTranslated")}>
                    {label}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="grid w-64 gap-3 p-3">
                  <p className="m-0 text-sm font-semibold">{t("notTranslated")}</p>
                  <p className="m-0 text-sm text-muted-foreground">{t("notTranslatedHint", { language: language(code) })}</p>
                  {canAdd && (
                    <Button type="button" size="sm" disabled={creating} onClick={() => addTranslation(code)}>
                      {creating && <Loader2Icon className="animate-spin" aria-hidden />}
                      {t("addTranslation")}
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      )}
    </>
  );
}
