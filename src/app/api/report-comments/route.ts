import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportComments, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTeacherOrAdmin, requireTenantMember, assertTenantResource } from "@/lib/api/auth";
import { REPORT_COMMENT_ACTIONS } from "@/lib/report-comments/actions";
import { draftReportComment } from "@/lib/ai/report-comment";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const approvedOnly = searchParams.get("approved") === "true";

    if (studentId && approvedOnly) {
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
          { error: "You don't have access to that student's report comments." },
          { status: 403 },
        );
      }

      const rows = await db
        .select()
        .from(reportComments)
        .where(
          and(
            eq(reportComments.studentId, studentId),
            eq(reportComments.tenantId, authResult.data.tenantId),
            eq(reportComments.status, "approved"),
          ),
        );
      return NextResponse.json(rows);
    }

    if (studentId) {
      const result = await requireTeacherOrAdmin();
      if (!result.ok) return result.response;
      const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
      const check = assertTenantResource(student[0], result.data.tenantId, "That student");
      if (check instanceof NextResponse) return check;

      const rows = await db
        .select()
        .from(reportComments)
        .where(
          and(
            eq(reportComments.studentId, studentId),
            eq(reportComments.tenantId, result.data.tenantId),
          ),
        );
      return NextResponse.json(rows);
    }

    const result = await requireTeacherOrAdmin();
    if (!result.ok) return result.response;
    const rows = await db
      .select()
      .from(reportComments)
      .where(eq(reportComments.tenantId, result.data.tenantId));
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/report-comments", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case REPORT_COMMENT_ACTIONS.saveDraft:
        return handleSaveDraft(body);
      case REPORT_COMMENT_ACTIONS.updateDraft:
        return handleUpdateDraft(body);
      case REPORT_COMMENT_ACTIONS.approve:
        return handleApprove(body);
      case REPORT_COMMENT_ACTIONS.delete:
        return handleDelete(body);
      case REPORT_COMMENT_ACTIONS.draftWithAI:
        return handleDraftWithAI(body);
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    console.error("POST /api/report-comments", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

async function handleSaveDraft(body: {
  studentId?: string;
  subject?: string;
  term?: string;
  rawNotes?: string;
  scores?: { subject: string; score: number; max: number }[];
  draft?: string;
}) {
  const result = await requireTeacherOrAdmin();
  if (!result.ok) return result.response;

  const { studentId, subject, term, scores, draft } = body;
  // Notes are optional here: a comment-bank draft (#40) may have none.
  const rawNotes = typeof body.rawNotes === "string" ? body.rawNotes.trim() : "";
  if (!studentId || !subject?.trim() || !term?.trim() || !draft?.trim()) {
    return NextResponse.json(
      { error: "studentId, subject, term and draft are required." },
      { status: 400 },
    );
  }

  const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  const check = assertTenantResource(student[0], result.data.tenantId, "That student");
  if (check instanceof NextResponse) return check;

  const [{ id }] = await db
    .insert(reportComments)
    .values({
      tenantId: result.data.tenantId,
      studentId,
      subject: subject.trim(),
      term: term.trim(),
      rawNotes,
      scores: scores ?? null,
      draft,
      status: "draft",
      // Written by the teacher or picked from the comment bank, not AI.
      model: "manual",
      createdBy: result.data.userId,
      createdAt: Date.now(),
    })
    .returning({ id: reportComments.id });

  return NextResponse.json({ id });
}

async function handleUpdateDraft(body: {
  id?: string;
  draft?: string;
}) {
  const result = await requireTeacherOrAdmin();
  if (!result.ok) return result.response;

  const { id, draft } = body;
  if (!id || !draft) {
    return NextResponse.json({ error: "id and draft are required." }, { status: 400 });
  }

  const rows = await db.select().from(reportComments).where(eq(reportComments.id, id)).limit(1);
  const check = assertTenantResource(rows[0], result.data.tenantId, "That comment");
  if (check instanceof NextResponse) return check;

  if (rows[0].status === "approved") {
    return NextResponse.json(
      { error: "That comment is already approved and can't be edited." },
      { status: 400 },
    );
  }

  await db.update(reportComments).set({ draft: draft.trim() }).where(eq(reportComments.id, id));
  return NextResponse.json({ success: true });
}

async function handleApprove(body: {
  id?: string;
  finalText?: string;
}) {
  const result = await requireTeacherOrAdmin();
  if (!result.ok) return result.response;

  const { id, finalText } = body;
  if (!id || !finalText) {
    return NextResponse.json({ error: "id and finalText are required." }, { status: 400 });
  }

  const rows = await db.select().from(reportComments).where(eq(reportComments.id, id)).limit(1);
  const check = assertTenantResource(rows[0], result.data.tenantId, "That comment");
  if (check instanceof NextResponse) return check;

  if (rows[0].status === "approved") {
    return NextResponse.json(
      { error: "That comment is already approved." },
      { status: 400 },
    );
  }

  const trimmed = finalText.trim();
  if (trimmed.length < 20) {
    return NextResponse.json(
      { error: "The final comment is too short to approve." },
      { status: 400 },
    );
  }

  await db
    .update(reportComments)
    .set({
      finalText: trimmed,
      status: "approved",
      approvedBy: result.data.userId,
      approvedAt: Date.now(),
    })
    .where(eq(reportComments.id, id));

  return NextResponse.json({ success: true });
}

async function handleDelete(body: { id?: string }) {
  const result = await requireTeacherOrAdmin();
  if (!result.ok) return result.response;

  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const rows = await db.select().from(reportComments).where(eq(reportComments.id, id)).limit(1);
  const check = assertTenantResource(rows[0], result.data.tenantId, "That comment");
  if (check instanceof NextResponse) return check;

  await db.delete(reportComments).where(eq(reportComments.id, id));
  return NextResponse.json({ success: true });
}

async function handleDraftWithAI(body: {
  studentId?: string;
  subject?: string;
  term?: string;
  rawNotes?: string;
  scores?: { subject: string; score: number; max: number }[];
}) {
  const result = await requireTeacherOrAdmin();
  if (!result.ok) return result.response;

  const { studentId, subject, term, rawNotes, scores } = body;
  if (!studentId || !subject?.trim() || !term?.trim() || !rawNotes) {
    return NextResponse.json(
      { error: "studentId, subject, term, and rawNotes are required." },
      { status: 400 },
    );
  }

  const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  const check = assertTenantResource(student[0], result.data.tenantId, "That student");
  if (check instanceof NextResponse) return check;

  const ai = await draftReportComment({
    studentName: student[0].name,
    subject: subject.trim(),
    term: term.trim(),
    rawNotes,
    scores,
  });
  if (!ai.ok) {
    return NextResponse.json({ error: ai.error }, { status: ai.status });
  }
  const draft = ai.draft;

  const [{ id }] = await db
    .insert(reportComments)
    .values({
      tenantId: result.data.tenantId,
      studentId,
      subject: subject.trim(),
      term: term.trim(),
      rawNotes,
      scores: scores ?? null,
      draft,
      status: "draft",
      model: ai.model,
      createdBy: result.data.userId,
      createdAt: Date.now(),
    })
    .returning({ id: reportComments.id });

  return NextResponse.json({ id, draft });
}
