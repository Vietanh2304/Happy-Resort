-- 020: Kỷ niệm chung — album ảnh, nhật ký, câu hỏi mỗi ngày, lọ điều ước, quà Giáng Sinh, đèn Trung Thu, bưu thiếp du lịch
create table if not exists public.memories (
  id         uuid primary key default gen_random_uuid(),
  couple_id  uuid not null references public.couples (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('photo', 'diary', 'qa', 'wish', 'xmasgift', 'lantern', 'ornament', 'postcard')),
  day        date not null default current_date,
  data       jsonb not null default '{}'::jsonb check (pg_column_size(data) < 4000),
  open_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists memories_couple on public.memories (couple_id, kind, created_at desc);
alter table public.memories enable row level security;
drop policy if exists "xem kỷ niệm trong couple" on public.memories;
drop policy if exists "thêm kỷ niệm" on public.memories;
drop policy if exists "xoá kỷ niệm của mình" on public.memories;
create policy "xem kỷ niệm trong couple" on public.memories for select using (couple_id = my_couple_id());
create policy "thêm kỷ niệm" on public.memories for insert with check (couple_id = my_couple_id() and user_id = my_id());
create policy "xoá kỷ niệm của mình" on public.memories for delete using (user_id = my_id());
