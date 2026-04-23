import { getMemberByGithubId } from "@/lib/member-service.ts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const githubId = Number(id);
    if (!Number.isFinite(githubId)) {
      return Response.json({ error: "Invalid member id" }, { status: 400 });
    }

    const member = await getMemberByGithubId(githubId);
    if (!member) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    return Response.json(member);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
