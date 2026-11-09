-- 017: Thêm ngựa bạch và ngựa ô
alter table public.ranch drop constraint if exists ranch_kind_check;
alter table public.ranch add constraint ranch_kind_check
  check (kind in ('chicken', 'duck', 'cow', 'goat', 'sheep', 'silkworm', 'bee', 'horse', 'horse_white', 'horse_black', 'carp', 'tilapia', 'catfish', 'koi'));
