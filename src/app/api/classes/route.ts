import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classes, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireTenantMember, requireAdmin, assertTenantResource } from "@/lib/api/auth";

export async function GET() {
  try {
    const result = await requireTenantMember();
    if (!result.ok) return result.response;
    const rows = await db
      .select()
      .from(classes)
      .where(eq(classes.tenantId, result.data.tenantId));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/classes", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { name, gradeLevel, teacherId, room, capacity } = body;

    if (!name?.trim() || !gradeLevel?.trim()) {
      return NextResponse.json(
        { error: "name and gradeLevel are required." },
        { status: 400 },
      );
    }
    if (capacity === undefined || capacity === null || capacity < 0) {
      return NextResponse.json(
        { error: "capacity must be a non-negative number." },
        { status: 400 },
      );
    }

    if (teacherId) {
      const { users } = await import("@/lib/db/schema");
      const teacher = await db.select().from(users).where(eq(users.id, teacherId)).limit(1);
      const check = assertTenantResource(teacher[0], result.data.tenantId, "That teacher");
      if (check instanceof NextResponse) return check;
    }

    const [{ inserted }] = await db
      .insert(classes)
      .values({
        name: name.trim(),
        gradeLevel: gradeLevel.trim(),
        teacherId: teacherId ?? null,
        tenantId: result.data.tenantId,
        room: room ?? null,
        capacity,
      })
      .returning({ inserted: classes.id });

    return NextResponse.json({ id: inserted });
  } catch (err) {
    console.error("POST /api/classes", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { id, name, gradeLevel, teacherId, room, capacity } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
    const cls = assertTenantResource(rows[0], result.data.tenantId, "That class");
    if (cls instanceof NextResponse) return cls;

    if (teacherId) {
      const { users } = await import("@/lib/db/schema");
      const teacher = await db.select().from(users).where(eq(users.id, teacherId)).limit(1);
      const check = assertTenantResource(teacher[0], result.data.tenantId, "That teacher");
      if (check instanceof NextResponse) return check;
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim();
    if (gradeLevel !== undefined) updates.gradeLevel = gradeLevel.trim();
    if (teacherId !== undefined) updates.teacherId = teacherId;
    if (room !== undefined) updates.room = room;
    if (capacity !== undefined) updates.capacity = capacity;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    await db.update(classes).set(updates).where(eq(classes.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/classes", err);
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

    const rows = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
    const cls = assertTenantResource(rows[0], result.data.tenantId, "That class");
    if (cls instanceof NextResponse) return cls;

    const hasStudents = await db
      .select()
      .from(students)
      .where(eq(students.classId, id))
      .limit(1);
    if (hasStudents[0]) {
      return NextResponse.json(
        { error: "Move or remove the students in this class before deleting it." },
        { status: 400 },
      );
    }

    await db.delete(classes).where(eq(classes.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/classes", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
