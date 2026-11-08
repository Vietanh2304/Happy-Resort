-- Hy's Resort — 013: chăn nuôi, xưởng may, công ty, điểm học của con

-- ───── Chăn nuôi (chung của hai người) ─────
create table public.ranch (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples (id) on delete cascade,
  kind         text not null check (kind in ('chicken', 'duck', 'cow', 'goat', 'sheep', 'silkworm', 'bee')),
  name         text not null default '',
  fed_at       timestamptz,
  collected_at timestamptz,
  bought_by    uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index ranch_couple on public.ranch (couple_id);
alter table public.ranch enable row level security;
create policy "xem chuồng trại trong couple" on public.ranch for select using (couple_id = my_couple_id());

-- Mua con giống bằng hũ xu chung
create function public.ranch_buy(p_kind text, p_price int, p_name text default '') returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_coins int;
begin
  if p_price < 1 or p_price > 5000 then raise exception 'Giá không hợp lệ'; end if;
  if (select count(*) from ranch where couple_id = my_couple_id()) >= 24 then raise exception 'Chuồng trại đã đầy'; end if;
  update couples set coins = coins - p_price where id = my_couple_id() and coins >= p_price returning coins into v_coins;
  if v_coins is null then raise exception 'Hũ xu chưa đủ'; end if;
  insert into ranch (couple_id, kind, name, bought_by) values (my_couple_id(), p_kind, left(p_name, 20), my_id()) returning id into v_id;
  return v_id;
end $$;

-- Cho ăn (ai trong hai người cho ăn cũng được)
create function public.ranch_feed(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update ranch set fed_at = now() where id = p_id and couple_id = my_couple_id();
  if not found then raise exception 'Không thấy con vật này'; end if;
end $$;

-- Thu hoạch (trứng, sữa, len, kén tằm, mật ong): phải được cho ăn trong 30 giờ qua và đủ giờ kể từ lần thu trước
create function public.ranch_collect(p_id uuid, p_item text, p_n int, p_hours int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_n < 1 or p_n > 5 or p_hours < 2 or p_hours > 72 then raise exception 'Không hợp lệ'; end if;
  update ranch set collected_at = now()
  where id = p_id and couple_id = my_couple_id()
    and fed_at > now() - interval '30 hours'
    and (collected_at is null or collected_at < now() - make_interval(hours => p_hours));
  if not found then return false; end if;
  perform _give(my_id(), my_couple_id(), p_item, p_n);
  return true;
end $$;

-- Bán con vật
create function public.ranch_sell(p_id uuid, p_price int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_price < 0 or p_price > 5000 then raise exception 'Giá không hợp lệ'; end if;
  delete from ranch where id = p_id and couple_id = my_couple_id();
  if not found then raise exception 'Không thấy con vật này'; end if;
  update couples set coins = coins + p_price where id = my_couple_id();
end $$;

-- ───── Xưởng may: quần áo tự thiết kế ─────
create table public.outfits (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 30),
  spec       jsonb not null,
  created_at timestamptz not null default now()
);
create index outfits_couple on public.outfits (couple_id);
alter table public.outfits enable row level security;
create policy "xem tủ đồ trong couple" on public.outfits for select using (couple_id = my_couple_id());

-- May xong: trừ vải trong túi, cất vào tủ
create function public.outfit_make(p_name text, p_spec jsonb, p_take jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; r record;
begin
  if my_couple_id() is null then raise exception 'Bạn chưa vào resort'; end if;
  for r in select * from jsonb_to_recordset(p_take) as x(id text, n int) loop
    update inventory set qty = qty - coalesce(r.n, 1) where user_id = my_id() and item_id = r.id and qty >= coalesce(r.n, 1);
    if not found then raise exception 'Chưa đủ vải: %', r.id; end if;
  end loop;
  insert into outfits (couple_id, user_id, name, spec) values (my_couple_id(), my_id(), left(p_name, 30), p_spec) returning id into v_id;
  return v_id;
end $$;

-- Bán bộ đồ tự may
create function public.outfit_sell(p_id uuid, p_price int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_price < 0 or p_price > 3000 then raise exception 'Giá không hợp lệ'; end if;
  delete from outfits where id = p_id and user_id = my_id();
  if not found then raise exception 'Không thấy bộ đồ này'; end if;
  update couples set coins = coins + p_price where id = my_couple_id();
end $$;

-- ───── Công ty: tiến độ đi làm của mỗi người (người kia đọc được để nghe kể chuyện) ─────
create table public.jobs (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  couple_id  uuid not null references public.couples (id) on delete cascade,
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.jobs enable row level security;
create policy "xem công việc trong couple" on public.jobs for select using (couple_id = my_couple_id());
create policy "ghi công việc của mình" on public.jobs for insert with check (user_id = my_id() and couple_id = my_couple_id());
create policy "sửa công việc của mình" on public.jobs for update using (user_id = my_id());

-- ───── Điểm học của con ─────
create table public.kid_scores (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  kid_id     uuid not null references public.kids (id) on delete cascade,
  day        date not null,
  subject    text not null,
  score      int not null check (score between 0 and 10),
  by_user    uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (kid_id, day, subject)
);
alter table public.kid_scores enable row level security;
create policy "xem điểm của con" on public.kid_scores for select using (couple_id = my_couple_id());
create policy "ghi điểm của con" on public.kid_scores for insert with check (couple_id = my_couple_id());

-- Realtime báo thay đổi đã đi qua kênh broadcast của cặp đôi (notify), không cần publication.
