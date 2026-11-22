/**
 * A content row's status (per row, so per locale). Client-safe: the admin's
 * status pills and the server use the same rules.
 */
export type ContentStatus = "never-published" | "unpublished" | "published" | "draft-changes" | "not-translated";

export interface RowFacts {
  /** False when the entry has no row in this locale. */
  exists: boolean;
  publishedAt: string | null;
  hasDraft: boolean;
  /** A revision exists, so the row was published at some point. */
  hasRevision: boolean;
}

export function contentStatus(row: RowFacts): ContentStatus {
  if (!row.exists) return "not-translated";
  if (row.publishedAt === null) return row.hasRevision ? "unpublished" : "never-published";
  return row.hasDraft ? "draft-changes" : "published";
}

/** Statuses in the order filters and legends list them. */
export const CONTENT_STATUSES: readonly ContentStatus[] = ["published", "draft-changes", "never-published", "unpublished", "not-translated"];

/** Whether the row is live on the site in some version. */
export const isLive = (status: ContentStatus) => status === "published" || status === "draft-changes";
