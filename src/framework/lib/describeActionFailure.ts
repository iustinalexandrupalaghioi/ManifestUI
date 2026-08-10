import "server-only";
import { sql } from "drizzle-orm";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/db";
import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { resolveLabel } from "./resolveLabel";
import { extractPgError, mapPgError } from "./mapPgError";
import type { ActionError } from "./actionResult";
import {
  getCurrentUserId,
  isAdministrator,
} from "@/framework/authorization/rbac";

function getResourceRow(
  registry: ResourceDescriptor[],
  resourceId: string,
  locale: string,
) {
  const entry = registry.find((r) => r.id === resourceId);
  if (!entry) return undefined;
  return {
    name: entry.id,
    label: resolveLabel(entry.plural, locale),
    singularLabel: resolveLabel(entry.singular, locale),
    mentionLabel: resolveLabel(entry.singularDefinite ?? entry.singular, locale),
    gender: entry.gender,
  };
}

function getResourceByTable(
  registry: ResourceDescriptor[],
  tableName: string,
  locale: string,
) {
  const entry = registry.find((r) => r.table === tableName);
  if (!entry) return undefined;
  return {
    name: entry.id,
    label: resolveLabel(entry.plural, locale),
    singularLabel: resolveLabel(entry.singular, locale),
  };
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
  registry: ResourceDescriptor[],
  tableName: string,
  constraintName: string | undefined,
  parentId: string | number,
  locale: string,
) {
  const child = getResourceByTable(registry, tableName, locale);
  if (!child || !constraintName) return null;

  // Don't leak referencing rows' ids/labels/links to a non-administrator —
  // the FK-violation itself is already visible (via the generic message
  // this falls back to), but the identity of the specific referencing
  // records is not this caller's to see.
  const userId = await getCurrentUserId();
  if (!userId || !(await isAdministrator(userId))) return null;

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
  registry: ResourceDescriptor[],
  err: unknown,
  resourceId: string,
  id: string | number | undefined,
  verb: string = "delete",
): Promise<ActionError> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Errors" });
  const pg = extractPgError(err);
  const resource = getResourceRow(registry, resourceId, locale);
  const label = resource?.mentionLabel ?? resource?.singularLabel ?? resource?.label ?? resourceId;
  const subject = id !== undefined ? `${label} #${id}` : label;
  // Dialog-header summary — deliberately generic (indefinite article, no id)
  // since the specific record is already named in `message` below.
  const title = t("notAbleToGeneric", {
    verb,
    gender: resource?.gender ?? "masculine",
    label: (resource?.singularLabel ?? resourceId).toLowerCase(),
  });

  if (id !== undefined && pg.code === "23503" && pg.table_name) {
    const refs = await lookupReferencingRows(
      registry,
      pg.table_name,
      pg.constraint_name,
      id,
      locale,
    );
    if (refs) {
      return {
        message: t("notAbleTo", { verb, subject }),
        title,
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

  const mapped = mapPgError(pg, locale);
  return {
    message: t("notAbleToWithReason", { verb, subject, reason: mapped.message }),
    title,
    code: mapped.code,
    originalMessage: mapped.originalMessage,
    details: mapped.details,
    hint: mapped.hint,
    meta: mapped.meta,
  };
}
