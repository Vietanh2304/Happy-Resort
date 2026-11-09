-- 015: Mua nhiều món một lần (trừ xu và cộng đồ trong cùng một lệnh, không bị lệch số lượng)
create or replace function public.buy_items(p_item text, p_price int, p_n int) returns int
language plpgsql security definer set search_path = public as $$
declare v_coins int;
begin
  if p_price < 1 or p_price > 5000 or p_n < 1 or p_n > 99 then raise exception 'Giá hoặc số lượng không hợp lệ'; end if;
  update couples set coins = coins - p_price * p_n where id = my_couple_id() and coins >= p_price * p_n returning coins into v_coins;
  if v_coins is null then raise exception 'Hũ xu chưa đủ'; end if;
  perform _give(my_id(), my_couple_id(), p_item, p_n);
  return v_coins;
end $$;
grant execute on function public.buy_items(text, int, int) to authenticated;
