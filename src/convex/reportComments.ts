import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { requireTeacherOrAdmin, requireActionAuth, assertTenantResource } from "./helpers";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// AI-assisted report card comments.
//
// The model drafts a narrative comment from the teacher's raw notes and
// scores. Nothing is published to parents/students until a human approves it:
// every row keeps raw notes, the draft, the final (edited) text, and who
// approved it, so schools can always answer "did a human sign off on this?".
// ---------------------------------------------------------------------------

const MODEL = "claude-3-5-haiku-latest";

export const getReportComments = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireTeacherOrAdmin(ctx);
    return await ctx.db
      .query("reportComments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
  },
});

export const getReportCommentsForStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTeacherOrAdmin(ctx);
    const student = await ctx.db.get(args.studentId);
    await assertTenantResource(student, tenantId, "That student");
    return await ctx.db
      .query("reportComments")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("tenantId"), tenantId))
      .order("desc")
      .collect();
  },
});

/**
 * Drafts a report card comment by calling the Anthropic API directly.
 * The result is stored as a draft — nothing is published automatically.
 */
export const draftReportComment = action({
  args: {
    studentId: v.id("students"),
    subject: v.string(),
    term: v.string(),
    rawNotes: v.string(),
    scores: v.optional(
      v.array(v.object({ subject: v.string(), score: v.number(), max: v.number() })),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ commentId: Id<"reportComments">; draft: string; authorName?: string }> => {
    const { user } = await requireActionAuth(ctx);
    // Verify the caller may view this student before spending an AI call.
    const student = await ctx.runQuery(api.students.getStudent, {
      studentId: args.studentId,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ConvexError(
        "The AI comment service isn't configured yet (missing ANTHROPIC_API_KEY).",
      );
    }

    const scoresText =
      args.scores && args.scores.length > 0
        ? args.scores
            .map((s) => `${s.subject}: ${s.score}/${s.max}`)
            .join(", ")
        : "no scores provided";

    const prompt = [
      `You are writing the ${args.term} report card comment for ${student.name} in ${args.subject}.`,
      `Write 3-5 warm, professional sentences for a Nigerian premium private school.`,
      `Lead with the student's strengths, then one or two concrete areas for improvement, and end encouragingly.`,
      `Base everything strictly on the teacher's notes below. Never invent facts that are not in the notes.`,
      `Teacher's notes: ${args.rawNotes}`,
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
      const body = await response.text();
      console.error("Anthropic API error", response.status, body.slice(0, 500));
      throw new ConvexError("The AI service returned an error. Please try again.");
    }

    const data = (await response.json()) as { content?: { text?: string }[] };
    const draft = (data.content ?? []).map((c) => c.text ?? "").join("").trim();
    if (!draft) {
      throw new ConvexError("The AI service returned an empty draft. Please try again.");
    }

    const commentId = await ctx.runMutation(api.reportComments.saveDraft, {
      studentId: args.studentId,
      subject: args.subject,
      term: args.term,
      rawNotes: args.rawNotes,
      scores: args.scores,
      draft,
      model: MODEL,
    });
    return { commentId, draft, authorName: user.name ?? undefined };
  },
});

// Internal: called from the action above (which already did the auth check).
export const saveDraft = mutation({
  args: {
    studentId: v.id("students"),
    subject: v.string(),
    term: v.string(),
    rawNotes: v.string(),
    scores: v.optional(
      v.array(v.object({ subject: v.string(), score: v.number(), max: v.number() })),
    ),
    draft: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId } = await requireTeacherOrAdmin(ctx);
    return await ctx.db.insert("reportComments", {
      tenantId,
      studentId: args.studentId,
      subject: args.subject.trim(),
      term: args.term.trim(),
      rawNotes: args.rawNotes,
      scores: args.scores,
      draft: args.draft,
      status: "draft",
      model: args.model,
      createdBy: userId,
      createdAt: Date.now(),
    });
  },
});

/** Edit the draft text before approval (teacher/admin of the tenant). */
export const updateDraft = mutation({
  args: {
    id: v.id("reportComments"),
    draft: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTeacherOrAdmin(ctx);
    const comment = await assertTenantResource(
      await ctx.db.get(args.id),
      tenantId,
      "That comment",
    );
    if (comment.status === "approved") {
      throw new ConvexError("That comment is already approved and can't be edited.");
    }
    await ctx.db.patch(args.id, { draft: args.draft.trim() });
  },
});

/**
 * Human approval: a teacher/admin saves the final text, recorded with who
 * approved it and when. This is the only path to a published comment.
 */
export const approveReportComment = mutation({
  args: {
    id: v.id("reportComments"),
    finalText: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, tenantId, user } = await requireTeacherOrAdmin(ctx);
    const comment = await assertTenantResource(
      await ctx.db.get(args.id),
      tenantId,
      "That comment",
    );
    if (comment.status === "approved") {
      throw new ConvexError("That comment is already approved.");
    }
    const finalText = args.finalText.trim();
    if (finalText.length < 20) {
      throw new ConvexError("The final comment is too short to approve.");
    }
    await ctx.db.patch(args.id, {
      finalText,
      status: "approved",
      approvedBy: userId,
      approvedAt: Date.now(),
    });
    return { approvedByName: user.name ?? undefined };
  },
});

export const deleteReportComment = mutation({
  args: { id: v.id("reportComments") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTeacherOrAdmin(ctx);
    const comment = await ctx.db.get(args.id);
    await assertTenantResource(comment, tenantId, "That comment");
    await ctx.db.delete(args.id);
  },
});