import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students, classes, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole, requireAdmin, requireTenantMember, assertTenantResource } from "@/lib/api/auth";

const STAFF_ROLES = ["admin", "teacher"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const byUser = searchParams.get("byUser") === "true";

    if (byUser) {
      const result = await requireTenantMember();
      if (!result.ok) return result.response;
      const rows = await db
        .select()
        .from(students)
        .where(and(eq(students.userId, result.data.userId), eq(students.tenantId, result.data.tenantId)));
      return NextResponse.json(rows[0] ?? null);
    }

    if (classId) {
      const result = await requireRole(STAFF_ROLES);
      if (!result.ok) return result.response;
      const cls = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
      const check = assertTenantResource(cls[0], result.data.tenantId, "That class");
      if (check instanceof NextResponse) return check;
      const rows = await db
        .select()
        .from(students)
        .where(and(eq(students.classId, classId), eq(students.tenantId, result.data.tenantId)));
      return NextResponse.json(rows);
    }

    const result = await requireRole(STAFF_ROLES);
    if (!result.ok) return result.response;
    const rows = await db
      .select()
      .from(students)
      .where(eq(students.tenantId, result.data.tenantId));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/students", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { name, classId, userId, parentId, studentId, enrollmentDate, status } = body;

    if (!name?.trim() || !studentId?.trim() || !enrollmentDate || !classId) {
      return NextResponse.json(
        { error: "name, classId, studentId, and enrollmentDate are required." },
        { status: 400 },
      );
    }

    const cls = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    const check = assertTenantResource(cls[0], result.data.tenantId, "That class");
    if (check instanceof NextResponse) return check;

    for (const linkId of [userId, parentId].filter(Boolean)) {
      const linked = await db.select().from(users).where(eq(users.id, linkId)).limit(1);
      const lc = assertTenantResource(linked[0], result.data.tenantId, "That linked user");
      if (lc instanceof NextResponse) return lc;
    }

    const existing = await db
      .select()
      .from(students)
      .where(and(eq(students.studentId, studentId.trim()), eq(students.tenantId, result.data.tenantId)))
      .limit(1);
    if (existing[0]) {
      return NextResponse.json(
        { error: "A student with that ID already exists in your school." },
        { status: 400 },
      );
    }

    const [{ id }] = await db
      .insert(students)
      .values({
        name: name.trim(),
        classId,
        userId: userId ?? null,
        parentId: parentId ?? null,
        studentId: studentId.trim(),
        enrollmentDate,
        status: status ?? "active",
        tenantId: result.data.tenantId,
      })
      .returning({ id: students.id });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/students", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { id, name, classId, userId, parentId, status } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(students).where(eq(students.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That student");
    if (check instanceof NextResponse) return check;

    if (classId) {
      const cls = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
      const cc = assertTenantResource(cls[0], result.data.tenantId, "That class");
      if (cc instanceof NextResponse) return cc;
    }
    for (const linkId of [userId, parentId].filter(Boolean)) {
      const linked = await db.select().from(users).where(eq(users.id, linkId)).limit(1);
      const lc = assertTenantResource(linked[0], result.data.tenantId, "That linked user");
      if (lc instanceof NextResponse) return lc;
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (classId !== undefined) updates.classId = classId;
    if (userId !== undefined) updates.userId = userId;
    if (parentId !== undefined) updates.parentId = parentId;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    await db.update(students).set(updates).where(eq(students.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/students", err);
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

    const rows = await db.select().from(students).where(eq(students.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That student");
    if (check instanceof NextResponse) return check;

    await db.delete(students).where(eq(students.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/students", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
