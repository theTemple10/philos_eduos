import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeReturnPath(next: string | null, origin: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/dashboard";
  }

  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return "/dashboard";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/dashboard";
  }
}

function authErrorRedirect(requestUrl: URL, error: string) {
  const url = new URL("/auth", requestUrl);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  try {
    const { searchParams } = requestUrl;
    const code = searchParams.get("code");
    const next = safeReturnPath(searchParams.get("next"), requestUrl.origin);

    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    }

    return authErrorRedirect(requestUrl, "auth_callback_failed");
  } catch (err) {
    console.error("GET /api/auth/callback", err);
    return authErrorRedirect(requestUrl, "auth_callback_failed");
  }
}
