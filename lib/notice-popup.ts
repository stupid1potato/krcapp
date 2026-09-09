import type { NoticeDTO } from "./types";

export const NOTICE_POPUP_DISMISSED_KEY = "krc:notice-popup-dismissed";
export const NOTICE_POPUP_INITIALIZED_KEY = "krc:notice-popup-initialized";

export function parseStoredIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function selectQueuedNotice(notices: NoticeDTO[], dismissedIds: Iterable<string>): NoticeDTO | null {
  const dismissed = new Set(dismissedIds);
  const pending = notices
    .filter((notice) => !dismissed.has(notice.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  return pending[0] ?? null;
}

export function loadDismissedNoticeIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseStoredIds(window.localStorage.getItem(NOTICE_POPUP_DISMISSED_KEY));
}

export function isNoticePopupInitialized(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(NOTICE_POPUP_INITIALIZED_KEY) === "1";
}

export function initializeNoticePopup(existingIds: string[]): string[] {
  const unique = [...new Set([...loadDismissedNoticeIds(), ...existingIds])];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(NOTICE_POPUP_DISMISSED_KEY, JSON.stringify(unique));
    window.localStorage.setItem(NOTICE_POPUP_INITIALIZED_KEY, "1");
  }
  return unique;
}

export function dismissNoticeId(id: string): string[] {
  const next = [...new Set([...loadDismissedNoticeIds(), id])];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(NOTICE_POPUP_DISMISSED_KEY, JSON.stringify(next));
  }
  return next;
}
