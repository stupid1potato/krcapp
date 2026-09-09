import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/roles";

export async function requireStaff() {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    };
  }
  if (!isStaffRole(session.user.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "운영 권한이 없습니다." }, { status: 403 }),
    };
  }
  return { ok: true as const, session };
}
