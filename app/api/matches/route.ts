import { NextResponse } from "next/server";
import { getEventSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function GET() {
  const schedule = await getEventSchedule();
  if (!schedule) {
    return NextResponse.json({ error: "이벤트가 없습니다." }, { status: 404 });
  }
  return NextResponse.json(schedule);
}
