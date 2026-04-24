import Link from "next/link";
import { Code2Icon, PenLineIcon } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { buttonVariants } from "@/components/ui/button";
import { listArticles } from "@/lib/article-service.ts";
import type { ArticleSummary } from "@/lib/resource-types.ts";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  let articles: ArticleSummary[] = [];
  let error = "";

  try {
    articles = await listArticles();
  } catch {
    error = "知识分享区加载失败，请确认数据库已执行最新 schema。";
  }

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            知识分享
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">文章与经验沉淀</h1>
          <p className="max-w-2xl text-muted-foreground">
            这里放研究笔记、资源使用经验、论文阅读记录和项目复盘。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile" className={cn(buttonVariants(), "gap-1.5")}>
            <PenLineIcon />
            写文章
          </Link>
          <a
            href="https://github.com/cat0825/research-hub"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}
          >
            <Code2Icon />
            GitHub 项目
          </a>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {articles.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          还没有文章。
        </div>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
