import { auth } from "@/lib/auth";
import { listResources } from "@/lib/resource-service.ts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const ownerGithubId = Number(id);

    if (!Number.isFinite(ownerGithubId)) {
      return Response.json({ error: "Invalid member id" }, { status: 400 });
    }

    const resources = await listResources(
      { ownerGithubId, sort: "latest" },
      session?.user?.github_id
    );
    return Response.json(resources);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
