"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResourceCardProps {
  resource: ResourceSummary;
  showOwner?: boolean;
}

export function ResourceCard({
  resource,
  showOwner = true,
}: ResourceCardProps) {
  const domain = getResourceDomain(resource.url);
  const title = getResourceTitle(resource.title);
  const summary = getResourceSummary(resource.summary);
  const canOpenOriginal = isExternalResourceUrl(resource.url);

  return (
    <article className="group overflow-hidden rounded-xl border bg-card text-card-foreground transition hover:border-foreground/25 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 flex-wrap gap-2">
          <Badge variant="secondary">{getResourceTypeLabel(resource.type)}</Badge>
          {resource.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>
        {canOpenOriginal ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`打开原链接：${title}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5"
            )}
          >
            <ExternalLinkIcon />
            原链接
          </a>
        ) : (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none gap-1.5 opacity-50"
            )}
          >
            缺少链接
          </span>
        )}
      </div>

      <Link
        href={`/resource/${resource.id}`}
        className="block space-y-3 px-4 py-3 outline-none transition focus-visible:bg-muted/60"
      >
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold leading-snug tracking-tight group-hover:underline">
            {title}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {showOwner ? <span>作者 {resource.owner.github_username}</span> : null}
          <span className="max-w-full truncate">{domain}</span>
        </div>
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{formatResourceDate(resource.updated_at)}</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquareIcon className="size-3.5" />
            {resource.comment_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookmarkIcon className="size-3.5" />
            {resource.bookmark_count}
          </span>
        </div>
        <Link
          href={`/resource/${resource.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
        >
          详情
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
