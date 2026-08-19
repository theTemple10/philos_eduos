import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import {
  requireTenantMember,
  requireAdmin,
  assertTenantResource,
} from "./helpers";

// ---------------------------------------------------------------------------
// Class queries — every tenant member may read their school's classes.
// ---------------------------------------------------------------------------

export const getClasses = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireTenantMember(ctx);
    return await ctx.db
      .query("classes")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("asc")
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Class mutations — admin only.
// ---------------------------------------------------------------------------

export const addClass = mutation({
  args: {
    name: v.string(),
    gradeLevel: v.string(),
    teacherId: v.optional(v.id("users")),
    room: v.optional(v.string()),
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    if (args.teacherId) {
      const teacher = await ctx.db.get(args.teacherId);
      await assertTenantResource(teacher, tenantId, "That teacher");
    }
    return await ctx.db.insert("classes", {
      ...args,
      tenantId,
    });
  },
});

export const updateClass = mutation({
  args: {
    id: v.id("classes"),
    name: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    teacherId: v.optional(v.id("users")),
    room: v.optional(v.string()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const cls = await ctx.db.get(args.id);
    await assertTenantResource(cls, tenantId, "That class");
    if (args.teacherId) {
      const teacher = await ctx.db.get(args.teacherId);
      await assertTenantResource(teacher, tenantId, "That teacher");
    }
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteClass = mutation({
  args: { id: v.id("classes") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const cls = await ctx.db.get(args.id);
    await assertTenantResource(cls, tenantId, "That class");
    const students = await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.id))
      .first();
    if (students) {
      throw new ConvexError("Move or remove the students in this class before deleting it.");
    }
    await ctx.db.delete(args.id);
  },
});