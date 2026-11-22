import "server-only";

import { cache } from "react";
import { draftMode } from "next/headers";
import { ALL_PERMISSIONS } from "@/framework/authorization/constants";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { getUserPermissions } from "@/framework/authorization/lib/permissions";
import type { Register } from "@/framework/config";
import { getDbClient } from "@/framework/lib/dbClient";
import { getManifestConfig } from "@/framework/runtime";
import { cachedRead } from "./cache";
import type { AnyContentType } from "../define";
import { createDrizzleReadSource } from "./drizzleStore";
import { createContentReader, type ContentReader, type Entry, type EntryOf, type Page } from "./read";

/**
 * The content layer for app code (server components, route handlers): read
 * content only through these. Reads are typed by content type name once the
 * project registers its types (src/manifest.config.ts › Register.contentTypes).
 */

type Types = Register extends { contentTypes: infer T extends readonly AnyContentType[] } ? T[number] : AnyContentType;
export type ContentTypeName = Types["name"];
type TypeNamed<N extends ContentTypeName> = Extract<Types, { name: N }>;
/** The entry a read of type `N` returns. */
export type ContentEntry<N extends ContentTypeName> = EntryOf<TypeNamed<N>>;

let reader: ContentReader | undefined;

/** The viewer's permissions, once per request (only asked in draft mode). */
const viewerPermissions = cache(async (): Promise<string[]> => {
  const userId = await getCurrentUserId();
  return userId ? getUserPermissions(userId) : [];
});

async function mayReadDrafts(resourceId: string) {
  const permissions = await viewerPermissions();
  return permissions.includes(ALL_PERMISSIONS) || permissions.includes(`${resourceId}:read`);
}

function makeReader(isDraft: (def: AnyContentType) => Promise<boolean>) {
  const content = getManifestConfig().content;
  if (!content) throw new Error("No `content` in src/manifest.config.ts: add the content tables and types.");
  return createContentReader({
    source: createDrizzleReadSource(getDbClient(), content.tables),
    types: content.types,
    cache: cachedRead,
    draftMode: isDraft,
    onUnknownBlock: (type, id) => console.warn(`[content] unknown block type "${type}" (block ${id}) left out`),
  });
}

function getReader() {
  reader ??= makeReader(async (def) => {
    let enabled: boolean;
    try {
      enabled = (await draftMode()).isEnabled;
    } catch {
      // Outside a request (generateStaticParams, scripts): never draft.
      return false;
    }
    // Draft mode is per browser, not per type: drafts of a type only for a viewer who may read it.
    return enabled && (await mayReadDrafts(def.descriptor.id));
  });
  return reader;
}

// CI builds have no database: reads render empty there; at runtime the error surfaces.
const duringBuild = () => process.env.NEXT_PHASE === "phase-production-build";
async function orDuringBuild<T>(read: () => Promise<T>, empty: T, what: string): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!duringBuild()) throw error;
    console.warn(`[content] database unavailable during the build; ${what} renders empty:`, error);
    return empty;
  }
}

/** One collection entry by slug or entry id, published unless `draft` (honoured only in draft mode). */
export function getEntry<N extends ContentTypeName>(
  type: N,
  options: { locale: string; slug?: string; entryId?: string; draft?: boolean; fallbackLocale?: string },
): Promise<ContentEntry<N> | null> {
  return orDuringBuild(() => getReader().getEntry(type, options), null, `${type} ${options.slug ?? options.entryId}`) as Promise<ContentEntry<N> | null>;
}

/** Entries of a collection, paged with `limit` and `cursor`. `where` matches fields exactly. */
export function listEntries<N extends ContentTypeName>(
  type: N,
  options: Parameters<ContentReader["listEntries"]>[1],
): Promise<Page<ContentEntry<N>>> {
  return orDuringBuild(() => getReader().listEntries(type, options), { items: [], nextCursor: null }, `${type} list`) as Promise<Page<ContentEntry<N>>>;
}

/** The single entry in `locale`, or its defaults while it has no published row. */
export function getSingleton<N extends ContentTypeName>(type: N, options: { locale: string; draft?: boolean }): Promise<ContentEntry<N> | null> {
  return orDuringBuild(() => getReader().getSingleton(type, options), null, type) as Promise<ContentEntry<N> | null>;
}

/** Published slugs with their locale, for generateStaticParams. */
export function listSlugs(type: ContentTypeName): Promise<{ slug: string; locale: string }[]> {
  return orDuringBuild(() => getReader().listSlugs(type), [], `${type} slugs`);
}

export type { Entry, Page };
