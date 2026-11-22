import { and, eq } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { ContentTables } from "./drizzleStore";

/**
 * Deletes a content row's draft and revisions; call it in the same
 * transaction that deletes the row, so no history is left pointing at nothing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function forgetContentRow(tx: PgDatabase<any, any, any>, tables: ContentTables, type: string, rowId: string | number) {
  await tx.delete(tables.draft).where(and(eq(tables.draft.type, type), eq(tables.draft.rowId, String(rowId))));
  await tx.delete(tables.revision).where(and(eq(tables.revision.type, type), eq(tables.revision.rowId, String(rowId))));
}
