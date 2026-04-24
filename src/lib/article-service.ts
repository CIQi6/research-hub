import { parseArticleDraft, type ArticleDraftPayload } from "@/lib/article-form.ts";
import { getSupabase } from "@/lib/supabase";
import type { ArticleSummary, MemberSummary } from "@/lib/resource-types.ts";

interface SessionUser {
  github_id: number;
  github_username: string;
  avatar_url: string;
}

interface ArticleFilters {
  authorGithubId?: number;
  limit?: number;
}

async function ensureMemberFromSession(user: SessionUser) {
  const { error } = await getSupabase().from("members").upsert(
    {
      github_id: user.github_id,
      github_username: user.github_username,
      avatar_url: user.avatar_url,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "github_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

function mapAuthor(author: Partial<MemberSummary> | null | undefined): MemberSummary {
  return {
    github_id: author?.github_id ?? 0,
    github_username: author?.github_username ?? "unknown",
    avatar_url: author?.avatar_url ?? null,
    field: author?.field ?? "",
    created_at: author?.created_at,
    updated_at: author?.updated_at,
  };
}

function mapArticleRow(row: Record<string, unknown>): ArticleSummary {
  return {
    id: row.id as string,
    title: row.title as string,
    summary: row.summary as string,
    content: row.content as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: mapAuthor(row.author as Partial<MemberSummary> | null | undefined),
  };
}

export async function listArticles(filters: ArticleFilters = {}) {
  let query = getSupabase()
    .from("articles")
    .select(
      `
      id,
      author_github_id,
      title,
      summary,
      content,
      created_at,
      updated_at,
      author:members!articles_author_github_id_fkey(
        github_id,
        github_username,
        avatar_url,
        field,
        created_at,
        updated_at
      )
    `
    )
    .order("updated_at", { ascending: false });

  if (filters.authorGithubId) {
    query = query.eq("author_github_id", filters.authorGithubId);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapArticleRow);
}

export async function getArticleById(articleId: string) {
  const { data, error } = await getSupabase()
    .from("articles")
    .select(
      `
      id,
      author_github_id,
      title,
      summary,
      content,
      created_at,
      updated_at,
      author:members!articles_author_github_id_fkey(
        github_id,
        github_username,
        avatar_url,
        field,
        created_at,
        updated_at
      )
    `
    )
    .eq("id", articleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapArticleRow(data as Record<string, unknown>) : null;
}

export async function createArticle(input: ArticleDraftPayload, user: SessionUser) {
  const draft = parseArticleDraft(input);
  await ensureMemberFromSession(user);

  const { data, error } = await getSupabase()
    .from("articles")
    .insert({
      author_github_id: user.github_id,
      title: draft.title,
      summary: draft.summary,
      content: draft.content,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return getArticleById(data.id as string);
}

export async function updateArticle(
  articleId: string,
  input: ArticleDraftPayload,
  user: SessionUser
) {
  const draft = parseArticleDraft(input);
  const { data: owner, error: ownerError } = await getSupabase()
    .from("articles")
    .select("author_github_id")
    .eq("id", articleId)
    .maybeSingle();

  if (ownerError) {
    throw new Error(ownerError.message);
  }

  if (!owner) {
    throw new Error("Article not found");
  }

  if ((owner.author_github_id as number) !== user.github_id) {
    throw new Error("Forbidden");
  }

  const { error } = await getSupabase()
    .from("articles")
    .update({
      title: draft.title,
      summary: draft.summary,
      content: draft.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) {
    throw new Error(error.message);
  }

  return getArticleById(articleId);
}

export async function deleteArticle(articleId: string, user: SessionUser) {
  const { data, error } = await getSupabase()
    .from("articles")
    .select("author_github_id")
    .eq("id", articleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Article not found");
  }

  if ((data.author_github_id as number) !== user.github_id) {
    throw new Error("Forbidden");
  }

  const { error: deleteError } = await getSupabase()
    .from("articles")
    .delete()
    .eq("id", articleId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}
