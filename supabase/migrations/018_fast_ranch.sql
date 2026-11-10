-- 018: Chăn nuôi thu nhanh (tính theo phút) và được nhiều sản phẩm hơn mỗi lần
create or replace function public.ranch_collect2(p_id uuid, p_item text, p_n int, p_minutes int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_n < 1 or p_n > 30 or p_minutes < 1 or p_minutes > 4320 then raise exception 'Không hợp lệ'; end if;
  update ranch set collected_at = now()
  where id = p_id and couple_id = my_couple_id()
    and fed_at > now() - interval '30 hours'
    and (collected_at is null or collected_at < now() - make_interval(mins => p_minutes));
  if not found then return false; end if;
  perform _give(my_id(), my_couple_id(), p_item, p_n);
  return true;
end $$;
grant execute on function public.ranch_collect2(uuid, text, int, int) to authenticated;
