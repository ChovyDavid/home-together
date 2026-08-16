-- Apply this migration to projects that already ran supabase/schema.sql.
-- Password authentication itself uses Supabase Auth and does not require an
-- auth-schema migration. This migration enforces one household per profile.

do $$
begin
  if exists (
    select 1
    from public.household_members
    group by profile_id
    having count(*) > 1
  ) then
    raise exception '迁移已停止：存在同时属于多个家庭的账号，请先人工保留其中一个 membership';
  end if;
end;
$$;

create unique index if not exists household_members_one_household_per_profile
  on public.household_members(profile_id);

create or replace function public.create_household(p_name text, p_timezone text default 'America/Chicago')
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  new_household_id uuid;
  existing_household_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;

  select household_id into existing_household_id
  from public.household_members
  where profile_id = (select auth.uid());

  if existing_household_id is not null then
    raise exception '每个账号只能属于一个家庭，你已经加入了一个家庭';
  end if;

  insert into public.households (name, timezone, created_by)
  values (trim(p_name), coalesce(nullif(p_timezone, ''), 'America/Chicago'), (select auth.uid()))
  returning id into new_household_id;

  begin
    insert into public.household_members (household_id, profile_id, role)
    values (new_household_id, (select auth.uid()), 'owner');
  exception when unique_violation then
    raise exception '每个账号只能属于一个家庭，你已经加入了一个家庭';
  end;

  return new_household_id;
end;
$$;

create or replace function public.join_household_by_invite(p_code text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  matched public.household_invites%rowtype;
  existing_household_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;

  select household_id into existing_household_id
  from public.household_members
  where profile_id = (select auth.uid());

  if existing_household_id is not null then
    raise exception '每个账号只能属于一个家庭，你已经加入了一个家庭';
  end if;

  select * into matched
  from public.household_invites
  where code = upper(trim(p_code))
    and accepted_at is null
    and expires_at > now()
  for update;

  if matched.id is null then raise exception '邀请码无效或已过期'; end if;

  begin
    insert into public.household_members (household_id, profile_id, role)
    values (matched.household_id, (select auth.uid()), 'member');
  exception when unique_violation then
    raise exception '每个账号只能属于一个家庭，你已经加入了一个家庭';
  end;

  update public.household_invites
  set accepted_by = (select auth.uid()), accepted_at = now()
  where id = matched.id;

  return matched.household_id;
end;
$$;

grant execute on function public.create_household(text, text) to authenticated;
grant execute on function public.join_household_by_invite(text) to authenticated;
