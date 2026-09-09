import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function vapidConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

function configureWebPush() {
  if (!vapidConfigured()) {
    throw new Error("VAPID keys are not configured");
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  type?: string;
  noticeId?: string;
  notice?: { id: string; title: string; body: string; createdAt: string };
};

async function sendToSubscriptions(
  subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
) {
  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    type: payload.type,
    noticeId: payload.noticeId,
    notice: payload.notice,
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body,
      );
      sent += 1;
    } catch (error) {
      failed += 1;
      const status = (error as { statusCode?: number }).statusCode;
      console.error(`[push] Failed for ${sub.endpoint}:`, error);
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
      }
    }
  }

  return { sent, failed, skipped: false as const };
}

export async function sendTeamPush(options: {
  teamId: string;
  title: string;
  body: string;
  url?: string;
}) {
  if (!vapidConfigured()) {
    console.warn("[push] VAPID keys missing — skipping send.");
    return { sent: 0, failed: 0, skipped: true, message: "VAPID 키가 설정되지 않았습니다." };
  }

  configureWebPush();

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { teamId: options.teamId },
  });

  if (subscriptions.length === 0) {
    console.log(`[push] No subscriptions for team ${options.teamId}. Nothing sent.`);
    return {
      sent: 0,
      failed: 0,
      skipped: false,
      message: "구독된 기기가 없습니다. 해당 팀으로 로그인한 뒤 프로필에서 알림을 허용하세요.",
    };
  }

  const result = await sendToSubscriptions(subscriptions, {
    title: options.title,
    body: options.body,
    url: options.url ?? "/",
  });

  console.log(`[push] team=${options.teamId} sent=${result.sent} failed=${result.failed}`);
  return {
    ...result,
    message: result.sent > 0 ? `알림을 ${result.sent}대 기기로 보냈습니다.` : "알림 전송에 실패했습니다.",
  };
}

export async function sendNoticePush(notice: {
  id: string;
  title: string;
  body: string;
  createdAt: Date | string;
}) {
  if (!vapidConfigured()) {
    console.warn("[push] VAPID keys missing — skipping notice broadcast.");
    return { sent: 0, failed: 0, skipped: true as const };
  }

  configureWebPush();

  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) {
    console.log("[push] No subscriptions for notice broadcast.");
    return { sent: 0, failed: 0, skipped: false as const };
  }

  const createdAt =
    typeof notice.createdAt === "string" ? notice.createdAt : notice.createdAt.toISOString();
  const summary = notice.body.length > 120 ? `${notice.body.slice(0, 117)}...` : notice.body;
  const result = await sendToSubscriptions(subscriptions, {
    type: "notice",
    title: notice.title,
    body: summary,
    url: "/",
    noticeId: notice.id,
    notice: { id: notice.id, title: notice.title, body: notice.body, createdAt },
  });
  console.log(`[push] notice=${notice.id} sent=${result.sent} failed=${result.failed}`);
  return result;
}
