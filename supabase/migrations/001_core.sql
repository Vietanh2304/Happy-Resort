-- Happy Resort — 001: lõi (Phase 1)
-- Cặp đôi, người chơi, thiết bị, trang trí, túi đồ, bộ sưu tập, phần thưởng, điểm danh, thư.
--
-- Đăng nhập: không email, không mật khẩu. Mỗi trình duyệt có một phiên ẩn danh của Supabase
-- (auth.users). Phiên đó được nối với một người chơi (profiles) qua bảng devices bằng
-- "mã resort + tên". Sang máy khác chỉ cần nhập lại mã + tên là vào đúng resort cũ.

-- ───────────── Bảng ─────────────

create table public.couples (
  id          uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  city         text,
  lat          double precision,
  lon          double precision,
  tz           text,
  created_at   timestamptz not null default now()
);
-- Tên là "tài khoản" trong một resort: không trùng (không phân biệt hoa thường)
create unique index profiles_name_in_couple on public.profiles (couple_id, lower(display_name));

-- Phiên đăng nhập (trình duyệt) nào đang là người chơi nào
create table public.devices (
  auth_id    uuid primary key references auth.users (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  linked_at  timestamptz not null default now()
);

create table public.decor (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  island     text not null default 'home',   -- 'home' = bờ của owner, còn lại = đảo chung
  item_id    text not null,
  x          int not null check (x between 0 and 11),
  y          int not null check (y between 0 and 11),
  created_at timestamptz not null default now()
);
-- Mỗi ô chỉ một món: bờ nhà tính theo chủ, đảo chung tính theo cặp đôi
create unique index decor_home_cell   on public.decor (owner_id, x, y)          where island = 'home';
create unique index decor_island_cell on public.decor (couple_id, island, x, y) where island <> 'home';

create table public.inventory (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  item_id   text not null,
  qty       int not null default 0 check (qty >= 0),
  primary key (user_id, item_id)
);

create table public.collection (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  entry_id  text not null,                   -- 'item:shell', 'animal:crab', 'combo:rainbow'
  first_at  timestamptz not null default now(),
  primary key (user_id, entry_id)
);

-- Mỗi phần thưởng có giới hạn mang một key duy nhất, nên không thể nhận hai lần:
-- 'starter', 'beach:2026-11-05:0', 'combo:rainbow:2026-11-05', 'guest:<id>', 'meetup:2026-12-24'
create table public.claims (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  couple_id  uuid not null references public.couples (id) on delete cascade,
  key        text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

create table public.checkins (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  day       date not null,                   -- ngày theo giờ địa phương của người đó
  primary key (user_id, day)
);
create index on public.checkins (couple_id, day);

create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  from_id    uuid not null references public.profiles (id) on delete cascade,
  to_id      uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 300),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notes (couple_id, created_at desc);

-- ───────────── Mình là ai ─────────────
-- security definer để dùng trong RLS mà không bị đệ quy.

create function public.my_id() returns uuid
language sql stable security definer set search_path = public as $$
  select profile_id from public.devices where auth_id = auth.uid()
$$;

create function public.my_couple_id() returns uuid
language sql stable security definer set search_path = public as $$
  select couple_id from public.profiles where id = my_id()
$$;

-- ───────────── Vào resort ─────────────

-- Nối trình duyệt hiện tại với một người chơi
create function public._link_device(p_profile uuid) returns void
language sql security definer set search_path = public as $$
  insert into devices (auth_id, profile_id) values (auth.uid(), p_profile)
  on conflict (auth_id) do update set profile_id = excluded.profile_id, linked_at = now();
$$;

-- Tạo resort mới cho người chơi tên p_name. Trả về mã resort.
create function public.create_resort(p_name text) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code    text;
  v_couple  uuid;
  v_profile uuid;
begin
  if auth.uid() is null then raise exception 'Chưa có phiên đăng nhập'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Bạn chưa nhập tên'; end if;

  loop
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    exit when not exists (select 1 from couples where invite_code = v_code);
  end loop;

  insert into couples (invite_code) values (v_code) returning id into v_couple;
  insert into profiles (couple_id, display_name) values (v_couple, trim(p_name)) returning id into v_profile;
  perform _link_device(v_profile);
  return v_code;
end $$;

-- Vào resort bằng mã + tên:
-- - tên đã có trong resort → vào lại đúng người đó (máy mới, trình duyệt mới...)
-- - tên chưa có và resort còn chỗ → người thứ hai vào resort
create function public.enter_resort(p_code text, p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_couple  uuid;
  v_profile uuid;
begin
  if auth.uid() is null then raise exception 'Chưa có phiên đăng nhập'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Bạn chưa nhập tên'; end if;

  select id into v_couple from couples where invite_code = upper(trim(p_code));
  if v_couple is null then raise exception 'Mã resort không đúng'; end if;

  select id into v_profile from profiles
  where couple_id = v_couple and lower(display_name) = lower(trim(p_name));

  if v_profile is null then
    if (select count(*) from profiles where couple_id = v_couple) >= 2 then
      raise exception 'Resort này đã đủ hai người — kiểm tra lại tên của bạn nhé';
    end if;
    insert into profiles (couple_id, display_name) values (v_couple, trim(p_name)) returning id into v_profile;
  end if;

  perform _link_device(v_profile);
  return v_profile;
end $$;

-- ───────────── Túi đồ & phần thưởng ─────────────

-- Nội bộ: thêm đồ vào túi + ghi vào bộ sưu tập. Không cho client gọi trực tiếp.
create function public._give(p_user uuid, p_couple uuid, p_item text, p_n int) returns void
language sql security definer set search_path = public as $$
  insert into inventory (user_id, couple_id, item_id, qty) values (p_user, p_couple, p_item, p_n)
  on conflict (user_id, item_id) do update set qty = inventory.qty + excluded.qty;
  insert into collection (user_id, couple_id, entry_id) values (p_user, p_couple, 'item:' || p_item)
  on conflict do nothing;
$$;

-- Nhận phần thưởng một lần theo key. Trả về false nếu đã nhận rồi.
-- p_items: [{"id": "shell", "n": 1}], p_entries: ['animal:crab', 'combo:rainbow']
create function public.claim(p_key text, p_items jsonb default '[]', p_entries text[] default '{}')
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := my_id();
  v_couple uuid := my_couple_id();
  r record;
begin
  if v_couple is null then raise exception 'Bạn chưa vào resort'; end if;

  insert into claims (user_id, couple_id, key) values (v_me, v_couple, p_key)
  on conflict do nothing;
  if not found then return false; end if;

  for r in select * from jsonb_to_recordset(p_items) as x(id text, n int) loop
    perform _give(v_me, v_couple, r.id, coalesce(r.n, 1));
  end loop;

  insert into collection (user_id, couple_id, entry_id)
  select v_me, v_couple, e from unnest(p_entries) as e
  on conflict do nothing;
  return true;
end $$;

-- Ghi nhận đã gặp (khách, hiện tượng...) vào bộ sưu tập
create function public.collect(p_entries text[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_couple uuid := my_couple_id();
begin
  if v_couple is null then raise exception 'Bạn chưa vào resort'; end if;
  insert into collection (user_id, couple_id, entry_id)
  select my_id(), v_couple, e from unnest(p_entries) as e
  on conflict do nothing;
end $$;

-- ───────────── Trang trí ─────────────

create function public.place_decor(p_item text, p_island text, p_x int, p_y int) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_me     uuid := my_id();
  v_couple uuid := my_couple_id();
  v_id     uuid;
begin
  if v_couple is null then raise exception 'Bạn chưa vào resort'; end if;

  update inventory set qty = qty - 1
  where user_id = v_me and item_id = p_item and qty > 0;
  if not found then raise exception 'Trong túi không còn món này'; end if;

  -- Ô đã có đồ sẽ vi phạm unique index → cả hàm rollback, túi đồ không bị trừ
  insert into decor (couple_id, owner_id, island, item_id, x, y)
  values (v_couple, v_me, p_island, p_item, p_x, p_y)
  returning id into v_id;
  return v_id;
end $$;

create function public.move_decor(p_id uuid, p_x int, p_y int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update decor set x = p_x, y = p_y where id = p_id and owner_id = my_id();
  if not found then raise exception 'Không thể di chuyển món này'; end if;
end $$;

create function public.remove_decor(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_item   text;
  v_couple uuid;
begin
  delete from decor where id = p_id and owner_id = my_id()
  returning item_id, couple_id into v_item, v_couple;
  if v_item is null then raise exception 'Không thể cất món này'; end if;
  perform _give(my_id(), v_couple, v_item, 1);
end $$;

-- ───────────── Cây cầu ─────────────

-- Số tấm ván = số ngày cả hai cùng ghé. Không bao giờ giảm; ngày lỡ chỉ là tạm dừng.
create function public.bridge_planks() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from (
    select day from checkins where couple_id = my_couple_id()
    group by day having count(*) >= 2
  ) d
$$;

-- ───────────── RLS ─────────────

alter table public.couples    enable row level security;
alter table public.profiles   enable row level security;
alter table public.devices    enable row level security;
alter table public.decor      enable row level security;
alter table public.inventory  enable row level security;
alter table public.collection enable row level security;
alter table public.claims     enable row level security;
alter table public.checkins   enable row level security;
alter table public.notes      enable row level security;

create policy "đọc couple của mình" on public.couples
  for select using (id = my_couple_id());

create policy "đọc hồ sơ trong couple" on public.profiles
  for select using (couple_id = my_couple_id());
create policy "sửa hồ sơ của mình" on public.profiles
  for update using (id = my_id()) with check (id = my_id());

-- devices: không có policy → client không đọc/ghi trực tiếp, chỉ qua các hàm ở trên

-- Đồ đạc, túi, bộ sưu tập, phần thưởng: chỉ đọc; mọi thay đổi đi qua các hàm ở trên
create policy "đọc trong couple" on public.decor      for select using (couple_id = my_couple_id());
create policy "đọc trong couple" on public.inventory  for select using (couple_id = my_couple_id());
create policy "đọc trong couple" on public.collection for select using (couple_id = my_couple_id());
create policy "đọc trong couple" on public.claims     for select using (couple_id = my_couple_id());

create policy "đọc trong couple" on public.checkins for select using (couple_id = my_couple_id());
create policy "điểm danh của mình" on public.checkins
  for insert with check (user_id = my_id() and couple_id = my_couple_id());

create policy "đọc trong couple" on public.notes for select using (couple_id = my_couple_id());
create policy "gửi thư cho người ấy" on public.notes
  for insert with check (
    from_id = my_id()
    and couple_id = my_couple_id()
    and to_id in (select id from public.profiles where couple_id = my_couple_id() and id <> my_id())
  );
create policy "đánh dấu đã đọc" on public.notes
  for update using (to_id = my_id()) with check (to_id = my_id());

-- Quyền cột: không ai tự đổi resort của mình; thư chỉ được sửa read_at
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, city, lat, lon, tz) on public.profiles to authenticated;
revoke all on public.devices from anon, authenticated;
revoke update, delete on public.notes from anon, authenticated;
grant update (read_at) on public.notes to authenticated;

revoke execute on function public._give(uuid, uuid, text, int) from public, anon, authenticated;
revoke execute on function public._link_device(uuid) from public, anon, authenticated;
