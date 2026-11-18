-- 026: Lời nhắn sau đêm thân mật ('lovenote') lưu cùng nhật ký kỷ niệm
alter table public.memories drop constraint if exists memories_kind_check;
alter table public.memories add constraint memories_kind_check
  check (kind in ('photo', 'diary', 'qa', 'wish', 'xmasgift', 'lantern', 'ornament', 'postcard', 'dronepic', 'dronemsg', 'star', 'lovenote'));
