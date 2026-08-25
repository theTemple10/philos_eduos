import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transportation, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTenantMember, requireRole, assertTenantResource } from "@/lib/api/auth";

export async function GET() {
  try {
    const result = await requireTenantMember();
    if (!result.ok) return result.response;

    if (result.data.user.role === "admin") {
      const rows = await db
        .select()
        .from(transportation)
        .where(eq(transportation.tenantId, result.data.tenantId));
      return NextResponse.json(rows);
    }

    const userId = result.data.userId;
    const tenantId = result.data.tenantId;

    const asParent = await db
      .select()
      .from(students)
      .where(and(eq(students.parentId, userId), eq(students.tenantId, tenantId)));
    const asStudent = await db
      .select()
      .from(students)
      .where(and(eq(students.userId, userId), eq(students.tenantId, tenantId)));

    const allStudents = [...asParent, ...asStudent];
    const records = [];
    for (const s of allStudents) {
      const row = await db
        .select()
        .from(transportation)
        .where(and(eq(transportation.studentId, s.id), eq(transportation.tenantId, tenantId)))
        .limit(1);
      if (row[0]) records.push(row[0]);
    }
    return NextResponse.json(records);
  } catch (err) {
    console.error("GET /api/transportation", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireRole(["admin", "staff"]);
    if (!result.ok) return result.response;

    const body = await request.json();
    const { studentId, busNumber, route, driverName, driverPhone } = body;

    if (!studentId || !busNumber?.trim() || !route?.trim() || !driverName?.trim() || !driverPhone?.trim()) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
    const check = assertTenantResource(student[0], result.data.tenantId, "That student");
    if (check instanceof NextResponse) return check;

    const [{ id }] = await db
      .insert(transportation)
      .values({
        studentId,
        busNumber: busNumber.trim(),
        route: route.trim(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        status: "at_school",
        lastUpdated: Date.now(),
        tenantId: result.data.tenantId,
      })
      .returning({ id: transportation.id });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/transportation", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await requireRole(["admin", "staff"]);
    if (!result.ok) return result.response;

    const body = await request.json();
    const { id, status, location } = body;
    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required." }, { status: 400 });
    }

    const validStatuses = ["at_school", "in_transit", "arrived", "delayed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const rows = await db.select().from(transportation).where(eq(transportation.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That transport record");
    if (check instanceof NextResponse) return check;

    await db
      .update(transportation)
      .set({
        status,
        location: location ?? rows[0].location,
        lastUpdated: Date.now(),
      })
      .where(eq(transportation.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/transportation", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await requireRole(["admin", "staff"]);
    if (!result.ok) return result.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(transportation).where(eq(transportation.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That transport record");
    if (check instanceof NextResponse) return check;

    await db.delete(transportation).where(eq(transportation.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/transportation", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
