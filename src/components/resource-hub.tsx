"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Code2Icon, PenLineIcon, SearchIcon, XIcon } from "lucide-react";
import type {
  ArticleSummary,
  MemberSummary,
  ResourceSummary,
  ResourceTag,
} from "@/lib/resource-types.ts";
import { buildResourceQueryString } from "@/lib/resource-queries.ts";
import {
  getEmptyResourceMessage,
  hasActiveResourceFilters,
  type ResourceTypeFilter,
} from "@/lib/resource-display.ts";
import { ArticleCard } from "@/components/article-card";
import { ResourceCard } from "@/components/resource-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS: Array<{ value: ResourceTypeFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "pdf", label: "PDF" },
  { value: "web", label: "网页" },
  { value: "audio", label: "音频" },
  { value: "video", label: "视频" },
  { value: "ebook", label: "电子书" },
];

interface ResourceHubProps {
  initialResources: ResourceSummary[];
  initialTags: ResourceTag[];
  initialMembers: MemberSummary[];
  initialArticles: ArticleSummary[];
  initialError?: string;
}

export function ResourceHub({
  initialResources,
  initialTags,
  initialMembers,
  initialArticles,
  initialError = "",
}: ResourceHubProps) {
  const [resources, setResources] = useState<ResourceSummary[]>(initialResources);
  const [tags] = useState<ResourceTag[]>(initialTags);
  const [members] = useState<MemberSummary[]>(initialMembers);
  const [articles] = useState<ArticleSummary[]>(initialArticles);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<ResourceTypeFilter>("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const hasMounted = useRef(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const controller = new AbortController();
    const query = buildResourceQueryString({
      q: deferredSearch,
      type: selectedType === "all" ? undefined : selectedType,
      tag: selectedTag === "all" ? undefined : selectedTag,
    });

    setLoading(true);
    setError("");

    fetch(`/api/resources${query ? `?${query}` : ""}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Resource request failed");
        }

        return response.json();
      })
      .then((data) => {
        setResources(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return;
        }

        setError("资源列表加载失败，已保留上一次结果。");
        setLoading(false);
      });

    return () => controller.abort();
  }, [deferredSearch, selectedTag, selectedType]);

  const activeFilters = hasActiveResourceFilters({
    q: search,
    type: selectedType,
    tag: selectedTag,
  });

  function resetFilters() {
    setSearch("");
    setSelectedType("all");
    setSelectedTag("all");
  }

  return (
    <div className="space-y-7">
      <section className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            资源中心
          </p>
          <h1 className="max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            发现、筛选、收藏研究资源。
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            资源流优先展示，作者入口保留在同一屏，少跳转，少废话。
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="https://github.com/cat0825/research-hub"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
            >
              <Code2Icon />
              GitHub 项目
            </a>
            <Link href="/knowledge" className={cn(buttonVariants(), "gap-1.5")}>
              <PenLineIcon />
              知识分享区
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-2">
          <div className="rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground">资源</p>
            <p className="font-medium">{resources.length}</p>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground">成员</p>
            <p className="font-medium">{members.length}</p>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground">标签</p>
            <p className="font-medium">{tags.length}</p>
          </div>
          <div className="rounded-lg border px-3 py-2">
            <p className="text-xs text-muted-foreground">文章</p>
            <p className="font-medium">{articles.length}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-3">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索标题或摘要"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              aria-label="搜索资源"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={selectedType === option.value}
                onClick={() => setSelectedType(option.value)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selectedType === option.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={selectedTag === "all"}
            onClick={() => setSelectedTag("all")}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              selectedTag === "all"
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            全部标签
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              aria-pressed={selectedTag === tag.slug}
              onClick={() => setSelectedTag(tag.slug)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                selectedTag === tag.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {tag.name}
            </button>
          ))}
          {activeFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-3" />
              清空
            </button>
          )}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">最新资源</h2>
              <p className="text-sm text-muted-foreground">
                {loading ? "正在更新..." : `${resources.length} 条`}
              </p>
            </div>
          </div>

          {loading && resources.length === 0 ? (
            <div className="grid gap-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-xl border bg-muted/40"
                />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              {getEmptyResourceMessage(activeFilters)}
            </div>
          ) : (
            <div className={`grid gap-4 ${loading ? "opacity-70" : ""}`}>
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="border">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">知识分享</CardTitle>
                <Link
                  href="/knowledge"
                  className="text-xs font-medium underline-offset-4 hover:underline"
                >
                  全部文章
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {articles.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  还没有文章。
                </p>
              ) : (
                articles.slice(0, 4).map((article) => (
                  <ArticleCard key={article.id} article={article} compact />
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader>
              <CardTitle className="text-xl">活跃成员</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  还没有成员。
                </p>
              ) : (
                members.slice(0, 8).map((member) => (
                  <Link
                    key={member.github_id}
                    href={`/member/${member.github_id}`}
                    className="flex items-start gap-3 rounded-xl border p-3 transition hover:bg-muted/50"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={member.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {member.github_username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{member.github_username}</p>
                        <Badge variant="outline">
                          {member.resource_count ?? 0} 条
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {member.field || "还没填写研究方向"}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
