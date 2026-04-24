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
    /不支持的资源类型/
  );
});

test("parseResourceDraft rejects blank required fields", () => {
  const base = {
    title: "A resource",
    url: "https://example.com",
    type: "web",
    summary: "Useful context.",
    tags: "",
  };

  assert.throws(
    () => parseResourceDraft({ ...base, title: "   " }),
    /资源标题不能为空/
  );
  assert.throws(
    () => parseResourceDraft({ ...base, url: "   " }),
    /资源链接不能为空/
  );
  assert.throws(
    () => parseResourceDraft({ ...base, summary: "   " }),
    /资源摘要不能为空/
  );
});

test("parseResourceDraft rejects invalid URLs", () => {
  assert.throws(
    () =>
      parseResourceDraft({
        title: "Bad URL",
        url: "not a url",
        type: "web",
        summary: "Useful context.",
        tags: "",
      }),
    /资源链接必须是有效的 http\(s\) URL/
  );
});

test("RESOURCE_TYPE_OPTIONS exposes the supported manual resource types", () => {
  assert.deepEqual(
    RESOURCE_TYPE_OPTIONS.map((option) => option.value),
    ["pdf", "web", "audio", "video", "ebook"]
  );
});
