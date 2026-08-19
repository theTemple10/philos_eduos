import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import {
  requireTenantMember,
  requireAdmin,
  requireActionAuth,
  assertTenantResource,
  Ctx,
} from "./helpers";
import { api, internal } from "./_generated/api";
import { ROLES } from "./schema";
import { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Fees, invoices and Paystack payments (Naira).
//
// Amounts are stored in kobo (Paystack's convention) to avoid floating point
// drift. Paystack is called directly from server-side actions with the
// PAYSTACK_SECRET_KEY env var; the client never sees that key. Webhook
// handling lives in src/convex/http.ts.
// ---------------------------------------------------------------------------

const CURRENCY = "NGN";

function randomReference() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 12; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `PE-${Date.now()}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Fee schedules
// ---------------------------------------------------------------------------

export const getFeeSchedules = query({
  args: {},
  handler: async (ctx) => {
    const { tenantId } = await requireTenantMember(ctx);
    return await ctx.db
      .query("feeSchedules")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .order("desc")
      .collect();
  },
});

export const createFeeSchedule = mutation({
  args: {
    title: v.string(),
    amountKobo: v.number(),
    term: v.string(),
    dueDate: v.string(),
    classId: v.optional(v.id("classes")),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    if (args.amountKobo <= 0) {
      throw new ConvexError("The fee amount must be greater than zero.");
    }
    if (args.classId) {
      const cls = await ctx.db.get(args.classId);
      await assertTenantResource(cls, tenantId, "That class");
    }
    return await ctx.db.insert("feeSchedules", {
      tenantId,
      title: args.title.trim(),
      amountKobo: args.amountKobo,
      currency: CURRENCY,
      term: args.term.trim(),
      dueDate: args.dueDate,
      classId: args.classId,
      active: true,
      createdAt: Date.now(),
    });
  },
});

export const updateFeeSchedule = mutation({
  args: {
    id: v.id("feeSchedules"),
    title: v.optional(v.string()),
    amountKobo: v.optional(v.number()),
    term: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const schedule = await ctx.db.get(args.id);
    await assertTenantResource(schedule, tenantId, "That fee schedule");
    if (args.classId) {
      const cls = await ctx.db.get(args.classId);
      await assertTenantResource(cls, tenantId, "That class");
    }
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteFeeSchedule = mutation({
  args: { id: v.id("feeSchedules") },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const schedule = await ctx.db.get(args.id);
    await assertTenantResource(schedule, tenantId, "That fee schedule");
    await ctx.db.delete(args.id);
  },
});

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

/** Admin: create an invoice for a student from a fee schedule. */
export const createInvoice = mutation({
  args: {
    studentId: v.id("students"),
    feeScheduleId: v.id("feeSchedules"),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const student = await ctx.db.get(args.studentId);
    await assertTenantResource(student, tenantId, "That student");
    const schedule = await assertTenantResource(
      await ctx.db.get(args.feeScheduleId),
      tenantId,
      "That fee schedule",
    );

    const existing = await ctx.db
      .query("invoices")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) =>
        q.and(
          q.eq(q.field("feeScheduleId"), args.feeScheduleId),
          q.eq(q.field("tenantId"), tenantId),
        ),
      )
      .first();
    if (existing && existing.status !== "cancelled") {
      throw new ConvexError("That student already has an invoice for this fee.");
    }

    return await ctx.db.insert("invoices", {
      tenantId,
      studentId: args.studentId,
      feeScheduleId: args.feeScheduleId,
      title: schedule.title,
      amountKobo: schedule.amountKobo,
      currency: schedule.currency,
      dueDate: schedule.dueDate,
      status: "pending",
      paidAmountKobo: 0,
      createdAt: Date.now(),
    });
  },
});

/** Admin: generate invoices for every active student (optionally one class). */
export const generateInvoicesForClass = mutation({
  args: {
    feeScheduleId: v.id("feeSchedules"),
    classId: v.optional(v.id("classes")),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireAdmin(ctx);
    const schedule = await assertTenantResource(
      await ctx.db.get(args.feeScheduleId),
      tenantId,
      "That fee schedule",
    );
    if (args.classId) {
      const cls = await ctx.db.get(args.classId);
      await assertTenantResource(cls, tenantId, "That class");
    }
    let students;
    if (args.classId) {
      students = await ctx.db
        .query("students")
        .withIndex("by_class", (q) => q.eq("classId", args.classId!))
        .filter((q) => q.eq(q.field("tenantId"), tenantId))
        .collect();
    } else {
      students = await ctx.db
        .query("students")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .collect();
    }
    let created = 0;
    for (const student of students) {
      const existing = await ctx.db
        .query("invoices")
        .withIndex("by_student", (q) => q.eq("studentId", student._id))
        .filter((q) => q.eq(q.field("feeScheduleId"), schedule._id))
        .first();
      if (existing) continue;
      await ctx.db.insert("invoices", {
        tenantId,
        studentId: student._id,
        feeScheduleId: schedule._id,
        title: schedule.title,
        amountKobo: schedule.amountKobo,
        currency: schedule.currency,
        dueDate: schedule.dueDate,
        status: "pending",
        paidAmountKobo: 0,
        createdAt: Date.now(),
      });
      created += 1;
    }
    return { created };
  },
});

/** Parent: invoices for the caller's children. Admin: all tenant invoices. */
export const getInvoices = query({
  args: {},
  handler: async (ctx) => {
    const { userId, tenantId, user } = await requireTenantMember(ctx);
    if (user.role === ROLES.ADMIN) {
      return await ctx.db
        .query("invoices")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .order("desc")
        .collect();
    }
    const studentIds = await studentIdsForUser(ctx.db, userId, tenantId);
    const invoices = [];
    for (const id of studentIds) {
      const rows = await ctx.db
        .query("invoices")
        .withIndex("by_student", (q) => q.eq("studentId", id))
        .filter((q) => q.eq(q.field("tenantId"), tenantId))
        .order("desc")
        .collect();
      invoices.push(...rows);
    }
    return invoices;
  },
});

/**
 * Single invoice, with access control: admins and teachers may view any
 * tenant invoice; parents and students may view invoices for their own
 * students. Throws for everyone else. Used by the client and by the
 * initializePayment action (which needs the same rules).
 */
export const getInvoice = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const { userId, tenantId, user } = await requireTenantMember(ctx);
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice || invoice.tenantId !== tenantId) {
      throw new ConvexError("That invoice could not be found in your school.");
    }
    if (user.role === ROLES.ADMIN || user.role === ROLES.TEACHER) {
      return invoice;
    }
    const studentIds = await studentIdsForUser(ctx.db, userId, tenantId);
    if (!studentIds.includes(invoice.studentId)) {
      throw new ConvexError("You don't have access to that invoice.");
    }
    return invoice;
  },
});

/** A payment by reference, visible to the tenant (or the payer's students). */
export const getPaymentByReference = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const { userId, tenantId, user } = await requireTenantMember(ctx);
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();
    if (!payment || payment.tenantId !== tenantId) {
      return null;
    }
    if (user.role === ROLES.ADMIN || user.role === ROLES.TEACHER) {
      return payment;
    }
    const studentIds = await studentIdsForUser(ctx.db, userId, tenantId);
    if (!studentIds.includes(payment.studentId)) {
      return null;
    }
    return payment;
  },
});

// ---------------------------------------------------------------------------
// Paystack
// ---------------------------------------------------------------------------

const PAYSTACK_BASE = "https://api.paystack.co";

/**
 * Starts a Paystack checkout for an invoice. Server-side: uses
 * PAYSTACK_SECRET_KEY, never exposed to the client. Supports card, bank
 * transfer and USSD through Paystack's checkout page.
 */
export const initializePayment = action({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const { userId, tenantId, user } = await requireActionAuth(ctx);
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new ConvexError(
        "Payments aren't configured yet (missing PAYSTACK_SECRET_KEY).",
      );
    }
    // getInvoice enforces that the caller is allowed to pay/view this invoice.
    const invoice = await ctx.runQuery(api.payments.getInvoice, {
      invoiceId: args.invoiceId,
    });
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      throw new ConvexError("That invoice can't be paid.");
    }

    const outstandingKobo = invoice.amountKobo - invoice.paidAmountKobo;
    if (outstandingKobo <= 0) {
      throw new ConvexError("This invoice has no outstanding balance.");
    }

    const reference = randomReference();
    await ctx.runMutation(api.payments.recordPendingPayment, {
      invoiceId: invoice._id,
      studentId: invoice.studentId,
      amountKobo: outstandingKobo,
      reference,
    });

    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: user.email ?? `${userId}@philos-eduos.local`,
        amount: outstandingKobo,
        currency: CURRENCY,
        reference,
        callback_url: `${process.env.SITE_URL ?? ""}/dashboard`,
        metadata: {
          invoiceId: invoice._id,
          tenantId,
        },
      }),
    });
    const data = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; reference?: string };
    };
    if (!res.ok || !data.status || !data.data?.authorization_url) {
      console.error("Paystack initialize failed", res.status, data);
      throw new ConvexError("Couldn't start the payment. Please try again.");
    }
    return {
      authorizationUrl: data.data.authorization_url,
      reference,
    };
  },
});

/**
 * Confirms a payment after the customer returns from Paystack. Returns the
 * invoice state so the UI can refresh honestly.
 */
export const verifyPayment = action({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    await requireActionAuth(ctx);
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) return { status: "error" as const, message: "Paystack isn't configured." };
    const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${args.reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = (await res.json()) as {
      status?: boolean;
      data?: { status?: string; amount?: number };
    };
    if (data.status && data.data?.status === "success") {
      const payment = await ctx.runQuery(api.payments.getPaymentByReference, {
        reference: args.reference,
      });
      if (payment && payment.status !== "completed") {
        await ctx.runMutation(internal.payments.recordSuccessfulPayment, {
          reference: args.reference,
          amountKobo: data.data.amount ?? payment.amountKobo,
        });
      }
      return { status: "success" as const };
    }
    return { status: "pending" as const };
  },
});

// Internal mutations called from the actions above (already authorized).
export const recordPendingPayment = mutation({
  args: {
    invoiceId: v.id("invoices"),
    studentId: v.id("students"),
    amountKobo: v.number(),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const { tenantId } = await requireTenantMember(ctx);
    await ctx.db.insert("payments", {
      studentId: args.studentId,
      amountKobo: args.amountKobo,
      currency: CURRENCY,
      description: `Payment for invoice ${args.invoiceId}`,
      status: "pending",
      paymentMethod: undefined,
      invoiceId: args.invoiceId,
      reference: args.reference,
      createdAt: Date.now(),
      tenantId,
    });
  },
});

/**
 * Records a successful payment. Internal: only reachable from the Paystack
 * webhook (signature-verified in http.ts) and the verifyPayment action, both
 * of which have already established trust. Updates the linked invoice.
 */
export const recordSuccessfulPayment = internalMutation({
  args: {
    reference: v.string(),
    amountKobo: v.number(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_reference", (q) => q.eq("reference", args.reference))
      .first();
    if (!payment || payment.status === "completed") {
      return;
    }
    await ctx.db.patch(payment._id, {
      status: "completed",
      amountKobo: args.amountKobo,
      paymentMethod: "paystack",
    });
    if (payment.invoiceId) {
      const invoice = await ctx.db.get(payment.invoiceId);
      if (invoice) {
        const paid = invoice.paidAmountKobo + args.amountKobo;
        const status = paid >= invoice.amountKobo ? "paid" : "partial";
        await ctx.db.patch(invoice._id, {
          paidAmountKobo: Math.min(paid, invoice.amountKobo),
          status,
          reference: args.reference,
        });
      }
    }
  },
});

export const getMyPayments = query({
  args: {},
  handler: async (ctx) => {
    const { userId, tenantId, user } = await requireTenantMember(ctx);
    if (user.role === ROLES.ADMIN) {
      return await ctx.db
        .query("payments")
        .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
        .order("desc")
        .collect();
    }
    const studentIds = await studentIdsForUser(ctx.db, userId, tenantId);
    const payments = [];
    for (const id of studentIds) {
      const rows = await ctx.db
        .query("payments")
        .withIndex("by_student", (q) => q.eq("studentId", id))
        .filter((q) => q.eq(q.field("tenantId"), tenantId))
        .order("desc")
        .collect();
      payments.push(...rows);
    }
    return payments;
  },
});

async function studentIdsForUser(
  db: Ctx["db"],
  userId: Id<"users">,
  tenantId: Id<"tenants">,
): Promise<Id<"students">[]> {
  const asParent = await db
    .query("students")
    .withIndex("by_parent", (q) => q.eq("parentId", userId))
    .filter((q) => q.eq(q.field("tenantId"), tenantId))
    .collect();
  const asStudent = await db
    .query("students")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("tenantId"), tenantId))
    .collect();
  const ids = new Set([...asParent, ...asStudent].map((s) => s._id));
  return [...ids];
}