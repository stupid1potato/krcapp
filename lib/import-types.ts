import type { MatchStatus } from "@/lib/types";

export type PreviewRow = {
  line: number;
  values: Record<string, string>;
  errors: string[];
};

export type FilePreview = {
  kind: "teams" | "matches";
  fileName: string;
  fileErrors: string[];
  rows: PreviewRow[];
  errorCount: number;
};

export type ImportPreview = {
  teams: FilePreview | null;
  matches: FilePreview | null;
  errorCount: number;
  canApply: boolean;
  message: string | null;
};

export type ParsedTeam = {
  teamNumber: string;
  teamName: string;
  email: string;
};

export type ParsedMatch = {
  matchNumber: number;
  red1: string;
  red2: string;
  blue1: string;
  blue2: string;
  entryCloseAt: Date;
  startAt: Date;
  status: MatchStatus;
  redScore: number | null;
  blueScore: number | null;
};

export type ApplyResult = {
  eventName: string;
  teamsUpserted: number;
  matchesReplaced: number;
  usersUpserted: number;
};
