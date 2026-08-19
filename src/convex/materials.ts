import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import {
  requireTenantMember,
  requireRole,
  requireTeacherOrAdmin,
  assertTenantResource,
} from "./helpers";
import { ROLES } from "./schema";

// ---------------------------------------------------------------------------
// Study materials with Convex file storage
// ---------------------------------------------------------------------------

export const getStudyMaterials = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireTenantMember(ctx);
    return await ctx.db
      .query("studyMaterials")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
  },
});

/** Students and parents only see materials for their own class. */
export const getStudyMaterialsForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTenantMember(ctx);
    const student = await assertTenantResource(
      await ctx.db.get(args.studentId),
      tenantId,
      "That student",
    );
    return await ctx.db
      .query("studyMaterials")
      .withIndex("by_class", (q) => q.eq("classId", student.classId))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .order("desc")
      .collect();
  },
});

/** Get a signed upload URL so teachers/admins can upload into Convex storage. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireTeacherOrAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const addStudyMaterial = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    subject: v.string(),
    classId: v.id("classes"),
    storageId: v.id("_storage"),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireTeacherOrAdmin(ctx);
    const cls = await ctx.db.get(args.classId);
    await assertTenantResource(cls, tenantId, "That class");
    const fileUrl = await ctx.storage.getUrl(args.storageId);
    if (!fileUrl) {
      throw new ConvexError("That upload couldn't be found. Please try again.");
    }
    return await ctx.db.insert("studyMaterials", {
      title: args.title.trim(),
      description: args.description,
      subject: args.subject.trim(),
      classId: args.classId,
      uploadedBy: userId,
      tenantId,
      fileUrl,
      fileType: args.fileType,
      createdAt: Date.now(),
    });
  },
});

export const deleteStudyMaterial = mutation({
  args: { id: v.id("studyMaterials") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireRole(ctx, [ROLES.ADMIN, ROLES.TEACHER]);
    const material = await ctx.db.get(args.id);
    await assertTenantResource(material, tenantId, "That material");
    await ctx.db.delete(args.id);
  },
});