/**
 * Content definitions must not depend on React or on the website: they're
 * read on the server by the content layer and by outside frontends. This
 * walks the runtime imports (type-only imports are erased, so they're
 * skipped) from every file under the given roots and reports each path that
 * reaches React, a "use client" module, a .tsx file or the website's code.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** Packages a content definition may not use. */
const FORBIDDEN_PACKAGES = [/^react(-dom)?(\/|$)/, /^next\/(link|image|navigation|dynamic|script|font)/, /(^|[/-])react($|[/-])/];
/** Project folders a content definition may not import (relative to the repo root). */
const FORBIDDEN_DIRS = ["src/components/site/", "src/components/extensions/", "src/app/"];

const RUNTIME_IMPORT =
  /(?:^|[;\n])\s*(?:import|export)\s+(?!type\b)(?:[^'";]*?\sfrom\s*)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js)$/.test(entry.name) && !entry.name.endsWith(".d.ts") && !/\.test\.[tj]s$/.test(entry.name)) out.push(full);
  }
  return out;
}

function resolveLocal(root, fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(root, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null;
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.mjs`, path.join(base, "index.ts"), path.join(base, "index.tsx")])
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return undefined;
}

const isClientModule = (code) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(code);

/**
 * @param {{ root: string, roots: string[], exclude?: string[] }} options repo root, folders (relative to it) whose files must stay
 *   React-free, and folders under them that are not content definitions (server plumbing)
 * @returns {string[]} problems, each naming the import chain
 */
export function checkContentGraph({ root, roots, exclude = [] }) {
  const rel = (file) => path.relative(root, file).replace(/\\/g, "/");
  const problems = [];
  const visited = new Set();
  const visit = (file, chain) => {
    if (visited.has(file)) return;
    visited.add(file);
    const name = rel(file);
    const via = [...chain, name].join(" → ");
    if (file.endsWith(".tsx")) problems.push(`${via}  (a .tsx file)`);
    if (FORBIDDEN_DIRS.some((dir) => name.startsWith(dir))) {
      problems.push(`${via}  (website code)`);
      return;
    }
    const code = readFileSync(file, "utf8");
    if (isClientModule(code)) problems.push(`${via}  ("use client")`);
    for (const match of code.matchAll(RUNTIME_IMPORT)) {
      const spec = match[1] ?? match[2];
      const local = resolveLocal(root, file, spec);
      if (local === null) {
        if (FORBIDDEN_PACKAGES.some((pattern) => pattern.test(spec))) problems.push(`${via} → ${spec}  (React)`);
      } else if (local) visit(local, [...chain, name]);
    }
  };
  for (const dir of roots)
    for (const file of walk(path.join(root, dir))) if (!exclude.some((skip) => rel(file).startsWith(skip))) visit(file, []);
  return problems;
}
