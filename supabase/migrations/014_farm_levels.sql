-- 014: Nông trại 3 cấp — gieo tốn 1 hạt giống trong túi, tưới cách nhau ≥ 1 tiếng, mỗi cấp bón phân 1 lần (tối đa 3).
alter table farm add column if not exists fert_n int not null default 0;
alter table farm add column if not exists watered_at timestamptz;

create or replace function public.farm_plant(p_cell int, p_crop text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_couple_id() is null then raise exception 'Bạn chưa vào resort'; end if;
  update inventory set qty = qty - 1 where user_id = my_id() and item_id = 'seed_' || p_crop and qty > 0;
  if not found then raise exception 'Hết hạt giống này rồi — mua ở cửa hàng (mục Hạt giống) nhé'; end if;
  insert into farm (couple_id, cell, crop_id, planted_by) values (my_couple_id(), p_cell, p_crop, my_id());
exception when unique_violation then
  raise exception 'Ô này đã có cây rồi';
end $$;

create or replace function public.farm_water(p_cell int, p_day date) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update farm set water_days = water_days + 1, last_watered = p_day, watered_at = now()
  where couple_id = my_couple_id() and cell = p_cell and (watered_at is null or watered_at < now() - interval '55 minutes');
  return found;
end $$;

create or replace function public.farm_fertilize(p_cell int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update inventory set qty = qty - 1 where user_id = my_id() and item_id = 'fertilizer' and qty > 0;
  if not found then raise exception 'Trong túi hết phân bón rồi — mua ở cửa hàng nhé'; end if;
  update farm set fert_n = fert_n + 1, fertilized = true where couple_id = my_couple_id() and cell = p_cell and fert_n < 3;
  if not found then raise exception 'Cây này đã bón đủ 3 lần rồi'; end if;
end $$;
