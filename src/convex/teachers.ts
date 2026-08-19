import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import {
  requireTenantMember,
  requireAdmin,
  requireRole,
  assertTenantResource,
} from "./helpers";
import { ROLES } from "./schema";

// ---------------------------------------------------------------------------
// Teacher queries — scoped to the caller's tenant.
// ---------------------------------------------------------------------------

export const getTeachers = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireRole(ctx, [ROLES.ADMIN, ROLES.TEACHER]);
    return await ctx.db
      .query("teachers")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();
  },
});

/** The caller's own teacher profile, if they have one. */
export const getTeacherByUser = query({
  args: {},
  handler: async (ctx) => {
    const { userId, tenantId } = await requireTenantMember(ctx);
    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return teacher && teacher.tenantId === tenantId ? teacher : null;
  },
});

// ---------------------------------------------------------------------------
// Teacher mutations — admin only.
// ---------------------------------------------------------------------------

export const addTeacher = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    subject: v.optional(v.string()),
    classes: v.array(v.id("classes")),
    department: v.optional(v.string()),
    hireDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const linkedUser = await assertTenantResource(
      await ctx.db.get(args.userId),
      tenantId,
      "That user",
    );
    const existing = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    if (existing && existing.tenantId === tenantId) {
      throw new ConvexError("That user is already a teacher in your school.");
    }
    for (const classId of args.classes) {
      const cls = await ctx.db.get(classId);
      await assertTenantResource(cls, tenantId, "That class");
    }
    if (!linkedUser.role) {
      await ctx.db.patch(args.userId, { role: ROLES.TEACHER });
    }
    return await ctx.db.insert("teachers", {
      ...args,
      tenantId,
    });
  },
});

export const updateTeacher = mutation({
  args: {
    id: v.id("teachers"),
    name: v.optional(v.string()),
    subject: v.optional(v.string()),
    classes: v.optional(v.array(v.id("classes"))),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const teacher = await ctx.db.get(args.id);
    await assertTenantResource(teacher, tenantId, "That teacher");
    if (args.classes) {
      for (const classId of args.classes) {
        const cls = await ctx.db.get(classId);
        await assertTenantResource(cls, tenantId, "That class");
      }
    }
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteTeacher = mutation({
  args: { id: v.id("teachers") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const teacher = await ctx.db.get(args.id);
    await assertTenantResource(teacher, tenantId, "That teacher");
    await ctx.db.delete(args.id);
  },
});