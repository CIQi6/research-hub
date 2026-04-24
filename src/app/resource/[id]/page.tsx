import { ResourceDetail } from "@/components/resource-detail";
import { auth } from "@/lib/auth";
import { getResourceById } from "@/lib/resource-service.ts";
import type { ResourceSummary } from "@/lib/resource-types.ts";

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let viewerGithubId: number | undefined;
  let initialError = "";
  let resource: ResourceSummary | null = null;

  try {
    const session = await auth();
    viewerGithubId = session?.user?.github_id;
  } catch {
    initialError = "登录配置不可用，已按访客模式加载。";
  }

  try {
    resource = await getResourceById(id, viewerGithubId);
  } catch {
    initialError = "资源加载失败。";
  }

  return (
    <ResourceDetail
      resourceId={id}
      initialResource={resource}
      initialError={initialError}
    />
  );
}
