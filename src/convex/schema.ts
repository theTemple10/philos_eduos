import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    students: defineTable({
      userId: v.optional(v.id("users")),
      name: v.string(),
      classId: v.id("classes"),
      parentId: v.optional(v.id("users")),
    }).index("by_class", ["classId"])
      .index("by_user", ["userId"])
      .index("by_parent", ["parentId"]),

    teachers: defineTable({
      userId: v.id("users"),
      name: v.string(),
      subject: v.optional(v.string()),
      classes: v.array(v.id("classes")),
    }).index("by_user", ["userId"]),

    classes: defineTable({
      name: v.string(),
      gradeLevel: v.string(),
      teacherId: v.optional(v.id("users")),
    }),

    attendance: defineTable({
      studentId: v.id("students"),
      date: v.string(), // YYYY-MM-DD
      status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
    }).index("by_student_date", ["studentId", "date"])
      .index("by_date", ["date"]),

    grades: defineTable({
      studentId: v.id("students"),
      subject: v.string(),
      score: v.number(),
      maxScore: v.number(),
      date: v.string(),
    }).index("by_student", ["studentId"])
      .index("by_student_subject", ["studentId", "subject"]),

    announcements: defineTable({
      title: v.string(),
      content: v.string(),
      target: v.union(v.literal("all"), v.literal("teachers"), v.literal("students"), v.literal("parents")),
      authorId: v.id("users"),
    })

    // tableName: defineTable({
    //   ...
    //   // table fields
    // }).index("by_field", ["field"])
  },
  {
    schemaValidation: false,
  },
);

export default schema;
