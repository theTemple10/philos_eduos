import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, tenants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
} from "@/lib/api/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();
    const { data: { user: supaUser }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !supaUser) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }
    const rows = await db.select().from(users).where(eq(users.id, supaUser.id)).limit(1);
    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Your account could not be found." }, { status: 401 });
    }

    if (searchParams.get("all") === "true") {
      if (user.role !== "super_admin") {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      const allUsers = await db.select().from(users);
      return NextResponse.json(allUsers);
    }

    if (searchParams.get("invites") === "true") {
      if (!user.tenantId || user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      const { invites: invitesTable } = await import("@/lib/db/schema");
      const tenantInvites = await db
        .select()
        .from(invitesTable)
        .where(eq(invitesTable.tenantId, user.tenantId));
      return NextResponse.json(tenantInvites);
    }

    if (searchParams.get("tenant") === "true") {
      if (!user.tenantId || (user.role !== "admin" && user.role !== "super_admin")) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
      const tenantUsers = await db
        .select()
        .from(users)
        .where(eq(users.tenantId, user.tenantId));
      return NextResponse.json(tenantUsers);
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("GET /api/users", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "createTenant") {
      return handleCreateTenant(body);
    }
    if (action === "createInvite") {
      return handleCreateInvite(body);
    }
    if (action === "redeemInvite") {
      return handleRedeemInvite(body);
    }
    if (action === "updateUserRole") {
      return handleUpdateUserRole(body);
    }
    if (action === "grantSuperAdmin") {
      return handleGrantSuperAdmin(body);
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (err) {
    console.error("POST /api/users", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const { userId: targetId, role } = body;
    if (!targetId || !role) {
      return NextResponse.json({ error: "userId and role are required." }, { status: 400 });
    }
    const validRoles = ["admin", "teacher", "student", "parent", "staff"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    const target = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
    if (!target[0] || target[0].tenantId !== result.data.tenantId) {
      return NextResponse.json({ error: "That user isn't in your school." }, { status: 404 });
    }
    await db.update(users).set({ role }).where(eq(users.id, targetId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/users", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get("id");
    if (!inviteId) {
      return NextResponse.json({ error: "Invite id is required." }, { status: 400 });
    }
    const result = await requireAdmin();
    if (!result.ok) return result.response;
    const { invites } = await import("@/lib/db/schema");
    const inv = await db.select().from(invites).where(eq(invites.id, inviteId)).limit(1);
    if (!inv[0] || inv[0].tenantId !== result.data.tenantId) {
      return NextResponse.json({ error: "That invite could not be found." }, { status: 404 });
    }
    await db.delete(invites).where(eq(invites.id, inviteId));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/users", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) {
    code += alphabet[b % alphabet.length];
  }
  return code;
}

async function handleCreateTenant(body: {
  name?: string;
  curriculum?: string;
}) {
  const result = await requireAuth();
  if (!result.ok) return result.response;

  if (result.data.user.tenantId) {
    return NextResponse.json(
      { error: "You are already part of a school." },
      { status: 400 },
    );
  }

  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your school's name." },
      { status: 400 },
    );
  }

  const validCurricula = ["waec_neco", "cambridge", "ib", "american"];
  if (!body.curriculum || !validCurricula.includes(body.curriculum)) {
    return NextResponse.json({ error: "Invalid curriculum." }, { status: 400 });
  }

  const [{ tenant }] = await db
    .insert(tenants)
    .values({ name, curriculum: body.curriculum, createdAt: Date.now() })
    .returning({ tenant: tenants.id });

  await db
    .update(users)
    .set({ role: "admin", tenantId: tenant, name: result.data.user.name ?? name })
    .where(eq(users.id, result.data.userId));

  return NextResponse.json({ tenantId: tenant });
}

async function handleCreateInvite(body: {
  email?: string;
  role?: string;
  profile?: Record<string, unknown>;
}) {
  const result = await requireAdmin();
  if (!result.ok) return result.response;

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const validRoles = ["teacher", "student", "parent", "staff"];
  if (!body.role || !validRoles.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  if (body.role === "student") {
    const profile = body.profile as { classId?: string; studentId?: string; name?: string } | undefined;
    if (!profile?.classId || !profile?.studentId || !profile?.name) {
      return NextResponse.json(
        { error: "Student invites need a name, class and student ID." },
        { status: 400 },
      );
    }
  }

  const { invites } = await import("@/lib/db/schema");
  const existing = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.email, email),
        eq(invites.tenantId, result.data.tenantId),
      ),
    )
    .limit(1);
  if (existing[0] && !existing[0].usedAt) {
    return NextResponse.json(
      { error: "An active invite already exists for that email." },
      { status: 400 },
    );
  }

  const code = generateInviteCode();
  const now = Date.now();
  const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  const [{ invite }] = await db
    .insert(invites)
    .values({
      email,
      role: body.role,
      tenantId: result.data.tenantId,
      code,
      createdBy: result.data.userId,
      expiresAt: now + INVITE_TTL_MS,
      createdAt: now,
      profile: body.profile ?? null,
    })
    .returning({ invite: invites.id });

  return NextResponse.json({ code, inviteId: invite });
}

async function handleRedeemInvite(body: { code?: string }) {
  const result = await requireAuth();
  if (!result.ok) return result.response;

  if (result.data.user.tenantId) {
    return NextResponse.json(
      { error: "You are already part of a school." },
      { status: 400 },
    );
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  const { invites, students, teachers } = await import("@/lib/db/schema");
  const rows = await db
    .select()
    .from(invites)
    .where(eq(invites.code, code))
    .limit(1);
  const invite = rows[0];
  if (!invite) {
    return NextResponse.json({ error: "That invite code isn't valid." }, { status: 404 });
  }

  const callerEmail = (result.data.user.email ?? "").toLowerCase();
  if (!callerEmail || callerEmail !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "This invite is for a different email address." },
      { status: 403 },
    );
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "This invite has already been used." }, { status: 400 });
  }
  if (invite.expiresAt < Date.now()) {
    return NextResponse.json(
      { error: "This invite has expired. Ask your school admin for a new one." },
      { status: 400 },
    );
  }

  const tenant = await db.select().from(tenants).where(eq(tenants.id, invite.tenantId)).limit(1);
  if (!tenant[0]) {
    return NextResponse.json(
      { error: "This invite's school no longer exists." },
      { status: 404 },
    );
  }

  await db
    .update(users)
    .set({ role: invite.role, tenantId: invite.tenantId })
    .where(eq(users.id, result.data.userId));
  await db
    .update(invites)
    .set({ usedAt: Date.now() })
    .where(eq(invites.id, invite.id));

  const today = new Date().toISOString().slice(0, 10);
  if (invite.role === "student") {
    const profile = invite.profile as { classId?: string; studentId?: string; name?: string } | null;
    const classId = profile?.classId;
    if (!classId) {
      return NextResponse.json(
        { error: "That invite is missing its class. Ask the school to resend it." },
        { status: 400 },
      );
    }
    await db.insert(students).values({
      userId: result.data.userId,
      name: profile?.name ?? result.data.user.name ?? "Student",
      classId,
      tenantId: invite.tenantId,
      studentId: profile?.studentId ?? result.data.userId,
      enrollmentDate: today,
      status: "active",
    });
  } else if (invite.role === "teacher") {
    const profile = invite.profile as { name?: string; subject?: string; department?: string } | null;
    await db.insert(teachers).values({
      userId: result.data.userId,
      name: profile?.name ?? result.data.user.name ?? "Teacher",
      subject: profile?.subject,
      classes: [],
      tenantId: invite.tenantId,
      department: profile?.department,
      hireDate: today,
    });
  }

  return NextResponse.json({ role: invite.role, tenantId: invite.tenantId });
}

async function handleGrantSuperAdmin(body: { userId?: string }) {
  const result = await requireSuperAdmin();
  if (!result.ok) return result.response;

  if (!body.userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const target = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
  if (!target[0]) {
    return NextResponse.json({ error: "That user doesn't exist." }, { status: 404 });
  }

  await db.update(users).set({ role: "super_admin" }).where(eq(users.id, body.userId));
  return NextResponse.json({ success: true });
}

async function handleUpdateUserRole(body: { userId?: string; role?: string }) {
  const result = await requireAdmin();
  if (!result.ok) return result.response;

  const { userId: targetId, role } = body;
  if (!targetId || !role) {
    return NextResponse.json({ error: "userId and role are required." }, { status: 400 });
  }
  const validRoles = ["admin", "teacher", "student", "parent", "staff"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }
  const target = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target[0] || target[0].tenantId !== result.data.tenantId) {
    return NextResponse.json({ error: "That user isn't in your school." }, { status: 404 });
  }
  await db.update(users).set({ role }).where(eq(users.id, targetId));
  return NextResponse.json({ success: true });
}
