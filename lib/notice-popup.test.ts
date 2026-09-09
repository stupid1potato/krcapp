import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseStoredIds, selectQueuedNotice } from "./notice-popup";
import type { NoticeDTO } from "@/lib/types";

function notice(id: string, createdAt: string, title = id): NoticeDTO {
  return { id, title, body: `${title} body`, createdAt };
}

describe("selectQueuedNotice", () => {
  it("returns the oldest undismissed notice", () => {
    const queued = selectQueuedNotice(
      [
        notice("b", "2026-09-09T12:00:00.000Z", "second"),
        notice("a", "2026-09-09T11:00:00.000Z", "first"),
        notice("c", "2026-09-09T13:00:00.000Z", "third"),
      ],
      ["c"],
    );
    assert.equal(queued?.id, "a");
  });

  it("returns null when every notice is dismissed", () => {
    const queued = selectQueuedNotice(
      [notice("a", "2026-09-09T11:00:00.000Z"), notice("b", "2026-09-09T12:00:00.000Z")],
      ["a", "b"],
    );
    assert.equal(queued, null);
  });
});

describe("parseStoredIds", () => {
  it("reads a JSON string array and ignores junk", () => {
    assert.deepEqual(parseStoredIds(JSON.stringify(["n1", "", 2, "n2"])), ["n1", "n2"]);
    assert.deepEqual(parseStoredIds("not-json"), []);
    assert.deepEqual(parseStoredIds(null), []);
  });
});
