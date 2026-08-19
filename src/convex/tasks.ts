import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTenantMember, requireAdmin, assertTenantResource } from "./helpers";
import { ROLES } from "./schema";

// ---------------------------------------------------------------------------
// Staff tasks
// ---------------------------------------------------------------------------

/** Tasks assigned to the caller (staff) or all tasks in the tenant (admin). */
export const getMyTasks = query({
  args: {},
  handler: async (ctx) => {
    const { userId, tenantId, user } = await requireTenantMember(ctx);
    if (user.role === ROLES.ADMIN) {
      return await ctx.db
        .query("tasks")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("tasks")
      .withIndex("by_assigned", (q) => q.eq("assignedTo", userId))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .order("desc")
      .collect();
  },
});

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireAdmin(ctx);
    if (args.assignedTo) {
      const assignee = await ctx.db.get(args.assignedTo);
      await assertTenantResource(assignee, tenantId, "That user");
    }
    return await ctx.db.insert("tasks", {
      ...args,
      title: args.title.trim(),
      status: "pending",
      createdBy: userId,
      tenantId,
      createdAt: Date.now(),
    });
  },
});

export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"))),
    dueDate: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { tenantId, user, userId } = await requireTenantMember(ctx);
    const task = await assertTenantResource(
      await ctx.db.get(args.id),
      tenantId,
      "That task",
    );
    const isAdmin = user.role === ROLES.ADMIN;
    const isAssignee = task.assignedTo === userId;
    if (!isAdmin && !isAssignee) {
      throw new Error("You can only update tasks assigned to you.");
    }
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const task = await ctx.db.get(args.id);
    await assertTenantResource(task, tenantId, "That task");
    await ctx.db.delete(args.id);
  },
});