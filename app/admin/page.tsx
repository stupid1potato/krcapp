import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/roles";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin");
  }
  if (!isStaffRole(session.user.role)) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-[22px] font-bold text-black">접근 권한이 없습니다</h1>
        <p className="mt-2 text-[14px] text-neutral-500">경기 진행 현황은 운영 계정만 볼 수 있습니다.</p>
        <Link href="/" className="mt-6 text-[15px] text-sage">
          대진표로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-neutral-50 px-4 py-6 sm:px-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-sage">
          ← 참가자 대진표
        </Link>
        <Link href="/profile" className="text-sm text-neutral-400">
          프로필
        </Link>
      </div>
      <AdminDashboard />
    </div>
  );
}
