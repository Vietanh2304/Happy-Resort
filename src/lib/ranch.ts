// Trang trại chăn nuôi: vật nuôi, sản phẩm thu được, công thức chế biến (sữa → phô mai, trứng → bánh…),
// vải (len, lụa) để may đồ. Giá & thời gian ở đây; máy chủ chỉ chặn số vô lý.
import type { Pt } from './world';

export type AnimalKind = 'chicken' | 'duck' | 'cow' | 'goat' | 'sheep' | 'silkworm' | 'bee';
export interface AnimalDef {
  kind: AnimalKind; name: string; icon: string; price: number;
  product: string; n: number; hours: number;         // thu được gì, bao nhiêu, mấy tiếng một lần
  eats: string[];                                    // thức ăn chấp nhận (món đầu tiên có trong túi sẽ được dùng)
  pen: 'coop' | 'barn' | 'meadow' | 'hut' | 'hive';
  verb: string;                                      // động từ thu hoạch
}
const GRAINS = ['feed', 'corn', 'rice'], GREENS = ['feed', 'carrot', 'cabbage', 'corn', 'potato'], FLOWERS = ['feed', 'rose_bloom', 'tulip_bloom', 'lavender', 'sunflower_bloom', 'daisy_bloom', 'sakura_bloom'];
export const ANIMALS: AnimalDef[] = [
  { kind: 'chicken', name: 'Gà mái', icon: '🐔', price: 120, product: 'egg', n: 2, hours: 6, eats: GRAINS, pen: 'coop', verb: 'Nhặt trứng' },
  { kind: 'duck', name: 'Vịt', icon: '🦆', price: 140, product: 'duck_egg', n: 1, hours: 8, eats: GRAINS, pen: 'coop', verb: 'Nhặt trứng vịt' },
  { kind: 'cow', name: 'Bò sữa', icon: '🐄', price: 420, product: 'milk', n: 2, hours: 12, eats: GREENS, pen: 'barn', verb: 'Vắt sữa' },
  { kind: 'goat', name: 'Dê', icon: '🐐', price: 300, product: 'goat_milk', n: 1, hours: 10, eats: GREENS, pen: 'barn', verb: 'Vắt sữa dê' },
  { kind: 'sheep', name: 'Cừu', icon: '🐑', price: 360, product: 'wool', n: 2, hours: 24, eats: GREENS, pen: 'meadow', verb: 'Xén lông' },
  { kind: 'silkworm', name: 'Nong tằm', icon: '🐛', price: 90, product: 'cocoon', n: 3, hours: 24, eats: ['leaf', 'feed'], pen: 'hut', verb: 'Lấy kén' },
  { kind: 'bee', name: 'Tổ ong', icon: '🐝', price: 260, product: 'honey', n: 1, hours: 24, eats: FLOWERS, pen: 'hive', verb: 'Lấy mật' },
];
export const animalDef = (k: string) => ANIMALS.find(a => a.kind === k) ?? ANIMALS[0];
export const FEED_PRICE = 10;   // một bao cám ở trang trại

/** Đã đói chưa / thu được chưa (theo giờ thật) */
export function animalState(a: { kind: string; fed_at: string | null; collected_at: string | null }, now = Date.now()) {
  const d = animalDef(a.kind);
  const fed = !!a.fed_at && now - Date.parse(a.fed_at) < 30 * 3.6e6;
  const hungry = !a.fed_at || now - Date.parse(a.fed_at) > 20 * 3.6e6;     // 20 tiếng thì đói lại (cho ăn mỗi ngày)
  const nextAt = a.collected_at ? Date.parse(a.collected_at) + d.hours * 3.6e6 : 0;
  const ready = fed && now >= nextAt;
  return { fed, hungry, ready, nextAt, def: d };
}
export const waitText = (ms: number) => { const h = ms / 3.6e6; return h >= 1 ? `${Math.ceil(h)} tiếng` : `${Math.max(1, Math.ceil(h * 60))} phút`; };

/** Công thức chế biến: cùng làm khi người ấy ở đây thì được gấp đôi */
export interface Recipe { id: string; give: string; n: number; take: { id: string; n: number }[]; group: 'dairy' | 'egg' | 'fabric' | 'sweet' }
export const RECIPES: Recipe[] = [
  { id: 'cheese', give: 'cheese', n: 1, take: [{ id: 'milk', n: 2 }], group: 'dairy' },
  { id: 'butter', give: 'butter', n: 1, take: [{ id: 'milk', n: 2 }], group: 'dairy' },
  { id: 'yogurt', give: 'yogurt', n: 2, take: [{ id: 'goat_milk', n: 1 }, { id: 'honey', n: 1 }], group: 'dairy' },
  { id: 'goat_cheese', give: 'goat_cheese', n: 1, take: [{ id: 'goat_milk', n: 2 }], group: 'dairy' },
  { id: 'fried_egg', give: 'fried_egg', n: 1, take: [{ id: 'egg', n: 1 }], group: 'egg' },
  { id: 'omelette', give: 'omelette', n: 1, take: [{ id: 'egg', n: 2 }, { id: 'cheese', n: 1 }], group: 'egg' },
  { id: 'flan', give: 'flan', n: 2, take: [{ id: 'egg', n: 2 }, { id: 'milk', n: 1 }], group: 'egg' },
  { id: 'egg_tart', give: 'egg_tart', n: 2, take: [{ id: 'egg', n: 2 }, { id: 'butter', n: 1 }, { id: 'milk', n: 1 }], group: 'egg' },
  { id: 'salted_egg', give: 'salted_egg', n: 2, take: [{ id: 'duck_egg', n: 2 }], group: 'egg' },
  { id: 'pancake', give: 'pancake', n: 2, take: [{ id: 'egg', n: 1 }, { id: 'milk', n: 1 }, { id: 'honey', n: 1 }], group: 'sweet' },
  { id: 'sponge_cake', give: 'sponge_cake', n: 1, take: [{ id: 'egg', n: 3 }, { id: 'butter', n: 1 }, { id: 'milk', n: 1 }], group: 'sweet' },
  { id: 'strawberry_milk', give: 'strawberry_milk', n: 2, take: [{ id: 'milk', n: 1 }, { id: 'strawberry', n: 1 }], group: 'sweet' },
  { id: 'honey_tea', give: 'honey_tea', n: 2, take: [{ id: 'honey', n: 1 }, { id: 'lavender', n: 1 }], group: 'sweet' },
  { id: 'yarn', give: 'yarn', n: 1, take: [{ id: 'wool', n: 2 }], group: 'fabric' },
  { id: 'silk', give: 'silk', n: 1, take: [{ id: 'cocoon', n: 3 }], group: 'fabric' },
];
export const GROUPS: { id: Recipe['group']; name: string }[] = [
  { id: 'dairy', name: '🧀 Sữa' }, { id: 'egg', name: '🥚 Trứng' }, { id: 'sweet', name: '🍰 Bánh & đồ uống' }, { id: 'fabric', name: '🧶 Kéo sợi' },
];

// ───────── Bản đồ trang trại (256×192) ─────────
export const RANCH = {
  w: 256, h: 192,
  exit: { x: 128, y: 186 },
  shop: { x: 128, y: 120, stand: { x: 128, y: 130 } },          // bảng mua con giống + cám
  workshop: { x: 128, y: 70, door: { x: 116, y: 76 }, tailor: { x: 142, y: 76 } },
  pens: {
    coop: { x0: 10, x1: 92, y0: 64, y1: 108 },
    barn: { x0: 160, x1: 244, y0: 64, y1: 112 },
    meadow: { x0: 14, x1: 100, y0: 132, y1: 178 },
    hut: { x0: 150, x1: 186, y0: 140, y1: 164 },
    hive: { x0: 196, x1: 244, y0: 146, y1: 176 },
  } as Record<AnimalDef['pen'], { x0: number; x1: number; y0: number; y1: number }>,
};
export function homeIn(pen: AnimalDef['pen'], i: number): Pt {
  const b = RANCH.pens[pen];
  const cols = Math.max(1, Math.floor((b.x1 - b.x0) / 18));
  return { x: b.x0 + 10 + (i % cols) * 18, y: b.y0 + 14 + Math.floor(i / cols) * 14 };
}

// ───────── Xưởng may ─────────
export type GarmentType = 'tee' | 'shirt' | 'sweater' | 'hoodie' | 'dress' | 'gown' | 'skirt' | 'aodai' | 'overall';
export type Pattern = 'plain' | 'stripe' | 'dots' | 'check' | 'flower' | 'heart';
export interface Design { type: GarmentType; c1: string; c2: string; trim: string; pattern: Pattern; sleeve: 'none' | 'short' | 'long' | 'puff'; length: 'short' | 'long'; shoes: string; fabric: 'yarn' | 'silk' }
export const GARMENTS: { id: GarmentType; name: string; icon: string }[] = [
  { id: 'tee', name: 'Áo phông + quần', icon: '👕' }, { id: 'shirt', name: 'Sơ mi + quần', icon: '👔' }, { id: 'sweater', name: 'Áo len', icon: '🧶' },
  { id: 'hoodie', name: 'Áo hoodie', icon: '🧥' }, { id: 'dress', name: 'Váy liền', icon: '👗' }, { id: 'gown', name: 'Đầm dạ hội', icon: '💃' },
  { id: 'skirt', name: 'Áo + chân váy', icon: '🩱' }, { id: 'aodai', name: 'Áo dài', icon: '🎎' }, { id: 'overall', name: 'Yếm', icon: '🧑‍🌾' },
];
export const PATTERNS: { id: Pattern; name: string }[] = [
  { id: 'plain', name: 'Trơn' }, { id: 'stripe', name: 'Sọc' }, { id: 'dots', name: 'Chấm bi' }, { id: 'check', name: 'Caro' }, { id: 'flower', name: 'Hoa nhí' }, { id: 'heart', name: 'Trái tim' },
];
export const PALETTE = ['#f59ab3', '#e8604a', '#f7a98a', '#f6c64e', '#a5d470', '#7cc8b4', '#8db8ef', '#5a6ad0', '#b7a6e8', '#c8a2e8', '#fffaf0', '#c8c0b8', '#6a6a7a', '#3a3a5a', '#8a5a3c', '#2a2030'];
export const FABRIC_NEED = 2;     // mỗi bộ cần 2 cuộn len hoặc 2 tấm lụa
/** Giá bán bộ đồ tự may: lụa đắt hơn len, váy dạ hội/áo dài đắt hơn */
export const designPrice = (d: Design) => (d.fabric === 'silk' ? 260 : 160) + (d.type === 'gown' || d.type === 'aodai' ? 120 : 0) + (d.pattern !== 'plain' ? 40 : 0);
export const DEFAULT_DESIGN: Design = { type: 'dress', c1: '#f59ab3', c2: '#fffaf0', trim: '#fffaf0', pattern: 'dots', sleeve: 'puff', length: 'short', shoes: '#e86a7a', fabric: 'yarn' };
