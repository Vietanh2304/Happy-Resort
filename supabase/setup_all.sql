-- Hy's Resort — gộp 001 → 010 để dán một lần vào SQL Editor (chỉ dùng cho database chưa chạy file nào)

-- ═════════ migrations/001_core.sql ═════════
-- Hy's Resort — 001: lõi (Phase 1)
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


-- ═════════ migrations/002_retention.sql ═════════
-- Hy's Resort — 002: giữ chân (Phase 2)
-- Khách thú, câu hỏi mỗi ngày, điều ước, hẹn gặp.

create table public.guests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  couple_id  uuid not null references public.couples (id) on delete cascade,
  day        date not null,                  -- mỗi người một vị khách mỗi ngày (giờ địa phương)
  animal_id  text not null,
  island     text not null default 'home',
  arrived_at timestamptz not null default now(),
  left_at    timestamptz,
  review     text,
  stars      int check (stars between 1 and 5),
  unique (user_id, day)
);
create index on public.guests (couple_id, arrived_at desc);

create table public.question_answers (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  couple_id   uuid not null references public.couples (id) on delete cascade,
  day         date not null,                 -- câu hỏi của ngày nào
  question_id text not null,
  answer      text not null check (char_length(answer) between 1 and 500),
  created_at  timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.wishes (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 200),
  created_at timestamptz not null default now()
);

create table public.meetup (
  couple_id  uuid primary key references public.couples (id) on delete cascade,
  day        date not null,
  set_by     uuid not null references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now()
);

-- Câu trả lời của người ấy chỉ hiện khi mình cũng đã trả lời câu của ngày đó.
-- Hàm definer để policy không tự truy vấn lại chính bảng (tránh đệ quy RLS).
create function public.i_answered(p_day date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from question_answers where user_id = my_id() and day = p_day)
$$;

-- Cho biết người ấy đã trả lời chưa (không lộ nội dung)
create function public.partner_answered(p_day date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from question_answers
    where couple_id = my_couple_id() and user_id <> my_id() and day = p_day
  )
$$;

alter table public.guests           enable row level security;
alter table public.question_answers enable row level security;
alter table public.wishes           enable row level security;
alter table public.meetup           enable row level security;

create policy "đọc trong couple" on public.guests for select using (couple_id = my_couple_id());
create policy "khách của mình" on public.guests
  for insert with check (user_id = my_id() and couple_id = my_couple_id());
create policy "tiễn khách của mình" on public.guests
  for update using (user_id = my_id()) with check (user_id = my_id() and couple_id = my_couple_id());

create policy "đọc khi cả hai đã trả lời" on public.question_answers
  for select using (couple_id = my_couple_id() and (user_id = my_id() or i_answered(day)));
create policy "trả lời của mình" on public.question_answers
  for insert with check (user_id = my_id() and couple_id = my_couple_id());

create policy "đọc trong couple" on public.wishes for select using (couple_id = my_couple_id());
create policy "ước của mình" on public.wishes
  for insert with check (user_id = my_id() and couple_id = my_couple_id());

create policy "đọc trong couple" on public.meetup for select using (couple_id = my_couple_id());
create policy "đặt ngày gặp" on public.meetup
  for insert with check (couple_id = my_couple_id() and set_by = my_id());
create policy "đổi ngày gặp" on public.meetup
  for update using (couple_id = my_couple_id()) with check (couple_id = my_couple_id() and set_by = my_id());

-- Trả lời rồi thì không sửa/xóa; khách chỉ được cập nhật lúc rời đi
revoke update, delete on public.question_answers from anon, authenticated;
revoke delete on public.guests from anon, authenticated;
revoke update on public.guests from anon, authenticated;
grant update (left_at, review, stars) on public.guests to authenticated;


-- ═════════ migrations/003_cozy.sql ═════════
-- Hy's Resort — 003: nhân vật, vườn, nấu ăn, tặng quà

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


-- ═════════ migrations/004_town.sql ═════════
-- Hy's Resort — 004: làng chung, nhà gỗ chung, hũ xu chung

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


-- ═════════ migrations/005_farm.sql ═════════
-- Hy's Resort — 005: nông trại chung (trồng ở ô nào tùy thích, tưới, bón phân, thu hoạch chung)

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


-- ═════════ migrations/006_decor_rotate.sql ═════════
-- Hy's Resort — 006: xoay đồ trang trí (0 = hướng gốc, 1 = quay sang hướng kia)

alter table public.decor add column rot int not null default 0 check (rot in (0, 1));

create function public.place_decor2(p_item text, p_island text, p_x int, p_y int, p_rot int) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := place_decor(p_item, p_island, p_x, p_y);
  update decor set rot = p_rot where id = v_id;
  return v_id;
end $$;

create function public.move_decor2(p_id uuid, p_x int, p_y int, p_rot int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update decor set x = p_x, y = p_y, rot = p_rot
  where id = p_id and couple_id = my_couple_id() and (owner_id = my_id() or island <> 'home');
  if not found then raise exception 'Không thể di chuyển món này'; end if;
end $$;


-- ═════════ migrations/007_love.sql ═════════
-- Hy's Resort — 007: album ảnh chung, thư hẹn giờ, thú cưng chung, sinh nhật & ngày yêu nhau

-- ───────── Ngày đặc biệt ─────────
alter table public.profiles add column birthday date;          -- mỗi người tự đặt trong Cài đặt
alter table public.couples add column anniversary date;        -- ngày bắt đầu yêu nhau (chung)
grant update (birthday) on public.profiles to authenticated;      -- hồ sơ chỉ cho sửa từng cột được phép

create function public.set_anniversary(p_day date) returns void
language sql security definer set search_path = public as $$
  update couples set anniversary = p_day where id = my_couple_id();
$$;

-- ───────── Album ảnh chung ─────────
create table public.photos (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  taken_by   uuid not null references public.profiles (id) on delete cascade,
  scene      text not null default '',
  caption    text not null default '' check (char_length(caption) <= 120),
  data       text not null check (char_length(data) < 600000),   -- ảnh JPEG nhỏ (data URL)
  created_at timestamptz not null default now()
);
create index photos_couple on public.photos (couple_id, created_at desc);
alter table public.photos enable row level security;
create policy "xem album chung" on public.photos for select using (couple_id = my_couple_id());
create policy "thêm ảnh" on public.photos for insert with check (couple_id = my_couple_id() and taken_by = my_id());
create policy "sửa chú thích" on public.photos for update using (couple_id = my_couple_id()) with check (couple_id = my_couple_id());
create policy "xóa ảnh" on public.photos for delete using (couple_id = my_couple_id());

-- ───────── Thư hẹn giờ: đúng ngày mới đọc được ─────────
create table public.capsules (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  from_id    uuid not null references public.profiles (id) on delete cascade,
  to_id      uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  open_on    date not null,
  created_at timestamptz not null default now(),
  opened_at  timestamptz
);
alter table public.capsules enable row level security;
create policy "gửi thư hẹn giờ" on public.capsules for insert with check (
  couple_id = my_couple_id() and from_id = my_id()
  and to_id in (select id from profiles where couple_id = my_couple_id())
);
-- Không có policy đọc: chỉ đọc qua hàm dưới đây, nội dung bị giấu tới đúng ngày (theo giờ của người nhận)
create function public.my_capsules()
returns table (id uuid, from_id uuid, to_id uuid, body text, open_on date, created_at timestamptz, opened_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id, c.from_id, c.to_id,
         case when c.from_id = my_id() or c.open_on <= (now() at time zone coalesce(p.tz, 'UTC'))::date then c.body end,
         c.open_on, c.created_at, c.opened_at
  from capsules c join profiles p on p.id = c.to_id
  where c.couple_id = my_couple_id()
  order by c.open_on, c.created_at;
$$;
create function public.open_capsule(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update capsules c set opened_at = now()
  from profiles p
  where c.id = p_id and c.to_id = my_id() and p.id = c.to_id and c.opened_at is null
    and c.open_on <= (now() at time zone coalesce(p.tz, 'UTC'))::date;
$$;

-- ───────── Thú cưng chung ─────────
create table public.pets (
  couple_id  uuid primary key references public.couples (id) on delete cascade,
  kind       text not null,
  name       text not null check (char_length(name) between 1 and 20),
  love       int not null default 0,
  fed_at     timestamptz,
  adopted_at timestamptz not null default now()
);
alter table public.pets enable row level security;
create policy "đọc trong couple" on public.pets for select using (couple_id = my_couple_id());

create function public.pet_adopt(p_kind text, p_name text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if my_couple_id() is null then raise exception 'Bạn chưa vào resort'; end if;
  insert into pets (couple_id, kind, name) values (my_couple_id(), p_kind, trim(p_name));
exception when unique_violation then
  raise exception 'Hai bạn đã nuôi một bé rồi';
end $$;

-- Chăm sóc: cho ăn / vuốt ve / dắt đi dạo → thêm điểm thân thiết
create function public.pet_care(p_love int, p_feed boolean) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if p_love < 0 or p_love > 3 then raise exception 'Không hợp lệ'; end if;
  update pets set love = love + p_love, fed_at = case when p_feed then now() else fed_at end
  where couple_id = my_couple_id() returning love into v;
  if v is null then raise exception 'Chưa nuôi thú cưng'; end if;
  return v;
end $$;

create function public.pet_rename(p_name text) returns void
language sql security definer set search_path = public as $$
  update pets set name = trim(p_name) where couple_id = my_couple_id();
$$;

-- ───────── Lịch: ngày hai bạn tự ghi ─────────
create table public.special_days (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  day        date not null,
  title      text not null check (char_length(title) between 1 and 40),
  icon       text not null default '💕',
  theme      text not null default 'romantic' check (theme in ('romantic', 'party', 'calm', 'tet', 'lantern', 'winter')),
  yearly     boolean not null default true,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.special_days enable row level security;
create policy "xem lịch chung" on public.special_days for select using (couple_id = my_couple_id());
create policy "ghi ngày" on public.special_days for insert with check (couple_id = my_couple_id() and created_by = my_id());
create policy "xóa ngày" on public.special_days for delete using (couple_id = my_couple_id());

-- ───────── Đồ trang trí ngày lễ do hai bạn tự bày (chỉ hiện đúng ngày đó) ─────────
create table public.fest_decor (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  day        date not null,
  icon       text not null check (char_length(icon) <= 16),
  x          int not null check (x between 0 and 400),
  y          int not null check (y between 0 and 300),
  placed_by  uuid not null references public.profiles (id) on delete cascade
);
create index fest_decor_day on public.fest_decor (couple_id, day);
alter table public.fest_decor enable row level security;
create policy "xem" on public.fest_decor for select using (couple_id = my_couple_id());
create policy "bày" on public.fest_decor for insert with check (couple_id = my_couple_id() and placed_by = my_id());
create policy "gỡ" on public.fest_decor for delete using (couple_id = my_couple_id());


-- ═════════ migrations/008_family.sql ═════════
-- Hy's Resort — 008: em bé của hai bạn (cò mang tới khi cả hai cùng muốn), chăm bé lớn dần theo ngày thật

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


-- ═════════ migrations/009_media.sql ═════════
-- Hy's Resort — 009: trạng thái "đang làm gì", tin nhắn thoại, ảnh album lưu ở Storage

-- ───────── Trạng thái ─────────
alter table public.profiles add column status text check (char_length(status) <= 40);
alter table public.profiles add column status_at timestamptz;
-- hồ sơ chỉ cho sửa từng cột được phép (birthday nhắc lại cho chắc nếu 007 chạy bản cũ)
grant update (status, status_at, birthday) on public.profiles to authenticated;

-- ───────── Tin nhắn thoại (file ghi âm nằm trong Storage, thư chỉ giữ đường dẫn) ─────────
alter table public.notes add column voice_path text;
alter table public.notes add column voice_secs int;
grant insert (voice_path, voice_secs) on public.notes to authenticated;

-- ───────── Ảnh album: lưu file ở Storage, bảng chỉ giữ đường dẫn (ảnh cũ vẫn đọc từ cột data) ─────────
alter table public.photos add column path text;
alter table public.photos alter column data drop not null;

-- ───────── Kho file riêng của mỗi cặp: memories/<couple_id>/... ─────────
insert into storage.buckets (id, name, public) values ('memories', 'memories', false) on conflict (id) do nothing;

create policy "cặp đôi xem file của mình" on storage.objects for select
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy "cặp đôi tải file lên" on storage.objects for insert
  with check (bucket_id = 'memories' and (storage.foldername(name))[1] = public.my_couple_id()::text);
create policy "cặp đôi xóa file" on storage.objects for delete
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = public.my_couple_id()::text);

-- ───────── Thêm tiền: lương mỗi ngày, quà mở hũ, thưởng khi chơi cùng nhau ─────────
-- Mỗi khoản thưởng gắn với một key (mỗi người nhận một lần cho mỗi key), tối đa 50000 xu một lần.
create function public.grant_coins(p_key text, p_amount int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_amount < 1 or p_amount > 50000 then raise exception 'Thưởng không hợp lệ'; end if;
  if my_couple_id() is null then return false; end if;
  if exists (select 1 from claims where user_id = my_id() and key = p_key) then return false; end if;
  insert into claims (user_id, couple_id, key) values (my_id(), my_couple_id(), p_key);
  update couples set coins = coins + p_amount where id = my_couple_id();
  return true;
end $$;

-- Thưởng "cả hai cùng ghé" lớn hơn
create or replace function public.together_bonus(p_day date, p_amount int) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_couple uuid := my_couple_id();
begin
  if p_amount < 0 or p_amount > 1000 then raise exception 'Thưởng không hợp lệ'; end if;
  if (select count(*) from checkins where couple_id = v_couple and day = p_day) < 2 then return false; end if;
  if exists (select 1 from claims where couple_id = v_couple and key = 'together:' || p_day) then return false; end if;
  insert into claims (user_id, couple_id, key) values (my_id(), v_couple, 'together:' || p_day);
  update couples set coins = coins + p_amount where id = v_couple;
  return true;
end $$;



-- ═════════ migrations/010_fridge.sql ═════════
-- Hy's Resort — 010: tủ lạnh chung trong bếp (đồ của cả hai, ai cũng lấy được)

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

-- 011: xóa ngày gặp
create policy "xóa ngày gặp" on public.meetup for delete using (couple_id = my_couple_id());


-- ═════════ migrations/012_chat.sql ═════════
-- Hy's Resort — 012: khung chat chung (tin nhắn lưu lại, người kia offline vẫn đọc được khi vào)
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  from_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index messages_couple_time on public.messages (couple_id, created_at desc);
alter table public.messages enable row level security;
create policy "đọc tin nhắn trong couple" on public.messages for select using (couple_id = my_couple_id());
create policy "gửi tin nhắn" on public.messages for insert with check (couple_id = my_couple_id() and from_id = my_id());
create policy "thu hồi tin của mình" on public.messages for delete using (from_id = my_id());

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
