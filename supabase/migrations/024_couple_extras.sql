-- 024: Ảnh show drone là của chung — ai trong hai người cũng xoá/thay được (trước đây chỉ người đăng mới xoá được)
drop policy if exists "xoá ảnh drone trong couple" on public.memories;
create policy "xoá ảnh drone trong couple" on public.memories for delete
  using (couple_id = my_couple_id() and kind = 'dronepic');
