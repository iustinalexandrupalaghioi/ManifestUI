import "server-only";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getManifestConfig } from "../runtime";

// The framework is deliberately Postgres+Drizzle-opinionated (via
// postgres-js), not database-agnostic — this is the concrete client type,
// not an adapter interface. What's pluggable is *which* client instance is
// used (the project's, from src/manifest.config.ts), not *what kind* of
// client it is, so `config/api.ts` files keep full column-level typing on
// `tx.insert(...)`/`tx.update(...)` etc.
//
// The schema generic is deliberately `any`, not the app's own schema type
// (the framework can't know that) — `select`/`insert`/`update`/`delete`/
// `execute`/`transaction` don't depend on it for their typing, only the
// relational `.query.*` API does, which nothing here uses. `any` (not a
// narrower default like `Record<string, never>`) is what makes an app's
// concrete `PostgresJsDatabase<typeof appSchema>` assignable here at all.
export type DbClient = PostgresJsDatabase<any>;

/** The project's database client (src/manifest.config.ts). */
export function getDbClient(): DbClient {
  return getManifestConfig().db;
}
