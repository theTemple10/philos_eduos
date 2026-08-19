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
// Student queries — every read is scoped to the caller's tenant.
// ---------------------------------------------------------------------------

export const getStudents = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireRole(ctx, [ROLES.ADMIN, ROLES.TEACHER]);
    return await ctx.db
      .query("students")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();
  },
});

export const getStudentsByClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireRole(ctx, [ROLES.ADMIN, ROLES.TEACHER]);
    const cls = await ctx.db.get(args.classId);
    await assertTenantResource(cls, tenantId, "That class");
    return await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .collect();
  },
});

/** The caller's own student profile, if they have one. */
export const getStudentByUser = query({
  args: {},
  handler: async (ctx) => {
    const { userId, tenantId } = await requireTenantMember(ctx);
    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return student && student.tenantId === tenantId ? student : null;
  },
});

export const getStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireRole(ctx, [ROLES.ADMIN, ROLES.TEACHER]);
    return await assertTenantResource(
      await ctx.db.get(args.studentId),
      tenantId,
      "That student",
    );
  },
});

// ---------------------------------------------------------------------------
// Student mutations — admin only, writes validated against the tenant.
// ---------------------------------------------------------------------------

export const addStudent = mutation({
  args: {
    name: v.string(),
    classId: v.id("classes"),
    userId: v.optional(v.id("users")),
    parentId: v.optional(v.id("users")),
    studentId: v.string(),
    enrollmentDate: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("graduated")),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const cls = await ctx.db.get(args.classId);
    await assertTenantResource(cls, tenantId, "That class");
    for (const link of [args.userId, args.parentId]) {
      if (!link) continue;
      const linked = await ctx.db.get(link);
      await assertTenantResource(linked, tenantId, "That linked user");
    }
    const existing = await ctx.db
      .query("students")
      .withIndex("by_student_id", (q) => q.eq("studentId", args.studentId.trim()))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .first();
    if (existing) {
      throw new ConvexError("A student with that ID already exists in your school.");
    }
    return await ctx.db.insert("students", {
      ...args,
      tenantId,
      studentId: args.studentId.trim(),
    });
  },
});

export const updateStudent = mutation({
  args: {
    id: v.id("students"),
    name: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
    userId: v.optional(v.id("users")),
    parentId: v.optional(v.id("users")),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("graduated"))),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const student = await ctx.db.get(args.id);
    await assertTenantResource(student, tenantId, "That student");
    if (args.classId) {
      const cls = await ctx.db.get(args.classId);
      await assertTenantResource(cls, tenantId, "That class");
    }
    for (const link of [args.userId, args.parentId]) {
      if (!link) continue;
      const linked = await ctx.db.get(link);
      await assertTenantResource(linked, tenantId, "That linked user");
    }
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteStudent = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const student = await ctx.db.get(args.id);
    await assertTenantResource(student, tenantId, "That student");
    await ctx.db.delete(args.id);
  },
});