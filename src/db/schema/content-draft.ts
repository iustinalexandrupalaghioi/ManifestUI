import { pgTable, bigint, text, jsonb, timestamp, uuid, unique } from "drizzle-orm/pg-core";

/**
 * Unpublished changes to a content row (src/framework/content): at most one
 * per (content type, row). A row that has never been published (or was
 * unpublished) is saved in place instead, since it isn't live.
 *
 * RLS is on with no policies: only the app's server connection reads drafts,
 * never Supabase's public API.
 */
export const contentDraft = pgTable(
  "content_draft",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "content_draft_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    /** The content type's name ("page"). */
    type: text().notNull(),
    /** The row's primary key, as text (content tables may use any key type). */
    rowId: text().notNull(),
    /** Every editable field of the entry. */
    data: jsonb().notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedBy: uuid(),
  },
  (table) => [unique("content_draft_type_row_id_key").on(table.type, table.rowId)],
).enableRLS();
