import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { AuthUser, Role } from "./types";

export async function getCurrentUser(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const [dbUser] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!dbUser) return null;

    return {
      id: dbUser.id,
      email: dbUser.email ?? user.email ?? "",
      role: (dbUser.role as Role) ?? "student",
      tenantId: dbUser.tenantId ?? null,
      name: dbUser.name ?? null,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireTenantMember(
  request: NextRequest
): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!user.tenantId) {
    throw new Error("FORBIDDEN: No tenant associated with this account");
  }
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireTenantMember(request);
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("FORBIDDEN: Admin access required");
  }
  return user;
}

export async function requireTeacherOrAdmin(
  request: NextRequest
): Promise<AuthUser> {
  const user = await requireTenantMember(request);
  if (
    user.role !== "teacher" &&
    user.role !== "admin" &&
    user.role !== "super_admin"
  ) {
    throw new Error("FORBIDDEN: Teacher or admin access required");
  }
  return user;
}

export async function requireSuperAdmin(
  request: NextRequest
): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== "super_admin") {
    throw new Error("FORBIDDEN: Super admin access required");
  }
  return user;
}
