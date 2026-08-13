import "server-only";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

// The framework is deliberately Postgres+Drizzle-opinionated (via
// postgres-js), not database-agnostic — this is the concrete client type,
// not an adapter interface. What's pluggable is *which* client instance is
// used, not *what kind* of client it is, so `config/api.ts` files keep full
// column-level typing on `tx.insert(...)`/`tx.update(...)` etc.
//
// The schema generic is deliberately `any`, not the app's own schema type
// (the framework can't know that) — `select`/`insert`/`update`/`delete`/
// `execute`/`transaction` don't depend on it for their typing, only the
// relational `.query.*` API does, which nothing here uses. `any` (not a
// narrower default like `Record<string, never>`) is what makes an app's
// concrete `PostgresJsDatabase<typeof appSchema>` assignable here at all —
// TSchema appears invariantly in `.query`'s type, so anything narrower
// fails at the `setDbClient(db)` call site.
export type DbClient = PostgresJsDatabase<any>;

let _db: DbClient | null = null;

export function setDbClient(db: DbClient): void {
  _db = db;
}

export function getDbClient(): DbClient {
  if (!_db) {
    throw new Error(
      "No DB client configured. Call setDbClient() before using resource actions.",
    );
  }
  return _db;
}
