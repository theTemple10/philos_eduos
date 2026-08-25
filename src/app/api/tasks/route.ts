import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAdmin, requireTenantMember, assertTenantResource } from "@/lib/api/auth";

export async function GET() {
  try {
    const result = await requireTenantMember();
    if (!result.ok) return result.response;

    if (result.data.user.role === "admin") {
      const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.tenantId, result.data.tenantId));
      return NextResponse.json(rows);
    }

    const rows = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.assignedTo, result.data.userId),
          eq(tasks.tenantId, result.data.tenantId),
        ),
      );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/tasks", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireAdmin();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { title, description, priority, dueDate, assignedTo } = body;

    if (!title?.trim() || !priority) {
      return NextResponse.json(
        { error: "title and priority are required." },
        { status: 400 },
      );
    }

    const validPriorities = ["low", "medium", "high"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
    }

    if (assignedTo) {
      const assignee = await db.select().from(users).where(eq(users.id, assignedTo)).limit(1);
      const check = assertTenantResource(assignee[0], result.data.tenantId, "That user");
      if (check instanceof NextResponse) return check;
    }

    const [{ id }] = await db
      .insert(tasks)
      .values({
        title: title.trim(),
        description: description ?? null,
        priority,
        status: "pending",
        dueDate: dueDate ?? null,
        assignedTo: assignedTo ?? null,
        createdBy: result.data.userId,
        tenantId: result.data.tenantId,
        createdAt: Date.now(),
      })
      .returning({ id: tasks.id });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/tasks", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await requireTenantMember();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { id, title, description, priority, status, dueDate, assignedTo } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That task");
    if (check instanceof NextResponse) return check;

    const task = rows[0];
    const isAdmin = result.data.user.role === "admin";
    const isAssignee = task.assignedTo === result.data.userId;
    if (!isAdmin && !isAssignee) {
      return NextResponse.json(
        { error: "You can only update tasks assigned to you." },
        { status: 403 },
      );
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    await db.update(tasks).set(updates).where(eq(tasks.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/tasks", err);
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

    const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That task");
    if (check instanceof NextResponse) return check;

    await db.delete(tasks).where(eq(tasks.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/tasks", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
