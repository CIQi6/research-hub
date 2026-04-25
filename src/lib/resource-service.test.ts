import assert from "node:assert/strict";
import test from "node:test";
import { sortResourceSummaries } from "./resource-service.ts";
import type { ResourceSummary } from "./resource-types.ts";

function resource(
  id: string,
  updatedAt: string,
  commentCount: number,
  bookmarkCount: number
): ResourceSummary {
  return {
    id,
    title: id,
    url: `https://example.com/${id}`,
    type: "web",
    summary: id,
    created_at: updatedAt,
    updated_at: updatedAt,
    owner: {
      github_id: 1,
      github_username: "owner",
      avatar_url: null,
      field: "",
    },
    tags: [],
    comment_count: commentCount,
    bookmark_count: bookmarkCount,
    is_bookmarked: false,
  };
}

test("sortResourceSummaries orders latest by updated_at desc", () => {
  assert.deepEqual(
    sortResourceSummaries(
      [
        resource("old", "2026-01-01T00:00:00.000Z", 9, 9),
        resource("new", "2026-02-01T00:00:00.000Z", 0, 0),
      ],
      "latest"
    ).map((item) => item.id),
    ["new", "old"]
  );
});

test("sortResourceSummaries orders discussed by comment count then date", () => {
  assert.deepEqual(
    sortResourceSummaries(
      [
        resource("older-hot", "2026-01-01T00:00:00.000Z", 3, 0),
        resource("newer-hot", "2026-02-01T00:00:00.000Z", 3, 0),
        resource("cold", "2026-03-01T00:00:00.000Z", 1, 0),
      ],
      "discussed"
    ).map((item) => item.id),
    ["newer-hot", "older-hot", "cold"]
  );
});

test("sortResourceSummaries orders bookmarked by bookmark count then date", () => {
  assert.deepEqual(
    sortResourceSummaries(
      [
        resource("saved-old", "2026-01-01T00:00:00.000Z", 0, 5),
        resource("saved-new", "2026-02-01T00:00:00.000Z", 0, 5),
        resource("unsaved", "2026-03-01T00:00:00.000Z", 0, 1),
      ],
      "bookmarked"
    ).map((item) => item.id),
    ["saved-new", "saved-old", "unsaved"]
  );
});

test("sortResourceSummaries does not mutate the input array", () => {
  const input = [
    resource("old", "2026-01-01T00:00:00.000Z", 0, 0),
    resource("new", "2026-02-01T00:00:00.000Z", 0, 0),
  ];

  const sorted = sortResourceSummaries(input, "latest");

  assert.deepEqual(input.map((item) => item.id), ["old", "new"]);
  assert.deepEqual(sorted.map((item) => item.id), ["new", "old"]);
});
