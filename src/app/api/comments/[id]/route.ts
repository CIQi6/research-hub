import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Only the author can delete their own comment
  const { data: comment } = await getSupabase()
    .from("comments")
    .select("author_github_id")
    .eq("id", id)
    .single();

  if (!comment) {
    return Response.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.author_github_id !== session.user.github_id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await getSupabase().from("comments").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
