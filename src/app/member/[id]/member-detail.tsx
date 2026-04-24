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

export function MemberDetail({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

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
        &larr; 返回
      </Link>

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
          {member.field && (
            <Badge variant="secondary" className="mt-1">
              {member.field}
            </Badge>
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

      {resources.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            已发布资源
          </h2>
          <div className="grid gap-4">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} showOwner={false} />
            ))}
          </div>
        </div>
      )}

      {articles.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            知识分享
          </h2>
          <div className="grid gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      <Separator />

      <Comments targetGithubId={member.github_id} />
    </div>
  );
}
