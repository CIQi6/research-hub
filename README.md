# Research Hub

Research Hub is a Next.js 16 + Supabase application for publishing and browsing research resources. The current product centers on resource cards, author pages, comments, and bookmarks.

## Local Development

Install dependencies and start the app:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

Create a local `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=
```

## Database Setup

Apply [`supabase-schema.sql`](./supabase-schema.sql) in the Supabase SQL editor before testing the resource-center APIs.

## Verification

Run the same checks used by CI:

```bash
npm test -- src/lib/resource-form.test.ts src/lib/resource-queries.test.ts
npm run lint
npm run build
```

## Contributing

All code, schema, configuration, and documentation changes should go through Pull Requests. Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a PR.

## Vercel Deployment

Production deployment now targets Vercel. The repository keeps a lightweight GitHub Actions CI workflow for tests, lint, and build checks only.

- CI workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)
- Deployment runbook: [`docs/vercel-deployment.md`](./docs/vercel-deployment.md)

### Required Vercel Environment Variables

Configure these in the Vercel project for `Production`, `Preview`, and `Development`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `AUTH_SECRET`
- `NEXTAUTH_URL`

For production, set `NEXTAUTH_URL` to the primary domain you choose on Vercel. The runbook uses `https://www.yuuri.cn` as the primary domain and redirects `https://yuuri.cn` to it.

### Production Setup Checklist

1. Push this repository to GitHub.
2. Import the GitHub repository into Vercel as a Next.js project.
3. Add the environment variables above in Vercel Project Settings.
4. Update the GitHub OAuth App:
   - Homepage URL: `https://www.yuuri.cn`
   - Authorization callback URL: `https://www.yuuri.cn/api/auth/callback/github`
5. Add both `yuuri.cn` and `www.yuuri.cn` in Vercel Project Settings -> Domains.
6. Keep `www.yuuri.cn` as the primary domain and redirect `yuuri.cn` to it.
7. Configure the DNS records at your domain provider with the exact values shown by Vercel.

After the repository is connected, each push to the production branch selected in Vercel triggers a new deployment automatically.
