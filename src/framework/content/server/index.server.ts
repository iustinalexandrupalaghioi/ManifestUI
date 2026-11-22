import "server-only";

import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getDbClient } from "@/framework/lib/dbClient";
import { getManifestConfig } from "@/framework/runtime";
import { requirePermission } from "@/framework/authorization/lib/requirePermission";
import { toActionResult } from "@/framework/authorization/lib/toActionResult";
import { refreshResource } from "./cache";
import type { ActionError } from "@/framework/lib/actionResult";
import { contentTag, entryTag } from "../tags";
import { statusField } from "../statusOptions";
import { createContentActions } from "./actions";
import { createDrizzleContentStore } from "./drizzleStore";
import { ContentConflictError, ContentNotFoundError, createContentService, type ContentChange } from "./service";
import type { AnyContentType } from "../define";
import type { PerIdResult } from "@/framework/lib/transactionalAction";

/** The project's content setup (src/manifest.config.ts › content). */
function contentConfig() {
  const content = getManifestConfig().content;
  if (!content) throw new Error("No `content` in src/manifest.config.ts: add the content tables and types.");
  return content;
}

let actions: ReturnType<typeof createContentActions> | undefined;

/** The content actions with the real database, session and caches. */
export function getContentActions() {
  if (actions) return actions;
  const config = contentConfig();
  const service = createContentService(createDrizzleContentStore(getDbClient(), config.tables), { locales: routing.locales });
  actions = createContentActions({
    service,
    getType: (name) => config.types.find((def) => def.name === name),
    authorize: (resourceId, action) => requirePermission(resourceId, action),
    previewSecret: () => process.env.PREVIEW_SECRET || undefined,
    onChange: onContentChange,
  });
  return actions;
}

/** After a content change commits: refresh the cached live version, then the project's `content.onChange`. */
async function onContentChange(change: ContentChange, def: AnyContentType) {
  // Only the live version is cached; drafts are read fresh by the editor and preview.
  if (change.live) {
    updateTag(contentTag(change.type));
    updateTag(entryTag(change.type, change.entryId));
    refreshResource(def.descriptor.id);
  }
  await contentConfig().onChange?.(change);
}

/**
 * Wraps a content resource's `crud.delete(...)` entry in api.ts: reads the rows first, then,
 * once the delete has committed, reports each deleted row as a `deleted` change (cache tags
 * and the project's `content.onChange`, like publish and unpublish).
 *
 *   deletePost: afterContentDelete("post", crud.delete(async (tx, id: number) => { … })),
 */
export function afterContentDelete<V, TId extends string | number>(
  type: string,
  entry: readonly [V, (ids: TId[]) => Promise<PerIdResult>],
) {
  const [verb, run] = entry;
  return [
    verb,
    async (ids: TId[]): Promise<PerIdResult> => {
      const config = contentConfig();
      const def = config.types.find((item) => item.name === type);
      if (!def) throw new Error(`No content type "${type}"`);
      const store = createDrizzleContentStore(getDbClient(), config.tables);
      const rows = new Map((await Promise.all(ids.map((id) => store.getRow(def, String(id))))).flatMap((row) => (row ? [[row.rowId, row] as const] : [])));
      const result = await run(ids);
      for (const id of result.succeededIds) {
        const row = rows.get(id);
        if (!row) continue;
        const change: ContentChange = {
          kind: "deleted",
          type: def.name,
          entryId: row.entryId,
          locale: row.locale,
          rowId: row.rowId,
          before: row.data,
          after: {},
          live: row.publishedAt !== null,
        };
        try {
          await onContentChange(change, def);
        } catch (error) {
          console.error(`[content] after deleted of ${type} ${id}:`, error);
        }
      }
      return result;
    },
  ] as const;
}

/**
 * A resource's record as the editor opens it: the row with its draft's fields
 * over it (when it has one). For `fetchDetail` in a content resource's api.ts,
 * which has checked the read permission already.
 */
export async function withContentDraft<T extends Record<string, unknown>>(type: string, rowId: string | number, row: T): Promise<T> {
  const config = contentConfig();
  const def = config.types.find((item) => item.name === type);
  if (!def) throw new Error(`No content type "${type}"`);
  const draft = await createDrizzleContentStore(getDbClient(), config.tables).getDraft(def, String(rowId));
  if (!draft) return row;
  return def.jsonColumn ? { ...row, [def.jsonColumn]: draft.data } : { ...row, ...draft.data };
}

/**
 * Save from a content resource's form: to the row while it isn't live, else
 * to its draft (the publishing service decides). For `update` in api.ts;
 * checks the update permission itself too.
 */
export async function saveContentFromForm(type: string, rowId: string | number, data: unknown) {
  const def = contentConfig().types.find((item) => item.name === type);
  // json-column types store their fields inside one column of the form values.
  const fields = def?.jsonColumn ? (data as Record<string, unknown>)[def.jsonColumn] : data;
  return getContentActions().saveDraft(type, String(rowId), fields);
}

/**
 * List rows with each locale's status of their entry (`status_en`,
 * `status_ro`), for a content resource's grid. For `fetchList` in api.ts,
 * which has checked the read permission already.
 */
export async function withContentStatuses<T extends { entryId: string }>(type: string, items: T[]): Promise<(T & Record<string, string>)[]> {
  const config = contentConfig();
  const def = config.types.find((item) => item.name === type);
  if (!def || !items.length) return items as (T & Record<string, string>)[];
  const service = createContentService(createDrizzleContentStore(getDbClient(), config.tables), { locales: routing.locales });
  const statuses = await service.statuses(def, [...new Set(items.map((item) => item.entryId))]);
  return items.map((item) => ({
    ...item,
    ...Object.fromEntries(Object.entries(statuses[item.entryId] ?? {}).map(([locale, status]) => [statusField(locale), status])),
  })) as (T & Record<string, string>)[];
}

/**
 * The row of a singleton in `locale` (or its only row when it isn't
 * localized), for the CMS link that opens it directly. Null when the row
 * doesn't exist yet (`pnpm content:migrate --apply` creates it).
 */
export async function singletonRowId(type: string, locale: string): Promise<string | null> {
  const config = contentConfig();
  const def = config.types.find((item) => item.name === type);
  if (!def || def.descriptor.content.kind !== "singleton") throw new Error(`"${type}" isn't a singleton content type`);
  const facts = await createDrizzleContentStore(getDbClient(), config.tables).statusFacts(def);
  const row = def.descriptor.content.localized ? facts.find((fact) => fact.locale === locale) : facts[0];
  return row?.rowId ?? null;
}

const CONFLICT_MESSAGES = {
  "not-localized": "contentNotLocalized",
  "unknown-locale": "contentUnknownLocale",
  "translation-exists": "contentTranslationExists",
  "not-previewable": "contentNotPreviewable",
  "preview-not-configured": "contentPreviewNotConfigured",
  "one-version-per-entry": "contentOneVersionPerEntry",
} as const;

async function describeContentError(error: unknown, locale: string): Promise<ActionError | null> {
  if (!(error instanceof ContentNotFoundError) && !(error instanceof ContentConflictError)) return null;
  const t = await getTranslations({ locale, namespace: "Errors" });
  if (error instanceof ContentNotFoundError) return { message: t("contentNotFound"), originalMessage: error.message, meta: { type: "not-found" } };
  return { message: t(CONFLICT_MESSAGES[error.code]), originalMessage: error.message, meta: { type: "conflict", code: error.code } };
}

/** Runs a content action and returns its result or error as data, like every CMS action. */
export function runContentAction<R>(label: string, run: () => Promise<R>) {
  return toActionResult(`content:${label}`, run, describeContentError);
}
