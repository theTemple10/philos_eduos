import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { requireSuperAdmin } from "@/lib/api/auth";

export async function GET() {
  try {
    const result = await requireSuperAdmin();
    if (!result.ok) return result.response;
    const rows = await db.select().from(tenants);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/tenants", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
