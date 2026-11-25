import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices, payments } from "@/lib/db/schema";
import type { PaymentOutcome } from "./actions";
import { decideSettlement, type PaystackTransaction } from "./rules";

/**
 * Confirming Paystack payments (issues #6 and #17).
 *
 * Two entry points use this, and both end up in `confirmPayment`:
 * - the parent returning from checkout (`verifyPayment` action)
 * - Paystack's signed webhook (`/api/payments/webhook`), which still
 *   settles the payment if the parent closes the tab.
 *
 * We never trust the browser or the webhook body for amounts. We ask
 * Paystack's verify endpoint, check the result against our own payment row,
 * and settle in one transaction with a conditional pending → completed
 * update. Whichever caller gets there second finds nothing pending, so the
 * money is applied to the invoice exactly once.
 */

const PAYSTACK_BASE = "https://api.paystack.co";

export class PaystackUnavailableError extends Error {}

/** Ask Paystack for the current state of a transaction. */
export async function fetchPaystackTransaction(
  reference: string,
): Promise<PaystackTransaction | null> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new PaystackUnavailableError("PAYSTACK_SECRET_KEY is not set.");

  let res: Response;
  try {
    res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
    });
  } catch (err) {
    throw new PaystackUnavailableError(`Paystack request failed: ${String(err)}`);
  }

  const body = (await res.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: { reference?: string; status?: string; amount?: number; currency?: string };
  } | null;

  // Paystack answers 400/404 when the parent never reached checkout.
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok || !body?.status || !body.data) {
    throw new PaystackUnavailableError(`Paystack verify returned ${res.status}: ${body?.message ?? "no body"}`);
  }

  const { data } = body;
  return {
    reference: String(data.reference ?? ""),
    status: String(data.status ?? ""),
    amount: Number(data.amount ?? NaN),
    currency: String(data.currency ?? ""),
  };
}

export type PaymentRow = typeof payments.$inferSelect;

export async function findPaymentByReference(reference: string): Promise<PaymentRow | null> {
  const rows = await db.select().from(payments).where(eq(payments.reference, reference)).limit(1);
  return rows[0] ?? null;
}

/**
 * Confirm one payment with Paystack and settle it if it's genuinely paid.
 * Safe to call any number of times, concurrently, from any entry point.
 */
export async function confirmPayment(payment: PaymentRow): Promise<PaymentOutcome> {
  if (payment.status === "completed") return "already-paid";
  if (payment.status === "failed") return "failed";
  if (payment.status === "needs_review") return "needs-review";
  if (!payment.reference) return "unknown";

  const txn = await fetchPaystackTransaction(payment.reference);
  if (!txn) return "pending";

  const decision = decideSettlement(payment, txn);
  switch (decision.kind) {
    case "already-settled":
      return "already-paid";
    case "wait":
      return "pending";
    case "mark-failed":
      await setStatusIfPending(payment.id, "failed");
      return "failed";
    case "mismatch":
      // Money may have been taken, but not what we asked for. Don't touch
      // the invoice; flag it for the school to look at.
      console.error("Paystack settlement mismatch", {
        paymentId: payment.id,
        reference: payment.reference,
        reason: decision.reason,
      });
      await setStatusIfPending(payment.id, "needs_review");
      return "needs-review";
    case "settle":
      return (await settle(payment, txn.amount)) ? "paid" : "already-paid";
  }
}

async function setStatusIfPending(paymentId: string, status: "failed" | "needs_review") {
  await db
    .update(payments)
    .set({ status })
    .where(and(eq(payments.id, paymentId), eq(payments.status, "pending")));
}

/**
 * Apply a verified payment. Returns false if another request settled it
 * first. The invoice update is a single UPDATE computed from the row's
 * current values, so concurrent payments on one invoice can't overwrite
 * each other.
 */
async function settle(payment: PaymentRow, amountKobo: number): Promise<boolean> {
  return db.transaction(async (tx) => {
    const claimed = await tx
      .update(payments)
      .set({ status: "completed", paymentMethod: "paystack" })
      .where(and(eq(payments.id, payment.id), eq(payments.status, "pending")))
      .returning({ id: payments.id });
    if (claimed.length === 0) return false;

    if (payment.invoiceId) {
      await tx
        .update(invoices)
        .set({
          paidAmountKobo: sql`least(${invoices.amountKobo}, ${invoices.paidAmountKobo} + ${amountKobo})`,
          status: sql`case when ${invoices.paidAmountKobo} + ${amountKobo} >= ${invoices.amountKobo} then 'paid' else 'partial' end`,
          reference: payment.reference,
        })
        .where(and(eq(invoices.id, payment.invoiceId), eq(invoices.tenantId, payment.tenantId)));
    }
    return true;
  });
}
