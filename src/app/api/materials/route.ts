import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studyMaterials, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTenantMember, requireTeacherOrAdmin, requireRole, assertTenantResource } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (studentId) {
      const authResult = await requireTenantMember();
      if (!authResult.ok) return authResult.response;

      const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      const check = assertTenantResource(student[0], authResult.data.tenantId, "That student");
      if (check instanceof NextResponse) return check;

      const user = authResult.data.user;
      const isAdminOrTeacher = user.role === "admin" || user.role === "teacher";
      const isSelf = student[0].userId === authResult.data.userId;
      const isParent = student[0].parentId === authResult.data.userId;
      if (!isAdminOrTeacher && !isSelf && !isParent) {
        return NextResponse.json(
          { error: "You don't have access to that student's materials." },
          { status: 403 },
        );
      }

      const rows = await db
        .select()
        .from(studyMaterials)
        .where(
          and(
            eq(studyMaterials.classId, student[0].classId),
            eq(studyMaterials.tenantId, authResult.data.tenantId),
          ),
        );
      return NextResponse.json(rows);
    }

    const result = await requireTenantMember();
    if (!result.ok) return result.response;
    const rows = await db
      .select()
      .from(studyMaterials)
      .where(eq(studyMaterials.tenantId, result.data.tenantId));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/materials", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireTeacherOrAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { title, description, subject, classId, fileUrl, fileType } = body;

    if (!title?.trim() || !subject?.trim() || !classId || !fileUrl || !fileType) {
      return NextResponse.json(
        { error: "title, subject, classId, fileUrl, and fileType are required." },
        { status: 400 },
      );
    }

    const { classes } = await import("@/lib/db/schema");
    const cls = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    const check = assertTenantResource(cls[0], result.data.tenantId, "That class");
    if (check instanceof NextResponse) return check;

    const [{ id }] = await db
      .insert(studyMaterials)
      .values({
        title: title.trim(),
        description: description ?? null,
        subject: subject.trim(),
        classId,
        uploadedBy: result.data.userId,
        tenantId: result.data.tenantId,
        fileUrl,
        fileType,
        createdAt: Date.now(),
      })
      .returning({ id: studyMaterials.id });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/materials", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await requireRole(["admin", "teacher"]);
    if (!result.ok) return result.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(studyMaterials).where(eq(studyMaterials.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That material");
    if (check instanceof NextResponse) return check;

    await db.delete(studyMaterials).where(eq(studyMaterials.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/materials", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
