#!/usr/bin/env node
/**
 * Brings existing rows of every content type (resources with `content` on
 * their descriptor) in line with the content model:
 *
 *   - entry_id: rows of one entry share it (same slug for a collection, every
 *     row for a singleton); the oldest row's id wins.
 *   - published_at: set from updated_at for rows that are live today
 *     (`published = true`, or every row when the table has no `published`).
 *   - singletons: the rows missing for a configured locale are created from
 *     the content type's `defaults` (src/content), or reported when it has none.
 *
 *   pnpm content:migrate             show what would change; nothing is written
 *   pnpm content:migrate --apply     write it, in one transaction
 *
 * Idempotent (a second run changes nothing) and never deletes or overwrites
 * content. Run `pnpm db:push` first so the columns exist.
 */
import "./lib/allow-server-only.cjs";
import postgres from "postgres";
import { resourceDescriptors } from "../src/app/[locale]/cms/resourceDescriptors.ts";
import { routing } from "../src/i18n/routing.ts";
import { entryIdFixes, missingSingletonRows } from "../src/framework/content/rows.ts";
import { getContentType } from "../src/framework/content/define.ts";
import "../src/content/index.ts";

const args = process.argv.slice(2);
const unknown = args.filter((arg) => arg !== "--apply");
if (unknown.length) {
  console.error(`Unknown argument: ${unknown.join(" ")}\nUsage: pnpm content:migrate [--apply]`);
  process.exit(1);
}
const apply = args.includes("--apply");
const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run with: pnpm content:migrate");
  process.exit(1);
}

const snake = (name) => name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
// One connection: every query below runs on the transaction (`tx`), never on `sql`, or it would wait forever.
const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });
const locales = routing.locales;
let changes = 0;

async function columnsOf(tx, table) {
  const rows = await tx`select column_name from information_schema.columns where table_schema = 'public' and table_name = ${table}`;
  return new Set(rows.map((row) => row.column_name));
}

async function migrate(tx, descriptor) {
  const options = descriptor.content;
  const table = descriptor.table;
  const columns = await columnsOf(tx, table);
  const missing = ["entry_id", "published_at", "published_by", ...(options.localized ? ["locale"] : [])].filter((column) => !columns.has(column));
  if (missing.length) throw new Error(`${table} has no ${missing.join(", ")} column yet: run pnpm db:push first.`);
  const slug = options.slugField ? snake(options.slugField) : null;

  const rows = await tx`
    select id, ${options.localized ? tx`locale` : tx`null::text as locale`}, entry_id,
      ${slug ? tx`${tx(slug)}::text as slug` : tx`null::text as slug`}
    from ${tx(table)} order by id`;
  console.log(`${options.type} (${table}, ${rows.length} ${rows.length === 1 ? "row" : "rows"})`);

  // entry_id
  const fixes = entryIdFixes(
    rows.map((row) => ({ id: row.id, locale: row.locale, entryId: row.entry_id, slug: row.slug ?? undefined })),
    options.kind,
  );
  for (const fix of fixes) {
    console.log(`  entry_id  row ${fix.id} → ${fix.entryId}`);
    if (apply) await tx`update ${tx(table)} set entry_id = ${fix.entryId} where id = ${fix.id}`;
  }
  changes += fixes.length;

  // published_at
  const live = columns.has("published") ? tx`published` : tx`true`;
  const [{ count }] = await tx`select count(*)::int as count from ${tx(table)} where ${live} and published_at is null`;
  if (count) {
    console.log(`  published_at  ${count} live ${count === 1 ? "row" : "rows"} ← updated_at`);
    if (apply) await tx`update ${tx(table)} set published_at = updated_at where ${live} and published_at is null`;
    changes += count;
  }

  // Singleton rows
  if (options.kind === "singleton") {
    const existing = rows.map((row) => ({ locale: row.locale ?? locales[0], entryId: fixes.find((fix) => fix.id === row.id)?.entryId ?? row.entry_id }));
    const toCreate = missingSingletonRows(existing, locales, { localized: options.localized });
    const def = getContentType(options.type);
    for (const row of toCreate) {
      const data = def?.defaults?.[row.locale] ?? def?.defaults?.en;
      if (!def || !data) {
        console.log(`  missing   ${row.locale} row: define \`defaults\` on the "${options.type}" content type (src/content) to create it`);
        continue;
      }
      const parsed = def.fields.parse(data);
      const values = def.jsonColumn ? { [snake(def.jsonColumn)]: tx.json(parsed) } : Object.fromEntries(Object.entries(parsed).map(([key, value]) => [snake(key), value]));
      console.log(`  create    ${row.locale} row from defaults (not published)`);
      if (apply) await tx`insert into ${tx(table)} ${tx({ ...values, entry_id: row.entryId, ...(options.localized ? { locale: row.locale } : {}) })}`;
      changes++;
    }
  }
  if (!fixes.length && !count && options.kind !== "singleton") console.log(rows.length ? "  up to date" : "  empty: nothing to migrate");
}

try {
  const contentTypes = resourceDescriptors.filter((descriptor) => descriptor.content);
  console.log(`${apply ? "Migrating" : "Checking (dry run)"} ${contentTypes.length} content types…`);
  await sql.begin(async (tx) => {
    for (const descriptor of contentTypes) await migrate(tx, descriptor);
    if (!apply) throw Object.assign(new Error("dry run"), { dryRun: true });
  });
  console.log(changes ? `Done: ${changes} ${changes === 1 ? "change" : "changes"} written.` : "Nothing to change.");
} catch (error) {
  if (error?.dryRun) console.log(changes ? `Dry run: ${changes} ${changes === 1 ? "change" : "changes"}; run with --apply to write them.` : "Nothing to change.");
  else {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
