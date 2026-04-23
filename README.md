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

## Hong Kong Deployment

Deployment targets a Tencent Cloud Hong Kong VM with Nginx + systemd.

- GitHub Actions workflow: [`.github/workflows/deploy-hk.yml`](./.github/workflows/deploy-hk.yml)
- Nginx example: [`deploy/nginx.research-hub.conf`](./deploy/nginx.research-hub.conf)
- systemd unit: [`deploy/research-hub.service`](./deploy/research-hub.service)

### GitHub Secrets

The workflow expects these repository secrets:

- `HK_SSH_HOST`
- `HK_SSH_USER`
- `HK_SSH_KEY`
- `HK_APP_DIR`

### Server Layout

- Application path: `/srv/research-hub/current`
- Environment file: `/etc/research-hub.env`
- systemd service name: `research-hub`

### Initial Server Bootstrapping

1. Copy `deploy/research-hub.service` to `/etc/systemd/system/research-hub.service`
2. Copy `deploy/nginx.research-hub.conf` into Nginx sites config and enable it
3. Create `/etc/research-hub.env` with the production environment variables
4. Run `sudo systemctl daemon-reload`
5. Run `sudo systemctl enable research-hub`
6. Provision TLS for `yuuri.cn` and `www.yuuri.cn`

After that, pushing to `main` triggers CI validation and remote deployment.
