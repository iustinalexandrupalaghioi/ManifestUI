#!/usr/bin/env node
/**
 * Seeds the public site's content into the database:
 *
 *   src/db/seed/site-pages/<locale>/<slug>.md     text pages (privacy, cookies, terms)
 *   src/db/seed/site-pages/<locale>/<slug>.json   sections pages (home, learn)
 *   src/db/seed/learn-lessons/<locale>/<slug>.md  lessons (front matter: title,
 *                                                 summary, minutes, position, numbered)
 *   src/db/seed/site-settings/<locale>.json       header and footer (Site settings)
 *   src/db/seed/services/<locale>.json            services (the "services" collection), when the project has them
 *
 *   pnpm db:seed:content                       insert what doesn't exist yet
 *   pnpm db:seed:content --force               also overwrite existing rows (loses CMS edits)
 *   pnpm db:seed:content --force --only learn-lessons/studio,site-pages/en/home
 *                                              overwrite only those rows
 *   pnpm db:seed:content --dry-run …           list what would be written; nothing is
 *                                              written and no database is needed
 *
 * --only takes a comma-separated list of <kind>, <kind>/<slug> (every locale) or
 * <kind>/<locale>/<slug>; site settings are site-settings or site-settings/<locale>.
 * Kinds: site-pages, learn-lessons, services, site-settings.
 *
 * Everything is read, validated and selected before the database is touched:
 * an unknown argument, a selector that matches nothing, or invalid content stops
 * the script with nothing written. Sections pages and site settings are checked
 * against their schemas (the same check as saving in the CMS). Runs with tsx, so
 * it can import the TypeScript section definitions.
 *
 * After seeding, the database is the only source: edit everything in the CMS
 * under Website. These files are only starter content.
 */
import "./lib/allow-server-only.cjs";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { parseSections, validateSections } from "../src/components/site/internal/sections/model.ts";
import { siteSettingsContentSchema } from "../src/components/site/internal/settings/model.ts";

const KINDS = ["site-pages", "learn-lessons", "services", "site-settings"];
const USAGE = `Usage: pnpm db:seed:content [--force] [--only <selectors>] [--dry-run]

  --force            overwrite rows that already exist (loses CMS edits to them)
  --only <list>      comma-separated: <kind>, <kind>/<slug> or <kind>/<locale>/<slug>
                     (site-settings or site-settings/<locale>)
                     kinds: ${KINDS.join(", ")}
  --dry-run          list what would be written, without writing

Example: pnpm db:seed:content --force --only learn-lessons/studio,learn-lessons/quick-start`;

function fail(message) {
  console.error(`${message}\n\n${USAGE}`);
  process.exit(1);
}

// ─────────────────────────────────────────────
// Arguments
// ─────────────────────────────────────────────

function parseArgs(argv) {
  const options = { force: false, dryRun: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force") options.force = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else if (arg === "--only" || arg.startsWith("--only=")) {
      const value = arg === "--only" ? argv[++i] : arg.slice("--only=".length);
      if (!value || value.startsWith("-")) fail("--only needs a list of what to seed.");
      options.only = [...(options.only ?? []), ...value.split(",").map((item) => item.trim()).filter(Boolean)];
    } else fail(`Unknown argument: ${arg}. Nothing was written.`);
  }
  return options;
}

/** "learn-lessons/en/studio.md" → { kind, locale, slug }; unset parts match everything. */
function parseSelector(text) {
  const parts = text.replace(/\.(md|json)$/, "").split("/").filter(Boolean);
  const [kind, ...rest] = parts;
  if (!KINDS.includes(kind)) fail(`Unknown kind in --only: "${text}". Use one of: ${KINDS.join(", ")}.`);
  if (kind === "site-settings") {
    if (rest.length > 1) fail(`Site settings are selected by locale only: "${text}" (e.g. site-settings/en).`);
    return { text, kind, locale: rest[0], slug: undefined };
  }
  if (rest.length > 2) fail(`Too many parts in --only: "${text}". Use <kind>/<slug> or <kind>/<locale>/<slug>.`);
  return rest.length === 2 ? { text, kind, locale: rest[0], slug: rest[1] } : { text, kind, locale: undefined, slug: rest[0] };
}

const options = parseArgs(process.argv.slice(2));
const selectors = options.only?.map(parseSelector) ?? null;
if (options.only && !selectors.length) fail("--only needs a list of what to seed.");

const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!url && !options.dryRun) {
  console.error("DATABASE_URL is not set. Run with: pnpm db:seed:content");
  process.exit(1);
}
const seedDir = path.join(process.cwd(), "src", "db", "seed");

function frontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta = {};
  for (const line of (match?.[1] ?? "").split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: (match ? source.slice(match[0].length) : source).trim() + "\n" };
}

/** Seed files per locale folder; a project without that kind of content (e.g. no lessons) has no folder. */
async function* files(dir, extensions) {
  if (!existsSync(dir)) return;
  for (const locale of await readdir(dir)) {
    for (const file of await readdir(path.join(dir, locale))) {
      const ext = path.extname(file);
      if (!extensions.includes(ext)) continue;
      yield { locale, slug: path.basename(file, ext), ext, source: await readFile(path.join(dir, locale, file), "utf8") };
    }
  }
}

// ─────────────────────────────────────────────
// Read and validate everything, before touching the database
// ─────────────────────────────────────────────

const invalid = [];
const items = [];

for await (const { locale, slug, ext, source } of files(path.join(seedDir, "site-pages"), [".md", ".json"])) {
  const file = `src/db/seed/site-pages/${locale}/${slug}${ext}`;
  let page;
  if (ext === ".json") {
    let json;
    try {
      json = JSON.parse(source);
    } catch (error) {
      invalid.push(`  ${file}: ${error.message}`);
      continue;
    }
    for (const issue of validateSections(json.sections ?? [])) invalid.push(`  ${file}: sections.${issue.path.join(".")}: ${issue.message}`);
    page = { kind: "sections", title: json.title ?? "", description: json.description ?? "", body: "", sections: parseSections(json.sections ?? []) };
  } else {
    const { meta, body } = frontMatter(source);
    page = { kind: "text", title: meta.title ?? "", description: meta.description ?? "", body, sections: [] };
  }
  items.push({ kind: "site-pages", locale, slug, label: `/${locale}/${slug}`, page });
}

for await (const { locale, slug, source } of files(path.join(seedDir, "learn-lessons"), [".md"])) {
  const { meta, body } = frontMatter(source);
  const lesson = {
    title: meta.title ?? slug,
    summary: meta.summary ?? "",
    minutes: Number(meta.minutes ?? 10),
    position: Number(meta.position ?? 0),
    numbered: meta.numbered !== "false",
    body,
  };
  items.push({ kind: "learn-lessons", locale, slug, label: `/${locale}/learn/${slug}`, lesson });
}

// Collections with starter items (e.g. services): one JSON array per locale.
const servicesDir = path.join(seedDir, "services");
for (const file of existsSync(servicesDir) ? await readdir(servicesDir) : []) {
  if (path.extname(file) !== ".json") continue;
  const locale = path.basename(file, ".json");
  let list;
  try {
    list = JSON.parse(await readFile(path.join(servicesDir, file), "utf8"));
  } catch (error) {
    invalid.push(`  src/db/seed/services/${file}: ${error.message}`);
    continue;
  }
  for (const service of list) items.push({ kind: "services", locale, slug: service.slug, label: `service ${service.slug} (${locale})`, service });
}

const settingsDir = path.join(seedDir, "site-settings");
for (const file of existsSync(settingsDir) ? await readdir(settingsDir) : []) {
  if (path.extname(file) !== ".json") continue;
  const name = `src/db/seed/site-settings/${file}`;
  const locale = path.basename(file, ".json");
  let parsed;
  try {
    parsed = siteSettingsContentSchema.safeParse(JSON.parse(await readFile(path.join(settingsDir, file), "utf8")));
  } catch (error) {
    invalid.push(`  ${name}: ${error.message}`);
    continue;
  }
  if (parsed.success) items.push({ kind: "site-settings", locale, slug: undefined, label: `site settings (${locale})`, content: parsed.data });
  else for (const issue of parsed.error.issues) invalid.push(`  ${name}: ${issue.path.join(".")}: ${issue.message}`);
}

if (invalid.length) {
  console.error(`Invalid seed content, nothing written:\n${invalid.join("\n")}`);
  process.exit(1);
}

// ─────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────

const matches = (selector, item) =>
  selector.kind === item.kind &&
  (selector.locale === undefined || selector.locale === item.locale) &&
  (selector.slug === undefined || selector.slug === item.slug);

const selected = selectors ? items.filter((item) => selectors.some((selector) => matches(selector, item))) : items;
if (selectors) {
  const unmatched = selectors.filter((selector) => !items.some((item) => matches(selector, item)));
  if (unmatched.length) {
    console.error(`Nothing in src/db/seed matches: ${unmatched.map((selector) => selector.text).join(", ")}. Nothing was written.`);
    process.exit(1);
  }
}

const SECTIONS = { "site-pages": "Site pages", "learn-lessons": "Lessons", services: "Services", "site-settings": "Site settings" };

if (options.dryRun) {
  const action = options.force ? "would write" : "would add if missing";
  for (const kind of KINDS) {
    const group = selected.filter((item) => item.kind === kind);
    if (!group.length) continue;
    console.log(SECTIONS[kind]);
    for (const item of group) console.log(`  ${action}  ${item.label}`);
  }
  console.log(`Dry run: ${selected.length} ${selected.length === 1 ? "row" : "rows"} selected, nothing written.`);
  process.exit(0);
}

// ─────────────────────────────────────────────
// Write
// ─────────────────────────────────────────────

const force = options.force;
const sql = postgres(url, { prepare: false });
let written = 0;
let kept = 0;
const report = (rows, label) => {
  if (rows.length) {
    written++;
    console.log(`  ${force ? "wrote" : "added"}  ${label}`);
  } else {
    kept++;
    console.log(`  kept   ${label} (already in the database)`);
  }
};

async function writePage({ locale, slug, page }) {
  const values = sql`(${slug}, ${locale}, ${page.title}, ${page.description}, ${page.kind}, ${page.body}, ${sql.json(page.sections)}, true)`;
  return force
    ? sql`
        insert into site_page (slug, locale, title, description, kind, body, sections, published) values ${values}
        on conflict (slug, locale) do update
          set title = excluded.title, description = excluded.description, kind = excluded.kind,
              body = excluded.body, sections = excluded.sections, updated_at = now()
        returning id`
    : sql`
        insert into site_page (slug, locale, title, description, kind, body, sections, published) values ${values}
        on conflict (slug, locale) do nothing returning id`;
}

async function writeLesson({ locale, slug, lesson }) {
  const values = sql`(${slug}, ${locale}, ${lesson.position}, ${lesson.numbered}, ${lesson.title}, ${lesson.summary}, ${lesson.minutes}, ${lesson.body}, true)`;
  return force
    ? sql`
        insert into learn_lesson (slug, locale, position, numbered, title, summary, minutes, body, published) values ${values}
        on conflict (slug, locale) do update
          set position = excluded.position, numbered = excluded.numbered, title = excluded.title,
              summary = excluded.summary, minutes = excluded.minutes, body = excluded.body, updated_at = now()
        returning id`
    : sql`
        insert into learn_lesson (slug, locale, position, numbered, title, summary, minutes, body, published) values ${values}
        on conflict (slug, locale) do nothing returning id`;
}

async function writeService({ locale, service }) {
  const values = sql`(${service.slug}, ${locale}, ${service.title}, ${service.summary ?? ""}, ${service.body ?? ""}, ${Number(service.position ?? 0)}, ${service.published !== false})`;
  return force
    ? sql`
        insert into service (slug, locale, title, summary, body, position, published) values ${values}
        on conflict (slug, locale) do update
          set title = excluded.title, summary = excluded.summary, body = excluded.body,
              position = excluded.position, published = excluded.published, updated_at = now()
        returning id`
    : sql`
        insert into service (slug, locale, title, summary, body, position, published) values ${values}
        on conflict (slug, locale) do nothing returning id`;
}

async function writeSettings({ locale, content }) {
  return force
    ? sql`
        insert into site_settings (locale, content) values (${locale}, ${sql.json(content)})
        on conflict (locale) do update set content = excluded.content, updated_at = now()
        returning id`
    : sql`
        insert into site_settings (locale, content) values (${locale}, ${sql.json(content)})
        on conflict (locale) do nothing returning id`;
}

const WRITERS = { "site-pages": writePage, "learn-lessons": writeLesson, services: writeService, "site-settings": writeSettings };

try {
  for (const kind of KINDS) {
    const group = selected.filter((item) => item.kind === kind);
    if (!group.length) continue;
    console.log(SECTIONS[kind]);
    for (const item of group) report(await WRITERS[kind](item), item.label);
  }
  console.log(`Done: ${written} written, ${kept} kept.`);
  if (written) {
    // The site's cached reads are only refreshed by CMS saves; a seed writes around them.
    console.log("The public site shows these changes within an hour. To see one sooner, save that page, lesson or site settings in the CMS.");
  }
} finally {
  await sql.end();
}
