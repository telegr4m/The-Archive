-- Run once in the Supabase SQL editor. The browser never accesses this table.
create table if not exists public.site_stats (
  key text primary key,
  value bigint not null default 0 check (value >= 0),
  updated_at timestamptz not null default now()
);

alter table public.site_stats enable row level security;

revoke all on table public.site_stats from anon, authenticated;

insert into public.site_stats (key, value)
values ('total_views', 0)
on conflict (key) do nothing;

-- SECURITY INVOKER is the default. Only the server-side service/secret role can
-- execute this function, and the increment is atomic inside Postgres.
create or replace function public.increment_site_view()
returns bigint
language sql
volatile
security invoker
set search_path = ''
as $$
  insert into public.site_stats (key, value, updated_at)
  values ('total_views', 1, now())
  on conflict (key) do update
  set value = public.site_stats.value + 1,
      updated_at = now()
  returning value;
$$;

revoke all on function public.increment_site_view() from public, anon, authenticated;
grant execute on function public.increment_site_view() to service_role;
