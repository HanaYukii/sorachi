-- SoraChi only: apply to the owner's dedicated project, never Jabiko's database.
create table public.sorachi_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  constraint bounded_backup check (octet_length(payload::text) <= 2000000),
  constraint matching_backup_owner check (payload->'owner'->>'kind' = 'account' and payload->'owner'->>'id' = user_id::text)
);
alter table public.sorachi_backups enable row level security;
revoke all on public.sorachi_backups from anon, authenticated;
grant select on public.sorachi_backups to authenticated;
create policy "Read own SoraChi backup" on public.sorachi_backups for select to authenticated using ((select auth.uid()) = user_id);

-- Manual cloud checkpoints: stale devices must never silently overwrite a newer backup.
create function public.sorachi_save_backup(expected_revision bigint, snapshot jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  current_revision bigint;
  stamp timestamptz := now();
begin
  if caller is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if snapshot->'owner'->>'kind' is distinct from 'account' or snapshot->'owner'->>'id' is distinct from caller::text
    or snapshot->>'schemaVersion' is distinct from '2' or octet_length(snapshot::text) > 2000000
    or jsonb_typeof(snapshot->'learning') is distinct from 'object'
    or jsonb_typeof(snapshot->'attempts') is distinct from 'array' then
    raise exception 'Invalid backup' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));
  select revision into current_revision from public.sorachi_backups where user_id = caller;
  if expected_revision is null or expected_revision <> coalesce(current_revision, 0) then
    raise exception 'Backup changed on another device' using errcode = '40001';
  end if;
  insert into public.sorachi_backups(user_id,revision,payload,updated_at)
    values(caller,coalesce(current_revision,0)+1,snapshot,stamp)
    on conflict(user_id) do update set revision=excluded.revision,payload=excluded.payload,updated_at=excluded.updated_at;
  return jsonb_build_object('revision',coalesce(current_revision,0)+1,'updated_at',stamp);
end;
$$;
revoke all on function public.sorachi_save_backup(bigint,jsonb) from public, anon;
grant execute on function public.sorachi_save_backup(bigint,jsonb) to authenticated;

create table public.sorachi_feedback (
  submission_id uuid primary key,
  category text not null check (category in ('bug','wish','other')),
  message text not null check (char_length(btrim(message)) between 1 and 600),
  contact text check (char_length(contact) <= 200),
  context text not null check (char_length(context) <= 200),
  diagnostics jsonb not null default '{}' check (octet_length(diagnostics::text) <= 8000),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.sorachi_feedback enable row level security;
-- Only the challenge-verified Edge Function writes. The inbox is never public.
revoke all on public.sorachi_feedback from public, anon, authenticated;
grant all on public.sorachi_feedback to service_role;
