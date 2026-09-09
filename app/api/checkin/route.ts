import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { slotId?: string } | null;
  const slotId = body?.slotId;
  if (!slotId) {
    return NextResponse.json({ error: "slotId가 필요합니다." }, { status: 400 });
  }

  const slot = await prisma.matchSlot.findUnique({ where: { id: slotId } });
  if (!slot) {
    return NextResponse.json({ error: "슬롯을 찾을 수 없습니다." }, { status: 404 });
  }

  const updated = await prisma.matchSlot.update({
    where: { id: slotId },
    data: { checkedIn: !slot.checkedIn },
    include: { team: true },
  });

  return NextResponse.json({
    slotId: updated.id,
    checkedIn: updated.checkedIn,
    teamNumber: updated.team.number,
  });
}
