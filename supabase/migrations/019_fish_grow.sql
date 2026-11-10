-- 019: Cá nuôi lớn rồi bán chính con cá; cho ăn đủ 2 lần thì đẻ thêm 1 lứa cá con
alter table public.ranch add column if not exists feeds int not null default 0;
alter table public.ranch add column if not exists spawned int not null default 0;

-- Cho ăn: đếm số lần; cá phải cách lần trước 20 tiếng mới tính
create or replace function public.ranch_feed(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update ranch set fed_at = now(), feeds = feeds + 1
  where id = p_id and couple_id = my_couple_id()
    and (kind not in ('carp', 'tilapia', 'catfish', 'koi') or fed_at is null or fed_at < now() - interval '20 hours');
  if not found then raise exception 'Chưa tới giờ cho ăn'; end if;
end $$;

-- Vớt cá con: cứ 2 lần cho ăn được 1 lứa (1 con giống mới cùng loại)
create or replace function public.ranch_spawn(p_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_kind text; v_id uuid;
begin
  if (select count(*) from ranch where couple_id = my_couple_id()) >= 24 then raise exception 'Trang trại đã đầy'; end if;
  update ranch set spawned = spawned + 1
  where id = p_id and couple_id = my_couple_id() and kind in ('carp', 'tilapia', 'catfish', 'koi') and spawned < feeds / 2
  returning kind into v_kind;
  if v_kind is null then raise exception 'Cá chưa đẻ lứa mới'; end if;
  insert into ranch (couple_id, kind, bought_by) values (my_couple_id(), v_kind, my_id()) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.ranch_spawn(uuid) to authenticated;
