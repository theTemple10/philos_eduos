import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = ["/dashboard"];
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Safety net: if a sign-in link's redirect isn't on Supabase's allow list,
  // Supabase falls back to the Site URL (`/?code=…`). Hand it to the callback
  // so the sign-in still completes instead of silently landing on the home page.
  if (pathname === "/" && (searchParams.has("code") || searchParams.has("token_hash") || searchParams.has("error_code"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth/callback";
    return NextResponse.redirect(url);
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  const { response, user } = await updateSession(request);

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    const returnTo = `${pathname}${request.nextUrl.search}`;
    url.pathname = "/auth";
    url.search = "";
    url.searchParams.set("returnTo", returnTo);

    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
      redirectResponse.cookies.set(name, value, options);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
