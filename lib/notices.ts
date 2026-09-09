import { prisma } from "@/lib/prisma";
import type { NoticeDTO } from "@/lib/types";

export type NoticesPayload = {
  eventName: string;
  notices: NoticeDTO[];
};

function toDto(notice: { id: string; title: string; body: string; createdAt: Date }): NoticeDTO {
  return {
    id: notice.id,
    title: notice.title,
    body: notice.body,
    createdAt: notice.createdAt.toISOString(),
  };
}

export async function getEventNotices(): Promise<NoticesPayload> {
  const event = await prisma.event.findFirst({
    include: {
      notices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!event) {
    return { eventName: "", notices: [] };
  }

  return {
    eventName: event.name,
    notices: event.notices.map(toDto),
  };
}

export async function getNotice(id: string): Promise<NoticeDTO | null> {
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) return null;
  return toDto(notice);
}
