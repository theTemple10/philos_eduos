/**
 * Who may do what (M2, RFC #15; docs/m2-plan.md §4).
 *
 * The single source of truth for school roles. Every API route asks
 * `requirePermission(<permission>)` (src/lib/auth/context.ts); the UI only
 * hides what a role can't do, and the server decides.
 *
 * A grant has a SCOPE that narrows which records it reaches:
 * - "school"   every record in the caller's school
 * - "assigned" only classes/subjects in the teacher's teaching assignments
 * - "children" only students the parent is a guardian of
 * - "self"     only the student themself, or rows the caller owns
 *
 * Pure module (no "@/" imports), so it is unit-tested under `node --test`.
 */

export const SCHOOL_ROLES = [
  "school_admin",
  "registrar",
  "bursar",
  "teacher",
  "staff",
  "parent",
  "student",
] as const;
export type SchoolRole = (typeof SCHOOL_ROLES)[number];

export type Scope = "school" | "assigned" | "children" | "self";

export const PERMISSIONS = [
  // School setup
  "school:configure", // name, settings, assessment scheme
  "staff:manage", // appoint/remove registrar, bursar, teachers, staff
  "sessions:manage", // academic sessions and terms
  "classes:manage",
  "subjects:manage",
  "assignments:manage", // which teacher teaches what to which class
  // Students and families
  "students:read",
  "students:manage", // admit, edit, enrol, withdraw
  "guardians:manage", // link parents to children, invite parents
  "credentials:manage", // issue/reset student passwords and PINs, unlock
  // Teaching and learning
  "attendance:read",
  "attendance:write",
  "scores:read",
  "scores:write",
  "comments:read",
  "comments:write", // draft and approve report comments
  "materials:read",
  "materials:write",
  // Money
  "fees:manage", // fee schedules and invoices
  "invoices:read",
  "payments:read",
  "payments:make",
  // Communication and operations
  "announcements:read",
  "announcements:write",
  "messages:send",
  "tasks:manage", // create and assign tasks
  "tasks:own", // see and complete tasks assigned to you
  "transport:read",
  "transport:manage",
  "audit:read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

type Grants = Partial<Record<Permission, Scope>>;

/** Everything in the school except paying fees as a parent. */
const SCHOOL_ADMIN: Grants = Object.fromEntries(
  PERMISSIONS.filter((p) => p !== "payments:make").map((p) => [p, "school"]),
) as Grants;

export const ROLE_GRANTS: Record<SchoolRole, Grants> = {
  school_admin: SCHOOL_ADMIN,

  registrar: {
    "classes:manage": "school",
    "students:read": "school",
    "students:manage": "school",
    "guardians:manage": "school",
    "credentials:manage": "school",
    "attendance:read": "school",
    "announcements:read": "school",
    "announcements:write": "school",
    "messages:send": "school",
    "tasks:own": "self",
    "transport:read": "school",
    "transport:manage": "school",
  },

  bursar: {
    "students:read": "school", // to bill them; no academic records
    "fees:manage": "school",
    "invoices:read": "school",
    "payments:read": "school",
    "announcements:read": "school",
    "messages:send": "school",
    "tasks:own": "self",
  },

  teacher: {
    "students:read": "assigned",
    "attendance:read": "assigned",
    "attendance:write": "assigned",
    "scores:read": "assigned",
    "scores:write": "assigned",
    "comments:read": "assigned",
    "comments:write": "assigned",
    "materials:read": "assigned",
    "materials:write": "assigned",
    "announcements:read": "school",
    "announcements:write": "assigned", // to their own classes
    "messages:send": "school",
    "tasks:own": "self",
  },

  staff: {
    "announcements:read": "school",
    "announcements:write": "school",
    "messages:send": "school",
    "tasks:own": "self",
    "transport:read": "school",
  },

  parent: {
    "students:read": "children",
    "attendance:read": "children",
    "scores:read": "children",
    "comments:read": "children",
    "materials:read": "children",
    "invoices:read": "children",
    "payments:read": "children",
    "payments:make": "children",
    "announcements:read": "school",
    "messages:send": "school",
    "transport:read": "children",
  },

  student: {
    "students:read": "self",
    "attendance:read": "self",
    "scores:read": "self",
    "comments:read": "self",
    "materials:read": "self",
    "announcements:read": "school",
    "messages:send": "school",
    "transport:read": "self",
  },
};

/** The scope a role holds for a permission, or null if it doesn't hold it. */
export function scopeFor(role: SchoolRole, permission: Permission): Scope | null {
  return ROLE_GRANTS[role]?.[permission] ?? null;
}

export function isSchoolRole(value: unknown): value is SchoolRole {
  return typeof value === "string" && (SCHOOL_ROLES as readonly string[]).includes(value);
}

/** Roles a school admin may appoint through staff invites (not parent/student). */
export const STAFF_ROLES: readonly SchoolRole[] = ["school_admin", "registrar", "bursar", "teacher", "staff"];
