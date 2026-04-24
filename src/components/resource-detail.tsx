"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BookmarkIcon,
  ExternalLinkIcon,
  MessageSquareIcon,
} from "lucide-react";
import type { ResourceSummary } from "@/lib/resource-types.ts";
import {
  formatResourceDate,
  getResourceDomain,
  getResourceSummary,
  getResourceTitle,
  getResourceTypeLabel,
  isExternalResourceUrl,
} from "@/lib/resource-display.ts";
import { BookmarkButton } from "@/components/bookmark-button";
import { ResourceComments } from "@/components/resource-comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ResourceDetailProps {
  resourceId: string;
  initialResource?: ResourceSummary | null;
  initialError?: string;
}

export function ResourceDetail({
  resourceId,
  initialResource,
  initialError = "",
}: ResourceDetailProps) {
  const [resource, setResource] = useState<ResourceSummary | null>(
    initialResource ?? null
  );
  const [loading, setLoading] = useState(initialResource === undefined && !initialError);
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (initialResource !== undefined || initialError) {
      return;
    }

    fetch(`/api/resources/${resourceId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Resource request failed");
        }

        return response.json();
      })
      .then((data) => {
        setResource(data);
        setLoading(false);
      })
      .catch(() => {
        setError("资源加载失败。");
        setLoading(false);
      });
  }, [initialError, initialResource, resourceId]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">正在加载资源...</div>;
  }

  if (!resource) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">
          {error || "没有找到这条资源。"}
        </p>
        <Link href="/" className="mt-3 inline-block text-sm underline">
          返回资源中心
        </Link>
      </div>
    );
  }

  const domain = getResourceDomain(resource.url);
  const title = getResourceTitle(resource.title);
  const summary = getResourceSummary(resource.summary);
  const canOpenOriginal = isExternalResourceUrl(resource.url);

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        返回资源中心
      </Link>

      <article className="space-y-6 rounded-xl border bg-card p-4 sm:p-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{getResourceTypeLabel(resource.type)}</Badge>
              {resource.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <BookmarkButton
                resourceId={resource.id}
                initialBookmarked={resource.is_bookmarked}
              />
              {canOpenOriginal ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants(), "gap-1.5")}
                >
                  <ExternalLinkIcon />
                  打开原链接
                </a>
              ) : (
                <span
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "pointer-events-none gap-1.5 opacity-50"
                  )}
                >
                  缺少原链接
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {summary}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border px-3 py-2">
              <p className="text-xs text-muted-foreground">来源</p>
              <p className="truncate text-sm font-medium">{domain}</p>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <p className="text-xs text-muted-foreground">更新</p>
              <p className="text-sm font-medium">
                {formatResourceDate(resource.updated_at)}
              </p>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <p className="text-xs text-muted-foreground">讨论</p>
              <p className="inline-flex items-center gap-1 text-sm font-medium">
                <MessageSquareIcon className="size-3.5" />
                {resource.comment_count}
              </p>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <p className="text-xs text-muted-foreground">收藏</p>
              <p className="inline-flex items-center gap-1 text-sm font-medium">
                <BookmarkIcon className="size-3.5" />
                {resource.bookmark_count}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.8fr]">
          <section className="space-y-4">
            <div className="rounded-xl border bg-muted/30 p-4">
              <h2 className="text-sm font-medium">资源信息</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">发布时间</dt>
                  <dd className="font-medium">
                    {formatResourceDate(resource.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">资源类型</dt>
                  <dd className="font-medium">{getResourceTypeLabel(resource.type)}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">原始链接</dt>
                  <dd className="break-all font-medium">
                    {resource.url.trim() || "缺少链接"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-dashed p-4">
              <p className="text-sm font-medium">相关推荐</p>
              <p className="mt-1 text-sm text-muted-foreground">
                暂无相关推荐。
              </p>
            </div>
          </section>

          <aside className="space-y-3 rounded-xl border p-4">
            <p className="text-sm font-medium">作者</p>
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={resource.owner.avatar_url ?? undefined} />
                <AvatarFallback>
                  {resource.owner.github_username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <Link
                  href={`/member/${resource.owner.github_id}`}
                  className="font-medium hover:underline"
                >
                  {resource.owner.github_username}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {resource.owner.field || "还没填写研究方向"}
                </p>
                <Link
                  href={`/member/${resource.owner.github_id}`}
                  className="inline-block text-xs font-medium text-foreground underline-offset-4 hover:underline"
                >
                  查看作者资源
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </article>

      <Separator />

      <ResourceComments resourceId={resource.id} />
    </div>
  );
}
