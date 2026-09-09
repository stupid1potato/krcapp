import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatClock, formatHm, formatNoticeTime, kstParts } from "./format";

describe("kstParts", () => {
  it("shifts UTC instants to KST without Intl", () => {
    const parts = kstParts(new Date("2026-09-09T01:30:08.000Z"));
    assert.deepEqual(parts, { year: 2026, month: 9, day: 9, hour: 10, minute: 30, second: 8 });
  });
});

describe("formatters", () => {
  it("formatClock is HH:mm:ss in KST", () => {
    assert.equal(formatClock(new Date("2026-09-09T01:30:08.000Z")), "10:30:08");
  });

  it("formatHm is HH:mm in KST", () => {
    assert.equal(formatHm("2026-09-09T04:56:00.000Z"), "13:56");
  });

  it("formatNoticeTime is stable across Node and the browser", () => {
    assert.equal(formatNoticeTime("2026-09-09T01:30:00.000Z"), "9. 9. 10:30");
    assert.equal(formatNoticeTime("2026-09-09T00:00:00.000Z"), "9. 9. 09:00");
  });
});
