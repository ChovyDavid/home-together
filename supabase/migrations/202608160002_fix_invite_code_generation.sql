-- Fix invite generation for SECURITY DEFINER functions with an empty
-- search_path. gen_random_bytes belongs to the pgcrypto extension schema,
-- while gen_random_uuid is a PostgreSQL built-in available in pg_catalog.

create or replace function public.create_household_invite(p_household_id uuid)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  new_code text;
begin
  if not public.is_household_member(p_household_id) then raise exception 'Access denied'; end if;

  loop
    new_code := upper(substr(replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into public.household_invites (household_id, code, created_by)
      values (p_household_id, new_code, (select auth.uid()));
      exit;
    exception when unique_violation then
      -- Retry if the short invite code happens to collide with an active or
      -- historical code protected by the unique constraint.
      null;
    end;
  end loop;

  return new_code;
end;
$$;

grant execute on function public.create_household_invite(uuid) to authenticated;
