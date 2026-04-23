import { MemberDetail } from "./member-detail";

export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MemberDetail memberId={id} />;
}
