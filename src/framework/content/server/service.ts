/**
 * Drafts, publishing and revisions for content types (§4.2–4.4):
 *
 * - Save: a row that isn't live (never published, or unpublished) is saved in
 *   place; a live row keeps its published version and the save goes to its draft.
 * - Publish: validates the draft (or the row), copies it into the row, stamps
 *   published_at/by, writes a revision, deletes the draft and keeps the latest
 *   revisions. One transaction: invalid data or a failed write changes nothing.
 * - Unpublish, discard, restore (into the draft, never live), add translation.
 *
 * Permissions and cache refreshes are the caller's (./actions.ts).
 */
import { z } from "zod";
import { strictSchema } from "../fields";
import type { AnyContentType } from "../define";
import { contentStatus, type ContentStatus } from "../status";
import type { ContentStore, ContentStoreTx, DraftState, EntryData, RevisionSummary, RowState } from "./store";

export const REVISIONS_KEPT = 50;

/** A row, draft or revision that doesn't exist (or belongs to another type). */
export class ContentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContentNotFoundError";
  }
}

/** An action that doesn't apply to this content type or row (e.g. a translation that exists). */
export class ContentConflictError extends Error {
  constructor(
    /** For translated messages. */
    readonly code: "not-localized" | "unknown-locale" | "translation-exists" | "not-previewable" | "preview-not-configured" | "one-version-per-entry",
    message: string,
  ) {
    super(message);
    this.name = "ContentConflictError";
  }
}

/** Keeps only the content type's fields (form values also carry id, locale…). */
export function pickFields(def: AnyContentType, data: unknown): EntryData {
  const source = data && typeof data === "object" ? (data as EntryData) : {};
  return Object.fromEntries(Object.keys(def.fields.shape).filter((key) => key in source).map((key) => [key, source[key]]));
}

/**
 * Checks an entry's fields with the type's save schema and returns them
 * normalized. Throws a ZodError (issues by field path) when they're invalid.
 */
export function validateEntry(def: AnyContentType, data: unknown): EntryData {
  const fields = pickFields(def, data);
  const result = (def.schema ?? strictSchema(def.fields)).safeParse(fields);
  if (!result.success) throw result.error;
  return def.fields.parse(result.data) as EntryData;
}

/** Reads stored fields leniently (revisions written under an older schema still load). */
const readEntry = (def: AnyContentType, data: unknown): EntryData => def.fields.parse(pickFields(def, data)) as EntryData;

export interface EntryState {
  row: RowState;
  draft: DraftState | null;
  status: ContentStatus;
  /** What the editor shows: the draft when there is one, otherwise the row. */
  data: EntryData;
  revisions: RevisionSummary[];
  /** The entry's other locales: their row id (null when not translated) and status. */
  locales: Record<string, { rowId: string | null; status: ContentStatus }>;
}

/** What changed, for cache refreshes. */
export interface ContentChange {
  kind: "saved" | "published" | "unpublished" | "discarded" | "restored" | "translated" | "deleted";
  type: string;
  entryId: string;
  locale: string;
  rowId: string;
  /** The row's fields before and after (published versions; drafts aren't live). */
  before: EntryData;
  after: EntryData;
  /** True when the live version changed (publish, unpublish, deleting a published row; saving a row that isn't live does not count). */
  live: boolean;
}

export function createContentService(store: ContentStore, options: { locales: readonly string[]; revisionsKept?: number }) {
  const keep = options.revisionsKept ?? REVISIONS_KEPT;

  async function rowOrThrow(tx: ContentStoreTx, def: AnyContentType, rowId: string) {
    const row = await tx.getRow(def, rowId);
    if (!row) throw new ContentNotFoundError(`${def.name} row ${rowId} not found`);
    return row;
  }

  const change = (kind: ContentChange["kind"], def: AnyContentType, row: RowState, after: EntryData, live: boolean): ContentChange => ({
    kind,
    type: def.name,
    entryId: row.entryId,
    locale: row.locale,
    rowId: row.rowId,
    before: row.data,
    after,
    live,
  });

  /** Writes fields where a save goes: the row when it isn't live, otherwise its draft. */
  async function write(tx: ContentStoreTx, def: AnyContentType, row: RowState, data: EntryData, userId: string | null) {
    if (row.publishedAt === null) {
      await tx.updateRow(def, row.rowId, { data });
      // A draft left from before an unpublish would shadow the row: the row is the source now.
      await tx.deleteDraft(def, row.rowId);
      return "row" as const;
    }
    await tx.putDraft(def, row.rowId, data, userId);
    return "draft" as const;
  }

  /** Copies a revision into the draft (or the row, when it isn't live), inside `tx`. */
  async function restoreIn(tx: ContentStoreTx, def: AnyContentType, revisionId: string, userId: string | null) {
    const revision = await tx.getRevision(def, revisionId);
    if (!revision) throw new ContentNotFoundError(`${def.name} revision ${revisionId} not found`);
    const row = await rowOrThrow(tx, def, revision.rowId);
    const data = readEntry(def, revision.data);
    const savedTo = await write(tx, def, row, data, userId);
    return { savedTo, rowId: row.rowId, change: change("restored", def, row, savedTo === "row" ? data : row.data, false) };
  }

  return {
    /** Save draft. Validated like a publish, so what's saved can always be published. */
    async saveDraft(def: AnyContentType, rowId: string, data: unknown, userId: string | null) {
      const valid = validateEntry(def, data);
      return store.transaction(async (tx) => {
        const row = await rowOrThrow(tx, def, rowId);
        const savedTo = await write(tx, def, row, valid, userId);
        return { savedTo, change: change("saved", def, row, savedTo === "row" ? valid : row.data, false) };
      });
    },

    async publish(def: AnyContentType, rowId: string, userId: string | null) {
      return store.transaction(async (tx) => {
        const row = await rowOrThrow(tx, def, rowId);
        const draft = await tx.getDraft(def, rowId);
        // Throws on invalid data before anything is written.
        const valid = validateEntry(def, draft?.data ?? row.data);
        await tx.updateRow(def, rowId, { data: valid, publishedAt: "now", publishedBy: userId });
        await tx.addRevision(def, rowId, valid, userId);
        await tx.deleteDraft(def, rowId);
        await tx.pruneRevisions(def, rowId, keep);
        return { change: change("published", def, row, valid, true) };
      });
    },

    async unpublish(def: AnyContentType, rowId: string) {
      return store.transaction(async (tx) => {
        const row = await rowOrThrow(tx, def, rowId);
        if (row.publishedAt !== null) await tx.updateRow(def, rowId, { publishedAt: null, publishedBy: null });
        return { change: change("unpublished", def, row, row.data, row.publishedAt !== null) };
      });
    },

    async discardDraft(def: AnyContentType, rowId: string) {
      return store.transaction(async (tx) => {
        const row = await rowOrThrow(tx, def, rowId);
        await tx.deleteDraft(def, rowId);
        return { change: change("discarded", def, row, row.data, false) };
      });
    },

    /** Copies a revision into the draft (or the row, when it isn't live). Never publishes. */
    async restoreRevision(def: AnyContentType, revisionId: string, userId: string | null) {
      return store.transaction((tx) => restoreIn(tx, def, revisionId, userId));
    },

    /**
     * Several revisions (of any types) in one transaction: all restored or none. At most one
     * revision per row, since a second would silently overwrite the first.
     */
    async restoreRevisions(items: readonly { def: AnyContentType; revisionId: string }[], userId: string | null) {
      return store.transaction(async (tx) => {
        const rows = new Set<string>();
        const results = [];
        for (const { def, revisionId } of items) {
          const revision = await tx.getRevision(def, revisionId);
          if (!revision) throw new ContentNotFoundError(`${def.name} revision ${revisionId} not found`);
          const key = `${def.name}:${revision.rowId}`;
          if (rows.has(key)) throw new ContentConflictError("one-version-per-entry", `Two versions of ${def.name} ${revision.rowId} chosen`);
          rows.add(key);
          results.push({ def, ...(await restoreIn(tx, def, revisionId, userId)) });
        }
        return results;
      });
    },

    /** Creates the entry's row in another locale, prefilled from this one, not published. */
    async addTranslation(def: AnyContentType, rowId: string, locale: string) {
      if (!def.descriptor.content.localized) throw new ContentConflictError("not-localized", `${def.name} isn't localized`);
      if (!options.locales.includes(locale)) throw new ContentConflictError("unknown-locale", `"${locale}" isn't one of the site's languages`);
      return store.transaction(async (tx) => {
        const row = await rowOrThrow(tx, def, rowId);
        if (await tx.getRowByEntry(def, row.entryId, locale)) throw new ContentConflictError("translation-exists", `This entry already has a ${locale} version`);
        const draft = await tx.getDraft(def, rowId);
        const data = readEntry(def, draft?.data ?? row.data);
        const newRowId = await tx.insertRow(def, { entryId: row.entryId, locale, data });
        return { rowId: newRowId, change: { ...change("translated", def, row, data, false), locale, rowId: newRowId } };
      });
    },

    /** Everything the editor shows for a row: data to edit, status, history, other locales. */
    async state(def: AnyContentType, rowId: string): Promise<EntryState> {
      const row = await store.getRow(def, rowId);
      if (!row) throw new ContentNotFoundError(`${def.name} row ${rowId} not found`);
      const [draft, revisions, facts] = await Promise.all([
        store.getDraft(def, rowId),
        store.listRevisions(def, rowId, keep),
        store.statusFacts(def, [row.entryId]),
      ]);
      const locales: EntryState["locales"] = {};
      for (const locale of def.descriptor.content.localized ? options.locales : [row.locale]) {
        const fact = facts.find((item) => item.locale === locale);
        locales[locale] = fact ? { rowId: fact.rowId, status: contentStatus({ exists: true, ...fact }) } : { rowId: null, status: "not-translated" };
      }
      return {
        row,
        draft,
        status: contentStatus({ exists: true, publishedAt: row.publishedAt, hasDraft: !!draft, hasRevision: revisions.length > 0 }),
        data: draft ? readEntry(def, draft.data) : row.data,
        revisions,
        locales,
      };
    },

    /** One revision's fields, for Compare. */
    async revision(def: AnyContentType, revisionId: string) {
      const revision = await store.getRevision(def, revisionId);
      if (!revision) throw new ContentNotFoundError(`${def.name} revision ${revisionId} not found`);
      return { ...revision, data: readEntry(def, revision.data) };
    },

    /** Entries for a reference or link picker: title, address and status, in `locale`. */
    async options(def: AnyContentType, query: { locale?: string; search?: string; entryIds?: readonly string[]; limit?: number }) {
      const rows = await store.searchEntries(def, { ...query, limit: Math.min(query.limit ?? 20, 100) });
      const facts = await store.statusFacts(def, [...new Set(rows.map((row) => row.entryId))]);
      const { titleField, slugField } = def.descriptor.content;
      return rows.map((row) => {
        const data = readEntry(def, row.data);
        const fact = facts.find((item) => item.rowId === row.rowId);
        return {
          entryId: row.entryId,
          rowId: row.rowId,
          locale: row.locale,
          title: titleField && typeof data[titleField] === "string" ? (data[titleField] as string) : "",
          slug: slugField && typeof data[slugField] === "string" ? (data[slugField] as string) : null,
          status: fact ? contentStatus({ exists: true, ...fact }) : ("never-published" as ContentStatus),
        };
      });
    },

    /** Status per locale for each entry: `{ [entryId]: { en: "published", ro: "not-translated" } }`. */
    async statuses(def: AnyContentType, entryIds?: readonly string[]) {
      const facts = await store.statusFacts(def, entryIds);
      const result: Record<string, Record<string, ContentStatus>> = {};
      const locales = def.descriptor.content.localized ? options.locales : null;
      for (const entryId of entryIds ?? [...new Set(facts.map((fact) => fact.entryId))]) {
        const rows = facts.filter((fact) => fact.entryId === entryId);
        result[entryId] = Object.fromEntries(
          (locales ?? rows.map((row) => row.locale)).map((locale) => {
            const fact = rows.find((row) => row.locale === locale);
            return [locale, fact ? contentStatus({ exists: true, ...fact }) : "not-translated"] as const;
          }),
        );
      }
      return result;
    },
  };
}

export type ContentService = ReturnType<typeof createContentService>;

/** True for errors the service raises on purpose (shown to the editor as they are). */
export const isContentError = (error: unknown) =>
  error instanceof ContentNotFoundError || error instanceof ContentConflictError || error instanceof z.ZodError;
