-- 024: Ảnh show drone là của chung — ai trong hai người cũng xoá/thay được (trước đây chỉ người đăng mới xoá được)
drop policy if exists "xoá ảnh drone trong couple" on public.memories;
create policy "xoá ảnh drone trong couple" on public.memories for delete
  using (couple_id = my_couple_id() and kind = 'dronepic');

-- Quần áo ba mẹ may cho các con: bé đang mặc bộ nào (null = đồ thường)
alter table public.kids add column if not exists outfit jsonb;
create or replace function public.kid_wear(p_kid uuid, p_outfit jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_outfit is not null and pg_column_size(p_outfit) > 2000 then raise exception 'Bộ đồ không hợp lệ'; end if;
  update kids set outfit = p_outfit where id = p_kid and couple_id = my_couple_id();
  if not found then raise exception 'Không thấy bé'; end if;
end $$;
grant execute on function public.kid_wear(uuid, jsonb) to authenticated;
