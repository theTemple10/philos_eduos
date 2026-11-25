/**
 * Pure payment rules: Paystack webhook signatures and the decision whether a
 * Paystack transaction may settle one of our payments (issues #6 and #17).
 *
 * No database or network access here, and no "@/" imports, so the unit
 * tests can run under plain `node --test` (see rules.test.ts).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Check a webhook's `x-paystack-signature` header: the HMAC SHA-512 of the
 * raw request body, keyed with the Paystack secret key, in hex.
 * Compared in constant time.
 */
export function isValidPaystackSignature(
  rawBody: string,
  signature: string | null | undefined,
  secretKey: string,
): boolean {
  if (!signature || !secretKey) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The fields we use from Paystack's "verify transaction" response. */
export type PaystackTransaction = {
  reference: string;
  /** "success", "failed", "abandoned", "ongoing", "pending", "reversed", … */
  status: string;
  /** Amount charged, in kobo. */
  amount: number;
  currency: string;
};

/** The fields we use from our own payment row. */
export type PaymentRecord = {
  reference: string | null;
  status: string;
  amountKobo: number;
  currency: string;
};

export type SettlementDecision =
  | { kind: "settle" }
  | { kind: "already-settled" }
  | { kind: "mark-failed" }
  | { kind: "wait" }
  | { kind: "mismatch"; reason: string };

/**
 * Decide what to do with a payment, given what Paystack says about it.
 *
 * Settles only when the reference matches, Paystack reports success, and
 * the amount and currency are exactly what we asked Paystack to charge.
 * A completed payment is never settled twice.
 */
export function decideSettlement(
  payment: PaymentRecord,
  txn: PaystackTransaction,
): SettlementDecision {
  if (payment.status === "completed") return { kind: "already-settled" };
  if (payment.status !== "pending") {
    // failed / needs_review are final until a person looks at them.
    return { kind: "wait" };
  }
  if (!payment.reference || txn.reference !== payment.reference) {
    return { kind: "mismatch", reason: "reference does not match" };
  }
  if (txn.status === "failed") return { kind: "mark-failed" };
  if (txn.status !== "success") return { kind: "wait" };
  if (txn.currency !== payment.currency) {
    return {
      kind: "mismatch",
      reason: `currency ${txn.currency} does not match ${payment.currency}`,
    };
  }
  if (txn.amount !== payment.amountKobo) {
    return {
      kind: "mismatch",
      reason: `amount ${txn.amount} does not match ${payment.amountKobo}`,
    };
  }
  return { kind: "settle" };
}

/**
 * New invoice balance after a settled payment. Mirrors the single SQL
 * UPDATE in settle.ts, which is what actually runs; kept here so the rule
 * is written down and tested.
 */
export function applyPaymentToInvoice(
  invoice: { amountKobo: number; paidAmountKobo: number },
  paymentKobo: number,
): { paidAmountKobo: number; status: "paid" | "partial" } {
  const total = invoice.paidAmountKobo + paymentKobo;
  return {
    paidAmountKobo: Math.min(total, invoice.amountKobo),
    status: total >= invoice.amountKobo ? "paid" : "partial",
  };
}
