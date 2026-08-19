import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import {
  requireAuth,
  requireTenantMember,
  requireAdmin,
  requireSuperAdmin,
  assertTenantResource,
} from "./helpers";
import { ROLES, Role } from "./schema";

// ---------------------------------------------------------------------------
// Public account queries
// ---------------------------------------------------------------------------

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    return user?.role || null;
  },
});

// ---------------------------------------------------------------------------
// Tenant onboarding
// ---------------------------------------------------------------------------

/**
 * Creates the caller's school. Only callable by a signed-in user who is not
 * already part of a tenant. The creator becomes that school's admin.
 */
export const createTenant = mutation({
  args: {
    name: v.string(),
    curriculum: v.union(
      v.literal("waec_neco"),
      v.literal("cambridge"),
      v.literal("ib"),
      v.literal("american"),
    ),
  },
  handler: async (ctx, args) => {
    const { userId, user } = await requireAuth(ctx);
    if (user.tenantId) {
      throw new ConvexError("You are already part of a school.");
    }
    const name = args.name.trim();
    if (name.length < 2) {
      throw new ConvexError("Please enter your school's name.");
    }
    const tenantId = await ctx.db.insert("tenants", {
      name,
      curriculum: args.curriculum,
      createdAt: Date.now(),
    });
    await ctx.db.patch(userId, {
      role: ROLES.ADMIN,
      tenantId,
      name: user.name ?? name,
    });
    return { tenantId };
  },
});

// ---------------------------------------------------------------------------
// Invites — the only way a non-founder joins a school
// ---------------------------------------------------------------------------

function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Admin issues an invite for a specific email and role. For student/teacher
 * roles the admin supplies the profile data that is created on redemption.
 */
export const createInvite = mutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("teacher"),
      v.literal("student"),
      v.literal("parent"),
      v.literal("staff"),
    ),
    profile: v.optional(
      v.object({
        name: v.optional(v.string()),
        classId: v.optional(v.id("classes")),
        studentId: v.optional(v.string()),
        subject: v.optional(v.string()),
        department: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireAdmin(ctx);
    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) {
      throw new ConvexError("Enter a valid email address.");
    }
    if (args.role === ROLES.STUDENT) {
      if (!args.profile?.classId || !args.profile?.studentId || !args.profile?.name) {
        throw new ConvexError("Student invites need a name, class and student ID.");
      }
      const cls = await ctx.db.get(args.profile.classId);
      await assertTenantResource(cls, tenantId, "That class");
    }

    const existing = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.and(q.eq(q.field("tenantId"), tenantId), q.eq(q.field("usedAt"), undefined)))
      .first();
    if (existing) {
      throw new ConvexError("An active invite already exists for that email.");
    }

    const code = generateInviteCode();
    const createdAt = Date.now();
    await ctx.db.insert("invites", {
      email,
      role: args.role,
      tenantId,
      code,
      createdBy: userId,
      expiresAt: createdAt + INVITE_TTL_MS,
      createdAt,
      profile: args.profile,
    });
    return { code };
  },
});

/**
 * Redeems an invite code. The caller must be signed in with the invited
 * email and must not belong to a tenant yet. On redemption the user is
 * granted the invited role and, for students/teachers, their profile record
 * is created.
 */
export const redeemInvite = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const { userId, user } = await requireAuth(ctx);
    if (user.tenantId) {
      throw new ConvexError("You are already part of a school.");
    }
    const code = args.code.trim().toUpperCase();
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!invite) {
      throw new ConvexError("That invite code isn't valid.");
    }
    const callerEmail = (user.email ?? "").toLowerCase();
    if (!callerEmail || callerEmail !== invite.email.toLowerCase()) {
      throw new ConvexError("This invite is for a different email address.");
    }
    if (invite.usedAt !== undefined) {
      throw new ConvexError("This invite has already been used.");
    }
    if (invite.expiresAt < Date.now()) {
      throw new ConvexError("This invite has expired. Ask your school admin for a new one.");
    }
    const tenant = await ctx.db.get(invite.tenantId);
    if (!tenant) {
      throw new ConvexError("This invite's school no longer exists.");
    }

    await ctx.db.patch(userId, { role: invite.role, tenantId: invite.tenantId });
    await ctx.db.patch(invite._id, { usedAt: Date.now() });

    const today = new Date().toISOString().slice(0, 10);
    if (invite.role === ROLES.STUDENT) {
      const classId = invite.profile?.classId;
      if (!classId) {
        throw new ConvexError(
          "That invite is missing its class. Ask the school to resend it.",
        );
      }
      await ctx.db.insert("students", {
        userId,
        name: invite.profile?.name ?? user.name ?? "Student",
        classId,
        tenantId: invite.tenantId,
        studentId: invite.profile?.studentId ?? userId,
        enrollmentDate: today,
        status: "active",
      });
    } else if (invite.role === ROLES.TEACHER) {
      await ctx.db.insert("teachers", {
        userId,
        name: invite.profile?.name ?? user.name ?? "Teacher",
        subject: invite.profile?.subject,
        classes: [],
        tenantId: invite.tenantId,
        department: invite.profile?.department,
        hireDate: today,
      });
    }
    return { role: invite.role, tenantId: invite.tenantId };
  },
});

export const getInvites = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireAdmin(ctx);
    return await ctx.db
      .query("invites")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
  },
});

export const revokeInvite = mutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const invite = await ctx.db.get(args.inviteId);
    await assertTenantResource(invite, tenantId, "That invite");
    await ctx.db.delete(args.inviteId);
  },
});

// ---------------------------------------------------------------------------
// Role management
// ---------------------------------------------------------------------------

/**
 * Only an admin of the target user's own tenant may change that user's role,
 * and `super_admin` can never be granted through the client.
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("teacher"),
      v.literal("student"),
      v.literal("parent"),
      v.literal("staff"),
    ),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target || target.tenantId !== tenantId) {
      throw new ConvexError("That user isn't in your school.");
    }
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

/**
 * Platform-only: grants super_admin. Only callable by an existing
 * super_admin (bootstrapped via the Convex dashboard), never by a school.
 */
export const grantSuperAdmin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new ConvexError("That user doesn't exist.");
    await ctx.db.patch(args.userId, { role: ROLES.SUPER_ADMIN });
  },
});

// ---------------------------------------------------------------------------
// Tenant-scoped user listings
// ---------------------------------------------------------------------------

/** All users in the caller's tenant (admin only). */
export const getUsersInTenant = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireAdmin(ctx);
    return await ctx.db
      .query("users")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();
  },
});

/** Look up a tenant user by email, for linking profiles (admin only). */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();
    if (!user || user.tenantId !== tenantId) {
      throw new ConvexError("No user in your school has that email.");
    }
    return user;
  },
});

/** The caller's own school record. */
export const getMyTenant = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireTenantMember(ctx);
    return await ctx.db.get(tenantId);
  },
});

// ---------------------------------------------------------------------------
// Platform administration
// ---------------------------------------------------------------------------

/** All tenants (super_admin only). */
export const getTenants = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.db.query("tenants").order("desc").collect();
  },
});

/** Platform-wide user list (super_admin only). */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.db.query("users").collect();
  },
});

// Kept for type completeness; school admins manage members via invites.
export type { Role };