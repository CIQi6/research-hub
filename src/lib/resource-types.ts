export const RESOURCE_TYPE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "web", label: "网页" },
  { value: "audio", label: "音频" },
  { value: "video", label: "视频" },
  { value: "ebook", label: "电子书" },
] as const;

export type ResourceType = (typeof RESOURCE_TYPE_OPTIONS)[number]["value"];

export interface MemberSummary {
  github_id: number;
  github_username: string;
  avatar_url: string | null;
  field: string;
  created_at?: string;
  updated_at?: string;
  resource_count?: number;
}

export interface ResourceTag {
  id: string;
  slug: string;
  name: string;
}

export interface ResourceSummary {
  id: string;
  title: string;
  url: string;
  type: ResourceType;
  summary: string;
  created_at: string;
  updated_at: string;
  owner: MemberSummary;
  tags: ResourceTag[];
  comment_count: number;
  bookmark_count: number;
  is_bookmarked: boolean;
}

export interface ResourceComment {
  id: string;
  resource_id: string;
  parent_comment_id: string | null;
  author_github_id: number;
  author_username: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

export interface ArticleSummary {
  id: string;
  author: MemberSummary;
  title: string;
  summary: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const RESOURCE_TYPE_SET = new Set<ResourceType>(
  RESOURCE_TYPE_OPTIONS.map((option) => option.value)
);

export function isResourceType(value: string): value is ResourceType {
  return RESOURCE_TYPE_SET.has(value as ResourceType);
}

export function formatTimeAgo(dateStr: string, nowMs = Date.now()): string {
  const diff = nowMs - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}
