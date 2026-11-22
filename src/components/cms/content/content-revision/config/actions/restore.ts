"use server";

import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { contentRevision } from "@/db/schema";
import { requirePermission } from "@/framework/authorization/lib/requirePermission";
import { getContentActions, runContentAction } from "@/framework/content/server/index.server";
import type { ContentRevision } from "../api";

/**
 * "Restore to draft" (toolbar button): copies each chosen version into its entry's draft, never
 * live (Publish does that). "content-revisions:restore" follows the content types (whoever can
 * edit one), and `update` is checked on every chosen version's own content type before anything
 * is written. All versions are restored in one transaction or none, one version per entry.
 */
export async function restoreAction(ids: ContentRevision["id"][]) {
  return runContentAction("content-revisions:restore", async () => {
    await requirePermission("content-revisions", "restore");
    const versions = await db
      .select({ id: contentRevision.id, type: contentRevision.type })
      .from(contentRevision)
      .where(inArray(contentRevision.id, ids));
    return getContentActions().restoreRevisions(versions.map((version) => ({ type: version.type, revisionId: String(version.id) })));
  });
}
