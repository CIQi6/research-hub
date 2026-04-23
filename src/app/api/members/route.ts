import { auth } from "@/lib/auth";
import { listMembers, upsertMemberProfile } from "@/lib/member-service.ts";

export async function GET() {
  try {
    const members = await listMembers();
    return Response.json(members);
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

  const body = await request.json();
  try {
    const member = await upsertMemberProfile(session.user, body.field ?? "");
    return Response.json(member);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
