import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTeacherOrAdmin, requireTenantMember, assertTenantResource } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const studentId = searchParams.get("studentId");

    if (studentId) {
      const authResult = await requireTenantMember();
      if (!authResult.ok) return authResult.response;

      const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      const check = assertTenantResource(student[0], authResult.data.tenantId, "That student");
      if (check instanceof NextResponse) return check;

      const user = authResult.data.user;
      const isStaff = user.role === "admin" || user.role === "teacher";
      const isSelf = student[0].userId === authResult.data.userId;
      const isParent = student[0].parentId === authResult.data.userId;
      if (!isStaff && !isSelf && !isParent) {
        return NextResponse.json(
          { error: "You can't view that student's attendance." },
          { status: 403 },
        );
      }

      const rows = await db
        .select()
        .from(attendance)
        .where(and(eq(attendance.studentId, studentId), eq(attendance.tenantId, authResult.data.tenantId)))
        .orderBy(attendance.timestamp);
      return NextResponse.json(rows.reverse());
    }

    if (date) {
      const result = await requireTeacherOrAdmin();
      if (!result.ok) return result.response;
      const rows = await db
        .select()
        .from(attendance)
        .where(and(eq(attendance.date, date), eq(attendance.tenantId, result.data.tenantId)));
      return NextResponse.json(rows);
    }

    return NextResponse.json({ error: "Provide date or studentId query param." }, { status: 400 });
  } catch (err) {
    console.error("GET /api/attendance", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireTeacherOrAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { studentId, date, status } = body;

    if (!studentId || !date || !status) {
      return NextResponse.json(
        { error: "studentId, date, and status are required." },
        { status: 400 },
      );
    }

    const validStatuses = ["present", "absent", "late"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    const check = assertTenantResource(student[0], result.data.tenantId, "That student");
    if (check instanceof NextResponse) return check;

    const existing = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.studentId, studentId), eq(attendance.date, date)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(attendance)
        .set({
          status,
          markedBy: result.data.userId,
          timestamp: Date.now(),
        })
        .where(eq(attendance.id, existing[0].id));
      return NextResponse.json({ id: existing[0].id, updated: true });
    }

    const [{ id }] = await db
      .insert(attendance)
      .values({
        studentId,
        date,
        status,
        markedBy: result.data.userId,
        timestamp: Date.now(),
        tenantId: result.data.tenantId,
      })
      .returning({ id: attendance.id });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/attendance", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
