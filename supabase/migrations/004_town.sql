-- Resort hai bờ — 004: làng chung, nhà gỗ chung, hũ xu chung

-- Hũ xu chung của hai người
alter table public.couples add column coins int not null default 50 check (coins >= 0);

-- Bán đồ trong túi lấy xu (giá lấy từ content.json phía client, chặn giá vô lý)
create function public.sell_item(p_item text, p_n int, p_price int) returns int
language plpgsql security definer set search_path = public as $$
declare v_coins int;
begin
  if p_n < 1 or p_price < 0 or p_price > 1000 then raise exception 'Giá không hợp lệ'; end if;
  update inventory set qty = qty - p_n where user_id = my_id() and item_id = p_item and qty >= p_n;
  if not found then raise exception 'Trong túi không đủ món này'; end if;
  update couples set coins = coins + p_n * p_price where id = my_couple_id() returning coins into v_coins;
  return v_coins;
end $$;

-- Mua đồ bằng xu chung, đồ vào túi người mua
create function public.buy_item(p_item text, p_price int) returns int
language plpgsql security definer set search_path = public as $$
declare v_coins int;
begin
  if p_price < 1 or p_price > 5000 then raise exception 'Giá không hợp lệ'; end if;
  update couples set coins = coins - p_price where id = my_couple_id() and coins >= p_price returning coins into v_coins;
  if v_coins is null then raise exception 'Hũ xu chưa đủ'; end if;
  perform _give(my_id(), my_couple_id(), p_item, 1);
  return v_coins;
end $$;

-- Thưởng xu cho ngày cả hai cùng ghé (mỗi ngày một lần cho cả cặp)
create function public.together_bonus(p_day date, p_amount int) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_couple uuid := my_couple_id();
begin
  if p_amount < 0 or p_amount > 100 then raise exception 'Thưởng không hợp lệ'; end if;
  if (select count(*) from checkins where couple_id = v_couple and day = p_day) < 2 then return false; end if;
  if exists (select 1 from claims where couple_id = v_couple and key = 'together:' || p_day) then return false; end if;
  insert into claims (user_id, couple_id, key) values (my_id(), v_couple, 'together:' || p_day);
  update couples set coins = coins + p_amount where id = v_couple;
  return true;
end $$;

-- Nhà chung: đồ không phải ở 'home' thì ai trong cặp cũng dời/cất được
create or replace function public.move_decor(p_id uuid, p_x int, p_y int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update decor set x = p_x, y = p_y
  where id = p_id and couple_id = my_couple_id() and (owner_id = my_id() or island <> 'home');
  if not found then raise exception 'Không thể di chuyển món này'; end if;
end $$;

create or replace function public.remove_decor(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_item   text;
  v_couple uuid;
begin
  delete from decor
  where id = p_id and couple_id = my_couple_id() and (owner_id = my_id() or island <> 'home')
  returning item_id, couple_id into v_item, v_couple;
  if v_item is null then raise exception 'Không thể cất món này'; end if;
  perform _give(my_id(), v_couple, v_item, 1);
end $$;
