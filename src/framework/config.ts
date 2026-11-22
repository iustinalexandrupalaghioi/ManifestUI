import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";
import type { DbClient } from "./lib/dbClient";
import type { ResourceDescriptor } from "./types/resource-descriptor-type";
import type { AnyContentType } from "./content/define";
import type { ContentTables } from "./content/server/drizzleStore";
import type { ContentChange } from "./content/server/service";

export type OAuthProvider = "google" | "github";

/**
 * The project registers its concrete types here (in src/manifest.config.ts),
 * so framework code gets full column types without importing project code:
 *
 *   declare module "@/framework/config" {
 *     interface Register { authTables: typeof authTables; contentTypes: typeof contentTypes }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Register {}

type Column = AnyPgColumn;

/** The columns the framework's authentication and authorization read and write. */
export interface AuthTablesShape {
  /** The app's users, kept in sync with Supabase Auth. */
  user: PgTable & { id: Column; administrator: Column; fullName: Column; email: Column; phone: Column; updatedAt: Column };
  group: PgTable & { id: Column; name: Column };
  /** One row per (group, resource) grant: CRUD flags, or `allowed` for a custom action. */
  groupPermission: PgTable & {
    groupId: Column;
    resourceId: Column;
    canRead: Column;
    canAdd: Column;
    canUpdate: Column;
    canDelete: Column;
    allowed: Column;
  };
  userGroup: PgTable & { userId: Column; groupId: Column };
}

/** The project's tables (from `Register`), or the bare shape when none are registered. */
export type AuthTables = Register extends { authTables: infer T extends AuthTablesShape } ? T : AuthTablesShape;

/**
 * What the framework needs from the project. The project provides it once,
 * in src/manifest.config.ts; the framework reads it through ./runtime.ts and
 * never imports project code itself.
 */
export interface ManifestConfig {
  /** The Drizzle client the framework reads and writes with. */
  db: DbClient;
  /** Every CMS resource: ids, labels and routes (permission messages, guards). */
  resources: readonly ResourceDescriptor[];
  /** The project's user and access tables (src/db/schema), which authentication and authorization query. */
  authTables: AuthTables;
  /** Headless content: the shared draft/revision tables and the project's content types (src/content). */
  content?: {
    tables: ContentTables;
    types: readonly AnyContentType[];
    /** After a content change commits (publish, unpublish…): refresh the project's own caches. */
    onChange?: (change: ContentChange) => void | Promise<void>;
  };
  auth?: {
    /** Runs on the server just before an OAuth sign-in redirects to the provider. */
    beforeOAuthSignIn?: (provider: OAuthProvider) => void | Promise<void>;
  };
}

/** Types the project's config (src/manifest.config.ts). */
export function defineManifestConfig(config: ManifestConfig): ManifestConfig {
  return config;
}
