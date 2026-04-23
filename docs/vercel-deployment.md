# Vercel Deployment Runbook

This project is a standard Next.js App Router application and can be deployed to Vercel without a custom server.

## 1. Import the repository

1. Push the repository to GitHub.
2. In Vercel, create a new project from that GitHub repository.
3. Let Vercel detect the framework as `Next.js`.
4. Keep the default install and build commands unless you have a reason to override them.

## 2. Configure environment variables

Add the following variables in Vercel Project Settings for `Production`, `Preview`, and `Development`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_GITHUB_ID`
- `AUTH_GITHUB_SECRET`
- `AUTH_SECRET`
- `NEXTAUTH_URL`

Recommended production value:

```bash
NEXTAUTH_URL=https://www.yuuri.cn
```

## 3. Update GitHub OAuth

The GitHub OAuth App must use the same public domain as `NEXTAUTH_URL`.

- Homepage URL: `https://www.yuuri.cn`
- Authorization callback URL: `https://www.yuuri.cn/api/auth/callback/github`

If you choose a different primary domain, update both values accordingly. Mixing domains here is how you break login.

## 4. Add the custom domains

In Vercel Project Settings -> Domains:

1. Add `yuuri.cn`
2. Add `www.yuuri.cn`
3. Set `www.yuuri.cn` as the primary domain
4. Redirect `yuuri.cn` to `www.yuuri.cn`

Vercel recommends using the `www` subdomain as primary because it gives the edge network more control over routing and redirects.

## 5. Configure DNS at your domain provider

This repository does not control your DNS provider. Add the exact records Vercel shows in the Domains screen.

- Apex domain (`yuuri.cn`): use the `A` record value shown by Vercel
- Subdomain (`www.yuuri.cn`): use the `CNAME` value shown by Vercel

Do not blindly copy random IPs from blog posts. Vercel can show project-specific values in the domain inspector.

## 6. Trigger production deployment

After the repository is connected to Vercel:

1. Select the production branch in Vercel, usually `main`
2. Merge the implementation branch
3. Push to the production branch
4. Verify the latest deployment in Vercel

## 7. Post-deploy smoke checks

Verify these paths after the first production deployment:

- `/`
- `/profile`
- `/bookmarks`
- `/resource/<some-resource-id>`
- `/member/<some-github-id>`

Also verify:

- GitHub login completes successfully
- Resource creation works
- Bookmark creation works
- Resource comments work
