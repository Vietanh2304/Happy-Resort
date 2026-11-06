-- Happy Resort — 008: em bé của hai bạn (cò mang tới khi cả hai cùng muốn), chăm bé lớn dần theo ngày thật

create table public.kids (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  name       text not null default '' check (char_length(name) <= 20),   -- '' = cò vừa mang tới, chưa đặt tên
  gender     text check (gender in ('m', 'f')),
  born_on    date not null,                     -- ngày cò mang bé tới
  love       int not null default 0,
  fed_at     timestamptz,
  bathed_at  timestamptz,
  slept_at   timestamptz,
  played_at  timestamptz,
  milestones text[] not null default '{}',      -- 'talk', 'walk', 'read'...
  created_at timestamptz not null default now()
);
alter table public.kids enable row level security;
create policy "đọc trong couple" on public.kids for select using (couple_id = my_couple_id());

-- Hai bạn cùng đồng ý → cò mang bé tới vào ngày p_due (tối đa 3 bé)
create function public.kid_plan(p_due date) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if my_couple_id() is null then raise exception 'Bạn chưa vào resort'; end if;
  if (select count(*) from kids where couple_id = my_couple_id()) >= 3 then raise exception 'Nhà mình đủ 3 bé rồi'; end if;
  if exists (select 1 from kids where couple_id = my_couple_id() and born_on > current_date + 2) then raise exception 'Cò đang trên đường mang bé tới rồi'; end if;
  insert into kids (couple_id, born_on) values (my_couple_id(), p_due) returning id into v_id;
  return v_id;
end $$;

create function public.kid_name(p_id uuid, p_name text, p_gender text) returns void
language sql security definer set search_path = public as $$
  update kids set name = trim(p_name), gender = p_gender where id = p_id and couple_id = my_couple_id();
$$;

-- Chăm bé: p_kind = feed | clean | sleep | play
create function public.kid_care(p_id uuid, p_kind text, p_love int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_love < 0 or p_love > 3 then raise exception 'Không hợp lệ'; end if;
  update kids set
    love = love + p_love,
    fed_at = case when p_kind = 'feed' then now() else fed_at end,
    bathed_at = case when p_kind = 'clean' then now() else bathed_at end,
    slept_at = case when p_kind = 'sleep' then now() else slept_at end,
    played_at = case when p_kind = 'play' then now() else played_at end
  where id = p_id and couple_id = my_couple_id();
end $$;

create function public.kid_milestone(p_id uuid, p_m text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update kids set milestones = array_append(milestones, p_m)
  where id = p_id and couple_id = my_couple_id() and not (p_m = any (milestones));
  return found;
end $$;
