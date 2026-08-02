import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __dbClient: postgres.Sql | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// IMPORTANT — this connects as the Postgres role behind Supabase's pooler
// (`postgres.<project>`), which has BYPASSRLS. Every `pgPolicy(...)` defined
// in ./schema/*.ts is therefore dead code on this connection: it never
// evaluates, for reads or writes, no matter how it's written. Do not treat
// those policies as a real security boundary, and do not add new ones
// expecting them to do anything through this client.
//
// The actual, and only, authorization layer for data reached through `db`
// is the application layer in src/framework/authorization/rbac.ts
// (`withPermission`/`requirePermission`, applied per resource in each
// `config/api.ts`). If you need RLS to be real — e.g. for a script, an Edge
// Function, or any other code path that talks to Postgres directly — it
// has to go through a non-bypassing role with the caller's JWT claims set
// per request, not through this client.

// Reuse the connection across hot reloads in dev to avoid exhausting the pooler.
const client =
  globalThis.__dbClient ?? postgres(process.env.DATABASE_URL, { prepare: false });
if (process.env.NODE_ENV !== "production") globalThis.__dbClient = client;

export const db = drizzle(client, { schema });
