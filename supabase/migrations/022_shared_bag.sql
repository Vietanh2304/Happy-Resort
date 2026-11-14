-- Túi đồ chung của cặp đôi.
-- Mỗi người vẫn có hàng inventory riêng (mọi hàm cũ giữ nguyên), nhưng mọi thay đổi
-- số lượng ở túi người này được cộng/trừ y hệt sang túi người kia → hai túi luôn bằng nhau.

drop trigger if exists mirror_bag on public.inventory;   -- chạy lại file không bị cộng đôi

-- 1) Gộp túi hiện có: mỗi món = tổng của cả hai người
with s as (
  select couple_id, item_id, sum(qty)::int as qty from public.inventory group by couple_id, item_id
), pairs as (
  select p.id as user_id, s.couple_id, s.item_id, s.qty
  from s join public.profiles p on p.couple_id = s.couple_id
)
insert into public.inventory (user_id, couple_id, item_id, qty)
select user_id, couple_id, item_id, qty from pairs
on conflict (user_id, item_id) do update set qty = excluded.qty;

-- 2) Trigger soi gương: thay đổi bao nhiêu thì túi người kia đổi bấy nhiêu
create or replace function public._mirror_bag() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  d int;
  r record;
begin
  if pg_trigger_depth() > 1 then return null; end if;   -- tránh vòng lặp gương ↔ gương
  if tg_op = 'INSERT' then d := new.qty;
  elsif tg_op = 'UPDATE' then d := new.qty - old.qty;
  else d := -old.qty; end if;
  if d = 0 then return null; end if;
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  insert into inventory (user_id, couple_id, item_id, qty)
  select p.id, r.couple_id, r.item_id, greatest(d, 0)
  from profiles p where p.couple_id = r.couple_id and p.id <> r.user_id
  on conflict (user_id, item_id) do update set qty = greatest(inventory.qty + d, 0);
  return null;
end $$;

create trigger mirror_bag after insert or update of qty or delete on public.inventory
  for each row execute function public._mirror_bag();
