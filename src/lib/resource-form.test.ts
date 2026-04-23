import assert from "node:assert/strict";
import test from "node:test";
import { parseResourceDraft, RESOURCE_TYPE_OPTIONS } from "./resource-form.ts";

test("parseResourceDraft normalizes a valid payload into resource input", () => {
  const parsed = parseResourceDraft({
    title: "  Attention Is All You Need  ",
    url: "https://arxiv.org/abs/1706.03762",
    type: "pdf",
    summary: "  Transformer paper.  ",
    tags: "nlp, transformers, nlp",
  });

  assert.deepEqual(parsed, {
    title: "Attention Is All You Need",
    url: "https://arxiv.org/abs/1706.03762",
    type: "pdf",
    summary: "Transformer paper.",
    tags: ["nlp", "transformers"],
  });
});

test("parseResourceDraft rejects unsupported resource types", () => {
  assert.throws(
    () =>
      parseResourceDraft({
        title: "Bad",
        url: "https://example.com",
        type: "zip",
        summary: "Nope",
        tags: "",
      }),
    /Unsupported resource type/
  );
});

test("RESOURCE_TYPE_OPTIONS exposes the supported manual resource types", () => {
  assert.deepEqual(
    RESOURCE_TYPE_OPTIONS.map((option) => option.value),
    ["pdf", "web", "audio", "video", "ebook"]
  );
});
