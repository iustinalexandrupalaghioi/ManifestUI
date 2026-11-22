/**
 * The ContentStore on the project's database: each content type's own table
 * plus the shared draft and revision tables (src/db/schema/content-draft.ts and content-revision.ts, passed
 * in through the manifest config). Takes the client as a parameter, so tests
 * can run it inside a transaction they roll back.
 */
import { and, asc, desc, eq, getTableColumns, ilike, inArray, isNotNull, notInArray, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgDatabase, PgTable } from "drizzle-orm/pg-core";
import type { AnyContentType } from "../define";
import type { ContentStore, ContentStoreTx, EntryData, RowState, Timestamp } from "./store";
import type { ReadSource } from "./read";

/** The draft and revision tables' columns (camelCase properties). */
export interface ContentTables {
  draft: PgTable & { type: PgColumn; rowId: PgColumn; data: PgColumn; updatedAt: PgColumn; updatedBy: PgColumn };
  revision: PgTable & { id: PgColumn; type: PgColumn; rowId: PgColumn; data: PgColumn; publishedAt: PgColumn; publishedBy: PgColumn };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = PgDatabase<any, any, any>;

function columnsOf(def: AnyContentType) {
  const columns = getTableColumns(def.table as PgTable) as Record<string, PgColumn>;
  const pk = Object.values(columns).find((column) => column.primary);
  if (!pk) throw new Error(`Content type "${def.name}": its table has no primary key column.`);
  return { columns, pk };
}

/** A row id (always text in the content tables) as the key column's value. */
const keyValue = (pk: PgColumn, rowId: string) => (pk.dataType === "number" ? Number(rowId) : rowId);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether `value` fits the column: digits for a numeric key, a uuid for a uuid column. Ids come
 * from the client, and one that can't match must read as "not found", not a database error.
 */
const fitsColumn = (column: PgColumn, value: string) =>
  column.dataType === "number" ? /^\d{1,18}$/.test(value) : column.columnType === "PgUUID" ? UUID.test(value) : true;

/** The ids that fit the column (the others can't match a row). */
const fitting = (column: PgColumn, values: readonly string[]) => values.filter((value) => fitsColumn(column, value));

const stamp = (value: Timestamp) => (value === "now" ? sql`now()` : value);

/** A table record as a RowState (its fields picked, or its json column). */
function toRow(def: AnyContentType, record: Record<string, unknown>): RowState {
  const { pk } = columnsOf(def);
  const pkKey = Object.entries(getTableColumns(def.table as PgTable)).find(([, column]) => column === pk)![0];
  const data: EntryData = def.jsonColumn
    ? ((record[def.jsonColumn] as EntryData | null) ?? {})
    : Object.fromEntries(Object.keys(def.fields.shape).map((field) => [field, record[field]]));
  return {
    rowId: String(record[pkKey]),
    entryId: record.entryId as string,
    locale: (record.locale as string | undefined) ?? "",
    publishedAt: (record.publishedAt as string | null) ?? null,
    publishedBy: (record.publishedBy as string | null) ?? null,
    data,
  };
}

export function createDrizzleContentStore(db: Db, tables: ContentTables): ContentStore {
  const ops = (client: Db): ContentStoreTx => {
    /** The columns a write sets for these fields (and `updated_at` when the table has it). */
    const dataColumns = (def: AnyContentType, data: EntryData) => {
      const { columns } = columnsOf(def);
      const values: Record<string, unknown> = def.jsonColumn
        ? { [def.jsonColumn]: data }
        : Object.fromEntries(Object.entries(data).filter(([field]) => field in def.fields.shape));
      if ("updatedAt" in columns) values.updatedAt = sql`now()`;
      return values;
    };

    const draftWhere = (def: AnyContentType, rowId: string) => and(eq(tables.draft.type, def.name), eq(tables.draft.rowId, rowId));
    const revisionWhere = (def: AnyContentType, rowId: string) => and(eq(tables.revision.type, def.name), eq(tables.revision.rowId, rowId));

    return {
      async getRow(def, rowId) {
        const { pk } = columnsOf(def);
        if (!fitsColumn(pk, rowId)) return null;
        const [record] = await client.select().from(def.table as PgTable).where(eq(pk, keyValue(pk, rowId))).limit(1);
        return record ? toRow(def, record) : null;
      },

      async getRowByEntry(def, entryId, locale) {
        const { columns } = columnsOf(def);
        if (!fitsColumn(columns.entryId, entryId)) return null;
        const where: SQL[] = [eq(columns.entryId, entryId)];
        if (def.descriptor.content.localized) where.push(eq(columns.locale, locale));
        const [record] = await client.select().from(def.table as PgTable).where(and(...where)).limit(1);
        return record ? toRow(def, record) : null;
      },

      async updateRow(def, rowId, patch) {
        const { columns, pk } = columnsOf(def);
        const values: Record<string, unknown> = patch.data ? dataColumns(def, patch.data) : {};
        if (patch.publishedAt !== undefined) {
          values.publishedAt = stamp(patch.publishedAt);
        }
        if (patch.publishedBy !== undefined) values.publishedBy = patch.publishedBy;
        if (!Object.keys(values).length || !fitsColumn(pk, rowId)) return;
        await client.update(def.table as PgTable).set(values).where(eq(pk, keyValue(pk, rowId)));
      },

      async insertRow(def, row) {
        const { columns, pk } = columnsOf(def);
        const values: Record<string, unknown> = { ...dataColumns(def, row.data), entryId: row.entryId, publishedAt: null, publishedBy: null };
        if (def.descriptor.content.localized) values.locale = row.locale;
        const [inserted] = await client.insert(def.table as PgTable).values(values).returning({ id: pk });
        return String(inserted.id);
      },

      async getDraft(def, rowId) {
        const [draft] = await client
          .select({ data: tables.draft.data, updatedAt: tables.draft.updatedAt, updatedBy: tables.draft.updatedBy })
          .from(tables.draft)
          .where(draftWhere(def, rowId))
          .limit(1);
        return draft ? { data: draft.data as EntryData, updatedAt: draft.updatedAt as string, updatedBy: draft.updatedBy as string | null } : null;
      },

      async putDraft(def, rowId, data, userId) {
        await client
          .insert(tables.draft)
          .values({ type: def.name, rowId, data, updatedBy: userId })
          .onConflictDoUpdate({ target: [tables.draft.type, tables.draft.rowId], set: { data, updatedBy: userId, updatedAt: sql`now()` } });
      },

      async deleteDraft(def, rowId) {
        await client.delete(tables.draft).where(draftWhere(def, rowId));
      },

      async addRevision(def, rowId, data, userId) {
        await client.insert(tables.revision).values({ type: def.name, rowId, data, publishedBy: userId });
      },

      async pruneRevisions(def, rowId, keep) {
        const newest = client
          .select({ id: tables.revision.id })
          .from(tables.revision)
          .where(revisionWhere(def, rowId))
          .orderBy(desc(tables.revision.publishedAt), desc(tables.revision.id))
          .limit(keep);
        await client.delete(tables.revision).where(and(revisionWhere(def, rowId), notInArray(tables.revision.id, newest)));
      },

      async getRevision(def, revisionId) {
        if (!/^\d+$/.test(revisionId)) return null;
        const [revision] = await client
          .select()
          .from(tables.revision)
          .where(and(eq(tables.revision.type, def.name), eq(tables.revision.id, Number(revisionId))))
          .limit(1);
        if (!revision) return null;
        const record = revision as Record<string, unknown>;
        return {
          id: String(record.id),
          rowId: record.rowId as string,
          data: record.data as EntryData,
          publishedAt: record.publishedAt as string,
          publishedBy: (record.publishedBy as string | null) ?? null,
        };
      },

      async listRevisions(def, rowId, limit) {
        const revisions = await client
          .select({ id: tables.revision.id, rowId: tables.revision.rowId, publishedAt: tables.revision.publishedAt, publishedBy: tables.revision.publishedBy })
          .from(tables.revision)
          .where(revisionWhere(def, rowId))
          .orderBy(desc(tables.revision.publishedAt), desc(tables.revision.id))
          .limit(limit);
        return revisions.map((revision) => ({
          id: String(revision.id),
          rowId: revision.rowId as string,
          publishedAt: revision.publishedAt as string,
          publishedBy: (revision.publishedBy as string | null) ?? null,
        }));
      },

      async searchEntries(def, query) {
        const { columns, pk } = columnsOf(def);
        const where: SQL[] = [];
        if (query.locale && def.descriptor.content.localized) where.push(eq(columns.locale, query.locale));
        if (query.entryIds) {
          const entryIds = fitting(columns.entryId, query.entryIds);
          if (!entryIds.length) return [];
          where.push(inArray(columns.entryId, entryIds));
        }
        const searchable = def.jsonColumn
          ? []
          : [def.descriptor.content.titleField, def.descriptor.content.slugField].flatMap((field) => (field && columns[field] ? [columns[field]] : []));
        if (query.search && searchable.length) {
          // The search is text, not a pattern: escape LIKE's wildcards.
          const pattern = `%${query.search.replace(/[%_\\]/g, (char) => "\\" + char)}%`;
          where.push(or(...searchable.map((column) => ilike(column, pattern)))!);
        }
        const records = await client
          .select()
          .from(def.table as PgTable)
          .where(where.length ? and(...where) : undefined)
          // Newest first: by updated_at when the table has it (a uuid key says nothing about age).
          .orderBy(...(columns.updatedAt ? [desc(columns.updatedAt)] : []), desc(pk))
          .limit(query.limit);
        return records.map((record) => toRow(def, record as Record<string, unknown>));
      },

      async statusFacts(def, entryIds) {
        const { columns, pk } = columnsOf(def);
        const wanted = entryIds && fitting(columns.entryId, entryIds);
        if (wanted && !wanted.length) return [];
        const rowKey = sql`${pk}::text`;
        const rows = await client
          .select({
            rowId: rowKey.mapWith(String) as SQL<string>,
            entryId: columns.entryId,
            locale: def.descriptor.content.localized ? columns.locale : sql<string>`''`,
            publishedAt: columns.publishedAt,
            hasDraft: sql<boolean>`exists (select 1 from ${tables.draft} where ${tables.draft.type} = ${def.name} and ${tables.draft.rowId} = ${rowKey})`,
            hasRevision: sql<boolean>`exists (select 1 from ${tables.revision} where ${tables.revision.type} = ${def.name} and ${tables.revision.rowId} = ${rowKey})`,
          })
          .from(def.table as PgTable)
          .where(wanted ? inArray(columns.entryId, wanted) : undefined);
        return rows.map((row) => ({
          rowId: String(row.rowId),
          entryId: row.entryId as string,
          locale: row.locale as string,
          publishedAt: (row.publishedAt as string | null) ?? null,
          hasDraft: !!row.hasDraft,
          hasRevision: !!row.hasRevision,
        }));
      },
    };
  };

  return {
    ...ops(db),
    transaction: (fn) => db.transaction((tx) => fn(ops(tx as unknown as Db))),
  };
}

/** The content layer's reads on the project's database: published rows (or every row in draft mode) and drafts. */
export function createDrizzleReadSource(db: Db, tables: ContentTables): ReadSource {
  return {
    async rows(def, query) {
      const { columns, pk } = columnsOf(def);
      const where: SQL[] = [];
      if (query.publishedOnly) where.push(isNotNull(columns.publishedAt));
      if (query.locales && def.descriptor.content.localized) where.push(inArray(columns.locale, [...query.locales]));
      if (query.entryIds) {
        const entryIds = fitting(columns.entryId, query.entryIds);
        if (!entryIds.length) return [];
        where.push(inArray(columns.entryId, entryIds));
      }
      const columnFor = (field: string, purpose: string) => {
        const column = def.jsonColumn || !(field in def.fields.shape) ? undefined : columns[field];
        if (!column) throw new Error(`Content type "${def.name}": can't ${purpose} "${field}".`);
        return column;
      };
      for (const [field, value] of Object.entries(query.equals ?? {})) where.push(eq(columnFor(field, "filter on"), value));
      const order = (query.order ?? []).map(({ field, direction }) => (direction === "desc" ? desc : asc)(columnFor(field, "order by")));
      let select = db
        .select()
        .from(def.table as PgTable)
        .where(where.length ? and(...where) : undefined)
        .orderBy(...order, asc(pk))
        .$dynamic();
      if (query.limit !== undefined) select = select.limit(query.limit);
      if (query.offset) select = select.offset(query.offset);
      return (await select).map((record) => toRow(def, record as Record<string, unknown>));
    },

    async drafts(def, rowIds) {
      if (!rowIds.length) return new Map();
      const drafts = await db
        .select({ rowId: tables.draft.rowId, data: tables.draft.data })
        .from(tables.draft)
        .where(and(eq(tables.draft.type, def.name), inArray(tables.draft.rowId, [...rowIds])));
      return new Map(drafts.map((draft) => [draft.rowId as string, draft.data as EntryData]));
    },
  };
}
