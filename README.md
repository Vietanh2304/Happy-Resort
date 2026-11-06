# 🏝️ Resort hai bờ

Game pixel nhỏ, ấm áp cho hai người yêu xa. Hai nhân vật cùng sống trong một làng ven biển: có căn nhà gỗ chung, cửa hàng, rạp phim, nhà hàng và bãi biển. Bầu trời trong game theo thời tiết và giờ thật nơi mỗi người đang ở. Cửa sổ nhà gỗ nhìn ra trời bên người kia.

**Stack:** Vite + React + TypeScript · Supabase (đăng nhập ẩn danh, Postgres + RLS, Realtime) · Open-Meteo (không cần API key) · WebRTC (chia sẻ màn hình, gọi camera) · pixel art vẽ bằng code.

## Có gì trong làng

| Nơi | Làm gì |
|---|---|
| 🏘️ **Làng** | Đi lại, thấy nhân vật của người ấy khi cả hai cùng ở đây. Vườn 6 ô (mỗi người 3 ô): gieo hạt, tưới mỗi ngày; trời thật mưa thì vườn tự được tưới. Khách thú ghé chơi, chạm để vuốt ve. |
| 🏡 **Nhà gỗ** | Nhà chung. Hai người cùng bày đồ trên lưới 8×4. Bếp để nấu cá và rau thành món ăn. Cửa sổ nhìn ra trời bên người ấy. Lịch đếm số ngày bên nhau. |
| 🛍️ **Cửa hàng** | Mèo bán hàng. Dùng **hũ xu chung** mua đồ trang trí; bán cá, rau, món ăn và đồ nhặt được để lấy xu. |
| 🏖️ **Bãi biển** | Nhặt đồ lấp lánh (3 món/ngày, tùy thời tiết). Câu cá ở cầu tàu (8 lượt/ngày, loại cá tùy thời tiết và giờ thật). |
| 🎬 **Rạp phim** | Chia sẻ màn hình (có tiếng) lên màn chiếu cho người ấy cùng xem, kèm chat. |
| 🕯️ **Nhà hàng** | Dọn món tự nấu ra bàn, cụng ly, bật camera ăn tối cùng nhau, chat. |

**Mọi lúc:** chạm vào nhân vật của mình để gửi biểu cảm (người ấy thấy ngay). Túi đồ có nút tặng quà qua hòm thư. Ngoài ra có câu hỏi mỗi ngày (câu trả lời ẩn cho tới khi cả hai cùng trả lời), sổ tay sưu tập, đếm ngược ngày gặp (đúng ngày có pháo hoa và kỷ vật), và hiện tượng đặc biệt khi thời tiết hai nơi kết hợp: cầu vồng, cá voi phát sáng, biển đóng băng, mưa sao băng (cùng chạm trong 3 giây để ước).

**Hũ xu:** bắt đầu với 50 xu. Kiếm thêm bằng cách bán đồ, và mỗi ngày cả hai cùng mở game được thưởng thêm 20 xu.

## 1. Cài Supabase

1. Tạo project mới ở [supabase.com](https://supabase.com).
2. Vào **SQL Editor**, chạy lần lượt các file trong `supabase/migrations/`: `001_core.sql` → `002_retention.sql` → `003_cozy.sql` → `004_town.sql` → `005_farm.sql` → `006_decor_rotate.sql` → `007_love.sql` → `008_family.sql` → `009_media.sql`.

   (Hoặc dùng Supabase CLI: `supabase link` rồi `supabase db push`.)

   Đã chạy 001 và 002 từ trước thì chỉ cần chạy thêm 003 và 004. Nếu lỡ chạy bản SQL cũ (bản đăng nhập bằng email), chạy `supabase/reset.sql` để xóa sạch, rồi chạy lại từ 001.
3. **Authentication → Sign In / Providers → User Signups:** bật **Allow anonymous sign-ins** rồi bấm **Save changes**.
4. Lấy **Project URL** và **key** (nút **Connect** → React / Vite, hoặc **Project Settings → API Keys**). Key dạng `sb_publishable_…` hay `eyJ…` đều được.

### Đăng nhập hoạt động thế nào

- Người đầu tiên chọn **Tạo resort mới** và nhập tên, sẽ nhận được **mã resort** 6 ký tự.
- Người thứ hai chọn **Vào resort** rồi nhập mã đó cùng tên của mình.
- Sang máy khác: chọn **Vào resort**, nhập mã cùng đúng tên của mình là vào lại, không mất gì.
- Mã resort luôn xem được trong **Cài đặt**.

> Mã + tên chính là "chìa khóa", không có mật khẩu. Đừng đưa mã resort cho người khác.

## 2. Chạy ở máy

Cần Node.js 18 trở lên.

```bash
cd resort-hai-bo
cp .env.example .env      # điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:5173
npm test                  # unit test phần luật chơi
```

Để thử một mình: mở game ở hai trình duyệt (hoặc thêm một cửa sổ ẩn danh). Một bên tạo resort, bên kia vào bằng mã resort với tên khác.

## 3. Deploy lên Vercel

1. Import repo lên Vercel, đặt **Root Directory** là `resort-hai-bo`. Framework sẽ tự nhận là Vite.
2. Thêm Environment Variables `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
3. Deploy. Chia sẻ màn hình, camera, mic và ghi âm cần HTTPS; Vercel đã có sẵn.

## 4. Cài lên điện thoại như một app

- **Android (Chrome):** mở link game → Cài đặt trong game → "📲 Cài game ra màn hình chính" (hoặc menu ⋮ → Cài đặt ứng dụng).
- **iPhone (Safari):** bấm nút Chia sẻ → "Thêm vào MH chính".
- Trong Cài đặt bật **🔔 thông báo** để được báo khi người ấy vào làng, nhắn tin, gửi thư, rủ chơi, hoặc bé cần chăm (khi game đang mở nền).

## Lưu ý về rạp phim và gọi video

- Hình và tiếng đi **thẳng giữa hai máy** (WebRTC), Supabase chỉ dùng để "bắt tay". Kết nối dùng máy chủ STUN công khai của Google. Nếu mạng của một bên quá chặt (một số mạng 4G, mạng công ty) có thể không kết nối được; khi đó đăng ký một máy chủ TURN miễn phí (metered.ca Open Relay hoặc Cloudflare) rồi điền `VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL` vào `.env` (hoặc Environment Variables trên Vercel). Không cần sửa code.
- **Chia sẻ màn hình** chỉ làm được trên máy tính (Chrome/Edge). Điện thoại vẫn xem được. Khi chia sẻ, chọn tab phim và tick **Chia sẻ âm thanh**.
- Netflix và các web có bản quyền thường hiện **màn đen** khi bị chia sẻ, đó là chặn từ phía họ.

## Thêm nội dung mới (không cần sửa code)

Toàn bộ nội dung nằm trong **`src/content/content.json`**:

| Khóa | Nội dung |
|---|---|
| `items` | đồ vật: `kind` là `decor` (bày trong nhà), `trinket`, `fish`, `crop`, `dish`; `rarity: "rare"` là đồ hiếm. Icon emoji tự được chuyển thành pixel art. |
| `shop`, `economy` | đồ bán ở cửa hàng và giá; giá bán theo loại; thưởng ngày cả hai cùng ghé |
| `animals` | khách thú: `base`, `attracts` (đồ trong nhà gỗ → điểm hấp dẫn), `gifts`, `reviews`, `stayHours` |
| `fishing`, `garden`, `recipes` | cá theo thời tiết/giờ, cây trồng và số ngày tưới, công thức nấu ăn |
| `weatherPools`, `seasons` | đồ nhặt ở bãi biển theo thời tiết và theo mùa |
| `combos` | hiện tượng khi thời tiết hai nơi kết hợp (`both` / `pair` theo `weather` / `phase`) |
| `questions`, `emotes`, `dinner`, `starterKit`, `meetup` | câu hỏi mỗi ngày, biểu cảm, món miễn phí ở nhà hàng, quà chào mừng, kỷ vật ngày gặp |

`npm test` sẽ báo nếu có id nào được tham chiếu mà không tồn tại.

## Cách hoạt động

- **Thế giới:** bản đồ và tọa độ các cửa nằm trong `src/lib/world.ts`. Việc ai đang ở đâu, đứng chỗ nào, đang câu cá hay chat gì được gửi trực tiếp qua kênh realtime của cặp đôi, không lưu DB.
- **Ngày** tính theo giờ địa phương từng người. "Ngày bên nhau" là số ngày cả hai cùng mở game, không bao giờ bị trừ.
- **Roll hằng ngày** (nhặt đồ, cá, khách, câu hỏi) dùng RNG có seed `người chơi + ngày`, nên tải lại trang vẫn ra cùng kết quả.
- **Phần thưởng giới hạn** đi qua hàm `claim(key, ...)`. Mỗi key chỉ nhận được một lần.
- **Bảo mật:** RLS chỉ cho thành viên của cặp đọc dữ liệu của cặp. Túi đồ, hũ xu và đồ trang trí chỉ thay đổi qua các hàm `security definer`.

## Cấu trúc

```
supabase/migrations/   schema, RLS, các hàm RPC (001 → 004)
src/content/           content.json: toàn bộ nội dung game
src/lib/               world (bản đồ), sprites/townSprites/pixel (pixel art), game (luật chơi), api, realtime, rtc, useLive…
src/components/        Game, World (vẽ các cảnh), Avatar, Stage, Rooms (rạp/nhà hàng), ShopSheet, KitchenSheet, …
```
