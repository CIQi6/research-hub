import { MemberList } from "@/components/member-list";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Members</h1>
        <p className="mt-1 text-muted-foreground">
          Browse research interests and shared resources from our community.
        </p>
      </div>
      <MemberList />
    </div>
  );
}
