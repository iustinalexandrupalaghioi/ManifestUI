import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { setDbClient } from "@/framework/lib/dbClient";

declare global {
  var __dbClient: postgres.Sql | undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Reuse the connection across hot reloads in dev to avoid exhausting the pooler.
const client =
  globalThis.__dbClient ??
  postgres(process.env.DATABASE_URL, { prepare: false });
if (process.env.NODE_ENV !== "production") globalThis.__dbClient = client;

export const db = drizzle(client, { schema });

setDbClient(db);
