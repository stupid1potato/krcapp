import Link from "next/link";
import { formatNoticeTime } from "@/lib/format";
import { getEventNotices } from "@/lib/notices";

export const dynamic = "force-dynamic";

export default async function NoticesPage() {
  const { eventName, notices } = await getEventNotices();

  return (
    <div className="min-w-0">
      <div className="px-4 pb-3 pt-4">
        <h1 className="text-[24px] font-medium leading-none text-black min-[390px]:text-[28px]">공지</h1>
        <p className="mt-2 text-[14px] text-neutral-400">{eventName || "공지사항"}</p>
      </div>

      {notices.length === 0 ? (
        <p className="px-4 py-16 text-center text-[15px] text-neutral-400">아직 공지가 없습니다</p>
      ) : (
        <ul className="flex flex-col gap-3 px-4 pb-4">
          {notices.map((notice) => (
            <li key={notice.id} className="min-w-0">
              <Link
                href={`/notices/${notice.id}`}
                className="block min-w-0 rounded-2xl border border-neutral-200 px-4 py-4"
              >
                <h2 className="truncate text-[16px] font-medium text-black">{notice.title}</h2>
                <p className="mt-2 text-[12px] text-neutral-400">{formatNoticeTime(notice.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
