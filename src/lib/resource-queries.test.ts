import assert from "node:assert/strict";
import test from "node:test";
import { buildResourceFilters } from "./resource-queries.ts";

test("buildResourceFilters normalizes resource list query params", () => {
  assert.deepEqual(
    buildResourceFilters({
      q: "transformer",
      type: "pdf",
      tag: "nlp",
      owner: "42",
    }),
    {
      q: "transformer",
      type: "pdf",
      tag: "nlp",
      ownerGithubId: 42,
    }
  );
});
