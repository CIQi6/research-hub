import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPdfStoragePath,
  sanitizePdfFileName,
  validatePdfUploadMeta,
} from "./pdf-upload.ts";

test("validatePdfUploadMeta accepts PDF mime type or extension", () => {
  assert.doesNotThrow(() =>
    validatePdfUploadMeta({
      name: "paper.pdf",
      type: "application/pdf",
      size: 1024,
    })
  );
});

test("validatePdfUploadMeta rejects non-PDF files and oversized PDFs", () => {
  assert.throws(
    () =>
      validatePdfUploadMeta({
        name: "paper.png",
        type: "image/png",
        size: 1024,
      }),
    /只能上传 PDF 文件/
  );

  assert.throws(
    () =>
      validatePdfUploadMeta({
        name: "paper.pdf",
        type: "application/pdf",
        size: 25 * 1024 * 1024,
      }),
    /PDF 不能超过 20MB/
  );
});

test("sanitizePdfFileName produces a stable pdf-safe file name", () => {
  assert.equal(sanitizePdfFileName("  AI Infra 论文(最终版).pdf  "), "ai-infra.pdf");
});

test("buildPdfStoragePath scopes uploads by user id", () => {
  assert.equal(
    buildPdfStoragePath(42, "Paper.pdf", "abc123"),
    "42/abc123-paper.pdf"
  );
});
