-- Household-scoped shopping checklists with three starter stores.

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id),
  unique (household_id, name)
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  list_id uuid not null,
  name text not null check (char_length(trim(name)) between 1 and 120),
  is_checked boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (list_id, household_id)
    references public.shopping_lists(id, household_id) on delete cascade
);

create index if not exists shopping_lists_household_order_idx
  on public.shopping_lists(household_id, sort_order, created_at);
create index if not exists shopping_items_list_created_idx
  on public.shopping_items(list_id, created_at);
create index if not exists shopping_items_household_idx
  on public.shopping_items(household_id);

drop trigger if exists shopping_lists_touch_updated_at on public.shopping_lists;
create trigger shopping_lists_touch_updated_at before update on public.shopping_lists
for each row execute function public.touch_updated_at();
drop trigger if exists shopping_items_touch_updated_at on public.shopping_items;
create trigger shopping_items_touch_updated_at before update on public.shopping_items
for each row execute function public.touch_updated_at();

create or replace function public.seed_default_shopping_lists()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.shopping_lists (household_id, name, sort_order)
  values
    (new.id, 'Costco', 0),
    (new.id, 'H-Mart', 1),
    (new.id, 'H-E-B', 2)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists households_seed_default_shopping_lists on public.households;
create trigger households_seed_default_shopping_lists
after insert on public.households
for each row execute function public.seed_default_shopping_lists();

insert into public.shopping_lists (household_id, name, sort_order)
select household.id, starter.name, starter.sort_order
from public.households as household
cross join (values ('Costco', 0), ('H-Mart', 1), ('H-E-B', 2)) as starter(name, sort_order)
on conflict do nothing;

alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;

drop policy if exists "Members manage shopping lists" on public.shopping_lists;
create policy "Members manage shopping lists" on public.shopping_lists for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "Members manage shopping items" on public.shopping_items;
create policy "Members manage shopping items" on public.shopping_items for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

grant select, insert, update, delete on public.shopping_lists, public.shopping_items to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.shopping_lists;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.shopping_items;
exception when duplicate_object then null;
end $$;
