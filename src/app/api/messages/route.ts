import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTenantMember, assertTenantResource } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadCountOnly = searchParams.get("unreadCount") === "true";

    const result = await requireTenantMember();
    if (!result.ok) return result.response;

    const userId = result.data.userId;

    if (unreadCountOnly) {
      const unread = await db
        .select()
        .from(messages)
        .where(and(eq(messages.receiverId, userId), eq(messages.read, false)));
      return NextResponse.json({ count: unread.length });
    }

    const sent = await db
      .select()
      .from(messages)
      .where(eq(messages.senderId, userId));
    const received = await db
      .select()
      .from(messages)
      .where(eq(messages.receiverId, userId));

    const all = [...sent, ...received].sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json(all);
  } catch (err) {
    console.error("GET /api/messages", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await requireTenantMember();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: "receiverId and content are required." },
        { status: 400 },
      );
    }
    if (receiverId === result.data.userId) {
      return NextResponse.json(
        { error: "You can't message yourself." },
        { status: 400 },
      );
    }

    const { users } = await import("@/lib/db/schema");
    const receiver = await db.select().from(users).where(eq(users.id, receiverId)).limit(1);
    const check = assertTenantResource(receiver[0], result.data.tenantId, "That recipient");
    if (check instanceof NextResponse) return check;

    const [{ id }] = await db
      .insert(messages)
      .values({
        senderId: result.data.userId,
        receiverId,
        content: content.trim(),
        read: false,
        createdAt: Date.now(),
        tenantId: result.data.tenantId,
      })
      .returning({ id: messages.id });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("POST /api/messages", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const result = await requireTenantMember();
    if (!result.ok) return result.response;

    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const rows = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    const check = assertTenantResource(rows[0], result.data.tenantId, "That message");
    if (check instanceof NextResponse) return check;

    if (rows[0].receiverId !== result.data.userId) {
      return NextResponse.json(
        { error: "You can only mark your own messages as read." },
        { status: 403 },
      );
    }

    await db.update(messages).set({ read: true }).where(eq(messages.id, id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/messages", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
