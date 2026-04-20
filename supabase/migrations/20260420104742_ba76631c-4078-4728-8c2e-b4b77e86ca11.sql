-- Workflows table: stores user workflows (nodes + edges) as JSONB
create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workflows_user_updated_idx on public.workflows(user_id, updated_at desc);

alter table public.workflows enable row level security;

create policy "users read own workflows"
  on public.workflows for select
  using (auth.uid() = user_id);

create policy "users insert own workflows"
  on public.workflows for insert
  with check (auth.uid() = user_id);

create policy "users update own workflows"
  on public.workflows for update
  using (auth.uid() = user_id);

create policy "users delete own workflows"
  on public.workflows for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at timestamp
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workflows_touch_updated_at
  before update on public.workflows
  for each row execute function public.touch_updated_at();

-- Workflow checkpoints: named version snapshots per workflow
create table public.workflow_checkpoints (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index checkpoints_workflow_idx on public.workflow_checkpoints(workflow_id, created_at desc);

alter table public.workflow_checkpoints enable row level security;

create policy "users read own checkpoints"
  on public.workflow_checkpoints for select
  using (auth.uid() = user_id);

create policy "users insert own checkpoints"
  on public.workflow_checkpoints for insert
  with check (auth.uid() = user_id);

create policy "users update own checkpoints"
  on public.workflow_checkpoints for update
  using (auth.uid() = user_id);

create policy "users delete own checkpoints"
  on public.workflow_checkpoints for delete
  using (auth.uid() = user_id);