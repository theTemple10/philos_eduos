import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client with the service-role key. **Server only**: it bypasses
 * Row Level Security and Storage policies, so every caller must do its own
 * authorization first (tenant, role and path checks).
 *
 * Used for Storage (learning-material files, issue #4).
 */
let admin: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must never run in the browser.");
  }
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for file storage.");
  }
  admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}
