import { auth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("members")
    .select("*")
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
  const { field, resources } = body;

  const { data, error } = await getSupabase()
    .from("members")
    .upsert(
      {
        github_id: session.user.github_id,
        github_username: session.user.github_username,
        avatar_url: session.user.avatar_url,
        field: field || "",
        resources: resources || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "github_id" }
    )
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
