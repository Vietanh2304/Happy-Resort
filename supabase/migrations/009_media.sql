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
