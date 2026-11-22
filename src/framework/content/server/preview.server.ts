import "server-only";

import { timingSafeEqual } from "node:crypto";
import { draftMode } from "next/headers";
import { getDbClient } from "@/framework/lib/dbClient";
import { getManifestConfig } from "@/framework/runtime";
import { requirePermission } from "@/framework/authorization/lib/requirePermission";
import { ForbiddenError } from "@/framework/authorization/lib/ForbiddenError";
import { entryUrl } from "../options";
import { createDrizzleContentStore } from "./drizzleStore";

const sameSecret = (given: string, expected: string) => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

/**
 * GET /api/preview?type=&entryId=&locale=&secret=: checks the secret
 * (PREVIEW_SECRET, which the CMS adds on the server) and that the signed-in
 * user may read the type, turns on draft mode and returns the entry's
 * address. Only that browser renders drafts; everyone else gets the static page.
 */
export async function startPreview(params: URLSearchParams): Promise<{ location: string } | { status: number; message: string }> {
  const expected = process.env.PREVIEW_SECRET;
  if (!expected) return { status: 503, message: "Preview isn't set up: PREVIEW_SECRET is missing." };
  const [type, entryId, locale, secret] = ["type", "entryId", "locale", "secret"].map((key) => params.get(key) ?? "");
  if (!secret || !sameSecret(secret, expected)) return { status: 401, message: "Invalid preview link." };
  const content = getManifestConfig().content;
  const def = content?.types.find((item) => item.name === type);
  if (!content || !def) return { status: 404, message: "No such content type." };
  try {
    await requirePermission(def.descriptor.id, "read");
  } catch (error) {
    if (error instanceof ForbiddenError) return { status: 403, message: "You can't preview this." };
    throw error;
  }
  const row = await createDrizzleContentStore(getDbClient(), content.tables).getRowByEntry(def, entryId, locale);
  if (!row) return { status: 404, message: "No such entry." };
  const slugField = def.descriptor.content.slugField;
  const slug = slugField && typeof row.data[slugField] === "string" ? (row.data[slugField] as string) : undefined;
  const location = entryUrl(def.descriptor.content, { locale: row.locale, slug });
  if (!location) return { status: 404, message: "This content type has no address." };
  (await draftMode()).enable();
  return { location };
}

/** GET /api/preview/exit?redirect=/en/…: turns draft mode off and goes back to a page of this site. */
export async function stopPreview(params: URLSearchParams): Promise<string> {
  (await draftMode()).disable();
  return sitePath(params.get("redirect") ?? "/");
}

/**
 * Only a path on this site: never "//host", "/\host" (URL parsers read the
 * backslash as a slash), a full URL or control characters. Resolved against a
 * placeholder origin, and kept only when it stays on that origin.
 */
export function sitePath(target: string): string {
  // eslint-disable-next-line no-control-regex
  if (!target.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(target)) return "/";
  const base = "https://site.invalid";
  try {
    const url = new URL(target, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
