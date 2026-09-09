import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/authz";
import { sendNoticePush } from "@/lib/push";
import { getEventNotices } from "@/lib/notices";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getEventNotices());
}

export async function POST(request: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  const payload = (await request.json().catch(() => null)) as { title?: string; body?: string } | null;
  const title = payload?.title?.trim() ?? "";
  const text = payload?.body?.trim() ?? "";
  if (!title || !text) {
    return NextResponse.json({ error: "제목과 본문이 필요합니다." }, { status: 400 });
  }

  const event = await prisma.event.findFirst();
  if (!event) {
    return NextResponse.json({ error: "이벤트가 없습니다." }, { status: 404 });
  }

  const notice = await prisma.notice.create({
    data: { eventId: event.id, title, body: text },
  });

  void sendNoticePush(notice).catch((error) => {
    console.error("[push] notice broadcast failed:", error);
  });

  return NextResponse.json({
    id: notice.id,
    title: notice.title,
    body: notice.body,
    createdAt: notice.createdAt.toISOString(),
  });
}
