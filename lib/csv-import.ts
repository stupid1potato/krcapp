import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";
import {
  decodeUtf8Csv,
  isEmail,
  parseCsvTable,
  parseImportDateTime,
  parseOptionalInt,
  parseRequiredInt,
} from "@/lib/csv";
import type { MatchStatus } from "@/lib/types";
import type {
  ApplyResult,
  FilePreview,
  ImportPreview,
  ParsedMatch,
  ParsedTeam,
  PreviewRow,
} from "@/lib/import-types";

const TEAM_REQUIRED = ["team_number", "team_name"] as const;
const MATCH_REQUIRED = ["match_number", "red1", "red2", "blue1", "blue2", "entry_close_at", "start_at"] as const;
const STATUSES = new Set<MatchStatus>(["SCHEDULED", "IN_PROGRESS", "FINISHED"]);

export type ImportContext = {
  eventName: string | null;
  existingTeamNumbers: Set<string>;
  staffUsernames: Set<string>;
};

export type BuiltImport = {
  preview: ImportPreview;
  parsedTeams: ParsedTeam[] | null;
  parsedMatches: ParsedMatch[] | null;
};

export async function getImportContext(): Promise<ImportContext> {
  const [event, teams, users] = await Promise.all([
    prisma.event.findFirst({ select: { name: true } }),
    prisma.team.findMany({ select: { number: true } }),
    prisma.user.findMany({ select: { username: true, role: true } }),
  ]);

  return {
    eventName: event?.name ?? null,
    existingTeamNumbers: new Set(teams.map((team) => team.number)),
    staffUsernames: new Set(users.filter((user) => isStaffRole(user.role)).map((user) => user.username)),
  };
}

function missingHeaders(headers: string[], required: readonly string[]) {
  return required.filter((name) => !headers.includes(name));
}

function teamEmail(teamNumber: string, rawEmail: string) {
  return rawEmail.trim() ? rawEmail.trim() : `${teamNumber}@krc.app`;
}

function validateTeamsFile(
  fileName: string,
  text: string,
  ctx: ImportContext,
): { preview: FilePreview; parsed: ParsedTeam[] } {
  const rows: PreviewRow[] = [];
  const fileErrors: string[] = [];
  const parsed: ParsedTeam[] = [];
  const table = parseCsvTable(text);

  if ("error" in table) {
    return {
      preview: { kind: "teams", fileName, fileErrors: [table.error], rows, errorCount: 1 },
      parsed: [],
    };
  }

  const missing = missingHeaders(table.headers, TEAM_REQUIRED);
  if (missing.length > 0) {
    fileErrors.push(`필수 열이 없습니다: ${missing.join(", ")}`);
  }
  if (table.headers.includes("password")) {
    fileErrors.push("password 열은 사용할 수 없습니다. 비밀번호는 이메일 문자열로 설정됩니다.");
  }

  const seen = new Map<string, number>();

  for (const row of table.rows) {
    const errors: string[] = [];
    const teamNumber = (row.values.team_number ?? "").trim();
    const teamName = (row.values.team_name ?? "").trim();
    const roleRaw = (row.values.role ?? "").trim();
    const emailRaw = (row.values.email ?? "").trim();

    if (!teamNumber) errors.push("team_number가 비어 있습니다.");
    if (!teamName) errors.push("team_name이 비어 있습니다.");

    const role = (roleRaw || "participant").toLowerCase();
    if (role !== "participant") {
      errors.push("CSV로는 운영 계정(staff/admin)을 만들 수 없습니다. role은 participant만 허용합니다.");
    }

    if (teamNumber && ctx.staffUsernames.has(teamNumber)) {
      errors.push(`운영 계정과 팀 번호가 충돌합니다: ${teamNumber}`);
    }

    const email = teamNumber ? teamEmail(teamNumber, emailRaw) : emailRaw;
    if (email && !isEmail(email)) errors.push("email 형식이 올바르지 않습니다.");

    if (teamNumber) {
      const prev = seen.get(teamNumber);
      if (prev) errors.push(`team_number가 ${prev}행과 중복됩니다.`);
      else seen.set(teamNumber, row.line);
    }

    rows.push({ line: row.line, values: row.values, errors });
    if (errors.length === 0 && teamNumber) {
      parsed.push({ teamNumber, teamName, email });
    }
  }

  const errorCount = fileErrors.length + rows.reduce((sum, row) => sum + row.errors.length, 0);
  return {
    preview: { kind: "teams", fileName, fileErrors, rows, errorCount },
    parsed,
  };
}

function validateMatchesFile(
  fileName: string,
  text: string,
  ctx: ImportContext,
  csvTeamNumbers: Set<string>,
): { preview: FilePreview; parsed: ParsedMatch[] } {
  const rows: PreviewRow[] = [];
  const fileErrors: string[] = [];
  const parsed: ParsedMatch[] = [];
  const table = parseCsvTable(text);

  if ("error" in table) {
    return {
      preview: { kind: "matches", fileName, fileErrors: [table.error], rows, errorCount: 1 },
      parsed: [],
    };
  }

  if (!ctx.eventName) {
    fileErrors.push("현재 대회(이벤트)가 없습니다. 시드를 먼저 실행하세요.");
  }

  const missing = missingHeaders(table.headers, MATCH_REQUIRED);
  if (missing.length > 0) {
    fileErrors.push(`필수 열이 없습니다: ${missing.join(", ")}`);
  }

  const knownTeams = new Set([...ctx.existingTeamNumbers, ...csvTeamNumbers]);
  const seen = new Map<number, number>();

  for (const row of table.rows) {
    const errors: string[] = [];
    const matchNumberRaw = parseRequiredInt(row.values.match_number ?? "", "match_number");
    let matchNumber = 0;
    if ("error" in matchNumberRaw) errors.push(matchNumberRaw.error);
    else if (matchNumberRaw.value < 1) errors.push("match_number는 1 이상이어야 합니다.");
    else {
      matchNumber = matchNumberRaw.value;
      const prev = seen.get(matchNumber);
      if (prev) errors.push(`match_number가 ${prev}행과 중복됩니다.`);
      else seen.set(matchNumber, row.line);
    }

    const red1 = (row.values.red1 ?? "").trim();
    const red2 = (row.values.red2 ?? "").trim();
    const blue1 = (row.values.blue1 ?? "").trim();
    const blue2 = (row.values.blue2 ?? "").trim();
    const stations = [
      ["red1", red1],
      ["red2", red2],
      ["blue1", blue1],
      ["blue2", blue2],
    ] as const;

    for (const [label, number] of stations) {
      if (!number) {
        errors.push(`${label}이(가) 비어 있습니다.`);
        continue;
      }
      if (!knownTeams.has(number)) {
        errors.push(`알 수 없는 팀 번호입니다: ${number}`);
      }
    }

    const uniqueTeams = [red1, red2, blue1, blue2].filter(Boolean);
    if (new Set(uniqueTeams).size !== uniqueTeams.length) {
      errors.push("같은 경기에 동일한 팀이 중복됩니다.");
    }

    const entryCloseAt = parseImportDateTime(row.values.entry_close_at ?? "");
    if (!entryCloseAt) errors.push("entry_close_at 형식이 올바르지 않습니다. YYYY-MM-DDTHH:mm 또는 ISO를 사용하세요.");
    const startAt = parseImportDateTime(row.values.start_at ?? "");
    if (!startAt) errors.push("start_at 형식이 올바르지 않습니다. YYYY-MM-DDTHH:mm 또는 ISO를 사용하세요.");

    const statusRaw = (row.values.status ?? "").trim();
    const status = (statusRaw ? statusRaw.toUpperCase() : "SCHEDULED") as MatchStatus;
    if (!STATUSES.has(status)) {
      errors.push("status는 SCHEDULED, IN_PROGRESS, FINISHED 중 하나여야 합니다.");
    }

    const redScoreRaw = parseOptionalInt(row.values.red_score ?? "", "red_score");
    const blueScoreRaw = parseOptionalInt(row.values.blue_score ?? "", "blue_score");
    if ("error" in redScoreRaw) errors.push(redScoreRaw.error);
    if ("error" in blueScoreRaw) errors.push(blueScoreRaw.error);
    const redScore = "error" in redScoreRaw ? null : redScoreRaw.value;
    const blueScore = "error" in blueScoreRaw ? null : blueScoreRaw.value;
    if (redScore !== null && redScore < 0) errors.push("red_score는 0 이상이어야 합니다.");
    if (blueScore !== null && blueScore < 0) errors.push("blue_score는 0 이상이어야 합니다.");

    rows.push({ line: row.line, values: row.values, errors });
    if (errors.length === 0 && entryCloseAt && startAt && matchNumber >= 1) {
      parsed.push({
        matchNumber,
        red1,
        red2,
        blue1,
        blue2,
        entryCloseAt,
        startAt,
        status,
        redScore,
        blueScore,
      });
    }
  }

  const errorCount = fileErrors.length + rows.reduce((sum, row) => sum + row.errors.length, 0);
  return {
    preview: { kind: "matches", fileName, fileErrors, rows, errorCount },
    parsed,
  };
}

export function buildImport(input: {
  teams?: { fileName: string; text: string } | null;
  matches?: { fileName: string; text: string } | null;
  ctx: ImportContext;
}): BuiltImport {
  const teamsFile = input.teams ?? null;
  const matchesFile = input.matches ?? null;

  if (!teamsFile && !matchesFile) {
    return {
      preview: {
        teams: null,
        matches: null,
        errorCount: 1,
        canApply: false,
        message: "teams.csv 또는 matches.csv를 업로드하세요.",
      },
      parsedTeams: null,
      parsedMatches: null,
    };
  }

  const teamResult = teamsFile ? validateTeamsFile(teamsFile.fileName, teamsFile.text, input.ctx) : null;
  const csvTeamNumbers = new Set((teamResult?.parsed ?? []).map((team) => team.teamNumber));
  if (teamsFile && teamResult) {
    for (const row of teamResult.preview.rows) {
      const number = (row.values.team_number ?? "").trim();
      if (number) csvTeamNumbers.add(number);
    }
  }

  const matchResult = matchesFile
    ? validateMatchesFile(matchesFile.fileName, matchesFile.text, input.ctx, csvTeamNumbers)
    : null;

  const teamsPreview = teamResult?.preview ?? null;
  const matchesPreview = matchResult?.preview ?? null;
  const errorCount = (teamsPreview?.errorCount ?? 0) + (matchesPreview?.errorCount ?? 0);
  const canApply = errorCount === 0;

  return {
    preview: {
      teams: teamsPreview,
      matches: matchesPreview,
      errorCount,
      canApply,
      message: canApply ? null : "오류가 있는 행을 수정한 뒤 다시 미리보기 하세요.",
    },
    parsedTeams: teamsFile ? (teamResult?.parsed ?? []) : null,
    parsedMatches: matchesFile ? (matchResult?.parsed ?? []) : null,
  };
}

export async function readCsvUploads(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return { error: "multipart form 데이터가 필요합니다." as const };

  async function read(field: string) {
    const entry = form!.get(field);
    if (!entry) return null;
    if (typeof entry === "string") {
      const text = entry.trim();
      return text ? { fileName: `${field}.csv`, text } : null;
    }
    if (entry.size === 0) return null;
    const text = decodeUtf8Csv(await entry.arrayBuffer());
    if (!text.trim()) return null;
    return { fileName: entry.name || `${field}.csv`, text };
  }

  return {
    teams: await read("teams"),
    matches: await read("matches"),
  };
}

export async function previewImport(uploads: {
  teams?: { fileName: string; text: string } | null;
  matches?: { fileName: string; text: string } | null;
}) {
  const ctx = await getImportContext();
  return buildImport({ ...uploads, ctx }).preview;
}

export async function applyImport(uploads: {
  teams?: { fileName: string; text: string } | null;
  matches?: { fileName: string; text: string } | null;
}): Promise<{ ok: true; result: ApplyResult } | { ok: false; preview: ImportPreview } | { ok: false; error: string; status: number }> {
  const ctx = await getImportContext();
  const built = buildImport({ ...uploads, ctx });
  if (!built.preview.canApply) {
    return { ok: false, preview: built.preview };
  }

  const event = await prisma.event.findFirst();
  if (!event) {
    return { ok: false, error: "이벤트가 없습니다.", status: 404 };
  }

  const parsedTeams = built.parsedTeams;
  const parsedMatches = built.parsedMatches;

  const passwordByTeam = new Map<string, string>();
  if (parsedTeams) {
    const hashes = await Promise.all(parsedTeams.map((team) => bcrypt.hash(team.email, 10)));
    parsedTeams.forEach((team, index) => {
      passwordByTeam.set(team.teamNumber, hashes[index]!);
    });
  }

  await prisma.$transaction(
    async (tx) => {
      const teamIdByNumber = new Map<string, string>();

      if (parsedTeams) {
        for (const team of parsedTeams) {
          const saved = await tx.team.upsert({
            where: { number: team.teamNumber },
            create: { number: team.teamNumber, name: team.teamName },
            update: { name: team.teamName },
          });
          teamIdByNumber.set(saved.number, saved.id);

          const existingUser = await tx.user.findUnique({ where: { username: team.teamNumber } });
          if (existingUser && isStaffRole(existingUser.role)) {
            throw new Error(`운영 계정과 팀 번호가 충돌합니다: ${team.teamNumber}`);
          }

          await tx.user.upsert({
            where: { username: team.teamNumber },
            create: {
              username: team.teamNumber,
              email: team.email,
              passwordHash: passwordByTeam.get(team.teamNumber)!,
              role: "participant",
              teamId: saved.id,
            },
            update: {
              email: team.email,
              passwordHash: passwordByTeam.get(team.teamNumber)!,
              role: "participant",
              teamId: saved.id,
            },
          });
        }
      }

      if (parsedMatches) {
        const dbTeams = await tx.team.findMany({ select: { id: true, number: true } });
        for (const team of dbTeams) teamIdByNumber.set(team.number, team.id);

        const matchNumbers = parsedMatches.map((match) => match.matchNumber);

        for (const match of parsedMatches) {
          const saved = await tx.match.upsert({
            where: { eventId_number: { eventId: event.id, number: match.matchNumber } },
            create: {
              eventId: event.id,
              number: match.matchNumber,
              status: match.status,
              redScore: match.redScore,
              blueScore: match.blueScore,
              entryCloseAt: match.entryCloseAt,
              startAt: match.startAt,
            },
            update: {
              status: match.status,
              redScore: match.redScore,
              blueScore: match.blueScore,
              entryCloseAt: match.entryCloseAt,
              startAt: match.startAt,
            },
          });

          await tx.matchSlot.deleteMany({ where: { matchId: saved.id } });

          const slots = [
            { alliance: "RED", station: 1, number: match.red1 },
            { alliance: "RED", station: 2, number: match.red2 },
            { alliance: "BLUE", station: 1, number: match.blue1 },
            { alliance: "BLUE", station: 2, number: match.blue2 },
          ];

          for (const slot of slots) {
            const teamId = teamIdByNumber.get(slot.number);
            if (!teamId) throw new Error(`알 수 없는 팀 번호입니다: ${slot.number}`);
            await tx.matchSlot.create({
              data: {
                matchId: saved.id,
                teamId,
                alliance: slot.alliance,
                station: slot.station,
                checkedIn: false,
              },
            });
          }
        }

        if (matchNumbers.length === 0) {
          await tx.match.deleteMany({ where: { eventId: event.id } });
        } else {
          await tx.match.deleteMany({
            where: { eventId: event.id, number: { notIn: matchNumbers } },
          });
        }
      }
    },
    { timeout: 20_000 },
  );

  return {
    ok: true,
    result: {
      eventName: event.name,
      teamsUpserted: parsedTeams?.length ?? 0,
      matchesReplaced: parsedMatches?.length ?? 0,
      usersUpserted: parsedTeams?.length ?? 0,
    },
  };
}
