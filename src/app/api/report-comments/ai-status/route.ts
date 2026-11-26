import { NextResponse } from "next/server";
import { requireTeacherOrAdmin } from "@/lib/api/auth";

/**
 * Whether AI drafting is switched on (#40). The "Draft with AI" button only
 * appears when an Anthropic key is configured; the comment bank works
 * either way. Reports only true/false, never the key.
 */
export async function GET() {
  const result = await requireTeacherOrAdmin();
  if (!result.ok) return result.response;
  return NextResponse.json({ available: Boolean(process.env.ANTHROPIC_API_KEY?.trim()) });
}
