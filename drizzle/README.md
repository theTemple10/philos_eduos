# Database migrations (M2 onwards)

Schema changes are **versioned SQL files**, applied in order and reviewed in
PRs. Don't use `db:push` for the v2 schema. See docs/m2-plan.md.

| File | What it does |
|---|---|
| `0000_reset_v1.sql` | Drops the v1 tables (owner decision D1: start clean). **Guarded:** it refuses to run if they hold more than test-sized data. |
| `0001_v2_schema.sql` | The v2 schema, generated from `src/lib/db/v2/schema.ts`. |
| `0002_auth_and_rls.sql` | Hand-written: the FK from `users.id` to `auth.users`, Row Level Security on every table, and the append-only audit log. |

## Changing the schema
1. Edit `src/lib/db/v2/schema.ts`.
2. Run `npm run db:v2:generate -- --name <what_changed>` (or add `--custom`
   for hand-written SQL).
3. Run `npm run db:rehearse` and add checks there for any new rule.
4. Commit the schema, the SQL and `meta/` together. Never edit a migration
   after it has run in production; add a new one instead.

## Rehearsal (no production access)
```bash
docker run -d --name philos-rehearsal -e POSTGRES_PASSWORD=rehearsal \
  -p 55432:5432 postgres:17.6      # same version as Supabase
npm run db:rehearse
```
The script refuses any non-local database. It rebuilds v1 with test data,
applies every migration (twice, to check they're idempotent), checks
about 40 rules, and proves the 0000 guard holds.

## Production
Only at the M2 switch-over (docs/m2-plan.md §2), after the owner's
go-ahead and a `pg_dump` backup:
```bash
npx drizzle-kit migrate --config drizzle.v2.config.ts   # uses DATABASE_URL
```
