/**
 * Unit tests for the payment rules (issues #6, #17).
 * Run with `npm test` (Node's built-in test runner; no extra dependencies).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  applyPaymentToInvoice,
  decideSettlement,
  isValidPaystackSignature,
  type PaymentRecord,
  type PaystackTransaction,
} from "./rules.ts";

const SECRET = "sk_test_example";
const sign = (body: string, key = SECRET) =>
  createHmac("sha512", key).update(body, "utf8").digest("hex");

test("signature: accepts Paystack's HMAC SHA-512 of the raw body", () => {
  const body = '{"event":"charge.success","data":{"reference":"PE-1"}}';
  assert.equal(isValidPaystackSignature(body, sign(body), SECRET), true);
});

test("signature: rejects a missing, wrong-key or tampered signature", () => {
  const body = '{"event":"charge.success"}';
  assert.equal(isValidPaystackSignature(body, null, SECRET), false);
  assert.equal(isValidPaystackSignature(body, "", SECRET), false);
  assert.equal(isValidPaystackSignature(body, sign(body, "sk_test_other"), SECRET), false);
  assert.equal(isValidPaystackSignature(body + " ", sign(body), SECRET), false);
  assert.equal(isValidPaystackSignature(body, "abc", SECRET), false);
});

test("signature: rejects everything when no secret key is configured", () => {
  const body = "{}";
  assert.equal(isValidPaystackSignature(body, sign(body, ""), ""), false);
});

const pending: PaymentRecord = {
  reference: "PE-1",
  status: "pending",
  amountKobo: 5_000_000,
  currency: "NGN",
};
const success: PaystackTransaction = {
  reference: "PE-1",
  status: "success",
  amount: 5_000_000,
  currency: "NGN",
};

test("settlement: settles an exact successful match", () => {
  assert.deepEqual(decideSettlement(pending, success), { kind: "settle" });
});

test("settlement: never settles a completed payment twice", () => {
  assert.deepEqual(
    decideSettlement({ ...pending, status: "completed" }, success),
    { kind: "already-settled" },
  );
});

test("settlement: rejects a different amount, currency or reference", () => {
  assert.equal(decideSettlement(pending, { ...success, amount: 100 }).kind, "mismatch");
  assert.equal(decideSettlement(pending, { ...success, currency: "USD" }).kind, "mismatch");
  assert.equal(decideSettlement(pending, { ...success, reference: "PE-2" }).kind, "mismatch");
  assert.equal(decideSettlement({ ...pending, reference: null }, success).kind, "mismatch");
});

test("settlement: waits on unfinished charges and marks failed ones", () => {
  for (const status of ["abandoned", "ongoing", "pending", "processing", "reversed"]) {
    assert.deepEqual(decideSettlement(pending, { ...success, status }), { kind: "wait" });
  }
  assert.deepEqual(decideSettlement(pending, { ...success, status: "failed" }), {
    kind: "mark-failed",
  });
});

test("settlement: leaves failed and needs_review payments for a person", () => {
  assert.deepEqual(decideSettlement({ ...pending, status: "failed" }, success), { kind: "wait" });
  assert.deepEqual(decideSettlement({ ...pending, status: "needs_review" }, success), {
    kind: "wait",
  });
});

test("invoice: full payment marks it paid", () => {
  assert.deepEqual(applyPaymentToInvoice({ amountKobo: 1000, paidAmountKobo: 0 }, 1000), {
    paidAmountKobo: 1000,
    status: "paid",
  });
});

test("invoice: part payment marks it partial", () => {
  assert.deepEqual(applyPaymentToInvoice({ amountKobo: 1000, paidAmountKobo: 200 }, 300), {
    paidAmountKobo: 500,
    status: "partial",
  });
});

test("invoice: overpayment is capped at the invoice amount", () => {
  assert.deepEqual(applyPaymentToInvoice({ amountKobo: 1000, paidAmountKobo: 800 }, 1000), {
    paidAmountKobo: 1000,
    status: "paid",
  });
});
