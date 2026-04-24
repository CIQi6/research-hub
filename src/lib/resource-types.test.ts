import assert from "node:assert/strict";
import test from "node:test";
import { formatTimeAgo } from "./resource-types.ts";

test("formatTimeAgo returns localized relative times", () => {
  const now = Date.parse("2026-04-24T08:00:00.000Z");

  assert.equal(formatTimeAgo("2026-04-24T07:59:40.000Z", now), "刚刚");
  assert.equal(formatTimeAgo("2026-04-24T07:45:00.000Z", now), "15 分钟前");
  assert.equal(formatTimeAgo("2026-04-24T05:00:00.000Z", now), "3 小时前");
  assert.equal(formatTimeAgo("2026-04-21T08:00:00.000Z", now), "3 天前");
});
