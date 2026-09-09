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

  const payload = JSON.stringify({
    title: options.title,
    body: options.body,
    url: options.url ?? "/",
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
        payload,
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

  console.log(`[push] team=${options.teamId} sent=${sent} failed=${failed}`);
  return {
    sent,
    failed,
    skipped: false,
    message: sent > 0 ? `알림을 ${sent}대 기기로 보냈습니다.` : "알림 전송에 실패했습니다.",
  };
}
