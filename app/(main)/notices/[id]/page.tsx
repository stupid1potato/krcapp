"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { NoticeDTO } from "@/lib/types";
import { formatNoticeTime } from "@/lib/format";
import { dismissNoticeId } from "@/lib/notice-popup";

export default function NoticeDetailPage() {
  const params = useParams<{ id: string }>();
  const [notice, setNotice] = useState<NoticeDTO | null | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/notices/${params.id}`, { cache: "no-store" });
      if (!res.ok) {
        setNotice(null);
        return;
      }
      setNotice((await res.json()) as NoticeDTO);
    })();
  }, [params.id]);

  useEffect(() => {
    if (notice?.id) dismissNoticeId(notice.id);
  }, [notice?.id]);

  return (
    <div className="px-4 pt-4">
      <Link href="/notices" className="text-[14px] text-sage">
        ← 공지
      </Link>

      {notice === undefined ? (
        <p className="py-10 text-sm text-neutral-400">불러오는 중...</p>
      ) : notice === null ? (
        <p className="py-10 text-sm text-neutral-400">공지를 찾을 수 없습니다.</p>
      ) : (
        <article className="pt-5">
          <h1 className="text-[24px] font-medium leading-snug text-black">{notice.title}</h1>
          <p className="mt-2 text-[13px] text-neutral-400">{formatNoticeTime(notice.createdAt)}</p>
          <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-neutral-700">{notice.body}</p>
        </article>
      )}
    </div>
  );
}
