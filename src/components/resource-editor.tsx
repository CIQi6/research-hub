"use client";

import { useState } from "react";
import { FileUpIcon } from "lucide-react";
import type { ResourceType } from "@/lib/resource-types.ts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResourceTypeSelect } from "@/components/resource-type-select";
import { parseResourceDraft } from "@/lib/resource-form.ts";
import { validatePdfUploadMeta } from "@/lib/pdf-upload.ts";

export interface ResourceEditorValue {
  title: string;
  url: string;
  type: ResourceType;
  summary: string;
  tags: string;
}

const EMPTY_RESOURCE: ResourceEditorValue = {
  title: "",
  url: "",
  type: "web",
  summary: "",
  tags: "",
};

interface ResourceEditorProps {
  initialValue?: ResourceEditorValue;
  title: string;
  description: string;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (value: ResourceEditorValue) => Promise<void> | void;
  onCancel?: () => void;
}

export function ResourceEditor({
  initialValue,
  title,
  description,
  submitLabel,
  pending = false,
  onSubmit,
  onCancel,
}: ResourceEditorProps) {
  const [value, setValue] = useState<ResourceEditorValue>(
    initialValue ?? EMPTY_RESOURCE
  );
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  async function handlePdfUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || uploading) return;

    setError("");
    setUploadStatus("");

    try {
      validatePdfUploadMeta({
        name: file.name,
        type: file.type,
        size: file.size,
      });

      setUploading(true);
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/uploads/pdf", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "PDF 上传失败");
      }

      const uploadUrl = payload.url;
      const inferredTitle = file.name.replace(/\.pdf$/i, "").trim();
      setValue((current) => ({
        ...current,
        title: current.title.trim() || inferredTitle,
        url: uploadUrl,
        type: "pdf",
      }));
      setUploadStatus(`已上传：${file.name}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "PDF 上传失败");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      parseResourceDraft(value);
    } catch (validationError) {
      setError(
        validationError instanceof Error ? validationError.message : "资源信息无效"
      );
      return;
    }

    setError("");
    await onSubmit(value);
    if (!initialValue) {
      setValue(EMPTY_RESOURCE);
    }
  }

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-[1.6fr_0.8fr]">
            <Input
              placeholder="资源标题"
              required
              value={value.title}
              onChange={(event) =>
                setValue((current) => ({ ...current, title: event.target.value }))
              }
            />
            <ResourceTypeSelect
              value={value.type}
              onChange={(type) => setValue((current) => ({ ...current, type }))}
            />
          </div>

          <div className="rounded-lg border border-dashed p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="inline-flex items-center gap-2 text-sm font-medium">
                  <FileUpIcon className="size-4" />
                  上传 PDF
                </p>
                <p className="text-xs text-muted-foreground">
                  最大 20MB。上传后会自动填入链接并切到 PDF 类型。
                </p>
              </div>
              <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition hover:bg-muted">
                {uploading ? "上传中..." : "选择 PDF"}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={uploading || pending}
                  onChange={handlePdfUpload}
                />
              </label>
            </div>
            {uploadStatus ? (
              <p className="mt-2 text-xs text-muted-foreground">{uploadStatus}</p>
            ) : null}
          </div>

          <Input
            placeholder="https://..."
            type="url"
            required
            value={value.url}
            onChange={(event) =>
              setValue((current) => ({ ...current, url: event.target.value }))
            }
          />

          <Textarea
            placeholder="写一段简短摘要，说明它为什么值得看。"
            required
            rows={4}
            value={value.summary}
            onChange={(event) =>
              setValue((current) => ({
                ...current,
                summary: event.target.value,
              }))
            }
          />

          <Input
            placeholder="标签，用英文逗号分隔"
            value={value.tags}
            onChange={(event) =>
              setValue((current) => ({ ...current, tags: event.target.value }))
            }
          />

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "保存中..." : submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                取消
              </Button>
            )}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
