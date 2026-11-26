-- M2 switch-over, step 1: remove the v1 tables (docs/m2-plan.md, decision D1:
-- "start clean"). At planning time (2026-11-26) the database held only test
-- data: 1 school, 1 class, 1 student, 1 announcement and 1 user.
--
-- Guard: refuse to run if the v1 tables hold more than test-sized data, so
-- this can never wipe real school records by accident. If it fires, write a
-- data migration instead.
DO $$
DECLARE
  n_tenants bigint := 0;
  n_users bigint := 0;
  n_students bigint := 0;
BEGIN
  IF to_regclass('public.tenants') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.tenants' INTO n_tenants;
  END IF;
  IF to_regclass('public.users') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tenant_id'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.users' INTO n_users;
  END IF;
  IF to_regclass('public.students') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'tenant_id'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.students' INTO n_students;
  END IF;
  IF n_tenants > 1 OR n_users > 3 OR n_students > 5 THEN
    RAISE EXCEPTION 'v1 tables hold real-looking data (schools=%, users=%, students=%); refusing to drop them. Write a data migration.',
      n_tenants, n_users, n_students;
  END IF;
END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS
  public.notifications,
  public.tasks,
  public.report_comments,
  public.payments,
  public.invoices,
  public.fee_schedules,
  public.comments,
  public.messages,
  public.transportation,
  public.study_materials,
  public.announcements,
  public.grades,
  public.attendance,
  public.classes,
  public.teachers,
  public.students,
  public.invites,
  public.tenants,
  public.users
CASCADE;
