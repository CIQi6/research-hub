import assert from "node:assert/strict";
import test from "node:test";
import {
  formatResourceDate,
  getEmptyResourceMessage,
  getResourceDomain,
  getResourceSummary,
  getResourceTitle,
  getResourceTypeLabel,
  hasActiveResourceFilters,
  isExternalResourceUrl,
} from "./resource-display.ts";

test("getResourceTypeLabel returns localized resource type names", () => {
  assert.equal(getResourceTypeLabel("web"), "网页");
  assert.equal(getResourceTypeLabel("pdf"), "PDF");
});

test("getResourceDomain extracts a readable host from valid URLs", () => {
  assert.equal(
    getResourceDomain("https://space.bilibili.com/1822828582?spm_id_from=..0.0"),
    "space.bilibili.com"
  );
});

test("getResourceDomain falls back to the raw value for malformed URLs", () => {
  assert.equal(getResourceDomain("not a url"), "not a url");
});

test("getResourceDomain labels blank URLs as unknown source", () => {
  assert.equal(getResourceDomain("   "), "未知来源");
});

test("isExternalResourceUrl only accepts http(s) URLs", () => {
  assert.equal(isExternalResourceUrl("https://example.com"), true);
  assert.equal(isExternalResourceUrl("http://example.com"), true);
  assert.equal(isExternalResourceUrl("ftp://example.com"), false);
  assert.equal(isExternalResourceUrl(""), false);
});

test("resource title and summary helpers protect legacy invalid rows", () => {
  assert.equal(getResourceTitle("   "), "未命名资源");
  assert.equal(getResourceTitle("  Valid title  "), "Valid title");
  assert.equal(getResourceSummary("   "), "缺少摘要");
  assert.equal(getResourceSummary("  Useful  "), "Useful");
});

test("formatResourceDate returns a stable UTC date string", () => {
  assert.equal(formatResourceDate("2026-04-24T05:13:47.522763+00:00"), "2026-04-24");
});

test("hasActiveResourceFilters detects search, type, or tag filters", () => {
  assert.equal(hasActiveResourceFilters({ q: "", type: "all", tag: "all" }), false);
  assert.equal(hasActiveResourceFilters({ q: "ai", type: "all", tag: "all" }), true);
  assert.equal(hasActiveResourceFilters({ q: "", type: "web", tag: "all" }), true);
  assert.equal(hasActiveResourceFilters({ q: "", type: "all", tag: "ai" }), true);
});

test("getEmptyResourceMessage distinguishes empty library from empty filters", () => {
  assert.equal(getEmptyResourceMessage(false), "还没有资源，先发布第一条。");
  assert.equal(getEmptyResourceMessage(true), "没有资源匹配当前筛选。");
});
