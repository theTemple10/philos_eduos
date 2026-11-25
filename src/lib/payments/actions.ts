/**
 * Action names accepted by `POST /api/payments`.
 *
 * Shared by the API route and the dashboards so the client can't drift from
 * the server again (issue #16: the parent dashboard sent "initialize" while
 * the server only knew "initializePayment").
 */
export const PAYMENT_ACTIONS = {
  createFeeSchedule: "createFeeSchedule",
  updateFeeSchedule: "updateFeeSchedule",
  createInvoice: "createInvoice",
  generateInvoices: "generateInvoices",
  initializePayment: "initializePayment",
  verifyPayment: "verifyPayment",
} as const;

export type PaymentAction = (typeof PAYMENT_ACTIONS)[keyof typeof PAYMENT_ACTIONS];

/** Result of confirming a payment with Paystack, as returned to the client. */
export type PaymentOutcome =
  | "paid" // settled now
  | "already-paid" // settled earlier (e.g. by the webhook)
  | "pending" // Paystack has no successful charge yet
  | "failed" // Paystack reports the charge failed
  | "needs-review" // money received but it doesn't match the invoice; staff must check
  | "unknown"; // no payment with that reference in this school
