-- Resort hai bờ — 007: album ảnh chung, thư hẹn giờ, thú cưng chung, sinh nhật & ngày yêu nhau

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
