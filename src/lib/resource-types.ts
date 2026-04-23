export const RESOURCE_TYPE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "web", label: "网页" },
  { value: "audio", label: "音频" },
  { value: "video", label: "视频" },
  { value: "ebook", label: "电子书" },
] as const;

export type ResourceType = (typeof RESOURCE_TYPE_OPTIONS)[number]["value"];

const RESOURCE_TYPE_SET = new Set<ResourceType>(
  RESOURCE_TYPE_OPTIONS.map((option) => option.value)
);

export function isResourceType(value: string): value is ResourceType {
  return RESOURCE_TYPE_SET.has(value as ResourceType);
}
