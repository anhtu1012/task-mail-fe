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
  /*
   * Bỏ qua cả các file của PWA. Trình duyệt tải manifest KHÔNG kèm cookie, nên
   * nếu để proxy chuyển nó sang /login thì trình duyệt nhận về một trang HTML
   * thay vì manifest — nút "Cài ứng dụng" không bao giờ hiện. Service worker và
   * trang offline cũng phải tải được lúc chưa đăng nhập.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline.html|icons/).*)",
  ],
};
