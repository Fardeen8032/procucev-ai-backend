create extension if not exists "pgcrypto";

create table if not exists transcriptions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  text text not null default '',
  languages text[] not null default '{}',
  duration_ms integer,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transcriptions_created_at_idx on transcriptions (created_at desc);

-- Keep updated_at current on every update.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists transcriptions_set_updated_at on transcriptions;
create trigger transcriptions_set_updated_at
  before update on transcriptions
  for each row
  execute function set_updated_at();


alter table transcriptions enable row level security;