import { auth } from "@/lib/auth";
import { listRelatedResources } from "@/lib/resource-service.ts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const related = await listRelatedResources(id, session?.user?.github_id);
    return Response.json(related);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
