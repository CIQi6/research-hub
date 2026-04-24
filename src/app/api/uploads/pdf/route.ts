import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import {
  buildPdfStoragePath,
  PDF_MAX_BYTES,
  PDF_UPLOAD_BUCKET,
  sanitizePdfFileName,
  validatePdfUploadMeta,
} from "@/lib/pdf-upload.ts";

export const runtime = "nodejs";

async function ensurePdfBucket() {
  const supabase = getSupabase();
  const { data } = await supabase.storage.getBucket(PDF_UPLOAD_BUCKET);

  if (data) {
    return;
  }

  const { error } = await supabase.storage.createBucket(PDF_UPLOAD_BUCKET, {
    public: true,
    fileSizeLimit: PDF_MAX_BYTES,
    allowedMimeTypes: ["application/pdf"],
  });

  if (error && !/already exists/i.test(error.message)) {
    throw new Error(error.message);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "缺少 PDF 文件" }, { status: 400 });
    }

    validatePdfUploadMeta({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    await ensurePdfBucket();

    const storagePath = buildPdfStoragePath(
      session.user.github_id,
      file.name,
      randomUUID()
    );
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await getSupabase()
      .storage
      .from(PDF_UPLOAD_BUCKET)
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = getSupabase()
      .storage
      .from(PDF_UPLOAD_BUCKET)
      .getPublicUrl(storagePath);

    return Response.json({
      url: data.publicUrl,
      fileName: sanitizePdfFileName(file.name),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "PDF 上传失败" },
      { status: 400 }
    );
  }
}
