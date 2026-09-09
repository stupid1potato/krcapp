export type Alliance = "RED" | "BLUE";
export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "FINISHED";

export type TeamSlotDTO = {
  id: string;
  alliance: Alliance;
  station: number;
  checkedIn: boolean;
  team: {
    id: string;
    number: string;
    name: string;
  };
};

export type MatchDTO = {
  id: string;
  number: number;
  status: MatchStatus;
  redScore: number | null;
  blueScore: number | null;
  entryCloseAt: string;
  startAt: string;
  slots: TeamSlotDTO[];
};

export type EventScheduleDTO = {
  id: string;
  name: string;
  matchCount: number;
  matches: MatchDTO[];
};

export type NoticeDTO = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type TeamRef = {
  slotId: string;
  teamId: string;
  number: string;
  name: string;
  checkedIn: boolean;
  matchNumber: number;
};
