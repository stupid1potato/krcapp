import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCsvTable, parseImportDateTime } from "./csv";
import { buildImport } from "./csv-import";
import type { ImportContext } from "./csv-import";

const ctx: ImportContext = {
  eventName: "테스트 대회",
  existingTeamNumbers: new Set(["28657", "33863"]),
  staffUsernames: new Set(["admin"]),
};

test("parseCsvTable reads headers, quotes, and skips blank rows", () => {
  const table = parseCsvTable(
    '\uFEFFteam_number,team_name\n10001,"Alpha, A"\n\n10002,Bravo\n',
  );
  assert.ok(!("error" in table));
  assert.deepEqual(table.headers, ["team_number", "team_name"]);
  assert.equal(table.rows.length, 2);
  assert.equal(table.rows[0]?.values.team_name, "Alpha, A");
  assert.equal(table.rows[1]?.line, 4);
});

test("timezone-less datetimes are KST", () => {
  const date = parseImportDateTime("2026-09-09T13:00");
  assert.ok(date);
  assert.equal(date.toISOString(), "2026-09-09T04:00:00.000Z");
  assert.equal(parseImportDateTime("2026-09-09T04:00:00.000Z")?.toISOString(), "2026-09-09T04:00:00.000Z");
  assert.equal(parseImportDateTime("2026-13-01T00:00"), null);
});

test("preview rejects staff role, password column, and admin collision", () => {
  const built = buildImport({
    ctx,
    teams: {
      fileName: "teams.csv",
      text: "team_number,team_name,role,password\nadmin,Ops,staff,secret\n",
    },
  });
  assert.equal(built.preview.canApply, false);
  assert.ok(built.preview.teams?.fileErrors.some((error) => error.includes("password")));
  assert.ok(built.preview.teams?.rows[0]?.errors.some((error) => error.includes("운영 계정")));
});

test("unknown match teams are row errors and disable apply", () => {
  const built = buildImport({
    ctx,
    matches: {
      fileName: "matches.csv",
      text: [
        "match_number,red1,red2,blue1,blue2,entry_close_at,start_at",
        "1,28657,33863,99999,33863,2026-09-09T12:56,2026-09-09T13:00",
      ].join("\n"),
    },
  });
  assert.equal(built.preview.canApply, false);
  const errors = built.preview.matches?.rows[0]?.errors ?? [];
  assert.ok(errors.some((error) => error.includes("99999")));
  assert.ok(errors.some((error) => error.includes("중복")));
});

test("teams.csv numbers can satisfy matches.csv in the same preview", () => {
  const built = buildImport({
    ctx,
    teams: {
      fileName: "teams.csv",
      text: "team_number,team_name\n10001,A\n10002,B\n10003,C\n10004,D\n",
    },
    matches: {
      fileName: "matches.csv",
      text: "match_number,red1,red2,blue1,blue2,entry_close_at,start_at\n1,10001,10002,10003,10004,2026-09-09T12:56,2026-09-09T13:00\n",
    },
  });
  assert.equal(built.preview.errorCount, 0);
  assert.equal(built.preview.canApply, true);
  assert.equal(built.parsedTeams?.length, 4);
  assert.equal(built.parsedMatches?.length, 1);
  assert.equal(built.parsedTeams?.[1]?.email, "10002@krc.app");
});
