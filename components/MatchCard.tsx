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
    <span className="w-3.5 text-center text-[13px] font-semibold text-mine">O</span>
  ) : (
    <span className="w-3.5 text-center text-[13px] font-semibold text-neutral-400">X</span>
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

  if (side === "RED") {
    return (
      <button
        type="button"
        onClick={() => onSelect(slot)}
        className="flex w-full items-center gap-1 text-left"
      >
        <span className="text-[17px] font-bold leading-none text-black">{slot.team.number}</span>
        <span className={`text-[12px] font-semibold leading-none ${tint}`}>{slot.team.number}</span>
        <CheckMarker checkedIn={slot.checkedIn} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      className="flex w-full items-center justify-end gap-1 text-right"
    >
      <CheckMarker checkedIn={slot.checkedIn} />
      <span className={`text-[12px] font-semibold leading-none ${tint}`}>{slot.team.number}</span>
      <span className="text-[17px] font-bold leading-none text-black">{slot.team.number}</span>
    </button>
  );
}

export function MatchCard({
  match,
  myTeamNumber,
  onSelectTeam,
}: {
  match: MatchDTO;
  myTeamNumber?: string | null;
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
    <article className={`rounded-[18px] px-3.5 py-3 ${cardTone(match)}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-black">{match.number}경기</h3>
        <span
          className={`rounded-full border px-2.5 py-[2px] text-[11px] font-medium ${badgeClass(match.status)}`}
        >
          {statusLabel(match.status)}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex flex-col gap-2">
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
          className={`min-w-[72px] text-center text-[22px] font-bold tracking-wide ${
            finished ? "text-black" : "text-neutral-700"
          }`}
        >
          {center}
        </div>
        <div className="flex flex-col gap-2">
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

      <p className="mt-2.5 text-[11px] text-neutral-400">
        입장마감 {formatHm(match.entryCloseAt)} · 경기 {formatHm(match.startAt)}
      </p>
    </article>
  );
}
