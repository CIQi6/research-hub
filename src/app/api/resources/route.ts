import { auth } from "@/lib/auth";
import { buildResourceFilters } from "@/lib/resource-queries.ts";
import { createResource, listResources } from "@/lib/resource-service.ts";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const filters = buildResourceFilters(new URL(request.url).searchParams);
    const resources = await listResources(filters, session?.user?.github_id);
    return Response.json(resources);
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
    const resource = await createResource(body, session.user);
    return Response.json(resource, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
