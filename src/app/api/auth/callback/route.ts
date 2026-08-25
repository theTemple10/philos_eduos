import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url));
      }
    }

    return NextResponse.redirect(new URL("/auth/login?error=auth_callback_failed", request.url));
  } catch (err) {
    console.error("GET /api/auth/callback", err);
    return NextResponse.redirect(new URL("/auth/login?error=internal", request.url));
  }
}
