// Tiệm hoa (cắm hoa tự trồng theo đơn khách), tiệm bánh (nướng trong lò theo giờ thật, bán cho khách),
// vườn bướm & chim (hoa trồng ở nông trại thu hút khách bay tới, chụp ảnh sưu tầm).
import { item } from './content';
import { seeded } from './rng';

const val = (id: string) => item(id).price ?? 30;
const CUSTOMERS = ['👧 Bé Na', '👨 Anh Tuấn', '👩 Cô Lan', '👴 Ông Bảy', '👩‍🦰 Chị Mai', '👦 Cậu Bin', '👵 Bà Tư', '🧑 Anh Khoa', '👩‍🎓 Chị Thảo'];

// ───── Tiệm hoa ─────
export interface FlowerOrder { who: string; icon: string; occasion: string; want: [string, number][]; line: string; reward: number }
const OCCASIONS: Omit<FlowerOrder, 'who' | 'reward'>[] = [
  { icon: '🎂', occasion: 'Sinh nhật bạn thân', want: [['tulip_bloom', 2], ['daisy_bloom', 1]], line: 'Xinh quá trời! Bạn tớ chắc chắn sẽ thích lắm 🎉' },
  { icon: '💌', occasion: 'Tỏ tình', want: [['rose_bloom', 3]], line: 'Tim tớ đập thình thịch… chúc tớ may mắn nha! 💕' },
  { icon: '🎊', occasion: 'Chúc mừng khai trương', want: [['sunflower_bloom', 2], ['daisy_bloom', 1]], line: 'Rực rỡ y như ngày khai trương của tớ vậy! Cảm ơn nhiều ✨' },
  { icon: '🙏', occasion: 'Xin lỗi người yêu', want: [['lavender', 2], ['tulip_bloom', 1]], line: 'Hy vọng cô ấy tha lỗi cho tớ… bó hoa đẹp quá 🥺' },
  { icon: '🎓', occasion: 'Tốt nghiệp', want: [['sunflower_bloom', 3]], line: 'Em gái tớ sẽ cười tít mắt cho xem! 🎓' },
  { icon: '💍', occasion: 'Đám cưới', want: [['rose_bloom', 2], ['sakura_bloom', 1]], line: 'Cô dâu sẽ là người hạnh phúc nhất hôm nay 💐' },
  { icon: '👩', occasion: 'Tặng mẹ', want: [['daisy_bloom', 2], ['rose_bloom', 1]], line: 'Mẹ tớ thích hoa cúc lắm, cảm ơn cậu nhiều nha 💗' },
  { icon: '🌤️', occasion: 'Thăm người ốm', want: [['sunflower_bloom', 1], ['lavender', 1]], line: 'Nhìn bó hoa là thấy khoẻ hẳn ra rồi! 🌻' },
  { icon: '🌸', occasion: 'Ngắm hoa mùa xuân', want: [['sakura_bloom', 2]], line: 'Đẹp như cả mùa xuân thu nhỏ vậy đó 🌸' },
];
/** Mỗi 4 tiếng một lượt khách mới (6 lượt/ngày) */
export const orderBlock = (hour: number) => Math.floor(hour / 4);
export const nextBlockIn = (hour: number, minute: number) => (orderBlock(hour) + 1) * 4 * 60 - (hour * 60 + minute);
export function flowerOrders(date: string, block = 0): FlowerOrder[] {
  const r = seeded(`flowers:${date}:${block}`);
  const pool = [...OCCASIONS];
  return Array.from({ length: 3 }, (_, i) => {
    const o = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const cost = o.want.reduce((s, [id, n]) => s + val(id) * n, 0);
    return { ...o, who: CUSTOMERS[Math.floor(r() * CUSTOMERS.length)] + (i ? '' : ''), reward: cost * 3 };
  });
}

// ───── Tiệm bánh ─────
export interface Bake { id: string; take: [string, number][]; hours: number; n: number }
export const BAKES: Bake[] = [
  { id: 'cookie', take: [['butter', 1], ['egg', 1]], hours: 1, n: 3 },
  { id: 'croissant', take: [['butter', 1], ['milk', 1]], hours: 2, n: 2 },
  { id: 'cupcake', take: [['egg', 1], ['milk', 1], ['butter', 1]], hours: 2, n: 3 },
  { id: 'honey_cake', take: [['egg', 2], ['honey', 1], ['milk', 1]], hours: 3, n: 2 },
  { id: 'cheesecake', take: [['cheese', 1], ['egg', 1], ['butter', 1]], hours: 3, n: 2 },
];
export const bakeOf = (id: string) => BAKES.find(b => b.id === id)!;
export const OVEN_SLOTS = 2;
export interface BakeOrder { who: string; want: string; n: number; reward: number; line: string }
const BAKE_LINES = ['Thơm quá, con tớ mê bánh tiệm này lắm! 🧁', 'Cho tớ gói mang về nhé, cảm ơn nha ☕', 'Bánh nướng vừa tới, ngon xỉu luôn 😋', 'Tiệm dễ thương ghê, mai tớ lại ghé! 💕'];
export function bakeOrders(date: string, block = 0): BakeOrder[] {
  const r = seeded(`bakery:${date}:${block}`);
  return Array.from({ length: 3 }, () => {
    const b = BAKES[Math.floor(r() * BAKES.length)], n = 1 + Math.floor(r() * 2);
    return { who: CUSTOMERS[Math.floor(r() * CUSTOMERS.length)], want: b.id, n, reward: Math.round(val(b.id) * n * 1.5), line: BAKE_LINES[Math.floor(r() * BAKE_LINES.length)] };
  });
}
/** Lò nướng: khoá claim `oven:<mốc bắt đầu>:<bánh>`; lấy ra = `ovenout:<mốc>` */
export interface OvenSlot { start: number; id: string; key: string }
export function ovenSlots(keys: string[]): OvenSlot[] {
  const out = new Set(keys.filter(k => k.startsWith('ovenout:')).map(k => k.slice(8)));
  return keys.filter(k => k.startsWith('oven:')).map(k => { const [, s, id] = k.split(':'); return { start: Number(s), id, key: k }; })
    .filter(s => !out.has(String(s.start))).sort((a, b) => a.start - b.start);
}

// ───── Vườn bướm & chim ─────
export interface Visitor { id: string; name: string; bird?: boolean; flower: string; hue: number; rare?: boolean }
export const VISITORS: Visitor[] = [
  { id: 'bf_red', name: 'Bướm đỏ thẫm', flower: 'rose_bloom', hue: -40 },
  { id: 'bf_white', name: 'Bướm trắng cánh mỏng', flower: 'tulip_bloom', hue: 160 },
  { id: 'bf_purple', name: 'Bướm tím oải hương', flower: 'lavender', hue: 60 },
  { id: 'bf_yellow', name: 'Bướm vàng chanh', flower: 'daisy_bloom', hue: -120 },
  { id: 'bird_sparrow', name: 'Chim sẻ hướng dương', flower: 'sunflower_bloom', hue: 0, bird: true },
  { id: 'bird_robin', name: 'Chim oanh hoa đào', flower: 'sakura_bloom', hue: 140, bird: true },
  { id: 'bf_morpho', name: 'Bướm xanh ngọc (hiếm)', flower: '*', hue: 200, rare: true },
];
/** Hôm nay khách nào ghé: phải có loài hoa nó thích đang trồng ở nông trại; bướm hiếm cần ≥ 3 loài hoa */
export function visitorsToday(date: string, planted: string[]): Visitor[] {
  const r = seeded(`visitors:${date}`);
  const kinds = new Set(planted);
  return VISITORS.filter(v => (v.rare ? kinds.size >= 3 && r() < 0.35 : kinds.has(v.flower) && r() < 0.8));
}
