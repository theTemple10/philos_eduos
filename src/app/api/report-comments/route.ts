import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportComments, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTeacherOrAdmin, requireTenantMember, assertTenantResource } from "@/lib/api/auth";

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
      case "saveDraft":
        return handleSaveDraft(body);
      case "updateDraft":
        return handleUpdateDraft(body);
      case "approve":
        return handleApprove(body);
      case "delete":
        return handleDelete(body);
      case "draftWithAI":
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

  const { studentId, subject, term, rawNotes, scores, draft } = body;
  if (!studentId || !subject?.trim() || !term?.trim() || !rawNotes || !draft) {
    return NextResponse.json(
      { error: "studentId, subject, term, rawNotes, and draft are required." },
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
      model: "claude-3-5-haiku-latest",
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "The AI comment service isn't configured yet (missing ANTHROPIC_API_KEY)." },
      { status: 500 },
    );
  }

  const MODEL = "claude-3-5-haiku-latest";
  const scoresText =
    scores && scores.length > 0
      ? scores.map((s) => `${s.subject}: ${s.score}/${s.max}`).join(", ")
      : "no scores provided";

  const prompt = [
    `You are writing the ${term} report card comment for ${student[0].name} in ${subject}.`,
    `Write 3-5 warm, professional sentences for a Nigerian premium private school.`,
    `Lead with the student's strengths, then one or two concrete areas for improvement, and end encouragingly.`,
    `Base everything strictly on the teacher's notes below. Never invent facts that are not in the notes.`,
    `Teacher's notes: ${rawNotes}`,
    `Scores: ${scoresText}`,
  ].join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system:
        "You are a careful, professional teacher's assistant. You draft report card comments that a human teacher will review and edit. Keep them specific and honest.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Anthropic API error", response.status, errorBody.slice(0, 500));
    return NextResponse.json(
      { error: "The AI service returned an error. Please try again." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as { content?: { text?: string }[] };
  const draft = (data.content ?? []).map((c) => c.text ?? "").join("").trim();
  if (!draft) {
    return NextResponse.json(
      { error: "The AI service returned an empty draft. Please try again." },
      { status: 502 },
    );
  }

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
      model: MODEL,
      createdBy: result.data.userId,
      createdAt: Date.now(),
    })
    .returning({ id: reportComments.id });

  return NextResponse.json({ id, draft });
}
