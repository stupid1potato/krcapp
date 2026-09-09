"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NoticeDTO } from "@/lib/types";
import {
  dismissNoticeId,
  initializeNoticePopup,
  isNoticePopupInitialized,
  loadDismissedNoticeIds,
  selectQueuedNotice,
} from "@/lib/notice-popup";

const POLL_MS = 10_000;
const FADE_MS = 150;

function isBracketTab(pathname: string) {
  return pathname === "/" || pathname.startsWith("/bracket");
}

export function NoticePopup() {
  const pathname = usePathname();
  const onBracket = isBracketTab(pathname);
  const [notice, setNotice] = useState<NoticeDTO | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef<Set<string>>(new Set());
  const noticesRef = useRef<NoticeDTO[]>([]);
  const fadingRef = useRef(false);
  const shownIdRef = useRef<string | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const applyQueue = useCallback(
    (notices: NoticeDTO[]) => {
      noticesRef.current = notices;
      const next = selectQueuedNotice(notices, dismissedRef.current);
      const currentId = shownIdRef.current;

      if (!next) {
        if (!currentId) return;
        fadingRef.current = true;
        setVisible(false);
        clearFadeTimer();
        fadeTimerRef.current = window.setTimeout(() => {
          shownIdRef.current = null;
          setNotice(null);
          fadingRef.current = false;
          fadeTimerRef.current = null;
        }, FADE_MS);
        return;
      }

      if (currentId === next.id) {
        setNotice(next);
        return;
      }

      if (!currentId) {
        shownIdRef.current = next.id;
        setNotice(next);
        requestAnimationFrame(() => setVisible(true));
        return;
      }

      fadingRef.current = true;
      setVisible(false);
      clearFadeTimer();
      fadeTimerRef.current = window.setTimeout(() => {
        shownIdRef.current = next.id;
        setNotice(next);
        fadingRef.current = false;
        fadeTimerRef.current = null;
        requestAnimationFrame(() => setVisible(true));
      }, FADE_MS);
    },
    [clearFadeTimer],
  );

  const ingest = useCallback(
    (notices: NoticeDTO[]) => {
      dismissedRef.current = new Set(loadDismissedNoticeIds());
      if (!isNoticePopupInitialized()) {
        dismissedRef.current = new Set(initializeNoticePopup(notices.map((item) => item.id)));
        noticesRef.current = notices;
        return;
      }
      applyQueue(notices);
    },
    [applyQueue],
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notices", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { notices?: NoticeDTO[] };
      ingest(data.notices ?? []);
    } catch {
      /* keep last known notices */
    }
  }, [ingest]);

  useEffect(() => {
    if (!onBracket) {
      clearFadeTimer();
      fadingRef.current = false;
      setVisible(false);
      shownIdRef.current = null;
      setNotice(null);
      return;
    }

    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      clearFadeTimer();
    };
  }, [onBracket, load, clearFadeTimer]);

  useEffect(() => {
    if (!onBracket || !("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; notice?: NoticeDTO; noticeId?: string } | null;
      if (!data || data.type !== "notice") return;
      if (data.notice?.id) {
        const incoming = data.notice;
        const merged = [incoming, ...noticesRef.current.filter((item) => item.id !== incoming.id)];
        ingest(merged);
        return;
      }
      void load();
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [onBracket, ingest, load]);

  function dismissCurrent() {
    if (!notice || fadingRef.current) return;
    dismissedRef.current = new Set(dismissNoticeId(notice.id));
    applyQueue(noticesRef.current);
  }

  if (!onBracket || !notice) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center px-6 transition-opacity duration-150 ease-linear ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-popup-title"
    >
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="닫기" onClick={dismissCurrent} />
      <div className="relative w-full max-w-[320px] rounded-2xl bg-white px-5 py-5 shadow-xl">
        <span className="inline-flex rounded-full bg-sage/15 px-2.5 py-1 text-[11px] font-medium text-sage">
          새 공지
        </span>
        <h2 id="notice-popup-title" className="mt-3 truncate text-[17px] font-medium text-black">
          {notice.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-[14px] leading-5 text-neutral-500">{notice.body}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={dismissCurrent} className="px-1 text-[15px] font-medium text-neutral-400">
            닫기
          </button>
          <Link
            href={`/notices/${notice.id}`}
            onClick={() => {
              dismissedRef.current = new Set(dismissNoticeId(notice.id));
            }}
            className="inline-flex rounded-xl bg-sage px-4 py-2.5 text-[14px] font-medium text-white"
          >
            공지 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
