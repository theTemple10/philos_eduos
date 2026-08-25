import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole, requireTenantMember, assertTenantResource } from "@/lib/api/auth";

export async function GET() {
  try {
    const result = await requireTenantMember();
    if (!result.ok) return result.response;

    const rows = await db
      .select()
      .from(announcements)
      .where(eq(announcements.tenantId, result.data.tenantId));

    const userRole = result.data.user.role;
    const filtered = rows.filter(
      (a) => a.target === "all" || a.target === userRole,
    );

    return NextResponse.json(filtered);
  } catch (err) {
    console.error("GET /api/announcements", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireRole(["admin", "teacher", "staff"]);
    if (!result.ok) return result.response;

    const body = await request.json();
    const { title, content, target, attachments } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "Announcements need a title and some content." },
        { status: 400 },
      );
    }

    const validTargets = ["all", "teachers", "students", "parents", "staff"];
    if (!target || !validTargets.includes(target)) {
      return NextResponse.json({ error: "Invalid target." }, { status: 400 });
    }

    const [{ id }] = await db
      .insert(announcements)
      .values({
        title: title.trim(),
        content: content.trim(),
        target,
        authorId: result.data.userId,
        tenantId: result.data.tenantId,
        createdAt: Date.now(),
        attachments: attachments ?? null,
      })
      .returning({ id: announcements.id });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/announcements", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const result = await requireRole(["admin", "teacher"]);
    if (!result.ok) return result.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That announcement");
    if (check instanceof NextResponse) return check;

    await db.delete(announcements).where(eq(announcements.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/announcements", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
