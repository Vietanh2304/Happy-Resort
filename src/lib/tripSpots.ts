// Map tham quan riêng của từng điểm du lịch: vẽ pixel 256×192 theo giờ trong ngày (đêm thì đèn sáng),
// hiệu ứng động (nước gợn, đèn lồng, lá rơi, tuyết, cực quang…), khu đi dạo và các hoạt động bấm được.
import type { Phase } from './content';
import { makeSprite, mix, type Pen, type Sprite } from './pixel';
import { seeded } from './rng';
import type { TripId } from './trips';

export type SpotScene =
  | 'trip_taichung_rainbow' | 'trip_taichung_fengjia' | 'trip_taichung_sunmoon'
  | 'trip_gwangju_mudeung' | 'trip_gwangju_penguin' | 'trip_gwangju_chungjang'
  | 'trip_hoian_lantern' | 'trip_hoian_river'
  | 'trip_tokyo_asakusa' | 'trip_tokyo_ueno' | 'trip_tokyo_shibuya'
  | 'trip_paris_eiffel' | 'trip_paris_seine' | 'trip_paris_cafe'
  | 'trip_venice_canal' | 'trip_venice_sanmarco'
  | 'trip_swiss_station' | 'trip_swiss_chalet'
  | 'trip_iceland_aurora' | 'trip_iceland_lagoon';

export type Fx =
  | { k: 'shim'; x: number; y: number; w: number; h: number; n: number; c?: string }          // nước lấp lánh
  | { k: 'fall'; n: number; c: string[]; size?: number; slow?: boolean }                      // lá / hoa / tuyết rơi
  | { k: 'sway'; x: number; y: number; c: string; big?: boolean }                             // đèn lồng đung đưa
  | { k: 'steam'; x: number; y: number; n?: number }                                          // khói, hơi nước
  | { k: 'glow'; x: number; y: number; r: number; c: string; night?: boolean }                // quầng sáng nhấp nháy
  | { k: 'move'; spr: MiniId; x: number; y: number; dx: number; dur: number; loop?: boolean } // thuyền, tàu, cáp treo
  | { k: 'bird'; x: number; y: number; icon: string; n: number }                              // chim, bướm
  | { k: 'aurora'; y: number }
  | { k: 'sparkle'; x: number; y: number; w: number; h: number; n: number; night?: boolean }
  | { k: 'screen'; x: number; y: number; w: number; h: number };                             // màn hình quảng cáo đổi màu

export type Act =
  | { k: 'photo'; x: number; y: number }
  | { k: 'buy'; x: number; y: number; item: string; price: number; label: string }
  | { k: 'fortune'; x: number; y: number; label: string }
  | { k: 'ride'; x: number; y: number; label: string; spr: MiniId; ry: number; say: string }
  | { k: 'float'; x: number; y: number; label: string; ry: number }
  | { k: 'do'; x: number; y: number; label: string; say: string; do: DoKind; res?: { icon: string; x: number; y: number }; outfit?: number; at?: { x: number; y: number } };
/** Hành động nhân vật: ngồi, khấn, ngâm nước, chui lều, cho chim ăn, vẽ, hát, hôn… */
export type DoKind = 'watch' | 'gaze' | 'jar' | 'cow' | 'wall' | 'mask' | 'dress' | 'sit' | 'craft' | 'cheer' | 'pray' | 'feed' | 'paint' | 'cross' | 'love' | 'tent' | 'soak' | 'pick' | 'sing';

export interface SpotDef {
  trip: TripId; id: string; name: string; icon: string;
  at: number;                       // vị trí nhãn trên phố chính
  walk: { x0: number; x1: number; y0: number; y1: number };
  day: [string, string];            // màu trời ban ngày
  draw: (p: Pen, L: Light) => void;
  fx: Fx[]; acts: Act[]; lines: string[];
}

// ───────── bộ vẽ chung ─────────
export interface Light { ph: Phase; night: boolean; dusk: boolean; r: () => number; wins: number[][]; lamps: { x: number; y: number; c: string; big?: boolean }[]; neon: { x: number; y: number; w: number; h: number; c: string }[] }
const SKY: Record<Phase, [string, string]> = { day: ['#7ac8f0', '#d8f0ff'], dawn: ['#f0a8c0', '#ffe2b0'], sunset: ['#5a4ab8', '#ff9a6a'], night: ['#0a1034', '#283070'] };

export function circle(p: Pen, cx: number, cy: number, r: number, c: string) {
  for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); p.rect(cx - w, cy + dy, w * 2 + 1, 1, c); }
}
export function sky(p: Pen, L: Light, day: [string, string], h = 100, sunX = 200) {
  const c = L.ph === 'day' ? day : SKY[L.ph];
  for (let y = 0; y < h; y++) p.rect(0, y, 256, 1, mix(c[0], c[1], y / h));
  p.rect(0, h, 256, 192 - h, c[1]);   // lót màu trời phía dưới để khe giữa các toà không bị đen
  if (L.night) {
    for (let i = 0; i < 60; i++) p.px(Math.floor(L.r() * 256), Math.floor(L.r() * h * 0.8), L.r() < 0.3 ? '#ffe8a8' : '#ffffff');
    circle(p, sunX, 18, 6, '#fff6d0'); circle(p, sunX + 3, 16, 5, mix(c[0], c[1], 0.15));
  } else if (L.dusk) { circle(p, sunX, h - 22, 11, '#ffb060'); circle(p, sunX, h - 22, 8, '#ffd890'); }
  else if (L.ph === 'dawn') circle(p, sunX, h - 30, 8, '#ffe0a0');
  else circle(p, sunX, 20, 8, '#fff2a0');
  const cc = L.night ? '#2a3068' : L.dusk ? '#f8a8a0' : '#ffffff';
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(L.r() * 240), y = 10 + Math.floor(L.r() * h * 0.4);
    for (let k = 0; k < 4; k++) circle(p, x + k * 6, y + (k % 2) * 2, 4 + (k % 2) * 2, cc);
  }
}
export function ridge(p: Pen, base: number, h: number, f: number, c: string, seed: number, snow?: string) {
  for (let x = 0; x < 256; x++) {
    const hh = h * (0.55 + 0.3 * Math.sin(x / f + seed) + 0.15 * Math.sin(x / (f / 3) + seed * 2));
    p.rect(x, base - hh, 1, hh, c);
    if (snow && hh > h * 0.7) p.rect(x, base - hh, 1, Math.min(6, hh - h * 0.7), snow);
  }
}
export function band(p: Pen, y0: number, y1: number, c0: string, c1: string) { for (let y = y0; y < y1; y++) p.rect(0, y, 256, 1, mix(c0, c1, (y - y0) / Math.max(1, y1 - y0))); }
export function water(p: Pen, L: Light, y0: number, y1: number, c0: string, c1: string) {
  const t = L.night ? '#0a1838' : L.dusk ? '#c86a6a' : null;
  band(p, y0, y1, t ? mix(c0, t, 0.5) : c0, t ? mix(c1, t, 0.5) : c1);
  for (let i = 0; i < 70; i++) p.rect(Math.floor(L.r() * 256), y0 + 2 + Math.floor(L.r() * (y1 - y0 - 3)), 3 + Math.floor(L.r() * 6), 1, mix(c0, '#ffffff', 0.45));
}
export function tiles(p: Pen, y0: number, y1: number, c0: string, c1: string, step = 8) {
  band(p, y0, y1, c0, c1);
  for (let y = y0 + 4; y < y1; y += step) { p.rect(0, y, 256, 1, mix(c1, '#000000', 0.08)); for (let x = (y / step) % 2 ? 0 : step; x < 256; x += step * 2) p.rect(x, y - step + 1, 1, step - 1, mix(c1, '#000000', 0.06)); }
}
export function bldg(p: Pen, L: Light, x: number, yb: number, w: number, h: number, wall: string, roof?: string, win = '#8ac0e0', gap = 7) {
  p.rect(x, yb - h, w, h, wall); p.rect(x, yb - h, w, 1, mix(wall, '#ffffff', 0.3)); p.rect(x + w - 1, yb - h, 1, h, mix(wall, '#000000', 0.15));
  if (roof) p.rect(x - 1, yb - h - 3, w + 2, 3, roof);
  for (let yy = yb - h + 4; yy < yb - 8; yy += gap + 2) for (let xx = x + 3; xx < x + w - 4; xx += gap) { p.rect(xx, yy, 4, 5, win); L.wins.push([xx, yy, 4, 5]); }
  p.rect(x + Math.floor(w / 2) - 2, yb - 8, 5, 8, mix(wall, '#000000', 0.45));
}
export function tree(p: Pen, x: number, y: number, r: number, c: string, trunk = '#6a4a32') {
  p.rect(x - 1, y - r - 4, 3, r + 4, trunk);
  circle(p, x, y - r - 6, r, c); circle(p, x - r / 2, y - r - 3, r * 0.7, mix(c, '#000000', 0.15)); circle(p, x + r / 3, y - r - 9, r * 0.6, mix(c, '#ffffff', 0.18));
}
export function pine(p: Pen, x: number, y: number, h: number, c: string, snow?: string) {
  p.rect(x, y - 3, 2, 3, '#5a3a2a');
  for (let i = 0; i < h; i++) { const w = Math.max(1, Math.round((h - i) * 0.4 + ((i % 4) < 2 ? 1 : 0))); p.rect(x + 1 - w, y - 3 - i, w * 2, 1, c); if (snow && i % 4 === 0) p.rect(x + 1 - w, y - 3 - i, w, 1, snow); }
}
export function speckle(p: Pen, L: Light, x0: number, y0: number, w: number, h: number, n: number, cs: string[]) { for (let i = 0; i < n; i++) p.px(x0 + Math.floor(L.r() * w), y0 + Math.floor(L.r() * h), cs[i % cs.length]); }
export function rail(p: Pen, y: number, c: string) { p.rect(0, y, 256, 1, c); for (let x = 2; x < 256; x += 8) p.rect(x, y, 1, 6, c); p.rect(0, y + 5, 256, 1, mix(c, '#000000', 0.2)); }
export function string(p: Pen, L: Light, x0: number, x1: number, y: number, sag: number, cs: string[], step = 9) {
  for (let x = x0; x <= x1; x++) { const t = (x - x0) / (x1 - x0); p.px(x, y + Math.round(Math.sin(t * Math.PI) * sag), '#3a2a2a'); }
  for (let x = x0 + 4; x < x1; x += step) { const t = (x - x0) / (x1 - x0); L.lamps.push({ x, y: y + Math.round(Math.sin(t * Math.PI) * sag) + 1, c: cs[(x / step | 0) % cs.length] }); }
}

/** Vẽ nền một map tham quan (có cache theo phase) */
export function spotBackground(scene: SpotScene, ph: Phase): Sprite {
  const s = SPOTS[scene];
  return paint(`spot:v1:${scene}:${ph}`, scene, s.draw, ph, s.trip === 'iceland' && s.id === 'aurora');
}
/** Vẽ một cảnh: nền → phủ màu theo giờ → cửa sổ sáng, neon, đèn lồng có quầng */
export function paint(key: string, seed: string, draw: (p: Pen, L: Light) => void, ph: Phase, alwaysNight = false): Sprite {
  return makeSprite(key, 256, 192, p => {
    const L: Light = { ph, night: ph === 'night' || alwaysNight, dusk: ph === 'sunset' && !alwaysNight, r: seeded(seed), wins: [], lamps: [], neon: [] };
    draw(p, L);
    if (L.night) p.rect(0, 0, 256, 192, '#08103a70'); else if (L.dusk) p.rect(0, 0, 256, 192, '#ff70401c'); else if (ph === 'dawn') p.rect(0, 0, 256, 192, '#ffb0c014');
    const lit = L.night || L.dusk;
    if (lit) for (const [x, y, w, h] of L.wins) if (L.r() < 0.75) { p.rect(x, y, w, h, L.r() < 0.5 ? '#ffd88a' : '#ffe8b0'); p.rect(x - 1, y - 1, w + 2, h + 2, '#ffd88a22'); }
    for (const n of L.neon) { if (lit) p.rect(n.x - 2, n.y - 2, n.w + 4, n.h + 4, n.c + '40'); p.rect(n.x, n.y, n.w, n.h, lit ? n.c : mix(n.c, '#888888', 0.4)); p.rect(n.x + 1, n.y + 1, n.w - 2, 1, '#ffffffa0'); }
    for (const l of L.lamps) {
      const z = l.big ? 2 : 1;
      if (lit) { circle(p, l.x + z, l.y + 2 * z, 6 * z, l.c + '26'); circle(p, l.x + z, l.y + 2 * z, 3 * z, l.c + '50'); }
      p.rect(l.x, l.y, 3 * z, 4 * z, l.c); p.rect(l.x, l.y, 3 * z, 1, '#3a2a1a'); p.rect(l.x, l.y + 4 * z - 1, 3 * z, 1, '#3a2a1a');
      p.px(l.x + z, l.y + z, lit ? '#fff4c0' : mix(l.c, '#ffffff', 0.4));
    }
  }, null);
}

// ───────── sprite nhỏ chuyển động ─────────
export type MiniId = 'boat' | 'gondola' | 'swan' | 'cable' | 'train' | 'bateau' | 'sampan' | 'scooter' | 'vespa' | 'bus' | 'car' | 'cyclo';
export function miniSprite(id: MiniId): Sprite {
  const W: Record<MiniId, [number, number]> = { boat: [22, 10], gondola: [34, 16], swan: [16, 14], cable: [12, 14], train: [72, 16], bateau: [48, 14], sampan: [26, 12], scooter: [16, 16], vespa: [16, 16], bus: [56, 22], car: [30, 14], cyclo: [22, 18] };
  const [w, h] = W[id];
  return makeSprite(`mini:${id}`, w, h, p => {
    if (id === 'boat') { p.rect(2, 6, 18, 3, '#f0f0f0'); p.rect(0, 5, 22, 1, '#d8302a'); p.rect(6, 1, 9, 4, '#5aa8e0'); p.rect(7, 2, 3, 2, '#d8f0ff'); p.rect(11, 2, 3, 2, '#d8f0ff'); }
    if (id === 'sampan') { p.rect(1, 8, 24, 3, '#6a3a22'); p.rect(0, 7, 26, 1, '#8a5a32'); p.rect(7, 3, 12, 4, '#c8a060'); p.rect(6, 2, 14, 1, '#7a4a2a'); p.rect(13, 0, 2, 2, '#e8443a'); }
    if (id === 'gondola') { p.rect(2, 12, 30, 2, '#14141c'); p.rect(0, 10, 3, 3, '#14141c'); p.rect(31, 9, 3, 4, '#14141c'); p.px(33, 8, '#d8c890'); p.rect(12, 10, 8, 2, '#a83a3a'); p.rect(25, 3, 3, 7, '#f0f0f0'); p.rect(25, 4, 3, 1, '#d8302a'); p.rect(25, 6, 3, 1, '#d8302a'); p.rect(25, 1, 3, 2, '#e8c8a0'); p.rect(24, 0, 5, 1, '#3a2a1a'); p.rect(22, 2, 1, 12, '#8a6a3a'); }
    if (id === 'swan') { p.rect(2, 8, 12, 5, '#ffffff'); p.rect(0, 7, 4, 3, '#ffffff'); p.rect(11, 2, 3, 7, '#ffffff'); p.rect(13, 2, 3, 2, '#f6a83a'); p.px(12, 3, '#1a1a1a'); p.rect(5, 6, 6, 2, '#f8b8cc'); }
    if (id === 'cable') { p.rect(5, 0, 2, 4, '#4a4a5a'); p.rect(1, 4, 10, 9, '#e8443a'); p.rect(2, 6, 8, 4, '#c8e8ff'); p.rect(1, 12, 10, 1, '#8a2a2a'); }
    if (id === 'train') for (let c = 0; c < 3; c++) { const x = c * 24; p.rect(x + 1, 2, 22, 11, '#d8302a'); p.rect(x + 1, 2, 22, 2, '#f0f0f0'); for (let k = 0; k < 4; k++) p.rect(x + 3 + k * 5, 5, 4, 4, '#c8e8ff'); p.rect(x + 1, 11, 22, 1, '#8a1a1a'); p.rect(x + 4, 13, 3, 3, '#2a2a2a'); p.rect(x + 17, 13, 3, 3, '#2a2a2a'); }
    if (id === 'scooter' || id === 'vespa') {
      const c = id === 'vespa' ? '#8ad0c0' : '#e8443a';
      p.rect(3, 9, 10, 3, c); p.rect(11, 4, 2, 6, '#3a3a3a'); p.rect(10, 3, 4, 1, '#3a3a3a'); circle(p, 3, 13, 2, '#2a2a2a'); circle(p, 12, 13, 2, '#2a2a2a');
      p.rect(5, 2, 4, 7, id === 'vespa' ? '#f0e0c0' : '#3a6ad0'); circle(p, 7, 1, 2, id === 'vespa' ? '#e8443a' : '#f6c445'); p.px(14, 9, '#fff0a0');
    }
    if (id === 'bus') { p.rect(1, 2, 54, 15, '#3a9a5a'); p.rect(1, 2, 54, 2, '#f0f0f0'); for (let k = 0; k < 7; k++) p.rect(4 + k * 7, 5, 5, 6, '#c8e8ff'); p.rect(50, 5, 4, 10, '#c8e8ff'); p.rect(1, 14, 54, 1, '#2a6a3a'); circle(p, 10, 18, 3, '#2a2a2a'); circle(p, 44, 18, 3, '#2a2a2a'); p.px(54, 15, '#fff0a0'); }
    if (id === 'car') { p.rect(1, 6, 28, 5, '#f6c445'); p.rect(7, 1, 15, 5, '#f6c445'); p.rect(9, 2, 5, 4, '#c8e8ff'); p.rect(15, 2, 5, 4, '#c8e8ff'); circle(p, 7, 11, 2, '#2a2a2a'); circle(p, 23, 11, 2, '#2a2a2a'); p.px(28, 7, '#fff0a0'); }
    if (id === 'cyclo') { circle(p, 4, 14, 3, '#2a2a2a'); circle(p, 18, 14, 3, '#2a2a2a'); p.rect(1, 6, 10, 6, '#3a6a9a'); p.rect(0, 2, 12, 2, '#e8443a'); p.rect(11, 9, 8, 1, '#3a3a3a'); p.rect(15, 3, 3, 6, '#f0f0f0'); circle(p, 16, 2, 2, '#e8d8a0'); }
    if (id === 'bateau') { p.rect(2, 9, 44, 4, '#f0f0f0'); p.rect(0, 8, 48, 1, '#2a4a8a'); p.rect(6, 3, 34, 5, '#c8e8ff'); p.rect(6, 2, 34, 1, '#ffffff'); for (let k = 8; k < 40; k += 5) p.rect(k, 3, 1, 5, '#8aa0b8'); }
  });
}

// ───────── danh sách map ─────────
const ph = (x: number, y: number): Act => ({ k: 'photo', x, y });
const buy = (x: number, y: number, item: string, price: number, label: string): Act => ({ k: 'buy', x, y, item, price, label });
const say = (x: number, y: number, label: string, s: string, d: DoKind): Extract<Act, { k: 'do' }> => ({ k: 'do', x, y, label, say: s, do: d });
const W = (y0: number, y1 = 186, x0 = 8, x1 = 248) => ({ x0, x1, y0, y1 });
const RAINBOW = ['#e8443a', '#f6a83a', '#f6e04a', '#6ac86a', '#4a9ae8', '#9a6ae0', '#f59ab3'];

export const SPOTS: Record<SpotScene, SpotDef> = {
  // ═════════ ĐÀI TRUNG ═════════
  trip_taichung_rainbow: {
    trip: 'taichung', id: 'rainbow', name: 'Làng Cầu Vồng', icon: '🌈', at: 40, walk: W(116), day: ['#6ac0f0', '#d8f4ff'],
    draw: (p, L) => {
      sky(p, L, ['#6ac0f0', '#d8f4ff'], 70, 210);
      ridge(p, 70, 18, 22, '#8ab0c8', 1);
      // dãy nhà thấp vẽ đầy hình
      for (let i = 0; i < 5; i++) {
        const x = i * 52, wall = ['#fff4e0', '#ffe8f0', '#f0f8e8', '#fff8d0', '#e8f4ff'][i];
        p.rect(x, 52, 50, 64, wall); p.rect(x - 1, 48, 52, 4, '#8a5a3c'); p.rect(x, 52, 50, 1, '#ffffff');
        // sọc cầu vồng, chấm bi, hoa, mặt cười
        for (let k = 0; k < 7; k++) p.rect(x + 3, 56 + k * 2, 44, 2, RAINBOW[(k + i) % 7]);
        for (let k = 0; k < 6; k++) circle(p, x + 8 + k * 7, 78, 2, RAINBOW[(k * 3 + i) % 7]);
        circle(p, x + 14, 96, 7, '#f6e04a'); p.px(x + 12, 94, '#3a2a2a'); p.px(x + 16, 94, '#3a2a2a'); p.rect(x + 12, 98, 5, 1, '#e8443a');
        for (let k = 0; k < 5; k++) { const a = k * 1.25; circle(p, x + 36 + Math.round(Math.cos(a) * 4), 94 + Math.round(Math.sin(a) * 4), 2, RAINBOW[(k + i + 2) % 7]); }
        circle(p, x + 36, 94, 2, '#ffe060');
        p.rect(x + 28, 104, 1, 12, '#3a8a3a'); p.rect(x + 44, 104, 1, 12, '#3a8a3a');
        for (let k = 0; k < 4; k++) p.rect(x + 4 + k * 3, 106 + (k % 2) * 3, 2, 2, RAINBOW[k]);
        p.rect(x + 22, 100, 7, 16, '#5a8ad0'); p.px(x + 27, 108, '#ffe060');
        L.wins.push([x + 40, 82, 6, 6]); p.rect(x + 40, 82, 6, 6, '#8ac0e0');
      }
      // ngõ sơn hoa văn dưới đất
      band(p, 116, 192, '#e8e0d0', '#d8ccb8');
      for (let y = 124; y < 192; y += 14) for (let x = (y / 14 % 2) * 14; x < 256; x += 28) {
        circle(p, x + 7, y, 4, RAINBOW[(x + y) / 14 % 7 | 0] + 'c0'); circle(p, x + 7, y, 1, '#ffffff');
      }
      for (let x = 0; x < 256; x += 4) p.rect(x, 118, 2, 2, RAINBOW[(x / 4) % 7]);
      // ông cụ vẽ tranh + chậu sơn
      p.rect(226, 140, 10, 7, '#f0f0f0'); p.rect(227, 138, 8, 2, '#e8443a'); p.rect(238, 142, 6, 5, '#4a9ae8');
    },
    fx: [{ k: 'bird', x: 60, y: 60, icon: '🦋', n: 3 }, { k: 'sparkle', x: 0, y: 50, w: 256, h: 60, n: 8 }],
    acts: [ph(70, 130), buy(150, 150, 'keo_bong', 6, '🍭 Kẹo bông'), say(220, 132, '👴 Ông Cầu Vồng', 'Ông Hoàng vẽ từ năm 86 tuổi đó, nhờ vậy cả làng được giữ lại 🌈', 'watch'), { ...say(30, 170, '🖌️ Vẽ thêm một bông hoa', 'Hai bạn vẽ chung một bông hoa nhỏ lên tường — dễ thương ghê 🌸', 'wall') }],
    lines: ['Bức tường này đẹp quá!', '📸 Đứng đây chụp nè', 'Màu sắc rực rỡ ghê', 'Ông vẽ hết cả làng đó', 'Wow 🌈'],
  },
  trip_taichung_fengjia: {
    trip: 'taichung', id: 'fengjia', name: 'Chợ đêm Phùng Giáp', icon: '🏮', at: 120, walk: W(128), day: ['#7ab8e8', '#e0f0ff'],
    draw: (p, L) => {
      sky(p, L, ['#7ab8e8', '#e0f0ff'], 60, 40);
      for (let i = 0; i < 11; i++) bldg(p, L, i * 24, 76, 23, 24 + (i * 37) % 22, ['#c8b8a8', '#a8a0b0', '#d8c0a0', '#b8b0a8'][i % 4]);
      // biển hiệu chữ dọc
      for (let i = 0; i < 9; i++) L.neon.push({ x: 8 + i * 28, y: 40 + (i % 3) * 6, w: 5, h: 22, c: ['#ff4a6a', '#4af0ff', '#ffe04a', '#8aff6a'][i % 4] });
      // dãy sạp hàng có mái bạt
      band(p, 76, 128, '#5a4a48', '#4a3a38');
      for (let i = 0; i < 8; i++) {
        const x = 2 + i * 32, c = ['#e8443a', '#f6a83a', '#3a8ad0', '#e8443a', '#3aa86a', '#f6a83a', '#9a6ae0', '#e8443a'][i];
        p.rect(x, 96, 30, 26, '#8a6a4a'); p.rect(x + 2, 104, 26, 10, '#3a2a2a');
        for (let k = 0; k < 5; k++) p.rect(x + 3 + k * 5, 106, 4, 3, ['#f6c445', '#d86a3a', '#ffffff', '#c84a2a', '#8bc87a'][(k + i) % 5]);
        for (let k = 0; k < 6; k++) p.rect(x + k * 5, 86, 5, 10, k % 2 ? c : '#ffffff');
        for (let k = 0; k < 6; k++) p.rect(x + k * 5 + 1, 96, 3, 1, k % 2 ? c : '#f0f0f0');
        p.rect(x + 6, 116, 18, 6, '#c8c0b0');
        L.neon.push({ x: x + 5, y: 80, w: 20, h: 5, c: ['#ffe04a', '#ff6a8a', '#6af0ff'][i % 3] });
      }
      string(p, L, 0, 256, 72, 6, ['#e8443a', '#ffb040'], 10);
      tiles(p, 128, 192, '#6a6068', '#585058', 10);
      for (let i = 0; i < 40; i++) p.rect(Math.floor(L.r() * 256), 130 + Math.floor(L.r() * 60), 2, 1, '#ffd88a30');
    },
    fx: [{ k: 'steam', x: 40, y: 100, n: 3 }, { k: 'steam', x: 136, y: 100, n: 3 }, { k: 'steam', x: 200, y: 100, n: 2 }, { k: 'glow', x: 128, y: 110, r: 120, c: '#ffb04a', night: true }],
    acts: [buy(30, 136, 'tra_sua', 7, '🧋 Trà sữa trân châu'), buy(110, 136, 'squid_bbq', 11, '🦑 Mực nướng'), buy(190, 136, 'keo_deo', 5, '🍬 Kẹo dẻo'), ph(128, 172), buy(220, 170, 'fried_shrimp', 10, '🍗 Gà rán khổng lồ')],
    lines: ['Thơm quá trời!', 'Thử đậu hũ thối không?', 'Đông vui ghê', 'Trà sữa ở đây ngon nhất', 'Mua thêm xiên nữa đi'],
  },
  trip_taichung_sunmoon: {
    trip: 'taichung', id: 'sunmoon', name: 'Hồ Nhật Nguyệt', icon: '🚡', at: 210, walk: W(150), day: ['#78c0e8', '#e0f4ff'],
    draw: (p, L) => {
      sky(p, L, ['#78c0e8', '#e0f4ff'], 80, 60);
      ridge(p, 80, 34, 30, '#5a8a9a', 0.5); ridge(p, 86, 24, 18, '#3a7a5a', 2);
      // tháp Từ Ân trên đỉnh
      for (let k = 0; k < 6; k++) { const w = 12 - k * 1.5; p.rect(200 - w / 2, 54 - k * 6, w, 5, '#e8e0d0'); p.rect(200 - w / 2 - 2, 53 - k * 6, w + 4, 1, '#a84a3a'); }
      p.rect(199, 14, 2, 6, '#a84a3a');
      water(p, L, 86, 146, '#3aa0b8', '#2a7898');
      // hòn đảo Lalu giữa hồ
      circle(p, 120, 100, 6, '#3a7a4a'); p.rect(110, 100, 20, 3, '#2a5a3a');
      // cột cáp treo
      for (let x = 20; x < 256; x += 80) { p.rect(x, 30, 2, 56, '#6a6a7a'); p.rect(x - 3, 30, 8, 2, '#6a6a7a'); }
      for (let x = 0; x < 256; x++) p.px(x, 31 + Math.round(Math.sin(((x - 20) % 80) / 80 * Math.PI) * 6), '#3a3a4a');
      // bờ hồ, lan can, bến thuyền
      band(p, 146, 192, '#c8b898', '#b8a888');
      rail(p, 144, '#7a5a3a');
      p.rect(60, 136, 40, 8, '#8a6a4a'); for (let x = 62; x < 100; x += 6) p.rect(x, 136, 1, 10, '#5a3a2a');
      tree(p, 230, 170, 9, '#3a8a4a'); tree(p, 14, 176, 8, '#4a9a4a');
      L.lamps.push({ x: 150, y: 150, c: '#ffd88a' }, { x: 210, y: 150, c: '#ffd88a' });
    },
    fx: [{ k: 'shim', x: 0, y: 88, w: 256, h: 56, n: 22 }, { k: 'move', spr: 'cable', x: 0, y: 46, dx: 256, dur: 30, loop: true }, { k: 'move', spr: 'boat', x: 140, y: 120, dx: -90, dur: 14 }, { k: 'bird', x: 60, y: 30, icon: '🕊️', n: 2 }],
    acts: [{ k: 'ride', x: 80, y: 130, label: '⛵ Đi thuyền quanh hồ', spr: 'boat', ry: 116, say: 'Thuyền lướt qua đảo Lalu, gió hồ mát rượi 💙' }, { k: 'ride', x: 30, y: 60, label: '🚡 Đi cáp treo', spr: 'cable', ry: 50, say: 'Cáp treo bay qua rừng, nhìn xuống cả mặt hồ xanh biếc 🚡' }, buy(170, 166, 'honey_tea', 7, '🍵 Hồng trà Nhật Nguyệt'), ph(128, 176)],
    lines: ['Hồ trong xanh ghê', 'Đạp xe quanh hồ không?', 'Gió mát quá', 'Nhìn tháp kìa!', '🚡 Đi cáp treo đi'],
  },

  // ═════════ GWANGJU ═════════
  trip_gwangju_mudeung: {
    trip: 'gwangju', id: 'mudeung', name: 'Núi Mudeung', icon: '⛰️', at: 40, walk: W(132), day: ['#80b8e8', '#f0e8d8'],
    draw: (p, L) => {
      sky(p, L, ['#80b8e8', '#f0e8d8'], 90, 60);
      ridge(p, 70, 40, 34, '#9a6a6a', 0.3); ridge(p, 96, 40, 24, '#b8503a', 1.7);
      speckle(p, L, 0, 60, 256, 40, 260, ['#e8743a', '#f6a83a', '#d8402a', '#ffd06a']);
      // cột đá Seoseokdae
      for (let k = 0; k < 9; k++) { const x = 170 + k * 6, h = 30 + (k % 3) * 8 - Math.abs(k - 4) * 2; p.rect(x, 96 - h, 5, h, k % 2 ? '#8a8a90' : '#a0a0a8'); p.rect(x, 96 - h, 5, 1, '#c8c8d0'); }
      band(p, 96, 192, '#a8784a', '#8a5a3a');
      // đường mòn bậc đá uốn lượn
      for (let y = 100; y < 192; y += 6) { const cx = 128 + Math.sin(y / 18) * 40, w = 20 + (y - 100) * 0.5; p.rect(cx - w / 2, y, w, 5, '#c8b8a0'); p.rect(cx - w / 2, y + 5, w, 1, '#8a7a68'); }
      for (let i = 0; i < 9; i++) { const x = i < 5 ? 6 + i * 18 : 180 + (i - 5) * 20, y = 120 + (i % 3) * 22; tree(p, x, y, 8 + (i % 2) * 2, ['#e8443a', '#f6a83a', '#d8502a', '#ffb84a'][i % 4], '#5a3a2a'); }
      speckle(p, L, 0, 110, 256, 80, 200, ['#e8743a', '#f0c050', '#c83a2a']);
      // biển chỉ đường
      p.rect(220, 160, 2, 16, '#6a4a2a'); p.rect(210, 158, 22, 7, '#e8d8b0'); p.rect(212, 161, 18, 1, '#6a4a2a');
      p.rect(20, 172, 14, 4, '#7a5a3a'); p.rect(21, 176, 2, 4, '#5a3a2a'); p.rect(31, 176, 2, 4, '#5a3a2a');
    },
    fx: [{ k: 'fall', n: 22, c: ['#e8443a', '#f6a83a', '#d8502a', '#ffc04a'], size: 2 }, { k: 'bird', x: 100, y: 30, icon: '🐦', n: 2 }],
    acts: [ph(128, 120), { ...say(200, 110, '🪨 Đá Seoseokdae', 'Cột đá núi lửa xếp như phím đàn — gọi là "bức bình phong của trời" đó', 'sit'), at: { x: 196, y: 136 } }, buy(40, 160, 'honey_tea', 6, '🫚 Trà gừng mật ong'), say(220, 180, '🍁 Nhặt lá phong', 'Ép lá phong đỏ này vào sổ làm kỷ niệm nha 🍁', 'pick')],
    lines: ['Leo mệt mà đẹp quá', 'Lá đỏ hết rồi!', 'Còn bao xa tới đỉnh?', 'Nghỉ chút đi', 'Annyeong! 👋'],
  },
  trip_gwangju_penguin: {
    trip: 'gwangju', id: 'penguin', name: 'Làng Penguin', icon: '🏯', at: 128, walk: W(124), day: ['#88c0e8', '#f0e8d0'],
    draw: (p, L) => {
      sky(p, L, ['#88c0e8', '#f0e8d0'], 70, 220);
      ridge(p, 70, 14, 20, '#a87a5a', 3);
      for (let i = 0; i < 4; i++) {
        const x = 4 + i * 64;
        p.rect(x, 70, 58, 50, '#e8dcc0'); for (let k = 0; k < 4; k++) p.rect(x + 2 + k * 14, 70, 2, 50, '#7a4a2a');
        for (let k = 0; k < 3; k++) { p.rect(x + 6 + k * 14, 80, 8, 14, '#f8f0d8'); for (let g = 0; g < 3; g++) p.rect(x + 6 + k * 14, 82 + g * 4, 8, 1, '#8a5a3a'); L.wins.push([x + 7 + k * 14, 83, 6, 10]); }
        // mái ngói cong hanok
        for (let k = 0; k < 10; k++) { const lift = Math.round(Math.pow(Math.abs(k - 4.5) / 4.5, 3) * 6); p.rect(x - 6 + k * 7, 60 - lift, 7, 10, '#3a3a48'); p.rect(x - 6 + k * 7, 60 - lift, 7, 1, '#5a5a6a'); }
        for (let k = 0; k < 70; k += 3) p.rect(x - 6 + k, 69, 2, 2, '#2a2a38');
        // đồ cổ treo tường: đồng hồ, tivi, biển cũ
        circle(p, x + 50, 100, 3, '#d8c890'); p.px(x + 50, 99, '#3a2a2a'); p.px(x + 51, 100, '#3a2a2a');
        p.rect(x + 4, 100, 10, 8, '#6a6a6a'); p.rect(x + 5, 101, 8, 5, ['#8ac0a0', '#a0a8c0', '#c8a080', '#9ac8c8'][i]);
        p.rect(x + 20, 106, 14, 5, ['#d8302a', '#3a6ad0', '#f6c445', '#3a9a5a'][i]); p.rect(x + 22, 108, 10, 1, '#ffffff');
        L.lamps.push({ x: x + 40, y: 74, c: i % 2 ? '#3a6ad0' : '#e8443a' });
      }
      band(p, 120, 192, '#c8b090', '#b09878');
      for (let i = 0; i < 70; i++) { const x = Math.floor(L.r() * 252), y = 126 + Math.floor(L.r() * 62); p.rect(x, y, 4, 2, mix('#b09878', '#8a7058', L.r())); }
      // tường gạch thấp, chum tương
      for (let x = 0; x < 256; x += 8) p.rect(x, 120, 7, 4, '#8a7a6a');
      for (let i = 0; i < 4; i++) { circle(p, 200 + i * 12, 176, 5, '#6a3a22'); p.rect(196 + i * 12, 170, 9, 2, '#4a2a18'); p.px(199 + i * 12, 173, '#9a6a4a'); }
      // chim cánh cụt gỗ (biểu tượng làng)
      p.rect(30, 160, 8, 12, '#2a2a3a'); p.rect(32, 163, 4, 8, '#ffffff'); p.rect(33, 160, 2, 1, '#f6a83a'); p.px(32, 161, '#ffffff'); p.px(35, 161, '#ffffff');
    },
    fx: [{ k: 'sway', x: 150, y: 74, c: '#e8443a' }, { k: 'sway', x: 86, y: 74, c: '#3a6ad0' }, { k: 'fall', n: 8, c: ['#e8743a', '#f6c445'], size: 2, slow: true }],
    acts: [buy(70, 140, 'clock', 15, '🕰️ Đồng hồ cổ'), { ...say(110, 128, '👘 Thuê hanbok', 'Mặc hanbok dạo phố cổ, như phim cổ trang luôn 👘', 'dress'), outfit: 13 }, buy(150, 150, 'tteokbokki', 8, '🌶️ Tteokbokki'), ph(34, 150), { ...say(210, 160, '🏺 Chum tương', 'Mở nắp chum ra… mùi tương đậu thơm lừng!', 'jar') }],
    lines: ['Đồ cổ dễ thương quá', 'Nhà hanok mát ghê', 'Chụp với chú cánh cụt nè 🐧', 'Hồi xưa ông bà dùng cái này', 'Cổ kính ghê'],
  },
  trip_gwangju_chungjang: {
    trip: 'gwangju', id: 'chungjang', name: 'Phố Chungjang', icon: '🍗', at: 216, walk: W(132), day: ['#80b8f0', '#e8f0ff'],
    draw: (p, L) => {
      sky(p, L, ['#80b8f0', '#e8f0ff'], 60, 50);
      const cs = ['#e8d8d0', '#c8d0e0', '#f0e0c0', '#d0e0d0', '#e0c8d8', '#c8c8c8'];
      for (let i = 0; i < 8; i++) bldg(p, L, i * 32, 120, 31, 56 + (i * 23) % 40, cs[i % 6], undefined, '#90b8d8', 6);
      for (let i = 0; i < 8; i++) {
        const x = i * 32 + 2, c = ['#ff4a8a', '#4ae0ff', '#ffe04a', '#8a6aff', '#ff8a3a', '#4aff9a', '#ff4a4a', '#4ab0ff'][i];
        L.neon.push({ x: x + 22, y: 50 + (i % 3) * 8, w: 5, h: 24, c }, { x, y: 100, w: 27, h: 5, c: ['#ff6a4a', '#ffe04a', '#4ae0ff'][i % 3] });
        p.rect(x, 106, 27, 14, '#c8e0f0'); p.rect(x + 2, 108, 23, 10, '#4a5a6a'); L.wins.push([x + 2, 108, 23, 10]);
      }
      // quán gà nướng có ô dù và bàn nhựa
      band(p, 120, 132, '#a0a0a8', '#909098');
      tiles(p, 132, 192, '#7a7480', '#6a6470', 12);
      for (let i = 0; i < 3; i++) { const x = 40 + i * 80; p.rect(x - 10, 150, 20, 2, '#d8302a'); p.rect(x - 1, 152, 2, 10, '#c8c8c8'); p.rect(x - 8, 162, 16, 3, '#3a7ad0'); p.rect(x - 7, 165, 2, 6, '#3a7ad0'); p.rect(x + 5, 165, 2, 6, '#3a7ad0'); }
      for (let x = 0; x < 256; x += 40) { p.rect(x + 18, 112, 2, 20, '#4a4a5a'); L.lamps.push({ x: x + 17, y: 108, c: '#fff0b0' }); }
      p.rect(60, 128, 136, 1, '#ffffff'); for (let x = 70; x < 190; x += 14) p.rect(x, 136, 8, 2, '#f0f0f0');
    },
    fx: [{ k: 'steam', x: 40, y: 150, n: 2 }, { k: 'steam', x: 200, y: 150, n: 2 }, { k: 'glow', x: 128, y: 80, r: 110, c: '#ff4a8a', night: true }, { k: 'sparkle', x: 0, y: 40, w: 256, h: 70, n: 10, night: true }],
    acts: [buy(40, 140, 'tteokbokki', 8, '🌶️ Tteokbokki'), buy(120, 140, 'fried_shrimp', 10, '🍗 Gà/tôm chiên giòn'), buy(200, 140, 'kem_que', 5, '🍦 Kem que'), ph(128, 176), say(220, 178, '🎤 Hát busking', 'Hai bạn song ca một bài K-pop, mọi người vỗ tay rần rần 🎶', 'sing')],
    lines: ['Chimaek đi!', 'Quán này đông ghê', 'Hát hay quá 🎤', 'Đi karaoke không?', 'Đèn đẹp ghê'],
  },

  // ═════════ HỘI AN ═════════
  trip_hoian_lantern: {
    trip: 'hoian', id: 'lantern', name: 'Phố đèn lồng & Chùa Cầu', icon: '🌉', at: 80, walk: W(130), day: ['#f6b878', '#ffe8b8'],
    draw: (p, L) => {
      sky(p, L, ['#f6b878', '#ffe8b8'], 60, 40);
      for (let i = 0; i < 3; i++) { const x = i * 40; bldg(p, L, x, 112, 38, 46, '#f0c84a', '#a84a2a', '#5a3a2a'); p.rect(x - 2, 82, 42, 3, '#a84a2a'); }
      for (let i = 0; i < 3; i++) { const x = 176 + i * 28; bldg(p, L, x, 112, 26, 46, '#f0c84a', '#a84a2a', '#5a3a2a'); }
      // Chùa Cầu mái ngói đỏ, cầu cong
      water(p, L, 104, 116, '#4a8a7a', '#3a7a6a');
      for (let x = 120; x < 176; x++) { const lift = Math.round(Math.sin((x - 120) / 56 * Math.PI) * 6); p.rect(x, 96 - lift, 1, 6, '#c8783a'); }
      p.rect(124, 74, 48, 18, '#a84a2a'); p.rect(126, 78, 44, 12, '#d8b070');
      for (let k = 0; k < 5; k++) p.rect(128 + k * 9, 80, 5, 8, '#5a2a1a');
      for (let k = 0; k < 8; k++) { const lift = Math.round(Math.pow(Math.abs(k - 3.5) / 3.5, 2) * 4); p.rect(118 + k * 8, 66 - lift, 8, 8, '#8a3a22'); p.rect(118 + k * 8, 66 - lift, 8, 1, '#c85a3a'); }
      p.rect(146, 60, 4, 4, '#f6c445');
      tiles(p, 116, 192, '#c8a878', '#b89060', 10);
      for (let x = 0; x < 256; x += 10) p.rect(x, 116, 8, 2, '#8a6a4a');
      // sạp đèn lồng
      for (let k = 0; k < 6; k++) for (let j = 0; j < 3; j++) L.lamps.push({ x: 196 + k * 9, y: 120 + j * 9, c: ['#e8443a', '#f6c445', '#3aa86a', '#9a6ae0', '#f59ab3', '#3a8ad0'][(k + j) % 6] });
      p.rect(194, 148, 56, 4, '#6a3a22');
    },
    fx: [{ k: 'sway', x: 20, y: 86, c: '#e8443a', big: true }, { k: 'sway', x: 60, y: 86, c: '#f6c445', big: true }, { k: 'sway', x: 100, y: 86, c: '#e8443a', big: true }, { k: 'sway', x: 186, y: 86, c: '#f59ab3', big: true }, { k: 'sway', x: 226, y: 86, c: '#e8443a', big: true }, { k: 'shim', x: 0, y: 104, w: 256, h: 10, n: 8 }],
    acts: [buy(220, 160, 'lantern', 10, '🏮 Mua đèn lồng'), buy(60, 150, 'banh_mi', 5, '🥖 Bánh mì'), ph(148, 124), { ...say(130, 170, '👗 May áo dài', 'Áo dài may xong rồi, mặc vào xinh quá trời 👗', 'dress'), outfit: 12 }],
    lines: ['Đèn lồng đẹp quá', 'Phố cổ yên bình ghê', 'Cầu này trên tờ 20 nghìn đó', 'Ăn cao lầu chưa?', 'Chụp áo dài đi'],
  },
  trip_hoian_river: {
    trip: 'hoian', id: 'river', name: 'Sông Hoài', icon: '🪷', at: 190, walk: W(154), day: ['#f0a870', '#ffe0b0'],
    draw: (p, L) => {
      sky(p, L, ['#f0a870', '#ffe0b0'], 56, 200);
      for (let i = 0; i < 9; i++) bldg(p, L, i * 29, 74, 27, 24 + (i % 3) * 6, '#e8c050', '#a84a2a', '#5a3a2a');
      string(p, L, 0, 256, 34, 8, ['#e8443a', '#f6c445', '#f59ab3', '#3aa86a'], 8);
      water(p, L, 74, 150, '#2a6a7a', '#1a4a5a');
      // bóng đèn dưới nước
      for (let x = 6; x < 256; x += 13) for (let y = 80; y < 112; y += 3) if (L.r() < 0.6) p.rect(x + Math.round(Math.sin(y) * 2), y, 2, 1, ['#e8443a', '#f6c445', '#f59ab3'][x % 3] + '80');
      band(p, 150, 192, '#a88a68', '#987a58'); p.rect(0, 150, 256, 3, '#7a5a3a');
      for (let x = 10; x < 256; x += 30) { p.rect(x, 146, 3, 8, '#5a3a2a'); }
      // gánh hàng hoa đăng
      for (let k = 0; k < 6; k++) { p.rect(30 + k * 6, 164, 5, 3, '#f59ab3'); p.px(32 + k * 6, 163, '#ffe060'); }
      p.rect(28, 167, 38, 2, '#6a3a22');
    },
    fx: [{ k: 'shim', x: 0, y: 76, w: 256, h: 72, n: 30, c: '#ffe0a0' }, { k: 'move', spr: 'sampan', x: 30, y: 124, dx: 180, dur: 22 }, { k: 'move', spr: 'sampan', x: 220, y: 100, dx: -160, dur: 26 }, { k: 'glow', x: 128, y: 40, r: 90, c: '#ffa040', night: true }],
    acts: [{ k: 'float', x: 120, y: 160, label: '🪷 Thả hoa đăng', ry: 146 }, { k: 'ride', x: 200, y: 160, label: '🛶 Đi thuyền sông Hoài', spr: 'sampan', ry: 130, say: 'Chú lái thuyền chèo chậm rãi, đèn lồng soi bóng lung linh 🏮' }, buy(46, 176, 'banh_trang', 5, '🫓 Bánh tráng nướng'), ph(140, 182)],
    lines: ['Thả đèn ước đi', 'Đi thuyền không em?', 'Lung linh quá', 'Ước gì cũng thành 🪷', 'Mua hoa đăng đi'],
  },

  // ═════════ TOKYO ═════════
  trip_tokyo_asakusa: {
    trip: 'tokyo', id: 'asakusa', name: 'Đền Asakusa', icon: '⛩️', at: 40, walk: W(128), day: ['#90c8f8', '#fff0f4'],
    draw: (p, L) => {
      sky(p, L, ['#90c8f8', '#fff0f4'], 80, 40);
      // tháp 5 tầng + chính điện
      for (let k = 0; k < 5; k++) { const w = 22 - k * 3; p.rect(214 - w / 2, 84 - k * 11, w, 7, '#c83a2a'); p.rect(214 - w / 2 - 4, 82 - k * 11, w + 8, 2, '#2a2a3a'); }
      p.rect(213, 18, 2, 12, '#d8a83a');
      p.rect(10, 70, 60, 30, '#c83a2a'); for (let k = 0; k < 8; k++) p.rect(10 + k * 8, 72, 2, 28, '#8a1a1a');
      for (let k = 0; k < 10; k++) { const lift = Math.round(Math.pow(Math.abs(k - 4.5) / 4.5, 2) * 6); p.rect(2 + k * 8, 60 - lift, 8, 10, '#3a3a48'); }
      // dãy sạp Nakamise
      for (let i = 0; i < 9; i++) { const x = i * 29; p.rect(x, 100, 27, 22, '#e8dcc8'); p.rect(x, 96, 27, 4, '#c83a2a'); p.rect(x + 3, 104, 21, 9, '#5a3a2a'); for (let k = 0; k < 4; k++) p.rect(x + 4 + k * 5, 106, 4, 3, ['#f8b8cc', '#f6c445', '#8bc87a', '#ffffff'][(i + k) % 4]); L.lamps.push({ x: x + 12, y: 92, c: '#ffd88a' }); }
      // cổng Kaminarimon
      p.rect(96, 52, 8, 70, '#d8302a'); p.rect(152, 52, 8, 70, '#d8302a');
      for (let k = 0; k < 9; k++) { const lift = Math.round(Math.pow(Math.abs(k - 4) / 4, 2) * 6); p.rect(86 + k * 10, 38 - lift, 10, 12, '#3a3a48'); }
      p.rect(92, 50, 72, 4, '#8a1a1a');
      tiles(p, 122, 192, '#c8c0b0', '#b8b0a0', 12);
      // lư hương
      p.rect(118, 150, 20, 10, '#5a5a5a'); p.rect(114, 148, 28, 3, '#3a3a3a'); p.rect(122, 160, 3, 4, '#3a3a3a'); p.rect(131, 160, 3, 4, '#3a3a3a');
      // quầy xăm omikuji
      p.rect(200, 150, 30, 18, '#8a5a3a'); p.rect(198, 146, 34, 4, '#c83a2a'); for (let k = 0; k < 5; k++) p.rect(203 + k * 5, 154, 3, 8, '#f0e8d0');
      p.rect(236, 140, 2, 30, '#5a3a2a'); p.rect(252, 140, 2, 30, '#5a3a2a'); for (let k = 0; k < 3; k++) p.rect(236, 144 + k * 7, 18, 1, '#8a6a4a');
      for (let k = 0; k < 9; k++) p.rect(238 + (k * 5) % 14, 145 + (k % 3) * 7, 2, 3, '#fffaf0');
    },
    fx: [{ k: 'sway', x: 124, y: 62, c: '#e8302a', big: true }, { k: 'steam', x: 128, y: 146, n: 4 }, { k: 'fall', n: 10, c: ['#f8b8cc', '#ffd8e4'], size: 2, slow: true }],
    acts: [{ k: 'fortune', x: 214, y: 140, label: '🎋 Rút quẻ omikuji' }, { ...say(128, 140, '🪔 Xông khói nhang', 'Vẫy khói nhang lên người cho khoẻ mạnh nè', 'pray'), at: { x: 128, y: 166 } }, buy(40, 140, 'onigiri', 6, '🍙 Onigiri'), ph(128, 176)],
    lines: ['Cổng đỏ to quá', 'Rút quẻ chưa?', 'Mua bánh ningyo-yaki đi', 'Konnichiwa!', 'Đèn lồng khổng lồ kìa'],
  },
  trip_tokyo_ueno: {
    trip: 'tokyo', id: 'ueno', name: 'Công viên Ueno', icon: '🌸', at: 128, walk: W(140), day: ['#a0d0f8', '#fff0f6'],
    draw: (p, L) => {
      sky(p, L, ['#a0d0f8', '#fff0f6'], 70, 60);
      for (let i = 0; i < 12; i++) bldg(p, L, i * 22, 70, 20, 14 + (i * 7) % 16, '#b8c0d0');
      // hồ Shinobazu
      water(p, L, 70, 110, '#5aa0c8', '#4a88b0');
      for (let i = 0; i < 18; i++) { const x = Math.floor(L.r() * 256), y = 98 + Math.floor(L.r() * 10); circle(p, x, y, 2, '#4a8a4a'); }
      band(p, 110, 192, '#9ac87a', '#7ab060');
      // lối đi giữa
      for (let y = 140; y < 192; y++) p.rect(0, y, 256, 1, y < 146 ? '#d8c8a8' : mix('#9ac87a', '#7ab060', (y - 140) / 52));
      tiles(p, 140, 160, '#e0d0b0', '#d0c0a0', 10);
      // hàng anh đào
      for (let i = 0; i < 7; i++) {
        const x = 18 + i * 38, y = 136;
        p.rect(x - 1, y - 18, 3, 18, '#5a3a2a'); p.rect(x - 6, y - 16, 6, 1, '#5a3a2a'); p.rect(x + 2, y - 14, 6, 1, '#5a3a2a');
        for (let k = 0; k < 4; k++) circle(p, x - 9 + k * 6, y - 22 - (k % 2) * 4, 7, ['#f8b8cc', '#ffd0dc', '#f6a8c0', '#ffe0e8'][k]);
        speckle(p, L, x - 14, y - 32, 28, 18, 14, ['#ffffff', '#f088a8']);
      }
      speckle(p, L, 0, 160, 256, 30, 90, ['#f8b8cc', '#ffd8e4']);
      // thảm picnic xanh
      p.rect(170, 168, 34, 14, '#3a8ad0'); for (let k = 0; k < 34; k += 6) p.rect(170 + k, 168, 3, 14, '#5aa8e8');
      p.rect(180, 172, 6, 4, '#f6c445'); p.rect(190, 173, 5, 3, '#ffffff');
      for (let x = 30; x < 256; x += 60) L.lamps.push({ x, y: 112, c: '#ffd8e4' });
    },
    fx: [{ k: 'fall', n: 28, c: ['#f8b8cc', '#ffd8e4', '#ffffff'], size: 2, slow: true }, { k: 'shim', x: 0, y: 72, w: 256, h: 24, n: 12 }, { k: 'move', spr: 'swan', x: 40, y: 92, dx: 120, dur: 20 }],
    acts: [{ k: 'ride', x: 70, y: 120, label: '🦢 Đạp vịt thiên nga', spr: 'swan', ry: 96, say: 'Hai đứa đạp vịt thiên nga giữa hồ sen, cười muốn xỉu 🦢' }, buy(186, 160, 'sushi', 12, '🍣 Hộp sushi picnic'), { ...say(120, 176, '🌸 Hanami', 'Nằm dưới gốc anh đào, cánh hoa rơi lên tóc em 🌸', 'sit'), at: { x: 184, y: 178 } }, ph(30, 176)],
    lines: ['Hoa nở rộ rồi!', 'Picnic ở đây đi', 'Cánh hoa rơi kìa 🌸', 'Kirei~', 'Đạp vịt không?'],
  },
  trip_tokyo_shibuya: {
    trip: 'tokyo', id: 'shibuya', name: 'Ngã tư Shibuya', icon: '🚦', at: 216, walk: W(124), day: ['#88b8e8', '#e0ecff'],
    draw: (p, L) => {
      sky(p, L, ['#88b8e8', '#e0ecff'], 50, 230);
      const cs = ['#a8b0c0', '#c8c0b8', '#9098a8', '#b8b8c8', '#d0c8c0'];
      for (let i = 0; i < 7; i++) bldg(p, L, i * 37, 120, 36, 70 + (i * 29) % 46, cs[i % 5], undefined, '#a0c0e0', 5);
      L.neon.push({ x: 8, y: 62, w: 24, h: 4, c: '#ff4a8a' }, { x: 120, y: 54, w: 5, h: 30, c: '#4af0ff' }, { x: 160, y: 70, w: 26, h: 4, c: '#ffe04a' }, { x: 230, y: 60, w: 5, h: 26, c: '#8aff6a' }, { x: 44, y: 106, w: 60, h: 4, c: '#ff6a3a' });
      // màn hình lớn
      p.rect(74, 40, 44, 28, '#2a2a3a'); p.rect(150, 80, 36, 22, '#2a2a3a');
      band(p, 120, 192, '#4a4a54', '#3a3a44');
      // vạch qua đường kẻ chéo
      for (let k = 0; k < 9; k++) p.rect(30 + k * 22, 130, 12, 8, '#e8e8e8');
      for (let k = 0; k < 9; k++) p.rect(30 + k * 22, 176, 12, 8, '#e8e8e8');
      for (let k = 0; k < 4; k++) { p.rect(10, 140 + k * 9, 14, 5, '#e8e8e8'); p.rect(232, 140 + k * 9, 14, 5, '#e8e8e8'); }
      for (let k = 0; k < 14; k++) p.rect(60 + k * 10, 140 + k * 2.6, 7, 3, '#d8d8d8');
      // đèn tín hiệu + tượng Hachiko
      p.rect(28, 108, 2, 22, '#3a3a3a'); p.rect(25, 104, 8, 5, '#2a2a2a'); L.neon.push({ x: 26, y: 105, w: 3, h: 3, c: '#4aff6a' });
      p.rect(210, 156, 22, 6, '#8a8a8a'); p.rect(214, 146, 12, 10, '#7a6a4a'); p.rect(222, 140, 6, 8, '#7a6a4a'); p.rect(226, 142, 3, 2, '#5a4a3a'); p.px(223, 141, '#3a2a1a');
    },
    fx: [{ k: 'screen', x: 76, y: 42, w: 40, h: 24 }, { k: 'screen', x: 152, y: 82, w: 32, h: 18 }, { k: 'sparkle', x: 0, y: 30, w: 256, h: 90, n: 12, night: true }, { k: 'glow', x: 128, y: 70, r: 120, c: '#6a8aff', night: true }],
    acts: [ph(220, 172), say(128, 150, '🚦 Băng qua ngã tư', 'Đèn xanh! Hàng nghìn người cùng băng qua một lúc — nắm tay chặt nha 🤝', 'cross'), buy(60, 170, 'mi_ly', 5, '🍜 Mì ly konbini'), buy(180, 140, 'sandwich', 6, '🥪 Sandwich')],
    lines: ['Đông quá trời!', 'Chụp với Hachiko', 'Màn hình to ghê', 'Đi Shibuya Sky không?', 'Sumimasen~'],
  },

  // ═════════ PARIS ═════════
  trip_paris_eiffel: {
    trip: 'paris', id: 'eiffel', name: 'Tháp Eiffel', icon: '🗼', at: 128, walk: W(140), day: ['#90b8f0', '#f4e4ec'],
    draw: (p, L) => {
      sky(p, L, ['#90b8f0', '#f4e4ec'], 110, 50);
      for (let i = 0; i < 12; i++) bldg(p, L, i * 22, 110, 21, 16 + (i * 11) % 10, '#e0d4c0', '#5a6a80', '#8aa0b8', 6);
      const c = L.night ? '#d8a040' : '#7a6248';
      for (let y = 4; y < 128; y++) {
        const w = y < 40 ? 1.5 + (y - 4) / 14 : y < 76 ? 4 + (y - 40) / 3.5 : 14 + Math.pow((y - 76) / 52, 1.6) * 34;
        p.rect(128 - w, y, 3, 1, c); p.rect(126 + w, y, 3, 1, c);
        if (y % 6 === 0) { p.rect(128 - w, y, 2 * w + 2, 1, c + '80'); }
        if (y > 100) { const arch = Math.sqrt(Math.max(0, 1 - Math.pow((y - 128) / 26, 2))) * (w - 6); if (arch > 0) p.rect(128 - arch, y, 2 * arch + 1, 1, '#00000000'); }
      }
      p.rect(118, 40, 20, 3, c); p.rect(108, 76, 40, 4, c); p.rect(126, 0, 4, 6, c);
      if (L.night) L.lamps.push({ x: 126, y: 0, c: '#fff6c0' });
      band(p, 128, 192, '#8ac868', '#6aa850');
      for (let y = 136; y < 192; y += 10) for (let x = 0; x < 256; x += 32) p.rect(x + (y / 10 % 2) * 16, y, 14, 1, '#7ab858');
      // lối sỏi
      for (let y = 128; y < 192; y++) { const w = 10 + (y - 128) * 0.5; p.rect(128 - w, y, 2 * w, 1, '#e0d0b0'); }
      for (let i = 0; i < 5; i++) { tree(p, 10 + i * 12, 140 + (i % 2) * 4, 7, '#4a8a4a'); tree(p, 200 + i * 12, 140 + (i % 2) * 4, 7, '#4a8a4a'); }
      // thảm picnic đỏ caro
      for (let k = 0; k < 6; k++) for (let j = 0; j < 3; j++) p.rect(40 + k * 5, 168 + j * 4, 5, 4, (k + j) % 2 ? '#e8443a' : '#ffffff');
      p.rect(48, 166, 6, 3, '#d8a050'); p.rect(58, 165, 2, 5, '#7a1a3a');
      for (let x = 20; x < 256; x += 54) L.lamps.push({ x, y: 128, c: '#ffe8a0' });
    },
    fx: [{ k: 'sparkle', x: 90, y: 4, w: 76, h: 124, n: 26, night: true }, { k: 'bird', x: 40, y: 50, icon: '🕊️', n: 2 }, { k: 'glow', x: 128, y: 60, r: 70, c: '#ffd070', night: true }],
    acts: [buy(54, 160, 'croissant', 6, '🥐 Croissant picnic'), say(128, 150, '💋 Hôn dưới tháp', 'Đúng giờ tháp nhấp nháy… tụi mình hôn nhau ✨💋', 'love'), ph(200, 170), buy(220, 150, 'rose_bloom', 7, '🌹 Hoa hồng')],
    lines: ['Bonjour!', 'Tháp đẹp quá', 'Đợi tháp nhấp nháy nè ✨', 'Picnic thôi', 'Magnifique!'],
  },
  trip_paris_seine: {
    trip: 'paris', id: 'seine', name: 'Bờ sông Seine', icon: '🎨', at: 40, walk: W(148), day: ['#98c0f0', '#f6e8e0'],
    draw: (p, L) => {
      sky(p, L, ['#98c0f0', '#f6e8e0'], 72, 210);
      // Nhà thờ Đức Bà xa xa
      p.rect(40, 30, 14, 42, '#c8bca8'); p.rect(70, 30, 14, 42, '#c8bca8'); p.rect(54, 44, 16, 28, '#b8ac98'); circle(p, 62, 52, 4, '#8a7a9a'); p.rect(30, 50, 70, 22, '#c0b4a0');
      p.rect(120, 22, 3, 30, '#a89c88');
      for (let i = 0; i < 7; i++) bldg(p, L, 110 + i * 21, 72, 20, 20, '#e8dcc8', '#5a6a80', '#8aa0b8', 6);
      water(p, L, 72, 128, '#5a88a8', '#3a6a8a');
      // cầu đá vòm
      p.rect(0, 80, 256, 4, '#c8b898'); for (let k = 0; k < 5; k++) { const cx = 26 + k * 52; for (let dx = -18; dx <= 18; dx++) p.rect(cx + dx, 84, 1, Math.round(Math.sqrt(324 - dx * dx) * 0.55), '#c8b898'); }
      for (let x = 0; x < 256; x += 5) p.rect(x, 78, 2, 2, '#a89878');
      for (let x = 0; x < 256; x += 26) L.lamps.push({ x: x + 6, y: 72, c: '#ffe8a0' });
      // kè đá, sạp sách xanh
      band(p, 128, 148, '#c8b8a0', '#b8a890'); for (let x = 0; x < 256; x += 12) p.rect(x, 128, 11, 4, '#a89880');
      for (let i = 0; i < 4; i++) { const x = 8 + i * 40; p.rect(x, 134, 32, 12, '#2a5a3a'); p.rect(x - 1, 132, 34, 2, '#1a4a2a'); for (let k = 0; k < 8; k++) p.rect(x + 2 + k * 4, 136, 3, 6, ['#d8302a', '#f6c445', '#3a6ad0', '#ffffff', '#8a5a3a'][(k + i) % 5]); }
      tiles(p, 148, 192, '#d0c4b0', '#c0b4a0', 9);
      // giá vẽ của hoạ sĩ
      p.rect(200, 150, 2, 22, '#7a5a3a'); p.rect(212, 150, 2, 22, '#7a5a3a'); p.rect(198, 144, 18, 14, '#ffffff'); p.rect(200, 146, 14, 10, '#8ac0e8'); circle(p, 207, 151, 3, '#f8b8cc'); p.rect(200, 154, 14, 2, '#6aa850');
      for (let x = 0; x < 256; x += 40) tree(p, x + 180, 128, 6, '#5a9a4a');
    },
    fx: [{ k: 'shim', x: 0, y: 92, w: 256, h: 34, n: 20 }, { k: 'move', spr: 'bateau', x: 220, y: 116, dx: -200, dur: 28, loop: true }, { k: 'fall', n: 8, c: ['#e8b84a', '#d8903a'], size: 2, slow: true }],
    acts: [{ k: 'ride', x: 128, y: 120, label: '🛳️ Du thuyền Bateau', spr: 'bateau', ry: 118, say: 'Du thuyền lướt dưới những cây cầu cổ, Paris lên đèn rực rỡ 🌃' }, buy(60, 156, 'books', 11, '📚 Sách cũ'), { ...say(206, 176, '🎨 Vẽ chân dung', 'Hoạ sĩ vẽ hai bạn ngồi tựa vai nhau — tranh đẹp như mơ 🖼️', 'paint'), at: { x: 186, y: 172 } }, ph(140, 176)],
    lines: ['Sông Seine thơ mộng ghê', 'Mua sách không?', 'Tranh đẹp quá', 'Merci~', 'Đi thuyền tối nay nhé'],
  },
  trip_paris_cafe: {
    trip: 'paris', id: 'cafe', name: 'Cà phê vỉa hè', icon: '☕', at: 216, walk: W(140), day: ['#a0c4f0', '#f8ece4'],
    draw: (p, L) => {
      sky(p, L, ['#a0c4f0', '#f8ece4'], 40, 40);
      // nhà kiểu Haussmann ban công sắt
      for (let i = 0; i < 4; i++) {
        const x = i * 64; p.rect(x, 20, 63, 104, '#ece0c8'); p.rect(x, 14, 63, 6, '#5a6a80'); for (let k = 0; k < 4; k++) p.rect(x + 6 + k * 15, 8, 6, 6, '#5a6a80');
        for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) { const wx = x + 5 + k * 15, wy = 26 + r * 18; p.rect(wx, wy, 8, 12, '#7a9ab8'); L.wins.push([wx, wy, 8, 12]); p.rect(wx - 1, wy + 12, 10, 1, '#2a2a2a'); for (let b = 0; b < 10; b += 2) p.px(wx - 1 + b, wy + 11, '#2a2a2a'); }
        for (let k = 0; k < 4; k++) circle(p, x + 9 + k * 15, 37 + 2 * 18, 2, '#e8443a');
      }
      // mái hiên đỏ quán cà phê
      for (let k = 0; k < 20; k++) p.rect(20 + k * 8, 96, 8, 10, k % 2 ? '#c82a2a' : '#f0e0d0');
      for (let k = 0; k < 20; k++) p.rect(20 + k * 8 + 1, 106, 6, 2, k % 2 ? '#c82a2a' : '#f0e0d0');
      p.rect(20, 108, 160, 16, '#3a2a22'); p.rect(26, 110, 60, 12, '#c8a070'); L.wins.push([26, 110, 60, 12]); p.rect(110, 110, 60, 12, '#c8a070'); L.wins.push([110, 110, 60, 12]);
      L.neon.push({ x: 70, y: 90, w: 60, h: 4, c: '#ffd88a' });
      band(p, 124, 192, '#b8aca0', '#a89c90');
      for (let y = 128; y < 192; y += 6) for (let x = (y / 6 % 2) * 6; x < 256; x += 12) p.rect(x, y, 10, 5, mix('#b8aca0', '#8a8078', (x + y) % 3 / 6));
      // bàn ghế mây
      for (let i = 0; i < 4; i++) { const x = 34 + i * 46, y = 150; circle(p, x, y, 6, '#e8e8e8'); p.rect(x, y, 1, 10, '#3a3a3a'); p.rect(x - 12, y, 6, 10, '#c8a060'); p.rect(x + 7, y, 6, 10, '#c8a060'); p.rect(x - 2, y - 4, 3, 3, '#ffffff'); }
      for (let x = 200; x < 256; x += 22) { p.rect(x + 4, 120, 2, 30, '#2a2a2a'); L.lamps.push({ x: x + 3, y: 116, c: '#ffe8a0' }); }
      // hàng hoa
      for (let k = 0; k < 6; k++) { p.rect(200 + k * 8, 170, 6, 6, '#8a5a3a'); circle(p, 203 + k * 8, 167, 3, ['#e8443a', '#f6c445', '#f59ab3'][k % 3]); }
    },
    fx: [{ k: 'steam', x: 34, y: 146, n: 1 }, { k: 'steam', x: 80, y: 146, n: 1 }, { k: 'steam', x: 126, y: 146, n: 1 }, { k: 'bird', x: 200, y: 60, icon: '🕊️', n: 2 }],
    acts: [buy(60, 140, 'ca_phe_sua', 6, '☕ Café au lait'), buy(140, 140, 'cupcake', 7, '🧁 Bánh macaron'), { ...say(220, 160, '🪗 Nghệ sĩ accordion', 'La vie en rose~ 🎶 nhạc accordion vang khắp con phố', 'sit'), at: { x: 116, y: 160 } }, ph(100, 176)],
    lines: ['Un café, s\'il vous plaît', 'Ngồi đây ngắm phố đi', 'Bánh ngon quá', 'Lãng mạn ghê', 'Nhạc hay quá 🎶'],
  },

  // ═════════ VENICE ═════════
  trip_venice_canal: {
    trip: 'venice', id: 'canal', name: 'Kênh đào Gondola', icon: '🛶', at: 70, walk: W(160), day: ['#88c4f0', '#fff0d8'],
    draw: (p, L) => {
      sky(p, L, ['#88c4f0', '#fff0d8'], 40, 128);
      const cs = ['#e8a87a', '#f0d088', '#d8786a', '#f0c0a0', '#e89a6a', '#d8c098'];
      for (let i = 0; i < 4; i++) { bldg(p, L, i * 26, 120, 25, 80 + (i % 2) * 10, cs[i], '#a84a3a', '#4a3a3a', 6); bldg(p, L, 152 + i * 26, 120, 25, 76 + (i % 2) * 12, cs[i + 2], '#a84a3a', '#4a3a3a', 6); }
      for (let i = 0; i < 8; i++) { const x = i < 4 ? 4 + i * 26 : 156 + (i - 4) * 26; p.rect(x, 80, 18, 2, '#ffffff'); for (let k = 0; k < 4; k++) circle(p, x + 2 + k * 5, 79, 1, '#e8443a'); }
      // cầu Rialto vòm đá
      water(p, L, 108, 162, '#3a9aa8', '#2a7888');
      for (let x = 70; x < 186; x++) { const t = (x - 70) / 116, lift = Math.round(Math.sin(t * Math.PI) * 22); p.rect(x, 96 - lift, 1, 14 + lift - Math.round(Math.sin(t * Math.PI) * 16), '#e8dcc0'); }
      p.rect(108, 66, 40, 10, '#e8dcc0'); for (let k = 0; k < 5; k++) p.rect(111 + k * 7, 68, 4, 6, '#8a7a68'); p.rect(106, 63, 44, 3, '#a84a3a');
      // cọc buộc thuyền sọc
      for (let x = 20; x < 256; x += 56) { for (let k = 0; k < 6; k++) p.rect(x, 128 + k * 4, 3, 4, k % 2 ? '#ffffff' : '#3a5ad0'); }
      band(p, 162, 192, '#d0b890', '#c0a880'); p.rect(0, 162, 256, 2, '#a89070');
      for (let x = 0; x < 256; x += 64) L.lamps.push({ x: x + 30, y: 150, c: '#ffd88a' });
    },
    fx: [{ k: 'shim', x: 0, y: 110, w: 256, h: 50, n: 26 }, { k: 'move', spr: 'gondola', x: 20, y: 150, dx: 180, dur: 24 }, { k: 'move', spr: 'gondola', x: 210, y: 128, dx: -170, dur: 30 }],
    acts: [{ k: 'ride', x: 128, y: 172, label: '🛶 Đi gondola', spr: 'gondola', ry: 146, say: 'O sole mio~ 🎶 Anh lái thuyền hát vang dưới cầu Rialto' }, buy(40, 178, 'kem_que', 6, '🍨 Gelato'), ph(210, 178), say(128, 90, '🌉 Cầu Rialto', 'Cây cầu đá 400 năm — đứng bờ kênh ngắm gondola lướt qua dưới cầu', 'gaze')],
    lines: ['Ciao!', 'Gondola đẹp ghê', 'Nước trong xanh quá', 'Gelato ngon tuyệt', 'Lạc đường rồi 😂'],
  },
  trip_venice_sanmarco: {
    trip: 'venice', id: 'sanmarco', name: 'Quảng trường San Marco', icon: '🕊️', at: 190, walk: W(122), day: ['#90c8f0', '#fff4e0'],
    draw: (p, L) => {
      sky(p, L, ['#90c8f0', '#fff4e0'], 70, 40);
      // tháp chuông Campanile
      p.rect(20, 16, 18, 104, '#c8785a'); p.rect(18, 40, 22, 14, '#e8dcc0'); for (let k = 0; k < 3; k++) p.rect(22 + k * 6, 42, 3, 10, '#5a4a3a'); p.rect(20, 6, 18, 10, '#4a8a6a'); p.rect(28, 0, 2, 6, '#d8a83a');
      // nhà thờ mái vòm
      p.rect(80, 70, 150, 50, '#e8dcc0');
      for (let k = 0; k < 5; k++) { circle(p, 98 + k * 29, 64, 9, '#8aa8a0'); p.rect(97 + k * 29, 50, 2, 6, '#d8a83a'); }
      for (let k = 0; k < 5; k++) { const cx = 98 + k * 29; for (let dx = -10; dx <= 10; dx++) p.rect(cx + dx, 90 - Math.round(Math.sqrt(100 - dx * dx) * 0.8), 1, 30, '#c8a060'); p.rect(cx - 7, 96, 14, 24, '#4a3a5a'); circle(p, cx, 88, 5, '#d8a83a'); }
      // dãy hành lang vòm hai bên
      p.rect(0, 100, 80, 22, '#e8e0cc'); p.rect(230, 100, 26, 22, '#e8e0cc'); for (let x = 2; x < 80; x += 10) p.rect(x, 108, 6, 14, '#7a6a58'); for (let x = 232; x < 256; x += 10) p.rect(x, 108, 6, 14, '#7a6a58');
      // sàn đá kẻ ô
      band(p, 122, 192, '#d8ccb8', '#c8bca8');
      for (let y = 126; y < 192; y += 12) p.rect(0, y, 256, 1, '#f0e8d8');
      for (let x = 0; x < 256; x += 24) p.rect(x, 122, 1, 70, '#f0e8d8');
      // bàn café ngoài trời + dàn nhạc
      for (let i = 0; i < 3; i++) { const x = 196 + i * 18; circle(p, x, 150, 4, '#ffffff'); p.rect(x, 150, 1, 8, '#3a3a3a'); }
      p.rect(160, 132, 30, 2, '#ffffff'); p.rect(166, 134, 2, 8, '#3a3a3a'); p.rect(182, 134, 2, 8, '#3a3a3a');
      for (let x = 50; x < 256; x += 60) L.lamps.push({ x, y: 118, c: '#ffe8a0' });
    },
    fx: [{ k: 'bird', x: 100, y: 140, icon: '🕊️', n: 6 }, { k: 'bird', x: 140, y: 40, icon: '🕊️', n: 3 }],
    acts: [say(110, 160, '🌾 Cho bồ câu ăn', 'Cả đàn bồ câu sà xuống quanh hai bạn, một con đậu lên vai luôn 🕊️', 'feed'), buy(210, 140, 'ca_phe_sua', 7, '☕ Espresso'), buy(60, 150, 'tiramisu', 10, '🍰 Tiramisu'), ph(150, 176)],
    lines: ['Bồ câu nhiều quá', 'Nhà thờ lộng lẫy ghê', 'Nghe dàn nhạc đi 🎻', 'Bellissimo!', 'Leo tháp chuông không?'],
  },

  // ═════════ THUỴ SĨ ═════════
  trip_swiss_station: {
    trip: 'swiss', id: 'station', name: 'Ga tàu núi', icon: '🚂', at: 60, walk: W(140), day: ['#70b0f0', '#e8f4ff'],
    draw: (p, L) => {
      sky(p, L, ['#70b0f0', '#e8f4ff'], 100, 60);
      // đỉnh Matterhorn
      for (let y = 10; y < 100; y++) { const w = (y - 10) * 0.9; p.rect(170 - w * 0.6, y, w * 1.4, 1, y < 34 ? '#ffffff' : mix('#8a8aa0', '#6a7a8a', (y - 10) / 90)); }
      ridge(p, 100, 34, 26, '#8a9ab0', 0.7, '#ffffff'); ridge(p, 112, 24, 20, '#5a9a5a', 2.3);
      for (let i = 0; i < 12; i++) pine(p, 8 + i * 22, 112 + (i % 2) * 3, 14, '#2a6a3a');
      band(p, 112, 192, '#8ac870', '#6aa858');
      // nhà ga gỗ + đồng hồ
      p.rect(20, 82, 70, 38, '#b8784a'); for (let k = 0; k < 7; k++) p.rect(20 + k * 10, 82, 1, 38, '#8a5a32');
      for (let k = 0; k < 10; k++) p.rect(14 + k * 8, 76 - Math.abs(k - 4.5) * 3, 8, 8, '#7a3a2a');
      for (let k = 0; k < 3; k++) { p.rect(28 + k * 20, 92, 10, 10, '#c8e8ff'); L.wins.push([28 + k * 20, 92, 10, 10]); }
      p.rect(40, 70, 30, 6, '#ffffff'); p.rect(54, 71, 2, 4, '#d8302a'); p.rect(52, 72, 6, 2, '#d8302a');
      circle(p, 55, 84, 3, '#ffffff'); p.px(55, 83, '#2a2a2a'); p.px(56, 84, '#2a2a2a');
      // sân ga + đường ray
      tiles(p, 120, 136, '#c8c0b0', '#b8b0a0', 8);
      p.rect(0, 136, 256, 12, '#7a6a5a'); for (let x = 0; x < 256; x += 6) p.rect(x, 137, 3, 11, '#5a4a3a'); p.rect(0, 139, 256, 1, '#c8c8d0'); p.rect(0, 145, 256, 1, '#c8c8d0');
      for (let i = 0; i < 6; i++) circle(p, 120 + i * 22, 170 + (i % 2) * 8, 2, ['#ffffff', '#f6c445', '#b08ae0'][i % 3]);
      speckle(p, L, 0, 150, 256, 40, 80, ['#ffffff', '#f6e04a', '#e8443a', '#b08ae0']);
      for (let x = 100; x < 256; x += 50) L.lamps.push({ x, y: 116, c: '#ffe8a0' });
    },
    fx: [{ k: 'move', spr: 'train', x: -80, y: 136, dx: 420, dur: 16, loop: true }, { k: 'fall', n: 10, c: ['#ffffff'], size: 2, slow: true }],
    acts: [{ k: 'ride', x: 160, y: 128, label: '🚂 Lên tàu đỏ', spr: 'train', ry: 136, say: 'Tàu Glacier Express leo dốc qua cầu đá, tuyết trắng hai bên cửa sổ 🚂' }, buy(60, 128, 'chocolate', 10, '🍫 Sô-cô-la Thuỵ Sĩ'), ph(128, 176), { ...say(220, 170, '🐄 Bò sữa đeo chuông', 'Vuốt ve chú bò, chuông kêu leng keng~ 🐄', 'cow'), at: { x: 152, y: 176 } }],
    lines: ['Tàu tới rồi!', 'Núi tuyết đẹp quá', 'Grüezi!', 'Lạnh ghê', 'Uống sô-cô-la nóng đi'],
  },
  trip_swiss_chalet: {
    trip: 'swiss', id: 'chalet', name: 'Làng chalet bên hồ', icon: '🏠', at: 196, walk: W(150), day: ['#78b8f0', '#eef6ff'],
    draw: (p, L) => {
      sky(p, L, ['#78b8f0', '#eef6ff'], 70, 210);
      ridge(p, 70, 44, 30, '#8a9ab8', 1.3, '#ffffff'); ridge(p, 78, 22, 16, '#4a8a5a', 0.2);
      water(p, L, 78, 118, '#4aa0d0', '#3a88b8');
      // phản chiếu núi
      for (let x = 0; x < 256; x += 2) p.rect(x, 80 + Math.round(Math.sin(x / 9) * 2), 1, 6, '#6a8ab0' + '60');
      band(p, 118, 192, '#8ac870', '#70b058');
      for (let i = 0; i < 4; i++) {
        const x = 8 + i * 62, yb = 148;
        p.rect(x, yb - 26, 44, 26, '#a8683a'); for (let k = 0; k < 6; k++) p.rect(x, yb - 26 + k * 5, 44, 1, '#8a5030');
        for (let k = 0; k < 7; k++) { const h = 16 - Math.abs(k - 3) * 4; p.rect(x - 4 + k * 7.4, yb - 26 - h, 8, h, '#5a2a1a'); }
        p.rect(x - 4, yb - 28, 52, 2, '#ffffff');
        for (let k = 0; k < 2; k++) { const wx = x + 6 + k * 24; p.rect(wx, yb - 20, 9, 8, '#fff0c8'); L.wins.push([wx, yb - 20, 9, 8]); p.rect(wx - 1, yb - 12, 11, 3, '#6a3a22'); for (let f = 0; f < 5; f++) p.px(wx + f * 2, yb - 13, ['#e8443a', '#f6c445', '#f59ab3'][f % 3]); }
        p.rect(x + 18, yb - 12, 8, 12, '#5a2a1a');
        p.rect(x + 34, yb - 44, 4, 10, '#7a7a7a');
      }
      // cầu tàu gỗ
      p.rect(100, 112, 50, 6, '#8a6a4a'); for (let x = 102; x < 150; x += 8) p.rect(x, 112, 1, 10, '#5a3a2a');
      for (let i = 0; i < 6; i++) tree(p, 14 + i * 46, 186, 6, '#4a9a4a');
    },
    fx: [{ k: 'shim', x: 0, y: 84, w: 256, h: 30, n: 16 }, { k: 'move', spr: 'swan', x: 30, y: 108, dx: 60, dur: 18 }, { k: 'move', spr: 'boat', x: 200, y: 100, dx: -80, dur: 22 }, { k: 'steam', x: 44, y: 102, n: 2 }, { k: 'steam', x: 106, y: 102, n: 2 }, { k: 'steam', x: 168, y: 102, n: 2 }, { k: 'fall', n: 8, c: ['#ffffff'], size: 2, slow: true }],
    acts: [{ k: 'ride', x: 124, y: 126, label: '⛵ Thuyền dạo hồ', spr: 'boat', ry: 108, say: 'Thuyền trôi trên hồ gương, núi tuyết in bóng dưới nước 🏔️' }, buy(40, 160, 'cheese', 7, '🫕 Phô mai fondue'), buy(200, 160, 'chocolate', 10, '☕ Sô-cô-la nóng'), ph(128, 180)],
    lines: ['Nhà gỗ xinh quá', 'Hồ như gương vậy', 'Ăn fondue không?', 'Muốn ở đây luôn', 'Hít thở khí núi nào'],
  },

  // ═════════ ICELAND ═════════
  trip_iceland_aurora: {
    trip: 'iceland', id: 'aurora', name: 'Đồi ngắm cực quang', icon: '🌌', at: 70, walk: W(140), day: ['#0a1030', '#1a3060'],
    draw: (p, L) => {
      sky(p, L, ['#0a1030', '#1a3060'], 120, 220);
      ridge(p, 110, 30, 28, '#2a3a5a', 0.8, '#d8e4f0');
      band(p, 120, 192, '#e8f0f8', '#c8d8ec');
      for (let x = 0; x < 256; x++) p.rect(x, 116 + Math.round(Math.sin(x / 26) * 5), 1, 10, '#e0eaf6');
      // nhà thờ nhỏ mái đỏ
      p.rect(180, 98, 26, 18, '#ffffff'); for (let k = 0; k < 15; k++) p.rect(178 + k * 2, 98 - Math.min(k, 14 - k), 2, Math.min(k, 14 - k) + 1, '#d8302a');
      p.rect(200, 82, 6, 16, '#ffffff'); p.rect(199, 76, 8, 6, '#d8302a'); p.rect(202, 70, 2, 6, '#3a3a3a');
      L.wins.push([186, 104, 4, 6], [196, 104, 4, 6]);
      for (let i = 0; i < 8; i++) pine(p, 10 + i * 18, 136 + (i % 3) * 2, 16, '#1a3a3a', '#ffffff');
      // lều + ghế ngắm sao
      for (let k = 0; k <= 44; k++) { const h = Math.round(Math.min(k, 44 - k) * 1.3); p.rect(44 + k, 172 - h, 1, h, k < 22 ? '#f6a83a' : '#e08a2a'); }
      for (let k = 0; k <= 14; k++) { const h = Math.round(Math.min(k, 14 - k) * 1.3) + 6; p.rect(59 + k, 172 - h, 1, h, '#5a3a22'); }
      p.rect(65, 145, 2, 27, '#8a5a2a'); p.rect(44, 172, 46, 2, '#a86a2a'); p.px(40, 173, '#5a4a3a'); p.px(93, 173, '#5a4a3a');
      for (let k = 0; k < 5; k++) { p.px(41 + k, 172 - k * 2, '#c8c8c8'); p.px(92 - k, 172 - k * 2, '#c8c8c8'); }
      L.lamps.push({ x: 64, y: 150, c: '#ffd060' });
      p.rect(120, 168, 16, 3, '#8a5a3a'); p.rect(140, 168, 16, 3, '#8a5a3a');
      circle(p, 100, 176, 3, '#5a4a3a'); L.lamps.push({ x: 99, y: 170, c: '#ff9a3a' });
    },
    fx: [{ k: 'aurora', y: 10 }, { k: 'sparkle', x: 0, y: 0, w: 256, h: 90, n: 30 }, { k: 'fall', n: 26, c: ['#ffffff', '#e8f4ff'], size: 2, slow: true }],
    acts: [{ ...say(128, 150, '💚 Ước dưới cực quang', 'Tay trong tay ước một điều — cực quang nhảy múa ngay trên đầu 💚', 'pray'), at: { x: 128, y: 168 } }, buy(100, 170, 'honey_tea', 6, '🍵 Trà nóng'), ph(190, 160), say(60, 156, '⛺ Chui vào lều', 'Đắp chung chăn, đếm sao băng tới sáng 🌠', 'tent')],
    lines: ['Cực quang kìa!!', 'Lạnh quá ôm em đi', 'Xanh lá đẹp quá 💚', 'Sao băng!', 'Ước gì đi'],
  },
  trip_iceland_lagoon: {
    trip: 'iceland', id: 'lagoon', name: 'Blue Lagoon', icon: '♨️', at: 200, walk: W(150), day: ['#9ab8d8', '#e0ecf4'],
    draw: (p, L) => {
      sky(p, L, ['#9ab8d8', '#e0ecf4'], 70, 60);
      ridge(p, 70, 22, 22, '#5a6a7a', 1.9, '#e8f0f8');
      // đá dung nham đen phủ rêu
      band(p, 70, 88, '#3a3a40', '#2a2a30'); speckle(p, L, 0, 70, 256, 18, 160, ['#4a5a4a', '#5a6a5a', '#1a1a20']);
      // hồ nước xanh sữa
      for (let y = 88; y < 150; y++) p.rect(0, y, 256, 1, mix('#8ae0e8', '#5ac8d8', (y - 88) / 62));
      speckle(p, L, 0, 90, 256, 58, 120, ['#c8f8ff', '#ffffff']);
      for (let i = 0; i < 6; i++) { const x = 20 + i * 44; circle(p, x, 90, 6, '#2a2a30'); speckle(p, L, x - 6, 84, 12, 6, 8, ['#5a6a5a']); }
      // quầy bar nổi + lối gỗ
      p.rect(180, 112, 40, 12, '#6a4a3a'); p.rect(176, 104, 48, 4, '#3a3a40'); p.rect(184, 108, 2, 4, '#3a3a40'); p.rect(214, 108, 2, 4, '#3a3a40'); L.neon.push({ x: 188, y: 114, w: 24, h: 3, c: '#8af0ff' });
      band(p, 150, 192, '#4a4a50', '#3a3a40'); p.rect(0, 150, 256, 3, '#8a6a4a');
      for (let x = 0; x < 256; x += 12) p.rect(x, 154, 10, 34, '#7a5a3a'); for (let x = 0; x < 256; x += 12) p.rect(x + 10, 154, 2, 34, '#5a3a2a');
      for (let x = 30; x < 256; x += 70) L.lamps.push({ x, y: 146, c: '#ffe8a0' });
      // mặt nạ bùn khoáng (chậu trắng)
      p.rect(70, 140, 14, 8, '#f0f0f0'); p.rect(72, 138, 10, 2, '#d8d8d8');
      // hồ riêng: vách gỗ ba mặt, mái che, đèn lồng
      for (let x = 0; x < 46; x += 3) { p.rect(x, 140, 2, 12, '#7a5a3a'); p.rect(x, 140, 2, 1, '#9a7a5a'); }
      for (let y = 84; y < 152; y += 3) { p.rect(44, y, 3, 2, '#7a5a3a'); }
      p.rect(0, 82, 48, 4, '#4a3a2a'); p.rect(0, 80, 48, 2, '#6a5a4a');
      p.rect(46, 84, 1, 68, '#5a3a2a'); L.lamps.push({ x: 38, y: 88, c: '#ffd88a' });
      p.rect(8, 146, 30, 5, '#5a3a2a'); p.rect(10, 147, 26, 3, '#e8d8b0');
    },
    fx: [{ k: 'steam', x: 40, y: 120, n: 3 }, { k: 'steam', x: 110, y: 130, n: 3 }, { k: 'steam', x: 160, y: 110, n: 3 }, { k: 'steam', x: 230, y: 126, n: 3 }, { k: 'shim', x: 0, y: 92, w: 256, h: 56, n: 20, c: '#ffffff' }, { k: 'fall', n: 12, c: ['#ffffff'], size: 2, slow: true }],
    acts: [say(110, 140, '♨️ Ngâm nước khoáng', 'Nước ấm 38°C giữa trời tuyết, ôm nhau ngâm mình sướng rơn ♨️', 'soak'), say(84, 130, '🤍 Đắp mặt nạ bùn', 'Hai đứa đắp mặt nạ silica trắng xoá, nhìn nhau cười lăn 😂', 'mask'), buy(200, 140, 'yogurt', 6, '🥛 Skyr'), ph(128, 176), say(22, 128, '🔒 Hồ riêng hai đứa', 'Hồ riêng có vách gỗ che kín, chỉ có hai đứa mình thôi 💑', 'soak')],
    lines: ['Nước ấm ghê', 'Hơi bốc lên mờ ảo', 'Đắp mặt nạ chưa?', 'Không muốn lên bờ', 'Xanh như sữa vậy'],
  },
};

export const spotOf = (scene: string) => (SPOTS as Record<string, SpotDef | undefined>)[scene];
export const spotsOf = (trip: TripId) => (Object.keys(SPOTS) as SpotScene[]).filter(k => SPOTS[k].trip === trip).map(k => ({ scene: k, ...SPOTS[k] }));
export const FORTUNES = ['大吉 Đại cát — năm nay hai bạn cực kỳ may mắn! 🌟', '中吉 Trung cát — tình yêu ngày càng sâu đậm 💕', '小吉 Tiểu cát — có quà bất ngờ sắp tới 🎁', '吉 Cát — đi đâu cũng vui 🎈', '末吉 Mạt cát — kiên nhẫn sẽ được đền đáp 🍀', '凶 Hung — buộc quẻ lên cây để xua xui nha 🎋'];

/** Hoa đăng: đèn hoa sen giấy hồng, nến cháy ở giữa */
export const lotusSprite = () => makeSprite('lotus:v1', 12, 9, p => {
  p.rect(1, 6, 10, 2, '#e85a8a'); p.rect(0, 5, 2, 2, '#f88ab0'); p.rect(10, 5, 2, 2, '#f88ab0');
  p.rect(2, 3, 2, 3, '#f8a8c8'); p.rect(8, 3, 2, 3, '#f8a8c8'); p.rect(4, 2, 4, 4, '#ffd0e0');
  p.rect(5, 1, 2, 2, '#fff8e0'); p.px(5, 0, '#ffd040'); p.px(6, 0, '#ff9a30');
});
/** Bông hoa sơn lên tường Làng Cầu Vồng */
export const wallFlowerSprite = (i: number) => makeSprite(`wallflower:${i % 4}`, 11, 13, p => {
  const c = ['#e8443a', '#f59ab3', '#4a9ae8', '#9a6ae0'][i % 4];
  p.rect(5, 6, 1, 7, '#3a8a3a'); p.rect(6, 9, 3, 1, '#4aa84a'); p.rect(2, 10, 3, 1, '#4aa84a');
  for (const [dx, dy] of [[0, -3], [3, 0], [0, 3], [-3, 0], [2, -2], [-2, 2], [2, 2], [-2, -2]]) p.rect(4 + dx, 3 + dy, 3, 3, c);
  p.rect(4, 3, 3, 3, '#ffe04a');
}, null);

// ───────── hiệu ứng pixel nhỏ bay lên / đậu xuống ─────────
const POP_ART: Record<string, [number, number, string[], Record<string, string>]> = {
  '🕊️': [9, 7, ['..WW.....', '.WKWW....', 'OWWWWWW..', '..WGGWWWW', '..WWWWWG.', '...WWW...', '...O.O...'], { W: '#e8e8f0', K: '#2a2a3a', O: '#f08a3a', G: '#8a9ab8' }],
  '🍁': [7, 7, ['...R...', 'R.RRR.R', 'RRRRRRR', '.RRDRR.', 'RRRDRRR', '...D...', '...D...'], { R: '#e8443a', D: '#8a2a1a' }],
  '🔔': [7, 8, ['...B...', '..YYY..', '.YYWYY.', '.YYYYY.', '.YYYYY.', 'YYYYYYY', 'DDDDDDD', '...D...'], { Y: '#f6c445', W: '#fff4b0', D: '#a87a2a', B: '#6a4a2a' }],
  '🫙': [8, 9, ['.RRRRRR.', '.BBBBBB.', 'BBBBBBBB', 'BBLBBBBB', 'BBLBBBBB', 'BBBBBBBB', 'BBBBBBBB', '.BBBBBB.', '..DDDD..'], { R: '#e8d8b0', B: '#6a3a22', L: '#9a6a4a', D: '#3a2010' }],
  '🎵': [5, 7, ['..KK.', '..K.K', '..K..', '..K..', 'KKK..', 'KKK..', '.K...'], { K: '#3a2a5a' }],
  '🎶': [7, 7, ['..KKKKK', '..K...K', '..K...K', '..K...K', 'KKK.KKK', 'KKK.KKK', '.K...K.'], { K: '#c04a8a' }],
  '✨': [5, 5, ['..Y..', '.YWY.', 'YWWWY', '.YWY.', '..Y..'], { Y: '#f6e04a', W: '#ffffff' }],
  '💕': [7, 6, ['.RR.RR.', 'RRPRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'], { R: '#f0507a', P: '#ffd0dc' }],
  '🌠': [7, 7, ['...Y...', '..YWY..', 'YYWWWYY', '.YWWWY.', '.YY.YY.', 'Y.....Y', '.......'], { Y: '#f6e04a', W: '#fff8d0' }],
  '🙏': [5, 7, ['..S..', '..S..', '.S.S.', '..S..', '.S...', '..S..', '...S.'], { S: '#e8e8f0' }],
  '🎉': [7, 7, ['R...B..', '..Y...G', '.P..R..', 'G...Y.B', '..B..P.', 'Y.G...R', '...R...'], { R: '#e8443a', B: '#4a9ae8', Y: '#f6e04a', G: '#6ac86a', P: '#f59ab3' }],
  '👏': [7, 6, ['Y..Y..Y', '.......', 'Y.YYY.Y', '..YWY..', 'Y.YYY.Y', '.......'], { Y: '#f6e04a', W: '#ffffff' }],
  '🖼️': [12, 10, ['FFFFFFFFFFFF', 'FSSSSSSSSSSF', 'FSSSSSSYSSSF', 'FSSPPSSSSSSF', 'FSPPPPSSKKSF', 'FSSPPSSKKKKF', 'FGGGGGGGGGGF', 'FGGGGGGGGGGF', 'FFFFFFFFFFFF', '.....LL.....'], { F: '#c8903a', S: '#8ac0e8', Y: '#fff2a0', P: '#f8b8cc', K: '#4a6a8a', G: '#6aa850', L: '#7a5a3a' }],
};
export const popSprite = (icon: string): Sprite | null => {
  const a = POP_ART[icon]; if (!a) return null;
  return makeSprite(`pop:${icon}`, a[0], a[1], p => p.map(a[2], a[3]));
};
/** Bồ câu đậu đất mổ hạt (2 khung) */
export const pigeonSprite = (f: 0 | 1) => makeSprite(`pigeon:${f}`, 10, 8, p => p.map(f ? ['..........', '..........', '.GGWWWW...', 'GGWWWWWW..', '.GWWWWWWW.', '..WWWWWWWK', '...O.O..OO', '..........'] : ['.......WW.', '......WKWO', '.GGWWWWWW.', 'GGWWWWWW..', '.GWWWWWW..', '..WWWWW...', '...O.O....', '..........'], { W: '#d8d8e4', G: '#7a8aa8', K: '#2a2a3a', O: '#f08a3a' }));
/** Tờ quẻ buộc trên giá */
export const knotSprite = () => makeSprite('omikuji-knot', 3, 5, p => { p.rect(0, 0, 3, 2, '#fffaf0'); p.px(1, 2, '#e8e0d0'); p.rect(0, 3, 3, 2, '#fffaf0'); });

/** Chim / bướm bay nền (2 khung vỗ cánh) */
const FLY: Record<string, [string[], string[], Record<string, string>]> = {
  '🦋': [['B..B', 'BBBB', '.KK.', 'PBBP'], ['....', 'BBBB', 'BKKB', '....'], { B: '#f08ac8', P: '#f6c445', K: '#3a2a3a' }],
  '🕊️': [['W.....W', 'WW...WW', '.WWWWWK', '..WWW..'], ['.......', '.WWWWWK', 'WWWWW..', 'W.....W'], { W: '#eeeef4', K: '#f08a3a' }],
  '🐦': [['K...K', 'KK.KK', '.BBBO', '..B..'], ['.....', '.BBBO', 'KKBKK', 'K...K'], { K: '#3a3a4a', B: '#6a5a4a', O: '#f6a83a' }],
  '🦅': [['K.......K', 'KK.....KK', '.KKBBBKKW', '...BBB..O', '....K....'], ['.........', '...BBB..W', 'KKKBBBKKO', 'K..K.K..K', '.........'], { K: '#3a2a1a', B: '#6a4a2a', W: '#ffffff', O: '#f6c445' }],
};
export const flySprite = (icon: string, f: 0 | 1) => { const a = FLY[icon] ?? FLY['🐦']; const rows = a[f]; return makeSprite(`fly:${icon}:${f}`, rows[0].length, rows.length, p => p.map(rows, a[2]), null); };
/** Nắp chum tương mở hé */
export const lidSprite = () => makeSprite('jar-lid', 11, 4, p => { p.rect(1, 1, 9, 2, '#4a2a18'); p.rect(4, 0, 3, 1, '#6a3a22'); p.rect(1, 3, 9, 1, '#2a1a10'); });
/** Chuông bò lắc lư */
export const cowbellSprite = () => makeSprite('cowbell', 5, 6, p => { p.rect(1, 0, 3, 1, '#8a5a2a'); p.rect(1, 1, 3, 3, '#f6c445'); p.rect(0, 4, 5, 1, '#c8902a'); p.px(2, 5, '#6a4a2a'); p.px(1, 2, '#fff4b0'); });
