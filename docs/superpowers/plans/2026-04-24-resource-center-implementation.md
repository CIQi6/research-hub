# Resource Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace member-embedded resource JSON with a first-class resource center that supports resource details, tags, comments, bookmarks, and a hybrid resource-first homepage.

**Architecture:** Keep Next.js App Router and NextAuth in place, move resource data into dedicated Supabase tables, and add resource-focused route handlers plus focused client components. Preserve member pages and member comments, but treat them as author-profile surfaces layered on top of the new resource model.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, NextAuth v5 beta, Supabase JS, Tailwind CSS 4, Vitest.

---

### Task 1: Add test coverage and shared resource-domain helpers

**Files:**
- Create: `src/lib/resource-types.ts`
- Create: `src/lib/resource-form.ts`
- Create: `src/lib/resource-form.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from "vitest";
import { parseResourceDraft, RESOURCE_TYPE_OPTIONS } from "./resource-form";

describe("parseResourceDraft", () => {
  it("normalizes a valid payload into resource input", () => {
    const parsed = parseResourceDraft({
      title: "  Attention Is All You Need  ",
      url: "https://arxiv.org/abs/1706.03762",
      type: "pdf",
      summary: "  Transformer paper.  ",
      tags: "nlp, transformers, nlp",
    });

    expect(parsed).toEqual({
      title: "Attention Is All You Need",
      url: "https://arxiv.org/abs/1706.03762",
      type: "pdf",
      summary: "Transformer paper.",
      tags: ["nlp", "transformers"],
    });
  });

  it("rejects unsupported resource types", () => {
    expect(() =>
      parseResourceDraft({
        title: "Bad",
        url: "https://example.com",
        type: "zip",
        summary: "Nope",
        tags: "",
      })
    ).toThrow("Unsupported resource type");
  });
});

describe("RESOURCE_TYPE_OPTIONS", () => {
  it("exposes the supported manual resource types", () => {
    expect(RESOURCE_TYPE_OPTIONS.map((option) => option.value)).toEqual([
      "pdf",
      "web",
      "audio",
      "video",
      "ebook",
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/resource-form.test.ts`
Expected: FAIL because the new helper file and test script do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export const RESOURCE_TYPE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "web", label: "网页" },
  { value: "audio", label: "音频" },
  { value: "video", label: "视频" },
  { value: "ebook", label: "电子书" },
] as const;

export type ResourceType = (typeof RESOURCE_TYPE_OPTIONS)[number]["value"];

export function parseResourceDraft(input: {
  title: string;
  url: string;
  type: string;
  summary: string;
  tags: string;
}) {
  // normalize strings, validate type, dedupe tags
}
```

- [ ] **Step 4: Add the test runner script**

```json
{
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/lib/resource-form.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/resource-types.ts src/lib/resource-form.ts src/lib/resource-form.test.ts
git commit -m "test: add resource domain validation helpers"
```

### Task 2: Replace the Supabase schema with first-class resource tables

**Files:**
- Modify: `supabase-schema.sql`
- Create: `src/lib/resource-queries.ts`
- Create: `src/lib/resource-queries.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildResourceFilters } from "./resource-queries";

describe("buildResourceFilters", () => {
  it("builds a stable filter object for list queries", () => {
    expect(
      buildResourceFilters({
        q: "transformer",
        type: "pdf",
        tag: "nlp",
        owner: "42",
      })
    ).toEqual({
      q: "transformer",
      type: "pdf",
      tag: "nlp",
      ownerGithubId: 42,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/resource-queries.test.ts`
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Write the SQL schema and query helper**

```sql
create table if not exists resources (...);
create table if not exists tags (...);
create table if not exists resource_tags (...);
create table if not exists resource_comments (...);
create table if not exists resource_bookmarks (...);
```

```ts
export function buildResourceFilters(searchParams: URLSearchParams | Record<string, string | null>) {
  // normalize q/type/tag/owner
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/resource-queries.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add supabase-schema.sql src/lib/resource-queries.ts src/lib/resource-queries.test.ts
git commit -m "feat: add resource center schema"
```

### Task 3: Add resource, comment, tag, and bookmark route handlers

**Files:**
- Create: `src/app/api/resources/route.ts`
- Create: `src/app/api/resources/[id]/route.ts`
- Create: `src/app/api/resources/[id]/comments/route.ts`
- Create: `src/app/api/resources/[id]/comments/[commentId]/route.ts`
- Create: `src/app/api/resources/[id]/bookmark/route.ts`
- Create: `src/app/api/me/bookmarks/route.ts`
- Create: `src/app/api/tags/route.ts`
- Create: `src/app/api/members/[id]/resources/route.ts`
- Modify: `src/app/api/members/route.ts`
- Modify: `src/app/api/members/[id]/route.ts`

- [ ] **Step 1: Write the failing API-focused test**

```ts
import { describe, expect, it } from "vitest";
import { parseResourceDraft } from "@/lib/resource-form";

describe("resource draft contract", () => {
  it("produces data safe for POST /api/resources", () => {
    const payload = parseResourceDraft({
      title: "Paper",
      url: "https://example.com/paper.pdf",
      type: "pdf",
      summary: "Summary",
      tags: "ml, ai",
    });

    expect(payload.tags).toEqual(["ml", "ai"]);
  });
});
```

- [ ] **Step 2: Run test to verify it passes before using it**

Run: `npm test -- src/lib/resource-form.test.ts`
Expected: PASS

- [ ] **Step 3: Implement the route handlers**

```ts
export async function GET(request: Request) {
  // list resources with type/tag/owner/search filters
}

export async function POST(request: Request) {
  // auth + resource insert + tag upsert + relation insert
}
```

```ts
export async function POST(_request: Request, context: RouteContext<'/api/resources/[id]/bookmark'>) {
  // auth + bookmark upsert
}
```

- [ ] **Step 4: Run lint for the new API surface**

Run: `npm run lint`
Expected: PASS for the new route handlers; if lint still fails, the remaining failure should be the known pre-existing component purity issue and then be fixed in Task 5.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/resources src/app/api/me/bookmarks src/app/api/tags src/app/api/members/[id]/resources src/app/api/members/route.ts src/app/api/members/[id]/route.ts
git commit -m "feat: add resource center APIs"
```

### Task 4: Rebuild the profile page around resource management

**Files:**
- Modify: `src/app/profile/page.tsx`
- Replace: `src/components/edit-profile.tsx`
- Create: `src/components/resource-editor.tsx`
- Create: `src/components/resource-type-select.tsx`

- [ ] **Step 1: Write the failing test for tag parsing reuse**

```ts
import { describe, expect, it } from "vitest";
import { parseResourceDraft } from "@/lib/resource-form";

describe("resource editor payload shape", () => {
  it("keeps empty tags out of resource drafts", () => {
    const payload = parseResourceDraft({
      title: "Talk",
      url: "https://example.com/talk",
      type: "video",
      summary: "Recorded talk",
      tags: "talks, , video",
    });

    expect(payload.tags).toEqual(["talks", "video"]);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- src/lib/resource-form.test.ts`
Expected: PASS

- [ ] **Step 3: Implement the UI split**

```tsx
return (
  <div className="space-y-10">
    <section>{/* profile fields */}</section>
    <section>{/* resource list + create/edit form */}</section>
  </div>
);
```

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/page.tsx src/components/edit-profile.tsx src/components/resource-editor.tsx src/components/resource-type-select.tsx
git commit -m "feat: add profile resource management"
```

### Task 5: Rebuild the homepage, member page, and resource detail page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/resource/[id]/page.tsx`
- Create: `src/components/resource-hub.tsx`
- Create: `src/components/resource-card.tsx`
- Create: `src/components/resource-detail.tsx`
- Create: `src/components/resource-comments.tsx`
- Modify: `src/app/member/[id]/page.tsx`
- Replace: `src/app/member/[id]/member-detail.tsx`
- Modify: `src/components/member-list.tsx`
- Modify: `src/components/navbar.tsx`
- Modify: `src/components/comments.tsx`

- [ ] **Step 1: Write the failing test for the known purity bug**

```ts
import { describe, expect, it } from "vitest";
import { formatTimeAgo } from "@/lib/resource-types";

describe("formatTimeAgo", () => {
  it("formats relative timestamps from a stable now value", () => {
    expect(formatTimeAgo("2026-04-24T00:00:00.000Z", Date.parse("2026-04-24T01:00:00.000Z"))).toBe("1h ago");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/resource-form.test.ts src/lib/resource-queries.test.ts`
Expected: FAIL because `formatTimeAgo` does not exist yet.

- [ ] **Step 3: Implement the homepage and detail surfaces**

```tsx
<ResourceHub />
```

```tsx
export default async function ResourcePage({ params }: PageProps<'/resource/[id]'>) {
  const { id } = await params;
  return <ResourceDetailPage resourceId={id} />;
}
```

```ts
export function formatTimeAgo(dateStr: string, nowMs = Date.now()) {
  // pure formatting helper
}
```

- [ ] **Step 4: Run test, lint, and build**

Run: `npm test -- src/lib/resource-form.test.ts src/lib/resource-queries.test.ts`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/resource/[id]/page.tsx src/components/resource-hub.tsx src/components/resource-card.tsx src/components/resource-detail.tsx src/components/resource-comments.tsx src/app/member/[id]/page.tsx src/app/member/[id]/member-detail.tsx src/components/member-list.tsx src/components/navbar.tsx src/components/comments.tsx src/lib/resource-types.ts
git commit -m "feat: ship resource center pages"
```

### Task 6: Add deployment automation and operator docs for Hong Kong hosting

**Files:**
- Create: `.github/workflows/deploy-hk.yml`
- Create: `deploy/nginx.research-hub.conf`
- Create: `deploy/research-hub.service`
- Modify: `README.md`

- [ ] **Step 1: Write the failing documentation expectation**

```md
README must describe:
- required GitHub secrets
- server deploy path
- systemd service usage
- Nginx reverse proxy setup
```

- [ ] **Step 2: Implement the workflow and deployment templates**

```yaml
name: Deploy Hong Kong
on:
  push:
    branches: [main, codex/resource-center-impl]
jobs:
  deploy:
    # install, lint, build, rsync, restart
```

- [ ] **Step 3: Run verification**

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy-hk.yml deploy/nginx.research-hub.conf deploy/research-hub.service README.md
git commit -m "ops: add hong kong deployment automation"
```
