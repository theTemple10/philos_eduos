import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { isSchoolRole, scopeFor, type Permission, type SchoolRole, type Scope } from "./permissions";
import { CONTEXT_SQL, classScopeQuery, studentScopeQuery, type ScopeQuery } from "./scope-sql";

/**
 * Server-side access checks for the v2 schema (M2, docs/m2-plan.md §4).
 * Not used by any route yet; routes move over in later M2 PRs.
 *
 * Rules:
 * - School and role always come from the session's ACTIVE membership,
 *   never from the request body or query.
 * - A suspended school behaves as if the user had no school.
 * - Refusals reveal nothing: "not found" when a record is out of scope.
 */

export type SchoolContext = {
  userId: string;
  email: string;
  schoolId: string;
  schoolSlug: string;
  membershipId: string;
  role: SchoolRole;
};

type Denied = { ok: false; response: NextResponse };

const unauthorized = (): Denied => ({
  ok: false,
  response: NextResponse.json({ error: "You must be signed in to do that." }, { status: 401 }),
});
const forbidden = (message = "You don't have permission to do that."): Denied => ({
  ok: false,
  response: NextResponse.json({ error: message }, { status: 403 }),
});

type ContextRow = {
  user_id: string;
  email: string;
  platform_role: string | null;
  membership_id: string | null;
  role: string | null;
  school_id: string | null;
  school_slug: string | null;
  school_status: string | null;
};

async function run(query: ScopeQuery | { text: string; params: string[] }) {
  return db.$client.unsafe(query.text, query.params);
}

async function currentRow(): Promise<ContextRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const rows = (await run({ text: CONTEXT_SQL, params: [user.id] })) as unknown as ContextRow[];
  return rows[0] ?? null;
}

/** Platform console (/admin): super-admins only. */
export async function requirePlatformAdmin(): Promise<
  { ok: true; userId: string; email: string } | Denied
> {
  const row = await currentRow();
  if (!row) return unauthorized();
  if (row.platform_role !== "super_admin") return forbidden("Only platform administrators can do that.");
  return { ok: true, userId: row.user_id, email: row.email };
}

/**
 * The caller's school context, or a 401/403 response. Use
 * `requirePermission` in routes; this is for pages that only need to know
 * who is signed in and where.
 */
export async function requireSchoolContext(): Promise<{ ok: true; ctx: SchoolContext } | Denied> {
  const row = await currentRow();
  if (!row) return unauthorized();
  if (!row.membership_id || !row.school_id || row.school_status !== "active" || !isSchoolRole(row.role)) {
    return forbidden("Your account isn't linked to an active school.");
  }
  return {
    ok: true,
    ctx: {
      userId: row.user_id,
      email: row.email,
      schoolId: row.school_id,
      schoolSlug: row.school_slug ?? "",
      membershipId: row.membership_id,
      role: row.role,
    },
  };
}

/**
 * The first line of every school API route:
 *
 *   const auth = await requirePermission("scores:write");
 *   if (!auth.ok) return auth.response;
 *   if (!(await canAccessStudent(auth, studentId))) return notFound();
 */
export async function requirePermission(
  permission: Permission,
): Promise<{ ok: true; ctx: SchoolContext; scope: Scope } | Denied> {
  const result = await requireSchoolContext();
  if (!result.ok) return result;
  const scope = scopeFor(result.ctx.role, permission);
  if (!scope) return forbidden();
  return { ok: true, ctx: result.ctx, scope };
}

type Granted = { ctx: SchoolContext; scope: Scope };

/** Is this student within the caller's scope for the permission they hold? */
export async function canAccessStudent({ ctx, scope }: Granted, studentId: string): Promise<boolean> {
  const rows = await run(studentScopeQuery(scope, studentId, ctx));
  return rows.length > 0;
}

/** Is this class within the caller's scope? */
export async function canAccessClass({ ctx, scope }: Granted, classId: string): Promise<boolean> {
  const rows = await run(classScopeQuery(scope, classId, ctx));
  return rows.length > 0;
}
