/**
 * Pure helpers for content rows: grouping locale rows into entries and the
 * singleton guarantee (exactly one row per configured locale). The database
 * side lives in scripts/content-migrate.mjs and the publish actions.
 */

export interface EntryRow {
  id: string | number;
  locale: string;
  entryId: string;
  /** Collections: rows with the same slug are one entry in several locales. */
  slug?: string;
}

/**
 * The `entry_id` each row should have: rows of one entry (same slug for a
 * collection, every row for a singleton) take the id of their oldest row.
 * Returns only the rows that need changing, so applying it twice is a no-op.
 */
export function entryIdFixes(rows: readonly EntryRow[], kind: "collection" | "singleton"): { id: EntryRow["id"]; entryId: string }[] {
  const groups = new Map<string, EntryRow[]>();
  for (const row of rows) {
    const key = kind === "singleton" ? "" : (row.slug ?? `row:${row.id}`);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const fixes: { id: EntryRow["id"]; entryId: string }[] = [];
  for (const group of groups.values()) {
    const oldest = [...group].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0) || String(a.id).localeCompare(String(b.id)))[0];
    for (const row of group) if (row.entryId !== oldest.entryId) fixes.push({ id: row.id, entryId: oldest.entryId });
  }
  return fixes;
}

/**
 * The rows a singleton is missing: one per configured locale (or a single row
 * when it isn't localized), sharing the entry id of the rows it already has.
 */
export function missingSingletonRows(
  existing: readonly Pick<EntryRow, "locale" | "entryId">[],
  locales: readonly string[],
  options: { localized: boolean; newId?: () => string },
): { locale: string; entryId: string }[] {
  const newId = options.newId ?? (() => globalThis.crypto.randomUUID());
  const entryId = existing[0]?.entryId ?? newId();
  if (!options.localized) return existing.length ? [] : [{ locale: locales[0], entryId }];
  const have = new Set(existing.map((row) => row.locale));
  return locales.filter((locale) => !have.has(locale)).map((locale) => ({ locale, entryId }));
}
