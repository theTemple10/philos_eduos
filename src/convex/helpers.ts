import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { ActionCtx, QueryCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { ROLES, Role } from "./schema";

/**
 * Auth + authorization helpers. Every public query/mutation must call one of
 * these before touching the database. Convex functions are callable by anyone
 * with the deployment URL, so "internal" is never a valid excuse.
 *
 * The Ctx helpers accept query and mutation ctx (both expose db + auth).
 * Actions have no direct DB access; use requireActionAuth instead.
 */
export type Ctx = {
  db: QueryCtx["db"];
  auth: QueryCtx["auth"];
};

export type AuthedContext = {
  userId: Id<"users">;
  tenantId: Id<"tenants">;
  user: Doc<"users">;
};

/**
 * Auth helper for actions. Actions cannot read the DB directly, so the user
 * is resolved through the public currentUser query, which runs in the same
 * session as the action.
 */
export async function requireActionAuth(ctx: ActionCtx): Promise<AuthedContext> {
  const user = await ctx.runQuery(api.users.currentUser);
  if (!user) {
    throw new ConvexError("You must be signed in to do that.");
  }
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw new ConvexError("Your account is not linked to a school yet.");
  }
  return { userId: user._id, tenantId, user };
}

async function resolveUser(ctx: Ctx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("You must be signed in to do that.");
  }
  const user = (await ctx.db.get(userId)) as Doc<"users"> | null;
  if (!user) {
    throw new ConvexError("Your account could not be found.");
  }
  return { userId, user };
}

/** Require a signed-in user. Does not require a tenant. */
export async function requireAuth(ctx: Ctx) {
  return resolveUser(ctx);
}

/** Require a signed-in user who belongs to a tenant. */
export async function requireTenantMember(ctx: Ctx): Promise<AuthedContext> {
  const { userId, user } = await resolveUser(ctx);
  const tenantId = user.tenantId;
  if (!tenantId) {
    throw new ConvexError("Your account is not linked to a school yet.");
  }
  const tenant = await ctx.db.get(tenantId);
  if (!tenant) {
    throw new ConvexError("Your school could not be found.");
  }
  return { userId, tenantId, user };
}

/** Require a signed-in user whose role is one of the allowed roles. */
export async function requireRole(
  ctx: Ctx,
  roles: Role[],
): Promise<AuthedContext> {
  const { userId, tenantId, user } = await requireTenantMember(ctx);
  if (!user.role || !roles.includes(user.role)) {
    throw new ConvexError("You don't have permission to do that.");
  }
  return { userId, tenantId, user };
}

/** Require an admin (school admin) of the caller's tenant. */
export async function requireAdmin(ctx: Ctx): Promise<AuthedContext> {
  return requireRole(ctx, [ROLES.ADMIN]);
}

/** Require a platform super admin. */
export async function requireSuperAdmin(ctx: Ctx) {
  const { userId, user } = await requireAuth(ctx);
  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new ConvexError("Only platform administrators can do that.");
  }
  return { userId, user };
}

/** Require a teacher or admin (roles that can mark attendance/grades). */
export async function requireTeacherOrAdmin(ctx: Ctx): Promise<AuthedContext> {
  return requireRole(ctx, [ROLES.TEACHER, ROLES.ADMIN]);
}

/** Verify a resource belongs to the caller's tenant, or throw. */
export async function assertTenantResource<T extends { tenantId?: unknown }>(
  resource: T | null | undefined,
  tenantId: string,
  label = "That record",
) {
  if (!resource || resource.tenantId !== tenantId) {
    throw new ConvexError(`${label} could not be found in your school.`);
  }
  return resource as T;
}