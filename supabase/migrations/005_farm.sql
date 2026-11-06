-- Happy Resort — 005: nông trại chung (trồng ở ô nào tùy thích, tưới, bón phân, thu hoạch chung)

create table public.farm (
  couple_id    uuid not null references public.couples (id) on delete cascade,
  cell         int not null check (cell between 0 and 143),
  crop_id      text not null,
  planted_by   uuid not null references public.profiles (id) on delete cascade,
  planted_at   timestamptz not null default now(),
  water_days   int not null default 0,          -- số ngày đã được tưới
  last_watered date,                            -- ngày (giờ địa phương) tưới gần nhất
  fertilized   boolean not null default false,  -- đã bón phân → thu hoạch gấp đôi
  primary key (couple_id, cell)
);
alter table public.farm enable row level security;
create policy "đọc trong couple" on public.farm for select using (couple_id = my_couple_id());
-- Mọi thay đổi đi qua các hàm dưới đây

create function public.farm_plant(p_cell int, p_crop text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_couple_id() is null then raise exception 'Bạn chưa vào resort'; end if;
  insert into farm (couple_id, cell, crop_id, planted_by) values (my_couple_id(), p_cell, p_crop, my_id());
exception when unique_violation then
  raise exception 'Ô này đã có cây rồi';
end $$;

-- Tưới: mỗi cây mỗi ngày một lần (ai trong hai người tưới cũng được)
create function public.farm_water(p_cell int, p_day date) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update farm set water_days = water_days + 1, last_watered = p_day
  where couple_id = my_couple_id() and cell = p_cell and last_watered is distinct from p_day;
  return found;
end $$;

-- Bón phân: tốn 1 bao phân trong túi, thu hoạch gấp đôi
create function public.farm_fertilize(p_cell int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update inventory set qty = qty - 1 where user_id = my_id() and item_id = 'fertilizer' and qty > 0;
  if not found then raise exception 'Trong túi hết phân bón rồi — mua ở cửa hàng nhé'; end if;
  update farm set fertilized = true where couple_id = my_couple_id() and cell = p_cell and not fertilized;
  if not found then raise exception 'Cây này đã được bón phân rồi'; end if;
end $$;

-- Thu hoạch: cây vào túi người hái
create function public.farm_harvest(p_cell int, p_n int) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_crop text;
  v_fert boolean;
begin
  if p_n < 1 or p_n > 5 then raise exception 'Số lượng không hợp lệ'; end if;
  delete from farm where couple_id = my_couple_id() and cell = p_cell and water_days > 0
  returning crop_id, fertilized into v_crop, v_fert;
  if v_crop is null then raise exception 'Cây này chưa thu hoạch được'; end if;
  perform _give(my_id(), my_couple_id(), v_crop, case when v_fert then p_n * 2 else p_n end);
  return v_crop;
end $$;

-- Nhổ bỏ cây đang trồng
create function public.farm_clear(p_cell int) returns void
language sql security definer set search_path = public as $$
  delete from farm where couple_id = my_couple_id() and cell = p_cell;
$$;
