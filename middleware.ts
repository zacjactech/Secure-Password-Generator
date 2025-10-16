import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect client-side pages under /vault
  if (pathname.startsWith("/vault")) {
    const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSession) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/vault/:path*"],
};