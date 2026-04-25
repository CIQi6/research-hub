# Interaction Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the resource center browsing flow stable, shareable, and coherent from homepage filters through resource details, guest gates, and member pages.

**Architecture:** Keep the existing Next.js App Router, React client components, NextAuth, Supabase service layer, and node:test test style. Add small pure helpers for URL/filter state, extend the resource service for sorting and related resources, then refactor UI components without introducing new state libraries or schema changes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, NextAuth v5 beta, Supabase JS, Tailwind CSS 4, node:test, lucide-react, shadcn-style local UI primitives.

---

## File Structure

- `src/lib/resource-queries.ts`: Owns resource list query parsing, sort validation, and URL query serialization.
- `src/lib/resource-queries.test.ts`: Unit coverage for filter and sort parsing.
- `src/lib/resource-display.ts`: Owns display-only helpers and active filter checks used by UI.
- `src/lib/resource-display.test.ts`: Unit coverage for query string and active filter display helpers.
- `src/lib/resource-service.ts`: Owns Supabase resource list/detail/related/bookmark/comment operations.
- `src/lib/resource-service.test.ts`: Pure helper tests for resource sorting behavior; do not mock Supabase here.
- `src/app/api/resources/route.ts`: Reads parsed filters and returns sorted resources.
- `src/app/api/resources/[id]/related/route.ts`: New route for same-author and same-tag related resources.
- `src/components/resource-hub.tsx`: Homepage query-state, filters, sort tabs, list loading state, and stable stats.
- `src/components/resource-card.tsx`: Resource card interaction hierarchy.
- `src/components/resource-detail.tsx`: Detail layout, related resources loading, and comment section placement.
- `src/components/resource-comments.tsx`: Guest comment CTA and login failure surface.
- `src/components/login-wall.tsx`: Shared guest gate for `/profile` and `/bookmarks`.
- `src/app/profile/page.tsx`: Keeps routing thin; renders `EditProfile`.
- `src/components/edit-profile.tsx`: Replaces guest auto-redirect with login wall.
- `src/app/bookmarks/page.tsx`: Replaces guest text-only state with login wall.
- `src/app/member/[id]/member-detail.tsx`: Member dashboard header and tabs.
- `src/components/comments.tsx`: Allow member page to pass loaded comment count upward.

Do not restructure the whole app. The existing files are not perfect, but a broad refactor here would be vandalism dressed as architecture.

## Task 1: Query State And Sort Helpers

**Files:**
- Modify: `src/lib/resource-queries.ts`
- Modify: `src/lib/resource-queries.test.ts`
- Modify: `src/lib/resource-display.ts`
- Modify: `src/lib/resource-display.test.ts`

- [ ] **Step 1: Write the failing query tests**

Replace `src/lib/resource-queries.test.ts` with:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResourceFilters,
  buildResourceQueryString,
  normalizeResourceSort,
} from "./resource-queries.ts";

test("buildResourceFilters normalizes resource list query params", () => {
  assert.deepEqual(
    buildResourceFilters({
      q: " transformer ",
      type: "pdf",
      tag: "NLP ",
      owner: "42",
      sort: "discussed",
    }),
    {
      q: "transformer",
      type: "pdf",
      tag: "nlp",
      ownerGithubId: 42,
      sort: "discussed",
    }
  );
});

test("buildResourceFilters falls back from invalid type owner and sort", () => {
  assert.deepEqual(
    buildResourceFilters({
      q: " ",
      type: "zip",
      tag: " ",
      owner: "nope",
      sort: "random",
    }),
    {
      sort: "latest",
    }
  );
});

test("normalizeResourceSort accepts only supported sort values", () => {
  assert.equal(normalizeResourceSort("latest"), "latest");
  assert.equal(normalizeResourceSort("discussed"), "discussed");
  assert.equal(normalizeResourceSort("bookmarked"), "bookmarked");
  assert.equal(normalizeResourceSort("bad"), "latest");
  assert.equal(normalizeResourceSort(null), "latest");
});

test("buildResourceQueryString serializes active filters in stable order", () => {
  assert.equal(
    buildResourceQueryString({
      q: " infra ",
      type: "web",
      tag: "ai-infra",
      sort: "bookmarked",
    }),
    "q=infra&type=web&tag=ai-infra&sort=bookmarked"
  );
});

test("buildResourceQueryString omits default sort and inactive filters", () => {
  assert.equal(
    buildResourceQueryString({
      q: "",
      type: undefined,
      tag: undefined,
      sort: "latest",
    }),
    ""
  );
});
```

- [ ] **Step 2: Run the failing query tests**

Run:

```bash
npm test -- src/lib/resource-queries.test.ts
```

Expected: FAIL because `normalizeResourceSort`, `sort`, and `buildResourceQueryString` do not exist in `resource-queries.ts`.

- [ ] **Step 3: Implement query helper types**

Replace `src/lib/resource-queries.ts` with:

```ts
import { isResourceType, type ResourceType } from "./resource-types.ts";

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | null | undefined>;

export type ResourceSort = "latest" | "discussed" | "bookmarked";

export interface ResourceFilters {
  q?: string;
  type?: ResourceType;
  tag?: string;
  ownerGithubId?: number;
  sort: ResourceSort;
}

function getParam(source: SearchParamsLike, key: string): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }

  return source[key] ?? null;
}

export function normalizeResourceSort(value: string | null | undefined): ResourceSort {
  if (value === "discussed" || value === "bookmarked") {
    return value;
  }

  return "latest";
}

export function buildResourceFilters(searchParams: SearchParamsLike): ResourceFilters {
  const q = getParam(searchParams, "q")?.trim() || undefined;
  const type = getParam(searchParams, "type")?.trim() || undefined;
  const tag = getParam(searchParams, "tag")?.trim().toLowerCase() || undefined;
  const owner = getParam(searchParams, "owner")?.trim() || undefined;
  const ownerGithubId = owner ? Number(owner) : undefined;
  const sort = normalizeResourceSort(getParam(searchParams, "sort"));

  return {
    q,
    type: type && isResourceType(type) ? type : undefined,
    tag,
    ownerGithubId:
      ownerGithubId && Number.isFinite(ownerGithubId)
        ? ownerGithubId
        : undefined,
    sort,
  };
}

export function buildResourceQueryString(filters: {
  q?: string;
  type?: ResourceType;
  tag?: string;
  sort?: ResourceSort;
}): string {
  const params = new URLSearchParams();
  const query = filters.q?.trim();
  const tag = filters.tag?.trim().toLowerCase();
  const sort = normalizeResourceSort(filters.sort);

  if (query) {
    params.set("q", query);
  }

  if (filters.type) {
    params.set("type", filters.type);
  }

  if (tag) {
    params.set("tag", tag);
  }

  if (sort !== "latest") {
    params.set("sort", sort);
  }

  return params.toString();
}
```

- [ ] **Step 4: Move display query string usage to resource-queries**

Modify `src/lib/resource-display.ts`:

```ts
import type { ResourceSort } from "@/lib/resource-queries.ts";
import type { ResourceType } from "@/lib/resource-types.ts";

export type ResourceTypeFilter = "all" | ResourceType;

export interface ResourceFilterState {
  q: string;
  type: ResourceTypeFilter;
  tag: string;
  sort?: ResourceSort;
}
```

Delete the existing `buildResourceQueryString` export from `src/lib/resource-display.ts`. Keep `hasActiveResourceFilters` ignoring `sort`:

```ts
export function hasActiveResourceFilters(filters: ResourceFilterState): boolean {
  return (
    filters.q.trim().length > 0 ||
    filters.type !== "all" ||
    filters.tag !== "all"
  );
}
```

- [ ] **Step 5: Update display tests**

Modify `src/lib/resource-display.test.ts` to remove imports and assertions for `buildResourceQueryString`. Keep the existing tests for labels, domain, date, active filters, and empty messages unchanged.

- [ ] **Step 6: Run helper tests**

Run:

```bash
npm test -- src/lib/resource-queries.test.ts src/lib/resource-display.test.ts
```

Expected: PASS. Node may still print `MODULE_TYPELESS_PACKAGE_JSON`; that warning is already present.

- [ ] **Step 7: Commit**

```bash
git add src/lib/resource-queries.ts src/lib/resource-queries.test.ts src/lib/resource-display.ts src/lib/resource-display.test.ts
git commit -m "test: stabilize resource query state helpers"
```

## Task 2: Sorted Resource Service And Related Payload

**Files:**
- Modify: `src/lib/resource-service.ts`
- Create: `src/lib/resource-service.test.ts`
- Modify: `src/app/api/resources/route.ts`
- Create: `src/app/api/resources/[id]/related/route.ts`

- [ ] **Step 1: Write pure sort tests**

Create `src/lib/resource-service.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { sortResourceSummaries } from "./resource-service.ts";
import type { ResourceSummary } from "./resource-types.ts";

function resource(
  id: string,
  updatedAt: string,
  commentCount: number,
  bookmarkCount: number
): ResourceSummary {
  return {
    id,
    title: id,
    url: `https://example.com/${id}`,
    type: "web",
    summary: id,
    created_at: updatedAt,
    updated_at: updatedAt,
    owner: {
      github_id: 1,
      github_username: "owner",
      avatar_url: null,
      field: "",
    },
    tags: [],
    comment_count: commentCount,
    bookmark_count: bookmarkCount,
    is_bookmarked: false,
  };
}

test("sortResourceSummaries orders latest by updated_at desc", () => {
  assert.deepEqual(
    sortResourceSummaries(
      [
        resource("old", "2026-01-01T00:00:00.000Z", 9, 9),
        resource("new", "2026-02-01T00:00:00.000Z", 0, 0),
      ],
      "latest"
    ).map((item) => item.id),
    ["new", "old"]
  );
});

test("sortResourceSummaries orders discussed by comment count then date", () => {
  assert.deepEqual(
    sortResourceSummaries(
      [
        resource("older-hot", "2026-01-01T00:00:00.000Z", 3, 0),
        resource("newer-hot", "2026-02-01T00:00:00.000Z", 3, 0),
        resource("cold", "2026-03-01T00:00:00.000Z", 1, 0),
      ],
      "discussed"
    ).map((item) => item.id),
    ["newer-hot", "older-hot", "cold"]
  );
});

test("sortResourceSummaries orders bookmarked by bookmark count then date", () => {
  assert.deepEqual(
    sortResourceSummaries(
      [
        resource("saved-old", "2026-01-01T00:00:00.000Z", 0, 5),
        resource("saved-new", "2026-02-01T00:00:00.000Z", 0, 5),
        resource("unsaved", "2026-03-01T00:00:00.000Z", 0, 1),
      ],
      "bookmarked"
    ).map((item) => item.id),
    ["saved-new", "saved-old", "unsaved"]
  );
});
```

- [ ] **Step 2: Run the failing sort tests**

Run:

```bash
npm test -- src/lib/resource-service.test.ts
```

Expected: FAIL because `sortResourceSummaries` is not exported.

- [ ] **Step 3: Add sorting and related service types**

Modify imports in `src/lib/resource-service.ts`:

```ts
import { type ResourceFilters, type ResourceSort } from "@/lib/resource-queries.ts";
```

Add below `mapResourceRow`:

```ts
export interface RelatedResourcesPayload {
  by_owner: ResourceSummary[];
  by_tag: ResourceSummary[];
}

function compareDateDesc(left: ResourceSummary, right: ResourceSummary): number {
  return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
}

export function sortResourceSummaries(
  resources: ResourceSummary[],
  sort: ResourceSort
): ResourceSummary[] {
  const next = [...resources];

  if (sort === "discussed") {
    return next.sort(
      (left, right) =>
        right.comment_count - left.comment_count || compareDateDesc(left, right)
    );
  }

  if (sort === "bookmarked") {
    return next.sort(
      (left, right) =>
        right.bookmark_count - left.bookmark_count || compareDateDesc(left, right)
    );
  }

  return next.sort(compareDateDesc);
}
```

Modify the end of `listResources`:

```ts
  const mapped = rows.map((row) =>
    mapResourceRow(row, tagsByResource, commentCounts, bookmarkCounts, bookmarkedIds)
  );

  return sortResourceSummaries(mapped, filters.sort);
```

Because existing callers pass `{}`, update `listBookmarks`:

```ts
  const resources = await listResources({ sort: "latest" }, user.github_id);
```

- [ ] **Step 4: Add related resources service**

Add this function near `getResourceById` in `src/lib/resource-service.ts`:

```ts
export async function listRelatedResources(
  resourceId: string,
  viewerGithubId?: number
): Promise<RelatedResourcesPayload> {
  const resource = await getResourceById(resourceId, viewerGithubId);
  if (!resource) {
    return { by_owner: [], by_tag: [] };
  }

  const byOwner = (
    await listResources(
      {
        ownerGithubId: resource.owner.github_id,
        sort: "latest",
      },
      viewerGithubId
    )
  )
    .filter((item) => item.id !== resourceId)
    .slice(0, 3);

  const tagSlugs = resource.tags.map((tag) => tag.slug);
  const byTagMap = new Map<string, ResourceSummary>();

  for (const tag of tagSlugs) {
    const resources = await listResources({ tag, sort: "latest" }, viewerGithubId);
    for (const item of resources) {
      if (item.id !== resourceId && !byTagMap.has(item.id)) {
        byTagMap.set(item.id, item);
      }
    }
  }

  return {
    by_owner: byOwner,
    by_tag: [...byTagMap.values()].slice(0, 3),
  };
}
```

- [ ] **Step 5: Add related route**

Create `src/app/api/resources/[id]/related/route.ts`:

```ts
import { auth } from "@/lib/auth";
import { listRelatedResources } from "@/lib/resource-service.ts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    const related = await listRelatedResources(id, session?.user?.github_id);
    return Response.json(related);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Update homepage server call**

Modify `src/app/page.tsx`:

```ts
    listResources({ sort: "latest" }, viewerGithubId),
```

- [ ] **Step 7: Run service and build checks**

Run:

```bash
npm test -- src/lib/resource-service.test.ts src/lib/resource-queries.test.ts
npm run lint
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/resource-service.ts src/lib/resource-service.test.ts src/app/api/resources/route.ts 'src/app/api/resources/[id]/related/route.ts' src/app/page.tsx
git commit -m "feat: add sorted and related resource queries"
```

## Task 3: Homepage URL State And Stable Stats

**Files:**
- Modify: `src/components/resource-hub.tsx`

- [ ] **Step 1: Update imports**

Modify `src/components/resource-hub.tsx` imports:

```ts
import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Code2Icon, PenLineIcon, SearchIcon, XIcon } from "lucide-react";
import {
  buildResourceQueryString,
  normalizeResourceSort,
  type ResourceSort,
} from "@/lib/resource-queries.ts";
```

Remove `buildResourceQueryString` from the `@/lib/resource-display.ts` import.

- [ ] **Step 2: Add sort options and initial stat constants**

Below `FILTER_OPTIONS`, add:

```ts
const SORT_OPTIONS: Array<{ value: ResourceSort; label: string }> = [
  { value: "latest", label: "最新" },
  { value: "discussed", label: "有讨论" },
  { value: "bookmarked", label: "收藏多" },
];
```

Inside `ResourceHub`, before state declarations, add:

```ts
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const initialStats = useMemo(
    () => ({
      resources: initialResources.length,
      members: initialMembers.length,
      tags: initialTags.length,
      articles: initialArticles.length,
    }),
    [initialArticles.length, initialMembers.length, initialResources.length, initialTags.length]
  );
```

- [ ] **Step 3: Initialize controls from URL**

Replace the `search`, `selectedType`, and `selectedTag` state declarations with:

```ts
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [selectedType, setSelectedType] = useState<ResourceTypeFilter>(() => {
    const type = searchParams.get("type");
    return FILTER_OPTIONS.some((option) => option.value === type)
      ? (type as ResourceTypeFilter)
      : "all";
  });
  const [selectedTag, setSelectedTag] = useState(() => searchParams.get("tag") ?? "all");
  const [selectedSort, setSelectedSort] = useState<ResourceSort>(() =>
    normalizeResourceSort(searchParams.get("sort"))
  );
```

- [ ] **Step 4: Add URL sync helpers**

Inside `ResourceHub`, before `useEffect`, add:

```ts
  function writeQuery(next: {
    q?: string;
    type?: ResourceTypeFilter;
    tag?: string;
    sort?: ResourceSort;
    replace?: boolean;
  }) {
    const nextType = next.type ?? selectedType;
    const nextTag = next.tag ?? selectedTag;
    const query = buildResourceQueryString({
      q: next.q ?? search,
      type: nextType === "all" ? undefined : nextType,
      tag: nextTag === "all" ? undefined : nextTag,
      sort: next.sort ?? selectedSort,
    });
    const href = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      if (next.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    });
  }
```

- [ ] **Step 5: Sync controls when browser history changes**

Add this effect after `deferredSearch`:

```ts
  useEffect(() => {
    const nextType = searchParams.get("type");
    setSearch(searchParams.get("q") ?? "");
    setSelectedType(
      FILTER_OPTIONS.some((option) => option.value === nextType)
        ? (nextType as ResourceTypeFilter)
        : "all"
    );
    setSelectedTag(searchParams.get("tag") ?? "all");
    setSelectedSort(normalizeResourceSort(searchParams.get("sort")));
  }, [searchParams]);
```

- [ ] **Step 6: Update fetch effect**

In the resource fetch effect, build query with `selectedSort`:

```ts
    const query = buildResourceQueryString({
      q: deferredSearch,
      type: selectedType === "all" ? undefined : selectedType,
      tag: selectedTag === "all" ? undefined : selectedTag,
      sort: selectedSort,
    });
```

Update the dependency list:

```ts
  }, [deferredSearch, selectedSort, selectedTag, selectedType]);
```

- [ ] **Step 7: Wire control handlers**

Change the search input `onChange`:

```tsx
              onChange={(event) => {
                const nextSearch = event.target.value;
                setSearch(nextSearch);
                writeQuery({ q: nextSearch, replace: true });
              }}
```

Change type button `onClick`:

```tsx
                onClick={() => {
                  setSelectedType(option.value);
                  writeQuery({ type: option.value });
                }}
```

Change tag button `onClick`:

```tsx
              onClick={() => {
                setSelectedTag(tag.slug);
                writeQuery({ tag: tag.slug });
              }}
```

Change all-tags button:

```tsx
            onClick={() => {
              setSelectedTag("all");
              writeQuery({ tag: "all" });
            }}
```

Change `resetFilters`:

```ts
  function resetFilters() {
    setSearch("");
    setSelectedType("all");
    setSelectedTag("all");
    setSelectedSort("latest");
    startTransition(() => router.push(pathname, { scroll: false }));
  }
```

- [ ] **Step 8: Render stable stats and sort tabs**

Replace statistic values:

```tsx
            <p className="font-medium">{initialStats.resources}</p>
            <p className="font-medium">{initialStats.members}</p>
            <p className="font-medium">{initialStats.tags}</p>
            <p className="font-medium">{initialStats.articles}</p>
```

Replace the resource list heading block with:

```tsx
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">最新资源</h2>
              <p className="text-sm text-muted-foreground">
                {loading || isPending ? "正在更新..." : `${resources.length} 条结果`}
              </p>
            </div>
            <div className="flex rounded-lg border bg-background p-1" role="tablist" aria-label="资源排序">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={selectedSort === option.value}
                  onClick={() => {
                    setSelectedSort(option.value);
                    writeQuery({ sort: option.value });
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    selectedSort === option.value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
```

- [ ] **Step 9: Run checks**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/resource-hub.tsx
git commit -m "feat: sync homepage filters with url"
```

## Task 4: Resource Card Interaction Hierarchy

**Files:**
- Modify: `src/components/resource-card.tsx`

- [ ] **Step 1: Refactor the card markup**

Replace the return body in `ResourceCard` with:

```tsx
  return (
    <article className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground transition hover:border-foreground/25 hover:shadow-sm focus-within:border-foreground/40">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 flex-wrap gap-2">
          <Badge variant="secondary">{getResourceTypeLabel(resource.type)}</Badge>
          {resource.tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>
        {canOpenOriginal ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`打开原链接：${title}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "relative z-10 gap-1.5 px-2.5 sm:px-3"
            )}
          >
            <ExternalLinkIcon />
            <span className="hidden sm:inline">原链接</span>
          </a>
        ) : (
          <span
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "pointer-events-none relative z-10 gap-1.5 px-2.5 opacity-50 sm:px-3"
            )}
          >
            <ExternalLinkIcon />
            <span className="hidden sm:inline">缺少链接</span>
          </span>
        )}
      </div>

      <Link
        href={`/resource/${resource.id}`}
        className="block space-y-3 px-4 py-3 outline-none transition focus-visible:bg-muted/60"
        aria-label={`查看资源详情：${title}`}
      >
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold leading-snug tracking-tight group-hover:underline">
            {title}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {showOwner ? <span>作者 {resource.owner.github_username}</span> : null}
          <span className="max-w-full truncate">{domain}</span>
        </div>
      </Link>

      <div className="flex flex-wrap items-center gap-4 border-t bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <span>{formatResourceDate(resource.updated_at)}</span>
        <span className="inline-flex items-center gap-1">
          <MessageSquareIcon className="size-3.5" />
          {resource.comment_count}
        </span>
        <span className="inline-flex items-center gap-1">
          <BookmarkIcon className="size-3.5" />
          {resource.bookmark_count}
        </span>
      </div>
    </article>
  );
```

Remove `ArrowRightIcon` from the lucide import.

- [ ] **Step 2: Run checks**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/resource-card.tsx
git commit -m "feat: clarify resource card actions"
```

## Task 5: Detail Page Related Resources And Guest CTA

**Files:**
- Modify: `src/components/resource-detail.tsx`
- Modify: `src/components/resource-comments.tsx`

- [ ] **Step 1: Update resource detail imports and state**

In `src/components/resource-detail.tsx`, add:

```ts
import type { RelatedResourcesPayload } from "@/lib/resource-service.ts";
import { ResourceCard } from "@/components/resource-card";
```

Add state after `error`:

```ts
  const [related, setRelated] = useState<RelatedResourcesPayload>({
    by_owner: [],
    by_tag: [],
  });
  const [relatedError, setRelatedError] = useState("");
```

- [ ] **Step 2: Load related resources independently**

Add this effect after the resource loading effect:

```ts
  useEffect(() => {
    if (!resource?.id) {
      return;
    }

    let active = true;

    fetch(`/api/resources/${resource.id}/related`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Related resources request failed");
        }

        return response.json();
      })
      .then((data) => {
        if (!active) return;
        setRelated({
          by_owner: Array.isArray(data?.by_owner) ? data.by_owner : [],
          by_tag: Array.isArray(data?.by_tag) ? data.by_tag : [],
        });
        setRelatedError("");
      })
      .catch(() => {
        if (active) {
          setRelatedError("相关资源加载失败。");
        }
      });

    return () => {
      active = false;
    };
  }, [resource?.id]);
```

- [ ] **Step 3: Replace dead recommendation block**

In `src/components/resource-detail.tsx`, replace the dashed `相关推荐` block with:

```tsx
            {(related.by_owner.length > 0 || related.by_tag.length > 0 || relatedError) && (
              <div className="space-y-4">
                {related.by_owner.length > 0 ? (
                  <section className="space-y-3">
                    <h2 className="text-sm font-medium">同作者更多资源</h2>
                    <div className="grid gap-3">
                      {related.by_owner.map((item) => (
                        <ResourceCard key={item.id} resource={item} showOwner={false} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {related.by_tag.length > 0 ? (
                  <section className="space-y-3">
                    <h2 className="text-sm font-medium">同标签资源</h2>
                    <div className="grid gap-3">
                      {related.by_tag.map((item) => (
                        <ResourceCard key={item.id} resource={item} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {relatedError ? (
                  <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {relatedError}
                  </p>
                ) : null}
              </div>
            )}
```

- [ ] **Step 4: Add guest comment CTA**

In `src/components/resource-comments.tsx`, update imports:

```ts
import { signIn, useSession } from "next-auth/react";
import { MessageSquareIcon } from "lucide-react";
```

Replace the unauthenticated paragraph with:

```tsx
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquareIcon className="size-4" />
            登录后可以参与讨论、回复和收藏资源。
          </p>
          <Button type="button" size="sm" onClick={() => void signIn("github")}>
            GitHub 登录
          </Button>
        </div>
```

- [ ] **Step 5: Run checks**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/resource-detail.tsx src/components/resource-comments.tsx
git commit -m "feat: add resource detail continuation paths"
```

## Task 6: Shared Login Wall For Guest-Only Routes

**Files:**
- Create: `src/components/login-wall.tsx`
- Modify: `src/components/edit-profile.tsx`
- Modify: `src/app/bookmarks/page.tsx`

- [ ] **Step 1: Create LoginWall component**

Create `src/components/login-wall.tsx`:

```tsx
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { LogInIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoginWallProps {
  title: string;
  description: string;
  primaryLabel?: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export function LoginWall({
  title,
  description,
  primaryLabel = "GitHub 登录",
  secondaryLabel,
  secondaryHref,
}: LoginWallProps) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center justify-center py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
        <LogInIcon className="size-5" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => void signIn("github")}>
          {primaryLabel}
        </Button>
        <Button asChild variant="outline">
          <Link href={secondaryHref}>{secondaryLabel}</Link>
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Replace profile redirect with login wall**

In `src/components/edit-profile.tsx`, remove:

```ts
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);
```

Add import:

```ts
import { LoginWall } from "@/components/login-wall";
```

Replace:

```ts
  if (status === "loading" || !loaded) {
```

with:

```ts
  if (status === "loading" || (status === "authenticated" && !loaded)) {
```

Replace:

```ts
  if (!session?.user) return null;
```

with:

```tsx
  if (!session?.user) {
    return (
      <LoginWall
        title="登录后发布资源和文章"
        description="登录后可以管理个人资料、发布研究资源、写文章，并维护你自己的作者页。"
        secondaryLabel="返回资源中心"
        secondaryHref="/"
      />
    );
  }
```

- [ ] **Step 3: Replace bookmarks guest state**

In `src/app/bookmarks/page.tsx`, add:

```ts
import { LoginWall } from "@/components/login-wall";
```

Replace the unauthenticated branch:

```tsx
  if (!session?.user) {
    return (
      <LoginWall
        title="登录后查看收藏"
        description="收藏用于保存之后要继续看的资源，登录后可以在这里快速回到它们。"
        secondaryLabel="浏览资源"
        secondaryHref="/"
      />
    );
  }
```

- [ ] **Step 4: Run checks**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/login-wall.tsx src/components/edit-profile.tsx src/app/bookmarks/page.tsx
git commit -m "feat: add clear guest login gates"
```

## Task 7: Member Dashboard Tabs

**Files:**
- Modify: `src/components/comments.tsx`
- Modify: `src/app/member/[id]/member-detail.tsx`

- [ ] **Step 1: Let Comments report count**

In `src/components/comments.tsx`, change the props:

```ts
interface CommentsProps {
  targetGithubId: number;
  onCountChange?: (count: number) => void;
}

export function Comments({ targetGithubId, onCountChange }: CommentsProps) {
```

After `const threads = buildCommentThreads(comments);`, add:

```ts
  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments.length, onCountChange]);
```

This uses the existing React import because `useEffect` is already imported.

- [ ] **Step 2: Add member tab state**

In `src/app/member/[id]/member-detail.tsx`, add:

```ts
type MemberTab = "resources" | "articles" | "comments";

const MEMBER_TABS: Array<{ value: MemberTab; label: string }> = [
  { value: "resources", label: "资源" },
  { value: "articles", label: "文章" },
  { value: "comments", label: "留言" },
];
```

Inside `MemberDetail`, add state:

```ts
  const [activeTab, setActiveTab] = useState<MemberTab>("resources");
  const [commentCount, setCommentCount] = useState(0);
```

- [ ] **Step 3: Replace member return body after the back link**

Replace the current header/resources/articles/comments markup after the back link with:

```tsx
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">
                {member.github_username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {member.github_username}
              </h1>
              {member.field ? (
                <Badge variant="secondary" className="mt-1">
                  {member.field}
                </Badge>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  还没填写研究方向
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                加入于{" "}
                {member.created_at
                  ? new Date(member.created_at).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "最近"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{resources.length} 条资源</Badge>
            <Badge variant="outline">{articles.length} 篇文章</Badge>
            <Badge variant="outline">{commentCount} 条留言</Badge>
          </div>
        </div>
      </div>

      <div className="flex rounded-lg border bg-background p-1" role="tablist" aria-label="成员内容">
        {MEMBER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-1 rounded-md px-3 py-2 text-sm transition ${
              activeTab === tab.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "resources" ? (
        resources.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            这个成员还没有发布资源。
          </div>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} showOwner={false} />
            ))}
          </div>
        )
      ) : null}

      {activeTab === "articles" ? (
        articles.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            这个成员还没有发布文章。
          </div>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )
      ) : null}

      {activeTab === "comments" ? (
        <>
          <Separator />
          <Comments
            targetGithubId={member.github_id}
            onCountChange={setCommentCount}
          />
        </>
      ) : null}

      {activeTab !== "comments" ? (
        <div className="hidden">
          <Comments
            targetGithubId={member.github_id}
            onCountChange={setCommentCount}
          />
        </div>
      ) : null}
```

Use only one hidden comments block plus the visible comments block. Do not render two visible comment sections.

- [ ] **Step 4: Update back link text**

Change:

```tsx
        &larr; 返回
```

to:

```tsx
        &larr; 返回资源中心
```

- [ ] **Step 5: Run checks**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS. If lint complains about unstable callback identity for `setCommentCount`, keep `setCommentCount` directly; React state setters are stable.

- [ ] **Step 6: Commit**

```bash
git add src/components/comments.tsx 'src/app/member/[id]/member-detail.tsx'
git commit -m "feat: turn member pages into dashboards"
```

## Task 8: Manual Browser Verification

**Files:**
- No source file changes expected unless a verification failure exposes a bug.

- [ ] **Step 1: Start or reuse dev server**

Run:

```bash
npm run dev
```

Expected: server on `http://localhost:3001`.

- [ ] **Step 2: Verify homepage URL state**

Open:

```text
http://localhost:3001/
```

Browser actions:

1. Type `AI` in search.
2. Click `网页`.
3. Click tag `ai infra`.
4. Click `有讨论`.
5. Refresh.

Expected:

- URL contains `q=AI&type=web&tag=ai infra` encoded and `sort=discussed`, or slug-equivalent tag value.
- Controls remain selected after refresh.
- Top stat card resource count does not drop to `0` just because filters are active.
- Resource heading shows result count, not all-time count.

- [ ] **Step 3: Verify card click targets**

Browser actions:

1. Click a card title/body.
2. Return to homepage.
3. Click the `原链接` icon/button.

Expected:

- Card body navigates to `/resource/<id>`.
- Original link opens the external URL and does not navigate the existing app route to detail.

- [ ] **Step 4: Verify resource detail continuation**

Open:

```text
http://localhost:3001/resource/ba559acf-be38-43c0-990c-68d6fd7fb98d
```

Expected:

- No `相关推荐 暂无相关推荐` dead block.
- If same-author resources exist, `同作者更多资源` appears.
- If same-tag resources exist, `同标签资源` appears.
- Guest comment area shows login CTA with a GitHub login button.

- [ ] **Step 5: Verify guest gates**

Open:

```text
http://localhost:3001/profile
http://localhost:3001/bookmarks
```

Expected:

- `/profile` shows `登录后发布资源和文章`.
- `/bookmarks` shows `登录后查看收藏`.
- Neither route auto-redirects to `/`.

- [ ] **Step 6: Verify member dashboard**

Open:

```text
http://localhost:3001/member/97736187
```

Expected:

- Back link reads `返回资源中心`.
- Header shows resource, article, and comment counts.
- Tabs switch between `资源`, `文章`, and `留言`.
- Empty tab states use explicit copy.

- [ ] **Step 7: Commit verification fixes if needed**

If fixes were needed:

```bash
git add <changed-files>
git commit -m "fix: polish interaction verification issues"
```

If no fixes were needed, do not create an empty commit.

## Task 9: Final Validation

**Files:**
- No source file changes expected.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests PASS. Existing `MODULE_TYPELESS_PACKAGE_JSON` warnings may appear.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and routes include:

```text
ƒ /
ƒ /api/resources
ƒ /api/resources/[id]/related
○ /bookmarks
○ /profile
ƒ /member/[id]
ƒ /resource/[id]
```

- [ ] **Step 4: Inspect git status**

Run:

```bash
git status --short
```

Expected: empty working tree after all commits.
