-- MyLife OS initial Supabase schema
-- Run this entire script in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.daily_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) <= 120),
  category text not null check (category in ('spiritual','economic','agriculture','relationships','character','health','learning','impact')),
  activity_date date not null default current_date,
  notes text,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  completed boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  evaluation_period text not null check (evaluation_period in ('daily','weekly','monthly')),
  evaluation_date date not null,
  scores jsonb not null,
  average_score numeric(3,2) not null check (average_score >= 0 and average_score <= 5),
  reflection text,
  created_at timestamptz not null default now()
);

create index if not exists daily_activities_user_date_idx on public.daily_activities(user_id, activity_date desc);
create index if not exists evaluations_user_date_idx on public.evaluations(user_id, evaluation_date desc);

alter table public.daily_activities enable row level security;
alter table public.evaluations enable row level security;

drop policy if exists "Users manage own activities" on public.daily_activities;
create policy "Users manage own activities" on public.daily_activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own evaluations" on public.evaluations;
create policy "Users manage own evaluations" on public.evaluations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
