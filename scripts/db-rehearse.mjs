/**
 * Rehearse the M2 database migrations on a throwaway local Postgres
 * (docs/m2-plan.md §2). Never touches production: it refuses any database
 * that isn't on localhost.
 *
 *   docker run -d --name philos-rehearsal -e POSTGRES_PASSWORD=rehearsal \
 *     -p 55432:5432 postgres:17.6            # same major/minor as Supabase
 *   npm run db:rehearse
 *
 * Steps:
 *   1. Wipe the local database; add a stub `auth.users` (Supabase has the real one).
 *   2. Recreate the v1 schema and test-sized data like production's.
 *   3. Apply drizzle/ migrations (0000 drop v1, 0001 v2, 0002 auth FK + RLS).
 *   4. Apply them again: must be a no-op.
 *   5. Check the rules the app will rely on (each inside a rolled-back transaction).
 *   6. Prove the 0000 guard refuses to drop real-looking data.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const URL_ = process.env.REHEARSAL_DATABASE_URL ?? "postgres://postgres:rehearsal@localhost:55432/postgres";
const host = new URL(URL_).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
  console.error(`Refusing to run: ${host} is not a local database.`);
  process.exit(2);
}

const sql = postgres(URL_, { onnotice: () => {} });
let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${msg}`);
  if (!cond) failures += 1;
};

/** Run drizzle-kit against the local DB only. */
function drizzle(args) {
  return execFileSync("npx", ["drizzle-kit", ...args], {
    env: { ...process.env, DATABASE_URL: URL_ },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function resetToV1({ schools = 1 } = {}) {
  await sql.unsafe(`
    drop schema if exists public cascade; create schema public;
    drop schema if exists auth cascade; create schema auth;
    create table auth.users (id uuid primary key);
  `);
  drizzle(["push", "--dialect=postgresql", "--schema=./src/lib/db/schema.ts", `--url=${URL_}`, "--force"]);
  // Test-sized data, like production at planning time.
  for (let i = 0; i < schools; i++) {
    await sql`insert into tenants (name, curriculum, created_at) values (${"Test School " + i}, 'waec_neco', 0)`;
  }
  const uid = randomUUID();
  await sql`insert into auth.users (id) values (${uid})`;
  await sql`insert into users (id, email, role) values (${uid}, 'owner@example.com', 'super_admin')`;
}

/** Expect a statement to fail with a constraint error; roll everything back. */
async function rejects(label, fn) {
  let error = null;
  try {
    await sql.begin(async (tx) => {
      await fn(tx);
      throw new Error("__no_error__");
    });
  } catch (e) {
    error = e;
  }
  const rejected = error && error.message !== "__no_error__";
  ok(rejected, `${label}${rejected ? ` → ${error.constraint_name ?? error.message}` : " (was accepted!)"}`);
}

async function accepts(label, fn) {
  try {
    await sql.begin(async (tx) => {
      await fn(tx);
      throw new Error("__rollback__");
    });
  } catch (e) {
    ok(e.message === "__rollback__", `${label}${e.message === "__rollback__" ? "" : ` → ${e.message}`}`);
  }
}

try {
  // 1–3: v1 → v2
  await resetToV1();
  drizzle(["migrate", "--config=drizzle.v2.config.ts"]);
  const tables = (await sql`select tablename from pg_tables where schemaname='public' order by 1`).map((r) => r.tablename);
  ok(!tables.includes("tenants") && tables.includes("schools") && tables.includes("memberships"), `v1 dropped, v2 created (${tables.length} tables)`);
  const noRls = await sql`select tablename from pg_tables where schemaname='public' and not rowsecurity`;
  ok(noRls.length === 0, `Row Level Security on every table${noRls.length ? `; missing: ${noRls.map((r) => r.tablename)}` : ""}`);
  const [{ n: fks }] = await sql`select count(*)::int n from information_schema.table_constraints where constraint_schema='public' and constraint_type='FOREIGN KEY'`;
  ok(fks >= 70, `foreign keys present (${fks})`);

  // 4: idempotent
  drizzle(["migrate", "--config=drizzle.v2.config.ts"]);
  const [{ n: applied }] = await sql`select count(*)::int n from public.__migrations`;
  ok(applied === 3, `re-running migrate is a no-op (${applied} migrations recorded)`);

  // 5: rules
  const u1 = randomUUID(), u2 = randomUUID();
  await sql`insert into auth.users (id) values (${u1}), (${u2})`;
  await sql`insert into users (id, email) values (${u1}, 'Head@School.ng'), (${u2}, 'teacher@school.ng')`;
  const [s] = await sql`insert into schools (name, slug, curriculum) values ('Greenfield College', 'greenfield', 'waec_neco') returning id`;
  const [s2] = await sql`insert into schools (name, slug, curriculum) values ('Other School', 'other-school', 'cambridge') returning id`;
  await sql`insert into memberships (school_id, user_id, role) values (${s.id}, ${u1}, 'school_admin')`;

  await rejects("user without an auth account", (tx) => tx`insert into users (id, email) values (${randomUUID()}, 'ghost@x.ng')`);
  await rejects("duplicate email, any case", (tx) => tx`insert into auth.users (id) values (${randomUUID()}) returning id`.then(([a]) => tx`insert into users (id, email) values (${a.id}, 'head@school.ng')`));
  await rejects("unknown platform role", (tx) => tx`update users set platform_role = 'god' where id = ${u1}`);
  await rejects("bad school slug", (tx) => tx`insert into schools (name, slug, curriculum) values ('X', 'Bad Slug!', 'waec_neco')`);
  await rejects("unknown curriculum", (tx) => tx`insert into schools (name, slug, curriculum) values ('X', 'x-school', 'mars')`);
  await rejects("unknown school role", (tx) => tx`insert into memberships (school_id, user_id, role) values (${s.id}, ${u2}, 'janitor')`);
  await rejects("second ACTIVE membership for one person", (tx) => tx`insert into memberships (school_id, user_id, role) values (${s2.id}, ${u1}, 'teacher')`);
  await accepts("an inactive extra membership is allowed (multi-school later)", (tx) => tx`insert into memberships (school_id, user_id, role, status) values (${s2.id}, ${u1}, 'parent', 'suspended')`);

  const exp = new Date(Date.now() + 86400000);
  await rejects("student invite (students get credentials)", (tx) => tx`insert into invites (school_id, email, role, code_hash, expires_at) values (${s.id}, 'a@b.ng', 'student', 'h1', ${exp})`);
  await accepts("invite redeemed only once (#5)", async (tx) => {
    const [inv] = await tx`insert into invites (school_id, email, role, code_hash, expires_at) values (${s.id}, 'teacher@school.ng', 'teacher', 'h2', ${exp}) returning id`;
    const first = await tx`update invites set used_at = now(), used_by = ${u2} where id = ${inv.id} and used_at is null and expires_at > now() returning id`;
    const second = await tx`update invites set used_at = now(), used_by = ${u2} where id = ${inv.id} and used_at is null and expires_at > now() returning id`;
    if (first.length !== 1 || second.length !== 0) throw new Error(`redeemed ${first.length} then ${second.length}`);
  });

  const [sess] = await sql`insert into academic_sessions (school_id, name, starts_on, ends_on, is_current) values (${s.id}, '2026/2027', '2026-09-07', '2027-07-23', true) returning id`;
  await rejects("second current session in a school", (tx) => tx`insert into academic_sessions (school_id, name, starts_on, ends_on, is_current) values (${s.id}, '2027/2028', '2027-09-06', '2028-07-21', true)`);
  await rejects("session ending before it starts", (tx) => tx`insert into academic_sessions (school_id, name, starts_on, ends_on) values (${s.id}, 'bad', '2027-01-01', '2026-01-01')`);
  const [term] = await sql`insert into terms (school_id, session_id, number, starts_on, ends_on, is_current) values (${s.id}, ${sess.id}, 1, '2026-09-07', '2026-12-11', true) returning id`;
  await rejects("fourth term", (tx) => tx`insert into terms (school_id, session_id, number, starts_on, ends_on) values (${s.id}, ${sess.id}, 4, '2027-05-01', '2027-07-01')`);
  await rejects("two First Terms in one session", (tx) => tx`insert into terms (school_id, session_id, number, starts_on, ends_on) values (${s.id}, ${sess.id}, 1, '2026-09-07', '2026-12-11')`);

  const [cls] = await sql`insert into classes (school_id, level, arm, name) values (${s.id}, 'JSS 2', 'Gold', 'JSS 2 Gold') returning id`;
  const [subj] = await sql`insert into subjects (school_id, name) values (${s.id}, 'Mathematics') returning id`;
  await rejects("duplicate subject name, any case", (tx) => tx`insert into subjects (school_id, name) values (${s.id}, 'MATHEMATICS')`);
  const [stu] = await sql`insert into students (school_id, admission_no, first_name, last_name) values (${s.id}, 'GF/2026/001', 'Adaeze', 'Okafor') returning id`;
  await rejects("duplicate admission number in a school", (tx) => tx`insert into students (school_id, admission_no, first_name, last_name) values (${s.id}, 'gf/2026/001', 'B', 'C')`);
  await accepts("same admission number in another school", (tx) => tx`insert into students (school_id, admission_no, first_name, last_name) values (${s2.id}, 'GF/2026/001', 'B', 'C')`);
  await sql`insert into enrollments (school_id, student_id, class_id, session_id) values (${s.id}, ${stu.id}, ${cls.id}, ${sess.id})`;
  await rejects("two classes for one student in one session", (tx) => tx`insert into enrollments (school_id, student_id, class_id, session_id) values (${s.id}, ${stu.id}, ${cls.id}, ${sess.id})`);
  await rejects("deleting a class that has enrolments", (tx) => tx`delete from classes where id = ${cls.id}`);

  await sql`insert into scores (school_id, student_id, subject_id, term_id, component, score) values (${s.id}, ${stu.id}, ${subj.id}, ${term.id}, 'ca1', 18)`;
  await rejects("the same mark entered twice", (tx) => tx`insert into scores (school_id, student_id, subject_id, term_id, component, score) values (${s.id}, ${stu.id}, ${subj.id}, ${term.id}, 'ca1', 15)`);
  await rejects("negative score", (tx) => tx`update scores set score = -1`);
  await sql`insert into attendance (school_id, student_id, term_id, date, status) values (${s.id}, ${stu.id}, ${term.id}, '2026-09-08', 'present')`;
  await rejects("two attendance records for one day", (tx) => tx`insert into attendance (school_id, student_id, date, status) values (${s.id}, ${stu.id}, '2026-09-08', 'absent')`);
  await rejects("unknown attendance status", (tx) => tx`insert into attendance (school_id, student_id, date, status) values (${s.id}, ${stu.id}, '2026-09-09', 'sleeping')`);

  await rejects("approved comment without final text", (tx) => tx`insert into report_comments (school_id, student_id, term_id, draft, status, approved_at) values (${s.id}, ${stu.id}, ${term.id}, 'x', 'approved', now())`);
  await rejects("material with a javascript: link", (tx) => tx`insert into study_materials (school_id, class_id, title, file_url, file_type) values (${s.id}, ${cls.id}, 'x', 'javascript:alert(1)', 'LINK')`);

  const [fee] = await sql`insert into fee_schedules (school_id, term_id, title, amount_kobo, due_on) values (${s.id}, ${term.id}, 'Tuition', 15000000, '2026-09-30') returning id`;
  await rejects("zero fee", (tx) => tx`insert into fee_schedules (school_id, term_id, title, amount_kobo, due_on) values (${s.id}, ${term.id}, 'Free', 0, '2026-09-30')`);
  const [inv] = await sql`insert into invoices (school_id, student_id, fee_schedule_id, term_id, title, amount_kobo, due_on) values (${s.id}, ${stu.id}, ${fee.id}, ${term.id}, 'Tuition', 15000000, '2026-09-30') returning id`;
  await rejects("second live invoice for the same fee", (tx) => tx`insert into invoices (school_id, student_id, fee_schedule_id, title, amount_kobo, due_on) values (${s.id}, ${stu.id}, ${fee.id}, 'Tuition', 15000000, '2026-09-30')`);
  await rejects("paid more than the invoice", (tx) => tx`update invoices set paid_amount_kobo = 15000001 where id = ${inv.id}`);
  await sql`insert into payments (school_id, student_id, invoice_id, amount_kobo, description, reference) values (${s.id}, ${stu.id}, ${inv.id}, 15000000, 'Tuition', 'PE-1')`;
  await rejects("duplicate payment reference", (tx) => tx`insert into payments (school_id, student_id, amount_kobo, description, reference) values (${s.id}, ${stu.id}, 100, 'x', 'PE-1')`);
  await rejects("deleting a student who has payments", (tx) => tx`delete from students where id = ${stu.id}`);

  await sql`insert into audit_log (school_id, actor_id, action) values (${s.id}, ${u1}, 'membership.role_changed')`;
  await rejects("editing the audit log", (tx) => tx`update audit_log set action = 'nothing'`);
  await rejects("deleting from the audit log", (tx) => tx`delete from audit_log`);
  await accepts("deleting the auth user removes their profile and memberships", async (tx) => {
    await tx`delete from auth.users where id = ${u1}`;
    const left = await tx`select 1 from memberships where user_id = ${u1}`;
    if (left.length) throw new Error("membership survived");
  });

  // 6: guard. drizzle-kit hides database error messages, so check both that
  // the guard block itself raises the expected error and that a full migrate
  // fails without dropping anything.
  await resetToV1({ schools: 2 });
  const guardBlock = readFileSync("drizzle/0000_reset_v1.sql", "utf8").split("--> statement-breakpoint")[0];
  let guardMessage = "";
  try {
    await sql.unsafe(guardBlock);
  } catch (e) {
    guardMessage = e.message;
  }
  ok(/refusing to drop/.test(guardMessage), `0000 guard raises on real-looking data → "${guardMessage.slice(0, 60)}…"`);
  let migrateFailed = false;
  try {
    drizzle(["migrate", "--config=drizzle.v2.config.ts"]);
  } catch {
    migrateFailed = true;
  }
  const [{ n: v1Schools }] = await sql`select count(*)::int n from tenants`;
  const [{ v2 }] = await sql`select to_regclass('public.schools') as v2`;
  ok(migrateFailed && v1Schools === 2 && v2 === null, "full migrate stops there: v1 data intact, no v2 tables created");
} finally {
  await sql.end();
}

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll rehearsal checks passed.");
process.exit(failures ? 1 : 0);
