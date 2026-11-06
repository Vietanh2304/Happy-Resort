-- Resort hai bờ — 002: giữ chân (Phase 2)
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
