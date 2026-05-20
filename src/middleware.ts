import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/payments/return", "/payments/deal-lock"];

const ROLE_PATHS: Record<string, string> = {
  admin: "/admin",
  agent: "/agent",
  developer: "/organization",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("access_token")?.value;
  const role = req.cookies.get("user_role")?.value;

  // Authenticated users on "/" → send to their dashboard
  if (pathname === "/" && token && role) {
    const allowedBase = ROLE_PATHS[role];
    if (allowedBase) return NextResponse.redirect(new URL(allowedBase, req.url));
  }

  // "/" is public — show landing page for unauthenticated visitors
  if (pathname === "/") return NextResponse.next();

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!token || !role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const allowedBase = ROLE_PATHS[role];
  if (!allowedBase) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!pathname.startsWith(allowedBase)) {
    return NextResponse.redirect(new URL(allowedBase, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
