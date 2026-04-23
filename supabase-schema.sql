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
  title text not null,
  url text not null,
  type text not null check (type in ('pdf', 'web', 'audio', 'video', 'ebook')),
  summary text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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
  author_github_id bigint not null references members(github_id) on delete cascade,
  author_username text not null,
  author_avatar text,
  content text not null,
  created_at timestamptz default now()
);

-- Resource bookmarks table
create table if not exists resource_bookmarks (
  resource_id uuid not null references resources(id) on delete cascade,
  user_github_id bigint not null references members(github_id) on delete cascade,
  created_at timestamptz default now(),
  primary key (resource_id, user_github_id)
);

-- Index for faster comment queries
create index if not exists idx_comments_target on comments(target_github_id, created_at desc);
create index if not exists idx_resources_owner on resources(owner_github_id, created_at desc);
create index if not exists idx_resources_type on resources(type, created_at desc);
create index if not exists idx_resource_comments_resource on resource_comments(resource_id, created_at desc);
create index if not exists idx_resource_bookmarks_user on resource_bookmarks(user_github_id, created_at desc);
