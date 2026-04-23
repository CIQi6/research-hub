import { auth } from "@/lib/auth";
import { deleteResourceComment } from "@/lib/resource-service.ts";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { commentId } = await params;
    await deleteResourceComment(commentId, session.user);
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    let status = 400;
    if (message === "Forbidden") status = 403;
    if (message === "Comment not found") status = 404;
    return Response.json({ error: message }, { status });
  }
}
