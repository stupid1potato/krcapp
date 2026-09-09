import Link from "next/link";
import { formatNoticeTime } from "@/lib/format";
import { getNotice } from "@/lib/notices";
import { NoticeDismiss } from "@/components/NoticeDismiss";

export const dynamic = "force-dynamic";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = await getNotice(id);

  return (
    <div className="min-w-0 px-4 pt-4">
      <Link href="/notices" className="text-[14px] text-sage">
        ← 공지
      </Link>

      {notice === null ? (
        <p className="py-10 text-sm text-neutral-400">공지를 찾을 수 없습니다.</p>
      ) : (
        <article className="min-w-0 pt-5">
          <NoticeDismiss id={notice.id} />
          <h1 className="text-[24px] font-medium leading-snug break-keep text-black">{notice.title}</h1>
          <p className="mt-2 text-[13px] text-neutral-400">{formatNoticeTime(notice.createdAt)}</p>
          <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-neutral-700">{notice.body}</p>
        </article>
      )}
    </div>
  );
}
