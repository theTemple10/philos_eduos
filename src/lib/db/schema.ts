import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  uuid,
  index,
  real,
} from "drizzle-orm/pg-core";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
  STAFF: "staff",
} as const;

export const CURRICULA = {
  WAEC_NECO: "waec_neco",
  CAMBRIDGE: "cambridge",
  IB: "ib",
  AMERICAN: "american",
} as const;

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name"),
    image: text("image"),
    email: text("email"),
    emailVerificationTime: real("email_verification_time"),
    isAnonymous: boolean("is_anonymous"),
    role: text("role"),
    tenantId: uuid("tenant_id"),
  },
  (table) => [
    index("email_idx").on(table.email),
    index("by_tenant_idx").on(table.tenantId),
  ],
);

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    domain: text("domain"),
    logo: text("logo"),
    settings: jsonb("settings"),
    curriculum: text("curriculum"),
    createdAt: real("created_at").notNull(),
  },
  (table) => [index("by_domain_idx").on(table.domain)],
);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    tenantId: uuid("tenant_id").notNull(),
    code: text("code").notNull(),
    createdBy: uuid("created_by").notNull(),
    expiresAt: real("expires_at").notNull(),
    usedAt: real("used_at"),
    createdAt: real("created_at").notNull(),
    profile: jsonb("profile"),
  },
  (table) => [
    index("by_code_idx").on(table.code),
    index("invite_email_idx").on(table.email),
    index("invite_tenant_idx").on(table.tenantId),
  ],
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    name: text("name").notNull(),
    classId: uuid("class_id").notNull(),
    parentId: uuid("parent_id"),
    tenantId: uuid("tenant_id").notNull(),
    studentId: text("student_id").notNull(),
    enrollmentDate: text("enrollment_date").notNull(),
    status: text("status").notNull(),
  },
  (table) => [
    index("student_class_idx").on(table.classId),
    index("student_user_idx").on(table.userId),
    index("student_parent_idx").on(table.parentId),
    index("student_tenant_idx").on(table.tenantId),
    index("by_student_id_idx").on(table.studentId),
  ],
);

export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    subject: text("subject"),
    classes: jsonb("classes").notNull(),
    tenantId: uuid("tenant_id").notNull(),
    department: text("department"),
    hireDate: text("hire_date").notNull(),
  },
  (table) => [
    index("teacher_user_idx").on(table.userId),
    index("teacher_tenant_idx").on(table.tenantId),
  ],
);

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    gradeLevel: text("grade_level").notNull(),
    teacherId: uuid("teacher_id"),
    tenantId: uuid("tenant_id").notNull(),
    room: text("room"),
    capacity: integer("capacity").notNull(),
  },
  (table) => [index("class_tenant_idx").on(table.tenantId)],
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull(),
    date: text("date").notNull(),
    status: text("status").notNull(),
    markedBy: uuid("marked_by").notNull(),
    timestamp: real("timestamp").notNull(),
    tenantId: uuid("tenant_id").notNull(),
  },
  (table) => [
    index("att_student_date_idx").on(table.studentId, table.date),
    index("att_date_idx").on(table.date),
    index("att_tenant_idx").on(table.tenantId),
  ],
);

export const grades = pgTable(
  "grades",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull(),
    subject: text("subject").notNull(),
    score: real("score").notNull(),
    maxScore: real("max_score").notNull(),
    date: text("date").notNull(),
    gradedBy: uuid("graded_by").notNull(),
    comments: text("comments"),
    tenantId: uuid("tenant_id").notNull(),
  },
  (table) => [
    index("grade_student_idx").on(table.studentId),
    index("grade_student_subject_idx").on(table.studentId, table.subject),
    index("grade_tenant_idx").on(table.tenantId),
  ],
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    target: text("target").notNull(),
    authorId: uuid("author_id").notNull(),
    tenantId: uuid("tenant_id").notNull(),
    createdAt: real("created_at").notNull(),
    attachments: jsonb("attachments"),
  },
  (table) => [index("ann_tenant_idx").on(table.tenantId)],
);

export const studyMaterials = pgTable(
  "study_materials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    subject: text("subject").notNull(),
    classId: uuid("class_id").notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    tenantId: uuid("tenant_id").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type").notNull(),
    createdAt: real("created_at").notNull(),
  },
  (table) => [
    index("sm_class_idx").on(table.classId),
    index("sm_tenant_idx").on(table.tenantId),
    index("sm_subject_idx").on(table.subject),
  ],
);

export const transportation = pgTable(
  "transportation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull(),
    busNumber: text("bus_number").notNull(),
    route: text("route").notNull(),
    driverName: text("driver_name").notNull(),
    driverPhone: text("driver_phone").notNull(),
    status: text("status").notNull(),
    lastUpdated: real("last_updated").notNull(),
    location: jsonb("location"),
    tenantId: uuid("tenant_id").notNull(),
  },
  (table) => [
    index("trans_student_idx").on(table.studentId),
    index("trans_tenant_idx").on(table.tenantId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    senderId: uuid("sender_id").notNull(),
    receiverId: uuid("receiver_id").notNull(),
    content: text("content").notNull(),
    read: boolean("read").notNull(),
    createdAt: real("created_at").notNull(),
    tenantId: uuid("tenant_id").notNull(),
  },
  (table) => [
    index("msg_sender_idx").on(table.senderId),
    index("msg_receiver_idx").on(table.receiverId),
    index("msg_tenant_idx").on(table.tenantId),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id").notNull(),
    content: text("content").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    createdAt: real("created_at").notNull(),
    tenantId: uuid("tenant_id").notNull(),
  },
  (table) => [
    index("comment_target_idx").on(table.targetType, table.targetId),
    index("comment_tenant_idx").on(table.tenantId),
  ],
);

export const feeSchedules = pgTable(
  "fee_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    title: text("title").notNull(),
    amountKobo: integer("amount_kobo").notNull(),
    currency: text("currency").notNull(),
    term: text("term").notNull(),
    dueDate: text("due_date").notNull(),
    classId: uuid("class_id"),
    active: boolean("active").notNull(),
    createdAt: real("created_at").notNull(),
  },
  (table) => [index("fs_tenant_idx").on(table.tenantId)],
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    studentId: uuid("student_id").notNull(),
    feeScheduleId: uuid("fee_schedule_id"),
    title: text("title").notNull(),
    amountKobo: integer("amount_kobo").notNull(),
    currency: text("currency").notNull(),
    dueDate: text("due_date").notNull(),
    status: text("status").notNull(),
    paidAmountKobo: integer("paid_amount_kobo").notNull(),
    reference: text("reference"),
    createdAt: real("created_at").notNull(),
  },
  (table) => [
    index("inv_tenant_idx").on(table.tenantId),
    index("inv_student_idx").on(table.studentId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull(),
    amountKobo: integer("amount_kobo").notNull(),
    currency: text("currency").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull(),
    paymentMethod: text("payment_method"),
    invoiceId: uuid("invoice_id"),
    reference: text("reference"),
    createdAt: real("created_at").notNull(),
    tenantId: uuid("tenant_id").notNull(),
  },
  (table) => [
    index("pay_student_idx").on(table.studentId),
    index("pay_tenant_idx").on(table.tenantId),
    index("pay_reference_idx").on(table.reference),
  ],
);

export const reportComments = pgTable(
  "report_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    studentId: uuid("student_id").notNull(),
    subject: text("subject").notNull(),
    term: text("term").notNull(),
    rawNotes: text("raw_notes").notNull(),
    scores: jsonb("scores"),
    draft: text("draft").notNull(),
    finalText: text("final_text"),
    status: text("status").notNull(),
    model: text("model").notNull(),
    createdBy: uuid("created_by").notNull(),
    approvedBy: uuid("approved_by"),
    approvedAt: real("approved_at"),
    createdAt: real("created_at").notNull(),
  },
  (table) => [
    index("rc_tenant_idx").on(table.tenantId),
    index("rc_student_idx").on(table.studentId),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    priority: text("priority").notNull(),
    status: text("status").notNull(),
    dueDate: text("due_date"),
    assignedTo: uuid("assigned_to"),
    createdBy: uuid("created_by").notNull(),
    createdAt: real("created_at").notNull(),
  },
  (table) => [
    index("task_tenant_idx").on(table.tenantId),
    index("task_assigned_idx").on(table.assignedTo),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull(),
    type: text("type").notNull(),
    createdAt: real("created_at").notNull(),
    tenantId: uuid("tenant_id").notNull(),
  },
  (table) => [
    index("notif_user_idx").on(table.userId),
    index("notif_tenant_idx").on(table.tenantId),
  ],
);

const schema = {
  users,
  tenants,
  invites,
  students,
  teachers,
  classes,
  attendance,
  grades,
  announcements,
  studyMaterials,
  transportation,
  messages,
  comments,
  feeSchedules,
  invoices,
  payments,
  reportComments,
  tasks,
  notifications,
};

export default schema;
