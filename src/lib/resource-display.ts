import type { ResourceSort } from "@/lib/resource-queries.ts";
import type { ResourceType } from "@/lib/resource-types.ts";

export type ResourceTypeFilter = "all" | ResourceType;

export interface ResourceFilterState {
  q: string;
  type: ResourceTypeFilter;
  tag: string;
  sort?: ResourceSort;
}

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  pdf: "PDF",
  web: "网页",
  audio: "音频",
  video: "视频",
  ebook: "电子书",
};

export function getResourceTypeLabel(type: ResourceType): string {
  return RESOURCE_TYPE_LABELS[type];
}

export function isExternalResourceUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getResourceDomain(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "未知来源";
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return trimmed;
  }
}

export function getResourceTitle(title: string): string {
  return title.trim() || "未命名资源";
}

export function getResourceSummary(summary: string): string {
  return summary.trim() || "缺少摘要";
}

export function formatResourceDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "未知日期";
  }

  return parsed.toISOString().slice(0, 10);
}

export function hasActiveResourceFilters(filters: ResourceFilterState): boolean {
  return (
    filters.q.trim().length > 0 ||
    filters.type !== "all" ||
    filters.tag !== "all"
  );
}

export function getEmptyResourceMessage(hasFilters: boolean): string {
  return hasFilters ? "没有资源匹配当前筛选。" : "还没有资源，先发布第一条。";
}
