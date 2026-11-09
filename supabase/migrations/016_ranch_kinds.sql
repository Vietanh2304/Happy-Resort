-- 016: Cho phép nuôi thêm ngựa và cá ao (bảng ranch trước đây chỉ nhận 7 loài)
alter table public.ranch drop constraint if exists ranch_kind_check;
alter table public.ranch add constraint ranch_kind_check
  check (kind in ('chicken', 'duck', 'cow', 'goat', 'sheep', 'silkworm', 'bee', 'horse', 'carp', 'tilapia', 'catfish', 'koi'));
