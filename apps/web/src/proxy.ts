import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get("admin_token")?.value;
    const header = request.headers.get("x-admin-secret");
    const secret = process.env.ADMIN_SECRET;

    if (!secret || (cookie !== secret && header !== secret)) {
      // Redirect to login page
      const loginUrl = new URL("/admin-login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
