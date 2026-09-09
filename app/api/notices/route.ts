import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const event = await prisma.event.findFirst({
    include: {
      notices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!event) {
    return NextResponse.json({ eventName: "", notices: [] });
  }

  return NextResponse.json({
    eventName: event.name,
    notices: event.notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      createdAt: notice.createdAt.toISOString(),
    })),
  });
}
