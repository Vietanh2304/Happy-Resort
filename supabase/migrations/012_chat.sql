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
