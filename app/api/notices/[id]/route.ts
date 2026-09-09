import { NextResponse } from "next/server";
import { getNotice } from "@/lib/notices";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = await getNotice(id);
  if (!notice) {
    return NextResponse.json({ error: "공지를 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json(notice);
}
