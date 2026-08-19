import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import {
  requireTenantMember,
  requireTeacherOrAdmin,
  assertTenantResource,
} from "./helpers";
import { ROLES } from "./schema";

// ---------------------------------------------------------------------------
// Grades
// ---------------------------------------------------------------------------

/**
 * Grades for a single student, restricted to staff, the student, or their
 * parent.
 */
export const getGradesByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const { userId, tenantId, user } = await requireTenantMember(ctx);
    const student = await assertTenantResource(
      await ctx.db.get(args.studentId),
      tenantId,
      "That student",
    );
    const isStaff = user.role === ROLES.ADMIN || user.role === ROLES.TEACHER;
    const isSelf = student.userId === userId;
    const isParent = student.parentId === userId;
    if (!isStaff && !isSelf && !isParent) {
      throw new Error("You can't view that student's grades.");
    }
    return await ctx.db
      .query("grades")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .order("desc")
      .collect();
  },
});

/** The caller's own grades, when the caller has a student profile. */
export const getMyGrades = query({
  args: {},
  handler: async (ctx) => {
    const { userId, tenantId } = await requireTenantMember(ctx);
    const student = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!student || student.tenantId !== tenantId) return [];
    return await ctx.db
      .query("grades")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .order("desc")
      .collect();
  },
});

export const addGrade = mutation({
  args: {
    studentId: v.id("students"),
    subject: v.string(),
    score: v.number(),
    maxScore: v.number(),
    date: v.string(),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireTeacherOrAdmin(ctx);
    const student = await ctx.db.get(args.studentId);
    await assertTenantResource(student, tenantId, "That student");
    return await ctx.db.insert("grades", {
      studentId: args.studentId,
      subject: args.subject.trim(),
      score: args.score,
      maxScore: args.maxScore,
      date: args.date,
      gradedBy: userId,
      comments: args.comments,
      tenantId,
    });
  },
});

export const updateGrade = mutation({
  args: {
    id: v.id("grades"),
    subject: v.optional(v.string()),
    score: v.optional(v.number()),
    maxScore: v.optional(v.number()),
    date: v.optional(v.string()),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireTeacherOrAdmin(ctx);
    const grade = await ctx.db.get(args.id);
    await assertTenantResource(grade, tenantId, "That grade");
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, gradedBy: userId });
  },
});

export const deleteGrade = mutation({
  args: { id: v.id("grades") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTeacherOrAdmin(ctx);
    const grade = await ctx.db.get(args.id);
    await assertTenantResource(grade, tenantId, "That grade");
    await ctx.db.delete(args.id);
  },
});