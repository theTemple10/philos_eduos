import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Drizzle Kit does not load Next.js' .env.local file by default. Use the same
// environment loader as the app so `npm run db:push` works from a fresh clone.
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Copy .env.example to .env.local and set DATABASE_URL to your Supabase PostgreSQL connection string before running Drizzle commands.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
