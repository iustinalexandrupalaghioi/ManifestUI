import { defineConfig } from "drizzle-kit";

if (!process.env.DIRECT_DATABASE_URL) {
  throw new Error("DIRECT_DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/db/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL,
  },
  casing: "snake_case",
  introspect: {
    casing: "preserve",
  },
});
