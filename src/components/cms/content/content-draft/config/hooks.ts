import "server-only";
import { inArray, sql } from "drizzle-orm";
import { contentDraft, user } from "@/db/schema";
import { contentTypes } from "@/content";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { ALL_PERMISSIONS } from "@/framework/authorization/constants";
import { getUserPermissions } from "@/framework/authorization/lib/permissions";
import { defineServerHooks } from "@/framework/lib/serverHooks";
import type { ContentDraftFormValues } from "./schema";

/** Each draft's title: its content type's title field, read from the stored fields. */
const title = sql<string>`coalesce(case ${contentDraft.type} ${sql.join(
  contentTypes.map((def) =>
    def.descriptor.content.titleField
      ? sql`when ${def.name} then ${contentDraft.data}->>${def.descriptor.content.titleField}`
      : sql`when ${def.name} then ''`,
  ),
  sql` `,
)} end, '')`;

/** Who saved it last (updated_by isn't a foreign key). */
const editorName = sql<string>`coalesce((select coalesce(${user.fullName}, ${user.email}) from ${user} where ${user.id} = ${contentDraft.updatedBy}), '')`;

/** The content types whose drafts the signed-in user may read: those they can read (their permissions read once). */
async function readableTypes(): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const permissions = new Set(await getUserPermissions(userId));
  if (permissions.has(ALL_PERMISSIONS)) return contentTypes.map((def) => def.name);
  return contentTypes.filter((def) => permissions.has(`${def.descriptor.id}:read`)).map((def) => def.name);
}

/**
 * Drafts: server rules Studio can't express, called by ./api.ts. Studio created this file and
 * never overwrites it. Save draft writes drafts, Publish and Discard draft (./actions/discard.ts)
 * remove them, all through the content actions: nothing is added, edited or deleted here, and the
 * list only shows drafts of content types the user can read (`content-drafts:read` follows them,
 * src/framework/content/revisions.ts).
 */
export const contentDraftServerHooks = defineServerHooks<ContentDraftFormValues, number>({
  select: { title, editorName },
  async scope() {
    const types = await readableTypes();
    return types.length ? inArray(contentDraft.type, types) : sql`false`;
  },
  beforeUpdate() {
    throw new Error("Drafts are written by Save draft on the entry and can't be edited here.");
  },
});
