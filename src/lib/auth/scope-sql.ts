/**
 * The SQL behind every scope check (M2, docs/m2-plan.md §4).
 *
 * Kept as plain parameterised SQL in a pure module so the app (via
 * context.ts) and the migration rehearsal (scripts/db-rehearse.mjs) run
 * exactly the same queries. Each query returns a row when access is
 * allowed and no rows otherwise.
 *
 * "Current" means the school's current academic session: a teacher's or
 * parent's reach follows this session's enrolments.
 */
import type { Scope } from "./permissions";

export type ScopeQuery = { text: string; params: string[] };

export type ScopeActor = {
  schoolId: string;
  userId: string;
  /** The caller's active membership (a teacher's assignments hang off it). */
  membershipId: string;
};

/** The caller's profile with their active membership and school, if any. */
export const CONTEXT_SQL = `
  select u.id as user_id, u.email, u.platform_role,
         m.id as membership_id, m.role,
         s.id as school_id, s.slug as school_slug, s.status as school_status
    from users u
    left join memberships m on m.user_id = u.id and m.status = 'active'
    left join schools s on s.id = m.school_id
   where u.id = $1`;

const ENROLLED_THIS_SESSION = `
  join enrollments e on e.student_id = s.id
  join academic_sessions a on a.id = e.session_id and a.is_current`;

/** May the caller reach this student under the given scope? */
export function studentScopeQuery(scope: Scope, studentId: string, actor: ScopeActor): ScopeQuery {
  switch (scope) {
    case "school":
      return { text: `select 1 from students s where s.id = $1 and s.school_id = $2`, params: [studentId, actor.schoolId] };
    case "assigned":
      return {
        text: `select 1 from students s ${ENROLLED_THIS_SESSION}
                 join teaching_assignments ta on ta.class_id = e.class_id
                where s.id = $1 and s.school_id = $2 and ta.teacher_id = $3
                limit 1`,
        params: [studentId, actor.schoolId, actor.membershipId],
      };
    case "children":
      return {
        text: `select 1 from students s join guardians g on g.student_id = s.id
                where s.id = $1 and s.school_id = $2 and g.parent_user_id = $3`,
        params: [studentId, actor.schoolId, actor.userId],
      };
    case "self":
      return {
        text: `select 1 from students s where s.id = $1 and s.school_id = $2 and s.user_id = $3`,
        params: [studentId, actor.schoolId, actor.userId],
      };
  }
}

/** May the caller reach this class (its roster, materials, attendance)? */
export function classScopeQuery(scope: Scope, classId: string, actor: ScopeActor): ScopeQuery {
  switch (scope) {
    case "school":
      return { text: `select 1 from classes c where c.id = $1 and c.school_id = $2`, params: [classId, actor.schoolId] };
    case "assigned":
      return {
        text: `select 1 from teaching_assignments ta join classes c on c.id = ta.class_id
                where c.id = $1 and c.school_id = $2 and ta.teacher_id = $3
                limit 1`,
        params: [classId, actor.schoolId, actor.membershipId],
      };
    case "children":
      return {
        text: `select 1 from students s ${ENROLLED_THIS_SESSION}
                 join guardians g on g.student_id = s.id
                where e.class_id = $1 and s.school_id = $2 and g.parent_user_id = $3
                limit 1`,
        params: [classId, actor.schoolId, actor.userId],
      };
    case "self":
      return {
        text: `select 1 from students s ${ENROLLED_THIS_SESSION}
                where e.class_id = $1 and s.school_id = $2 and s.user_id = $3
                limit 1`,
        params: [classId, actor.schoolId, actor.userId],
      };
  }
}
