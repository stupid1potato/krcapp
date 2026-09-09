"use client";

import { statusLabel, formatHm } from "@/lib/format";
import type { MatchDTO, TeamRef, TeamSlotDTO } from "@/lib/types";

function cardTone(match: MatchDTO) {
  if (match.status === "IN_PROGRESS") return "bg-live";
  if (match.status !== "FINISHED") return "bg-white";
  const red = match.redScore ?? 0;
  const blue = match.blueScore ?? 0;
  if (red > blue) return "bg-win-red";
  if (blue > red) return "bg-win-blue";
  return "bg-neutral-50";
}

function badgeClass(status: string) {
  if (status === "IN_PROGRESS") {
    return "border-sage bg-white text-black";
  }
  if (status === "FINISHED") {
    return "border-neutral-800 bg-white text-black";
  }
  return "border-neutral-300 bg-white text-neutral-500";
}

function CheckMarker({ checkedIn }: { checkedIn: boolean }) {
  return checkedIn ? (
    <span className="w-3.5 shrink-0 text-center text-[13px] font-medium text-mine">O</span>
  ) : (
    <span className="w-3.5 shrink-0 text-center text-[13px] font-medium text-neutral-400">X</span>
  );
}

function TeamRow({
  slot,
  side,
  myTeamNumber,
  onSelect,
}: {
  slot: TeamSlotDTO;
  side: "RED" | "BLUE";
  myTeamNumber?: string | null;
  onSelect: (slot: TeamSlotDTO) => void;
}) {
  const mine = Boolean(myTeamNumber && slot.team.number === myTeamNumber);
  const tint = mine ? "text-mine" : side === "RED" ? "text-alliance-red" : "text-alliance-blue";
  const primaryClass = `min-w-0 truncate whitespace-nowrap text-[15px] font-semibold leading-none tabular-nums tracking-tight min-[391px]:text-[17px] ${tint} min-[391px]:text-black`;
  const ghostClass = `max-[390px]:hidden shrink-0 text-[12px] font-semibold leading-none ${tint}`;

  if (side === "RED") {
    return (
      <button
        type="button"
        onClick={() => onSelect(slot)}
        className="flex w-full min-w-0 items-center gap-0.5 overflow-hidden text-left"
      >
        <span className={primaryClass}>{slot.team.number}</span>
        <span className={ghostClass}>{slot.team.number}</span>
        <CheckMarker checkedIn={slot.checkedIn} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      className="flex w-full min-w-0 items-center justify-end gap-0.5 overflow-hidden text-right"
    >
      <CheckMarker checkedIn={slot.checkedIn} />
      <span className={ghostClass}>{slot.team.number}</span>
      <span className={primaryClass}>{slot.team.number}</span>
    </button>
  );
}

export function MatchCard({
  match,
  myTeamNumber,
  highlighted = false,
  onSelectTeam,
}: {
  match: MatchDTO;
  myTeamNumber?: string | null;
  highlighted?: boolean;
  onSelectTeam: (team: TeamRef) => void;
}) {
  const red = match.slots.filter((slot) => slot.alliance === "RED");
  const blue = match.slots.filter((slot) => slot.alliance === "BLUE");
  const finished = match.status === "FINISHED";
  const center = finished ? `${match.redScore ?? 0} : ${match.blueScore ?? 0}` : "vs";

  const handleSelect = (slot: TeamSlotDTO) => {
    onSelectTeam({
      slotId: slot.id,
      teamId: slot.team.id,
      number: slot.team.number,
      name: slot.team.name,
      checkedIn: slot.checkedIn,
      matchNumber: match.number,
    });
  };

  return (
    <article
      id={`match-${match.number}`}
      className={`w-full min-w-0 max-w-full overflow-hidden rounded-[18px] px-3 py-3 ${cardTone(match)} ${
        highlighted ? "ring-2 ring-sage" : ""
      }`}
    >
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-[15px] font-medium text-black">{match.number}경기</h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-[2px] text-[11px] font-medium min-[390px]:px-2.5 ${badgeClass(match.status)}`}
        >
          {statusLabel(match.status)}
        </span>
      </div>

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 min-[430px]:gap-2">
        <div className="flex min-w-0 flex-col gap-2">
          {red.map((slot) => (
            <TeamRow
              key={slot.id}
              slot={slot}
              side="RED"
              myTeamNumber={myTeamNumber}
              onSelect={handleSelect}
            />
          ))}
        </div>
        <div
          className={`shrink-0 px-0.5 text-center text-[16px] font-semibold tabular-nums tracking-normal min-[391px]:min-w-[72px] min-[391px]:px-1 min-[391px]:text-[22px] ${
            finished ? "text-black" : "text-neutral-700"
          }`}
        >
          {center}
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          {blue.map((slot) => (
            <TeamRow
              key={slot.id}
              slot={slot}
              side="BLUE"
              myTeamNumber={myTeamNumber}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      <p className="mt-2.5 truncate text-[11px] text-neutral-400">
        입장마감 {formatHm(match.entryCloseAt)} · 경기 {formatHm(match.startAt)}
      </p>
    </article>
  );
}
