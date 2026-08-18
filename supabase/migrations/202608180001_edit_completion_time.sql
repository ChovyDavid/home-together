-- Let household members edit the actual completion time together with the
-- task. For recurring chores, keep the pending next occurrence in sync.

drop function if exists public.update_household_task(uuid, text, text, text, text, uuid, date, jsonb);

create or replace function public.update_household_task(
  p_instance_id uuid,
  p_title text,
  p_type text,
  p_one_off_timing text,
  p_assignee_mode text,
  p_assignee_profile_id uuid,
  p_scheduled_date date,
  p_recurrence_rule jsonb,
  p_completed_at timestamptz
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  instance_row public.task_instances%rowtype;
  template_row public.task_templates%rowtype;
  completion_row public.completion_records%rowtype;
  household_timezone text;
  next_date date;
begin
  select * into instance_row
  from public.task_instances
  where id = p_instance_id
  for update;

  if instance_row.id is null or not public.is_household_member(instance_row.household_id) then
    raise exception 'Access denied';
  end if;
  if p_title is null or char_length(trim(p_title)) not between 1 and 80 then
    raise exception '事项名称需要 1 到 80 个字符';
  end if;
  if p_type is null or p_type not in ('recurring', 'one_off') then
    raise exception '无效的事项类型';
  end if;
  if p_assignee_mode is null or p_assignee_mode not in ('member', 'shared', 'unassigned') then
    raise exception '无效的负责人类型';
  end if;
  if p_scheduled_date is null then
    raise exception '请选择计划日期';
  end if;
  if p_type = 'recurring' and p_recurrence_rule is null then
    raise exception '周期家务需要重复规则';
  end if;
  if p_type = 'one_off' and (p_one_off_timing is null or p_one_off_timing not in ('week', 'deadline')) then
    raise exception '一次性家务必须选择按周完成或截止日期';
  end if;
  if instance_row.status = 'completed' and p_completed_at is null then
    raise exception '已完成家务需要实际完成时间';
  end if;
  if p_completed_at is not null and p_completed_at > now() + interval '5 minutes' then
    raise exception '完成时间不能晚于当前时间';
  end if;

  if p_assignee_mode = 'member' then
    if p_assignee_profile_id is null or not exists (
      select 1 from public.household_members
      where household_id = instance_row.household_id
        and profile_id = p_assignee_profile_id
    ) then
      raise exception '负责人不属于这个家庭';
    end if;
  else
    p_assignee_profile_id := null;
  end if;

  update public.task_templates
  set title = trim(p_title),
      type = p_type,
      one_off_timing = case when p_type = 'one_off' then p_one_off_timing else null end,
      assignee_mode = p_assignee_mode,
      assignee_profile_id = p_assignee_profile_id,
      recurrence_rule = case when p_type = 'recurring' then p_recurrence_rule else null end
  where id = instance_row.template_id;

  update public.task_instances
  set assignee_profile_id = p_assignee_profile_id
  where template_id = instance_row.template_id
    and status = 'pending';

  update public.task_instances
  set scheduled_date = p_scheduled_date,
      assignee_profile_id = p_assignee_profile_id
  where id = instance_row.id;

  if p_type = 'one_off' then
    delete from public.task_instances
    where template_id = instance_row.template_id
      and id <> instance_row.id
      and status = 'pending';
  end if;

  if instance_row.status = 'completed' then
    select * into completion_row
    from public.completion_records
    where instance_id = instance_row.id and is_voided = false
    order by completed_at desc
    limit 1
    for update;

    if completion_row.id is null then
      raise exception '找不到有效的完成记录';
    end if;

    update public.completion_records
    set completed_at = p_completed_at
    where id = completion_row.id;

    select * into template_row
    from public.task_templates
    where id = instance_row.template_id;

    if template_row.type = 'recurring' and template_row.active then
      select timezone into household_timezone
      from public.households
      where id = instance_row.household_id;

      next_date := public.next_scheduled_date(
        p_scheduled_date,
        p_completed_at,
        household_timezone,
        template_row.recurrence_rule
      );

      update public.task_instances
      set scheduled_date = next_date
      where generated_from_completion_id = completion_row.id
        and status = 'pending';
    end if;
  end if;
end;
$$;

grant execute on function public.update_household_task(uuid, text, text, text, text, uuid, date, jsonb, timestamptz) to authenticated;
