-- Đồ bày lên mặt bàn/tủ lưu ô y + 100 (xem TOP_Y trong api.ts); phòng rộng 10×10.
-- Ràng buộc cũ chỉ cho 0..11 nên đặt đồ lên bàn bị lỗi "decor_y_check".
alter table public.decor drop constraint if exists decor_x_check;
alter table public.decor drop constraint if exists decor_y_check;
alter table public.decor add constraint decor_x_check check (x between 0 and 31);
alter table public.decor add constraint decor_y_check check (y between 0 and 131);
