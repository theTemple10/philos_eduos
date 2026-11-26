import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

/**
 * Drizzle config for the M2 (v2) schema. See docs/m2-plan.md.
 *
 * Schema changes are versioned SQL files in ./drizzle, reviewed in PRs,
 * and applied in order (no `db:push`). Rehearse them on a throwaway
 * Postgres with `npm run db:rehearse` before anything touches production.
 */
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "./src/lib/db/v2/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL?.trim() ?? "" },
  migrations: { table: "__migrations", schema: "public" },
  strict: true,
  verbose: true,
});
