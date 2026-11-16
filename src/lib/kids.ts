// Em bé của hai bạn: lớn dần theo ngày thật (sơ sinh → tập đi → bé con), cần được chăm (ăn, vệ sinh, ngủ, chơi).
import type { CareKind, Kid, Profile } from './api';
import { ellipse } from './iso';
import { makeSprite, mix } from './pixel';
import { HAIR_COLORS, SKINS } from './sprites';

export type KidStage = 'baby' | 'toddler' | 'child' | 'student';
const DAY = 86400e3;
export const kidAge = (k: Kid, today: string) => Math.max(0, Math.round((Date.parse(today) - Date.parse(k.born_on)) / DAY));
export const kidStage = (k: Kid, today: string): KidStage => { const a = kidAge(k, today); return a < 7 ? 'baby' : a < 21 ? 'toddler' : a < 45 ? 'child' : 'student'; };
export const STAGE_NAME: Record<KidStage, string> = { baby: 'Sơ sinh', toddler: 'Tập đi', child: 'Bé con', student: 'Đi học' };

/** Màu da lấy từ bố hoặc mẹ, màu tóc từ người còn lại (cố định theo bé) */
/** Quần áo ba mẹ may cho bé */
export type KidGarment = 'tee' | 'dress' | 'overall' | 'pajama' | 'hoodie' | 'aodai' | 'skirt';
export type KidPattern = 'plain' | 'stripe' | 'dots' | 'check' | 'heart' | 'star';
export interface KidDesign { type: KidGarment; c1: string; c2: string; pattern: KidPattern }
export const KID_GARMENTS: { id: KidGarment; name: string; icon: string }[] = [
  { id: 'tee', name: 'Áo phông + quần', icon: '👕' }, { id: 'dress', name: 'Váy xoè', icon: '👗' }, { id: 'skirt', name: 'Áo + chân váy', icon: '🩰' },
  { id: 'overall', name: 'Quần yếm', icon: '🧑‍🌾' }, { id: 'hoodie', name: 'Áo hoodie', icon: '🧥' }, { id: 'pajama', name: 'Đồ ngủ', icon: '😴' }, { id: 'aodai', name: 'Áo dài', icon: '🎎' },
];
export const KID_PATTERNS: { id: KidPattern; name: string }[] = [
  { id: 'plain', name: 'Trơn' }, { id: 'stripe', name: 'Sọc' }, { id: 'dots', name: 'Chấm bi' }, { id: 'check', name: 'Caro' }, { id: 'heart', name: 'Trái tim' }, { id: 'star', name: 'Ngôi sao' },
];
/** Thứ tự các con (Game cập nhật) — bé thứ 3 mặc màu xanh lá cho dễ nhận */
const kidOrder: string[] = [];
export function setKidOrder(ids: string[]) { if (ids.join() !== kidOrder.join()) kidOrder.splice(0, kidOrder.length, ...ids); }
export function kidLook(k: Kid, a: Profile | null, b: Profile | null) {
  const h = [...k.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const [p1, p2] = h % 2 ? [a, b] : [b, a];
  const base = kidOrder.indexOf(k.id) === 2 ? '#8ad08a' : k.gender === 'm' ? '#8db8ef' : k.gender === 'f' ? '#f59ab3' : '#f6e27a';
  return { skin: SKINS[p1?.avatar?.skin ?? 0], hair: HAIR_COLORS[p2?.avatar?.hairColor ?? 0], cloth: k.outfit?.c1 ?? base, design: k.outfit ?? null as KidDesign | null };
}
type Look = { skin: string; hair: string; cloth: string; design?: KidDesign | null; scarf?: string; coat?: string };
/** màu một điểm áo theo hoạ tiết */
function patPx(pt: KidPattern, c: string, x: number, y: number) {
  if (pt === 'stripe') return y % 2 ? mix(c, '#ffffff', 0.55) : c;
  if (pt === 'dots') return (x + (y % 4 < 2 ? 0 : 2)) % 4 === 0 && y % 2 === 0 ? '#ffffff' : c;
  if (pt === 'check') return (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? mix(c, '#2a2030', 0.2) : c;
  if (pt === 'heart') return (x * 3 + y * 5) % 7 === 0 ? '#e8406a' : c;
  if (pt === 'star') return (x * 5 + y * 3) % 7 === 0 ? '#ffe070' : c;
  return c;
}

export function kidSprite(stage: KidStage, look: Look, frame: 'idle' | 'walk' | 'sleep', girl: boolean) {
  look = look.coat ? { ...look, cloth: look.coat } : look;
  const dz = stage === 'baby' ? null : look.design ?? null;
  const key = `kid:${stage}:${look.skin}:${look.hair}:${look.cloth}:${frame}:${girl}:${look.scarf ?? ''}:${dz ? JSON.stringify(dz) : ''}`;
  if (stage === 'baby') {
    return makeSprite(key, 12, 10, p => {
      ellipse(p, 6.5, 6.5, 5.5, 3.5, look.cloth);                     // khăn quấn
      ellipse(p, 6.5, 7, 4, 2.2, mix(look.cloth, '#ffffff', 0.4));
      ellipse(p, 4, 4, 3.4, 3.2, look.skin);                         // đầu
      p.rect(2, 1, 4, 1, look.hair); p.px(3, 0, look.hair);
      if (frame === 'sleep') { p.rect(2, 4, 1, 1, '#3b2d3f'); p.rect(5, 4, 1, 1, '#3b2d3f'); }
      else { p.px(2, 4, '#3b2d3f'); p.px(5, 4, '#3b2d3f'); }
      p.px(1, 5, '#f8a8b8'); p.px(6, 5, '#f8a8b8');
    });
  }
  const tall = stage === 'child' || stage === 'student';
  const H = tall ? 18 : 13, W = tall ? 12 : 10;
  return makeSprite(key, W, H, p => {
    const cx = W / 2, hr = tall ? 4.2 : 3.8, hy = hr + 1;
    const step = frame === 'walk';
    // Chân
    const ly = Math.round(hy + hr + (tall ? 7 : 4));
    p.rect(cx - 3 + (step ? 1 : 0), ly, 2, H - ly, look.skin); p.rect(cx + 1 - (step ? 1 : 0), ly, 2, H - ly, look.skin);
    p.rect(cx - 3 + (step ? 1 : 0), H - 1, 2, 1, '#8a5a3c'); p.rect(cx + 1 - (step ? 1 : 0), H - 1, 2, 1, '#8a5a3c');
    // Thân (váy cho bé gái lớn) — hoặc bộ đồ ba mẹ may
    const by = Math.round(hy + hr - 1);
    if (dz) {
      const px = (x: number, y: number, c: string) => p.px(x, y, patPx(dz.pattern, c, x, y));
      const legs = (c: string, to: number) => { for (const lx of [cx - 3 + (step ? 1 : 0), cx + 1 - (step ? 1 : 0)]) p.rect(lx, ly, 2, Math.max(0, to - ly), c); };
      if (dz.type === 'dress' || dz.type === 'aodai') {
        const end = dz.type === 'aodai' ? H - 3 : ly + 1;
        if (dz.type === 'aodai') legs(dz.c2, H - 1);
        for (let y = by; y < end; y++) { const w = dz.type === 'aodai' ? 3 + (y > ly ? 1 : 0) : 3 + Math.floor((y - by) / 2); for (let x = cx - w; x < cx + w; x++) px(x, y, dz.c1); }
        if (dz.type === 'aodai') p.rect(cx - 0.5, by, 1, ly - by, mix(dz.c1, '#ffffff', 0.5));
      } else if (dz.type === 'skirt') {
        const mid = by + Math.max(2, Math.round((ly - by) / 2));
        for (let y = by; y < mid; y++) for (let x = cx - 3; x < cx + 3; x++) px(x, y, dz.c1);
        for (let y = mid; y < ly + 1; y++) { const w = 3 + Math.floor((y - mid + 1) / 1.5); p.rect(cx - w, y, w * 2, 1, dz.c2); }
      } else {
        legs(dz.c2, dz.type === 'pajama' || dz.type === 'overall' ? H - 1 : Math.min(H - 1, ly + (tall ? 4 : 2)));
        for (let y = by; y < ly + (tall ? 0 : 1); y++) for (let x = cx - 3; x < cx + 3; x++) px(x, y, dz.type === 'overall' && y < by + 2 ? dz.c2 : dz.c1);
        if (dz.type === 'overall') { p.px(cx - 2, by, dz.c1); p.px(cx + 1, by, dz.c1); p.px(cx - 1, by + 3, '#f6c64e'); p.px(cx, by + 3, '#f6c64e'); }
        if (dz.type === 'hoodie') { p.rect(cx - 0.5, by + 1, 1, 3, '#ffffff'); p.rect(cx - 2, ly - 2, 4, 1, mix(dz.c1, '#2a2030', 0.2)); }
      }
      if (dz.type !== 'overall') p.rect(cx - 3, by, 6, 1, mix(dz.c1, '#ffffff', 0.4));
      if (dz.type === 'hoodie') { p.rect(cx - hr, by - 1, hr * 2, 2, dz.c1); }   // mũ hoodie sau gáy
    } else {
      if (girl && tall) { for (let y = by; y < ly + 1; y++) { const w = 3 + Math.floor((y - by) / 2); p.rect(cx - w, y, w * 2, 1, look.cloth); } }
      else p.rect(cx - 3, by, 6, ly - by + (tall ? 0 : 1), look.cloth);
      p.rect(cx - 3, by, 6, 1, mix(look.cloth, '#ffffff', 0.4));
      if (!tall) p.rect(cx - 3, ly - 1, 6, 2, '#ffffff');               // tã
    }
    // Đầu, tóc, mặt
    ellipse(p, cx, hy, hr, hr, look.skin);
    p.rect(cx - hr + 1, hy - hr, hr * 2 - 1, 2, look.hair); p.px(cx - hr + 1, hy - hr + 2, look.hair); p.px(cx + hr - 1, hy - hr + 2, look.hair);
    if (girl) { p.px(cx - hr, hy - 1, look.hair); p.px(cx + hr, hy - 1, look.hair); p.px(cx + hr, hy - hr + 1, '#f59ab3'); }
    if (frame === 'sleep') { p.rect(cx - 3, hy, 2, 1, '#3b2d3f'); p.rect(cx + 1, hy, 2, 1, '#3b2d3f'); }   // nhắm mắt ngủ
    else { p.px(cx - 2, hy, '#3b2d3f'); p.px(cx + 1, hy, '#3b2d3f'); p.px(cx - 2, hy - 1, '#ffffff'); }
    p.px(cx - 3, hy + 1, '#f8a8b8'); p.px(cx + 2, hy + 1, '#f8a8b8');
    p.px(cx - 0.5, hy + 2, '#e86a7a');
    if (look.scarf) { p.rect(cx - 3, by - 1, 6, 2, look.scarf); p.rect(cx + 1, by + 1, 2, 3, look.scarf); p.px(cx + 1, by + 4, mix(look.scarf, '#ffffff', 0.4)); }   // khăn quàng ấm
    if (stage === 'student') { p.rect(0, by + 1, 2, 5, '#e86a7a'); p.rect(0, by + 1, 2, 1, '#f59ab3'); p.px(2, by + 1, '#8a3a4a'); }   // cặp sách
  });
}

export function cradleSprite() {
  return makeSprite('cradle', 22, 16, p => {
    ellipse(p, 11, 9, 10, 5, '#d8a066'); ellipse(p, 11, 8, 9, 4, '#f2dcc0');
    for (let x = 3; x < 20; x += 3) p.rect(x, 9, 1, 4, '#b07a4a');
    p.rect(2, 12, 18, 2, '#b07a4a');
    for (let x = 1; x < 21; x++) p.px(x, 15 - Math.round(Math.sin(((x - 1) / 19) * Math.PI) * 2), '#8a5a3c');
    p.rect(14, 0, 2, 8, '#d8a066'); p.rect(12, 0, 6, 1, '#d8a066');      // cần treo đồ chơi
    p.px(13, 2, '#f6c64e'); p.px(17, 2, '#8db8ef'); p.px(15, 3, '#f59ab3');
  });
}
export function strollerSprite() {
  return makeSprite('stroller', 16, 14, p => {
    for (let y = 0; y < 7; y++) { const w = Math.round(Math.sqrt(49 - (7 - y) ** 2)); p.rect(8 - w, y, w, 1, '#f59ab3'); }
    p.rect(1, 6, 13, 3, '#f7b8cc'); p.rect(1, 6, 13, 1, '#ffd6e2');
    p.rect(13, 2, 1, 6, '#8a8098'); p.rect(13, 2, 3, 1, '#8a8098');
    ellipse(p, 4, 11.5, 2, 2, '#5a5a6a'); ellipse(p, 11, 11.5, 2, 2, '#5a5a6a');
    p.px(4, 11, '#c8c8d0'); p.px(11, 11, '#c8c8d0');
  });
}

// ───────── Nhu cầu của bé ─────────

export const NEEDS: { kind: CareKind; field: keyof Kid; label: string; icon: string; hours: number }[] = [
  { kind: 'feed', field: 'fed_at', label: 'No bụng', icon: '🍼', hours: 8 },
  { kind: 'clean', field: 'bathed_at', label: 'Sạch sẽ', icon: '🫧', hours: 24 },
  { kind: 'sleep', field: 'slept_at', label: 'Ngủ đủ', icon: '😴', hours: 16 },
  { kind: 'play', field: 'played_at', label: 'Vui vẻ', icon: '🧸', hours: 12 },
];
/** 0..100 cho mỗi nhu cầu */
export function needLevel(k: Kid, field: keyof Kid, hours: number) {
  const at = k[field] as string | null;
  if (!at) return 20;
  return Math.max(0, Math.min(100, Math.round(100 - ((Date.now() - Date.parse(at)) / 3600e3 / hours) * 100)));
}
export function kidMood(k: Kid) {
  const lv = NEEDS.map(n => needLevel(k, n.field, n.hours));
  const low = NEEDS.filter((_, i) => lv[i] < 30);
  return { avg: lv.reduce((a, b) => a + b, 0) / lv.length, low };
}

export interface CareAction { id: string; kind: CareKind; icon: string; label: string; say: string; milestone?: string }
export const ACTIONS: Record<KidStage, CareAction[]> = {
  baby: [
    { id: 'bottle', kind: 'feed', icon: '🍼', label: 'Bú bình', say: '🍼 Ực ực…' },
    { id: 'diaper', kind: 'clean', icon: '🧷', label: 'Thay tã', say: '🧷 Sạch thơm rồi!' },
    { id: 'bath', kind: 'clean', icon: '🛁', label: 'Tắm cho bé', say: '🛁 Bé té nước tung tóe' },
    { id: 'lullaby', kind: 'sleep', icon: '🎶', label: 'Hát ru', say: '🎶 À ơi… bé ngủ ngoan' },
    { id: 'hold', kind: 'play', icon: '🤱', label: 'Bế bé', say: '🤱 Bé cười khúc khích' },
  ],
  toddler: [
    { id: 'puree', kind: 'feed', icon: '🥣', label: 'Ăn dặm', say: '🥣 Măm măm!' },
    { id: 'bath', kind: 'clean', icon: '🛁', label: 'Tắm', say: '🛁 Vịt cao su nổi lềnh bềnh' },
    { id: 'potty', kind: 'clean', icon: '🚽', label: 'Đi vệ sinh', say: '🚽 Con giỏi quá, xong rồi rửa tay nào!' },
    { id: 'nap', kind: 'sleep', icon: '😴', label: 'Ru ngủ trưa', say: '😴 Khò khò…' },
    { id: 'toy', kind: 'play', icon: '🧸', label: 'Chơi đồ chơi', say: '🧸 Bé ôm gấu cười tít mắt' },
    { id: 'walk', kind: 'play', icon: '👣', label: 'Tập đi', say: '👣 Chập chững… chập chững!', milestone: 'walk' },
    { id: 'talk', kind: 'play', icon: '🗣️', label: 'Dạy nói', say: '🗣️ …', milestone: 'talk' },
  ],
  child: [
    { id: 'meal', kind: 'feed', icon: '🍚', label: 'Ăn cơm', say: '🍚 Con ăn hết sạch!' },
    { id: 'bath', kind: 'clean', icon: '🛁', label: 'Tắm', say: '🛁 Thơm phức!' },
    { id: 'potty', kind: 'clean', icon: '🚽', label: 'Đi vệ sinh', say: '🚽 Xong rồi, rửa tay thật sạch nha!' },
    { id: 'bedtime', kind: 'sleep', icon: '🛏️', label: 'Kể chuyện đi ngủ', say: '📖 Ngày xửa ngày xưa…' },
    { id: 'ball', kind: 'play', icon: '⚽', label: 'Chơi bóng', say: '⚽ Sút nè!' },
    { id: 'study', kind: 'play', icon: '📚', label: 'Học bài', say: '📚 A, ă, â…', milestone: 'read' },
    { id: 'draw', kind: 'play', icon: '🎨', label: 'Vẽ tranh', say: '🎨 Con vẽ ba mẹ nè!', milestone: 'draw' },
  ],
  student: [
    { id: 'meal', kind: 'feed', icon: '🍱', label: 'Chuẩn bị cơm hộp', say: '🍱 Cơm hộp hình gấu!' },
    { id: 'bath', kind: 'clean', icon: '🛁', label: 'Tắm', say: '🛁 Thơm phức!' },
    { id: 'potty', kind: 'clean', icon: '🚽', label: 'Đi vệ sinh', say: '🚽 Xong rồi, rửa tay thật sạch nha!' },
    { id: 'bedtime', kind: 'sleep', icon: '🛏️', label: 'Đi ngủ sớm', say: '🌙 Mai con đi học nha' },
    { id: 'school', kind: 'play', icon: '🏫', label: 'Đưa bé đi học', say: '🏫 Con chào ba mẹ, con đi học đây!', milestone: 'school' },
    { id: 'homework', kind: 'play', icon: '✏️', label: 'Kèm bài tập', say: '✏️ 1 + 1 = 2!', milestone: 'homework' },
    { id: 'card', kind: 'play', icon: '💌', label: 'Bé làm thiệp', say: '💌 Con tặng ba mẹ nè!', milestone: 'card' },
  ],
};
export const MILESTONES: Record<string, string> = {
  born: '🐦 Cò mang bé về nhà', talk: '🗣️ Tiếng gọi đầu tiên', walk: '👣 Những bước đi đầu tiên', read: '📚 Lần đầu đọc chữ', draw: '🎨 Bức tranh đầu tiên vẽ ba mẹ',
  school: '🏫 Ngày đầu tiên đi học', homework: '✏️ Bài tập đầu tiên được điểm 10', card: '💌 Tấm thiệp đầu tiên tặng ba mẹ',
};
