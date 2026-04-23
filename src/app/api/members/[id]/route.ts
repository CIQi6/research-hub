import { getSupabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("members")
    .select("*")
    .eq("github_id", id)
    .single();

  if (error) {
    return Response.json({ error: "Member not found" }, { status: 404 });
  }

  return Response.json(data);
}
