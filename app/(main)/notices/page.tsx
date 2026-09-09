"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NoticeDTO } from "@/lib/types";
import { formatNoticeTime } from "@/lib/format";

export default function NoticesPage() {
  const [notices, setNotices] = useState<NoticeDTO[] | null>(null);
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/notices", { cache: "no-store" });
      const data = (await res.json()) as { eventName?: string; notices?: NoticeDTO[] };
      setEventName(data.eventName ?? "");
      setNotices(data.notices ?? []);
    })();
  }, []);

  return (
    <div>
      <div className="px-4 pb-3 pt-4">
        <h1 className="text-[28px] font-bold leading-none text-black">공지</h1>
        <p className="mt-2 text-[14px] text-neutral-400">{eventName || "공지사항"}</p>
      </div>

      {notices === null ? (
        <p className="px-4 py-10 text-sm text-neutral-400">불러오는 중...</p>
      ) : notices.length === 0 ? (
        <p className="px-4 py-16 text-center text-[15px] text-neutral-400">아직 공지가 없습니다</p>
      ) : (
        <ul className="flex flex-col gap-3 px-4 pb-4">
          {notices.map((notice) => (
            <li key={notice.id}>
              <Link
                href={`/notices/${notice.id}`}
                className="block rounded-2xl border border-neutral-200 px-4 py-4"
              >
                <h2 className="text-[16px] font-semibold text-black">{notice.title}</h2>
                <p className="mt-2 text-[12px] text-neutral-400">{formatNoticeTime(notice.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
