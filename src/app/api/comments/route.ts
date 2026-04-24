import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("target_github_id");

  if (!targetId) {
    return Response.json({ error: "target_github_id is required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("comments")
    .select("*")
    .eq("target_github_id", targetId)
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { target_github_id, content, parent_comment_id } = body;

  if (!target_github_id || !content?.trim()) {
    return Response.json({ error: "target_github_id and content are required" }, { status: 400 });
  }

  if (typeof parent_comment_id === "string" && parent_comment_id) {
    const { data: parent, error: parentError } = await getSupabase()
      .from("comments")
      .select("id")
      .eq("id", parent_comment_id)
      .eq("target_github_id", target_github_id)
      .maybeSingle();

    if (parentError) {
      return Response.json({ error: parentError.message }, { status: 500 });
    }

    if (!parent) {
      return Response.json({ error: "Parent comment not found" }, { status: 404 });
    }
  }

  const { data, error } = await getSupabase()
    .from("comments")
    .insert({
      target_github_id,
      ...(typeof parent_comment_id === "string" && parent_comment_id
        ? { parent_comment_id }
        : {}),
      author_github_id: session.user.github_id,
      author_username: session.user.github_username,
      author_avatar: session.user.avatar_url,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
