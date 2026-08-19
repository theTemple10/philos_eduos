import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTenantMember, requireRole, assertTenantResource } from "./helpers";
import { ROLES } from "./schema";

// ---------------------------------------------------------------------------
// Transportation tracking
// ---------------------------------------------------------------------------

/** Transport records for the caller's children (parents/students) or all (admin). */
export const getMyTransportation = query({
  args: {},
  handler: async (ctx) => {
    const { userId, tenantId, user } = await requireTenantMember(ctx);
    if (user.role === ROLES.ADMIN) {
      return await ctx.db
        .query("transportation")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect();
    }
    const asParent = await ctx.db
      .query("students")
      .withIndex("by_parent", (q) => q.eq("parentId", userId))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .collect();
    const asStudent = await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .collect();
    const records = [];
    for (const student of [...asParent, ...asStudent]) {
      const row = await ctx.db
        .query("transportation")
        .withIndex("by_student", (q) => q.eq("studentId", student._id))
        .filter((q) => q.eq(q.field("tenantId"), tenantId))
        .first();
      if (row) records.push(row);
    }
    return records;
  },
});

export const addTransportation = mutation({
  args: {
    studentId: v.id("students"),
    busNumber: v.string(),
    route: v.string(),
    driverName: v.string(),
    driverPhone: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireRole(ctx, [ROLES.ADMIN, ROLES.STAFF]);
    const student = await ctx.db.get(args.studentId);
    await assertTenantResource(student, tenantId, "That student");
    return await ctx.db.insert("transportation", {
      studentId: args.studentId,
      busNumber: args.busNumber.trim(),
      route: args.route.trim(),
      driverName: args.driverName.trim(),
      driverPhone: args.driverPhone.trim(),
      status: "at_school",
      lastUpdated: Date.now(),
      tenantId,
    });
  },
});

export const updateTransportation = mutation({
  args: {
    id: v.id("transportation"),
    status: v.union(
      v.literal("at_school"),
      v.literal("in_transit"),
      v.literal("arrived"),
      v.literal("delayed"),
    ),
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireRole(ctx, [ROLES.ADMIN, ROLES.STAFF]);
    const record = await ctx.db.get(args.id);
    await assertTenantResource(record, tenantId, "That transport record");
    await ctx.db.patch(args.id, {
      status: args.status,
      location: args.location,
      lastUpdated: Date.now(),
    });
  },
});

export const deleteTransportation = mutation({
  args: { id: v.id("transportation") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireRole(ctx, [ROLES.ADMIN, ROLES.STAFF]);
    const record = await ctx.db.get(args.id);
    await assertTenantResource(record, tenantId, "That transport record");
    await ctx.db.delete(args.id);
  },
});