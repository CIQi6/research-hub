-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Members table
create table if not exists members (
  github_id bigint primary key,
  github_username text not null,
  avatar_url text,
  field text default '',
  resources jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

-- Index for faster comment queries
create index if not exists idx_comments_target on comments(target_github_id, created_at desc);
