import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Set it in your deployment environment or .env.local to connect Philos EduOS to PostgreSQL.",
  );
}

// Supabase's transaction pooler (port 6543) does not support prepared
// statements. Disabling them also works with a direct PostgreSQL connection.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

export * from "./schema";
