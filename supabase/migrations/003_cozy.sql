-- Happy Resort — 003: nhân vật, vườn, nấu ăn, tặng quà

-- Nhân vật pixel: {"skin": 0, "hair": 1, "hairColor": 2, "shirt": 3}
alter table public.profiles add column avatar jsonb not null default '{}';
grant update (avatar) on public.profiles to authenticated;

-- Vườn: mỗi người vài ô đất trên bờ của mình
create table public.garden (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  couple_id    uuid not null references public.couples (id) on delete cascade,
  plot         int not null check (plot between 0 and 5),
  crop_id      text not null,
  planted_at   timestamptz not null default now(),
  water_days   int not null default 0,         -- số ngày đã được tưới
  last_watered date,                           -- ngày (giờ địa phương) tưới gần nhất
  primary key (user_id, plot)
);
alter table public.garden enable row level security;
create policy "đọc trong couple" on public.garden for select using (couple_id = my_couple_id());
create policy "trồng ở vườn mình" on public.garden
  for insert with check (user_id = my_id() and couple_id = my_couple_id());
create policy "tưới vườn mình" on public.garden
  for update using (user_id = my_id()) with check (user_id = my_id() and couple_id = my_couple_id());
create policy "dọn vườn mình" on public.garden for delete using (user_id = my_id());

-- Thư có thể kèm một món quà
alter table public.notes add column gift_item text;
revoke insert on public.notes from anon, authenticated;
grant insert (couple_id, from_id, to_id, body) on public.notes to authenticated;

-- Tặng 1 món trong túi cho người ấy, kèm lời nhắn (đi vào hòm thư)
create function public.send_gift(p_item text, p_body text default '') returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me      uuid := my_id();
  v_couple  uuid := my_couple_id();
  v_partner uuid;
begin
  select id into v_partner from profiles where couple_id = v_couple and id <> v_me;
  if v_partner is null then raise exception 'Người ấy chưa vào resort'; end if;

  update inventory set qty = qty - 1 where user_id = v_me and item_id = p_item and qty > 0;
  if not found then raise exception 'Trong túi không còn món này'; end if;

  perform _give(v_partner, v_couple, p_item, 1);
  insert into notes (couple_id, from_id, to_id, body, gift_item)
  values (v_couple, v_me, v_partner, coalesce(nullif(left(trim(p_body), 300), ''), '🎁'), p_item);
end $$;

-- Chế biến: lấy nguyên liệu trong túi, nhận thành phẩm (nấu ăn, dọn món ra bàn...)
-- p_take / p_give: [{"id": "rice", "n": 1}]
create function public.craft(p_take jsonb, p_give jsonb default '[]') returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := my_id();
  v_couple uuid := my_couple_id();
  r record;
begin
  if v_couple is null then raise exception 'Bạn chưa vào resort'; end if;
  if jsonb_array_length(p_take) = 0 then raise exception 'Thiếu nguyên liệu'; end if;

  for r in select * from jsonb_to_recordset(p_take) as x(id text, n int) loop
    update inventory set qty = qty - coalesce(r.n, 1)
    where user_id = v_me and item_id = r.id and qty >= coalesce(r.n, 1);
    if not found then raise exception 'Thiếu nguyên liệu: %', r.id; end if;
  end loop;

  for r in select * from jsonb_to_recordset(p_give) as x(id text, n int) loop
    perform _give(v_me, v_couple, r.id, coalesce(r.n, 1));
  end loop;
end $$;
