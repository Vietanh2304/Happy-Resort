// Nhân vật chibi vẽ nét gấp đôi: đầu to, mắt long lanh, tóc có mái và ánh sáng,
// có ba hướng nhìn (trước, sau, nghiêng) và chu kỳ bước chân 4 nhịp.
// Kích thước logic giữ nguyên 16×26 (+viền) như sprite cũ, nên mọi vị trí trong game không đổi,
// chỉ ảnh được vẽ ở độ phân giải ×2 cho nét mịn hơn.
import type { Design } from './ranch';
import { drawProp, type HoldMode, type PropSpec } from './props';
import { mix, type Pen, type Sprite, gradeCanvas } from './pixel';

export interface ChibiLook { skin?: number; hair?: number; hairColor?: number; shirt?: number; outfit?: number; acc?: number; gender?: 'm' | 'f'; glasses?: number; design?: Design | null }
export type View = 'front' | 'back' | 'side';
export type Pose = 'idle' | 'walk' | 'sit' | 'sleep' | 'dance' | 'act' | 'actsit' | 'makeup' | 'embrace' | 'kiss';
/**
 * Động tác tay (pose 'act' đứng / 'actsit' ngồi, `step` = số thứ tự):
 * 0 vung tay sau đầu · 1 ném ra · 2 hất nước sang hai bên · 3 hất nước lên · 4 chèo kéo · 5 chèo đẩy
 * 6 vung vợt lên · 7 đập vợt xuống · 8 vung gậy ra sau · 9 vung gậy theo đà · 10 búng · 11 ôm tai kêu đau · 12 giơ tay ăn mừng
 * 13 thái (dao giơ) · 14 thái (dao xuống)
 * Khiêu vũ đôi: 15/16 nắm tay (người trái/phải) · 17/18 giơ tay cho người kia xoay · 19/20 đập tay
 */
export const ACTS: [number, number, number, number][] = [
  [6, 33, 29, 9], [5, 31, 31, 20], [1, 33, 31, 33], [3, 18, 29, 18], [12, 34, 20, 34], [6, 29, 26, 29],
  [6, 33, 28, 8], [6, 33, 27, 36], [27, 22, 29, 20], [4, 22, 6, 20], [7, 34, 31, 24], [5, 15, 27, 15], [3, 9, 29, 9],
  [11, 34, 22, 27], [11, 34, 20, 34],
  [8, 35, 31, 28], [1, 28, 24, 35], [8, 35, 30, 10], [2, 10, 24, 35], [8, 35, 31, 19], [1, 19, 24, 35],
];
/** Số động tác nhảy (pose 'dance', step = động tác) */
export const DANCE_MOVES = 8;
export interface Held { spec: PropSpec; mode: HoldMode; phase: 0 | 1 }

export const SKINS = ['#fde3d0', '#f6cfae', '#e0aa80', '#a8714f'];
export const HAIR_COLORS = ['#4a3430', '#7a4e34', '#c98b4b', '#f3d58f', '#f2a7c3', '#8aa8e0', '#f6f1ea', '#2e2a3a'];
export const SHIRTS = ['#f59ab3', '#8db8ef', '#a5d470', '#f6c64e', '#b7a6e8', '#f7a98a', '#fffaf0', '#6a7aa8', '#e86a7a', '#7cc8b4', '#3a3a5a', '#c8a2e8'];

const K = 2;                 // độ phân giải: 2 pixel nét cho mỗi pixel logic
const INK = '#3b2834';
const cache = new Map<string, Sprite>();

interface HiPen {
  px(x: number, y: number, c: string): void;
  rect(x: number, y: number, w: number, h: number, c: string): void;
  ell(cx: number, cy: number, rx: number, ry: number, c: string): void;
  map(rows: string[], pal: Record<string, string>, ox: number, oy: number): void;
  line(x0: number, y0: number, x1: number, y1: number, w: number, c: string): void;
  ctx: CanvasRenderingContext2D;
}

function hiPen(ctx: CanvasRenderingContext2D, ox: number, oy: number): HiPen {
  const fill = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) + ox, Math.round(y) + oy, w, h); };
  return {
    ctx,
    px: (x, y, c) => fill(x, y, 1, 1, c),
    rect: (x, y, w, h, c) => { if (w > 0 && h > 0) fill(x, y, Math.round(w), Math.round(h), c); },
    ell: (cx, cy, rx, ry, c) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) fill(x, y, 1, 1, c);
      }
    },
    map: (rows, pal, x0, y0) => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) fill(x0 + x, y0 + y, 1, 1, pal[ch]); })),
    line: (x0, y0, x1, y1, w, c) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; fill(x - Math.floor(w / 2), y - Math.floor(w / 2), w, w, c); }
    },
  };
}

function outline(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const img = ctx.getImageData(0, 0, w, h);
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && img.data[(y * w + x) * 4 + 3] > 0;
  ctx.fillStyle = color;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) ctx.fillRect(x, y, 1, 1);
}

// ───────── Tóc ─────────
type Bangs = 'parted' | 'blunt' | 'swept' | 'spiky' | 'up';
interface HairSpec { bangs: Bangs; side: number; back?: number; wavy?: boolean; extra?: 'bun' | 'buns' | 'twin' | 'pony' }
const HAIRS: HairSpec[] = [
  { bangs: 'parted', side: 15 },                       // 0 Tóc ngắn
  { bangs: 'parted', side: 36, back: 38 },             // 1 Tóc dài
  { bangs: 'parted', side: 17, extra: 'bun' },         // 2 Búi tó
  { bangs: 'spiky', side: 16 },                        // 3 Tóc xù
  { bangs: 'blunt', side: 19, extra: 'twin' },         // 4 Hai bím
  { bangs: 'swept', side: 17, extra: 'pony' },         // 5 Đuôi ngựa
  { bangs: 'blunt', side: 25, back: 25 },              // 6 Tóc bob
  { bangs: 'swept', side: 15 },                        // 7 Mái lệch
  { bangs: 'up', side: 14 },                           // 8 Tóc vuốt
  { bangs: 'parted', side: 38, back: 40, wavy: true }, // 9 Xoăn dài
  { bangs: 'swept', side: 21 },                        // 10 Tóc tém
  { bangs: 'parted', side: 17, extra: 'buns' },        // 11 Hai búi
];
export const HAIR_COUNT = HAIRS.length;

function bangY(b: Bangs, x: number): number {
  switch (b) {
    case 'parted': { if (x === 15 || x === 16) return 9; const t = ((x - 4) % 5 + 5) % 5; return 11 + [0, 2, 3, 2, 0][t]; }
    case 'blunt': return 13 + (x % 4 === 0 ? 1 : 0);
    case 'swept': return Math.round(15 - (x - 6) * 0.32) + (x % 4 === 1 ? 1 : 0);
    case 'spiky': return 11 + [0, 3, 1, 2][x % 4];
    case 'up': return 7 + (x % 5 === 0 ? 1 : 0);
  }
}

// ───────── Đồ tự may (xưởng may) ─────────
/** Bản thiết kế → bộ đồ vẽ được: kiểu áo, tay, quần/váy, độ dài, họa tiết */
function designOutfit(d: Design): Outfit {
  const c1 = d.c1, c2 = d.c2, tr = d.trim;
  const longSkirt = d.length === 'long';
  const pat = (P: HiPen, x0: number, x1: number, y0: number, y1: number, base: string) => {
    const a = d.pattern === 'plain' ? null : mix(base, tr === base ? '#ffffff' : tr, 0.85);
    if (!a) return;
    for (let yy = y0; yy < y1; yy++) for (let x = x0; x < x1; x++) {
      const on = d.pattern === 'stripe' ? (yy - y0) % 3 === 0
        : d.pattern === 'dots' ? (x + (Math.floor(yy / 3) % 2) * 2) % 4 === 0 && yy % 3 === 1
        : d.pattern === 'check' ? (x % 4 === 0) || ((yy - y0) % 4 === 0)
        : d.pattern === 'flower' ? ((x * 5 + yy * 3) % 11 === 0)
        : ((x + yy * 2) % 9 === 0);   // trái tim: chấm nhỏ thưa
      if (on) P.px(x, yy, a);
    }
  };
  const top = (P: HiPen, y: number, end = 37) => pat(P, 10, 22, y + 25, y + end, c1);
  switch (d.type) {
    case 'dress': return { top: c1, sleeve: d.sleeve, bottom: 'gown', bot: c1, hem: longSkirt ? 50 : 45, shoes: d.shoes, deco: (P, v, y) => { top(P, y); pat(P, 9, 23, 38, longSkirt ? 49 : 44, c1); P.rect(10, y + 35, 12, 1, tr); if (v === 'front') P.rect(13, y + 24, 6, 1, tr); } };
    case 'gown': return { top: c1, sleeve: d.sleeve === 'long' ? 'long' : 'none', bottom: 'gown', bot: c2, hem: 51, shoes: d.shoes, deco: (P, _v, y) => { top(P, y); pat(P, 9, 23, 38, 50, c2); P.rect(10, y + 34, 12, 1, tr); for (const [x, yy] of [[11, 42], [19, 46], [14, 48], [21, 40]]) P.px(x, yy, '#ffffff'); } };
    case 'skirt': return { top: c1, sleeve: d.sleeve, bottom: longSkirt ? 'gown' : 'skirt', bot: c2, hem: longSkirt ? 48 : 44, shoes: d.shoes, deco: (P, _v, y) => { top(P, y, 35); pat(P, 9, 23, 38, longSkirt ? 47 : 43, c2); P.rect(10, y + 35, 12, 1, tr); } };
    case 'aodai': return { top: c1, sleeve: 'long', topEnd: 47, bottom: 'pants', bot: c2, shoes: d.shoes, deco: (P, v, y) => { top(P, y, 46); if (v === 'front') { P.rect(15, y + 24, 2, 2, tr); P.line(17, y + 26, 20, y + 30, 1, tr); } } };
    case 'overall': return { top: c2, sleeve: d.sleeve === 'none' ? 'short' : d.sleeve, bottom: 'pants', bot: c1, shoes: d.shoes, deco: (P, v, y) => { P.rect(11, y + 30, 10, 8, c1); if (v !== 'side') { P.rect(11, y + 25, 2, 6, c1); P.rect(19, y + 25, 2, 6, c1); } pat(P, 11, 21, y + 30, y + 38, c1); if (v === 'front') { P.px(12, y + 30, tr); P.px(19, y + 30, tr); } } };
    case 'sweater': return { top: c1, sleeve: 'long', bottom: d.length === 'short' ? 'shorts' : 'pants', bot: c2, shoes: d.shoes, deco: (P, _v, y) => { top(P, y); P.rect(10, y + 24, 12, 2, tr); P.rect(10, y + 36, 12, 1, tr); } };
    case 'hoodie': return { top: c1, sleeve: 'long', bottom: d.length === 'short' ? 'shorts' : 'pants', bot: c2, shoes: d.shoes, deco: (P, v, y) => { top(P, y); if (v === 'front') { P.rect(13, y + 31, 6, 4, mix(c1, '#2a2030', 0.2)); P.px(14, y + 25, tr); P.px(17, y + 25, tr); P.line(14, y + 25, 14, y + 28, 1, tr); P.line(17, y + 25, 17, y + 28, 1, tr); } else P.rect(11, y + 23, 10, 3, mix(c1, '#2a2030', 0.2)); } };
    case 'shirt': return { top: c1, sleeve: d.sleeve === 'none' ? 'short' : d.sleeve, bottom: d.length === 'short' ? 'shorts' : 'pants', bot: c2, shoes: d.shoes, deco: (P, v, y) => { top(P, y); if (v === 'front') { P.rect(14, y + 25, 4, 1, tr); for (const yy of [28, 31, 34]) P.px(16, y + yy, tr); } } };
    case 'suit': return { top: c1, sleeve: 'long', bottom: 'pants', bot: c2, shoes: d.shoes, deco: (P, v, y) => { top(P, y); if (v === 'front') { P.rect(14, y + 25, 4, 9, '#fffaf0'); P.rect(15, y + 26, 2, 7, tr); P.line(13, y + 25, 15, y + 33, 1, mix(c1, '#000000', 0.25)); P.line(18, y + 25, 16, y + 33, 1, mix(c1, '#000000', 0.25)); } } };
    case 'jacket': return { top: c1, sleeve: 'long', bottom: d.length === 'short' ? 'shorts' : 'pants', bot: c2, shoes: d.shoes, deco: (P, v, y) => { top(P, y); P.rect(10, y + 24, 12, 2, mix(c1, '#ffffff', 0.25)); if (v === 'front') { P.rect(16, y + 26, 1, 11, tr); P.rect(11, y + 31, 3, 2, mix(c1, '#000000', 0.2)); P.rect(18, y + 31, 3, 2, mix(c1, '#000000', 0.2)); } } };
    case 'pajama': return { top: c1, sleeve: 'long', bottom: 'pants', bot: c1, shoes: d.shoes, deco: (P, v, y) => { top(P, y); pat(P, 10, 22, y + 38, y + 47, c1); if (v === 'front') { P.rect(13, y + 25, 6, 1, tr); for (const yy of [29, 33]) P.px(16, y + yy, tr); } } };
    case 'sport': return { top: c1, sleeve: 'short', bottom: d.length === 'short' ? 'shorts' : 'pants', bot: c2, shoes: d.shoes, deco: (P, v, y) => { top(P, y); P.rect(10, y + 26, 1, 11, tr); P.rect(21, y + 26, 1, 11, tr); if (v === 'front') P.rect(14, y + 29, 4, 3, tr); } };
    case 'hanbok': return { top: c1, sleeve: 'long', topEnd: 32, bottom: 'gown', bot: c2, hem: 51, shoes: d.shoes, deco: (P, v, y) => { pat(P, 9, 23, 38, 50, c2); P.rect(10, y + 24, 12, 1, tr); if (v === 'front') { P.rect(15, y + 28, 2, 2, tr); P.line(16, y + 30, 14, y + 36, 1, tr); P.line(16, y + 30, 18, y + 37, 1, tr); } } };
    case 'qipao': return { top: c1, sleeve: d.sleeve === 'long' ? 'long' : 'none', bottom: 'gown', bot: c1, hem: longSkirt ? 50 : 46, shoes: d.shoes, deco: (P, v, y) => { top(P, y); pat(P, 9, 23, 38, longSkirt ? 49 : 45, c1); P.rect(12, y + 23, 8, 2, tr); if (v === 'front') { P.line(14, y + 25, 19, y + 29, 1, tr); P.rect(20, 42, 1, longSkirt ? 8 : 4, mix(c1, '#000000', 0.3)); } } };
    case 'cardigan': return { top: c2, sleeve: 'long', bottom: longSkirt ? 'gown' : 'skirt', bot: c2, hem: longSkirt ? 48 : 44, shoes: d.shoes, deco: (P, v, y) => { P.rect(10, y + 25, 4, 12, c1); P.rect(18, y + 25, 4, 12, c1); pat(P, 10, 14, y + 25, y + 37, c1); pat(P, 18, 22, y + 25, y + 37, c1); if (v === 'front') for (const yy of [28, 31, 34]) P.px(13, y + yy, tr); } };
    default: return { top: c1, sleeve: d.sleeve === 'none' ? 'short' : d.sleeve, bottom: d.length === 'short' ? 'shorts' : 'pants', bot: c2, shoes: d.shoes, deco: (P, v, y) => { top(P, y); if (v === 'front') P.rect(13, y + 25, 6, 1, tr); } };
  }
}

// ───────── Trang phục ─────────
type Bottom = 'pants' | 'shorts' | 'skirt' | 'gown';
interface Outfit {
  top: string; sleeve: 'short' | 'long' | 'none' | 'puff'; topEnd?: number;
  bottom: Bottom; bot: string; hem?: number; legs?: string; shoes: string;
  deco?: (P: HiPen, v: View, y: number) => void;
}
function outfitOf(o: number, C: string, S: string, girl = false): Outfit {
  const Cd = mix(C, '#2a2030', 0.25), Cl = mix(C, '#ffffff', 0.45), W = '#fffaf0';
  switch (o) {
    case 1: return { top: C, sleeve: 'puff', bottom: 'skirt', bot: C, hem: 44, shoes: '#e86a7a', deco: (P, v, y) => { if (v !== 'back') P.rect(13, y + 25, 6, 2, W); for (let x = 9; x < 23; x += 3) P.px(x, 43, W); } };
    case 2: return { top: C, sleeve: 'long', bottom: 'pants', bot: '#6a6a8a', shoes: W, deco: (P, v, y) => { if (v === 'front') { P.rect(12, y + 31, 8, 4, Cd); P.px(14, y + 26, W); P.px(17, y + 26, W); P.line(14, y + 26, 14, y + 29, 1, W); P.line(17, y + 26, 17, y + 29, 1, W); } else P.rect(11, y + 24, 10, 3, Cd); } };
    case 3: return { top: W, sleeve: 'short', bottom: 'pants', bot: C, shoes: '#7a4e3a', deco: (P, v, y) => { P.rect(11, y + 30, 10, 8, C); if (v !== 'side') { P.rect(11, y + 25, 2, 6, C); P.rect(19, y + 25, 2, 6, C); } if (v === 'front') { P.px(12, y + 30, '#f6c64e'); P.px(19, y + 30, '#f6c64e'); P.rect(14, y + 32, 4, 3, Cd); } } };
    case 4: { const J = mix(C, '#22223a', 0.55); return { top: J, sleeve: 'long', bottom: 'pants', bot: J, shoes: '#2a2a3a', deco: (P, v, y) => { if (v === 'front') { P.rect(14, y + 25, 4, 10, W); P.rect(15, y + 26, 2, 8, '#e86a7a'); P.px(13, y + 25, Cl); P.px(18, y + 25, Cl); P.px(12, y + 32, '#f6c64e'); } if (v === 'side') { P.rect(19, y + 25, 2, 6, W); } } }; }
    case 5: return { top: C, sleeve: 'none', bottom: 'gown', bot: C, hem: 50, shoes: C, deco: (P, v, y) => { P.rect(10, y + 33, 12, 1, Cl); for (const [x, yy] of [[11, 40], [18, 44], [21, 38], [13, 47], [16, 36]]) P.px(x, yy, '#ffffff'); } };
    case 6: return { top: C, sleeve: 'long', bottom: 'pants', bot: '#4a4a5a', shoes: '#3a2a2a', deco: (P, v, y) => { if (v === 'front') { P.rect(14, y + 25, 4, 1, W); for (const yy of [28, 31, 34]) P.px(16, y + yy, W); } P.rect(10, y + 37, 12, 1, '#5a3a2e'); if (v === 'front') P.rect(15, y + 37, 2, 1, '#f6c64e'); } };
    case 7: return { top: C, sleeve: 'long', bottom: 'pants', bot: '#8a6a5a', shoes: '#7a4e3a', deco: (P, _v, y) => { P.rect(10, y + 30, 12, 2, Cl); for (let x = 11; x < 22; x += 3) P.px(x, y + 33, Cd); P.rect(10, y + 36, 12, 1, Cd); } };
    case 8: return { top: C, sleeve: 'long', bottom: 'pants', bot: C, shoes: '#f7b8cc', deco: (P, _v, y) => { for (const [x, yy] of [[11, 28], [18, 31], [13, 35], [20, 27], [12, 42], [19, 44]]) P.px(x, yy + (yy < 38 ? y : 0), Cl); } };
    case 9: return { top: C, sleeve: 'long', bottom: 'pants', bot: '#5a8ac8', shoes: '#7a5a3a', deco: (P, v, y) => { for (let yy = 25; yy < 30; yy += 2) for (let x = 10 + (yy % 4 ? 1 : 0); x < 22; x += 2) P.px(x, y + yy, Cd); P.rect(11, y + 30, 10, 8, '#5a8ac8'); if (v !== 'side') { P.rect(11, y + 25, 2, 6, '#5a8ac8'); P.rect(19, y + 25, 2, 6, '#5a8ac8'); } } };
    case 10: return { top: C, sleeve: 'long', bottom: 'pants', bot: '#6a7a5a', shoes: '#e8c040', deco: (P, v, y) => { if (v !== 'back') { P.rect(10, y + 25, 4, 12, '#c8b07a'); P.rect(18, y + 25, 4, 12, '#c8b07a'); P.rect(10, y + 30, 3, 3, '#a8905a'); P.rect(19, y + 30, 3, 3, '#a8905a'); } else P.rect(10, y + 25, 12, 12, '#c8b07a'); } };
    case 11: return { top: C, sleeve: 'long', topEnd: 42, bottom: 'pants', bot: '#5a4a4a', shoes: '#7a4e3a', deco: (P, v, y) => { P.rect(9, y + 24, 14, 3, W); if (v === 'front') { P.rect(16, y + 27, 1, 15, Cd); for (const yy of [30, 34, 38]) P.px(18, y + yy, '#f6c64e'); } } };
    case 12: return { top: C, sleeve: 'long', topEnd: 47, bottom: 'pants', bot: W, legs: W, shoes: '#f6c64e', deco: (P, v, y) => { if (v === 'front') { P.rect(15, y + 24, 2, 2, C); P.px(13, y + 26, '#f6c64e'); for (const [x, yy] of [[12, 39], [19, 43], [14, 34]]) P.px(x, yy, Cl); } } };
    case 13: { const Kc = C === SHIRTS[0] ? '#8db8ef' : '#f59ab3'; return { top: C, sleeve: 'long', topEnd: 32, bottom: 'gown', bot: Kc, hem: 50, shoes: W, deco: (P, v, y) => { P.rect(9, y + 31, 14, 1, mix(Kc, '#ffffff', 0.35)); if (v === 'front') { P.rect(13, y + 25, 6, 1, W); P.rect(15, y + 27, 2, 6, '#e86a7a'); P.px(17, y + 30, '#e86a7a'); } } }; }
    case 14: return { top: C, sleeve: 'short', bottom: 'gown', bot: C, hem: 48, shoes: '#e86a7a', deco: (P, v, y) => { if (v === 'front') { P.rect(14, y + 24, 5, 1, '#f6c64e'); P.line(18, y + 25, 18, y + 30, 1, '#f6c64e'); P.rect(19, 40, 1, 8, S); } for (const [x, yy] of [[11, 30], [19, 36], [13, 42]]) { P.px(x, yy + (yy < 38 ? y : 0), Cl); P.px(x + 1, yy + (yy < 38 ? y : 0), '#f6c64e'); } } };
    case 15: return { top: W, sleeve: 'long', topEnd: 44, bottom: 'skirt', bot: W, hem: 44, shoes: '#f7b8cc', deco: (P, v, y) => { P.rect(10, y + 34, 12, 2, C); if (v === 'front') { P.line(14, y + 24, 17, y + 33, 1, '#e8e0e8'); P.rect(18, y + 36, 2, 4, C); } } };
    case 16: return { top: C, sleeve: 'long', bottom: 'pants', bot: Cd, shoes: W, deco: (P, v, y) => { if (v !== 'back') P.rect(16, y + 25, 1, 11, Cl); P.rect(10, y + 26, 1, 8, W); P.rect(21, y + 26, 1, 8, W); } };
    case 17: return { top: C, sleeve: 'puff', bottom: 'gown', bot: Cl, hem: 51, shoes: '#f6c64e', deco: (P, _v, y) => { P.rect(10, y + 35, 12, 1, '#f6c64e'); for (const [x, yy] of [[9, 44], [14, 47], [21, 42], [23, 48], [11, 39], [18, 40]]) P.px(x, yy, '#ffffff'); } };
    // Đồ hoàng tử: áo trắng cầu vai vàng, đai đỏ chéo, khuy vàng, quần xanh hoàng gia, áo choàng đỏ sau lưng
    case 19: {
      const R = '#c8283a', G = '#f6c64e', N = '#24306a';
      return { top: '#f8f4ea', sleeve: 'long', bottom: 'pants', bot: N, shoes: '#2a1a1a', deco: (P, v, y) => {
        if (v === 'back') { P.rect(9, y + 24, 14, 22, R); P.rect(9, y + 45, 14, 1, mix(R, '#2a1020', 0.35)); P.rect(9, y + 24, 14, 1, G); P.rect(10, y + 26, 1, 18, mix(R, '#ffffff', 0.25)); return; }
        if (v === 'front') {
          P.rect(8, y + 24, 4, 2, G); P.rect(20, y + 24, 4, 2, G); for (const x of [8, 10, 20, 22]) P.px(x, y + 26, G);
          P.rect(14, y + 24, 4, 1, G);
          for (let k = 0; k < 9; k++) P.rect(20 - k, y + 25 + k, 2, 1, k % 4 === 3 ? mix(R, '#ffffff', 0.3) : R);
          for (const yy of [27, 30, 33]) P.px(15, y + yy, G);
          P.rect(10, y + 35, 12, 2, G); P.px(15, y + 35, '#ffffff');
        } else { P.rect(14, y + 24, 4, 2, G); P.rect(11, y + 35, 10, 2, G); }
      } };
    }
    // Đồ bơi: nam quần đùi cởi trần, nữ bikini hai mảnh (màu theo màu áo đang chọn), dép tông
    case 18: {
      const Sd = mix(S, '#c07060', 0.28), Cs = mix(C, '#ffffff', 0.5);
      return girl
        ? { top: S, sleeve: 'none', bottom: 'shorts', bot: C, legs: S, shoes: '#f59ab3', deco: (P, v, y) => {
          if (v === 'front') { P.rect(11, y + 27, 4, 3, C); P.rect(17, y + 27, 4, 3, C); P.px(16, y + 28, C); P.px(12, y + 25, C); P.px(19, y + 25, C); P.px(12, y + 27, Cs); P.px(18, y + 27, Cs); }
          else if (v === 'back') P.rect(10, y + 28, 12, 2, C);
          else P.rect(14, y + 27, 6, 3, C);
          P.rect(10, 36, 12, 3, C); P.rect(10, 36, 12, 1, Cs);
          if (v === 'front') P.px(16, y + 33, Sd);
        } }
        : { top: S, sleeve: 'none', bottom: 'shorts', bot: C, legs: S, shoes: '#5aa8e0', deco: (P, v, y) => {
          if (v === 'front') { P.px(13, y + 29, Sd); P.px(18, y + 29, Sd); P.px(16, y + 33, Sd); }
          P.rect(10, 35, 12, 6, C); P.rect(10, 35, 12, 1, Cs);
          if (v !== 'back') { P.rect(v === 'side' ? 19 : 10, 37, 1, 4, Cs); if (v === 'front') P.rect(21, 37, 1, 4, Cs); }
          P.rect(15, 41, 2, 1, mix(C, '#2a2030', 0.25));
        } };
    }
    default: return { top: C, sleeve: 'short', bottom: 'pants', bot: '#6a7aa8', shoes: '#7a4e3a', deco: (P, v, y) => { if (v === 'front') P.rect(13, y + 25, 6, 1, Cl); } };
  }
}

// ───────── Vẽ ─────────

/**
 * Nhân vật. `view`: hướng nhìn (nghiêng = quay sang phải, lật ảnh khi đi sang trái),
 * `step`: nhịp bước 0..3, `hold`: đang cầm đồ với động tác.
 */
export function chibiSprite(look: ChibiLook, pose: Pose, view: View = 'front', step = 0, hold?: Held): Sprite {
  if ((pose === 'sit' && view === 'front') || pose === 'sleep' || pose === 'dance' || pose === 'act' || pose === 'actsit' || hold) view = 'front';
  if (pose !== 'walk' && pose !== 'dance' && pose !== 'act' && pose !== 'actsit' && pose !== 'makeup') step = 0;
  if (pose === 'makeup' && view === 'side') view = 'front';
  if (pose === 'embrace' || pose === 'kiss') { view = 'side'; step = 0; }
  const S = SKINS[look.skin ?? 0] ?? SKINS[0];
  const H = HAIR_COLORS[look.hairColor ?? 0] ?? HAIR_COLORS[0];
  const C = SHIRTS[look.shirt ?? 0] ?? SHIRTS[0];
  const hairIx = (look.hair ?? 0) % HAIRS.length, out = look.outfit ?? 0, acc = look.acc ?? 0;
  const glasses = look.glasses ?? (acc === 4 ? 1 : 0), girl = look.gender === 'f';
  const design = look.design ?? null;
  const key = `chibi1:${S}:${H}:${C}:${hairIx}:${out}:${acc}:${glasses}:${girl}:${pose}:${view}:${step}` + (design ? `:d:${JSON.stringify(design)}` : '') + (hold ? `:${hold.spec.kind}:${hold.spec.color}:${hold.mode}:${hold.phase}` : '');
  const hit = cache.get(key);
  if (hit) return hit;

  const LW = hold ? 24 : 16, LH = pose === 'sit' || pose === 'actsit' || pose === 'makeup' ? 24 : 26;
  const canvas = document.createElement('canvas');
  canvas.width = (LW + 2) * K; canvas.height = (LH + 2) * K;
  const ctx = canvas.getContext('2d')!;
  const P = hiPen(ctx, K, K);
  draw(P, { S, H, C, hairIx, out, acc, glasses, girl, pose, view, step, hold, design });
  gradeCanvas(ctx, canvas.width, canvas.height);
  outline(ctx, canvas.width, canvas.height, INK);

  if (hold) {                                  // đồ cầm tay: vẽ nét thường rồi phóng lên
    const c1 = document.createElement('canvas');
    c1.width = LW + 2; c1.height = LH + 2;
    const x1 = c1.getContext('2d')!;
    drawProp(pen1(x1), hold.spec, ...propAt(hold), hold.mode === 'sip' && hold.phase === 1 ? 1 : hold.phase);
    outline(x1, c1.width, c1.height, '#4a3040');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c1, 0, 0, c1.width * K, c1.height * K);
  }
  const sprite: Sprite = { url: canvas.toDataURL(), w: LW + 2, h: LH + 2, ...(hold ? { ax: 9 } : {}) };
  cache.set(key, sprite);
  return sprite;
}

function pen1(ctx: CanvasRenderingContext2D): Pen {
  return {
    ctx,
    rect: (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, Math.round(w), Math.round(h)); },
    px: (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1); },
    map: (rows, pal, ox = 0, oy = 0) => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(ox + x + 1, oy + y + 1, 1, 1); } })),
  };
}

/** Chỗ đặt đồ cầm (toạ độ logic cũ 16×26) */
function propAt(h: Held): [number, number] {
  const { mode, phase } = h;
  if (mode === 'read' || mode === 'carry') return [5, 18];
  if (mode === 'roast' || mode === 'fish') return [14, 15];
  if (mode === 'pour') return [13, 18];
  if (phase === 0) return [13, 18];
  if (mode === 'sip') return [9, 12];
  return [9, 11];
}

interface Args { S: string; H: string; C: string; hairIx: number; out: number; acc: number; glasses: number; girl: boolean; pose: Pose; view: View; step: number; hold?: Held; design?: Design | null }

function draw(P: HiPen, a: Args) {
  const { S, H, C, hairIx, out, acc, glasses, pose, view, step, hold } = a;
  const Sd = mix(S, '#c07060', 0.28), Hd = mix(H, '#2a1a1a', 0.3), Hl = mix(H, '#ffffff', 0.32);
  const hair = HAIRS[hairIx];
  const o = a.design ? designOutfit(a.design) : outfitOf(out, C, S, a.girl);
  const sit = pose === 'sit' || pose === 'actsit' || pose === 'makeup';
  const bob = pose === 'walk' && step % 2 === 1 ? -1 : 0;   // nhịp giữa hai bước: người nhổm lên
  const y = bob;                                            // độ lệch phần thân trên
  const side = view === 'side', back = view === 'back';
  const topD = mix(o.top, '#2a2030', 0.22), botD = mix(o.bot, '#2a2030', 0.25);

  // ── Tóc dài phía sau lưng (trước & nghiêng) ──
  const backHair = (hair.back ?? 0) > 20 && !back;
  if (backHair) {
    const end = sit ? Math.min(hair.back!, 40) : hair.back!;
    for (let yy = 12; yy < end; yy++) {
      const w = hair.wavy && yy % 4 < 2 ? 1 : 0;
      if (side) P.rect(3 - w, yy + y, 10 + 2 * w, 1, yy > end - 2 ? Hd : H);
      else P.rect(3 - w, yy + y, 26 + 2 * w, 1, yy > end - 2 ? Hd : H);
    }
  }
  if (!back) extraBehind(P, hair, view, y, H, Hd);

  // ── Chân & giày ──
  const legC = o.bottom === 'pants' ? o.bot : o.legs ?? S;
  const legD = o.bottom === 'pants' ? botD : Sd;
  const shoe = (x: number, yy: number, w: number) => { P.rect(x, yy, w, 4, o.shoes); P.rect(x, yy + 3, w, 1, mix(o.shoes, '#2a1a1a', 0.35)); P.px(x + 1, yy, mix(o.shoes, '#ffffff', 0.4)); };
  if (sit) {
    P.rect(10, 38, 12, 4, legC);                        // đùi hướng ra trước
    P.rect(11, 42, 4, 3, legC); P.rect(17, 42, 4, 3, legC);
    shoe(10, 44, 5); shoe(17, 44, 5);
  } else if (side) {
    const fwd = [5, 0, -5, 0][step], lift = [0, 1, 0, 1][step];
    const leg = (dx: number, c: string, up: number) => {
      for (let yy = 38; yy < 47 - up; yy++) { const x = 14 + (dx * (yy - 38)) / 9; P.rect(x, yy, 4, 1, c); }
      shoe(14 + dx - 1 + (dx > 0 ? 1 : 0), 47 - up, 6);
    };
    leg(-fwd, legD, 0);                                 // chân phía xa (tối hơn)
    leg(fwd, legC, lift);
  } else {
    // nhảy: động tác lẻ co một chân, động tác 6 khuỵu cả hai
    const dl = pose === 'dance' ? [0, 3, 0, 0, 0, 0, 2, 0][step] ?? 0 : 0, dr = pose === 'dance' ? [0, 0, 0, 3, 0, 0, 2, 0][step] ?? 0 : 0;
    const upL = (pose === 'walk' && step === 2 ? 2 : 0) + dl, upR = (pose === 'walk' && step === 0 ? 2 : 0) + dr;
    P.rect(11, 38, 4, 9 - upL, legC); P.rect(17, 38, 4, 9 - upR, legC);
    P.rect(14, 38, 1, 9 - upL, legD); P.rect(20, 38, 1, 9 - upR, legD);
    shoe(10, 47 - upL, 5); shoe(17, 47 - upR, 5);
  }

  // ── Tay phía xa (khi nghiêng) ──
  const swing = pose === 'walk' ? [3, 0, -3, 0][step] : 0;
  const sleeveC = (part: 'up' | 'low') => (o.sleeve === 'long' || o.sleeve === 'puff' && part === 'up' ? o.top : o.sleeve === 'short' && part === 'up' ? o.top : S);
  const arm = (sx: number, sy: number, hx: number, hy: number, far = false) => {
    const mx = (sx + hx) / 2, my = (sy + hy) / 2;
    const up = sleeveC('up'), low = sleeveC('low');
    P.line(sx, sy, mx, my, 3, far ? mix(up, '#2a2030', 0.2) : up);
    P.line(mx, my, hx, hy, 3, far ? mix(low, '#2a2030', 0.2) : low);
    if (o.sleeve === 'puff') P.ell(sx, sy + 1, 2.5, 2, mix(o.top, '#ffffff', 0.3));
    P.ell(hx, hy + 1, 1.8, 1.8, far ? Sd : S);
  };
  const hugging = pose === 'embrace' || pose === 'kiss';
  if (side) { if (hugging) arm(15, y + 27, 29, y + 26, true); else arm(15, y + 27, 15 + swing, y + 35, true); }

  // ── Thân ──
  const tx0 = side ? 11 : 10, tw = side ? 10 : 12;
  const topEnd = sit ? Math.min(o.topEnd ?? 37, 39) : o.topEnd ?? 37;
  P.rect(14, y + 22, 4, 3, Sd);                          // cổ
  P.rect(tx0 + 1, y + 24, tw - 2, 1, o.sleeve === 'none' ? S : o.top);
  P.rect(tx0, y + 25, tw, topEnd - 25, o.top);
  if (o.sleeve === 'none') P.rect(tx0, y + 24, tw, 2, S);
  P.rect(tx0 + tw - 2, y + 25, 2, topEnd - 25, topD);     // bóng bên phải
  // Phần dưới
  if (o.bottom === 'pants' || o.bottom === 'shorts') {
    if (topEnd <= 38) P.rect(10, 37 + (sit ? 0 : 0), 12, sit ? 2 : 2, o.bot);
  } else {
    const hem = sit ? Math.min(o.hem ?? 44, o.bottom === 'gown' ? 46 : 41) : o.hem ?? 44;
    const top = o.bottom === 'gown' ? 33 + y : 35 + y;
    for (let yy = top; yy < hem; yy++) {
      const g = Math.floor((yy - top) / (o.bottom === 'gown' ? 3 : 2));
      const sway = pose === 'walk' && yy > hem - 4 ? (step === 0 ? 1 : step === 2 ? -1 : 0) : 0;
      P.rect(tx0 - g + sway, yy, tw + 2 * g, 1, yy === hem - 1 ? botD : o.bot);
    }
  }
  o.deco?.(P, view, y);

  // ── Tay ──
  let lateArms: (() => void) | null = null;
  if (!side) {
    const swingL = pose === 'walk' ? [1, 0, -1, 0][step] : 0;
    const lx = 8, rx = 23;
    if (hold) holdArms(P, hold, y, (sx, sy, hx, hy) => arm(sx, sy, hx, hy));
    else if (pose === 'dance') {
      // 8 động tác: giơ hai tay · chỉ trời · vỗ tay · dang tay · chỉ chéo · chống hông · vẫy ngang · vẫy chéo ngược
      const moves: [number, number, number, number][] = [
        [3, 9, 29, 9], [7, 33, 30, 8], [14, 30, 18, 30], [1, 26, 31, 26],
        [3, 35, 30, 11], [6, 32, 26, 32], [2, 21, 30, 21], [2, 10, 29, 35],
      ];
      const [hlx, hly, hrx, hry] = moves[step % moves.length];
      // tay giơ cao vẽ sau đầu để không bị tóc che
      lateArms = () => { arm(lx + 1, y + 26, hlx, y + hly); arm(rx - 1, y + 26, hrx, y + hry); };
      if (![0, 1, 4, 6, 7].includes(step % moves.length)) { lateArms(); lateArms = null; }
    } else if (pose === 'makeup') {
      // Trang điểm (16 nhịp, mỗi 4 nhịp một bước): thoa kem · đánh phấn má · kẻ mắt · tô son.
      // Tay phải đưa lên mặt, chấm qua lại; tay trái cầm hộp phấn/gương nhỏ trước ngực.
      const tool = Math.floor(step / 4) % 4, dab = step % 2;
      const hand: [number, number][][] = [
        [[21, 19], [20, 18]], [[22, 18], [21, 20]], [[19, 14], [21, 14]], [[17, 20], [15, 20]],
      ];
      const [hx, hy] = hand[tool][dab];
      const back = view === 'back';
      const r = () => arm(rx - 1, y + 26, back ? 31 - hx : hx, y + hy);
      arm(lx + 1, y + 26, back ? 19 : 12, y + 31);
      if (back) r(); else lateArms = r;                     // nhìn sau lưng: tay khuất sau đầu; nhìn trước: tay trước mặt
    } else if (pose === 'act' || pose === 'actsit') {
      const [hlx, hly, hrx, hry] = ACTS[step % ACTS.length];
      const draw = () => { arm(lx + 1, y + 26, hlx, y + hly); arm(rx - 1, y + 26, hrx, y + hry); };
      // tay đưa lên cao (ngang đầu) vẽ sau đầu để không bị tóc che
      if (hly < 24 || hry < 24) lateArms = draw; else draw();
    } else {
      arm(lx + 1, y + 26, lx, y + 35 + swingL);
      arm(rx - 1, y + 26, rx, y + 35 - swingL);
    }
  } else if (hugging) arm(16, y + 27, 30, y + 31); else arm(16, y + 27, 16 - swing, y + 35);

  // ── Đầu ──
  head(P, a, y, { S, Sd, H, Hd, Hl });
  lateArms?.();
  if (back) extraBehind(P, hair, view, y, H, Hd);
  accessory(P, acc, view, y, H, Hd);
  if (!back) glassesOn(P, glasses, view, y);
  void sit; void C;
}

function holdArms(P: HiPen, h: Held, y: number, arm: (sx: number, sy: number, hx: number, hy: number) => void) {
  const { mode, phase } = h;
  arm(9, y + 26, 8, y + 35);                                       // tay trái buông
  if (mode === 'read' || mode === 'carry') { arm(9, y + 26, 12, y + 36); arm(22, y + 26, 21, y + 36); return; }
  if (mode === 'roast' || mode === 'fish') { arm(22, y + 26, 28, y + 31); return; }
  if (mode === 'pour') { arm(22, y + 26, 26, y + 36); return; }
  if (phase === 0) { arm(22, y + 26, 26, y + 36); return; }
  if (mode === 'sip') { arm(22, y + 26, 22, y + 28); return; }
  arm(22, y + 26, 21, y + 27);
}

function head(P: HiPen, a: Args, y: number, c: { S: string; Sd: string; H: string; Hd: string; Hl: string }) {
  const { pose, view, girl } = a;
  const hair = HAIRS[a.hairIx];
  const side = view === 'side', back = view === 'back';
  const cx = side ? 17 : 16;
  // tai
  if (!side) { P.ell(4.6, y + 16, 1.6, 2.4, c.S); P.ell(27.4, y + 16, 1.6, 2.4, c.S); P.px(4, y + 16, c.Sd); P.px(27, y + 16, c.Sd); }
  // mặt
  if (side) { P.ell(18, y + 14.5, 9.6, 9.6, c.S); P.rect(27, y + 16, 1, 3, c.S); }
  else P.ell(cx, y + 14.5, 11.5, 9.6, c.S);
  if (!back) {
    const eye = (x: number, w3: boolean) => {
      if (pose === 'sleep' || pose === 'kiss') { P.px(x, y + 18, INK); P.rect(x + 1, y + 19, w3 ? 1 : 2, 1, INK); P.px(x + (w3 ? 2 : 3), y + 18, INK); return; }
      const rows = w3 ? ['.KK', 'WKK', 'WKK', 'KKK', 'KIK', '.K.'] : ['.KK.', 'KWKK', 'KWKK', 'KKKK', 'KIIK', '.KK.'];
      P.map(rows, { K: INK, W: '#ffffff', I: '#7a5a9a' }, x, y + 15);
      if (girl && !w3 && x < 16) P.px(x - 1, y + 16, INK);
    };
    if (side) { eye(22, true); if (girl) P.px(25, y + 16, INK); }
    else { eye(9, false); eye(19, false); if (girl) P.px(23, y + 16, INK); }
    // lông mày khi để lộ trán
    if (hair.bangs === 'up') { if (side) P.rect(22, y + 12, 3, 1, c.Hd); else { P.rect(9, y + 12, 3, 1, c.Hd); P.rect(20, y + 12, 3, 1, c.Hd); } }
    // má hồng & miệng
    const blush = '#f6a0a8';
    if (side) { P.rect(21, y + 21, 3, 1, blush); P.rect(24, y + 22, 2, 1, girl ? '#d0606a' : '#9a4a52'); }
    else {
      P.rect(6, y + 21, 3, 1, blush); P.rect(23, y + 21, 3, 1, blush);
      P.rect(15, y + 22, 2, 1, girl ? '#d0606a' : '#9a4a52');
      if (girl && pose !== 'sleep') P.px(16, y + 23, '#f29aa2');
    }
  }

  // tóc: dựng mặt nạ rồi tô H / bóng / ánh sáng
  const W = 32, Hh = 52;
  const m = new Uint8Array(W * Hh);
  const set = (x: number, yy: number) => { if (x >= 0 && x < W && yy >= 0 && yy < Hh) m[yy * W + x] = 1; };
  const hcx = side ? 15 : 16, rx = 13.6, ry = 11.4, hcy = 11.6;
  const sideEnd = back ? Math.max(hair.side, 21) : hair.side;
  for (let yy = 0; yy < 44; yy++) for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - hcx) / rx, dy = (yy + 0.5 - hcy) / ry;
    const inCap = dx * dx + dy * dy <= 1;
    let on = false;
    if (back) on = inCap || (yy >= 12 && yy < sideEnd && x >= 4 && x <= 27 && !(yy >= sideEnd - 2 && (x < 6 || x > 25)));
    else if (side) {
      const nape = Math.max(sideEnd, 21);
      on = (inCap && (x < 12 ? yy < nape : x < 15 ? yy < Math.max(14, Math.min(nape, 21) - (x - 11) * 2) : yy < bangY(hair.bangs, x - 2))) || (x >= 3 && x < 12 && yy >= 12 && yy < nape && !(yy >= nape - 1 && x < 5));
    }
    else {
      const sideCol = x < 6 || x > 25;
      on = (inCap && (yy < bangY(hair.bangs, x) || (sideCol && yy < sideEnd))) || ((x >= 3 && x <= 6 || x >= 25 && x <= 28) && yy >= 12 && yy < sideEnd);
    }
    if (hair.bangs === 'up' && yy < 2 && Math.abs(x - hcx) < 6) on = true;
    if (hair.bangs === 'spiky' && yy < 3 && (x % 5 === 1 || x % 5 === 2) && x > 5 && x < 27) on = true;
    if (hair.wavy && on && yy > 16 && (x <= 3 || x >= 28) && yy % 4 >= 2) on = false;
    if (on) set(x, yy);
  }
  const at = (x: number, yy: number) => x >= 0 && x < W && yy >= 0 && yy < Hh && m[yy * W + x] === 1;
  for (let yy = 0; yy < Hh; yy++) for (let x = 0; x < W; x++) {
    if (!at(x, yy)) continue;
    let col = c.H;
    if (!at(x, yy + 1) && yy > 6) col = c.Hd;                         // đuôi mái
    else if (x > hcx + 10) col = c.Hd;
    const arc = Math.round(4.5 + ((x - hcx + 2) / 9) ** 2 * 3.5);
    if (yy === arc && Math.abs(x - hcx + 2) < 9 && x % 6 !== 0) col = c.Hl;   // vệt sáng hình vòng cung
    P.px(x, yy + y, col);
  }
  if (side && hair.side < 24) { P.ell(13.5, y + 16, 1.8, 2.4, c.S); P.px(13, y + 16, c.Sd); }
  // bóng mái đổ xuống trán
  if (!back) for (let x = 6; x < 26; x++) for (let yy = 8; yy < 12; yy++) if (at(x, yy) && !at(x, yy + 1)) {
    const dx = (x + 0.5 - cx) / (side ? 10.5 : 11.5), dy = (yy + 1.5 - 14.5) / 9.6;
    if (dx * dx + dy * dy <= 1 && !(yy + 1 >= 15 && yy + 1 <= 20 && (x >= 9 && x <= 12 || x >= 19 && x <= 22))) P.px(x, yy + 1 + y, c.Sd);
    break;
  }
}

function extraBehind(P: HiPen, hair: HairSpec, view: View, y: number, H: string, Hd: string) {
  const ribbon = '#f08aa6';
  if (hair.extra === 'bun') { const x = view === 'side' ? 9 : 16; P.ell(x, y + 1.5, 4.2, 3.2, H); P.px(x - 1, y, mix(H, '#ffffff', 0.3)); P.rect(x - 3, y + 4, 6, 1, Hd); }
  if (hair.extra === 'buns') { if (view === 'side') P.ell(8, y + 3, 3.6, 3.2, H); else { P.ell(5, y + 3, 3.6, 3.2, H); P.ell(27, y + 3, 3.6, 3.2, H); } }
  if (hair.extra === 'twin') {
    const tail = (x: number) => { P.ell(x, y + 24, 2.8, 9, H); P.rect(x - 1, y + 30, 2, 2, Hd); P.ell(x, y + 14, 2.2, 1.4, ribbon); };
    if (view === 'side') tail(6); else { tail(2.5); tail(29.5); }
  }
  if (hair.extra === 'pony') {
    if (view === 'back') { P.ell(16, y + 25, 3.2, 8, H); P.ell(16, y + 16, 2.4, 1.4, ribbon); }
    else if (view === 'side') { P.ell(3.5, y + 21, 3, 8, H); P.ell(5, y + 13, 1.6, 1.6, ribbon); }
    else { P.ell(28.5, y + 19, 2.4, 6, H); P.px(28, y + 12, ribbon); P.px(29, y + 12, ribbon); }
  }
}

function accessory(P: HiPen, acc: number, view: View, y: number, H: string, Hd: string) {
  const side = view === 'side', back = view === 'back';
  const W = '#fffaf0';
  switch (acc) {
    case 1: P.map(['RR...RR', 'RRRWRRR', 'RR...RR'], { R: '#f06a8a', W: '#ffb3c6' }, side ? 6 : 21, y + 2); break;
    case 2: { const x = side ? 9 : back ? 24 : 7; P.ell(x, y + 7, 2.6, 2.6, W); P.px(x, y + 7, '#f6c64e'); P.px(x - 1, y + 7, '#f6c64e'); break; }
    case 3: { for (let yy = 0; yy < 10; yy++) { const half = Math.round(Math.sqrt(Math.max(0, 1 - ((9.5 - yy) / 10) ** 2)) * 13.5); P.rect(16 - half, y + yy, half * 2, 1, yy % 3 === 0 ? '#fbe08a' : '#f6c64e'); }
      P.rect(2, y + 8, 28, 3, '#e8a84a'); P.ell(16, y, 2.8, 2.4, W); break; }
    case 5: for (const x of [5, 23]) { P.map(['..H...', '.HHH..', 'HHPHH.', 'HHHHH.'], { H, P: '#f7a1a8' }, x, y - 1); } break;
    case 6: P.ell(16, y + 8.5, 16, 2.8, '#e8c070'); P.ell(16, y + 4, 9, 5, '#f2d48a'); P.rect(7, y + 6, 18, 2, '#e86a7a'); break;
    case 7: P.rect(6, y, 20, 7, '#9aaa7a'); P.rect(3, y + 6, 26, 3, '#8a9a6a'); P.rect(7, y, 18, 1, '#aaba8a'); break;
    case 8: P.map(['Y..Y..Y', 'YY.Y.YY', 'YYYYYYY', 'YPYYYPY', 'YYYYYYY'], { Y: '#f6c64e', P: '#f59ab3' }, 12, y - 2); break;
    case 9: P.map(['..Y..', '.YYY.', 'YYYYY', '.Y.Y.'], { Y: '#f6c64e' }, side ? 7 : 21, y + 5); break;
    case 10: P.rect(9, y + 22, 14, 4, '#e86a7a'); P.rect(9, y + 23, 14, 1, '#f7b8cc'); if (!back) { P.rect(18, y + 26, 4, 7, '#e86a7a'); P.rect(18, y + 32, 4, 1, '#f7b8cc'); } break;
    case 11: P.ell(16, y + 5, 13, 6, '#5a7ac8'); P.rect(3, y + 8, 26, 2, '#4a6ab8'); P.px(16, y, W);
      if (side) P.rect(20, y + 9, 10, 2, '#4a6ab8'); else if (!back) P.rect(8, y + 9, 16, 2, '#3a5aa8'); break;
    case 12: P.ell(16, y + 4, 14, 6.5, W); P.rect(3, y + 8, 26, 2, '#f7b8cc'); P.px(11, y + 1, '#ffffff'); break;
  }
  void Hd;
}

function glassesOn(P: HiPen, g: number, view: View, y: number) {
  if (!g) return;
  if (g === 5) {
    const M = '#eef2f2', D = '#cfd8da', x0 = view === 'side' ? 15 : 6, w = view === 'side' ? 13 : 20;
    P.rect(x0, y + 12, w, 4, M); P.rect(x0, y + 19, w, 5, M);
    const eyes = view === 'side' ? [[21, 5]] : [[9, 4], [19, 4]];
    let cx = x0;
    for (const [ex, ew] of eyes) { P.rect(cx, y + 16, ex - cx, 3, M); cx = ex + ew; }
    P.rect(cx, y + 16, x0 + w - cx, 3, M);
    for (let k = 0; k < 6; k++) P.rect(x0 + 2 + k * 3, y + 13 + (k % 2) * 8, 1, 1, D);
    return;
  }
  const fr = g === 3 ? '#1a1424' : g === 4 ? '#c0305a' : g === 2 ? '#2a2438' : '#5a3a40';
  const lens = (x: number, w: number) => {
    if (g === 4) { P.map(['.RR.RR.', 'RRWRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#f0507a', W: '#ffd0dc' }, x - 1, y + 14); return; }
    const round = g === 1;
    P.rect(x + (round ? 1 : 0), y + 14, w - (round ? 2 : 0), 1, fr); P.rect(x + (round ? 1 : 0), y + 21, w - (round ? 2 : 0), 1, fr);
    P.rect(x, y + 15, 1, 6, fr); P.rect(x + w - 1, y + 15, 1, 6, fr);
    if (g === 3) { P.rect(x + 1, y + 15, w - 2, 6, '#2a2438'); P.rect(x + 1, y + 15, 2, 1, '#9a9ab8'); }
  };
  if (view === 'side') { lens(20, 7); P.rect(13, y + 16, 7, 1, fr); return; }
  lens(7, 7); lens(18, 7);
  if (g !== 4) { P.rect(14, y + 16, 4, 1, fr); P.rect(5, y + 16, 2, 1, fr); P.rect(25, y + 16, 2, 1, fr); }
}
