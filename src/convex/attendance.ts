import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTeacherOrAdmin, requireTenantMember, assertTenantResource } from "./helpers";
import { ROLES } from "./schema";

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export const getAttendanceByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTeacherOrAdmin(ctx);
    return await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .collect();
  },
});

/** Attendance for a single student, restricted to staff, the student, or their parent. */
export const getAttendanceForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const { userId, tenantId, user } = await requireTenantMember(ctx);
    const student = await assertTenantResource(
      await ctx.db.get(args.studentId),
      tenantId,
      "That student",
    );
    const isStaff =
      user.role === ROLES.ADMIN || user.role === ROLES.TEACHER;
    const isSelf = student.userId === userId;
    const isParent = student.parentId === userId;
    if (!isStaff && !isSelf && !isParent) {
      throw new Error("You can't view that student's attendance.");
    }
    return await ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .order("desc")
      .collect();
  },
});

/**
 * Mark (or update) a student's attendance for a date. Writing the same
 * student/date pair twice replaces the earlier record.
 */
export const markAttendance = mutation({
  args: {
    studentId: v.id("students"),
    date: v.string(), // YYYY-MM-DD
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireTeacherOrAdmin(ctx);
    const student = await ctx.db.get(args.studentId);
    await assertTenantResource(student, tenantId, "That student");
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_student_date", (q) =>
        q.eq("studentId", args.studentId).eq("date", args.date),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        markedBy: userId,
        timestamp: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("attendance", {
      studentId: args.studentId,
      date: args.date,
      status: args.status,
      markedBy: userId,
      timestamp: Date.now(),
      tenantId,
    });
  },
});