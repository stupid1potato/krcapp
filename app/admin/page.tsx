import Link from "next/link";
import { ScheduleView } from "@/components/ScheduleView";

export default function AdminPage() {
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
      <ScheduleView variant="admin" />
    </div>
  );
}
