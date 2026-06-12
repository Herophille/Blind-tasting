-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/qqwiwesbqwnzgzaowchs/sql)

create table if not exists sessions (
  id         text primary key,
  created_at bigint,
  data       jsonb not null default '{}'::jsonb
);

-- Disable RLS — this app has no user accounts, all access is via service role key on the server
alter table sessions disable row level security;
