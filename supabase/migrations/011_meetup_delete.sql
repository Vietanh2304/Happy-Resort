-- Cho phép xóa ngày gặp nhau (vd: lỡ đặt thử, hoặc đổi kế hoạch)
create policy "xóa ngày gặp" on public.meetup for delete using (couple_id = my_couple_id());
