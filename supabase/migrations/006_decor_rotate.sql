-- Hy's Resort — 006: xoay đồ trang trí (0 = hướng gốc, 1 = quay sang hướng kia)

alter table public.decor add column rot int not null default 0 check (rot in (0, 1));

create function public.place_decor2(p_item text, p_island text, p_x int, p_y int, p_rot int) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := place_decor(p_item, p_island, p_x, p_y);
  update decor set rot = p_rot where id = v_id;
  return v_id;
end $$;

create function public.move_decor2(p_id uuid, p_x int, p_y int, p_rot int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update decor set x = p_x, y = p_y, rot = p_rot
  where id = p_id and couple_id = my_couple_id() and (owner_id = my_id() or island <> 'home');
  if not found then raise exception 'Không thể di chuyển món này'; end if;
end $$;
