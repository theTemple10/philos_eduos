# M2 plan: roles, school onboarding, sessions and terms

Status: **accepted** (2026-11-26). The owner approved all recommendations for D1–D5. Nothing has been run against production yet.
Covers #15 (roles RFC), #27 (sessions/terms), #28 (student sign-in), #5
(atomic invites), and folds in #7 (foreign keys).

## 1. Decisions needed from the owner

| # | Question | Decision (owner accepted the recommendation, 2026-11-26) |
|---|---|---|
| D1 | The database holds one test school ("Prudence High School": 1 class, 1 student, 1 announcement). Keep it, or start clean? | **Start clean.** Recreate a test school through the new console; that also tests the console. |
| D2 | Your own account: platform super-admin only, or also admin of a test school? | **Super-admin only.** Use a second email as the test school's admin, so you see exactly what a principal sees. |
| D3 | Default assessment scheme for new schools (each school can change it)? | **CA1 20 + CA2 20 + Exam 60 = 100**, graded on the WAEC key (A1 75–100 … F9 0–39). |
| D4 | Student sign-in, first release? | **Secondary: admission number + password. Primary: admission number + 6-digit PIN.** QR class cards with picture passwords follow in a second step (they need printing and a device flow). |
| D5 | The live site will be down for a few minutes at switch-over. Acceptable? | **Yes.** There are no real users yet. |

## 2. Approach

The database is almost empty and has no foreign keys at all, so this is
a **clean rebuild**, not a data migration:

1. All M2 work goes into an `m2` branch, through normal PRs that you
   review. `main` (the live site) stays untouched until switch-over.
2. From now on, the schema changes through **versioned SQL migrations**
   committed in `drizzle/` and reviewed in the PR. `db:push`, which
   applies changes without a record, goes away.
3. **Rehearsal:** every migration runs first against a throwaway local
   Postgres (Docker), and the test suite runs against that database too.
   This replaces the staging project the free plan doesn't allow.
4. **Switch-over** (announced in advance):
   1. back up the production database (`pg_dump`, kept off GitHub);
   2. run the migrations;
   3. merge `m2` into `main`;
   4. bootstrap your super-admin account;
   5. smoke-test.

   Rollback: restore the dump and revert the merge.

## 3. Data model

All tables get foreign keys, `NOT NULL` where it matters, `CHECK`s on
status and role values, and `timestamptz`/`date` columns instead of
epoch numbers. Every school-owned table carries `tenant_id`, and every
query filters on it. Row Level Security stays on, with no public
policies; only the server reads the database.

**People and access**
- `users`: one row per sign-in. Gains `platform_role` (`super_admin` or
  empty) and loses `role` and `tenant_id`.
- `memberships (user, school, role, status)`: a person's role in a school.
  - Roles: `school_admin`, `registrar`, `bursar`, `teacher`, `staff`,
    `parent`, `student`.
  - A database rule allows **one active membership per person for now**.
    Allowing a teacher who is also a parent later means dropping that
    one rule and adding a role switcher; no data changes.
- `invites`: email or student slot, role, school, and the student(s) a
  parent will be linked to.
  - Redemption is a single conditional update, so an invite can't be
    used twice (#5).
  - Codes are stored hashed.
- `schools` (renamed from `tenants`): gains `slug` (unique, for
  `/s/<slug>`) and `status` (active or suspended). Profile and branding
  come later (#30).

**School structure**
- `academic_sessions` (e.g. 2026/2027) and `terms` (First, Second, Third,
  with dates). One current session and term per school.
- `classes`: level and arm, e.g. JSS 2 + Gold → "JSS 2 Gold".
- `subjects`, plus `teaching_assignments (teacher, class, subject)`. This
  is how a teacher is limited to their own classes.

**Students and families**
- `students`: admission number (unique per school), names and status,
  with an optional link to a login.
- `enrollments (student, class, session)`: a student's class each
  session, so history survives promotion.
- `guardians (parent, student, relationship)`: several guardians per
  child.

**Assessment**
- `assessment_schemes`: per school, the components with their maximum
  marks and the grade boundaries (D3).
- `scores (student, subject, term, component)`: one row per mark, with a
  uniqueness rule so a mark can't be entered twice.
  - Term totals, grades and class position are calculated from these.
  - The cumulative session result is the average of the term totals
    (#27).

**Unchanged in purpose, now linked properly**
- Linked to a term: attendance (one record per student per day),
  materials, report comments, fee schedules, invoices.
- Payments get a unique `reference`.
- Messages, announcements and tasks are linked to memberships.

## 4. Permissions

- **One file defines every permission:** `src/lib/auth/permissions.ts`
  holds named permissions such as `fees:manage` and `scores:write`, and
  which roles hold them, following the RFC #15 table.
- **Every API route starts with `requirePermission(...)`,** which loads
  the caller's active membership. School and role always come from the
  server session, never from the request.
- **Narrower scopes on top of the role:**
  - a teacher only reaches classes and subjects in their assignments;
  - a parent only reaches linked children;
  - a student only reaches themself.

  One helper (`canAccessStudent`) is used everywhere.
- **Each role gets its own dashboard route.** Opening another role's
  page gives a 403, not a blank screen.
- **Tests:** a permission-matrix test checks every role against every
  permission, and isolation tests run against the rehearsal database:
  school A can't see school B, a teacher can't see another class, and a
  parent can't see another child.
- **Audit log** for sensitive actions: role changes, score edits after
  approval, fee changes.

## 5. Sign-in and onboarding

- **`/admin`:** the platform console, for the super-admin only. Create a
  school (name, slug, curriculum), suspend it, and invite its first
  school admin.
- **`/s/<slug>`:** the school's own sign-in page. Only that school's
  members can sign in there.
- **Public sign-up and self-serve school creation are switched off.**
  Only invited emails can sign in.
- **Who invites whom:**
  - the school admin appoints the registrar, bursar, teachers and staff;
  - the registrar enrols students, issues their credentials and invites
    parents, linked to their children.
- **Students (D4):**
  - the registrar issues an admission number with a password or PIN;
  - students sign in on the school page and must change it the first
    time;
  - repeated failures lock the account, and a teacher can unlock it;
  - no email is ever sent to a student.
- **Until SMTP (#14) is configured,** invites show a code or link for
  the inviter to share. Afterwards they are emailed.

## 6. Delivery (PRs into `m2`, in order)

1. **Schema and migration SQL**, rehearsed on local Postgres. *This is
   the PR to review most carefully.*
2. **Permissions:** `requirePermission`, scoping helpers, and moving
   every route over.
3. **Platform console** and invite-only onboarding, with atomic invites.
4. **School-admin tools:** staff appointments, sessions and terms,
   classes, subjects, teaching assignments, assessment scheme.
5. **Role dashboards:**
   - registrar: students, enrolments, guardians;
   - bursar: fees;
   - teacher: scores by component, attendance;
   - parent and student: views.
6. **Student credentials** (password or PIN) and lockout.
7. **Isolation tests and audit log.**
8. **Switch-over** (section 2).

Each PR includes its own verification. Nothing touches production before
step 8, and step 8 waits for your go-ahead.
