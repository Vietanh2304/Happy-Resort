// Quà mỗi ngày (mỗi ngày một bất ngờ) + đố vui mỗi ngày (5 câu, đúng câu nào được xu câu đó).
import { seeded } from './rng';

export type Surprise =
  | { kind: 'coins'; n: number; title: string; note: string }
  | { kind: 'item'; id: string; n: number; title: string; note: string };

const DECOR = ['lantern', 'chime', 'guitar', 'kite', 'lotus', 'coral', 'firefly_jar', 'moon_flower', 'star_lantern', 'teapot', 'radio', 'sunflower', 'fern', 'candle', 'palm', 'umbrella'];
const PRODUCE = ['carrot', 'potato', 'tomato', 'corn', 'strawberry', 'grape', 'rose_bloom', 'tulip_bloom', 'sunflower_bloom', 'lavender'];
const TREATS = ['pearl', 'seaglass', 'starfish', 'shell', 'feather', 'coconut', 'balloon', 'mooncake', 'pineapple'];
const NOTES = [
  'Hôm nay nhớ uống đủ nước nha 💧', 'Có người đang nghĩ về bạn đó 💭', 'Một ngày thật xinh như bạn ✨', 'Cười lên nào, nụ cười của bạn đáng giá lắm 😊',
  'Khoảng cách chỉ là con số 💞', 'Ăn sáng chưa đó? 🍞', 'Hôm nay làm được một việc nhỏ thôi cũng giỏi rồi 🌱', 'Nhắn cho người ấy một câu dễ thương đi 💌',
];

/** Bất ngờ của ngày hôm nay (mỗi người một kiểu, cố định theo ngày) */
export function surpriseOf(userId: string, date: string): Surprise {
  const r = seeded(`gift:${userId}:${date}`);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const note = pick(NOTES);
  const sunday = new Date(`${date}T12:00:00`).getDay() === 0;
  const roll = r();
  if (roll < 0.05) return { kind: 'coins', n: 1000, title: '🌟 Trúng độc đắc! +1000 xu', note };
  if (roll < 0.45) { const n = (sunday ? 2 : 1) * (80 + Math.floor(r() * 9) * 25); return { kind: 'coins', n, title: `🪙 Túi xu +${n}${sunday ? ' (chủ nhật nhân đôi)' : ''}`, note }; }
  if (roll < 0.7) { const id = pick(PRODUCE), n = 3 + Math.floor(r() * 3); return { kind: 'item', id, n, title: `🧺 Giỏ nông sản tươi ×${n}`, note }; }
  if (roll < 0.88) return { kind: 'item', id: pick(DECOR), n: 1, title: '🎀 Một món đồ trang trí', note };
  const id = pick(TREATS); return { kind: 'item', id, n: 2, title: '🎐 Quà nhỏ lấp lánh ×2', note };
}

// ───────── Đố vui mỗi ngày ─────────

export interface QuizQ { q: string; a: string[]; ok: number }
const BANK: QuizQ[] = [
  { q: 'Thủ đô của Hàn Quốc là?', a: ['Busan', 'Seoul', 'Incheon'], ok: 1 },
  { q: 'Tòa nhà 101 tầng nổi tiếng ở Đài Bắc tên là?', a: ['Taipei 101', 'Lotte Tower', 'Landmark 81'], ok: 0 },
  { q: 'Món "kimchi" làm chủ yếu từ rau gì?', a: ['Bắp cải thảo', 'Rau muống', 'Xà lách'], ok: 0 },
  { q: 'Trà sữa trân châu bắt nguồn từ đâu?', a: ['Nhật Bản', 'Đài Loan', 'Thái Lan'], ok: 1 },
  { q: 'Vịnh Hạ Long thuộc tỉnh nào?', a: ['Quảng Ninh', 'Hải Phòng', 'Ninh Bình'], ok: 0 },
  { q: 'Chữ viết của tiếng Hàn gọi là?', a: ['Kanji', 'Hangul', 'Hiragana'], ok: 1 },
  { q: 'Hành tinh lớn nhất Hệ Mặt Trời?', a: ['Sao Thổ', 'Trái Đất', 'Sao Mộc'], ok: 2 },
  { q: 'Con vật nào ngủ đứng được?', a: ['Ngựa', 'Mèo', 'Thỏ'], ok: 0 },
  { q: 'Nước sôi ở bao nhiêu độ C (ở mặt biển)?', a: ['90°C', '100°C', '120°C'], ok: 1 },
  { q: 'Một năm thường có bao nhiêu ngày?', a: ['360', '365', '366'], ok: 1 },
  { q: 'Phở là món ăn nổi tiếng của nước nào?', a: ['Việt Nam', 'Trung Quốc', 'Lào'], ok: 0 },
  { q: 'Đảo Jeju thuộc nước nào?', a: ['Nhật Bản', 'Hàn Quốc', 'Đài Loan'], ok: 1 },
  { q: '"Saranghae" trong tiếng Hàn nghĩa là?', a: ['Cảm ơn', 'Xin chào', 'Anh yêu em / Em yêu anh'], ok: 2 },
  { q: '"Wo ai ni" (我愛你) nghĩa là?', a: ['Tôi yêu bạn', 'Tôi đói', 'Tạm biệt'], ok: 0 },
  { q: 'Cầu Vàng có đôi bàn tay khổng lồ ở đâu?', a: ['Đà Lạt', 'Bà Nà (Đà Nẵng)', 'Sa Pa'], ok: 1 },
  { q: 'Động vật nào có 3 trái tim?', a: ['Bạch tuộc', 'Cá voi', 'Voi'], ok: 0 },
  { q: 'Màu nào có được khi trộn xanh dương với vàng?', a: ['Tím', 'Cam', 'Xanh lá'], ok: 2 },
  { q: 'Ngày Valentine là ngày nào?', a: ['14/2', '8/3', '14/3'], ok: 0 },
  { q: 'Ở Hàn Quốc, ngày 14/3 là ngày gì?', a: ['White Day', 'Black Day', 'Pepero Day'], ok: 0 },
  { q: 'Ngày Pepero ở Hàn Quốc là?', a: ['11/11', '1/1', '25/12'], ok: 0 },
  { q: 'Loài chim nào không bay được?', a: ['Đại bàng', 'Chim cánh cụt', 'Hải âu'], ok: 1 },
  { q: 'Mặt Trời mọc ở hướng nào?', a: ['Tây', 'Đông', 'Bắc'], ok: 1 },
  { q: 'Đỉnh núi cao nhất Việt Nam?', a: ['Fansipan', 'Bạch Mã', 'Lang Biang'], ok: 0 },
  { q: 'Núi cao nhất Hàn Quốc là?', a: ['Hallasan', 'Seoraksan', 'Bukhansan'], ok: 0 },
  { q: 'Núi cao nhất Đài Loan là?', a: ['Ngọc Sơn (Yushan)', 'A Lý Sơn', 'Dương Minh Sơn'], ok: 0 },
  { q: 'Hồ Nhật Nguyệt (Sun Moon Lake) ở đâu?', a: ['Hàn Quốc', 'Đài Loan', 'Việt Nam'], ok: 1 },
  { q: '1 giờ có bao nhiêu giây?', a: ['360', '3600', '6000'], ok: 1 },
  { q: 'Con vật nào là biểu tượng hòa bình?', a: ['Chim bồ câu', 'Đại bàng', 'Quạ'], ok: 0 },
  { q: 'Cầu vồng có mấy màu?', a: ['5', '7', '9'], ok: 1 },
  { q: 'Đâu là nhạc cụ có phím đen trắng?', a: ['Đàn piano', 'Đàn guitar', 'Sáo'], ok: 0 },
  { q: 'Bánh chưng thường gói vào dịp nào?', a: ['Trung thu', 'Tết Nguyên đán', 'Giáng sinh'], ok: 1 },
  { q: 'Bánh trung thu ăn vào rằm tháng mấy âm lịch?', a: ['Tháng 1', 'Tháng 8', 'Tháng 12'], ok: 1 },
  { q: 'Tết Trung thu ở Hàn Quốc gọi là?', a: ['Chuseok', 'Seollal', 'Dano'], ok: 0 },
  { q: 'Món "bibimbap" là gì?', a: ['Cơm trộn', 'Mì lạnh', 'Canh rong biển'], ok: 0 },
  { q: 'Canh rong biển (miyeokguk) người Hàn hay ăn vào dịp nào?', a: ['Sinh nhật', 'Đám cưới', 'Tết'], ok: 0 },
  { q: 'Chợ đêm Shilin nổi tiếng ở thành phố nào?', a: ['Đài Bắc', 'Đài Trung', 'Cao Hùng'], ok: 0 },
  { q: 'Làng Cầu Vồng nổi tiếng ở Đài Trung do ai vẽ nên?', a: ['Một ông cụ cựu chiến binh', 'Một họa sĩ Pháp', 'Học sinh tiểu học'], ok: 0 },
  { q: 'Gwangju (Hàn Quốc) nổi tiếng với lễ hội/biennale gì?', a: ['Nghệ thuật Biennale', 'Pháo hoa', 'Hoa anh đào'], ok: 0 },
  { q: 'Trái tim người đập trung bình khoảng bao nhiêu lần/phút khi nghỉ?', a: ['20–30', '60–100', '150–200'], ok: 1 },
  { q: 'Con gì kêu "ò ó o" mỗi sáng?', a: ['Gà trống', 'Vịt', 'Chó'], ok: 0 },
  { q: 'Mật ong do con gì làm ra?', a: ['Bướm', 'Ong', 'Kiến'], ok: 1 },
  { q: 'Đâu là loài cá lớn nhất thế giới?', a: ['Cá mập trắng', 'Cá mập voi', 'Cá heo'], ok: 1 },
  { q: 'Cá heo thuộc loài gì?', a: ['Cá', 'Động vật có vú', 'Bò sát'], ok: 1 },
  { q: 'Nước nào có hình chữ S?', a: ['Việt Nam', 'Chile', 'Ý'], ok: 0 },
  { q: 'Đơn vị tiền của Hàn Quốc?', a: ['Yên', 'Won', 'Đô la Đài Loan'], ok: 1 },
  { q: 'Đơn vị tiền của Đài Loan?', a: ['Tân Đài tệ (TWD)', 'Won', 'Baht'], ok: 0 },
  { q: 'Hoa anh đào ở Hàn Quốc thường nở vào mùa nào?', a: ['Xuân', 'Hạ', 'Đông'], ok: 0 },
  { q: '7 × 8 = ?', a: ['54', '56', '64'], ok: 1 },
  { q: '12 + 19 = ?', a: ['31', '29', '41'], ok: 0 },
  { q: '100 − 37 = ?', a: ['73', '63', '67'], ok: 1 },
  { q: 'Một tuần có bao nhiêu giờ?', a: ['148', '168', '186'], ok: 1 },
  { q: 'Hình nào có 6 cạnh?', a: ['Ngũ giác', 'Lục giác', 'Bát giác'], ok: 1 },
  { q: 'Sao nào sáng nhất trên bầu trời đêm (trừ Mặt Trăng, hành tinh)?', a: ['Sao Bắc Cực', 'Sao Thiên Lang (Sirius)', 'Sao Hôm'], ok: 1 },
  { q: '"Sao Hôm" thật ra là hành tinh nào?', a: ['Sao Kim', 'Sao Hỏa', 'Sao Mộc'], ok: 0 },
  { q: 'Mất bao lâu để ánh sáng Mặt Trời tới Trái Đất?', a: ['8 giây', '8 phút', '8 giờ'], ok: 1 },
  { q: 'Bộ phim hoạt hình có chú tuần lộc Sven và nữ hoàng băng giá?', a: ['Frozen', 'Moana', 'Coco'], ok: 0 },
  { q: 'Loài hoa tượng trưng cho tình yêu?', a: ['Hoa hồng đỏ', 'Hoa cúc', 'Hoa sen'], ok: 0 },
  { q: 'Kim cương được tạo từ nguyên tố nào?', a: ['Sắt', 'Cacbon', 'Vàng'], ok: 1 },
  { q: 'Hàn Quốc và Đài Loan lệch nhau mấy tiếng?', a: ['Không lệch', '1 tiếng', '2 tiếng'], ok: 1 },
  { q: 'Việt Nam và Đài Loan lệch nhau mấy tiếng?', a: ['1 tiếng', '2 tiếng', 'Không lệch'], ok: 0 },
];
export const QUIZ_N = 5, QUIZ_COINS = 30;
/** 5 câu hôm nay (cả hai cùng một bộ câu, để đố nhau) */
export function quizOf(date: string): QuizQ[] {
  const r = seeded(`quiz:${date}`);
  const idx = BANK.map((_, i) => i).sort(() => r() - 0.5).slice(0, QUIZ_N);
  return idx.map(i => BANK[i]);
}
