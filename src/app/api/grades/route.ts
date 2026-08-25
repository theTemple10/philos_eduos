import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { grades, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTeacherOrAdmin, requireTenantMember, assertTenantResource } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const myGrades = searchParams.get("myGrades") === "true";

    if (myGrades) {
      const authResult = await requireTenantMember();
      if (!authResult.ok) return authResult.response;
      const studentRows = await db
        .select()
        .from(students)
        .where(and(eq(students.userId, authResult.data.userId), eq(students.tenantId, authResult.data.tenantId)));
      if (!studentRows[0]) return NextResponse.json([]);
      const rows = await db
        .select()
        .from(grades)
        .where(and(eq(grades.studentId, studentRows[0].id), eq(grades.tenantId, authResult.data.tenantId)));
      return NextResponse.json(rows.reverse());
    }

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
          { error: "You can't view that student's grades." },
          { status: 403 },
        );
      }

      const rows = await db
        .select()
        .from(grades)
        .where(and(eq(grades.studentId, studentId), eq(grades.tenantId, authResult.data.tenantId)));
      return NextResponse.json(rows.reverse());
    }

    return NextResponse.json(
      { error: "Provide studentId or myGrades query param." },
      { status: 400 },
    );
  } catch (err) {
    console.error("GET /api/grades", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireTeacherOrAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { studentId, subject, score, maxScore, date, comments } = body;

    if (!studentId || !subject?.trim() || score === undefined || !maxScore || !date) {
      return NextResponse.json(
        { error: "studentId, subject, score, maxScore, and date are required." },
        { status: 400 },
      );
    }
    if (maxScore <= 0) {
      return NextResponse.json(
        { error: "Maximum score must be greater than zero." },
        { status: 400 },
      );
    }
    if (score < 0 || score > maxScore) {
      return NextResponse.json(
        { error: "Score must be between 0 and the maximum score." },
        { status: 400 },
      );
    }

    const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    const check = assertTenantResource(student[0], result.data.tenantId, "That student");
    if (check instanceof NextResponse) return check;

    const [{ id }] = await db
      .insert(grades)
      .values({
        studentId,
        subject: subject.trim(),
        score,
        maxScore,
        date,
        gradedBy: result.data.userId,
        comments: comments ?? null,
        tenantId: result.data.tenantId,
      })
      .returning({ id: grades.id });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/grades", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await requireTeacherOrAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { id, subject, score, maxScore, date, comments } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(grades).where(eq(grades.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That grade");
    if (check instanceof NextResponse) return check;

    const updates: Record<string, unknown> = {};
    if (subject !== undefined) updates.subject = subject.trim();
    if (score !== undefined) updates.score = score;
    if (maxScore !== undefined) updates.maxScore = maxScore;
    if (date !== undefined) updates.date = date;
    if (comments !== undefined) updates.comments = comments;
    updates.gradedBy = result.data.userId;

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    await db.update(grades).set(updates).where(eq(grades.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/grades", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await requireTeacherOrAdmin();
    if (!result.ok) return result.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(grades).where(eq(grades.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That grade");
    if (check instanceof NextResponse) return check;

    await db.delete(grades).where(eq(grades.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/grades", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
