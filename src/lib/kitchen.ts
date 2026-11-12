// Phòng bếp chung: luật bếp kiểu "hai người cùng nấu" — lấy đồ trong tủ lạnh chung, thái, nấu (canh lửa),
// bày đĩa, bưng nồi, rồi bày lên bàn ăn và cùng ngồi ăn. Ăn xong đĩa bẩn → rửa ở bồn → về kệ đĩa.
// Toàn bộ là hàm thuần trên trạng thái `Room`; một máy giữ trạng thái ("chủ bếp"), máy kia gửi thao tác.
import { content, item } from './content';

/**
 * Bản đồ phòng (mỗi ký tự một ô):
 * . sàn · C quầy · F tủ lạnh · B thớt · S bếp nấu (có nồi) · L máy xay · P kệ đĩa sạch
 * K bồn rửa bát · T thùng rác · D bàn ăn · h ghế
 */
const HOME_LAYOUT = [
  'CCFFCBBCSSCSSC',
  'C............C',
  'P............L',
  'C..CCC.......L',
  'K..BBC.......C',
  'K.......hDDh.T',
  'C............C',
  'C............C',
  'CCCCCCCCCCCCCC',
];
/** Tiệm bánh: quầy bao quanh; trên là tủ nguyên liệu, bàn nhào, lò nướng; hàng dưới là quầy bán (khách đứng ngoài 'o') */
const BAKERY_LAYOUT = [
  'CFFCBBBCSSCSSC',
  'C............C',
  'P............L',
  'C...CCBB.....L',
  'K............C',
  'K............T',
  'C............C',
  'CDDDDDDDDDDDDC',
  'oooooooooooooo',
];
export let LAYOUT = HOME_LAYOUT;
export let COLS = LAYOUT[0].length, ROWS = LAYOUT.length;
export type Tile = '.' | 'C' | 'F' | 'B' | 'S' | 'L' | 'P' | 'K' | 'T' | 'D' | 'h' | 'o';
export const tileAt = (x: number, y: number): Tile | null => (x < 0 || y < 0 || x >= COLS || y >= ROWS ? null : (LAYOUT[y][x] as Tile));
export const walkable = (x: number, y: number) => tileAt(x, y) === '.';
export const key = (x: number, y: number) => `${x},${y}`;
export const CHAIRS: [number, number][] = [];
LAYOUT.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'h') CHAIRS.push([x, y]); }));

const HOME_NAMES: Record<Tile, string> = {
  '.': 'Sàn', C: 'Quầy bếp', F: 'Tủ lạnh chung', B: 'Thớt', S: 'Bếp nấu', L: 'Máy xay', P: 'Kệ đĩa sạch', K: 'Bồn rửa bát', T: 'Thùng rác', D: 'Bàn ăn', h: 'Ghế', o: 'Vỉa hè',
};
const BAKERY_NAMES: Record<Tile, string> = { ...HOME_NAMES, F: 'Tủ nguyên liệu', B: 'Bàn nhào bột', S: 'Lò nướng', L: 'Máy xịt kem', D: 'Quầy bán bánh (khách chờ)', C: 'Quầy' };
export const TILE_NAME: Record<Tile, string> = { ...HOME_NAMES };

// ───────── Công thức ─────────
export type Method = 'S' | 'L' | 'plate';
export interface KRecipe { id: string; needs: string[]; m: Method }
const BLEND = new Set(['grape_juice', 'watermelon_juice', 'peach_tea']);
const RAW = new Set(['salad', 'sushi']);
/** Nguyên liệu không cần thái */
export const NOCUT = new Set(['rice', 'grape', 'shrimp', 'corn', 'egg', 'duck_egg', 'milk', 'cheese', 'butter', 'honey']);
/** Tiệm bánh: bơ và trứng phải đem ra bàn nhào cùng bột; sữa, mật ong, phô mai, dâu cho thẳng vào */
const NOKNEAD = new Set(['milk', 'honey', 'cheese', 'strawberry']);
/** Lớp nấu ăn du lịch: những thứ cho thẳng vào nồi/máy xay, không cần thái */
const CLASS_NOCUT = new Set(['milk', 'tapioca', 'tea_leaf', 'rice', 'egg', 'butter', 'cheese', 'flour', 'noodle_raw', 'honey', 'shrimp', 'bread']);
export const needsCut = (id: string) => (variant === 'bakery' ? !NOKNEAD.has(id) : variant === 'class' ? !CLASS_NOCUT.has(id) : !NOCUT.has(id));
const HOME_RECIPES: KRecipe[] = content.recipes
  .filter(r => item(r.id).kind === 'dish' && r.id !== 'bouquet')
  .map(r => ({ id: r.id, needs: r.needs.flatMap(n => Array<string>(n.n).fill(n.id)), m: BLEND.has(r.id) ? 'L' : RAW.has(r.id) ? 'plate' : 'S' }));
/** Món bếp nhà dùng đồ nông trại (trứng gà, trứng vịt, sữa, phô mai) */
const FARM_HOME: KRecipe[] = [
  { id: 'fried_egg', needs: ['egg'], m: 'S' }, { id: 'omelette', needs: ['egg', 'egg', 'cheese'], m: 'S' },
  { id: 'flan', needs: ['egg', 'egg', 'milk'], m: 'S' }, { id: 'salted_egg', needs: ['duck_egg', 'duck_egg'], m: 'S' },
].filter(r => item(r.id).kind === 'dish' && !HOME_RECIPES.some(h => h.id === r.id)) as KRecipe[];
HOME_RECIPES.push(...FARM_HOME);
const BAKERY_RECIPES: KRecipe[] = [
  { id: 'cookie', needs: ['butter', 'egg'], m: 'S' }, { id: 'croissant', needs: ['butter', 'milk'], m: 'S' },
  { id: 'cupcake', needs: ['butter', 'egg', 'milk'], m: 'S' }, { id: 'honey_cake', needs: ['egg', 'egg', 'honey', 'milk'], m: 'S' },
  { id: 'cheesecake', needs: ['butter', 'cheese', 'egg'], m: 'S' },
];
/** Lớp học nấu món đặc sản ở từng điểm du lịch (nguyên liệu lớp phát, không tốn tủ lạnh) */
export const CLASS_RECIPES: Record<string, KRecipe[]> = {
  taichung: [{ id: 'tw_bubble_tea', needs: ['milk', 'tea_leaf', 'tapioca'], m: 'L' }, { id: 'tw_beef_noodle', needs: ['noodle_raw', 'beef', 'cabbage'], m: 'S' }],
  gwangju: [{ id: 'kr_tteokgalbi', needs: ['beef', 'garlic'], m: 'S' }, { id: 'kr_kimbap', needs: ['rice', 'carrot', 'egg'], m: 'plate' }],
  hoian: [{ id: 'vn_cao_lau', needs: ['noodle_raw', 'pork', 'cabbage'], m: 'S' }, { id: 'vn_banh_mi_hoian', needs: ['bread', 'pork', 'carrot'], m: 'plate' }],
  tokyo: [{ id: 'jp_ramen', needs: ['noodle_raw', 'pork', 'egg'], m: 'S' }, { id: 'jp_tempura', needs: ['shrimp', 'flour', 'egg'], m: 'S' }],
  paris: [{ id: 'fr_crepe', needs: ['flour', 'egg', 'milk'], m: 'S' }, { id: 'fr_onion_soup', needs: ['garlic', 'butter', 'bread'], m: 'S' }],
  venice: [{ id: 'it_pizza', needs: ['flour', 'tomato', 'cheese'], m: 'S' }, { id: 'it_pasta', needs: ['noodle_raw', 'tomato', 'garlic'], m: 'S' }],
  swiss: [{ id: 'ch_fondue', needs: ['cheese', 'cheese', 'bread'], m: 'S' }, { id: 'ch_rosti', needs: ['potato', 'butter'], m: 'S' }],
  fairy: [{ id: 'fa_churro', needs: ['flour', 'egg', 'butter'], m: 'S' }, { id: 'fa_popcorn', needs: ['corn', 'butter'], m: 'S' }],
  iceland: [{ id: 'is_salmon', needs: ['salmon', 'butter'], m: 'S' }, { id: 'is_lamb_soup', needs: ['beef', 'potato', 'carrot'], m: 'S' }],
};
export let KRECIPES: KRecipe[] = HOME_RECIPES;
export let INGREDIENTS = [...new Set(KRECIPES.flatMap(r => r.needs))];
let variant: 'home' | 'bakery' | 'class' = 'home';
let classTrip = '';
export const kitchenVariant = () => variant;
/** Đổi sơ đồ & công thức (bếp nhà ↔ tiệm bánh) trước khi vẽ phòng */
export function setKitchenVariant(v: 'home' | 'bakery' | 'class', trip = '') {
  if (v === variant && trip === classTrip) return;
  variant = v; classTrip = trip;
  LAYOUT = v === 'bakery' ? BAKERY_LAYOUT : HOME_LAYOUT;
  COLS = LAYOUT[0].length; ROWS = LAYOUT.length;
  CHAIRS.length = 0; LAYOUT.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'h') CHAIRS.push([x, y]); }));
  KRECIPES = v === 'bakery' ? BAKERY_RECIPES : v === 'class' ? CLASS_RECIPES[trip] ?? [] : HOME_RECIPES;
  INGREDIENTS = [...new Set(KRECIPES.flatMap(r => r.needs))];
  Object.assign(TILE_NAME, v === 'bakery' ? BAKERY_NAMES : HOME_NAMES);
}
/** Đồ ăn được cất vào tủ (bất kỳ tủ nào): mọi nguyên liệu của mọi bếp + rau củ + cá */
export const STORABLE = new Set<string>([...HOME_RECIPES, ...BAKERY_RECIPES, ...Object.values(CLASS_RECIPES).flat()].flatMap(r => r.needs));
export const storable = (id: string) => STORABLE.has(id) || ['crop', 'fish'].includes(item(id).kind);
/** Tủ của bếp đang ở */
export const fridgeOf = (v: 'home' | 'bakery' | 'class') => (v === 'bakery' ? 'bakery' : 'home') as 'home' | 'bakery';
export const METHOD_LABEL: Record<Method, string> = { S: '🔥 nấu trên bếp', L: '🥤 cho vào máy xay', plate: '🍽️ bày thẳng ra đĩa' };

// ───────── Đồ vật ─────────
export interface Part { id: string; cut: boolean; cook?: 'S' | 'L' }
/** fresh: vừa lấy trong tủ, chưa dùng — cất lại tủ được (tủ chỉ bị trừ khi bắt đầu thái/nấu/bày) */
export interface Ing { k: 'ing'; id: string; cut: boolean; chop?: number; fresh?: boolean }
export interface Plate { k: 'plate'; parts: Part[]; q: number; cream?: boolean }
/** Nồi (bếp nấu, bưng đi được) hoặc cối máy xay (gắn cố định). heat: giây đã đun, on: lúc bắt đầu đun (0 = không đun) */
export interface Pot { k: 'pot'; t: 'S' | 'L'; parts: Part[]; heat: number; on: number }
export interface Dirty { k: 'dirty'; n: number }
export type Thing = Ing | Plate | Pot | Dirty;

export interface Meal { at: number; until: number; dishes: string[]; q: number; both: boolean }
export interface Room {
  host: string;
  v: number;
  cells: Record<string, Thing | null>;
  hands: Record<string, Thing | null>;
  clean: number;
  sink: { n: number; wash: number };
  seats: Record<string, number>;
  meal: Meal | null;
  last: { id: string; dishes: string[]; q: number; both: boolean; coins: number } | null;
  give: { to: string; id: string; key: string } | null;
  note: { to: string; text: string; at: number } | null;
}

export const CHOP_N = 5, WASH_N = 3, MEAL_MS = 9000;
/** Mốc đun (giây): dưới raw = sống, tới ok = chín ngon, tới over = hơi quá lửa, từ over trở đi = khét */
export const HEAT = { S: { raw: 8, ok: 14, over: 18 }, L: { raw: 4, ok: 8, over: 10 } } as const;
export type Stage = 'empty' | 'raw' | 'ok' | 'over' | 'burnt';
export const STAGE_LABEL: Record<Stage, string> = { empty: 'Trống', raw: 'Còn sống', ok: 'Chín tới!', over: 'Hơi quá lửa', burnt: 'Khét mất rồi' };
const QUALITY: Record<Stage, number> = { empty: 0, raw: 1, ok: 3, over: 2, burnt: 0 };
export const COINS_BY_Q = [0, 10, 25, 40];

export function newRoom(host: string): Room {
  const cells: Room['cells'] = {};
  LAYOUT.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'S' || (c === 'L' && variant !== 'bakery')) cells[key(x, y)] = { k: 'pot', t: c, parts: [], heat: 0, on: 0 };
  }));
  return { host, v: 0, cells, hands: {}, clean: 4, sink: { n: 0, wash: 0 }, seats: {}, meal: null, last: null, give: null, note: null };
}

export const heatOf = (p: Pot, now: number) => (p.on ? p.heat + Math.max(0, now - p.on) / 1000 : p.heat);
export function stageOf(p: Pot, now: number): Stage {
  if (!p.parts.length) return 'empty';
  const h = heatOf(p, now), m = HEAT[p.t];
  return h < m.raw ? 'raw' : h < m.ok ? 'ok' : h < m.over ? 'over' : 'burnt';
}

const sameBag = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
/** Đĩa này thành món gì (đủ nguyên liệu, sơ chế đúng, nấu đúng cách) */
export function dishOf(pl: Plate): KRecipe | null {
  if (!pl.parts.length) return null;
  return KRECIPES.find(r => sameBag(r.needs, pl.parts.map(p => p.id))
    && pl.parts.every(p => (!needsCut(p.id) || p.cut) && (r.m === 'plate' ? !p.cook : p.cook === r.m))) ?? null;
}

/** Số món đang cầm/đặt trong phòng vừa lấy từ tủ mà chưa dùng (để tủ không bị lấy quá) */
export function freshCount(r: Room, id: string) {
  return [...Object.values(r.cells), ...Object.values(r.hands)].filter(t => t?.k === 'ing' && t.fresh && t.id === id).length;
}

export interface Opt { pick?: string; stash?: boolean; sit?: number; stand?: boolean; eat?: boolean }
export interface Result { r: Room; say?: string; used?: string[] }

/** Một thao tác của `who` vào ô (x, y). Trả về trạng thái mới, lời nhắc, và nguyên liệu vừa thật sự dùng (trừ tủ). */
export function act(r0: Room, who: string, x: number, y: number, now: number, o: Opt = {}): Result {
  const r: Room = structuredClone(r0);
  const used: string[] = [];
  const done = (say?: string): Result => { r.v++; if (say) r.note = { to: who, text: say, at: now }; return { r, say, used }; };
  const no = (say: string): Result => ({ r: { ...r0, v: r0.v + 1, note: { to: who, text: say, at: now } }, say, used: [] });
  /** Nguyên liệu bắt đầu được dùng → trừ tủ */
  const commit = (t: Ing): Part => { if (t.fresh) used.push(t.id); return { id: t.id, cut: t.cut }; };

  if (o.stand) { delete r.seats[who]; return done(); }
  if (o.eat) return eat(r0, who, now);
  if (r.seats[who] !== undefined) return no('Đang ngồi — đứng dậy rồi mới đi làm việc khác nhé');

  const t = tileAt(x, y);
  const k = key(x, y);
  const hand = r.hands[who] ?? null;
  const cell = r.cells[k] ?? null;
  const setHand = (v: Thing | null) => { r.hands[who] = v; };
  const setCell = (v: Thing | null) => { r.cells[k] = v; };

  switch (t) {
    case 'F': {
      if (hand?.k === 'ing') {
        if (!hand.fresh) return no('Món này đã sơ chế rồi, không cất lại tủ được — dùng nốt hoặc bỏ thùng rác nhé');
        setHand(null);
        return done(`🧊 Cất ${item(hand.id).name} lại tủ`);
      }
      if (hand?.k === 'plate' && o.stash) {
        const d = dishOf(hand);
        if (!d) return no('Đĩa này chưa thành món nào');
        setHand(null); r.clean++;
        r.give = { to: who, id: d.id, key: `kdish:${now}:${who}` };
        return done(`📦 Cất ${item(d.id).icon} ${item(d.id).name} vào túi`);
      }
      if (hand) return no('Tay đang cầm đồ rồi');
      if (!o.pick) return no('Chọn món trong tủ lạnh');
      setHand({ k: 'ing', id: o.pick, cut: false, fresh: true });
      return done();
    }
    case 'P': {
      if (!hand) {
        if (r.clean < 1) return no('🍽️ Hết đĩa sạch rồi — mang đĩa bẩn ra bồn rửa đi!');
        r.clean--; setHand({ k: 'plate', parts: [], q: 3 });
        return done();
      }
      if (hand.k === 'plate' && !hand.parts.length) { r.clean++; setHand(null); return done(); }
      if (hand.k === 'dirty') return no('🧽 Đĩa bẩn — mang ra bồn rửa trước đã');
      return no('Kệ để đĩa sạch thôi');
    }
    case 'K': {
      if (hand?.k === 'dirty') { r.sink.n += hand.n; setHand(null); return done('🧽 Bỏ đĩa vào bồn — bấm liên tục để rửa'); }
      if (hand) return no('Bồn rửa chỉ nhận đĩa bẩn');
      if (r.sink.n < 1) return no('Bồn trống — không có đĩa bẩn');
      r.sink.wash++;
      if (r.sink.wash >= WASH_N) { r.sink.wash = 0; r.sink.n--; r.clean++; return done('✨ Rửa xong một đĩa — đã lên kệ'); }
      return done();
    }
    case 'T': {
      if (!hand) return no('🗑️ Thùng rác');
      if (hand.k === 'ing') { if (hand.fresh) used.push(hand.id); setHand(null); return done('🗑️ Bỏ đi rồi'); }
      if (hand.k === 'pot') { setHand({ ...hand, parts: [], heat: 0, on: 0 }); return done('🗑️ Đổ sạch nồi'); }
      if (hand.k === 'plate') { if (!hand.parts.length) return no('Đĩa còn sạch mà'); setHand({ k: 'plate', parts: [], q: 3 }); return done('🗑️ Đổ thức ăn đi'); }
      return no('Đĩa bẩn thì mang ra bồn rửa nhé');
    }
    case 'S': case 'L': {
      // Tiệm bánh: máy xịt kem — mang đĩa bánh đã nướng tới để xịt kem lên (bán được giá hơn)
      if (variant === 'bakery' && t === 'L') {
        if (hand?.k !== 'plate' || !dishOf(hand)) return no('🍦 Máy xịt kem — bày bánh nướng xong ra đĩa rồi mang tới đây');
        if (hand.cream) return no('Bánh này xịt kem rồi 🍦');
        setHand({ ...hand, cream: true });
        return done(`🍦 Xịt kem lên ${item(dishOf(hand)!.id).name} — xinh quá!`);
      }
      const pot = cell?.k === 'pot' ? cell : null;
      // Khét rồi: bấm vào nồi / máy xay (tay không hoặc đang cầm đĩa) là đổ phần khét đi ngay — máy xay gắn cố định không bưng ra thùng rác được
      if (pot && pot.parts.length && stageOf(pot, now) === 'burnt' && (!hand || hand.k === 'plate')) {
        setCell({ ...pot, parts: [], heat: 0, on: 0 });
        return done(t === 'L' ? '🗑️ Đổ phần khét trong máy xay đi — xay lại nhé' : '🗑️ Đổ phần khét đi — nấu lại nhé');
      }
      if (!hand) {
        if (!pot) return no('Bếp trống — đặt nồi lên đây');
        if (t === 'L') return no(pot.parts.length ? `🥤 ${STAGE_LABEL[stageOf(pot, now)]} — cầm đĩa tới để rót ra` : 'Máy xay trống — cho trái cây vào');
        setHand({ ...pot, heat: heatOf(pot, now), on: 0 }); setCell(null);
        return done();
      }
      if (hand.k === 'pot') {
        if (t === 'L') return no('Máy xay không đặt nồi được');
        if (pot) return no('Bếp này có nồi rồi');
        setCell({ ...hand, on: hand.parts.length ? now : 0 }); setHand(null);
        return done(hand.parts.length ? '🔥 Bắt đầu đun' : undefined);
      }
      if (!pot) return no('Đặt nồi lên bếp trước đã');
      if (hand.k === 'ing') {
        const res = addToPot(pot, hand, now, true);
        if (typeof res === 'string') return no(res);
        setCell(res); used.push(...(hand.fresh ? [hand.id] : [])); setHand(null);
        return done();
      }
      if (hand.k === 'plate') {
        const res = pour(pot, hand, now);
        if (typeof res === 'string') return no(res);
        setHand(res.plate); setCell(res.pot);
        return done(res.say);
      }
      return no('Đĩa bẩn thì mang ra bồn rửa nhé');
    }
    case 'h': {
      const i = CHAIRS.findIndex(([cx, cy]) => cx === x && cy === y);
      if (Object.entries(r.seats).some(([u, s]) => s === i && u !== who)) return no('Ghế này có người ngồi rồi 😆');
      if (hand) return no('Đặt đồ lên bàn trước rồi hẵng ngồi');
      r.seats[who] = i;
      return done(dishesOnTable(r).length ? '🍽️ Ngồi rồi — bấm "Ăn thôi" để ăn' : '🪑 Ngồi chờ món nha');
    }
    case 'C': case 'B': case 'D': {
      if (!hand) {
        if (!cell) return no(t === 'B' ? (variant === 'bakery' ? '👐 Bàn nhào bột — đặt bơ/trứng lên rồi bấm liên tục để nhào' : '🔪 Thớt — đặt nguyên liệu lên rồi bấm liên tục để thái') : t === 'D' ? '🍽️ Bàn ăn — bày món lên đây rồi cùng ngồi ăn' : 'Quầy trống');
        if (r.meal && t === 'D') return no('Đang ăn mà 😋');
        if (t === 'B' && cell.k === 'ing' && needsCut(cell.id) && !cell.cut) {
          const chop = (cell.chop ?? 0) + 1;
          if (cell.fresh) used.push(cell.id);
          setCell({ k: 'ing', id: cell.id, cut: chop >= CHOP_N, chop });
          return done(chop >= CHOP_N ? (variant === 'bakery' ? `👐 Nhào xong ${item(cell.id).name}` : `🔪 Thái xong ${item(cell.id).name}`) : undefined);
        }
        setHand(cell); setCell(null);
        return done();
      }
      // Tiệm bánh: đặt đĩa bánh lên quầy bán → khách đứng ngoài mua ngay, để lại đĩa bẩn
      if (variant === 'bakery' && t === 'D' && hand.k === 'plate' && !cell) {
        const d = dishOf(hand);
        if (!d) return no('🧁 Bày bánh nướng xong lên đĩa rồi mới bán được');
        r.cells[k] = { k: 'dirty', n: 1 }; setHand(null);
        r.last = { id: `sale:${now}:${k}`, dishes: [d.id], q: hand.q, both: false, coins: Math.round(COINS_BY_Q[hand.q] * 3 * (hand.cream ? 1.5 : 1)) };
        return done(`🛎️ Khách mua ${item(d.id).icon} ${item(d.id).name}${hand.cream ? ' phủ kem' : ''} — cảm ơn tiệm nhé!`);
      }
      if (!cell) { setCell(hand); setHand(null); return done(); }
      if (r.meal && t === 'D') return no('Đang ăn mà 😋');
      // Ghép đồ: nguyên liệu vào đĩa/nồi, rót nồi ra đĩa, chồng đĩa bẩn
      if (hand.k === 'ing' && cell.k === 'plate') {
        if (needsCut(hand.id) && !hand.cut) return no((variant === 'bakery' ? '👐 Phải nhào ở bàn nhào bột trước đã' : '🔪 Phải thái trước đã'));
        setCell({ ...cell, parts: [...cell.parts, commit(hand)] }); setHand(null);
        return done(platedSay(r.cells[k] as Plate));
      }
      if (hand.k === 'plate' && cell.k === 'ing') {
        if (needsCut(cell.id) && !cell.cut) return no((variant === 'bakery' ? '👐 Phải nhào ở bàn nhào bột trước đã' : '🔪 Phải thái trước đã'));
        const pl = { ...hand, parts: [...hand.parts, commit(cell)] };
        setHand(pl); setCell(null);
        return done(platedSay(pl));
      }
      if (hand.k === 'ing' && cell.k === 'pot') {
        const res = addToPot(cell, hand, now, false);
        if (typeof res === 'string') return no(res);
        setCell(res); if (hand.fresh) used.push(hand.id); setHand(null);
        return done();
      }
      if (hand.k === 'pot' && cell.k === 'plate') {
        const res = pour(hand, cell, now);
        if (typeof res === 'string') return no(res);
        setCell(res.plate); setHand(res.pot);
        return done(res.say);
      }
      if (hand.k === 'plate' && cell.k === 'pot' && cell.parts.length && stageOf(cell, now) === 'burnt') {
        setCell({ ...cell, parts: [], heat: 0, on: 0 });
        return done('🗑️ Đổ phần khét đi — nấu lại nhé');
      }
      if (hand.k === 'plate' && cell.k === 'pot') {
        const res = pour(cell, hand, now);
        if (typeof res === 'string') return no(res);
        setHand(res.plate); setCell(res.pot);
        return done(res.say);
      }
      if (hand.k === 'dirty' && cell.k === 'dirty') { setCell({ k: 'dirty', n: cell.n + hand.n }); setHand(null); return done(); }
      if (hand.k === 'plate' && cell.k === 'dirty' && !hand.parts.length) return no('Chỗ này có đĩa bẩn');
      return no('Chỗ này có đồ rồi');
    }
    default:
      return no('Không làm gì được ở đây');
  }
}

function addToPot(pot: Pot, ing: Ing, now: number, onStove: boolean): Pot | string {
  if (needsCut(ing.id) && !ing.cut) return (variant === 'bakery' ? '👐 Phải nhào ở bàn nhào bột trước đã' : '🔪 Phải thái trước đã');
  if (pot.parts.length >= 4) return 'Nồi đầy rồi';
  if (stageOf(pot, now) === 'burnt') return '💨 Khét rồi — bấm vào nồi để đổ đi';
  // Cho thêm đồ sống vào thì nồi nguội bớt (món mới cũng phải chín)
  const h = Math.min(heatOf(pot, now), HEAT[pot.t].raw * 0.4);
  return { ...pot, parts: [...pot.parts, { id: ing.id, cut: ing.cut }], heat: h, on: onStove || pot.t === 'L' ? now : 0 };
}

function pour(pot: Pot, plate: Plate, now: number): { pot: Pot; plate: Plate; say: string } | string {
  const st = stageOf(pot, now);
  if (st === 'empty') return pot.t === 'L' ? 'Máy xay đang trống' : 'Nồi đang trống';
  if (st === 'burnt') return '💨 Khét mất rồi — bấm vào để đổ đi rồi làm lại';
  const pl: Plate = { k: 'plate', parts: [...plate.parts, ...pot.parts.map(p => ({ ...p, cook: pot.t }))], q: Math.min(plate.q, QUALITY[st]) };
  const say = st === 'raw' ? '😬 Còn sống mà đã múc ra rồi…' : st === 'over' ? '😅 Hơi quá lửa chút' : '😋 Chín tới, thơm quá!';
  return { pot: { ...pot, parts: [], heat: 0, on: 0 }, plate: pl, say: platedSay(pl) ?? say };
}

function platedSay(pl: Plate) {
  const d = dishOf(pl);
  return d ? `✨ Xong món ${item(d.id).icon} ${item(d.id).name}${pl.q < 3 ? pl.q === 1 ? ' (hơi sống 😬)' : ' (hơi khét 😅)' : ''} — bày lên bàn ăn thôi!` : undefined;
}

export function dishesOnTable(r: Room) {
  return Object.entries(r.cells).filter(([k, t]) => {
    const [x, y] = k.split(',').map(Number);
    return tileAt(x, y) === 'D' && t?.k === 'plate' && !!dishOf(t);
  });
}

function eat(r0: Room, who: string, now: number): Result {
  const say = (s: string): Result => ({ r: { ...r0, v: r0.v + 1, note: { to: who, text: s, at: now } }, say: s, used: [] });
  if (r0.seats[who] === undefined) return say('Ngồi vào ghế trước đã');
  if (r0.meal) return say('Đang ăn mà 😋');
  const dishes = dishesOnTable(r0);
  if (!dishes.length) return say('Trên bàn chưa có món nào — nấu xong bày lên bàn nhé');
  const r: Room = structuredClone(r0);
  const plates = dishes.map(([, t]) => t as Plate);
  r.meal = {
    at: now, until: now + MEAL_MS,
    dishes: plates.map(p => dishOf(p)!.id),
    q: Math.round(plates.reduce((a, p) => a + p.q, 0) / plates.length),
    both: Object.keys(r.seats).length >= 2,
  };
  r.v++;
  return { r, used: [] };
}

/** Theo thời gian: bữa ăn xong thì đĩa trên bàn thành đĩa bẩn và tính thưởng */
export function tick(r0: Room, now: number): Room | null {
  if (!r0.meal || now < r0.meal.until) return null;
  const r: Room = structuredClone(r0);
  const m = r.meal!;
  for (const [k] of dishesOnTable(r)) r.cells[k] = { k: 'dirty', n: 1 };
  const coins = m.dishes.length * COINS_BY_Q[m.q] * (m.both ? 2 : 1);
  r.last = { id: `meal:${m.at}`, dishes: m.dishes, q: m.q, both: m.both, coins };
  r.meal = null;
  r.v++;
  return r;
}
