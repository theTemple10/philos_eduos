import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

export const getStudents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").collect();
  },
});

export const addStudent = mutation({
  args: {
    name: v.string(),
    classId: v.id("classes"),
    userId: v.optional(v.id("users")),
    parentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("students", args);
  },
});

export const updateStudent = mutation({
  args: {
    id: v.id("students"),
    name: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
    userId: v.optional(v.id("users")),
    parentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteStudent = mutation({
  args: { id: v.id("students") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
