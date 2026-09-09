const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

/** KST wall time without Intl — Node/browser locale data cannot diverge. */
export function kstParts(date: Date) {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  };
}

export function formatClock(date: Date) {
  const { hour, minute, second } = kstParts(date);
  return `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;
}

export function formatHm(iso: string) {
  const { hour, minute } = kstParts(new Date(iso));
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function formatNoticeTime(iso: string) {
  const { month, day, hour, minute } = kstParts(new Date(iso));
  return `${month}. ${day}. ${pad2(hour)}:${pad2(minute)}`;
}

export function statusLabel(status: string) {
  if (status === "FINISHED") return "종료";
  if (status === "IN_PROGRESS") return "진행중";
  return "예정";
}
