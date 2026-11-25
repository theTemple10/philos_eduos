/**
 * Action names accepted by `POST /api/report-comments`.
 *
 * Shared by the API route and the teacher dashboard so they can't drift
 * (#19 used PATCH/DELETE, which the route never had; #37 sent "draft"
 * instead of "draftWithAI").
 */
export const REPORT_COMMENT_ACTIONS = {
  saveDraft: "saveDraft",
  updateDraft: "updateDraft",
  approve: "approve",
  delete: "delete",
  draftWithAI: "draftWithAI",
} as const;

export type ReportCommentAction =
  (typeof REPORT_COMMENT_ACTIONS)[keyof typeof REPORT_COMMENT_ACTIONS];
