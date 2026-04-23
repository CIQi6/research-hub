import { auth } from "@/lib/auth";
import { listBookmarks } from "@/lib/resource-service.ts";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookmarks = await listBookmarks(session.user);
    return Response.json(bookmarks);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
