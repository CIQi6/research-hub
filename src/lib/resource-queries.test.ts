import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResourceFilters,
  buildResourceQueryString,
  normalizeResourceSort,
} from "./resource-queries.ts";

test("buildResourceFilters normalizes resource list query params", () => {
  assert.deepEqual(
    buildResourceFilters({
      q: " transformer ",
      type: "pdf",
      tag: "NLP ",
      owner: "42",
      sort: "discussed",
    }),
    {
      q: "transformer",
      type: "pdf",
      tag: "nlp",
      ownerGithubId: 42,
      sort: "discussed",
    }
  );
});

test("buildResourceFilters falls back from invalid type owner and sort", () => {
  assert.deepEqual(
    buildResourceFilters({
      q: " ",
      type: "zip",
      tag: " ",
      owner: "nope",
      sort: "random",
    }),
    {
      sort: "latest",
    }
  );
});

test("normalizeResourceSort accepts only supported sort values", () => {
  assert.equal(normalizeResourceSort("latest"), "latest");
  assert.equal(normalizeResourceSort("discussed"), "discussed");
  assert.equal(normalizeResourceSort("bookmarked"), "bookmarked");
  assert.equal(normalizeResourceSort("bad"), "latest");
  assert.equal(normalizeResourceSort(null), "latest");
});

test("buildResourceQueryString serializes active filters in stable order", () => {
  assert.equal(
    buildResourceQueryString({
      q: " infra ",
      type: "web",
      tag: "ai-infra",
      sort: "bookmarked",
    }),
    "q=infra&type=web&tag=ai-infra&sort=bookmarked"
  );
});

test("buildResourceQueryString omits default sort and inactive filters", () => {
  assert.equal(
    buildResourceQueryString({
      q: "",
      type: undefined,
      tag: undefined,
      sort: "latest",
    }),
    ""
  );
});
