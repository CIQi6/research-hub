import assert from "node:assert/strict";
import test from "node:test";
import { parseArticleDraft } from "./article-form.ts";

test("parseArticleDraft normalizes valid article input", () => {
  assert.deepEqual(
    parseArticleDraft({
      title: "  论文阅读方法  ",
      summary: "  一套可复用的阅读流程  ",
      content: "  正文内容  ",
    }),
    {
      title: "论文阅读方法",
      summary: "一套可复用的阅读流程",
      content: "正文内容",
    }
  );
});

test("parseArticleDraft builds summary from content when summary is blank", () => {
  const draft = parseArticleDraft({
    title: "没有摘要",
    summary: "",
    content: "第一段内容\n\n第二段内容",
  });

  assert.equal(draft.summary, "第一段内容 第二段内容");
});

test("parseArticleDraft rejects blank title or content", () => {
  assert.throws(
    () => parseArticleDraft({ title: " ", content: "正文" }),
    /文章标题不能为空/
  );
  assert.throws(
    () => parseArticleDraft({ title: "标题", content: " " }),
    /文章正文不能为空/
  );
});
