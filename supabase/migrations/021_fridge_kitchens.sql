-- Hy's Resort — 021: mỗi bếp một tủ riêng (bếp nhà 'home', tiệm bánh 'bakery').
-- Đồ đang có trong tủ cũ giữ nguyên ở tủ bếp nhà. Túi đồ vẫn như cũ: cất vào tủ nào là tuỳ mình.

alter table public.fridge add column if not exists kitchen text not null default 'home';
alter table public.fridge drop constraint if exists fridge_kitchen_check;
alter table public.fridge add constraint fridge_kitchen_check check (kitchen in ('home', 'bakery'));
alter table public.fridge drop constraint if exists fridge_pkey;
alter table public.fridge add primary key (couple_id, kitchen, item_id);

-- bỏ bản cũ (không có tham số bếp) để khỏi trùng tên hàm khi gọi
drop function if exists public.fridge_put(jsonb);
drop function if exists public.fridge_take(text, int);
drop function if exists public.fridge_use(jsonb);

-- Cất đồ từ túi mình vào tủ của một bếp. p_items: [{"id": "egg", "n": 3}]
create or replace function public.fridge_put(p_items jsonb, p_kitchen text default 'home') returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if my_couple_id() is null then raise exception 'Bạn chưa vào resort'; end if;
  if p_kitchen not in ('home', 'bakery') then raise exception 'Không có tủ này'; end if;
  for r in select * from jsonb_to_recordset(p_items) as x(id text, n int) loop
    if coalesce(r.n, 1) < 1 or r.n > 999 then raise exception 'Số lượng không hợp lệ'; end if;
    update inventory set qty = qty - coalesce(r.n, 1)
    where user_id = my_id() and item_id = r.id and qty >= coalesce(r.n, 1);
    if not found then raise exception 'Trong túi không đủ: %', r.id; end if;
    insert into fridge (couple_id, kitchen, item_id, qty) values (my_couple_id(), p_kitchen, r.id, coalesce(r.n, 1))
    on conflict (couple_id, kitchen, item_id) do update set qty = fridge.qty + excluded.qty;
  end loop;
end $$;

-- Lấy đồ từ tủ một bếp về túi mình
create or replace function public.fridge_take(p_item text, p_n int, p_kitchen text default 'home') returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_n < 1 or p_n > 999 then raise exception 'Số lượng không hợp lệ'; end if;
  update fridge set qty = qty - p_n where couple_id = my_couple_id() and kitchen = p_kitchen and item_id = p_item and qty >= p_n;
  if not found then raise exception 'Tủ không còn đủ món này'; end if;
  perform _give(my_id(), my_couple_id(), p_item, p_n);
end $$;

-- Nấu ăn: dùng nguyên liệu trong tủ của bếp đang nấu
create or replace function public.fridge_use(p_items jsonb, p_kitchen text default 'home') returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from jsonb_to_recordset(p_items) as x(id text, n int) loop
    update fridge set qty = qty - coalesce(r.n, 1)
    where couple_id = my_couple_id() and kitchen = p_kitchen and item_id = r.id and qty >= coalesce(r.n, 1);
    if not found then raise exception 'Tủ hết: %', r.id; end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
