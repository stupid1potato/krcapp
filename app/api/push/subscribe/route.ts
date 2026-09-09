import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SubscriptionBody = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.teamId) {
    return NextResponse.json({ error: "팀 계정으로 로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SubscriptionBody | null;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "잘못된 구독 정보입니다." }, { status: 400 });
  }

  const saved = await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: {
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      teamId: session.user.teamId,
      userId: session.user.id,
    },
    create: {
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      teamId: session.user.teamId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, id: saved.id });
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) {
    return NextResponse.json({ error: "endpoint가 필요합니다." }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } });
  return NextResponse.json({ ok: true });
}
