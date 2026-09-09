import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTeamPush } from "@/lib/push";
import { requireStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const gate = await requireStaff();
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => null)) as {
    teamId?: string;
    matchNumber?: number;
  } | null;

  if (!body?.teamId) {
    return NextResponse.json({ error: "teamId가 필요합니다." }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { id: body.teamId } });
  if (!team) {
    return NextResponse.json({ error: "팀을 찾을 수 없습니다." }, { status: 404 });
  }

  const matchLabel = body.matchNumber ? `${body.matchNumber}경기` : "경기";
  const result = await sendTeamPush({
    teamId: team.id,
    title: "알림호출",
    body: `${team.number} 팀, ${matchLabel} 경기장으로 와 주세요.`,
    url: "/",
  });

  return NextResponse.json({
    ...result,
    teamNumber: team.number,
  });
}
