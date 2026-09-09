"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function usePush() {
  const { data: session, status } = useSession();
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const enable = useCallback(async () => {
    if (!supported) {
      setMessage("이 브라우저는 알림을 지원하지 않습니다.");
      return;
    }
    if (status !== "authenticated" || !session?.user?.teamId) {
      setMessage("팀 계정으로 로그인한 뒤 알림을 받을 수 있습니다.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const vapidRes = await fetch("/api/push/vapid");
      const { publicKey } = (await vapidRes.json()) as { publicKey?: string };
      if (!publicKey) throw new Error("VAPID 공개키가 없습니다.");

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        setMessage("알림 권한이 거부되었습니다.");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "구독 저장에 실패했습니다.");
      }
      setSubscribed(true);
      setMessage("이 기기에서 알림을 받습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "알림 설정에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }, [session?.user?.teamId, status, supported]);

  return { supported, permission, subscribed, busy, message, enable };
}
