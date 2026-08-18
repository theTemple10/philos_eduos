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

export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    return user?.role || null;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("teacher"),
      v.literal("student"),
      v.literal("parent"),
      v.literal("staff")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

// Auto-assign role based on email domain for new users
export const assignRoleOnSignup = mutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.role) return; // Already has a role

    let role: "admin" | "teacher" | "student" | "parent" | "staff" = "student";

    // Assign role based on email domain
    if (args.email.includes("@philos-eduos.com")) {
      role = "admin";
    } else if (args.email.includes("@teacher.")) {
      role = "teacher";
    } else if (args.email.includes("@parent.")) {
      role = "parent";
    } else if (args.email.includes("@staff.")) {
      role = "staff";
    }

    await ctx.db.patch(args.userId, { role });
    return role;
  },
});

// Student queries
export const getStudents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("students").collect();
  },
});

export const getStudentsByClass = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();
  },
});

export const getStudentByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const addStudent = mutation({
  args: {
    name: v.string(),
    classId: v.id("classes"),
    userId: v.optional(v.id("users")),
    parentId: v.optional(v.id("users")),
    tenantId: v.id("tenants"),
    studentId: v.string(),
    enrollmentDate: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("graduated")),
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
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("graduated"))),
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

// Teacher queries
export const getTeachers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teachers").collect();
  },
});

export const getTeacherByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const addTeacher = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    subject: v.optional(v.string()),
    classes: v.array(v.id("classes")),
    tenantId: v.id("tenants"),
    department: v.optional(v.string()),
    hireDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("teachers", args);
  },
});

// Class queries
export const getClasses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("classes").collect();
  },
});

export const addClass = mutation({
  args: {
    name: v.string(),
    gradeLevel: v.string(),
    teacherId: v.optional(v.id("users")),
    tenantId: v.id("tenants"),
    room: v.optional(v.string()),
    capacity: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("classes", args);
  },
});

// Attendance queries
export const getAttendanceByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

export const markAttendance = mutation({
  args: {
    studentId: v.id("students"),
    date: v.string(),
    status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
    markedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    return await ctx.db.insert("attendance", {
      ...args,
      timestamp,
    });
  },
});

// Grade queries
export const getGradesByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("grades")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
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
    gradedBy: v.id("users"),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("grades", args);
  },
});

// Announcement queries
export const getAnnouncements = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
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
      v.literal("staff")
    ),
    authorId: v.id("users"),
    tenantId: v.id("tenants"),
    attachments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    return await ctx.db.insert("announcements", {
      ...args,
      createdAt,
    });
  },
});

// Study materials queries
export const getStudyMaterials = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("studyMaterials")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const addStudyMaterial = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    subject: v.string(),
    classId: v.id("classes"),
    uploadedBy: v.id("users"),
    tenantId: v.id("tenants"),
    fileUrl: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    return await ctx.db.insert("studyMaterials", {
      ...args,
      createdAt,
    });
  },
});

// Transportation queries
export const getTransportationByStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transportation")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .first();
  },
});

export const updateTransportation = mutation({
  args: {
    studentId: v.id("students"),
    status: v.union(
      v.literal("at_school"),
      v.literal("in_transit"),
      v.literal("arrived"),
      v.literal("delayed")
    ),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const lastUpdated = Date.now();
    const existing = await ctx.db
      .query("transportation")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        location: args.location,
        lastUpdated,
      });
    }
  },
});

// Message queries
export const getMessages = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sent = await ctx.db
      .query("messages")
      .withIndex("by_sender", (q) => q.eq("senderId", args.userId))
      .collect();
    
    const received = await ctx.db
      .query("messages")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();
    
    return [...sent, ...received].sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const sendMessage = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    return await ctx.db.insert("messages", {
      ...args,
      read: false,
      createdAt,
    });
  },
});

// Tenant queries
export const getTenants = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tenants").collect();
  },
});

export const addTenant = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
    logo: v.optional(v.string()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    return await ctx.db.insert("tenants", {
      ...args,
      createdAt,
    });
  },
});