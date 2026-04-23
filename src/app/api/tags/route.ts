import { listTags } from "@/lib/resource-service.ts";

export async function GET() {
  try {
    const tags = await listTags();
    return Response.json(tags);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
