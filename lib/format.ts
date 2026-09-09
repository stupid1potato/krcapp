const KST = "Asia/Seoul";

export function formatClock(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatHm(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function statusLabel(status: string) {
  if (status === "FINISHED") return "종료";
  if (status === "IN_PROGRESS") return "진행중";
  return "예정";
}
