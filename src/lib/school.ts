// Trường học của các bé: ngôi trường nhỏ trong làng + lớp học bên trong (bảng đen, bàn ghế, cô giáo cú mèo).
// Bé tới tuổi đi học (giai đoạn 'student') thì thứ 2–6, 7:30–16:30 giờ thật sẽ ngồi học ở lớp.
import type { Kid } from './api';
import { ellipse } from './iso';
import { kidStage } from './kids';
import { makeSprite, mix } from './pixel';
import { seeded } from './rng';

export const SCHOOL = { x: 40, y: 172, door: { x: 40, y: 178 } };          // ngôi trường trong làng (đáy ở y)
/** Chỗ ngồi trong lớp: 2 hàng × 3 bàn (bàn của các bé nhà mình xếp trước, còn lại là bạn cùng lớp) */
export const DESKS = [{ x: 52, y: 104 }, { x: 96, y: 104 }, { x: 140, y: 104 }, { x: 52, y: 128 }, { x: 96, y: 128 }, { x: 140, y: 128 }];
export const CLASSMATES = ['🐰', '🐻', '🐱', '🐶', '🐼'];

/** Bé có đang ở trường không (giờ thật của mình) */
export function atSchool(k: Kid, date: string, hour: number, minute: number) {
  if (kidStage(k, date) !== 'student') return false;
  const dow = new Date(`${date}T12:00:00`).getDay();
  const h = hour + minute / 60;
  return dow >= 1 && dow <= 5 && h >= 7.5 && h < 16.5;
}
export const classOpen = (date: string, hour: number, minute: number) => {
  const dow = new Date(`${date}T12:00:00`).getDay(), h = hour + minute / 60;
  return dow >= 1 && dow <= 5 && h >= 7.5 && h < 16.5;
};

/** Bài học mỗi ngày (theo ngày) */
const LESSONS: { subject: string; icon: string; board: string; note: string }[] = [
  { subject: 'Toán', icon: '➕', board: '2 + 3 = 5', note: 'Hôm nay lớp học đếm và cộng trong phạm vi 10.' },
  { subject: 'Tiếng Việt', icon: '🔤', board: 'a ă â b c', note: 'Lớp tập viết chữ cái, bé nào cũng được cô dán sao.' },
  { subject: 'Vẽ', icon: '🎨', board: '🌈 ☀️ 🌷', note: 'Cả lớp vẽ "gia đình em" — tranh sẽ treo ở góc lớp.' },
  { subject: 'Hát nhạc', icon: '🎵', board: '♪ Đô Rê Mi ♪', note: 'Lớp học bài hát mới về ông mặt trời.' },
  { subject: 'Tự nhiên', icon: '🌱', board: '🌱 → 🌿 → 🌻', note: 'Cô cho cả lớp gieo hạt hướng dương vào cốc.' },
  { subject: 'Tiếng Anh', icon: '🔠', board: 'Hello! 👋', note: 'Bé học chào hỏi: hello, thank you, I love you.' },
  { subject: 'Thể dục', icon: '⚽', board: '1 · 2 · 3 · 4', note: 'Cả lớp tập thể dục buổi sáng và chơi kéo co.' },
  { subject: 'Kể chuyện', icon: '📖', board: '🐢 & 🐇', note: 'Cô kể chuyện rùa và thỏ — chậm mà chắc.' },
  { subject: 'Toán', icon: '🔺', board: '🔺 ⬛ ⚪', note: 'Hôm nay học nhận biết hình tam giác, vuông, tròn.' },
  { subject: 'Đạo đức', icon: '💝', board: 'Cảm ơn · Xin lỗi', note: 'Bé học nói lời cảm ơn và xin lỗi.' },
  { subject: 'Thủ công', icon: '✂️', board: '📄 → 🐦', note: 'Lớp gấp chim hạc giấy tặng ba mẹ.' },
  { subject: 'Địa lý', icon: '🗺️', board: '🇻🇳 🇰🇷 🇹🇼', note: 'Bé tìm trên bản đồ nơi ba và mẹ đang ở.' },
];
export const lessonOf = (date: string) => LESSONS[Math.floor(seeded(`lesson:${date}`)() * LESSONS.length)];

/** Bài tập về nhà: 3 câu đơn giản, đổi theo ngày + theo bé */
export interface Question { q: string; options: string[]; answer: number }
export function homework(kidId: string, date: string): Question[] {
  const r = seeded(`hw:${kidId}:${date}`);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const fruit = pick(['🍎', '🍓', '🍊', '🍌', '🍇']);
  const a = 1 + Math.floor(r() * 4), b = 1 + Math.floor(r() * 4);
  const sum = a + b;
  const nums = [sum, sum + 1, Math.max(1, sum - 1)].sort(() => r() - 0.5);
  const animals: [string, string][] = [['🐱', 'Meo meo'], ['🐶', 'Gâu gâu'], ['🐮', 'Ùm bò'], ['🐓', 'Ò ó o'], ['🐸', 'Ộp ộp'], ['🦆', 'Cạp cạp']];
  const [ani, sound] = pick(animals);
  const sounds = [sound, ...animals.filter(x => x[0] !== ani).map(x => x[1]).sort(() => r() - 0.5).slice(0, 2)].sort(() => r() - 0.5);
  const colors: [string, string][] = [['🍌', 'Màu vàng'], ['🍀', 'Màu xanh lá'], ['🍓', 'Màu đỏ'], ['🍇', 'Màu tím'], ['🌊', 'Màu xanh dương']];
  const [thing, color] = pick(colors);
  const colorOpts = [color, ...colors.filter(x => x[0] !== thing).map(x => x[1]).sort(() => r() - 0.5).slice(0, 2)].sort(() => r() - 0.5);
  return [
    { q: `${fruit.repeat(a)} + ${fruit.repeat(b)} = ?`, options: nums.map(String), answer: nums.indexOf(sum) },
    { q: `Bạn ${ani} kêu thế nào?`, options: sounds, answer: sounds.indexOf(sound) },
    { q: `${thing} có màu gì?`, options: colorOpts, answer: colorOpts.indexOf(color) },
  ];
}

// ───────── Hình vẽ ─────────

/** Ngôi trường trong làng: mái đỏ, tháp chuông, cờ, bảng tên, cửa lớn */
export const schoolSprite = () => makeSprite('school:v1', 50, 44, p => {
  const wall = '#fff2d8', wallD = '#e8d4b0', roof = '#e8604a', roofD = '#c8483a';
  p.rect(3, 18, 44, 26, wall); p.rect(3, 42, 44, 2, wallD);
  for (let i = 0; i < 9; i++) p.rect(1 + i * 0.5, 10 + i, 48 - i, 1, i % 3 === 2 ? roofD : roof);   // mái
  p.rect(20, 2, 10, 10, wall); p.rect(19, 1, 12, 2, roof); p.rect(18, 0, 14, 1, roofD);               // tháp chuông
  ellipse(p, 25, 6.5, 2.5, 2.5, '#f6c64e'); p.px(25, 6, '#8a5a3c');
  p.rect(33, -2 + 2, 1, 8, '#8a8098'); p.rect(34, 0, 5, 3, '#e8604a'); p.rect(34, 1, 5, 1, '#f6c64e');   // cờ
  p.rect(14, 20, 22, 4, '#5aa8e0'); for (let x = 16; x < 34; x += 3) p.rect(x, 21, 2, 2, '#ffffff');      // bảng tên
  for (const x of [6, 39]) { p.rect(x, 26, 6, 6, '#a8d8f0'); p.rect(x + 2, 26, 1, 6, '#ffffff'); p.rect(x, 28, 6, 1, '#ffffff'); p.rect(x - 1, 32, 8, 1, wallD); }
  p.rect(20, 28, 10, 16, '#a8693f'); p.rect(21, 29, 8, 7, '#c88a5a'); p.px(28, 37, '#f6c64e');           // cửa
  p.rect(18, 42, 14, 2, '#c8b8a0');                                                                          // bậc thềm
  for (const x of [2, 46]) { ellipse(p, x, 41, 3, 3, '#5aa84a'); p.px(x, 39, '#f59ab3'); }                 // bụi hoa
});

/** Lớp học: tường vàng nhạt, bảng đen, cửa sổ, kệ, đồng hồ, chữ cái treo; sàn gỗ */
export function classroomSprite() {
  return makeSprite('classroom:v1', 192, 144, p => {
    const wall = '#fbe8c0', wallD = '#f0d6a0';
    p.rect(0, 0, 192, 78, wall); for (let x = 0; x < 192; x += 12) p.rect(x, 0, 1, 78, mix(wall, wallD, 0.4));
    p.rect(0, 70, 192, 8, '#c8905a'); p.rect(0, 70, 192, 1, '#e8b07a');
    // sàn gỗ
    for (let y = 78; y < 144; y++) p.rect(0, y, 192, 1, (y - 78) % 9 === 0 ? '#a8703f' : mix('#d8a068', '#c8905a', (y - 78) / 66));
    for (let y = 78; y < 144; y += 9) for (let x = ((y / 9) % 2) * 20; x < 192; x += 40) p.rect(x, y, 1, 9, '#b8804a');
    // bảng đen
    p.rect(48, 14, 96, 42, '#8a5a3c'); p.rect(51, 17, 90, 36, '#2f5a46'); p.rect(51, 17, 90, 2, '#3a6a54');
    p.rect(60, 53, 72, 3, '#a8703f'); p.rect(66, 52, 6, 1, '#ffffff'); p.rect(76, 52, 4, 1, '#f6c64e');
    // cửa sổ trái + phải
    for (const x0 of [6, 156]) {
      p.rect(x0, 16, 30, 32, '#ffffff'); p.rect(x0 + 2, 18, 26, 28, '#9ad8f6'); p.rect(x0 + 14, 18, 2, 28, '#ffffff'); p.rect(x0 + 2, 31, 26, 2, '#ffffff');
      ellipse(p, x0 + 8, 40, 5, 4, '#7ac860'); ellipse(p, x0 + 22, 41, 6, 4, '#6ab858');
      p.rect(x0 - 2, 48, 34, 2, '#e8c890');
    }
    // dây chữ cái
    const letters = ['#e8604a', '#f6c64e', '#5aa8e0', '#7ac860', '#b07ae0', '#f59ab3'];
    for (let i = 0; i < 13; i++) { const x = 12 + i * 14, y = 4 + Math.round(Math.sin((i / 12) * Math.PI) * 4); p.rect(x, y, 8, 7, letters[i % letters.length]); p.rect(x + 3, y + 2, 2, 3, '#ffffff'); }
    // kệ sách + chậu cây góc phải
    p.rect(166, 54, 22, 16, '#a8703f'); for (let i = 0; i < 6; i++) p.rect(168 + i * 3, 56, 2, 6, letters[i]); p.rect(168, 63, 18, 1, '#8a5a3c');
    ellipse(p, 14, 64, 6, 5, '#5aa84a'); p.rect(10, 66, 8, 6, '#e8905a');
  }, null);
}

/** Bàn học nhỏ (nhìn từ phía sau học sinh) */
export const deskSprite = () => makeSprite('school-desk:v1', 26, 14, p => {
  p.rect(0, 0, 26, 4, '#e8b07a'); p.rect(0, 0, 26, 1, '#f8d0a0'); p.rect(1, 4, 24, 6, '#c8905a');
  p.rect(2, 10, 2, 4, '#8a5a3c'); p.rect(22, 10, 2, 4, '#8a5a3c');
  p.rect(5, 1, 6, 2, '#ffffff'); p.rect(14, 1, 3, 2, '#f6c64e');
});
/** Cô giáo cú mèo đeo kính, cầm thước */
export const owlSprite = () => makeSprite('owl-teacher:v1', 18, 22, p => {
  ellipse(p, 9, 13, 8, 9, '#a8784a'); ellipse(p, 9, 15, 5, 6, '#f2dcc0');
  ellipse(p, 6, 8, 3.2, 3.2, '#ffffff'); ellipse(p, 12, 8, 3.2, 3.2, '#ffffff'); p.px(6, 8, '#1a1428'); p.px(12, 8, '#1a1428');
  p.rect(3, 7, 7, 1, '#3a3448'); p.rect(9, 7, 7, 1, '#3a3448');
  p.rect(8, 10, 2, 2, '#f6a03a'); p.rect(2, 2, 3, 4, '#a8784a'); p.rect(13, 2, 3, 4, '#a8784a');
  p.rect(15, 12, 2, 9, '#c8a050'); p.rect(6, 21, 2, 1, '#f6a03a'); p.rect(10, 21, 2, 1, '#f6a03a');
});

// ───────── Thời khoá biểu một ngày ở trường (giờ thật, thứ 2–6) ─────────
export type Period = 'flag' | 'class' | 'recess' | 'lunch' | 'nap' | 'pe' | 'dismiss' | 'closed';
export function periodOf(date: string, hour: number, minute: number): Period {
  const dow = new Date(`${date}T12:00:00`).getDay(), h = hour + minute / 60;
  if (dow < 1 || dow > 5) return 'closed';
  if (h < 7.5) return 'closed';
  if (h < 8) return 'flag';
  if (h < 9.5) return 'class';
  if (h < 10) return 'recess';
  if (h < 11) return 'class';
  if (h < 12) return 'lunch';
  if (h < 13) return 'nap';
  if (h < 14.5) return 'class';
  if (h < 15.5) return 'pe';
  if (h < 16.5) return 'class';
  if (h < 17) return 'dismiss';
  return 'closed';
}
export const PERIOD: Record<Period, { icon: string; label: string; time: string }> = {
  flag: { icon: '🚩', label: 'Chào cờ & tập thể dục buổi sáng', time: '7:30–8:00' },
  class: { icon: '✏️', label: 'Đang trong giờ học', time: '' },
  recess: { icon: '🛝', label: 'Ra chơi', time: '9:30–10:00' },
  lunch: { icon: '🍱', label: 'Ăn trưa ở nhà ăn', time: '11:00–12:00' },
  nap: { icon: '😴', label: 'Ngủ trưa', time: '12:00–13:00' },
  pe: { icon: '⚽', label: 'Giờ thể dục ở sân trường', time: '14:30–15:30' },
  dismiss: { icon: '🔔', label: 'Tan học — phụ huynh đón con', time: '16:30–17:00' },
  closed: { icon: '🌙', label: 'Trường nghỉ', time: '' },
};
export const SCHEDULE = '7:30 chào cờ · 8:00 vào lớp · 9:30 ra chơi · 11:00 ăn trưa · 12:00 ngủ trưa · 13:00 học · 14:30 thể dục · 16:30 tan học';
/** Môn thể dục trong nhà (hoặc trời mưa / tuyết thì cả lớp vào nhà thể chất) */
export const peIndoor = (game: string, weather?: string | null) => ['aerobic', 'rope', 'hoop'].includes(game) || ['rain', 'snow', 'storm'].includes(weather ?? '');
/** Trong lớp chỉ có học sinh khi đang giờ học / ngủ trưa */
export const inClassroom = (p: Period) => p === 'class' || p === 'nap';

/** Môn thể dục hôm nay */
export const PE_GAMES = [
  { id: 'ball', icon: '⚽', name: 'Đá bóng' }, { id: 'rope', icon: '🪢', name: 'Nhảy dây' }, { id: 'run', icon: '🏃', name: 'Chạy tiếp sức' },
  { id: 'tug', icon: '💪', name: 'Kéo co' }, { id: 'aerobic', icon: '🤸', name: 'Thể dục nhịp điệu' }, { id: 'hoop', icon: '🏀', name: 'Ném bóng rổ' },
] as const;
export const peOf = (date: string) => PE_GAMES[Math.floor(seeded(`pe:${date}`)() * PE_GAMES.length)];

/** Các bạn cùng lớp (NPC) */
const SKIN = ['#ffe0c8', '#f6cfa8', '#e0a878', '#b07850'], HAIR = ['#3a2a2a', '#6a4028', '#1a1a2a', '#c8904a', '#8a5a3c'];
const CLOTH = ['#8db8ef', '#f59ab3', '#a5d470', '#f6c64e', '#c8a0f0', '#f6a06a', '#7ad0d0'];
export const CLASSMATE_NPC = ['Bin', 'Na', 'Tí', 'Mi', 'Bông', 'Cún', 'Bơ', 'Gạo', 'Sóc', 'Mít', 'Kem', 'Tôm'].map((name, i) => {
  const r = seeded(`mate:${name}`);
  const girl = i % 2 === 1;
  return { name, girl, look: { skin: SKIN[Math.floor(r() * SKIN.length)], hair: HAIR[Math.floor(r() * HAIR.length)], cloth: CLOTH[(i * 3 + Math.floor(r() * 3)) % CLOTH.length] } };
});
export const MATE_CHATTER = ['Chơi đuổi bắt không?', 'Tớ được cô khen đó!', 'Trưa nay có cơm gà 😋', 'Ê nhảy dây đi!', 'Hihi', 'Tớ quên vở rồi 😱', 'Bạn là ba mẹ của… hả?', 'Chào cô chú ạ! 👋'];

/** Đồ ăn ở trường: nhà ăn (cơm trưa) + 2 xe hàng trước cổng. price = giá mua (bán lại được nửa giá) */
export type StallId = 'canteen' | 'bread' | 'sweet' | 'citycafe' | 'store';
export const STALLS: Record<StallId, { icon: string; name: string; vendor: string; hello: string; menu: { id: string; price: number }[] }> = {
  canteen: { icon: '🍱', name: 'Nhà ăn của trường', vendor: 'Cô cấp dưỡng', hello: 'Cơm trưa nóng hổi đây, ăn cho mau lớn nha!', menu: [{ id: 'com_ga', price: 40 }, { id: 'com_suon', price: 45 }, { id: 'canh_bi', price: 25 }, { id: 'sua_hop', price: 15 }, { id: 'chuoi', price: 10 }] },
  bread: { icon: '🥖', name: 'Xe bánh mì cô Tư', vendor: 'Cô Tư', hello: 'Bánh mì nóng giòn mới ra lò nè!', menu: [{ id: 'banh_mi', price: 25 }, { id: 'xoi_gac', price: 20 }, { id: 'bap_xao', price: 20 }, { id: 'nuoc_mia', price: 15 }] },
  citycafe: { icon: '☕', name: 'Quán cà phê góc phố', vendor: 'Anh barista', hello: 'Chào buổi sáng! Uống gì cho tỉnh táo đi làm nè?', menu: [{ id: 'ca_phe_sua', price: 30 }, { id: 'bac_xiu', price: 30 }, { id: 'croissant', price: 35 }, { id: 'tiramisu', price: 45 }] },
  store: { icon: '🏪', name: 'Cửa hàng tiện lợi 24h', vendor: 'Bạn thu ngân', hello: 'Xin chào quý khách! Hôm nay có khuyến mãi mì ly đó ạ.', menu: [{ id: 'mi_ly', price: 20 }, { id: 'sandwich', price: 25 }, { id: 'onigiri', price: 18 }, { id: 'sua_chuoi', price: 15 }, { id: 'keo_deo', price: 10 }] },
  sweet: { icon: '🍦', name: 'Xe kem & bánh tráng', vendor: 'Chú Bảy', hello: 'Kem mát lạnh, bánh tráng trộn đây các con ơi!', menu: [{ id: 'kem_que', price: 15 }, { id: 'banh_trang', price: 20 }, { id: 'tra_sua', price: 30 }, { id: 'keo_bong', price: 15 }] },
};
