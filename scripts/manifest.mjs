#!/usr/bin/env node
/**
 * ManifestUI setup CLI — run after cloning:
 *
 *   pnpm manifest setup            guided setup: env → db → auth-sync → admin → doctor
 *   pnpm manifest env              create or complete .env
 *   pnpm manifest db               push the Drizzle schema to the database
 *   pnpm manifest auth-sync        install the auth.users → public."user" sync trigger
 *   pnpm manifest admin [email]    make a user administrator (creates the user if needed)
 *   pnpm manifest doctor           check that everything is in place
 *
 * Website builder:
 *   pnpm manifest site             tables, seed content (src/db/seed), registered blocks
 *   pnpm manifest block <name>     create a block (e.g. `testimonials`): its fields and its renderer
 *
 * Every command is safe to run again. No dependencies beyond the project's own.
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_FILE = resolve(ROOT, ".env");
const SYNC_SQL = resolve(ROOT, "src/db/sql/auth-user-sync.sql");
const TRIGGER = "manifestui_sync_auth_user";
const BLOCKS_DIR = resolve(ROOT, "src/content/blocks");
const BLOCKS_INDEX = resolve(BLOCKS_DIR, "index.ts");
const RENDERERS_DIR = resolve(ROOT, "src/components/site/blocks");
const RENDERERS_INDEX = resolve(RENDERERS_DIR, "index.ts");
// The learning path's lessons table only exists in projects that have it.
const SITE_TABLES = [
  "site_page",
  "site_settings",
  ...(existsSync(resolve(ROOT, "src/db/schema/learn-lesson.ts")) ? ["learn_lesson"] : []),
  ...(existsSync(resolve(ROOT, "src/db/schema/service.ts")) ? ["service"] : []),
];

// ── Output ──────────────────────────────────────────────────────────────────

const color = (code) => (text) => (stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = color("1");
const dim = color("2");
const green = color("32");
const yellow = color("33");
const red = color("31");
const ok = (msg) => console.log(`${green("✓")} ${msg}`);
const warn = (msg) => console.log(`${yellow("!")} ${msg}`);
const fail = (msg) => console.log(`${red("✗")} ${msg}`);
const heading = (msg) => console.log(`\n${bold(msg)}`);

class CliError extends Error {}

// ── .env ────────────────────────────────────────────────────────────────────

/** Parses KEY=value lines; keeps comments and order so rewriting is lossless. */
function readEnvFile() {
  if (!existsSync(ENV_FILE)) return { lines: [], values: {} };
  const lines = readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  const values = {};
  for (const line of lines) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return { lines, values };
}

function writeEnvFile(updates) {
  const { lines } = readEnvFile();
  const pending = { ...updates };
  const out = lines.map((line) => {
    const key = line.match(/^\s*([A-Z0-9_]+)\s*=/)?.[1];
    if (key && key in pending) {
      const value = pending[key];
      delete pending[key];
      return `${key}=${value}`;
    }
    return line;
  });
  while (out.length && out[out.length - 1] === "") out.pop();
  for (const [key, value] of Object.entries(pending)) out.push(`${key}=${value}`);
  writeFileSync(ENV_FILE, `${out.join("\n")}\n`);
}

/** process.env wins over .env, like Next.js. */
function loadEnv() {
  return { ...readEnvFile().values, ...process.env };
}

function requireEnv(env, keys) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length) throw new CliError(`Missing ${missing.join(", ")}. Run \`pnpm manifest env\` first.`);
}

// ── Prompts ─────────────────────────────────────────────────────────────────

let rl;
async function ask(question, fallback = "") {
  if (!stdin.isTTY) return fallback;
  rl ??= createInterface({ input: stdin, output: stdout });
  const answer = (await rl.question(`${question}${fallback ? dim(` (${fallback})`) : ""}: `)).trim();
  return answer || fallback;
}

async function confirm(question, fallback = true) {
  const answer = (await ask(`${question} ${dim(fallback ? "[Y/n]" : "[y/N]")}`)).toLowerCase();
  return answer ? answer.startsWith("y") : fallback;
}

// ── Database ────────────────────────────────────────────────────────────────

/** DDL and admin queries use the direct (session) connection. */
function connect(env, url = env.DIRECT_DATABASE_URL) {
  return postgres(url, { prepare: false, max: 1, onnotice: () => {}, connect_timeout: 15 });
}

async function withDb(env, fn) {
  const sql = connect(env);
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

// ── Commands ────────────────────────────────────────────────────────────────

const ENV_FIELDS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase project URL", hint: "Project Settings → API" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase anon (public) key", hint: "Project Settings → API" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role key", hint: "Project Settings → API, server only" },
  {
    key: "DATABASE_URL",
    label: "Pooled connection string (Transaction pooler, port 6543)",
    hint: "Project Settings → Database → Connection string; used by the app",
  },
  {
    key: "DIRECT_DATABASE_URL",
    label: "Direct connection string (port 5432)",
    hint: "Same page, direct/session connection; used by drizzle-kit and this CLI",
  },
];

/** Display settings (NEXT_PUBLIC_APP_TIMEZONE etc.) are left unset so the code's own defaults apply. */
const ENV_DEFAULTS = {
  NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
};

async function envCommand() {
  heading("Environment (.env)");
  const current = readEnvFile().values;
  const updates = {};
  const missing = [];
  for (const field of ENV_FIELDS) {
    if (current[field.key]) {
      ok(`${field.key} is set`);
      continue;
    }
    console.log(dim(`  ${field.hint}`));
    const value = await ask(field.label);
    if (value) updates[field.key] = value;
    else missing.push(field.key);
  }
  for (const [key, value] of Object.entries(ENV_DEFAULTS)) {
    if (!current[key]) updates[key] = value;
  }
  if (!current.AUTH_WEBHOOK_SECRET) updates.AUTH_WEBHOOK_SECRET = randomBytes(24).toString("hex");
  if (Object.keys(updates).length) {
    writeEnvFile(updates);
    ok(`Wrote ${Object.keys(updates).join(", ")} to .env`);
  }
  if (missing.length) {
    throw new CliError(`Still missing: ${missing.join(", ")}. Run \`pnpm manifest env\` again to fill them in.`);
  }
  if (!Object.keys(updates).length) ok(".env is complete");
}

// drizzle-kit push creates row-level security policies without their USING
// condition, and a SELECT policy without one lets no rows through Supabase's
// public API. These are the website builder's read policies (published rows
// only); after a push their conditions are restored from the schema files.
// Other policies are left as they are: restoring them could widen access.
const WEBSITE_POLICY_TABLES = new Set(["site_page", "site_settings", "learn_lesson", "service"]);

/** The website builder's SELECT policies with their USING condition, read from src/db/schema/*.ts. */
function websitePolicies() {
  const dir = resolve(ROOT, "src/db/schema");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith(".ts"))
    .flatMap((file) => {
      const source = readFileSync(resolve(dir, file), "utf8");
      const table = source.match(/pgTable\(\s*"([^"]+)"/)?.[1];
      if (!table || !WEBSITE_POLICY_TABLES.has(table)) return [];
      return [...source.matchAll(/pgPolicy\(\s*"([^"]+)",\s*\{([\s\S]*?)\}\s*\)/g)].flatMap(([, name, body]) => {
        const using = body.match(/using:\s*sql`([^`]+)`/)?.[1];
        return /for:\s*"select"/.test(body) && using && !using.includes("${") ? [{ table, name, using }] : [];
      });
    });
}

const quoteIdent = (name) => `"${name.replace(/"/g, '""')}"`;

/** Restores missing USING conditions on the website builder's read policies; returns how many it fixed. */
async function repairWebsitePolicies(sql) {
  let fixed = 0;
  for (const policy of websitePolicies()) {
    const [row] = await sql`
      select qual from pg_policies
      where schemaname = 'public' and tablename = ${policy.table} and policyname = ${policy.name}`;
    if (!row || row.qual !== null) continue;
    await sql.unsafe(`alter policy ${quoteIdent(policy.name)} on public.${quoteIdent(policy.table)} using (${policy.using})`);
    fixed += 1;
  }
  return fixed;
}

async function dbCommand() {
  heading("Database schema");
  const env = loadEnv();
  requireEnv(env, ["DIRECT_DATABASE_URL"]);
  console.log(dim("  Running pnpm db:push (drizzle-kit push)…"));
  const result = spawnSync("pnpm", ["db:push"], { stdio: "inherit", shell: true, env });
  if (result.status !== 0) throw new CliError("pnpm db:push failed. Fix the error above and run `pnpm manifest db` again.");
  ok("Schema pushed");
  const fixed = await withDb(env, repairWebsitePolicies);
  if (fixed) ok(`Restored the condition of ${fixed} website read polic${fixed === 1 ? "y" : "ies"} (drizzle-kit push drops them)`);
}

async function authSyncCommand() {
  heading("Auth user sync");
  const env = loadEnv();
  requireEnv(env, ["DIRECT_DATABASE_URL"]);
  const script = readFileSync(SYNC_SQL, "utf8");
  await withDb(env, async (sql) => {
    const [{ exists }] = await sql`select to_regclass('public."user"') is not null as exists`;
    if (!exists) throw new CliError('Table public."user" not found. Run `pnpm manifest db` first.');
    await sql.unsafe(script);
    const [{ count }] = await sql`select count(*)::int as count from public."user"`;
    ok(`Trigger ${TRIGGER} installed on auth.users; ${count} user(s) synced`);
  });
}

async function adminCommand(emailArg) {
  heading("Administrator");
  const env = loadEnv();
  requireEnv(env, ["DIRECT_DATABASE_URL"]);
  const email = (emailArg || (await ask("Administrator email"))).trim().toLowerCase();
  if (!email) {
    warn("No email given; skipped. Run `pnpm manifest admin you@example.com` later.");
    return;
  }

  await withDb(env, async (sql) => {
    let [authUser] = await sql`select id, email from auth.users where lower(email) = ${email}`;
    if (!authUser) {
      requireEnv(env, ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
      if (!(await confirm(`No account for ${email} yet. Create it now?`))) {
        warn("Skipped. Sign up in the app, then run this command again.");
        return;
      }
      const password = randomBytes(12).toString("base64url");
      const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw new CliError(`Could not create ${email}: ${error.message}`);
      authUser = { id: data.user.id, email };
      ok(`Created ${email}`);
      console.log(`  Temporary password: ${bold(password)} ${dim("(shown once; change it after signing in)")}`);
    }
    // Upsert so this also works if the sync trigger isn't installed yet.
    await sql`
      insert into public."user" (id, email, administrator, updated_at)
      values (${authUser.id}, ${authUser.email}, true, now())
      on conflict (id) do update set administrator = true, updated_at = now()`;
    ok(`${email} is an administrator`);
  });
}

async function doctorCommand() {
  heading("Doctor");
  const env = loadEnv();
  let problems = 0;
  const check = (passed, good, bad) => {
    if (passed) ok(good);
    else {
      fail(bad);
      problems += 1;
    }
  };

  const required = [...ENV_FIELDS.map((field) => field.key), "NEXT_PUBLIC_BASE_URL"];
  for (const key of required) check(!!env[key], `${key} is set`, `${key} is missing (pnpm manifest env)`);
  // Only the ManifestUI Studio app needs a GitHub App.
  if (existsSync(resolve(ROOT, "src/components/studio")) && !env.GITHUB_APP_SLUG) {
    warn("GITHUB_APP_SLUG is not set (needed for the studio's GitHub sign-in)");
  }

  for (const key of ["DATABASE_URL", "DIRECT_DATABASE_URL"]) {
    if (!env[key]) continue;
    const sql = connect(env, env[key]);
    try {
      await sql`select 1`;
      ok(`${key} connects`);
    } catch (error) {
      fail(`${key} does not connect: ${error.message}`);
      problems += 1;
    } finally {
      await sql.end({ timeout: 5 });
    }
  }

  if (env.DIRECT_DATABASE_URL) {
    try {
      await withDb(env, async (sql) => {
        const tables = ["user", "group", "group_permission", "user_group"];
        const rows = await sql`
          select t.name, to_regclass('public.' || quote_ident(t.name)) is not null as exists
          from unnest(${tables}::text[]) as t(name)`;
        const missing = rows.filter((row) => !row.exists).map((row) => row.name);
        check(!missing.length, "App tables exist", `Missing tables: ${missing.join(", ")} (pnpm manifest db)`);

        const [{ installed }] = await sql`
          select exists (select 1 from pg_trigger where tgname = ${TRIGGER} and not tgisinternal) as installed`;
        check(installed, "Auth user sync trigger is installed", "Auth user sync trigger is missing (pnpm manifest auth-sync)");

        if (!missing.includes("user")) {
          const [{ count }] = await sql`select count(*)::int as count from public."user" where administrator`;
          check(count > 0, `${count} administrator(s)`, "No administrator yet (pnpm manifest admin you@example.com)");
        }

        // The website builder; `check` counts the problems.
        if (existsSync(BLOCKS_INDEX)) await siteDatabaseChecks(sql, check);
      });
    } catch (error) {
      if (!(error instanceof CliError)) {
        fail(`Database checks failed: ${error.message}`);
        problems += 1;
      } else throw error;
    }
  }

  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/auth/v1/health`, {
        headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
      });
      check(response.ok, "Supabase Auth is reachable", `Supabase Auth answered ${response.status}`);
    } catch (error) {
      fail(`Supabase Auth is not reachable: ${error.message}`);
      problems += 1;
    }
  }

  console.log(problems ? `\n${red(`${problems} problem(s) found.`)}` : `\n${green("All set.")} Run ${bold("pnpm dev")}.`);
  return problems;
}

// ── Website builder ─────────────────────────────────────────────────────────

/** The site's locales, from src/i18n/routing.ts. */
function siteLocales() {
  const source = readFileSync(resolve(ROOT, "src/i18n/routing.ts"), "utf8");
  const list = source.match(/locales:\s*\[([^\]]*)\]/)?.[1] ?? "";
  return [...list.matchAll(/["']([a-z-]+)["']/g)].map((match) => match[1]);
}

/** Website checks shared by `site` and `doctor`: tables, header/footer per locale, home page. Returns the problem count. */
async function siteDatabaseChecks(sql, check) {
  let problems = 0;
  const report = (passed, good, bad) => {
    if (!passed) problems += 1;
    check(passed, good, bad);
  };
  const rows = await sql`
    select t.name from unnest(${SITE_TABLES}::text[]) as t(name)
    where to_regclass('public.' || quote_ident(t.name)) is null`;
  const missing = rows.map((row) => row.name);
  report(!missing.length, "Website tables exist", `Missing website tables: ${missing.join(", ")} (pnpm manifest site)`);
  if (missing.length) return problems;

  const locales = siteLocales();
  const settings = (await sql`select locale from site_settings`).map((row) => row.locale);
  const noSettings = locales.filter((locale) => !settings.includes(locale));
  report(!noSettings.length, `Header and footer exist for ${locales.join(", ")}`, `No header and footer for ${noSettings.join(", ")} (pnpm manifest site)`);

  const broken = [];
  for (const policy of websitePolicies()) {
    const [row] = await sql`
      select qual from pg_policies
      where schemaname = 'public' and tablename = ${policy.table} and policyname = ${policy.name}`;
    if (row && row.qual === null) broken.push(policy.table);
  }
  report(!broken.length, "Website read policies have their conditions", `Read policies without their condition on ${broken.join(", ")} (pnpm manifest db)`);

  const homes = (await sql`select locale from site_page where slug = 'home' and published_at is not null`).map((row) => row.locale);
  const noHome = locales.filter((locale) => !homes.includes(locale));
  // Not a setup problem: a new site has no pages until you create and publish them.
  if (noHome.length) warn(`No published home page for ${noHome.join(", ")} yet: create one with the address "home" in Content › Pages and publish it (guide: README › Content and the website)`);
  else check(true, `Home page is published for ${locales.join(", ")}`);
  return problems;
}

/** Loads the real blocks and renderers with tsx, which also proves their files compile. */
function listBlocks(env) {
  const result = spawnSync("pnpm", ["exec", "tsx", "scripts/lib/list-blocks.mjs"], { encoding: "utf8", shell: true, env });
  if (result.status !== 0) {
    const output = (result.stderr || result.stdout).trim().split("\n").slice(-12).join("\n");
    throw new CliError(`Could not load the blocks:\n${output}`);
  }
  return JSON.parse(result.stdout.trim().split("\n").pop());
}

async function siteCommand() {
  heading("Website builder");
  const env = loadEnv();
  requireEnv(env, ["DIRECT_DATABASE_URL"]);

  const missing = await withDb(env, async (sql) => {
    const rows = await sql`
      select t.name from unnest(${SITE_TABLES}::text[]) as t(name)
      where to_regclass('public.' || quote_ident(t.name)) is null`;
    return rows.map((row) => row.name);
  });
  if (missing.length) {
    warn(`Missing tables: ${missing.join(", ")}`);
    await dbCommand();
  }

  console.log(dim("  Adding the content in src/db/seed that isn't in the database yet (pnpm db:seed:content)…"));
  const seed = spawnSync("pnpm", ["db:seed:content"], { stdio: "inherit", shell: true, env });
  if (seed.status !== 0) throw new CliError("Seeding failed. Fix the error above and run `pnpm manifest site` again.");

  const { blocks, withoutRenderer } = listBlocks(env);
  ok(`${blocks.length} block(s): ${blocks.map((block) => block.type).join(", ")}`);
  if (withoutRenderer.length) warn(`Blocks without a renderer in src/components/site/blocks (not shown on the site): ${withoutRenderer.join(", ")}`);

  const problems = await withDb(env, (sql) => siteDatabaseChecks(sql, (passed, good, bad) => (passed ? ok(good) : fail(bad))));
  if (!problems) {
    console.log(`\n${green("Website ready.")} Run ${bold("pnpm dev")}, open ${bold("/en")}, and edit it under ${bold('CMS › Content › Pages')}.`);
    console.log(dim("  New block: pnpm manifest block <name>. Guide: README › Content and the website."));
  }
  return problems;
}

const toCamel = (name) =>
  name.replace(/[-_\s]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase()).replace(/^[A-Z]/, (c) => c.toLowerCase());
const toPascal = (name) => toCamel(name).replace(/^[a-z]/, (c) => c.toUpperCase());
const toWords = (name) => toCamel(name).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

function blockTemplate({ type, exportName, label }) {
  return `import { z } from "zod";
import { defineBlock, list, text } from "@/framework/content";
import { eyebrowField, L, titleField } from "./fields";

/**
 * ${label}: a heading and a list of cards. Its fields are what editors fill
 * in (the CMS form follows them); its renderer is in src/components/site/blocks.
 * Guide: README › Content and the website.
 */
export const ${exportName} = defineBlock({
  type: "${type}",
  // TODO(i18n): translate the Romanian label and defaults.
  label: L("${label}", "${label}"),
  fields: z.object({
    eyebrow: eyebrowField(),
    title: titleField(),
    intro: text({ label: L("Intro", "Introducere"), multiline: true }),
    items: list(
      z.object({
        title: titleField(),
        body: text({ label: L("Text", "Text"), multiline: true }),
      }),
      { label: L("Items", "Elemente"), itemLabel: L("Item", "Element") },
    ),
  }),
  defaults: {
    en: { title: "${label}", items: [{ title: "First item", body: "" }] },
    ro: { title: "${label}", items: [{ title: "Primul element", body: "" }] },
  },
});
`;
}

function rendererTemplate({ pascal, type, exportName }) {
  const tick = "`";
  return `import type { BlockProps } from "@/framework/content/ui/RenderBlocks";
import type { ${exportName} } from "@/content/blocks/${type}";
import { Band, SectionHeading } from "@/components/site/sections/blocks";

/** Plain React over the block content; field(...) marks texts for the click-to-edit of the CMS preview. */
export function ${pascal}({ id, content, field }: BlockProps<typeof ${exportName}>) {
  return (
    <Band labelledBy={${tick}\${id}-title${tick}}>
      <SectionHeading titleId={${tick}\${id}-title${tick}} eyebrow={content.eyebrow} title={content.title} intro={content.intro} field={field} />
      <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
        {content.items.map((item, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-2xl border bg-card p-6">
            <h3 className="m-0 font-display text-lg font-semibold" {...field("items", i, "title")}>
              {item.title}
            </h3>
            {item.body && (
              <p className="m-0 text-base leading-relaxed text-muted-foreground" {...field("items", i, "body")}>
                {item.body}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Band>
  );
}
`;
}

/** Adds an import after the last one and an entry before the closing of the array or object the pattern finds. */
function register(file, pattern, importLine, entry) {
  const text = readFileSync(file, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const list = text.match(pattern);
  const lastImport = [...text.matchAll(/^import .*$/gm)].pop();
  if (!list || !lastImport) throw new CliError(`Could not find where to register it in ${relative(ROOT, file)}.`);
  const body = list[2].replace(/\s+$/, "");
  const indent = body.match(/\n([ \t]+)\S/)?.[1] ?? "  ";
  const comma = !body.trim() || body.trim().endsWith(",") ? "" : ",";
  const afterImports = lastImport.index + lastImport[0].length;
  const updated =
    text.slice(0, afterImports) +
    eol + importLine +
    text.slice(afterImports, list.index) +
    list[1] + body + comma + eol + indent + entry + "," + eol + list[3] +
    text.slice(list.index + list[0].length);
  writeFileSync(file, updated);
}

async function blockCommand(nameArg) {
  heading("New block");
  const name = (nameArg || (await ask("Block name (e.g. testimonials, pricing-table)"))).trim();
  if (!/^[a-zA-Z][a-zA-Z0-9-_ ]*$/.test(name)) {
    throw new CliError("Use letters, digits and dashes, e.g. `pnpm manifest block pricing-table`.");
  }
  const type = toCamel(name);
  const pascal = toPascal(name);
  const exportName = `${type}Block`;
  const label = toWords(name);
  const blockFile = resolve(BLOCKS_DIR, `${type}.ts`);
  const rendererFile = resolve(RENDERERS_DIR, `${pascal}.tsx`);

  for (const file of [blockFile, rendererFile]) if (existsSync(file)) throw new CliError(`${relative(ROOT, file)} already exists.`);
  if (spawnSync("git", ["grep", "-q", `type: "${type}"`, "--", "src/content/blocks"], { cwd: ROOT }).status === 0)
    throw new CliError(`A block with type "${type}" already exists. Pick another name.`);

  const eolOf = (file) => (readFileSync(file, "utf8").includes("\r\n") ? "\r\n" : "\n");
  writeFileSync(blockFile, blockTemplate({ type, exportName, label }).replace(/\n/g, eolOf(BLOCKS_INDEX)));
  writeFileSync(rendererFile, rendererTemplate({ pascal, type, exportName }).replace(/\n/g, eolOf(RENDERERS_INDEX)));
  register(BLOCKS_INDEX, /(export const allBlocks = \[)([\s\S]*?)(\] as const)/, `import { ${exportName} } from "./${type}";`, exportName);
  register(RENDERERS_INDEX, /(export const blockComponents = \{)([\s\S]*?)(\} satisfies BlockComponents)/, `import { ${pascal} } from "./${pascal}";`, `${type}: ${pascal}`);
  ok(`Created ${relative(ROOT, blockFile)} (what editors fill in)`);
  ok(`Created ${relative(ROOT, rendererFile)} (how it looks)`);
  ok("Registered both (allBlocks, blockComponents)");
  console.log(`\nNext: run ${bold('pnpm dev')}, open a page in ${bold('CMS › Content › Pages')} and use ${bold(`Add block › ${label}`)}.`);
  console.log(dim("  Then shape the fields and the markup; the CMS form follows the fields automatically."));
}

async function setupCommand() {
  console.log(bold("ManifestUI setup"));
  await envCommand();
  await dbCommand();
  await authSyncCommand();
  await adminCommand();
  return doctorCommand();
}

// ── Entry ───────────────────────────────────────────────────────────────────

const COMMANDS = {
  setup: setupCommand,
  env: envCommand,
  db: dbCommand,
  "auth-sync": authSyncCommand,
  admin: adminCommand,
  doctor: doctorCommand,
  site: siteCommand,
  block: blockCommand,
  // The older name.
  section: blockCommand,
};

const [name = "help", ...args] = process.argv.slice(2);
const command = COMMANDS[name];

if (!command) {
  console.log(readFileSync(new URL(import.meta.url), "utf8").match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, ""));
  process.exitCode = name === "help" ? 0 : 1;
} else {
  try {
    const problems = await command(...args);
    process.exitCode = typeof problems === "number" && problems > 0 ? 1 : 0;
  } catch (error) {
    fail(error instanceof CliError ? error.message : error.stack || String(error));
    process.exitCode = 1;
  } finally {
    rl?.close();
  }
}
