import { NextRequest, NextResponse } from "next/server";

// /privacy, /terms và trang chủ "/" phải xem được khi CHƯA đăng nhập — Google
// OAuth verification kiểm tra đúng điều đó (trang chủ mô tả app + link chính sách)
const PUBLIC_PATHS = ["/login", "/oauth-callback", "/403", "/privacy", "/terms"];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
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
   * Icon tab (app/icon.png → /icon.png) cũng vậy: chặn thì tab mất logo.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon|manifest.webmanifest|sw.js|offline.html|icons/).*)",
  ],
};
