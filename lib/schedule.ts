import type { Alliance, EventScheduleDTO, MatchDTO, MatchStatus, TeamSlotDTO } from "@/lib/types";
import { prisma } from "@/lib/prisma";

function sortSlots(slots: TeamSlotDTO[]) {
  return [...slots].sort((a, b) => {
    if (a.alliance !== b.alliance) return a.alliance === "RED" ? -1 : 1;
    return a.station - b.station;
  });
}

export async function getEventSchedule(): Promise<EventScheduleDTO | null> {
  const event = await prisma.event.findFirst({
    include: {
      matches: {
        orderBy: { number: "asc" },
        include: {
          slots: { include: { team: true } },
        },
      },
    },
  });

  if (!event) return null;

  const matches: MatchDTO[] = event.matches.map((match) => ({
    id: match.id,
    number: match.number,
    status: match.status as MatchStatus,
    redScore: match.redScore,
    blueScore: match.blueScore,
    entryCloseAt: match.entryCloseAt.toISOString(),
    startAt: match.startAt.toISOString(),
    slots: sortSlots(
      match.slots.map((slot) => ({
        id: slot.id,
        alliance: slot.alliance as Alliance,
        station: slot.station,
        checkedIn: slot.checkedIn,
        team: {
          id: slot.team.id,
          number: slot.team.number,
          name: slot.team.name,
        },
      })),
    ),
  }));

  return {
    id: event.id,
    name: event.name,
    matchCount: matches.length,
    matches,
  };
}
