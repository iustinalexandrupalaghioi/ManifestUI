import "server-only";
import { inArray, sql } from "drizzle-orm";
import { contentRevision, user } from "@/db/schema";
import { contentTypes } from "@/content";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { ALL_PERMISSIONS } from "@/framework/authorization/constants";
import { getUserPermissions } from "@/framework/authorization/lib/permissions";
import { defineServerHooks } from "@/framework/lib/serverHooks";
import type { ContentRevisionFormValues } from "./schema";

/** Each version's title: its content type's title field, read from the stored fields. */
const title = sql<string>`coalesce(case ${contentRevision.type} ${sql.join(
  contentTypes.map((def) =>
    def.descriptor.content.titleField
      ? sql`when ${def.name} then ${contentRevision.data}->>${def.descriptor.content.titleField}`
      : sql`when ${def.name} then ''`,
  ),
  sql` `,
)} end, '')`;

/** Who published it (published_by isn't a foreign key: deleting a user keeps the history). */
const publisherName = sql<string>`coalesce((select coalesce(${user.fullName}, ${user.email}) from ${user} where ${user.id} = ${contentRevision.publishedBy}), '')`;

/** The content types whose versions the signed-in user may read: those they can read (their permissions read once). */
async function readableTypes(): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const permissions = new Set(await getUserPermissions(userId));
  if (permissions.has(ALL_PERMISSIONS)) return contentTypes.map((def) => def.name);
  return contentTypes.filter((def) => permissions.has(`${def.descriptor.id}:read`)).map((def) => def.name);
}

/**
 * Versions: server rules Studio can't express, called by ./api.ts. Studio created this file and
 * never overwrites it. Publish writes versions and Restore to draft (./actions/restore.ts)
 * copies one into the draft: nothing is added, edited or deleted here, and the list only shows
 * versions of content types the user can read (`content-revisions:read` follows them,
 * src/framework/content/revisions.ts).
 */
export const contentRevisionServerHooks = defineServerHooks<ContentRevisionFormValues, number>({
  select: { title, publisherName },
  async scope() {
    const types = await readableTypes();
    return types.length ? inArray(contentRevision.type, types) : sql`false`;
  },
  beforeUpdate() {
    throw new Error("Versions are written by Publish and can't be edited here.");
  },
});
