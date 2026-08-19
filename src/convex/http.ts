import { httpRouter } from "convex/server";
import { createHmac } from "crypto";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Paystack webhook. Paystack signs every event with an HMAC-SHA512 of the
// raw request body using your secret key; we verify before trusting anything.
// The secret key lives as the PAYSTACK_SECRET_KEY Convex env var — never on
// the client.
http.route({
  path: "/paystack-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("PAYSTACK_SECRET_KEY is not configured; rejecting webhook.");
      return new Response("Paystack not configured", { status: 500 });
    }

    const signature = request.headers.get("x-paystack-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 401 });
    }

    const body = await request.text();
    const expected = createHmac("sha512", secretKey).update(body).digest("hex");
    if (signature !== expected) {
      return new Response("Bad signature", { status: 401 });
    }

    let payload: {
      event?: string;
      data?: { reference?: string; amount?: number };
    };
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (payload.event === "charge.success" && payload.data?.reference) {
      await ctx.runMutation(internal.payments.recordSuccessfulPayment, {
        reference: payload.data.reference,
        amountKobo: payload.data.amount ?? 0,
      });
    }
    // Always ack — Paystack retries otherwise, and we only act on success.
    return new Response("OK", { status: 200 });
  }),
});

export default http;