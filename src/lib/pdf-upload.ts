export const PDF_UPLOAD_BUCKET = "resource-pdfs";
export const PDF_MAX_BYTES = 20 * 1024 * 1024;

interface PdfUploadMeta {
  name: string;
  type: string;
  size: number;
}

export function validatePdfUploadMeta(file: PdfUploadMeta): void {
  const name = file.name.trim().toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");

  if (!isPdf) {
    throw new Error("只能上传 PDF 文件");
  }

  if (file.size <= 0) {
    throw new Error("PDF 文件不能为空");
  }

  if (file.size > PDF_MAX_BYTES) {
    throw new Error("PDF 不能超过 20MB");
  }
}

export function sanitizePdfFileName(fileName: string): string {
  const withoutExtension = fileName
    .trim()
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${withoutExtension || "resource"}.pdf`;
}

export function buildPdfStoragePath(
  githubId: number,
  fileName: string,
  uniqueId: string
): string {
  return `${githubId}/${uniqueId}-${sanitizePdfFileName(fileName)}`;
}
