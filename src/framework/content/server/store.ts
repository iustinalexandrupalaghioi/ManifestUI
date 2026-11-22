/**
 * Storage the publishing service runs on: the content type's own table (the
 * published row, or the only version before first publish) plus the shared
 * draft and revision tables. Implemented with Drizzle (./drizzleStore.ts).
 */
import type { AnyContentType } from "../define";

export type EntryData = Record<string, unknown>;

export interface RowState {
  rowId: string;
  entryId: string;
  locale: string;
  publishedAt: string | null;
  publishedBy: string | null;
  /** Every editable field, as stored in the row. */
  data: EntryData;
}

export interface DraftState {
  data: EntryData;
  updatedAt: string;
  updatedBy: string | null;
}

export interface RevisionSummary {
  id: string;
  rowId: string;
  publishedAt: string;
  publishedBy: string | null;
}

export interface RevisionState extends RevisionSummary {
  data: EntryData;
}

/** What the status of one row is computed from (see ../status.ts). */
export interface RowStatusFacts {
  rowId: string;
  entryId: string;
  locale: string;
  publishedAt: string | null;
  hasDraft: boolean;
  hasRevision: boolean;
}

/** `"now"` lets the database stamp the time, so one transaction shares one clock. */
export type Timestamp = string | null | "now";

export interface ContentStoreTx {
  getRow(type: AnyContentType, rowId: string): Promise<RowState | null>;
  getRowByEntry(type: AnyContentType, entryId: string, locale: string): Promise<RowState | null>;
  updateRow(type: AnyContentType, rowId: string, patch: { data?: EntryData; publishedAt?: Timestamp; publishedBy?: string | null }): Promise<void>;
  /** Inserts an unpublished row; returns its id. */
  insertRow(type: AnyContentType, row: { entryId: string; locale: string; data: EntryData }): Promise<string>;
  getDraft(type: AnyContentType, rowId: string): Promise<DraftState | null>;
  putDraft(type: AnyContentType, rowId: string, data: EntryData, userId: string | null): Promise<void>;
  deleteDraft(type: AnyContentType, rowId: string): Promise<void>;
  addRevision(type: AnyContentType, rowId: string, data: EntryData, userId: string | null): Promise<void>;
  /** Deletes all but the newest `keep` revisions of a row. */
  pruneRevisions(type: AnyContentType, rowId: string, keep: number): Promise<void>;
  getRevision(type: AnyContentType, revisionId: string): Promise<RevisionState | null>;
  /** Newest first. */
  listRevisions(type: AnyContentType, rowId: string, limit: number): Promise<RevisionSummary[]>;
  /** Rows for a picker: in `locale` (localized types), matching `search` on the title or slug, newest first (by updated_at when the table has it, else by id). */
  searchEntries(type: AnyContentType, query: { locale?: string; search?: string; entryIds?: readonly string[]; limit: number }): Promise<RowState[]>;
  /** Status facts for rows of these entries (every row of the type when `entryIds` is omitted). */
  statusFacts(type: AnyContentType, entryIds?: readonly string[]): Promise<RowStatusFacts[]>;
}

export interface ContentStore extends ContentStoreTx {
  /** Runs `fn` in one transaction: everything or nothing. */
  transaction<T>(fn: (tx: ContentStoreTx) => Promise<T>): Promise<T>;
}
