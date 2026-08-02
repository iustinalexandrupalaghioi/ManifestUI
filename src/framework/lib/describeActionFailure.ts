import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { extractPgError, mapPgError } from "./mapPgError";
import type { ActionError } from "./actionResult";
import { getCurrentUserId, hasServerPermission } from "@/framework/authorization/rbac";

async function getResourceRow(resourceId: string) {
  const [row] = await db
    .select({
      name: resources.name,
      label: resources.label,
      singularLabel: resources.singular_label,
    })
    .from(resources)
    .where(
      and(eq(resources.name, resourceId), isNull(resources.parent_resource_id)),
    )
    .limit(1);
  return row;
}

async function getResourceByTable(tableName: string) {
  const [row] = await db
    .select({
      name: resources.name,
      label: resources.label,
      singularLabel: resources.singular_label,
    })
    .from(resources)
    .where(eq(resources.table_name, tableName))
    .limit(1);
  return row;
}

async function lookupFkColumn(
  constraintName: string,
  tableName: string,
): Promise<string | undefined> {
  const rows = await db.execute<{ column_name: string }>(sql`
    SELECT column_name FROM information_schema.key_column_usage
    WHERE constraint_name = ${constraintName} AND table_name = ${tableName}
    LIMIT 1
  `);
  return rows[0]?.column_name;
}

// Not every table has an "id" column — e.g. user_roles has a composite
// primary key (user_id, role_id). Look up the real PK column(s) instead of
// assuming "id", matching the "<col>_<col>" convention resource ids use for
// composite keys elsewhere (see user-roles api.ts's parseId/selection.id).
async function lookupPrimaryKeyColumns(tableName: string): Promise<string[]> {
  const rows = await db.execute<{ column_name: string }>(sql`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = ${tableName}
    ORDER BY kcu.ordinal_position
  `);
  return rows.map((r) => r.column_name);
}

const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function lookupReferencingRows(
  tableName: string,
  constraintName: string | undefined,
  parentId: string | number,
) {
  const child = await getResourceByTable(tableName);
  if (!child || !constraintName) return null;

  // Don't leak referencing rows' ids/labels/links to a caller who doesn't
  // have read access on the child resource — the FK-violation itself is
  // already visible (via the generic message this falls back to), but the
  // identity of the specific referencing records is not this caller's to see.
  const userId = await getCurrentUserId();
  const canReadChild = await hasServerPermission(userId, `${child.name}:read`);
  if (!canReadChild) return null;

  const column = await lookupFkColumn(constraintName, tableName);
  if (!column) return null;

  const pkColumns = await lookupPrimaryKeyColumns(tableName);
  if (pkColumns.length === 0) return null;
  const pkIdent = pkColumns.map(quoteIdent).join(", ");

  const rows = await db.execute<Record<string, string | number>>(sql`
    SELECT ${sql.raw(pkIdent)} FROM ${sql.raw(quoteIdent(tableName))}
    WHERE ${sql.raw(quoteIdent(column))} = ${parentId}
    ORDER BY ${sql.raw(pkIdent)} LIMIT 6
  `);

  const label = child.singularLabel ?? child.label ?? child.name;
  const ids = rows.map((r) => pkColumns.map((c) => String(r[c])).join("_"));
  return {
    references: ids.slice(0, 5).map((id) => ({
      id,
      label,
      href: `/${child.name}/${id}`,
    })),
    moreCount: Math.max(0, ids.length - 5),
  };
}

export async function describeActionFailure(
  err: unknown,
  resourceId: string,
  id: string | number | undefined,
  verb: string = "delete",
): Promise<ActionError> {
  const pg = extractPgError(err);
  const resource = await getResourceRow(resourceId);
  const label = resource?.singularLabel ?? resource?.label ?? resourceId;
  const subject = id !== undefined ? `${label} #${id}` : label;

  if (id !== undefined && pg.code === "23503" && pg.table_name) {
    const refs = await lookupReferencingRows(
      pg.table_name,
      pg.constraint_name,
      id,
    );
    if (refs) {
      return {
        message: `Not able to ${verb} ${subject}.`,
        code: pg.code,
        originalMessage: pg.message,
        meta: {
          type: "fk-references",
          references: refs.references,
          moreCount: refs.moreCount,
        },
      };
    }
  }

  const mapped = mapPgError(pg);
  return {
    message: `Not able to ${verb} ${subject}: ${mapped.message}`,
    code: mapped.code,
    originalMessage: mapped.originalMessage,
    details: mapped.details,
    hint: mapped.hint,
    meta: mapped.meta,
  };
}
