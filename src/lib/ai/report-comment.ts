import Anthropic from "@anthropic-ai/sdk";

/**
 * Draft a report-card comment with Claude (issue #37).
 *
 * The teacher always reviews and approves the draft before anyone else
 * sees it; this only produces a starting point.
 *
 * Model: Claude Opus 5.5 at low effort (a short, well-specified writing
 * task). The previous model, claude-3-5-haiku-latest, is retired.
 * Server-side fallbacks are on, so if a safety classifier declines the
 * request, the API retries it on a suitable model within the same call.
 */
export const REPORT_COMMENT_MODEL = "claude-opus-5-5";

export type DraftInput = {
  studentName: string;
  subject: string;
  term: string;
  rawNotes: string;
  scores?: { subject: string; score: number; max: number }[];
};

export type DraftResult =
  | { ok: true; draft: string; model: string }
  | { ok: false; status: number; error: string };

const SYSTEM_PROMPT =
  "You are a careful, professional teacher's assistant at a Nigerian school. " +
  "You draft report-card comments that the class teacher will review and edit before parents see them. " +
  "Keep them specific, warm and honest. Reply with the comment text only.";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  // Reads ANTHROPIC_API_KEY from the environment.
  client ??= new Anthropic();
  return client;
}

export async function draftReportComment(input: DraftInput): Promise<DraftResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      status: 503,
      error: "The AI comment service isn't configured yet (missing ANTHROPIC_API_KEY).",
    };
  }

  const scoresText =
    input.scores && input.scores.length > 0
      ? input.scores.map((s) => `${s.subject}: ${s.score}/${s.max}`).join(", ")
      : "no scores provided";

  const prompt = [
    `Write the ${input.term} report-card comment for ${input.studentName} in ${input.subject}.`,
    "Use 3-5 sentences: lead with the student's strengths, then one or two concrete areas to improve, and end encouragingly.",
    "Base everything on the teacher's notes and scores below. Don't add facts that aren't there.",
    "",
    `Teacher's notes: ${input.rawNotes}`,
    `Scores: ${scoresText}`,
  ].join("\n");

  try {
    const response = await getClient().beta.messages.create({
      model: REPORT_COMMENT_MODEL,
      max_tokens: 16000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      console.error("Report comment declined", response.stop_details?.category ?? null);
      return {
        ok: false,
        status: 422,
        error: "The AI couldn't draft this comment. Please write it yourself or rephrase your notes.",
      };
    }

    const draft = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("")
      .trim();
    if (!draft) {
      return { ok: false, status: 502, error: "The AI returned an empty draft. Please try again." };
    }
    if (response.stop_reason === "max_tokens") {
      console.warn("Report comment hit max_tokens; returning partial draft");
    }

    return { ok: true, draft, model: response.model };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      console.error("Anthropic credentials rejected", err.status);
      return { ok: false, status: 503, error: "The AI comment service isn't set up correctly. Please tell your administrator." };
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, status: 429, error: "The AI service is busy. Please try again in a minute." };
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error", err.status, err.message);
      return { ok: false, status: 502, error: "The AI service returned an error. Please try again." };
    }
    throw err;
  }
}
