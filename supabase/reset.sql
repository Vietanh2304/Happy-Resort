-- Xóa toàn bộ dữ liệu và schema của Hy's Resort để chạy lại migrations từ đầu.
-- CHỈ dùng khi đã lỡ chạy bản SQL cũ (bản đăng nhập bằng email). Mọi dữ liệu game sẽ mất.

drop trigger if exists on_auth_user_created on auth.users;
-- Kho file ảnh & ghi âm (009)
drop policy if exists "cặp đôi xem file của mình" on storage.objects;
drop policy if exists "cặp đôi tải file lên" on storage.objects;
drop policy if exists "cặp đôi xóa file" on storage.objects;
delete from storage.objects where bucket_id = 'memories';
delete from storage.buckets where id = 'memories';
drop table if exists
  public.kid_scores, public.jobs, public.outfits, public.ranch, public.messages, public.fridge, public.kids, public.fest_decor, public.special_days, public.pets, public.capsules, public.photos, public.farm, public.garden, public.meetup, public.wishes, public.question_answers, public.guests,
  public.notes, public.checkins, public.claims, public.collection, public.inventory,
  public.decor, public.devices, public.profiles, public.couples
  cascade;
drop function if exists
  public.handle_new_user(), public.create_couple(), public.join_couple(text),
  public.create_resort(text), public.enter_resort(text, text), public._link_device(uuid),
  public.my_id(), public.my_couple_id(), public._give(uuid, uuid, text, int),
  public.claim(text, jsonb, text[]), public.collect(text[]),
  public.place_decor(text, text, int, int), public.move_decor(uuid, int, int), public.remove_decor(uuid),
  public.bridge_planks(), public.i_answered(date), public.partner_answered(date),
  public.send_gift(text, text), public.craft(jsonb, jsonb),
  public.sell_item(text, int, int), public.buy_item(text, int), public.together_bonus(date, int),
  public.farm_plant(int, text), public.farm_water(int, date), public.farm_fertilize(int),
  public.farm_harvest(int, int), public.farm_clear(int),
  public.place_decor2(text, text, int, int, int), public.move_decor2(uuid, int, int, int),
  public.ranch_buy(text, int, text), public.ranch_feed(uuid), public.ranch_collect(uuid, text, int, int), public.ranch_sell(uuid, int),
  public.outfit_make(text, jsonb, jsonb), public.outfit_sell(uuid, int),
  public.fridge_put(jsonb), public.fridge_take(text, int), public.fridge_use(jsonb),
  public.set_anniversary(date), public.my_capsules(), public.open_capsule(uuid),
  public.pet_adopt(text, text), public.pet_care(int, boolean), public.pet_rename(text),
  public.kid_plan(date), public.kid_name(uuid, text, text), public.kid_care(uuid, text, int), public.kid_milestone(uuid, text),
  public.grant_coins(text, int)
  cascade;
