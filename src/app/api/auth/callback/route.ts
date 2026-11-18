import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
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

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && (EMAIL_OTP_TYPES as readonly string[]).includes(value);
}

/**
 * Completes sign-in from an emailed link. Supports both link styles:
 * - `?code=…` (PKCE, Supabase's default template). Must be opened in the
 *   browser that requested the email, because it needs the verifier cookie.
 * - `?token_hash=…&type=…` (custom template). Works on any device.
 * Supabase reports failures (e.g. an expired link) as `error_code`.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  try {
    const { searchParams } = requestUrl;
    const next = safeReturnPath(searchParams.get("next"), requestUrl.origin);

    const supabaseErrorCode = searchParams.get("error_code");
    if (supabaseErrorCode) {
      console.warn("Auth callback received Supabase error", supabaseErrorCode);
      return authErrorRedirect(
        requestUrl,
        supabaseErrorCode === "otp_expired" ? "link_expired" : "auth_callback_failed",
      );
    }

    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (code || (tokenHash && isEmailOtpType(type))) {
      const supabase = await createClient();
      const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type as EmailOtpType });
      if (!error) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
      console.warn("Auth callback verification failed", error.code ?? error.message);
      if (error.code === "otp_expired") {
        return authErrorRedirect(requestUrl, "link_expired");
      }
    }

    return authErrorRedirect(requestUrl, "auth_callback_failed");
  } catch (err) {
    console.error("GET /api/auth/callback", err);
    return authErrorRedirect(requestUrl, "auth_callback_failed");
  }
}
