import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teachers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole, requireAdmin, requireTenantMember, assertTenantResource } from "@/lib/api/auth";

const STAFF_ROLES = ["admin", "teacher"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const byUser = searchParams.get("byUser") === "true";

    if (byUser) {
      const result = await requireTenantMember();
      if (!result.ok) return result.response;
      const rows = await db
        .select()
        .from(teachers)
        .where(and(eq(teachers.userId, result.data.userId), eq(teachers.tenantId, result.data.tenantId)));
      return NextResponse.json(rows[0] ?? null);
    }

    const result = await requireRole(STAFF_ROLES);
    if (!result.ok) return result.response;
    const rows = await db
      .select()
      .from(teachers)
      .where(eq(teachers.tenantId, result.data.tenantId));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/teachers", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { userId, name, subject, classes, department, hireDate } = body;

    if (!userId || !name?.trim() || !hireDate) {
      return NextResponse.json(
        { error: "userId, name, and hireDate are required." },
        { status: 400 },
      );
    }
    if (!Array.isArray(classes)) {
      return NextResponse.json({ error: "classes must be an array." }, { status: 400 });
    }

    const linkedUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const luCheck = assertTenantResource(linkedUser[0], result.data.tenantId, "That user");
    if (luCheck instanceof NextResponse) return luCheck;

    const existing = await db
      .select()
      .from(teachers)
      .where(and(eq(teachers.userId, userId), eq(teachers.tenantId, result.data.tenantId)))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json(
        { error: "That user is already a teacher in your school." },
        { status: 400 },
      );
    }

    const { classes: classesTable } = await import("@/lib/db/schema");
    for (const classId of classes) {
      const cls = await db.select().from(classesTable).where(eq(classesTable.id, classId)).limit(1);
      const cc = assertTenantResource(cls[0], result.data.tenantId, "That class");
      if (cc instanceof NextResponse) return cc;
    }

    if (!linkedUser[0].role) {
      await db.update(users).set({ role: "teacher" }).where(eq(users.id, userId));
    }

    const [{ id }] = await db
      .insert(teachers)
      .values({
        userId,
        name: name.trim(),
        subject: subject ?? null,
        classes,
        department: department ?? null,
        hireDate,
        tenantId: result.data.tenantId,
      })
      .returning({ id: teachers.id });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/teachers", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { id, name, subject, classes, department } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(teachers).where(eq(teachers.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That teacher");
    if (check instanceof NextResponse) return check;

    if (classes) {
      const { classes: classesTable } = await import("@/lib/db/schema");
      for (const classId of classes) {
        const cls = await db.select().from(classesTable).where(eq(classesTable.id, classId)).limit(1);
        const cc = assertTenantResource(cls[0], result.data.tenantId, "That class");
        if (cc instanceof NextResponse) return cc;
      }
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (subject !== undefined) updates.subject = subject;
    if (classes !== undefined) updates.classes = classes;
    if (department !== undefined) updates.department = department;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    await db.update(teachers).set(updates).where(eq(teachers.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/teachers", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(teachers).where(eq(teachers.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That teacher");
    if (check instanceof NextResponse) return check;

    await db.delete(teachers).where(eq(teachers.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/teachers", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
