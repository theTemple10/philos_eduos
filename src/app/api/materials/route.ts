import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studyMaterials, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTenantMember, requireTeacherOrAdmin, requireRole, assertTenantResource } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MATERIALS_BUCKET,
  checkMaterialFile,
  isPathInScope,
  isSafeExternalUrl,
  storagePathOf,
} from "@/lib/materials/files";

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

    // Uploaded file (#4): it must sit in this school's and class's folder and
    // really exist; its type comes from our own rules, not the request.
    // Otherwise it's a link, which must be http(s).
    let storedType = String(fileType);
    const path = storagePathOf(String(fileUrl));
    if (path) {
      if (!isPathInScope(path, result.data.tenantId, classId)) {
        return NextResponse.json({ error: "That file doesn't belong to this class." }, { status: 400 });
      }
      const rule = checkMaterialFile({ name: path, size: 1 });
      if (!rule.ok) return NextResponse.json({ error: rule.error }, { status: 400 });
      storedType = rule.label;
      const { data: exists } = await createAdminClient().storage.from(MATERIALS_BUCKET).exists(path);
      if (!exists) {
        return NextResponse.json(
          { error: "The upload didn't finish. Please choose the file and try again." },
          { status: 400 },
        );
      }
    } else if (!isSafeExternalUrl(String(fileUrl))) {
      return NextResponse.json({ error: "Links must start with http:// or https://." }, { status: 400 });
    }

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
        fileType: storedType.slice(0, 20),
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

    // Remove the uploaded file too, if it was one (#4). A failure here leaves
    // an unreferenced file but must not undo the delete.
    const path = storagePathOf(rows[0].fileUrl);
    if (path && isPathInScope(path, result.data.tenantId)) {
      const { error } = await createAdminClient().storage.from(MATERIALS_BUCKET).remove([path]);
      if (error) console.error("material file removal failed", path, error);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/materials", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
