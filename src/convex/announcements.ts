import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTenantMember, requireRole, assertTenantResource } from "./helpers";
import { ROLES } from "./schema";

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export const getAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId, user } = await requireTenantMember(ctx);
    const all = await ctx.db
      .query("announcements")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
    // Everyone sees "all"; role-specific targets only reach matching roles.
    return all.filter((a) => a.target === "all" || a.target === user.role);
  },
});

export const addAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    target: v.union(
      v.literal("all"),
      v.literal("teachers"),
      v.literal("students"),
      v.literal("parents"),
      v.literal("staff"),
    ),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireRole(ctx, [
      ROLES.ADMIN,
      ROLES.TEACHER,
      ROLES.STAFF,
    ]);
    const title = args.title.trim();
    const content = args.content.trim();
    if (!title || !content) {
      throw new Error("Announcements need a title and some content.");
    }
    return await ctx.db.insert("announcements", {
      title,
      content,
      target: args.target,
      authorId: userId,
      tenantId,
      createdAt: Date.now(),
      attachments: args.attachments,
    });
  },
});

export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireRole(ctx, [ROLES.ADMIN, ROLES.TEACHER]);
    const announcement = await ctx.db.get(args.id);
    await assertTenantResource(announcement, tenantId, "That announcement");
    await ctx.db.delete(args.id);
  },
});