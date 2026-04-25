"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  ArticleSummary,
  MemberSummary,
  ResourceSummary,
} from "@/lib/resource-types.ts";
import { ArticleCard } from "@/components/article-card";
import { ResourceCard } from "@/components/resource-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Comments } from "@/components/comments";

type MemberTab = "resources" | "articles" | "comments";

const MEMBER_TABS: Array<{ value: MemberTab; label: string }> = [
  { value: "resources", label: "资源" },
  { value: "articles", label: "文章" },
  { value: "comments", label: "留言" },
];

export function MemberDetail({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MemberTab>("resources");
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`/api/members/${memberId}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/members/${memberId}/resources`).then((r) =>
        r.ok ? r.json() : []
      ),
      fetch(`/api/articles?author_github_id=${memberId}`).then((r) =>
        r.ok ? r.json() : []
      ),
    ]).then(([memberData, resourceData, articleData]) => {
      setMember(memberData);
      setResources(Array.isArray(resourceData) ? resourceData : []);
      setArticles(Array.isArray(articleData) ? articleData : []);
      setLoading(false);
    });
  }, [memberId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-muted-foreground">
        正在加载...
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">没有找到这个成员。</p>
        <Link href="/" className="mt-2 inline-block text-sm underline">
          返回资源中心
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; 返回资源中心
      </Link>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">
                {member.github_username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {member.github_username}
              </h1>
              {member.field ? (
                <Badge variant="secondary" className="mt-1">
                  {member.field}
                </Badge>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  还没填写研究方向
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                加入于{" "}
                {member.created_at
                  ? new Date(member.created_at).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "最近"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{resources.length} 条资源</Badge>
            <Badge variant="outline">{articles.length} 篇文章</Badge>
            <Badge variant="outline">{commentCount} 条留言</Badge>
          </div>
        </div>
      </div>

      <div
        className="flex rounded-lg border bg-background p-1"
        role="tablist"
        aria-label="成员内容"
      >
        {MEMBER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm transition ${
              activeTab === tab.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "resources" ? (
        resources.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            这个成员还没有发布资源。
          </div>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} showOwner={false} />
            ))}
          </div>
        )
      ) : null}

      {activeTab === "articles" ? (
        articles.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            这个成员还没有发布文章。
          </div>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )
      ) : null}

      {activeTab === "comments" ? (
        <>
          <Separator />
          <Comments
            targetGithubId={member.github_id}
            onCountChange={setCommentCount}
          />
        </>
      ) : null}

      {activeTab !== "comments" ? (
        <div className="hidden">
          <Comments
            targetGithubId={member.github_id}
            onCountChange={setCommentCount}
          />
        </div>
      ) : null}
    </div>
  );
}
