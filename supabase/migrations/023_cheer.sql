-- 023: Góc cổ vũ — ảnh cho show drone, lời nhắn drone, hũ sao động viên (lưu trong bảng kỷ niệm chung)
alter table public.memories drop constraint if exists memories_kind_check;
alter table public.memories add constraint memories_kind_check
  check (kind in ('photo', 'diary', 'qa', 'wish', 'xmasgift', 'lantern', 'ornament', 'postcard', 'dronepic', 'dronemsg', 'star'));

-- ảnh drone (JPEG đã thu nhỏ, ~50KB) được phép lớn hơn; các loại khác giữ giới hạn cũ
alter table public.memories drop constraint if exists memories_data_check;
alter table public.memories add constraint memories_data_check
  check (pg_column_size(data) < case when kind = 'dronepic' then 160000 else 4000 end);
