import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/oauth-callback", "/403"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    isPublicPath(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
