import { NextResponse } from "next/server";
import { isValidPaystackSignature } from "@/lib/payments/rules";
import {
  PaystackUnavailableError,
  confirmPayment,
  findPaymentByReference,
} from "@/lib/payments/settle";

/**
 * Paystack webhook (issue #17).
 *
 * Configure in Paystack → Settings → API Keys & Webhooks:
 *   Webhook URL: https://<site>/api/payments/webhook
 *
 * Paystack signs each event with `x-paystack-signature`: the HMAC SHA-512 of
 * the raw body, keyed with our secret key. Anything without a valid
 * signature is rejected.
 *
 * We only use the event to learn *which* reference changed. The amount and
 * status are re-read from Paystack's verify endpoint inside confirmPayment,
 * the same path the parent's return from checkout uses, so the two can
 * race safely.
 *
 * Response codes: 401 for a bad signature; 200 once the event is handled or
 * deliberately ignored; 503 if Paystack can't be reached, so Paystack
 * retries later.
 */
export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("Paystack webhook received but PAYSTACK_SECRET_KEY is not set");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!isValidPaystackSignature(rawBody, signature, secretKey)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: unknown } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Only successful charges settle anything. Other events are acknowledged
  // so Paystack doesn't keep retrying them.
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = typeof event.data?.reference === "string" ? event.data.reference : "";
  const payment = reference ? await findPaymentByReference(reference) : null;
  if (!payment) {
    // Not one of ours (e.g. another integration on the same Paystack account).
    console.warn("Paystack webhook: unknown reference", reference);
    return NextResponse.json({ received: true });
  }

  try {
    const outcome = await confirmPayment(payment);
    return NextResponse.json({ received: true, outcome });
  } catch (err) {
    if (err instanceof PaystackUnavailableError) {
      console.error("Paystack webhook: verify unavailable", err.message);
      return NextResponse.json({ error: "Try again later." }, { status: 503 });
    }
    console.error("Paystack webhook failed", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
