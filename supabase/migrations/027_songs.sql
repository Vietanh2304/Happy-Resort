-- 027: Bài hát của cặp đôi ('song'): file nhạc nằm trong kho riêng memories/<couple_id>/songs/, lời lưu trong data
alter table public.memories drop constraint if exists memories_kind_check;
alter table public.memories add constraint memories_kind_check
  check (kind in ('photo', 'diary', 'qa', 'wish', 'xmasgift', 'lantern', 'ornament', 'postcard', 'dronepic', 'dronemsg', 'star', 'lovenote', 'song'));
