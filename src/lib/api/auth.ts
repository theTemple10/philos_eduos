import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ROLES } from "@/lib/db/schema";

export type AuthedUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  tenantId: string | null;
};

export type AuthedContext = {
  userId: string;
  tenantId: string;
  user: AuthedUser;
};

function unauthorized(message = "You must be signed in to do that.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "You don't have permission to do that.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** Resolve the Supabase session and look up the user row. */
export async function requireAuth(): Promise<
  { ok: true; data: AuthedContext } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user: supaUser }, error } = await supabase.auth.getUser();
  if (error || !supaUser) {
    return { ok: false, response: unauthorized() };
  }
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, supaUser.id))
    .limit(1);
  const user = rows[0];
  if (!user) {
    return { ok: false, response: unauthorized("Your account could not be found.") };
  }
  return {
    ok: true,
    data: { userId: user.id, tenantId: user.tenantId ?? "", user },
  };
}

/** Require signed-in user who belongs to a tenant. */
export async function requireTenantMember(): Promise<
  { ok: true; data: AuthedContext } | { ok: false; response: NextResponse }
> {
  const result = await requireAuth();
  if (!result.ok) return result;
  if (!result.data.tenantId) {
    return {
      ok: false,
      response: forbidden("Your account is not linked to a school yet."),
    };
  }
  return result;
}

/** Require signed-in user with one of the specified roles. */
export async function requireRole(
  allowedRoles: string[],
): Promise<
  { ok: true; data: AuthedContext } | { ok: false; response: NextResponse }
> {
  const result = await requireTenantMember();
  if (!result.ok) return result;
  if (!result.data.user.role || !allowedRoles.includes(result.data.user.role)) {
    return { ok: false, response: forbidden() };
  }
  return result;
}

/** Require admin. */
export async function requireAdmin() {
  return requireRole([ROLES.ADMIN]);
}

/** Require teacher or admin. */
export async function requireTeacherOrAdmin() {
  return requireRole([ROLES.TEACHER, ROLES.ADMIN]);
}

/** Require super_admin. */
export async function requireSuperAdmin() {
  const result = await requireAuth();
  if (!result.ok) return result;
  if (result.data.user.role !== ROLES.SUPER_ADMIN) {
    return { ok: false, response: forbidden("Only platform administrators can do that.") };
  }
  return result;
}

/** Verify a resource belongs to the caller's tenant. */
export function assertTenantResource<T extends { tenantId?: unknown }>(
  resource: T | null | undefined,
  tenantId: string,
  label = "That record",
): T | NextResponse {
  if (!resource || resource.tenantId !== tenantId) {
    return notFound(`${label} could not be found in your school.`);
  }
  return resource;
}

/** Look up user by id from the users table. */
export async function getUserById(id: string): Promise<AuthedUser | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Look up tenant by id. */
export async function getTenantById(id: string) {
  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export { NextResponse };
