"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo, BrandMark } from "@/components/BrandLogo";

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

/** Messages for the `error` codes set by /api/auth/callback. */
const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  link_expired:
    "That sign-in link has expired or was already used. Enter your email to get a new one.",
  auth_callback_failed:
    "We couldn't complete sign-in from that link. Request a new one and open it in this browser.",
};

function describeSendError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/rate limit/i.test(message)) {
    return "Too many sign-in emails were requested. Please wait a few minutes and try again.";
  }
  return message || "We couldn't send your sign-in email. Please try again.";
}

function Auth() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
  );
  const callbackError = searchParams.get("error");
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError
      ? (CALLBACK_ERROR_MESSAGES[callbackError] ??
          CALLBACK_ERROR_MESSAGES.auth_callback_failed)
      : null,
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push(redirect);
      }
    });
  }, [supabase, router, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      // The default Supabase email contains a link (not a code). Point that
      // link at our callback on *this* deployment, carrying the return path,
      // so it works without editing email templates (which needs custom SMTP).
      const callbackUrl = new URL("/api/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", redirect);
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl.toString() },
      });
      if (otpError) throw otpError;
      setStep({ email });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(describeSendError(error));
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const email = typeof step === "string" ? "" : step.email;
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
      if (verifyError) throw verifyError;
      router.push(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100/50 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <button type="button" onClick={() => router.push("/")} aria-label="Philos EduOS home">
            <BrandLogo size="md" />
          </button>
        </div>
      </nav>

      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-slate-200/60 shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-xl">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center pt-8 pb-4">
                <div className="flex justify-center mb-4">
                  <BrandMark className="h-14 w-14" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to Philos EduOS</CardTitle>
                <CardDescription className="text-slate-500 mt-1 font-medium">
                  Sign in or create an account to access the management system
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent className="px-8">
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        name="email"
                        placeholder="name@school.edu"
                        type="email"
                        className="pl-9 border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-slate-50/50"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isLoading}
                      className="bg-slate-900 hover:bg-slate-800 text-white shrink-0 rounded-xl"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{error}</p>
                  )}
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="text-center pt-8 pb-4">
                <div className="flex justify-center mb-4">
                  <div className="bg-slate-50 text-slate-700 p-3 rounded-2xl border border-slate-100">
                    <Mail className="w-8 h-8" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Check Your Email</CardTitle>
                <CardDescription className="text-slate-500 mt-1 font-medium">
                  We&apos;ve sent a sign-in link to<br />
                  <span className="font-semibold text-slate-900">{typeof step === "string" ? "" : step.email}</span>
                </CardDescription>
                <p className="text-sm text-slate-500 mt-3">
                  Open the link <span className="font-semibold text-slate-700">in this browser</span> to
                  continue. If your email shows a 6-digit code instead, enter it below.
                </p>
              </CardHeader>
              <form onSubmit={handleOtpSubmit}>
                <CardContent className="px-8 pb-4">
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) form.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} className="border-slate-200 bg-slate-50/50" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-500 text-center font-medium">{error}</p>
                  )}
                  <p className="text-sm text-slate-500 text-center mt-4 font-medium">
                    Didn&apos;t receive a code?{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-slate-900 font-semibold hover:text-blue-600"
                      onClick={() => setStep("signIn")}
                    >
                      Try again
                    </Button>
                  </p>
                </CardContent>
                <CardFooter className="flex-col gap-3 px-8 pb-8">
                  <Button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg shadow-slate-900/20"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="w-full text-slate-500 hover:text-slate-900 font-medium"
                  >
                    Use a different email
                  </Button>
                </CardFooter>
              </form>
            </>
          )}

          <div className="py-4 px-6 text-[11px] font-semibold tracking-wide uppercase text-center text-slate-400 bg-slate-50/50 border-t border-slate-100 rounded-b-lg">
            Secure Access Powered by Philos EduOS
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <Auth />
    </Suspense>
  );
}
