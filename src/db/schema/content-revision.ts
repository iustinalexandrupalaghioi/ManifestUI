import { sql } from "drizzle-orm";
import { pgTable, bigint, text, jsonb, timestamp, uuid, index } from "drizzle-orm/pg-core";

/**
 * What a content row looked like each time it was published: the latest 50
 * per (content type, row) are kept. Restoring one copies it into the draft.
 */
export const contentRevision = pgTable(
  "content_revision",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "content_revision_id_seq",
      startWith: 1,
      increment: 1,
      cache: 1,
    }),
    type: text().notNull(),
    rowId: text().notNull(),
    data: jsonb().notNull(),
    publishedAt: timestamp({ withTimezone: true, mode: "string" }).notNull().default(sql`now()`),
    publishedBy: uuid(),
  },
  (table) => [index("content_revision_type_row_id_published_at_idx").on(table.type, table.rowId, table.publishedAt.desc())],
).enableRLS();
