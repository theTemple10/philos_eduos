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

// Curricula a school can follow
export const CURRICULA = {
  WAEC_NECO: "waec_neco",
  CAMBRIDGE: "cambridge",
  IB: "ib",
  AMERICAN: "american",
} as const;

export const curriculumValidator = v.union(
  v.literal(CURRICULA.WAEC_NECO),
  v.literal(CURRICULA.CAMBRIDGE),
  v.literal(CURRICULA.IB),
  v.literal(CURRICULA.AMERICAN),
);
export type Curriculum = Infer<typeof curriculumValidator>;

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
      curriculum: v.optional(curriculumValidator),
      createdAt: v.number(),
    }).index("by_domain", ["domain"]),

    // Invites let an admin bring a person into the school with a fixed role.
    // The invite code is shared out-of-band; redemption is tied to the email.
    invites: defineTable({
      email: v.string(),
      role: roleValidator,
      tenantId: v.id("tenants"),
      code: v.string(),
      createdBy: v.id("users"),
      expiresAt: v.number(),
      usedAt: v.optional(v.number()),
      createdAt: v.number(),
      // Extra data needed to create the person's profile on redemption.
      profile: v.optional(
        v.object({
          name: v.optional(v.string()),
          classId: v.optional(v.id("classes")),
          studentId: v.optional(v.string()),
          subject: v.optional(v.string()),
          department: v.optional(v.string()),
        }),
      ),
    }).index("by_code", ["code"])
      .index("by_email", ["email"])
      .index("by_tenant", ["tenantId"]),

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
      tenantId: v.id("tenants"),
    }).index("by_student_date", ["studentId", "date"])
      .index("by_date", ["date"])
      .index("by_tenant", ["tenantId"]),

    // Grades and academic performance
    grades: defineTable({
      studentId: v.id("students"),
      subject: v.string(),
      score: v.number(),
      maxScore: v.number(),
      date: v.string(),
      gradedBy: v.id("users"),
      comments: v.optional(v.string()),
      tenantId: v.id("tenants"),
    }).index("by_student", ["studentId"])
      .index("by_student_subject", ["studentId", "subject"])
      .index("by_tenant", ["tenantId"]),

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
      fileUrl: v.string(), // storageId-based URL generated from Convex file storage
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

    // Fee schedules are the terms a school bills against (e.g. "Term 1 Tuition").
    feeSchedules: defineTable({
      tenantId: v.id("tenants"),
      title: v.string(),
      amountKobo: v.number(), // Naira amounts in kobo (Paystack convention) to avoid float drift
      currency: v.string(), // "NGN"
      term: v.string(),
      dueDate: v.string(), // YYYY-MM-DD
      classId: v.optional(v.id("classes")), // when set, only billed to that class
      active: v.boolean(),
      createdAt: v.number(),
    }).index("by_tenant", ["tenantId"]),

    // Invoices are concrete bills for a student against a fee schedule.
    invoices: defineTable({
      tenantId: v.id("tenants"),
      studentId: v.id("students"),
      feeScheduleId: v.optional(v.id("feeSchedules")),
      title: v.string(),
      amountKobo: v.number(),
      currency: v.string(), // "NGN"
      dueDate: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("partial"),
        v.literal("paid"),
        v.literal("cancelled"),
      ),
      paidAmountKobo: v.number(),
      reference: v.optional(v.string()), // unique Paystack reference
      createdAt: v.number(),
    }).index("by_tenant", ["tenantId"])
      .index("by_student", ["studentId"]),

    // Payments and transactions (records against an invoice where applicable)
    payments: defineTable({
      studentId: v.id("students"),
      amountKobo: v.number(),
      currency: v.string(), // "NGN"
      description: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("refunded"),
      ),
      paymentMethod: v.optional(v.string()), // card, bank transfer, ussd
      invoiceId: v.optional(v.id("invoices")),
      reference: v.optional(v.string()), // Paystack transaction reference
      createdAt: v.number(),
      tenantId: v.id("tenants"),
    }).index("by_student", ["studentId"])
      .index("by_tenant", ["tenantId"])
      .index("by_reference", ["reference"]),

    // AI-assisted report card comments (draft -> human-approved audit trail)
    reportComments: defineTable({
      tenantId: v.id("tenants"),
      studentId: v.id("students"),
      subject: v.string(),
      term: v.string(),
      rawNotes: v.string(),
      scores: v.optional(v.array(v.object({ subject: v.string(), score: v.number(), max: v.number() }))),
      draft: v.string(),
      finalText: v.optional(v.string()),
      status: v.union(v.literal("draft"), v.literal("approved")),
      model: v.string(),
      createdBy: v.id("users"),
      approvedBy: v.optional(v.id("users")),
      approvedAt: v.optional(v.number()),
      createdAt: v.number(),
    }).index("by_tenant", ["tenantId"])
      .index("by_student", ["studentId"]),

    // Tasks for non-teaching staff
    tasks: defineTable({
      tenantId: v.id("tenants"),
      title: v.string(),
      description: v.optional(v.string()),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
      dueDate: v.optional(v.string()),
      assignedTo: v.optional(v.id("users")),
      createdBy: v.id("users"),
      createdAt: v.number(),
    }).index("by_tenant", ["tenantId"])
      .index("by_assigned", ["assignedTo"]),

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