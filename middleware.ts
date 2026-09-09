import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isStaffRole } from "@/lib/roles";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    const login = req.nextUrl.clone();
    login.pathname = "/login";
    login.search = "?callbackUrl=%2Fadmin";
    return NextResponse.redirect(login);
  }

  if (!isStaffRole(req.auth.user.role)) {
    return new NextResponse("운영 권한이 없습니다.", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
