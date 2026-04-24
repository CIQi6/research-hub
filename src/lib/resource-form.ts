import {
  RESOURCE_TYPE_OPTIONS,
  isResourceType,
  type ResourceType,
} from "./resource-types.ts";

interface ResourceDraftInput {
  title?: unknown;
  url?: unknown;
  type?: unknown;
  summary?: unknown;
  tags?: unknown;
}

interface ParsedResourceDraft {
  title: string;
  url: string;
  type: ResourceType;
  summary: string;
  tags: string[];
}

function normalizeTags(input: string): string[] {
  return [...new Set(
    input
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
  )];
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function assertRequired(value: string, message: string): void {
  if (!value) {
    throw new Error(message);
  }
}

function assertHttpUrl(value: string): void {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
  } catch {
    throw new Error("资源链接必须是有效的 http(s) URL");
  }
}

export function parseResourceDraft(input: ResourceDraftInput): ParsedResourceDraft {
  const title = readString(input.title);
  const url = readString(input.url);
  const summary = readString(input.summary);
  const type = readString(input.type);
  const tags = readString(input.tags);

  assertRequired(title, "资源标题不能为空");
  assertRequired(url, "资源链接不能为空");
  assertRequired(summary, "资源摘要不能为空");
  assertHttpUrl(url);

  if (!isResourceType(type)) {
    throw new Error("不支持的资源类型");
  }

  return {
    title,
    url,
    type,
    summary,
    tags: normalizeTags(tags),
  };
}

export { RESOURCE_TYPE_OPTIONS };
