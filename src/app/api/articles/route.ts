import { auth } from "@/lib/auth";
import { createArticle, listArticles } from "@/lib/article-service.ts";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authorParam = searchParams.get("author_github_id");
    const limitParam = searchParams.get("limit");
    const authorGithubId = authorParam ? Number(authorParam) : undefined;
    const limit = limitParam ? Number(limitParam) : undefined;

    if (authorParam && !Number.isFinite(authorGithubId)) {
      return Response.json({ error: "Invalid author_github_id" }, { status: 400 });
    }

    if (limitParam && (!Number.isFinite(limit) || Number(limit) < 1)) {
      return Response.json({ error: "Invalid limit" }, { status: 400 });
    }

    const articles = await listArticles({
      authorGithubId,
      limit,
    });
    return Response.json(articles);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const article = await createArticle(body, session.user);
    return Response.json(article, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
