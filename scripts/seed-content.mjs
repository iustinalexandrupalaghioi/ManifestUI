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
 *   pnpm db:seed:content            insert what doesn't exist yet
 *   pnpm db:seed:content --force    also overwrite existing rows (loses CMS edits)
 *
 * Sections pages and site settings are validated against their schemas first
 * (the same check as saving in the CMS); nothing is written if any is invalid.
 * Runs with tsx, so it can import the TypeScript section definitions.
 *
 * After seeding, the database is the only source: edit everything in the CMS
 * under Website. These files are only starter content.
 */
import "./lib/allow-server-only.cjs";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { parseSections, validateSections } from "../src/components/site/sections/model.ts";
import { siteSettingsContentSchema } from "../src/components/site/settings/model.ts";

const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Run with: pnpm db:seed:content");
  process.exit(1);
}
const force = process.argv.includes("--force");
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

// Validate every sections page before touching the database.
const invalid = [];
for await (const { locale, slug, source } of files(path.join(seedDir, "site-pages"), [".json"])) {
  const file = `src/db/seed/site-pages/${locale}/${slug}.json`;
  let json;
  try {
    json = JSON.parse(source);
  } catch (error) {
    invalid.push(`  ${file}: ${error.message}`);
    continue;
  }
  for (const issue of validateSections(json.sections ?? []))
    invalid.push(`  ${file}: sections.${issue.path.join(".")}: ${issue.message}`);
}
const settings = [];
for (const file of existsSync(path.join(seedDir, "site-settings")) ? await readdir(path.join(seedDir, "site-settings")) : []) {
  if (path.extname(file) !== ".json") continue;
  const name = `src/db/seed/site-settings/${file}`;
  let parsed;
  try {
    parsed = siteSettingsContentSchema.safeParse(JSON.parse(await readFile(path.join(seedDir, "site-settings", file), "utf8")));
  } catch (error) {
    invalid.push(`  ${name}: ${error.message}`);
    continue;
  }
  if (parsed.success) settings.push({ locale: path.basename(file, ".json"), content: parsed.data });
  else for (const issue of parsed.error.issues) invalid.push(`  ${name}: ${issue.path.join(".")}: ${issue.message}`);
}
if (invalid.length) {
  console.error(`Invalid seed content, nothing written:\n${invalid.join("\n")}`);
  process.exit(1);
}

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

try {
  console.log("Site pages");
  for await (const { locale, slug, ext, source } of files(path.join(seedDir, "site-pages"), [".md", ".json"])) {
    let page;
    if (ext === ".json") {
      const json = JSON.parse(source);
      page = { kind: "sections", title: json.title ?? "", description: json.description ?? "", body: "", sections: parseSections(json.sections ?? []) };
    } else {
      const { meta, body } = frontMatter(source);
      page = { kind: "text", title: meta.title ?? "", description: meta.description ?? "", body, sections: [] };
    }
    const values = sql`(${slug}, ${locale}, ${page.title}, ${page.description}, ${page.kind}, ${page.body}, ${sql.json(page.sections)}, true)`;
    const rows = force
      ? await sql`
          insert into site_page (slug, locale, title, description, kind, body, sections, published) values ${values}
          on conflict (slug, locale) do update
            set title = excluded.title, description = excluded.description, kind = excluded.kind,
                body = excluded.body, sections = excluded.sections, updated_at = now()
          returning id`
      : await sql`
          insert into site_page (slug, locale, title, description, kind, body, sections, published) values ${values}
          on conflict (slug, locale) do nothing returning id`;
    report(rows, `/${locale}/${slug}`);
  }

  console.log("Lessons");
  for await (const { locale, slug, source } of files(path.join(seedDir, "learn-lessons"), [".md"])) {
    const { meta, body } = frontMatter(source);
    const lesson = {
      title: meta.title ?? slug,
      summary: meta.summary ?? "",
      minutes: Number(meta.minutes ?? 10),
      position: Number(meta.position ?? 0),
      numbered: meta.numbered !== "false",
    };
    const values = sql`(${slug}, ${locale}, ${lesson.position}, ${lesson.numbered}, ${lesson.title}, ${lesson.summary}, ${lesson.minutes}, ${body}, true)`;
    const rows = force
      ? await sql`
          insert into learn_lesson (slug, locale, position, numbered, title, summary, minutes, body, published) values ${values}
          on conflict (slug, locale) do update
            set position = excluded.position, numbered = excluded.numbered, title = excluded.title,
                summary = excluded.summary, minutes = excluded.minutes, body = excluded.body, updated_at = now()
          returning id`
      : await sql`
          insert into learn_lesson (slug, locale, position, numbered, title, summary, minutes, body, published) values ${values}
          on conflict (slug, locale) do nothing returning id`;
    report(rows, `/${locale}/learn/${slug}`);
  }

  // Collections with starter items (e.g. services): one JSON array per locale.
  const servicesDir = path.join(seedDir, "services");
  if (existsSync(servicesDir)) {
    console.log("Services");
    for (const file of await readdir(servicesDir)) {
      if (path.extname(file) !== ".json") continue;
      const locale = path.basename(file, ".json");
      for (const item of JSON.parse(await readFile(path.join(servicesDir, file), "utf8"))) {
        const values = sql`(${item.slug}, ${locale}, ${item.title}, ${item.summary ?? ""}, ${item.body ?? ""}, ${Number(item.position ?? 0)}, ${item.published !== false})`;
        const rows = force
          ? await sql`
              insert into service (slug, locale, title, summary, body, position, published) values ${values}
              on conflict (slug, locale) do update
                set title = excluded.title, summary = excluded.summary, body = excluded.body,
                    position = excluded.position, published = excluded.published, updated_at = now()
              returning id`
          : await sql`
              insert into service (slug, locale, title, summary, body, position, published) values ${values}
              on conflict (slug, locale) do nothing returning id`;
        report(rows, `service ${item.slug} (${locale})`);
      }
    }
  }

  console.log("Site settings");
  for (const { locale, content } of settings) {
    const rows = force
      ? await sql`
          insert into site_settings (locale, content) values (${locale}, ${sql.json(content)})
          on conflict (locale) do update set content = excluded.content, updated_at = now()
          returning id`
      : await sql`
          insert into site_settings (locale, content) values (${locale}, ${sql.json(content)})
          on conflict (locale) do nothing returning id`;
    report(rows, `site settings (${locale})`);
  }

  console.log(`Done: ${written} written, ${kept} kept.`);
} finally {
  await sql.end();
}
