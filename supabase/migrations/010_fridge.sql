-- Happy Resort — 010: tủ lạnh chung trong bếp (đồ của cả hai, ai cũng lấy được)

create table public.fridge (
  couple_id uuid not null references public.couples (id) on delete cascade,
  item_id   text not null,
  qty       int not null default 0 check (qty >= 0),
  primary key (couple_id, item_id)
);
alter table public.fridge enable row level security;
create policy "đọc tủ lạnh trong couple" on public.fridge for select using (couple_id = my_couple_id());

-- Cất đồ từ túi mình vào tủ chung. p_items: [{"id": "carrot", "n": 2}]
create function public.fridge_put(p_items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if my_couple_id() is null then raise exception 'Bạn chưa vào resort'; end if;
  for r in select * from jsonb_to_recordset(p_items) as x(id text, n int) loop
    if coalesce(r.n, 1) < 1 or r.n > 999 then raise exception 'Số lượng không hợp lệ'; end if;
    update inventory set qty = qty - coalesce(r.n, 1)
    where user_id = my_id() and item_id = r.id and qty >= coalesce(r.n, 1);
    if not found then raise exception 'Trong túi không đủ: %', r.id; end if;
    insert into fridge (couple_id, item_id, qty) values (my_couple_id(), r.id, coalesce(r.n, 1))
    on conflict (couple_id, item_id) do update set qty = fridge.qty + excluded.qty;
  end loop;
end $$;

-- Lấy đồ từ tủ chung về túi mình
create function public.fridge_take(p_item text, p_n int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_n < 1 or p_n > 999 then raise exception 'Số lượng không hợp lệ'; end if;
  update fridge set qty = qty - p_n where couple_id = my_couple_id() and item_id = p_item and qty >= p_n;
  if not found then raise exception 'Tủ lạnh không còn đủ món này'; end if;
  perform _give(my_id(), my_couple_id(), p_item, p_n);
end $$;

-- Nấu ăn: lấy nguyên liệu trong tủ ra dùng luôn
create function public.fridge_use(p_items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in select * from jsonb_to_recordset(p_items) as x(id text, n int) loop
    update fridge set qty = qty - coalesce(r.n, 1)
    where couple_id = my_couple_id() and item_id = r.id and qty >= coalesce(r.n, 1);
    if not found then raise exception 'Tủ lạnh hết: %', r.id; end if;
  end loop;
end $$;
