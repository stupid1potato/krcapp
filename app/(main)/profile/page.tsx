"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePush } from "@/components/usePush";

export default function ProfilePage() {
  const { data, status } = useSession();
  const router = useRouter();
  const push = usePush();

  if (status === "loading") {
    return <p className="px-4 py-10 text-sm text-neutral-400">불러오는 중...</p>;
  }

  if (status !== "authenticated" || !data?.user) {
    router.replace("/login");
    return null;
  }

  const label = data.user.teamNumber ?? data.user.name ?? data.user.email ?? "참가자";

  return (
    <div className="px-4 pt-4">
      <h1 className="text-[28px] font-bold text-black">프로필</h1>
      <p className="mt-6 text-[20px] font-semibold text-black">{label}님 안녕하세요!</p>

      {!push.supported ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[13px] leading-5 text-amber-800">
          이 브라우저는 웹 푸시 알림을 지원하지 않습니다. Chrome/Edge/Firefox와 HTTPS(또는
          localhost)에서 사용해 주세요.
        </p>
      ) : (
        <div className="mt-6 rounded-2xl border border-neutral-200 px-4 py-4">
          <p className="text-[15px] font-medium text-black">알림</p>
          <p className="mt-1 text-[13px] leading-5 text-neutral-500">
            {data.user.teamId
              ? "알림호출을 받으려면 이 기기에서 알림을 허용하세요."
              : "팀 계정으로 로그인해야 알림을 받을 수 있습니다."}
          </p>
          <button
            type="button"
            onClick={() => void push.enable()}
            disabled={push.busy || !data.user.teamId}
            className="mt-3 w-full rounded-xl bg-sage py-3 text-[15px] font-medium text-white disabled:opacity-50"
          >
            {push.busy ? "설정 중..." : push.subscribed ? "알림이 켜져 있습니다" : "알림 허용"}
          </button>
          {push.message ? (
            <p className="mt-2 text-[13px] text-neutral-500">{push.message}</p>
          ) : null}
        </div>
      )}

      {data.user.role === "admin" ? (
        <Link
          href="/admin"
          className="mt-4 block rounded-xl border border-neutral-200 py-3 text-center text-[15px] font-medium text-black"
        >
          경기 진행 현황 (운영)
        </Link>
      ) : (
        <Link
          href="/admin"
          className="mt-4 block text-center text-[13px] text-neutral-400"
        >
          경기 진행 현황 보기
        </Link>
      )}

      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="mt-8 w-full rounded-xl border border-neutral-300 py-3.5 text-[16px] font-medium text-neutral-700"
      >
        로그아웃
      </button>
    </div>
  );
}
