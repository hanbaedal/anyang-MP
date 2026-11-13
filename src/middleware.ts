import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ANON_VISITOR_COOKIE, anonVisitorCookieOptions, isValidVisitorId } from "@/lib/analytics-cookie";
import { isStaffWorkHour, roleFromSessionToken } from "@/lib/work-hours";

const STAFF_COOKIE = "anyang_sid";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let visitorId = request.cookies.get(ANON_VISITOR_COOKIE)?.value;
  const needsCookie = !isValidVisitorId(visitorId);
  if (needsCookie) visitorId = crypto.randomUUID();
  requestHeaders.set("x-visitor-id", visitorId!);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (needsCookie) {
    response.cookies.set(ANON_VISITOR_COOKIE, visitorId!, anonVisitorCookieOptions());
  }

  const staffToken = request.cookies.get(STAFF_COOKIE)?.value;
  if (staffToken && roleFromSessionToken(staffToken) === "admin" && !isStaffWorkHour()) {
    response.cookies.set(STAFF_COOKIE, "", { path: "/", httpOnly: true, sameSite: "lax", maxAge: 0 });
  }

  return response;
}

export const config = {
  // 대용량 업로드 API는 미들웨어를 건너뜀(본문 버퍼링·끊김으로 "네트워크 오류"가 나는 경우 방지)
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|icon.svg|apple-icon.png|robots.txt|sitemap.xml|api/health|api/manage/home-hero|api/manage/home-slides|api/manage/upload-image|api/manage/gallery|api/manage/funeral-docs|api/uploads).*)",
  ],
};
