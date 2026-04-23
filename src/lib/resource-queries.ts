import { isResourceType, type ResourceType } from "./resource-types.ts";

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | null | undefined>;

export interface ResourceFilters {
  q?: string;
  type?: ResourceType;
  tag?: string;
  ownerGithubId?: number;
}

function getParam(source: SearchParamsLike, key: string): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }

  return source[key] ?? null;
}

export function buildResourceFilters(searchParams: SearchParamsLike): ResourceFilters {
  const q = getParam(searchParams, "q")?.trim() || undefined;
  const type = getParam(searchParams, "type")?.trim() || undefined;
  const tag = getParam(searchParams, "tag")?.trim().toLowerCase() || undefined;
  const owner = getParam(searchParams, "owner")?.trim() || undefined;
  const ownerGithubId = owner ? Number(owner) : undefined;

  return {
    q,
    type: type && isResourceType(type) ? type : undefined,
    tag,
    ownerGithubId:
      ownerGithubId && Number.isFinite(ownerGithubId)
        ? ownerGithubId
        : undefined,
  };
}
