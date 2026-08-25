import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/", "/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith("/api/auth");

  const supabaseResponse = await updateSession(request);

  if (isProtectedRoute) {
    const cookieStore = request.cookies;
    const hasSession = cookieStore.get("sb-access-token");

    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      return Response.redirect(url);
    }
  }

  if (isPublicRoute) {
    return supabaseResponse;
  }

  return supabaseResponse;
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
