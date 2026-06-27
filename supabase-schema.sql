-- RPM³ — Supabase Schema
-- Paste this into your Supabase project: SQL Editor → New query → Run

-- Single table: one row per user storing all app data as JSON
create table if not exists user_data (
  user_id uuid references auth.users primary key,
  data    jsonb        not null default '{}',
  updated_at timestamptz not null default now()
);

-- Row Level Security: users can only read/write their own row
alter table user_data enable row level security;

create policy "Users own their data"
  on user_data for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
