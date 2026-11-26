/**
 * Database schema v2: roles, schools, sessions and terms (M2: #15, #27, #28,
 * #5, #7). See docs/m2-plan.md.
 *
 * It lives beside the v1 schema (src/lib/db/schema.ts) while routes move
 * over PR by PR on the `m2` branch; the last M2 PR deletes v1.
 *
 * Conventions:
 * - Every school-owned table has `school_id` and every query filters on it.
 * - Real foreign keys everywhere; CHECKs instead of free-text statuses.
 * - `timestamptz` for moments, `date` for calendar days.
 * - Role and status values are listed once below and reused in the CHECKs.
 * - users.id equals auth.users.id. The FK to auth.users and Row Level
 *   Security are added by hand-written SQL (drizzle/0002_auth_and_rls.sql),
 *   because they live outside what Drizzle manages.
 */
import { sql, type SQL } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { SCHOOL_ROLES } from "../../auth/permissions";

// ---------------------------------------------------------------------------
// Value lists
// ---------------------------------------------------------------------------

export const PLATFORM_ROLES = ["super_admin"] as const;
// School roles are defined once, with their permissions.
export { SCHOOL_ROLES, type SchoolRole } from "../../auth/permissions";
export const CURRICULA = ["waec_neco", "cambridge", "ib", "american"] as const;

const MEMBERSHIP_STATUSES = ["active", "suspended", "left"] as const;
const SCHOOL_STATUSES = ["active", "suspended"] as const;
const STUDENT_STATUSES = ["active", "graduated", "withdrawn"] as const;
const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;
const INVOICE_STATUSES = ["pending", "partial", "paid", "cancelled"] as const;
const PAYMENT_STATUSES = ["pending", "completed", "failed", "needs_review"] as const;
const COMMENT_STATUSES = ["draft", "approved"] as const;
const TASK_STATUSES = ["todo", "in_progress", "completed"] as const;
const TASK_PRIORITIES = ["low", "medium", "high"] as const;
const AUDIENCES = ["all", "staff", "parents", "students"] as const;

/** `column IN ('a','b')` for a CHECK constraint. */
function oneOf(column: AnyPgColumn, values: readonly string[]): SQL {
  return sql`${column} in (${sql.raw(values.map((v) => `'${v}'`).join(", "))})`;
}

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const id = () => uuid("id").defaultRandom().primaryKey();
const schoolId = () =>
  uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" });

// ---------------------------------------------------------------------------
// People, schools and access
// ---------------------------------------------------------------------------

/** One row per sign-in. `id` is the Supabase auth user id. */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    platformRole: text("platform_role"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("users_email_lower_uq").on(sql`lower(${t.email})`),
    check("users_platform_role_ck", sql`${t.platformRole} is null or ${oneOf(t.platformRole, PLATFORM_ROLES)}`),
  ],
);

export const schools = pgTable(
  "schools",
  {
    id: id(),
    name: text("name").notNull(),
    /** Used in the school's address: /s/<slug>. */
    slug: text("slug").notNull(),
    curriculum: text("curriculum").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("schools_slug_uq").on(t.slug),
    check("schools_slug_ck", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(${t.slug}) between 2 and 48`),
    check("schools_curriculum_ck", oneOf(t.curriculum, CURRICULA)),
    check("schools_status_ck", oneOf(t.status, SCHOOL_STATUSES)),
  ],
);

/**
 * A person's role in a school. One ACTIVE membership per person for now
 * (memberships_one_active_uq). Dropping that one index later allows
 * multi-role and multi-school people without changing any data.
 */
export const memberships = pgTable(
  "memberships",
  {
    id: id(),
    schoolId: schoolId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("memberships_user_school_role_uq").on(t.userId, t.schoolId, t.role),
    uniqueIndex("memberships_one_active_uq").on(t.userId).where(sql`${t.status} = 'active'`),
    index("memberships_school_role_idx").on(t.schoolId, t.role),
    check("memberships_role_ck", oneOf(t.role, SCHOOL_ROLES)),
    check("memberships_status_ck", oneOf(t.status, MEMBERSHIP_STATUSES)),
  ],
);

/**
 * Invitations for staff and parents (students get credentials instead).
 * Only a hash of the code is stored. Redemption is one conditional UPDATE
 * (`... where used_at is null and expires_at > now()`), so an invite can't
 * be used twice (#5).
 */
export const invites = pgTable(
  "invites",
  {
    id: id(),
    schoolId: schoolId(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    codeHash: text("code_hash").notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    usedBy: uuid("used_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("invites_code_hash_uq").on(t.codeHash),
    index("invites_school_idx").on(t.schoolId),
    index("invites_email_lower_idx").on(sql`lower(${t.email})`),
    check("invites_role_ck", sql`${oneOf(t.role, SCHOOL_ROLES)} and ${t.role} <> 'student'`),
    // used_by may later become null (user deleted), so only one direction holds.
    check("invites_used_ck", sql`${t.usedBy} is null or ${t.usedAt} is not null`),
  ],
);

/** Children a parent invite will link to when redeemed. */
export const inviteStudents = pgTable(
  "invite_students",
  {
    inviteId: uuid("invite_id")
      .notNull()
      .references(() => invites.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.inviteId, t.studentId] })],
);

// ---------------------------------------------------------------------------
// School structure (#27)
// ---------------------------------------------------------------------------

export const academicSessions = pgTable(
  "academic_sessions",
  {
    id: id(),
    schoolId: schoolId(),
    /** e.g. "2026/2027" */
    name: text("name").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    isCurrent: boolean("is_current").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("sessions_school_name_uq").on(t.schoolId, t.name),
    uniqueIndex("sessions_one_current_uq").on(t.schoolId).where(sql`${t.isCurrent}`),
    check("sessions_dates_ck", sql`${t.endsOn} > ${t.startsOn}`),
  ],
);

export const terms = pgTable(
  "terms",
  {
    id: id(),
    schoolId: schoolId(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    /** 1 = First, 2 = Second, 3 = Third term. */
    number: smallint("number").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    isCurrent: boolean("is_current").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("terms_session_number_uq").on(t.sessionId, t.number),
    uniqueIndex("terms_one_current_uq").on(t.schoolId).where(sql`${t.isCurrent}`),
    check("terms_number_ck", sql`${t.number} between 1 and 3`),
    check("terms_dates_ck", sql`${t.endsOn} > ${t.startsOn}`),
  ],
);

/** e.g. level "JSS 2" + arm "Gold" → name "JSS 2 Gold". */
export const classes = pgTable(
  "classes",
  {
    id: id(),
    schoolId: schoolId(),
    level: text("level").notNull(),
    arm: text("arm").notNull().default(""),
    name: text("name").notNull(),
    capacity: integer("capacity"),
    formTeacherId: uuid("form_teacher_id").references(() => memberships.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("classes_school_name_uq").on(t.schoolId, t.name),
    check("classes_capacity_ck", sql`${t.capacity} is null or ${t.capacity} > 0`),
  ],
);

export const subjects = pgTable(
  "subjects",
  {
    id: id(),
    schoolId: schoolId(),
    name: text("name").notNull(),
    code: text("code"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("subjects_school_name_uq").on(t.schoolId, sql`lower(${t.name})`)],
);

/** Which teacher teaches which subject to which class: the teacher's scope. */
export const teachingAssignments = pgTable(
  "teaching_assignments",
  {
    id: id(),
    schoolId: schoolId(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => memberships.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("assignments_uq").on(t.teacherId, t.classId, t.subjectId),
    index("assignments_class_idx").on(t.classId),
  ],
);

// ---------------------------------------------------------------------------
// Students and families (#28)
// ---------------------------------------------------------------------------

export const students = pgTable(
  "students",
  {
    id: id(),
    schoolId: schoolId(),
    /** The student's own login, when issued. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    admissionNo: text("admission_no").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    otherNames: text("other_names"),
    dateOfBirth: date("date_of_birth"),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("students_school_admission_uq").on(t.schoolId, sql`lower(${t.admissionNo})`),
    uniqueIndex("students_user_uq").on(t.userId),
    check("students_status_ck", oneOf(t.status, STUDENT_STATUSES)),
  ],
);

/**
 * Sign-in policy for a student's login (#28). The secret itself lives in
 * Supabase Auth, never here.
 */
export const studentCredentials = pgTable(
  "student_credentials",
  {
    studentId: uuid("student_id")
      .primaryKey()
      .references(() => students.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    mustChange: boolean("must_change").notNull().default(true),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("student_credentials_kind_ck", oneOf(t.kind, ["password", "pin"])),
    check("student_credentials_attempts_ck", sql`${t.failedAttempts} >= 0`),
  ],
);

/** A student's class in a given session; history survives promotion. */
export const enrollments = pgTable(
  "enrollments",
  {
    id: id(),
    schoolId: schoolId(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "restrict" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academicSessions.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("enrollments_student_session_uq").on(t.studentId, t.sessionId),
    index("enrollments_class_session_idx").on(t.classId, t.sessionId),
  ],
);

/** Parent/guardian ↔ child. A child can have several guardians. */
export const guardians = pgTable(
  "guardians",
  {
    schoolId: schoolId(),
    parentUserId: uuid("parent_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    relationship: text("relationship"),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.parentUserId, t.studentId] }),
    index("guardians_student_idx").on(t.studentId),
  ],
);

// ---------------------------------------------------------------------------
// Assessment (#27)
// ---------------------------------------------------------------------------

/**
 * How a school assesses: components with maximum marks, and grade
 * boundaries. `session_id` null = the school's default.
 * Default (D3): CA1 20 + CA2 20 + Exam 60, WAEC key A1–F9.
 */
export const assessmentSchemes = pgTable(
  "assessment_schemes",
  {
    id: id(),
    schoolId: schoolId(),
    sessionId: uuid("session_id").references(() => academicSessions.id, { onDelete: "cascade" }),
    /** [{ key: "ca1", label: "CA 1", max: 20 }, …] */
    components: jsonb("components").notNull(),
    /** [{ grade: "A1", min: 75 }, …], highest first */
    gradeBoundaries: jsonb("grade_boundaries").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("schemes_school_default_uq").on(t.schoolId).where(sql`${t.sessionId} is null`),
    uniqueIndex("schemes_school_session_uq").on(t.schoolId, t.sessionId).where(sql`${t.sessionId} is not null`),
  ],
);

/** One mark: a student, a subject, a term, a component. */
export const scores = pgTable(
  "scores",
  {
    id: id(),
    schoolId: schoolId(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    component: text("component").notNull(),
    score: real("score").notNull(),
    enteredBy: uuid("entered_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("scores_uq").on(t.studentId, t.subjectId, t.termId, t.component),
    index("scores_term_subject_idx").on(t.termId, t.subjectId),
    check("scores_score_ck", sql`${t.score} >= 0`),
  ],
);

export const attendance = pgTable(
  "attendance",
  {
    id: id(),
    schoolId: schoolId(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    termId: uuid("term_id").references(() => terms.id, { onDelete: "set null" }),
    date: date("date").notNull(),
    status: text("status").notNull(),
    markedBy: uuid("marked_by").references(() => users.id, { onDelete: "set null" }),
    markedAt: timestamp("marked_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("attendance_student_date_uq").on(t.studentId, t.date),
    index("attendance_school_date_idx").on(t.schoolId, t.date),
    check("attendance_status_ck", oneOf(t.status, ATTENDANCE_STATUSES)),
  ],
);

export const reportComments = pgTable(
  "report_comments",
  {
    id: id(),
    schoolId: schoolId(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "cascade" }),
    rawNotes: text("raw_notes").notNull().default(""),
    scores: jsonb("scores"),
    draft: text("draft").notNull(),
    finalText: text("final_text"),
    status: text("status").notNull().default("draft"),
    /** "manual" for teacher-written or comment-bank drafts. */
    model: text("model").notNull().default("manual"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("report_comments_student_term_idx").on(t.studentId, t.termId),
    check("report_comments_status_ck", oneOf(t.status, COMMENT_STATUSES)),
    check(
      "report_comments_approval_ck",
      sql`(${t.status} = 'approved') = (${t.approvedAt} is not null and ${t.finalText} is not null)`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Learning materials (#4)
// ---------------------------------------------------------------------------

export const studyMaterials = pgTable(
  "study_materials",
  {
    id: id(),
    schoolId: schoolId(),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    termId: uuid("term_id").references(() => terms.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    /** `storage:<key>` for uploads, otherwise an http(s) link. */
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type").notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("materials_class_idx").on(t.classId),
    check("materials_url_ck", sql`${t.fileUrl} like 'storage:%' or ${t.fileUrl} ~ '^https?://'`),
  ],
);

// ---------------------------------------------------------------------------
// Fees and payments (#16, #17, #6)
// ---------------------------------------------------------------------------

export const feeSchedules = pgTable(
  "fee_schedules",
  {
    id: id(),
    schoolId: schoolId(),
    termId: uuid("term_id")
      .notNull()
      .references(() => terms.id, { onDelete: "restrict" }),
    /** null = every class */
    classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    amountKobo: integer("amount_kobo").notNull(),
    currency: text("currency").notNull().default("NGN"),
    dueOn: date("due_on").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    index("fee_schedules_school_term_idx").on(t.schoolId, t.termId),
    check("fee_schedules_amount_ck", sql`${t.amountKobo} > 0`),
    check("fee_schedules_currency_ck", sql`${t.currency} = 'NGN'`),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    schoolId: schoolId(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    feeScheduleId: uuid("fee_schedule_id").references(() => feeSchedules.id, { onDelete: "set null" }),
    termId: uuid("term_id").references(() => terms.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    amountKobo: integer("amount_kobo").notNull(),
    currency: text("currency").notNull().default("NGN"),
    dueOn: date("due_on").notNull(),
    status: text("status").notNull().default("pending"),
    paidAmountKobo: integer("paid_amount_kobo").notNull().default(0),
    reference: text("reference"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("invoices_student_schedule_uq")
      .on(t.studentId, t.feeScheduleId)
      .where(sql`${t.feeScheduleId} is not null and ${t.status} <> 'cancelled'`),
    index("invoices_school_status_idx").on(t.schoolId, t.status),
    check("invoices_amount_ck", sql`${t.amountKobo} > 0`),
    check("invoices_paid_ck", sql`${t.paidAmountKobo} between 0 and ${t.amountKobo}`),
    check("invoices_status_ck", oneOf(t.status, INVOICE_STATUSES)),
    check("invoices_currency_ck", sql`${t.currency} = 'NGN'`),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    schoolId: schoolId(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "restrict" }),
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "restrict" }),
    amountKobo: integer("amount_kobo").notNull(),
    currency: text("currency").notNull().default("NGN"),
    description: text("description").notNull(),
    status: text("status").notNull().default("pending"),
    method: text("method"),
    reference: text("reference").notNull(),
    initiatedBy: uuid("initiated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("payments_reference_uq").on(t.reference),
    index("payments_invoice_idx").on(t.invoiceId),
    check("payments_amount_ck", sql`${t.amountKobo} > 0`),
    check("payments_status_ck", oneOf(t.status, PAYMENT_STATUSES)),
    check("payments_currency_ck", sql`${t.currency} = 'NGN'`),
  ],
);

// ---------------------------------------------------------------------------
// Communication and operations
// ---------------------------------------------------------------------------

export const announcements = pgTable(
  "announcements",
  {
    id: id(),
    schoolId: schoolId(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    audience: text("audience").notNull().default("all"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("announcements_school_created_idx").on(t.schoolId, t.createdAt),
    check("announcements_audience_ck", oneOf(t.audience, AUDIENCES)),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: id(),
    schoolId: schoolId(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("messages_recipient_idx").on(t.recipientId, t.createdAt),
    index("messages_sender_idx").on(t.senderId, t.createdAt),
    check("messages_not_self_ck", sql`${t.senderId} <> ${t.recipientId}`),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    schoolId: schoolId(),
    title: text("title").notNull(),
    description: text("description"),
    priority: text("priority").notNull().default("medium"),
    status: text("status").notNull().default("todo"),
    dueOn: date("due_on"),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("tasks_school_assignee_idx").on(t.schoolId, t.assignedTo),
    check("tasks_priority_ck", oneOf(t.priority, TASK_PRIORITIES)),
    check("tasks_status_ck", oneOf(t.status, TASK_STATUSES)),
  ],
);

export const transportation = pgTable(
  "transportation",
  {
    id: id(),
    schoolId: schoolId(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    busNumber: text("bus_number").notNull(),
    route: text("route").notNull(),
    driverName: text("driver_name").notNull(),
    driverPhone: text("driver_phone").notNull(),
    status: text("status").notNull(),
    location: jsonb("location"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("transportation_student_uq").on(t.studentId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    schoolId: schoolId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.createdAt)],
);

/**
 * Who did what, for sensitive actions (role changes, score edits after
 * approval, fee changes, support access). Append-only.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    // Plain ids, deliberately without foreign keys: the record of who did
    // what must outlive deleted users and schools, and a FK's SET NULL would
    // be an UPDATE, which the append-only trigger forbids.
    schoolId: uuid("school_id"),
    actorId: uuid("actor_id"),
    /** Snapshot of the actor's email at the time, for readability. */
    actorEmail: text("actor_email"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    details: jsonb("details"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_log_school_created_idx").on(t.schoolId, t.createdAt)],
);
