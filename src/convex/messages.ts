import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireTenantMember, assertTenantResource } from "./helpers";

// ---------------------------------------------------------------------------
// Messages — always scoped to the caller; receivers must be in the tenant.
// ---------------------------------------------------------------------------

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    const { userId } = await requireTenantMember(ctx);
    const sent = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", userId))
      .collect();
    const received = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", userId))
      .collect();
    return [...sent, ...received].sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const sendMessage = mutation({
  args: {
    receiverId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireTenantMember(ctx);
    const content = args.content.trim();
    if (!content) {
      throw new Error("Can't send an empty message.");
    }
    if (args.receiverId === userId) {
      throw new Error("You can't message yourself.");
    }
    const receiver = await ctx.db.get(args.receiverId);
    await assertTenantResource(receiver, tenantId, "That recipient");
    return await ctx.db.insert("messages", {
      senderId: userId,
      receiverId: args.receiverId,
      content,
      read: false,
      createdAt: Date.now(),
      tenantId,
    });
  },
});

export const markMessageRead = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireTenantMember(ctx);
    const message = await assertTenantResource(
      await ctx.db.get(args.id),
      tenantId,
      "That message",
    );
    if (message.receiverId !== userId) {
      throw new Error("You can only mark your own messages as read.");
    }
    await ctx.db.patch(args.id, { read: true });
  },
});