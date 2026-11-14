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
 * Every command is safe to run again. No dependencies beyond the project's own.
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_FILE = resolve(ROOT, ".env");
const SYNC_SQL = resolve(ROOT, "src/db/sql/auth-user-sync.sql");
const TRIGGER = "manifestui_sync_auth_user";

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

async function dbCommand() {
  heading("Database schema");
  const env = loadEnv();
  requireEnv(env, ["DIRECT_DATABASE_URL"]);
  console.log(dim("  Running pnpm db:push (drizzle-kit push)…"));
  const result = spawnSync("pnpm", ["db:push"], { stdio: "inherit", shell: true, env });
  if (result.status !== 0) throw new CliError("pnpm db:push failed. Fix the error above and run `pnpm manifest db` again.");
  ok("Schema pushed");
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
  if (existsSync(resolve(ROOT, "src/studio")) && !env.GITHUB_APP_SLUG) {
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
