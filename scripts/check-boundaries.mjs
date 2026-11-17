#!/usr/bin/env node
/**
 * Checks that imports follow the project's layers, so the framework stays
 * reusable and depends only on abstractions:
 *
 *   platform   src/components/ui, src/lib, src/hooks, src/i18n, src/contexts
 *              shared infrastructure; imports only platform. src/lib/storage
 *              is not platform: it is the project's adapter for the
 *              framework's storage port, so it counts as app
 *   framework  src/framework: the CRUD engine and the website builder
 *              (src/framework/site); imports framework and platform.
 *              It reaches the project only through src/manifest.config.ts,
 *              read by src/framework/runtime.ts
 *   app        everything else in src (routes, components, extensions, db,
 *              manifest.config): the project; imports anything
 *
 *   pnpm check:boundaries
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "src");
const rel = (file) => path.relative(root, file).replace(/\\/g, "/");

const PLATFORM = ["src/components/ui/", "src/lib/", "src/hooks/", "src/i18n/", "src/contexts/"];

function layerOf(file) {
  if (file.startsWith("src/framework/")) return "framework";
  if (file.startsWith("src/lib/storage/")) return "app";
  if (PLATFORM.some((dir) => file.startsWith(dir))) return "platform";
  return "app";
}

/** Allowed source layer → target layers. */
const ALLOWED = {
  platform: ["platform"],
  framework: ["framework", "platform"],
  app: ["app", "framework", "platform"],
};

/** The single, typed way back from the framework to the project: its config. */
const EXCEPTIONS = [{ from: "src/framework/runtime.ts", to: "src/manifest.config.ts" }];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

function resolveTarget(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(src, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // a package
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (existsSync(candidate) && !candidate.endsWith(path.sep) && readdirSafe(candidate) === null) return rel(candidate);
  }
  return rel(base);
}
function readdirSafe(file) {
  try {
    return readdirSync(file);
  } catch {
    return null;
  }
}

const IMPORT = /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|^\s*import\s*["']([^"']+)["']/gm;

const problems = [];
for (const file of walk(src)) {
  const from = rel(file);
  const fromLayer = layerOf(from);
  const code = readFileSync(file, "utf8");
  for (const match of code.matchAll(IMPORT)) {
    const spec = match[1] ?? match[2] ?? match[3];
    const to = resolveTarget(file, spec);
    if (!to || !to.startsWith("src/")) continue;
    const toLayer = layerOf(to);
    if (EXCEPTIONS.some((e) => e.from === from && e.to === to)) continue;
    let ok = ALLOWED[fromLayer].includes(toLayer);
    if (!ok) problems.push(`${from}  →  ${spec}   (${fromLayer} may not import ${toLayer})`);
  }
}

if (problems.length) {
  console.error(`Layer boundary violations (${problems.length}):\n  ${problems.join("\n  ")}`);
  console.error("\nSee scripts/check-boundaries.mjs for the layers.");
  process.exit(1);
}
console.log("Layer boundaries: ok.");
