import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// User roles for the multi-tenant school management system
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  STAFF: "staff",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.SUPER_ADMIN),
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.TEACHER),
  v.literal(ROLES.STUDENT),
  v.literal(ROLES.PARENT),
  v.literal(ROLES.STAFF),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // Default auth tables using convex auth
    ...authTables, // do not remove or modify

    // Users table with role-based access
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      tenantId: v.optional(v.id("tenants")), // For multi-tenant support
    }).index("email", ["email"])
      .index("by_tenant", ["tenantId"]),

    // Tenants (schools/institutions)
    tenants: defineTable({
      name: v.string(),
      domain: v.optional(v.string()),
      logo: v.optional(v.string()),
      settings: v.optional(v.any()),
      createdAt: v.number(),
    }).index("by_domain", ["domain"]),

    // Students linked to users and classes
    students: defineTable({
      userId: v.optional(v.id("users")),
      name: v.string(),
      classId: v.id("classes"),
      parentId: v.optional(v.id("users")),
      tenantId: v.id("tenants"),
      studentId: v.string(), // Unique student identifier
      enrollmentDate: v.string(),
      status: v.union(v.literal("active"), v.literal("inactive"), v.literal("graduated")),
    }).index("by_class", ["classId"])
      .index("by_user", ["userId"])
      .index("by_parent", ["parentId"])
      .index("by_tenant", ["tenantId"])
      .index("by_student_id", ["studentId"]),

    // Teachers linked to users
    teachers: defineTable({
      userId: v.id("users"),
      name: v.string(),
      subject: v.optional(v.string()),
      classes: v.array(v.id("classes")),
      tenantId: v.id("tenants"),
      department: v.optional(v.string()),
      hireDate: v.string(),
    }).index("by_user", ["userId"])
      .index("by_tenant", ["tenantId"]),

    // Classes
    classes: defineTable({
      name: v.string(),
      gradeLevel: v.string(),
      teacherId: v.optional(v.id("users")),
      tenantId: v.id("tenants"),
      room: v.optional(v.string()),
      capacity: v.number(),
    }).index("by_tenant", ["tenantId"]),

    // Attendance records
    attendance: defineTable({
      studentId: v.id("students"),
      date: v.string(), // YYYY-MM-DD
      status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
      markedBy: v.id("users"),
      timestamp: v.number(),
    }).index("by_student_date", ["studentId", "date"])
      .index("by_date", ["date"]),

    // Grades and academic performance
    grades: defineTable({
      studentId: v.id("students"),
      subject: v.string(),
      score: v.number(),
      maxScore: v.number(),
      date: v.string(),
      gradedBy: v.id("users"),
      comments: v.optional(v.string()),
    }).index("by_student", ["studentId"])
      .index("by_student_subject", ["studentId", "subject"]),

    // Announcements
    announcements: defineTable({
      title: v.string(),
      content: v.string(),
      target: v.union(
        v.literal("all"),
        v.literal("teachers"),
        v.literal("students"),
        v.literal("parents"),
        v.literal("staff"),
      ),
      authorId: v.id("users"),
      tenantId: v.id("tenants"),
      createdAt: v.number(),
      attachments: v.optional(v.array(v.string())),
    }).index("by_tenant", ["tenantId"]),

    // Study materials
    studyMaterials: defineTable({
      title: v.string(),
      description: v.optional(v.string()),
      subject: v.string(),
      classId: v.id("classes"),
      uploadedBy: v.id("users"),
      tenantId: v.id("tenants"),
      fileUrl: v.string(),
      fileType: v.string(), // pdf, doc, video, etc.
      createdAt: v.number(),
    }).index("by_class", ["classId"])
      .index("by_tenant", ["tenantId"])
      .index("by_subject", ["subject"]),

    // Transportation tracking
    transportation: defineTable({
      studentId: v.id("students"),
      busNumber: v.string(),
      route: v.string(),
      driverName: v.string(),
      driverPhone: v.string(),
      status: v.union(
        v.literal("at_school"),
        v.literal("in_transit"),
        v.literal("arrived"),
        v.literal("delayed"),
      ),
      lastUpdated: v.number(),
      location: v.optional(v.object({
        latitude: v.number(),
        longitude: v.number(),
      })),
      tenantId: v.id("tenants"),
    }).index("by_student", ["studentId"])
      .index("by_tenant", ["tenantId"]),

    // Messages and comments
    messages: defineTable({
      senderId: v.id("users"),
      receiverId: v.id("users"),
      content: v.string(),
      read: v.boolean(),
      createdAt: v.number(),
      tenantId: v.id("tenants"),
    }).index("by_sender", ["senderId"])
      .index("by_receiver", ["receiverId"])
      .index("by_tenant", ["tenantId"]),

    // Comments on content
    comments: defineTable({
      authorId: v.id("users"),
      content: v.string(),
      targetType: v.union(
        v.literal("announcement"),
        v.literal("study_material"),
        v.literal("grade"),
      ),
      targetId: v.string(),
      createdAt: v.number(),
      tenantId: v.id("tenants"),
    }).index("by_target", ["targetType", "targetId"])
      .index("by_tenant", ["tenantId"]),

    // Payments and transactions
    payments: defineTable({
      studentId: v.id("students"),
      amount: v.number(),
      currency: v.string(),
      description: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("refunded"),
      ),
      paymentMethod: v.optional(v.string()),
      createdAt: v.number(),
      tenantId: v.id("tenants"),
    }).index("by_student", ["studentId"])
      .index("by_tenant", ["tenantId"]),

    // Notifications
    notifications: defineTable({
      userId: v.id("users"),
      title: v.string(),
      message: v.string(),
      read: v.boolean(),
      type: v.union(
        v.literal("info"),
        v.literal("warning"),
        v.literal("success"),
        v.literal("error"),
      ),
      createdAt: v.number(),
      tenantId: v.id("tenants"),
    }).index("by_user", ["userId"])
      .index("by_tenant", ["tenantId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
