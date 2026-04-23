import {
  RESOURCE_TYPE_OPTIONS,
  isResourceType,
  type ResourceType,
} from "./resource-types.ts";

interface ResourceDraftInput {
  title: string;
  url: string;
  type: string;
  summary: string;
  tags: string;
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

export function parseResourceDraft(input: ResourceDraftInput): ParsedResourceDraft {
  const title = input.title.trim();
  const url = input.url.trim();
  const summary = input.summary.trim();

  if (!isResourceType(input.type)) {
    throw new Error("Unsupported resource type");
  }

  return {
    title,
    url,
    type: input.type,
    summary,
    tags: normalizeTags(input.tags),
  };
}

export { RESOURCE_TYPE_OPTIONS };
