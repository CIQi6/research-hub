-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Members table
create table if not exists members (
  github_id bigint primary key,
  github_username text not null,
  avatar_url text,
  field text default '',
  -- Retained temporarily for one-time migration into the resources table.
  resources jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Resources table
create table if not exists resources (
  id uuid default gen_random_uuid() primary key,
  owner_github_id bigint not null references members(github_id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  url text not null check (length(btrim(url)) > 0 and url ~* '^https?://'),
  type text not null check (type in ('pdf', 'web', 'audio', 'video', 'ebook')),
  summary text not null check (length(btrim(summary)) > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Existing deployments created before the checks above need the same constraints.
-- Delete or repair invalid rows before running this block.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'resources_title_not_blank'
  ) then
    alter table resources
      add constraint resources_title_not_blank
      check (length(btrim(title)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'resources_url_valid_http'
  ) then
    alter table resources
      add constraint resources_url_valid_http
      check (length(btrim(url)) > 0 and url ~* '^https?://');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'resources_summary_not_blank'
  ) then
    alter table resources
      add constraint resources_summary_not_blank
      check (length(btrim(summary)) > 0);
  end if;
end $$;

-- Tags table
create table if not exists tags (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  name text not null unique,
  created_at timestamptz default now()
);

-- Resource-to-tag relation table
create table if not exists resource_tags (
  resource_id uuid not null references resources(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (resource_id, tag_id)
);

-- Comments table
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  target_github_id bigint not null references members(github_id) on delete cascade,
  parent_comment_id uuid references comments(id) on delete cascade,
  author_github_id bigint not null,
  author_username text not null,
  author_avatar text,
  content text not null,
  created_at timestamptz default now()
);

-- Resource comments table
create table if not exists resource_comments (
  id uuid default gen_random_uuid() primary key,
  resource_id uuid not null references resources(id) on delete cascade,
  parent_comment_id uuid references resource_comments(id) on delete cascade,
  author_github_id bigint not null references members(github_id) on delete cascade,
  author_username text not null,
  author_avatar text,
  content text not null,
  created_at timestamptz default now()
);

-- Knowledge sharing articles table
create table if not exists articles (
  id uuid default gen_random_uuid() primary key,
  author_github_id bigint not null references members(github_id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  summary text not null check (length(btrim(summary)) > 0),
  content text not null check (length(btrim(content)) > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Resource bookmarks table
create table if not exists resource_bookmarks (
  resource_id uuid not null references resources(id) on delete cascade,
  user_github_id bigint not null references members(github_id) on delete cascade,
  created_at timestamptz default now(),
  primary key (resource_id, user_github_id)
);

-- Reply support for existing deployments.
alter table comments
  add column if not exists parent_comment_id uuid references comments(id) on delete cascade;

alter table resource_comments
  add column if not exists parent_comment_id uuid references resource_comments(id) on delete cascade;

-- Index for faster comment queries
create index if not exists idx_comments_target on comments(target_github_id, created_at desc);
create index if not exists idx_comments_parent on comments(parent_comment_id, created_at asc);
create index if not exists idx_resources_owner on resources(owner_github_id, created_at desc);
create index if not exists idx_resources_type on resources(type, created_at desc);
create index if not exists idx_resource_comments_resource on resource_comments(resource_id, created_at desc);
create index if not exists idx_resource_comments_parent on resource_comments(parent_comment_id, created_at asc);
create index if not exists idx_articles_author on articles(author_github_id, updated_at desc);
create index if not exists idx_articles_updated on articles(updated_at desc);
create index if not exists idx_resource_bookmarks_user on resource_bookmarks(user_github_id, created_at desc);
