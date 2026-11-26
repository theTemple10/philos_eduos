/**
 * Create or update the private Supabase Storage bucket for learning
 * materials (issue #4). Safe to run any number of times.
 *
 *   npm run storage:setup        (reads .env.local)
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The size
 * limit and allowed types come from src/lib/materials/files.ts, so the
 * bucket and the app always agree.
 */
import { createClient } from "@supabase/supabase-js";
import {
  ALLOWED_MATERIAL_TYPES,
  MATERIALS_BUCKET,
  MAX_MATERIAL_BYTES,
} from "../src/lib/materials/files.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. in .env.local).");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const options = {
  public: false,
  fileSizeLimit: MAX_MATERIAL_BYTES,
  allowedMimeTypes: [...new Set(Object.values(ALLOWED_MATERIAL_TYPES).map((t) => t.mime))],
};

const { data: existing } = await supabase.storage.getBucket(MATERIALS_BUCKET);
const { error } = existing
  ? await supabase.storage.updateBucket(MATERIALS_BUCKET, options)
  : await supabase.storage.createBucket(MATERIALS_BUCKET, options);
if (error) {
  console.error(`Couldn't ${existing ? "update" : "create"} bucket "${MATERIALS_BUCKET}":`, error.message);
  process.exit(1);
}

const { data: bucket } = await supabase.storage.getBucket(MATERIALS_BUCKET);
console.log(`${existing ? "Updated" : "Created"} bucket "${MATERIALS_BUCKET}":`, {
  public: bucket?.public,
  file_size_limit: bucket?.file_size_limit,
  allowed_mime_types: bucket?.allowed_mime_types?.length,
});
