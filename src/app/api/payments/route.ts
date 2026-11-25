import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { feeSchedules, invoices, payments, students, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTenantMember, requireAdmin, assertTenantResource } from "@/lib/api/auth";
import { PAYMENT_ACTIONS } from "@/lib/payments/actions";
import {
  PaystackUnavailableError,
  confirmPayment,
  findPaymentByReference,
} from "@/lib/payments/settle";
import { randomBytes } from "node:crypto";

const CURRENCY = "NGN";
const PAYSTACK_BASE = "https://api.paystack.co";

/** Unguessable payment reference (Paystack allows letters, digits, - . =). */
function randomReference(): string {
  return `PE-${Date.now()}-${randomBytes(9).toString("hex").toUpperCase()}`;
}

/**
 * May this user pay, or check the payment of, this student's fees?
 * School admins can; otherwise only the student's linked parent or the
 * student themself (#6). Bursars join this list with the roles work (#15).
 */
async function canPayForStudent(
  ctx: { userId: string; tenantId: string; user: { role?: string | null } },
  studentId: string,
): Promise<boolean> {
  if (ctx.user.role === "admin") return true;
  const ids = await studentIdsForUser(ctx.userId, ctx.tenantId);
  return ids.includes(studentId);
}

async function studentIdsForUser(userId: string, tenantId: string): Promise<string[]> {
  const asParent = await db
    .select()
    .from(students)
    .where(and(eq(students.parentId, userId), eq(students.tenantId, tenantId)));
  const asStudent = await db
    .select()
    .from(students)
    .where(and(eq(students.userId, userId), eq(students.tenantId, tenantId)));
  const ids = new Set([...asParent, ...asStudent].map((s) => s.id));
  return [...ids];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const reference = searchParams.get("reference");

    const result = await requireTenantMember();
    if (!result.ok) return result.response;

    const { userId, tenantId, user } = result.data;
    const isAdmin = user.role === "admin";

    // Payment by reference
    if (reference) {
      const rows = await db
        .select()
        .from(payments)
        .where(and(eq(payments.reference, reference), eq(payments.tenantId, tenantId)));
      const payment = rows[0] ?? null;
      if (payment && !(await canPayForStudent(result.data, payment.studentId))) {
        return NextResponse.json(null);
      }
      return NextResponse.json(payment);
    }

    // Fee schedules
    if (section === "feeSchedules") {
      const rows = await db
        .select()
        .from(feeSchedules)
        .where(eq(feeSchedules.tenantId, tenantId));
      return NextResponse.json(rows);
    }

    // Invoices
    if (section === "invoices") {
      if (isAdmin) {
        const rows = await db
          .select()
          .from(invoices)
          .where(eq(invoices.tenantId, tenantId));
        return NextResponse.json(rows);
      }
      const studentIds = await studentIdsForUser(userId, tenantId);
      const allInvoices = [];
      for (const sid of studentIds) {
        const rows = await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.studentId, sid), eq(invoices.tenantId, tenantId)));
        allInvoices.push(...rows);
      }
      return NextResponse.json(allInvoices);
    }

    // My payments (default)
    if (isAdmin) {
      const rows = await db
        .select()
        .from(payments)
        .where(eq(payments.tenantId, tenantId));
      return NextResponse.json(rows);
    }
    const studentIds = await studentIdsForUser(userId, tenantId);
    const allPayments = [];
    for (const sid of studentIds) {
      const rows = await db
        .select()
        .from(payments)
        .where(and(eq(payments.studentId, sid), eq(payments.tenantId, tenantId)));
      allPayments.push(...rows);
    }
    return NextResponse.json(allPayments);
  } catch (err) {
    console.error("GET /api/payments", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case PAYMENT_ACTIONS.createFeeSchedule:
        return handleCreateFeeSchedule(body);
      case PAYMENT_ACTIONS.updateFeeSchedule:
        return handleUpdateFeeSchedule(body);
      case PAYMENT_ACTIONS.createInvoice:
        return handleCreateInvoice(body);
      case PAYMENT_ACTIONS.generateInvoices:
        return handleGenerateInvoices(body);
      case PAYMENT_ACTIONS.initializePayment:
        return handleInitializePayment(body, new URL(request.url).origin);
      case PAYMENT_ACTIONS.verifyPayment:
        return handleVerifyPayment(body);
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (err) {
    console.error("POST /api/payments", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(feeSchedules).where(eq(feeSchedules.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That fee schedule");
    if (check instanceof NextResponse) return check;

    await db.delete(feeSchedules).where(eq(feeSchedules.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/payments", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleCreateFeeSchedule(body: {
  title?: string;
  amountKobo?: number;
  term?: string;
  dueDate?: string;
  classId?: string;
}) {
  const result = await requireAdmin();
  if (!result.ok) return result.response;

  const { title, amountKobo, term, dueDate, classId } = body;
  if (!title?.trim() || !amountKobo || !term?.trim() || !dueDate) {
    return NextResponse.json(
      { error: "title, amountKobo, term, and dueDate are required." },
      { status: 400 },
    );
  }
  if (amountKobo <= 0) {
    return NextResponse.json(
      { error: "The fee amount must be greater than zero." },
      { status: 400 },
    );
  }

  if (classId) {
    const cls = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    const check = assertTenantResource(cls[0], result.data.tenantId, "That class");
    if (check instanceof NextResponse) return check;
  }

  const [{ id }] = await db
    .insert(feeSchedules)
    .values({
      tenantId: result.data.tenantId,
      title: title.trim(),
      amountKobo,
      currency: CURRENCY,
      term: term.trim(),
      dueDate,
      classId: classId ?? null,
      active: true,
      createdAt: Date.now(),
    })
    .returning({ id: feeSchedules.id });

  return NextResponse.json({ id });
}

async function handleUpdateFeeSchedule(body: {
  id?: string;
  title?: string;
  amountKobo?: number;
  term?: string;
  dueDate?: string;
  classId?: string;
  active?: boolean;
}) {
  const result = await requireAdmin();
  if (!result.ok) return result.response;

  const { id, title, amountKobo, term, dueDate, classId, active } = body;
  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  const rows = await db.select().from(feeSchedules).where(eq(feeSchedules.id, id)).limit(1);
  const check = assertTenantResource(rows[0], result.data.tenantId, "That fee schedule");
  if (check instanceof NextResponse) return check;

  if (classId) {
    const cls = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    const cc = assertTenantResource(cls[0], result.data.tenantId, "That class");
    if (cc instanceof NextResponse) return cc;
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim();
  if (amountKobo !== undefined) updates.amountKobo = amountKobo;
  if (term !== undefined) updates.term = term.trim();
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (classId !== undefined) updates.classId = classId;
  if (active !== undefined) updates.active = active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  await db.update(feeSchedules).set(updates).where(eq(feeSchedules.id, id));
  return NextResponse.json({ success: true });
}

async function handleCreateInvoice(body: {
  studentId?: string;
  feeScheduleId?: string;
}) {
  const result = await requireAdmin();
  if (!result.ok) return result.response;

  const { studentId, feeScheduleId } = body;
  if (!studentId || !feeScheduleId) {
    return NextResponse.json(
      { error: "studentId and feeScheduleId are required." },
      { status: 400 },
    );
  }

  const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  const sc = assertTenantResource(student[0], result.data.tenantId, "That student");
  if (sc instanceof NextResponse) return sc;

  const schedule = await db.select().from(feeSchedules).where(eq(feeSchedules.id, feeScheduleId)).limit(1);
  const fc = assertTenantResource(schedule[0], result.data.tenantId, "That fee schedule");
  if (fc instanceof NextResponse) return fc;

  const existing = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.studentId, studentId),
        eq(invoices.feeScheduleId, feeScheduleId),
        eq(invoices.tenantId, result.data.tenantId),
      ),
    )
    .limit(1);
  if (existing[0] && existing[0].status !== "cancelled") {
    return NextResponse.json(
      { error: "That student already has an invoice for this fee." },
      { status: 400 },
    );
  }

  const [{ id }] = await db
    .insert(invoices)
    .values({
      tenantId: result.data.tenantId,
      studentId,
      feeScheduleId,
      title: schedule[0].title,
      amountKobo: schedule[0].amountKobo,
      currency: schedule[0].currency,
      dueDate: schedule[0].dueDate,
      status: "pending",
      paidAmountKobo: 0,
      createdAt: Date.now(),
    })
    .returning({ id: invoices.id });

  return NextResponse.json({ id });
}

async function handleGenerateInvoices(body: {
  feeScheduleId?: string;
  classId?: string;
}) {
  const result = await requireAdmin();
  if (!result.ok) return result.response;

  const { feeScheduleId, classId } = body;
  if (!feeScheduleId) {
    return NextResponse.json(
      { error: "feeScheduleId is required." },
      { status: 400 },
    );
  }

  const schedule = await db.select().from(feeSchedules).where(eq(feeSchedules.id, feeScheduleId)).limit(1);
  const sc = assertTenantResource(schedule[0], result.data.tenantId, "That fee schedule");
  if (sc instanceof NextResponse) return sc;

  if (classId) {
    const cls = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    const cc = assertTenantResource(cls[0], result.data.tenantId, "That class");
    if (cc instanceof NextResponse) return cc;
  }

  let studentList;
  if (classId) {
    studentList = await db
      .select()
      .from(students)
      .where(and(eq(students.classId, classId), eq(students.tenantId, result.data.tenantId)));
  } else {
    studentList = await db
      .select()
      .from(students)
      .where(eq(students.tenantId, result.data.tenantId));
  }

  let created = 0;
  for (const student of studentList) {
    const existing = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.studentId, student.id),
          eq(invoices.feeScheduleId, feeScheduleId),
        ),
      )
      .limit(1);
    if (existing[0]) continue;

    await db.insert(invoices).values({
      tenantId: result.data.tenantId,
      studentId: student.id,
      feeScheduleId,
      title: schedule[0].title,
      amountKobo: schedule[0].amountKobo,
      currency: schedule[0].currency,
      dueDate: schedule[0].dueDate,
      status: "pending",
      paidAmountKobo: 0,
      createdAt: Date.now(),
    });
    created += 1;
  }

  return NextResponse.json({ created });
}

async function handleInitializePayment(body: { invoiceId?: string }, requestOrigin: string) {
  const result = await requireTenantMember();
  if (!result.ok) return result.response;

  const { invoiceId } = body;
  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId is required." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Payments aren't configured yet (missing PAYSTACK_SECRET_KEY)." },
      { status: 500 },
    );
  }

  const invRows = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, result.data.tenantId)))
    .limit(1);
  const invoice = invRows[0];
  if (!invoice) {
    return NextResponse.json(
      { error: "That invoice could not be found in your school." },
      { status: 404 },
    );
  }

  if (!(await canPayForStudent(result.data, invoice.studentId))) {
    // Same answer as "not found": don't confirm the invoice exists.
    return NextResponse.json(
      { error: "That invoice could not be found in your school." },
      { status: 404 },
    );
  }

  if (invoice.status === "paid" || invoice.status === "cancelled") {
    return NextResponse.json(
      { error: "That invoice can't be paid." },
      { status: 400 },
    );
  }

  const outstandingKobo = invoice.amountKobo - invoice.paidAmountKobo;
  if (outstandingKobo <= 0) {
    return NextResponse.json(
      { error: "This invoice has no outstanding balance." },
      { status: 400 },
    );
  }

  const reference = randomReference();
  await db.insert(payments).values({
    studentId: invoice.studentId,
    amountKobo: outstandingKobo,
    currency: CURRENCY,
    description: `Payment for invoice ${invoiceId}`,
    status: "pending",
    paymentMethod: undefined,
    invoiceId,
    reference,
    createdAt: Date.now(),
    tenantId: result.data.tenantId,
  });

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: result.data.user.email ?? `${result.data.userId}@philos-eduos.local`,
      amount: outstandingKobo,
      currency: CURRENCY,
      reference,
      // Paystack appends ?trxref=…&reference=…; the dashboard then asks us
      // to verify (see PaymentReturnNotice).
      callback_url: `${process.env.SITE_URL?.trim() || requestOrigin}/dashboard`,
      metadata: { invoiceId, tenantId: result.data.tenantId },
    }),
  });
  const data = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; reference?: string };
  };
  if (!res.ok || !data.status || !data.data?.authorization_url) {
    console.error("Paystack initialize failed", res.status, data);
    return NextResponse.json(
      { error: "Couldn't start the payment. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    authorizationUrl: data.data.authorization_url,
    reference,
  });
}

async function handleVerifyPayment(body: { reference?: string }) {
  const result = await requireTenantMember();
  if (!result.ok) return result.response;

  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  if (!reference) {
    return NextResponse.json({ error: "reference is required." }, { status: 400 });
  }

  const payment = await findPaymentByReference(reference);
  if (
    !payment ||
    payment.tenantId !== result.data.tenantId ||
    !(await canPayForStudent(result.data, payment.studentId))
  ) {
    return NextResponse.json({ outcome: "unknown" });
  }

  try {
    const outcome = await confirmPayment(payment);
    return NextResponse.json({ outcome });
  } catch (err) {
    if (err instanceof PaystackUnavailableError) {
      console.error("verifyPayment: Paystack unavailable", err.message);
      return NextResponse.json(
        { error: "We couldn't reach Paystack to confirm this payment. Please try again shortly." },
        { status: 503 },
      );
    }
    throw err;
  }
}
