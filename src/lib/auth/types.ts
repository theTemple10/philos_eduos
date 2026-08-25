export type Role =
  | "super_admin"
  | "admin"
  | "teacher"
  | "student"
  | "parent"
  | "staff";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  name: string | null;
}
