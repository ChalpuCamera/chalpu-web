import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 정적 파일 패턴 정의
const PUBLIC_FILE = /\.(.*)$/;
const STATIC_PATHS = [
  "/_next/static",
  "/_next/image",
  "/_next/webpack-hmr",
  "/favicon.ico",
  "/api",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 정적 파일은 인증 없이 통과
  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  // 2. Next.js 내부 경로는 통과
  if (STATIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 3. API 경로는 통과 (API에서 자체 인증 처리)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 4. 그 외 페이지 경로에 대해서만 인증 처리
  // 여기서는 클라이언트 사이드에서 LoginGuard가 처리하므로
  // 서버 사이드에서는 단순히 통과시킴
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
