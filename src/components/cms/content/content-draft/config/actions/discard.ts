"use server";

import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { contentDraft } from "@/db/schema";
import { requirePermission } from "@/framework/authorization/lib/requirePermission";
import { getContentActions, runContentAction } from "@/framework/content/server/index.server";
import type { ContentDraft } from "../api";

/**
 * "Discard draft" (toolbar button): drops each chosen draft through the content actions, so the
 * published version stays live and caches refresh. "content-drafts:discard" follows the content
 * types (whoever can edit one), and the content action checks `update` on each draft's own type.
 */
export async function discardAction(ids: ContentDraft["id"][]) {
  return runContentAction("content-drafts:discard", async () => {
    await requirePermission("content-drafts", "discard");
    const drafts = await db
      .select({ type: contentDraft.type, rowId: contentDraft.rowId })
      .from(contentDraft)
      .where(inArray(contentDraft.id, ids));
    const actions = getContentActions();
    for (const draft of drafts) await actions.discardDraft(draft.type, draft.rowId);
    return { ok: true as const };
  });
}
