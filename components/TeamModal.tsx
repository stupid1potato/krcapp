"use client";

import { useState } from "react";
import type { TeamRef } from "@/lib/types";

export function TeamModal({
  team,
  onClose,
  onChanged,
  canManage = false,
}: {
  team: TeamRef;
  onClose: () => void;
  onChanged: () => void;
  canManage?: boolean;
}) {
  const [busy, setBusy] = useState<"checkin" | "notify" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(team.checkedIn);

  async function toggleCheckin() {
    if (!canManage) return;
    setBusy("checkin");
    setMessage(null);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: team.slotId }),
      });
      const data = (await res.json()) as { checkedIn?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "체크인에 실패했습니다.");
      setCheckedIn(Boolean(data.checkedIn));
      onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "체크인에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function notify() {
    if (!canManage) return;
    setBusy("notify");
    setMessage(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.teamId, matchNumber: team.matchNumber }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "알림 호출에 실패했습니다.");
      setMessage(data.message ?? "알림을 처리했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "알림 호출에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[min(320px,calc(100vw-2rem))] rounded-2xl bg-white px-5 py-6 text-center shadow-xl min-[390px]:px-6 min-[390px]:py-7">
        <p className="text-[20px] font-medium text-black">
          {team.number} · {team.name}
        </p>
        <p className="mt-2 text-[14px] text-neutral-400">
          {checkedIn ? "체크인 완료" : "체크인 안 함"}
        </p>

        {canManage ? (
          <>
            <button
              type="button"
              onClick={toggleCheckin}
              disabled={busy !== null}
              className="mt-6 w-full rounded-xl bg-sage py-3.5 text-[16px] font-medium text-white disabled:opacity-60"
            >
              {busy === "checkin"
                ? "처리 중..."
                : checkedIn
                  ? "체크인 취소"
                  : "체크인 완료로 표시"}
            </button>

            <button
              type="button"
              onClick={notify}
              disabled={busy !== null}
              className="mt-3 w-full rounded-xl border border-sage py-3.5 text-[16px] font-medium text-sage disabled:opacity-60"
            >
              {busy === "notify" ? "전송 중..." : "알림호출"}
            </button>
          </>
        ) : null}

        {message ? <p className="mt-3 text-[13px] leading-5 text-neutral-500">{message}</p> : null}

        <button type="button" onClick={onClose} className="mt-4 text-[15px] text-neutral-400">
          닫기
        </button>
      </div>
    </div>
  );
}
