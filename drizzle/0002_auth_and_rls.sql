-- M2 switch-over, step 3: what Drizzle doesn't manage (docs/m2-plan.md).

-- 1. App users are Supabase Auth users: deleting the auth user removes the
--    profile (and, through cascades, their memberships).
ALTER TABLE public.users
  ADD CONSTRAINT users_id_auth_fk FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;
--> statement-breakpoint

-- 2. Row Level Security on every app table, with no policies: the browser's
--    anon/authenticated keys can read and write nothing. Only the server
--    (which connects as the database owner) touches data, after its own
--    permission checks.
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
--> statement-breakpoint

-- 3. The audit log is append-only.
CREATE FUNCTION public.audit_log_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END $$;
--> statement-breakpoint
CREATE TRIGGER audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_append_only();
