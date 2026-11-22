#!/usr/bin/env node
/**
 * Retires the old `published` boolean on content tables: `published_at`
 * (set by Publish) is what the site, the API and the read policies use now.
 *
 * For each content table that still has the column, in one transaction:
 *   1. reports rows where the two disagree (published_at wins: it's what the site reads);
 *   2. points its public read policy at `published_at is not null`;
 *   3. drops the column.
 *
 *   pnpm content:drop-published               show what would change; nothing is written
 *   pnpm content:drop-published --apply       do it
 *   pnpm content:drop-published --revert      put the column back (filled from published_at) and the policy on it
 *   pnpm content:drop-published --revert --apply
 *
 * Run it BEFORE `pnpm db:push`: the schema files no longer have the column, so a
 * push tries to drop it, and Postgres refuses while the policy still reads it.
 * A table without published_at yet gets it here, filled from the boolean.
 */
import postgres from "postgres";

const TABLES = [
  { table: "site_page", policy: "Published site pages are readable by everyone" },
  { table: "service", policy: "Published services are readable by everyone" },
];

const args = process.argv.slice(2);
const unknown = args.filter((arg) => arg !== "--apply" && arg !== "--revert");
if (unknown.length) {
  console.error(`Unknown argument: ${unknown.join(" ")}\nUsage: pnpm content:drop-published [--revert] [--apply]`);
  process.exit(1);
}
const apply = args.includes("--apply");
const revert = args.includes("--revert");
const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run with: pnpm content:drop-published");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });
const ident = (name) => `"${name.replace(/"/g, '""')}"`;
let changes = 0;

async function hasColumn(tx, table, column) {
  const [row] = await tx`select 1 from information_schema.columns where table_schema = 'public' and table_name = ${table} and column_name = ${column}`;
  return !!row;
}

async function policyExists(tx, table, policy) {
  const [row] = await tx`select 1 from pg_policies where schemaname = 'public' and tablename = ${table} and policyname = ${policy}`;
  return !!row;
}

async function drop(tx, { table, policy }) {
  console.log(`\n${table}`);
  if (!(await hasColumn(tx, table, "published"))) return console.log("  no published column: nothing to do");
  // A database from before content types: give it published_at first, from the boolean (pnpm content:migrate does the rest).
  if (!(await hasColumn(tx, table, "published_at"))) {
    console.log("  add       column published_at (from published)");
    await tx.unsafe(`alter table public.${ident(table)} add column published_at timestamptz`);
    await tx.unsafe(`update public.${ident(table)} set published_at = updated_at where published`);
    changes++;
  }
  const [{ disagree }] = await tx.unsafe(
    `select count(*)::int as disagree from public.${ident(table)} where published is distinct from (published_at is not null)`,
  );
  if (disagree) console.log(`  note      ${disagree} row(s) where published and published_at disagree; published_at wins (the site already reads it)`);
  if (await policyExists(tx, table, policy)) {
    console.log(`  policy    "${policy}" → using (published_at is not null)`);
    await tx.unsafe(`alter policy ${ident(policy)} on public.${ident(table)} using (published_at is not null)`);
    changes++;
  }
  console.log("  drop      column published");
  await tx.unsafe(`alter table public.${ident(table)} drop column published`);
  changes++;
}

async function restore(tx, { table, policy }) {
  console.log(`\n${table}`);
  if (await hasColumn(tx, table, "published")) return console.log("  published column is there: nothing to do");
  console.log("  add       column published (from published_at)");
  await tx.unsafe(`alter table public.${ident(table)} add column published boolean not null default false`);
  await tx.unsafe(`update public.${ident(table)} set published = (published_at is not null)`);
  changes++;
  if (await policyExists(tx, table, policy)) {
    console.log(`  policy    "${policy}" → using (published)`);
    await tx.unsafe(`alter policy ${ident(policy)} on public.${ident(table)} using (published)`);
    changes++;
  }
}

try {
  console.log(`${apply ? (revert ? "Restoring" : "Dropping") : `Checking (dry run, ${revert ? "revert" : "drop"})`} the published column…`);
  await sql.begin(async (tx) => {
    for (const target of TABLES) await (revert ? restore(tx, target) : drop(tx, target));
    if (!apply) throw Object.assign(new Error("dry run"), { dryRun: true });
  });
  console.log(changes ? `\nDone: ${changes} ${changes === 1 ? "change" : "changes"} written.` : "\nNothing to change.");
} catch (error) {
  if (error?.dryRun) console.log(changes ? `\nDry run: ${changes} ${changes === 1 ? "change" : "changes"}; run with --apply to write them.` : "\nNothing to change.");
  else {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
