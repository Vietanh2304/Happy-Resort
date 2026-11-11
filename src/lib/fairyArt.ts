// Disneyland: công viên giải trí ở điểm du lịch — lâu đài, đại lộ diễu hành, khu trò chơi (tàu lượn, ngựa gỗ, tách trà).
// Toàn bộ vẽ pixel tay; lâu đài dùng chung cho phố chính, map lâu đài, chuyến tàu lượn và quà lưu niệm.
import { ellipse } from './iso';
import { makeSprite as mkRaw, mix, type Pen, type Sprite } from './pixel';
/** Sprite màu tươi (không pha màu dịu như phần còn lại của game) */
const makeSprite = (key: string, w: number, h: number, draw: (p: Pen) => void, outline: string | null = '#3a2420') => mkRaw(`v:${key}`, w, h, draw, outline, true);
import { band, circle, dither, sky, speckle, string, tiles, tree, water, type Light } from './tripSpots';

const GOLD = '#f6c445', GOLD_D = '#c8902a';
const dk = (c: string, k = 0.3) => mix(c, '#2a1a3a', k), lt = (c: string, k = 0.35) => mix(c, '#ffffff', k);

/** Lâu đài pastel: tường kem, tháp hồng, mái chóp xanh, chóp vàng cờ hồng. `k` = tỉ lệ; `mono` = tô một màu (lớp chiếu sáng) */
export function castle(p: Pen, L: Light | null, cx: number, base: number, k: number, mono?: string, lit = false) {
  const C = (c: string) => mono ?? c;
  const R = (x: number, y: number, w: number, h: number, c: string) => {
    const x0 = Math.round(cx + x * k), x1 = Math.round(cx + (x + w) * k), y1 = Math.round(base - y * k), y0 = Math.round(base - (y + h) * k);
    p.rect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0), C(c));
  };
  const WALL = '#f6eedf', WALL_D = '#dccbb4', PINK = '#f4cfe2', PINK_D = '#d8a8c4', ROOF = '#4a8ad8', ROOF_L = '#80b8f4', ROOF_D = '#2c5aa0';
  const win = (x: number, y: number, big = false) => {
    const w = big ? 4 : 3, h = big ? 8 : 6;
    R(x - w / 2 - 0.6, y - 0.6, w + 1.2, h + 1.6, '#c8b8a8'); R(x - w / 2, y, w, h, lit ? '#ffd88a' : '#4a5a98'); R(x - w / 2, y + h - 1.5, w / 2, 1.5, lit ? '#fff4c8' : '#9ab8f0');
    if (L && !mono) { const sx = Math.round(cx + (x - w / 2) * k), sy = Math.round(base - (y + h) * k); L.wins.push([sx, sy, Math.max(1, Math.round(w * k)), Math.max(2, Math.round(h * k))]); }
  };
  const cone = (x: number, w: number, y: number, h: number) => {
    for (let i = 0; i < h; i += 0.5) {
      const hw = (w / 2 + 1.5) * Math.pow(1 - i / h, 1.15);
      R(x - hw, y + i, hw * 2, 0.6, ROOF); R(x - hw, y + i, hw * 0.55, 0.6, ROOF_L); R(x + hw * 0.5, y + i, hw * 0.5, 0.6, ROOF_D);
    }
    for (let i = 3; i < h - 4; i += 6) R(x - (w / 2) * (1 - i / h) * 0.9, y + i, (w * (1 - i / h)) * 0.9, 0.5, ROOF_D);
    if (lit) for (let i = 0; i < h - 2; i += 4) { const hw = (w / 2 + 1.5) * Math.pow(1 - i / h, 1.15); bulb(x - hw, y + i); bulb(x + hw - 0.6, y + i); }
    R(x - 2.5, y - 1, w * 0 + 5, 1.5, GOLD); R(x - (w / 2 + 1.5), y - 0.8, w + 3, 1.6, GOLD);
    R(x - 0.6, y + h, 1.2, 6, GOLD); R(x - 1.2, y + h + 2, 2.4, 1.6, GOLD_D);
    R(x + 0.6, y + h + 3.5, 6, 2.6, '#f07aa6'); R(x + 0.6, y + h + 3.5, 6, 1, '#ffb0cc');
  };
  const bulb = (x: number, y: number) => { const sx = Math.round(cx + x * k), sy = Math.round(base - y * k); p.px(sx, sy, '#fff6c8'); };
  const tower = (x: number, w: number, y0: number, y1: number, wall: string, shade: string, roofH: number) => {
    R(x - w / 2, y0, w, y1 - y0, wall); R(x + w / 2 - w * 0.28, y0, w * 0.28, y1 - y0, shade); R(x - w / 2, y0, 1, y1 - y0, lt(wall, 0.4));
    for (let yy = y0 + 8; yy < y1 - 10; yy += 15) win(x, yy);
    R(x - w / 2 - 1, y1 - 3, w + 2, 3, wall); for (let bx = x - w / 2 - 1; bx < x + w / 2; bx += 3) R(bx, y1, 1.6, 2.4, wall);
    cone(x, w + 2, y1 + 2, roofH);
  };
  // tường thành có lỗ châu mai
  R(-66, 0, 132, 32, WALL); R(30, 0, 36, 32, WALL_D); R(-66, 30, 132, 2, lt(WALL, 0.5));
  for (let x = -66; x < 66; x += 7) R(x, 32, 4, 4, WALL);
  for (let x = -60; x < 62; x += 22) if (Math.abs(x) > 14) win(x + 4, 14);
  // tháp ngoài + tháp giữa
  tower(-62, 14, 0, 58, WALL, WALL_D, 28); tower(62, 14, 0, 58, WALL, WALL_D, 28);
  tower(-40, 12, 24, 82, PINK, PINK_D, 26); tower(40, 12, 24, 82, PINK, PINK_D, 26);
  // toà chính
  R(-26, 30, 52, 52, PINK); R(12, 30, 14, 52, PINK_D); R(-26, 80, 52, 2, lt(PINK, 0.5));
  for (let x = -26; x < 26; x += 6) R(x, 82, 3, 3, PINK);
  win(-16, 50, true); win(16, 50, true); win(-16, 66); win(16, 66);
  // mái đầu hồi giữa
  for (let i = 0; i < 14; i++) R(-13 + i * 0.9, 82 + i, 26 - i * 1.8, 1, ROOF);
  tower(-23, 9, 64, 104, WALL, WALL_D, 22); tower(23, 9, 64, 104, WALL, WALL_D, 22);
  // tháp chính có cửa sổ hoa hồng
  R(-9, 82, 18, 48, WALL); R(3, 82, 6, 48, WALL_D);
  if (!mono) { const ry = Math.round(base - 104 * k), rr = Math.max(2, Math.round(5 * k)); circle(p, Math.round(cx), ry, rr + 1, '#c8a8b8'); circle(p, Math.round(cx), ry, rr, '#e8507a'); circle(p, Math.round(cx), ry, Math.max(1, rr - 2), '#f6c445'); p.px(Math.round(cx), ry, '#5ab8f0'); }
  else R(-5, 99, 10, 10, '#ffffff');
  win(0, 116);
  R(-11, 127, 22, 3, WALL); for (let x = -11; x < 11; x += 4) R(x, 130, 2, 2.6, WALL);
  cone(0, 18, 132, 40);
  // cổng vòm + song sắt vàng
  R(-12, 0, 24, 24, '#e2d4c0'); R(-9, 0, 18, 18, '#3a2840');
  for (let i = 0; i < 5; i++) R(-9 + i * 1.1, 18 + i * 0.9, 18 - i * 2.2, 1, '#3a2840');
  for (let x = -7; x < 9; x += 3) R(x, 2, 0.8, 18, GOLD_D);
  R(-9, 8, 18, 0.8, GOLD_D); R(-3, 25, 6, 4, GOLD); R(-1.5, 26, 3, 2, '#e8507a');
  // cờ hiệu dọc tường
  for (const x of [-50, 50]) { R(x - 2, 10, 4, 14, '#e8507a'); R(x - 2, 10, 4, 2, GOLD); R(x - 1, 8, 2, 2, '#e8507a'); }
  if (lit) { for (let x = -66; x <= 66; x += 4) bulb(x, 36); for (let x = -26; x <= 26; x += 4) bulb(x, 85); for (let y = 0; y < 30; y += 4) { bulb(-66, y); bulb(66, y); } }
  if (L && L.night && !mono && !lit) (L.post ??= []).push(() => castle(p, null, cx, base, k, undefined, true));
  if (L && !mono) for (const x of [-16, 16]) L.lamps.push({ x: Math.round(cx + x * k), y: Math.round(base - 14 * k), c: '#ffd88a' });
}

const DUMMY = (): Light => ({ ph: 'day', night: false, dusk: false, r: Math.random, wins: [], lamps: [], neon: [] });
/** Lâu đài rời (dùng ở tàu lượn, quà lưu niệm, lớp chiếu sáng) */
export const castleSprite = (k: number, mono?: string) => {
  const w = Math.ceil(140 * k) + 4, h = Math.ceil(184 * k) + 4;
  return makeSprite(`castle:${k}:${mono ?? ''}`, w, h, p => castle(p, DUMMY(), w / 2, h - 1, k, mono), null);
};
export const CASTLE_SPOT = { cx: 128, base: 130, k: 0.48 };

// ───────── nền các map ─────────
function shop(p: Pen, L: Light, x: number, yb: number, w: number, h: number, wall: string, trim: string, dome = false) {
  const top = yb - h;
  p.rect(x, top, w, h, wall); dither(p, x + w - 4, top, 4, h, wall, dk(wall, 0.15)); p.rect(x, top, 1, h, dk(wall, 0.3));
  // mái
  if (dome) {
    for (let i = 0; i < 12; i++) { const hw = (w / 2) * Math.sqrt(1 - (i / 12) ** 2); p.rect(x + w / 2 - hw, top - 2 - i, hw * 2, 1, i % 3 ? trim : lt(trim, 0.3)); }
    p.rect(x + w / 2 - 1, top - 18, 2, 5, GOLD); p.px(x + w / 2, top - 19, '#fff2b0');
  } else {
    for (let i = 0; i < 12; i++) { const hw = (w / 2 + 1) * (1 - i / 12); p.rect(x + w / 2 - hw, top - 2 - i, hw * 2, 1, trim); }
    for (let xx = x; xx < x + w; xx += 3) p.px(xx + 1, top - 2, '#ffffff');
    circle(p, x + w / 2, top - 6, 2, '#ffffff'); p.px(x + w / 2, top - 6, GOLD);
  }
  p.rect(x - 1, top - 2, w + 2, 2, GOLD); p.rect(x - 1, top - 2, w + 2, 1, '#fff2b0');
  // cửa sổ tầng trên + chậu hoa
  for (let xx = x + 4; xx < x + w - 6; xx += 9) {
    p.rect(xx - 1, top + 5, 7, 9, dk(wall, 0.3)); p.rect(xx, top + 6, 5, 7, '#9ac8f0'); p.px(xx, top + 6, '#e8f4ff'); p.rect(xx, top + 5, 5, 1, lt(wall, 0.5));
    L.wins.push([xx, top + 6, 5, 7]);
    p.rect(xx - 1, top + 14, 7, 2, '#7a4e2c'); for (let f = 0; f < 4; f++) p.px(xx + f * 2 - 1, top + 13, ['#e8507a', '#f6c445', '#ffffff', '#b08ae0'][f]);
  }
  // mái hiên sọc + tủ kính bày hàng
  for (let k = 0; k < w; k += 4) { p.rect(x + k, yb - 22, 4, 4, (k / 4) % 2 ? trim : '#ffffff'); p.rect(x + k + 1, yb - 18, 2, 1, (k / 4) % 2 ? trim : '#ffffff'); }
  // tủ kính: khung vàng, kính xanh nhạt, bày gấu bông tai chuột + bóng bay
  const gx = x + 3, gw = w - 14;
  p.rect(gx - 1, yb - 17, gw + 2, 16, GOLD_D); for (let yy = 0; yy < 14; yy++) p.rect(gx, yb - 16 + yy, gw, 1, mix('#bfe4f8', '#eef8ff', yy / 14));
  for (let k = 0; k < gw; k += 7) { const c = ['#1a1a22', '#e8303a', '#f08ac0', '#f6c445'][(k / 7) % 4]; circle(p, gx + 3 + k, yb - 5, 2, c); p.px(gx + 1 + k, yb - 8, c); p.px(gx + 5 + k, yb - 8, c); p.rect(gx + 2 + k, yb - 3, 3, 2, ['#e8303a', '#4a9ae8', '#ffffff', '#9a5ad8'][(k / 7) % 4]); }
  for (let k = 3; k < gw; k += 9) { p.rect(gx + k, yb - 15, 1, 5, '#d8d8e0'); circle(p, gx + k, yb - 13, 1, ['#e8443a', '#f6c445', '#4a9ae8'][k % 3]); }
  p.rect(gx, yb - 16, gw, 1, '#ffffff'); p.px(gx + 1, yb - 14, '#ffffff'); p.px(gx + 2, yb - 13, '#ffffff');
  (L.post ??= []).push(() => { if (L.night || L.dusk) { p.rect(gx, yb - 16, gw, 14, '#ffd88a40'); } });
  p.rect(x + w - 10, yb - 14, 7, 14, dk(trim, 0.3)); p.rect(x + w - 9, yb - 13, 5, 13, lt(trim, 0.2)); p.px(x + w - 5, yb - 7, GOLD);
  // đêm: viền bóng đèn mái
  (L.post ??= []).push(() => { if (!L.night && !L.dusk) return; for (let xx = x; xx <= x + w; xx += 3) p.px(xx, top - 2, '#fff6c8'); for (let yy = top; yy < yb - 22; yy += 4) { p.px(x, yy, '#fff6c8'); p.px(x + w - 1, yy, '#fff6c8'); } });
}
function balloons(p: Pen, x: number, y: number) {
  const cs = ['#e8443a', '#f6c445', '#4a9ae8', '#f08aa6', '#8bc87a', '#b08ae0'];
  const P: [number, number][] = [[-5, -30], [0, -33], [5, -30], [-3, -24], [3, -24], [0, -27]];
  for (const [dx, dy] of P) p.rect(x + dx, y + dy + 3, 1, -dy - 3, '#e8e8e8');
  P.forEach(([dx, dy], i) => { ellipse(p, x + dx, y + dy, 2.4, 3, cs[i]); p.px(x + dx - 1, y + dy - 1, '#ffffff'); });
  p.rect(x - 4, y, 9, 10, '#7a4e2c'); p.rect(x - 3, y + 1, 7, 2, '#e8443a');
}
function lampPost(p: Pen, L: Light, x: number, y: number) { p.rect(x, y - 22, 2, 22, '#2a3a4a'); p.rect(x - 2, y - 26, 6, 4, '#2a3a4a'); L.lamps.push({ x: x - 1, y: y - 28, c: '#ffe8a0' }); p.rect(x - 1, y - 1, 4, 1, '#2a3a4a'); }
function flowerBed(p: Pen, L: Light, cx: number, cy: number) {
  // luống hoa hình trái tim
  for (let y = -6; y <= 8; y++) for (let x = -12; x <= 12; x++) {
    const X = x / 10, Y = -y / 8; const v = (X * X + Y * Y - 1) ** 3 - X * X * Y * Y * Y;
    if (v <= 0) p.px(cx + x, cy + y, (x + y) % 3 ? '#e8507a' : '#f6a8c8');
  }
  speckle(p, L, cx - 10, cy - 4, 20, 10, 12, ['#ffffff', '#f6c445']);
}

function fountain(p: Pen, L: Light, cx: number, cy: number) {
  ellipse(p, cx, cy, 22, 7, '#c8bcd8'); ellipse(p, cx, cy - 1, 20, 6, '#e8e0f0'); ellipse(p, cx, cy - 1, 17, 4.5, '#5ab0e8'); ellipse(p, cx, cy - 2, 14, 3, '#8ad0f8');
  p.rect(cx - 2, cy - 14, 4, 13, '#e8e0f0'); ellipse(p, cx, cy - 14, 9, 3, '#c8bcd8'); ellipse(p, cx, cy - 15, 7, 2, '#8ad0f8');
  p.rect(cx - 1, cy - 22, 2, 8, '#e8e0f0'); ellipse(p, cx, cy - 22, 4, 1.6, '#c8bcd8');
  for (let i = 0; i < 5; i++) { const y = cy - 26 - i; p.px(cx + (i % 2), y, '#ffffff'); }
  circle(p, cx, cy - 30, 2, GOLD); p.px(cx, cy - 31, '#fff2b0');
  for (let i = -8; i <= 8; i += 4) { p.px(cx + i, cy - 12 + Math.abs(i) * 0.3, '#d8f4ff'); p.px(cx + i * 1.6, cy - 4, '#d8f4ff'); }
  (L.post ??= []).push(() => { if (L.night || L.dusk) for (let a = 0; a < 16; a++) p.px(Math.round(cx + Math.cos(a / 16 * Math.PI * 2) * 21), Math.round(cy + Math.sin(a / 16 * Math.PI * 2) * 6.5), ['#ff8ad8', '#8ad8ff', '#fff2a0'][a % 3]); });
}
function topiary(p: Pen, x: number, y: number) { p.rect(x - 1, y - 4, 2, 4, '#6a4a32'); circle(p, x, y - 9, 6, '#2e7a3e'); circle(p, x - 1, y - 10, 4, '#4aa05a'); circle(p, x, y - 17, 3, '#2e7a3e'); circle(p, x - 1, y - 18, 2, '#4aa05a'); for (const [dx, dy] of [[-3, -8], [2, -11], [0, -6], [-1, -17]]) p.px(x + dx, y + dy, '#f08aa6'); p.rect(x - 4, y - 1, 8, 3, '#c8902a'); }
function goldLamp(p: Pen, L: Light, x: number, y: number) { p.rect(x, y - 24, 2, 24, GOLD_D); p.rect(x, y - 24, 1, 24, GOLD); circle(p, x + 1, y - 27, 3, '#fff2c8'); circle(p, x + 1, y - 27, 2, '#ffffff'); p.rect(x - 1, y - 24, 4, 1, GOLD); (L.post ??= []).push(() => { if (L.night || L.dusk) { circle(p, x + 1, y - 27, 5, '#ffe8a040'); circle(p, x + 1, y - 27, 2, '#ffffff'); } }); p.rect(x - 2, y - 12, 6, 3, '#7a4e2c'); p.px(x - 1, y - 13, '#e8507a'); p.px(x + 2, y - 13, '#f6c445'); p.rect(x - 2, y - 1, 6, 1, GOLD_D); }
function cart(p: Pen, x: number, y: number, c: string) { p.rect(x - 9, y - 12, 18, 10, c); for (let k = 0; k < 18; k += 3) p.rect(x - 9 + k, y - 18, 3, 4, k % 6 ? '#ffffff' : c); p.rect(x - 9, y - 14, 18, 2, GOLD); p.rect(x - 7, y - 10, 14, 5, '#fff4c0'); for (let k = 0; k < 6; k++) p.px(x - 6 + k * 2, y - 9, '#ffffff'); circle(p, x - 6, y - 1, 2, '#3a2a3a'); circle(p, x + 6, y - 1, 2, '#3a2a3a'); p.rect(x - 1, y - 24, 1, 6, '#c8c8d8'); }

export function drawFairyMain(p: Pen, L: Light) {
  sky(p, L, ['#8ac8f8', '#ffe0f0'], 108, 214);
  band(p, 86, 110, '#8ac878', '#6aa858');
  for (let i = 0; i < 11; i++) tree(p, 66 + i * 12, 106, 5, i % 2 ? '#4a9a5a' : '#3a8a4a');
  castle(p, L, 128, 112, 0.38);
  shop(p, L, 2, 110, 44, 40, '#fbe0ec', '#e8507a', true); shop(p, L, 48, 110, 38, 32, '#dcecff', '#4a8ad8');
  shop(p, L, 170, 110, 38, 32, '#fff2cc', '#f6a83a'); shop(p, L, 210, 110, 44, 40, '#e4f6e4', '#9a6ae0', true);
  tiles(p, 110, 192, '#f0dcc4', '#e4ccb0', 8);
  band(p, 122, 176, '#e8a0a8', '#d88a96'); for (let y = 124; y < 176; y += 5) for (let x = (y % 10) ? 0 : 6; x < 256; x += 12) p.rect(x, y, 10, 1, '#c87a88');
  p.rect(0, 120, 256, 2, '#fff6ea'); p.rect(0, 176, 256, 2, '#fff6ea'); p.rect(0, 122, 256, 1, GOLD); p.rect(0, 175, 256, 1, GOLD);
  fountain(p, L, 128, 160);
  flowerBed(p, L, 128, 186);
  for (const x of [64, 192]) topiary(p, x, 120);
  for (const x of [18, 92, 164, 238]) goldLamp(p, L, x, 122);
  balloons(p, 30, 168); cart(p, 226, 172, '#e8443a');
  string(p, L, 0, 92, 12, 8, ['#e8443a', '#f6c445', '#4a9ae8', '#f08aa6'], 8); string(p, L, 164, 256, 12, 8, ['#f6c445', '#b08ae0', '#ff8ad8', '#8bc87a'], 8);
}

export function drawFairyCastle(p: Pen, L: Light) {
  sky(p, L, ['#7ab8f8', '#ffe8f4'], 116, 40);
  band(p, 96, 128, '#7ab868', '#5a9a50');
  for (let i = 0; i < 9; i++) tree(p, 6 + i * 31, 124, 7 + (i % 3), i % 2 ? '#3a8a4a' : '#4a9a5a');
  const { cx, base, k } = CASTLE_SPOT;
  castle(p, L, cx, base, k);
  water(p, L, 130, 142, '#5aa8e0', '#3a88c8');
  p.rect(118, 128, 20, 16, '#c8b8a0'); for (let x = 119; x < 138; x += 3) p.rect(x, 128, 1, 16, '#a89880'); p.rect(116, 128, 2, 16, GOLD_D); p.rect(138, 128, 2, 16, GOLD_D);
  band(p, 140, 192, '#8ac870', '#6aa858');
  for (let y = 140; y < 192; y++) { const w = 14 + (y - 140) * 0.9; p.rect(128 - w, y, w * 2, 1, (y % 6) ? '#f0e4d0' : '#dccfb8'); }
  speckle(p, L, 0, 144, 256, 48, 180, ['#ffffff', '#f6e04a', '#e8507a', '#b08ae0', '#ff8ad8']);
  for (const x of [22, 70, 186, 234]) topiary(p, x, 160);
  ellipse(p, 220, 176, 12, 5, '#8a8a98'); for (let y = 0; y < 12; y++) p.rect(210 + y * 0.4, 164 + y, 20 - y * 0.8, 1, mix('#a8a8b8', '#7a7a88', y / 12));
  p.rect(208, 176, 24, 4, '#6a6a78'); p.rect(212, 166, 4, 2, '#c8c8d4');
  for (const x of [46, 210]) goldLamp(p, L, x, 146);
  string(p, L, 0, 70, 20, 6, ['#ff8ad8', '#fff2a0', '#8ad8ff'], 7); string(p, L, 186, 256, 20, 6, ['#ff8ad8', '#fff2a0', '#8ad8ff'], 7);
}

export function drawFairyParade(p: Pen, L: Light) {
  sky(p, L, ['#80c0f8', '#ffe4f0'], 100, 200);
  band(p, 76, 100, '#7ab868', '#5a9a50');
  castle(p, L, 128, 98, 0.3);
  shop(p, L, 0, 102, 30, 34, '#fbe0ec', '#e8507a', true); shop(p, L, 32, 102, 30, 28, '#dcecff', '#4a8ad8'); shop(p, L, 64, 102, 28, 24, '#fff2cc', '#8bc87a');
  shop(p, L, 164, 102, 28, 24, '#e8dcf8', '#9a6ae0'); shop(p, L, 194, 102, 30, 28, '#fff2cc', '#e8443a'); shop(p, L, 226, 102, 30, 34, '#e4f6e4', '#f6a83a', true);
  tiles(p, 102, 150, '#f0dcc4', '#e4ccb0', 8);
  band(p, 150, 192, '#d8a0bc', '#c88aa8');
  for (let x = 0; x < 256; x += 16) p.rect(x, 171, 8, 1, '#fff2c0');
  p.rect(0, 148, 256, 2, '#fff6ea'); p.rect(0, 150, 256, 1, GOLD);
  for (let x = 4; x < 256; x += 24) { p.rect(x, 140, 2, 9, GOLD_D); p.rect(x - 1, 139, 4, 2, GOLD); }
  for (let x = 4; x < 252; x++) { const t = ((x - 4) % 24) / 24; p.px(x, 142 + Math.round(Math.sin(t * Math.PI) * 3), '#c8304a'); }
  for (const x of [52, 204]) goldLamp(p, L, x, 114);
  string(p, L, 0, 96, 14, 8, ['#e8443a', '#f6c445', '#4a9ae8', '#f08aa6', '#8bc87a'], 8); string(p, L, 160, 256, 14, 8, ['#f6c445', '#b08ae0', '#ff8ad8', '#8ad8ff'], 8);
}

export const RIDES = { carousel: { x: 92, y: 176 }, cups: { x: 194, y: 178 } };
export function drawFairyRides(p: Pen, L: Light) {
  sky(p, L, ['#78c0f8', '#fff0e0'], 100, 228);
  // khung gỗ tàu lượn chạy ngang trời
  const trackH = (x: number) => 70 - Math.abs(Math.sin(x / 34)) * 40 - (x > 150 && x < 200 ? 10 : 0);
  for (let x = 0; x < 256; x += 6) { const h = trackH(x); p.rect(x, h, 1, 100 - h, '#f0e8f4'); if (x % 12 === 0) for (let y = h + 6; y < 100; y += 10) p.rect(x - 6, y, 7, 1, '#e0d4e8'); }
  for (let x = 0; x < 256; x++) { const h = trackH(x); p.rect(x, h - 2, 1, 2, '#e8443a'); p.px(x, h, '#8a2a3a'); }
  // núi Sao Băng (trò tàu trong hầm)
  for (let y = 0; y < 60; y++) { const w = Math.round(Math.sqrt(1 - (y / 60) ** 2) * 40); p.rect(220 - w, 100 - (60 - y), w * 2, 1, mix('#7a5ab8', '#4a3a88', y / 60)); }
  for (let i = 0; i < 9; i++) p.px(200 + ((i * 17) % 40), 52 + ((i * 11) % 36), '#ffe8a0');
  p.rect(214, 86, 12, 14, '#1a1030'); for (let i = 0; i < 5; i++) p.px(216 + i * 2, 88 + (i % 2) * 3, '#8ad0ff');
  for (let i = 0; i < 10; i++) p.px(178 + i * 3, 36 + Math.round(i * 0.8), mix('#fff2a0', '#f08aa6', i / 10)); circle(p, 210, 44, 3, '#fff6c8');
  band(p, 100, 192, '#d8c8b0', '#c8b498');
  tiles(p, 100, 192, '#e0d0b8', '#d0bea4', 10);
  // ga tàu lượn
  p.rect(4, 74, 64, 34, '#f4cfe2'); p.rect(4, 74, 64, 2, '#ffffff'); for (let k = 0; k < 9; k++) p.rect(0 + k * 8, 66, 8, 8, k % 2 ? '#e8443a' : '#ffffff');
  p.rect(14, 84, 44, 10, '#2a2a4a'); p.rect(16, 86, 40, 6, '#5a8ae0'); for (let i = 0; i < 6; i++) p.px(20 + i * 6, 88, '#fff2a0');
  p.rect(10, 96, 52, 12, '#f6eedf'); p.rect(26, 98, 20, 10, '#3a2840');
  L.neon.push({ x: 14, y: 77, w: 44, h: 5, c: '#ff5a8a' });
  // bệ ngựa gỗ & tách trà
  ellipse(p, RIDES.carousel.x, RIDES.carousel.y, 44, 10, '#c8a878'); ellipse(p, RIDES.carousel.x, RIDES.carousel.y - 1, 42, 9, '#e8d0a8');
  ellipse(p, RIDES.cups.x, RIDES.cups.y, 40, 11, '#8ab0d8'); ellipse(p, RIDES.cups.x, RIDES.cups.y - 1, 38, 10, '#b8d4f0');
  for (const x of [148, 244]) lampPost(p, L, x, 124);
  string(p, L, 0, 140, 14, 6, ['#e8443a', '#f6c445', '#4a9ae8'], 10);
}

// ───────── sprite chuyển động ─────────
/** Ngựa gỗ (cột vàng xuyên thân) */
export const horseSprite = (c: number) => makeSprite(`fa-horse:v2:${c}`, 17, 24, p => {
  const body = ['#ffffff', '#f6d0e0', '#d8e8ff', '#fff0c0'][c % 4], mane = ['#e8507a', '#9a6ae0', '#3a7ad0', '#f6a83a'][c % 4];
  p.rect(7, 0, 2, 24, GOLD); p.rect(7, 0, 1, 24, '#fff2b0');
  ellipse(p, 7, 13, 6, 3, body); p.rect(11, 6, 3, 7, body); ellipse(p, 14, 6, 2.6, 2, body); p.px(15, 5, '#2a2a3a');
  for (let y = 4; y < 12; y++) p.px(10, y, mane); p.rect(0, 11, 2, 5, mane);
  p.rect(2, 15, 2, 5, body); p.rect(5, 15, 2, 4, body); p.rect(9, 15, 2, 5, body); p.rect(12, 15, 2, 4, body);
  p.rect(4, 10, 6, 2, '#e8443a'); p.rect(4, 10, 6, 1, GOLD);
}, '#5a3a4a');
export const carouselTopSprite = () => makeSprite('fa-carousel-top', 96, 30, p => {
  for (let y = 0; y < 18; y++) { const w = Math.round(6 + y * 2.4); for (let x = 48 - w; x < 48 + w; x++) p.px(x, y + 2, Math.floor((x - 48 + 60) / 8) % 2 ? '#f08aa6' : '#fff6fa'); }
  p.rect(46, 0, 4, 3, GOLD); p.px(47, 0, '#fff2b0');
  p.rect(2, 20, 92, 4, GOLD); for (let x = 4; x < 92; x += 6) { p.rect(x, 24, 4, 4, x % 12 ? '#e8507a' : '#4a9ae8'); p.px(x + 1, 25, '#ffffff'); }
  for (let x = 6; x < 92; x += 8) p.px(x, 21, '#fff8d0');
}, '#6a3a4a');
export const carouselPoleSprite = () => makeSprite('fa-carousel-pole', 8, 60, p => { p.rect(2, 0, 4, 60, '#e8d0a8'); for (let y = 0; y < 60; y += 4) p.rect(2, y, 4, 2, '#e8507a'); p.rect(0, 52, 8, 8, GOLD); }, '#5a3a2a');
/** Tách trà xoay */
export const cupSprite = (c: number) => makeSprite(`fa-cup:${c}`, 34, 20, p => {
  const col = ['#f08aa6', '#5aa8e0', '#f6c445', '#8bc87a'][c % 4];
  ellipse(p, 17, 4, 16, 4, dk(col, 0.35));
  for (let y = 4; y < 17; y++) { const w = Math.round(16 - (y - 4) * 0.55); p.rect(17 - w, y, w * 2, 1, y % 4 === 0 ? '#ffffff' : col); }
  p.rect(10, 17, 14, 3, dk(col, 0.4)); ellipse(p, 17, 4, 16, 2, lt(col, 0.4));
  for (let x = 5; x < 30; x += 6) p.rect(x, 8, 3, 3, '#ffffff');
  p.rect(32, 7, 2, 7, col);
}, '#3a2a3a');
export const cupBackSprite = (c: number) => makeSprite(`fa-cupb:${c}`, 34, 8, p => { const col = ['#f08aa6', '#5aa8e0', '#f6c445', '#8bc87a'][c % 4]; ellipse(p, 17, 4, 16, 4, dk(col, 0.35)); ellipse(p, 17, 3, 15, 2, dk(col, 0.6)); }, null);
export const teapotSprite = () => makeSprite('fa-teapot', 30, 30, p => {
  ellipse(p, 15, 18, 12, 10, '#f6eedf'); ellipse(p, 15, 8, 6, 2, '#f08aa6'); p.rect(14, 3, 3, 4, '#f6c445');
  for (let x = 5; x < 26; x += 5) circle(p, x, 18, 1, '#5aa8e0');
  p.rect(1, 12, 4, 3, '#f6eedf'); p.rect(0, 9, 2, 4, '#f6eedf'); p.rect(26, 14, 4, 8, '#f6eedf');
}, '#4a3a4a');
/** Gươm thần */
export const swordSprite = () => makeSprite('fa-sword:v2', 5, 15, p => {
  p.px(2, 0, '#e8f0ff'); p.rect(1, 1, 3, 9, '#d8e0f0'); p.rect(2, 1, 1, 9, '#ffffff'); p.rect(3, 2, 1, 8, '#a8b0c8');
  p.rect(0, 10, 5, 1, GOLD); p.rect(2, 11, 1, 3, '#7a3a8a'); p.px(2, 14, GOLD); p.px(2, 10, '#e8507a');
}, '#2a2a3a');

/** Xe hoa diễu hành (ban đêm bóng đèn sáng) */
export const FLOATS = ['dragon', 'pumpkin', 'teaparty', 'castle', 'star', 'unicorn'] as const;
export type FloatId = (typeof FLOATS)[number];
export const floatSprite = (id: FloatId, lit: boolean) => makeSprite(`fa-float:${id}:${lit ? 1 : 0}`, 76, 54, p => {
  const bulb = (x: number, y: number, c: string) => { p.px(x, y, lit ? c : mix(c, '#888888', 0.5)); if (lit) { p.px(x - 1, y, c + '80'); p.px(x + 1, y, c + '80'); } };
  // gầm xe + bánh
  p.rect(4, 44, 68, 6, '#3a2a4a'); for (const x of [12, 60]) { circle(p, x, 50, 3, '#2a2a3a'); p.px(x, 50, GOLD); }
  if (id === 'dragon') {
    for (let x = 4; x < 72; x++) { const y = 34 + Math.round(Math.sin(x / 7) * 4); p.rect(x, y, 1, 10 - (x < 10 ? 10 - x : 0) * 0.5, '#4ac87a'); p.px(x, y, '#8af0a8'); if (x % 5 === 0) p.rect(x, y - 3, 2, 3, '#f6c445'); }
    ellipse(p, 66, 26, 7, 6, '#4ac87a'); p.rect(70, 26, 6, 4, '#4ac87a'); p.px(68, 24, '#ffffff'); p.px(69, 24, '#2a2a3a'); p.rect(62, 18, 2, 5, '#f6c445'); p.rect(68, 17, 2, 5, '#f6c445');
    for (let i = 0; i < 6; i++) { p.px(75, 28 + i, i % 2 ? '#ff9a3a' : '#ffd84a'); }
    for (let x = 6; x < 70; x += 4) bulb(x, 44, ['#ffd84a', '#5ad8ff', '#ff5a7a'][x % 3]);
  } else if (id === 'pumpkin') {
    for (let y = 0; y < 30; y++) { const w = Math.round(Math.sqrt(1 - ((y - 15) / 15) ** 2) * 22); p.rect(44 - w, 12 + y, w * 2, 1, y % 6 < 3 ? '#f6a83a' : '#f08a2a'); }
    for (let x = 26; x < 64; x += 7) p.rect(x, 14, 1, 26, '#d8702a');
    p.rect(42, 6, 4, 7, '#5a8a3a'); p.rect(46, 8, 5, 2, '#6aa84a'); p.rect(36, 22, 14, 10, '#fff4c0'); p.rect(42, 22, 1, 10, GOLD_D);
    for (let k = 0; k < 4; k++) p.rect(4 + k * 3, 30 - k, 3, 8 + k, '#ffffff'); ellipse(p, 8, 27, 4, 3, '#ffffff'); p.rect(2, 36, 2, 8, '#ffffff'); p.rect(12, 36, 2, 8, '#ffffff'); p.px(5, 26, '#2a2a3a'); p.rect(9, 24, 4, 2, '#f08aa6');
    for (let x = 22; x < 68; x += 4) bulb(x, 11 + Math.round(Math.abs(x - 44) * 0.2), '#fff2a0');
  } else if (id === 'teaparty') {
    p.rect(6, 36, 64, 8, '#f6eedf'); for (let x = 6; x < 70; x += 8) p.rect(x, 36, 4, 8, '#f08aa6');
    ellipse(p, 38, 22, 14, 12, '#f6eedf'); ellipse(p, 38, 11, 7, 2, '#5aa8e0'); p.rect(36, 6, 4, 5, '#f6c445');
    p.rect(20, 18, 6, 4, '#f6eedf'); p.rect(18, 14, 3, 5, '#f6eedf'); p.rect(52, 18, 6, 10, '#f6eedf');
    for (let x = 28; x < 50; x += 5) circle(p, x, 24, 1, '#e8507a');
    ellipse(p, 12, 32, 6, 3, '#f6c445'); ellipse(p, 64, 32, 6, 3, '#8bc87a');
    for (let x = 8; x < 70; x += 5) bulb(x, 35, ['#ff8ac8', '#fff2a0'][x % 2]);
  } else if (id === 'star') {
    p.rect(6, 36, 64, 8, '#7a5ac8'); for (let x = 6; x < 70; x += 6) p.rect(x, 36, 3, 8, '#9a7ae8');
    const pts: [number, number][] = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 8 : 19; pts.push([38 + Math.cos(a) * r, 19 + Math.sin(a) * r]); }
    for (let y = 0; y < 40; y++) for (let x = 18; x < 60; x++) { let inside = false; for (let a2 = 0, b2 = 9; a2 < 10; b2 = a2++) { const [xi, yi] = pts[a2], [xj, yj] = pts[b2]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside; } if (inside) p.px(x, y, y < 18 ? '#ffe86a' : '#f6c445'); }
    for (const [x, y] of pts) bulb(Math.round(x), Math.round(y), '#fff6c8');
    p.px(33, 17, '#2a1a2a'); p.px(43, 17, '#2a1a2a'); p.rect(36, 22, 5, 1, '#c84a5a'); p.px(30, 20, '#ff9ab0'); p.px(46, 20, '#ff9ab0');
    for (let x = 8; x < 70; x += 4) bulb(x, 35, ['#ff8ad8', '#8ad8ff', '#fff2a0'][x % 3]);
  } else if (id === 'unicorn') {
    p.rect(6, 36, 64, 8, '#f6d0e8'); for (let x = 6; x < 70; x += 8) p.rect(x, 40, 4, 4, '#ffffff');
    ellipse(p, 32, 26, 16, 8, '#ffffff'); p.rect(44, 10, 8, 16, '#ffffff'); ellipse(p, 52, 10, 7, 5, '#ffffff'); p.px(54, 9, '#2a1a2a'); p.rect(56, 12, 2, 1, '#f08aa6');
    for (let k = 0; k < 7; k++) p.px(54 + k, 4 - k, '#f6c445'); p.px(55, 3, '#fff2b0');
    const RB = ['#e8443a', '#f6a83a', '#f6e04a', '#6ac86a', '#4a9ae8', '#9a6ae0'];
    RB.forEach((c, k) => { p.rect(42 - k, 6 + k * 3, 3, 4, c); p.rect(14 - k, 22 + k * 2, 4, 2, c); });
    for (const x of [22, 30, 38, 44]) p.rect(x, 32, 3, 5, '#ffffff');
    for (let x = 8; x < 70; x += 4) bulb(x, 35, RB[(x / 4) % 6]);
  } else {
    p.rect(8, 28, 60, 16, '#f4cfe2'); for (let x = 8; x < 68; x += 6) p.rect(x, 25, 3, 3, '#f4cfe2');
    for (const [x, h] of [[14, 22], [38, 34], [62, 22]] as [number, number][]) {
      p.rect(x - 5, 44 - h, 10, h - 16, '#f6eedf'); for (let i = 0; i < 12; i++) { const w = Math.round(6 * (1 - i / 12)); p.rect(x - w, 28 - h + 16 - i, w * 2, 1, '#4a8ad8'); }
      p.rect(x, 28 - h + 2, 1, 4, GOLD); p.rect(x - 1, 36 - h + 18, 2, 4, '#4a5a98');
    }
    for (let x = 10; x < 68; x += 4) bulb(x, 28, ['#ff5a8a', '#5ad8ff', '#ffd84a', '#9a7aff'][x % 4]);
  }
}, '#3a2a3a');

// ───────── quà lưu niệm trang trí nhà ─────────
export const castleModelSprite = () => makeSprite('tv:castle', 26, 30, p => { castle(p, null, 13, 27, 0.17); p.rect(1, 27, 24, 3, '#7a4e2c'); p.rect(1, 27, 24, 1, '#a8703f'); }, '#4a2a3a');
export const musicBoxSprite = () => makeSprite('tv:musicbox', 18, 22, p => {
  p.rect(1, 16, 16, 6, '#e8507a'); p.rect(1, 16, 16, 1, GOLD); p.rect(3, 18, 12, 2, '#ffd0e0');
  p.rect(8, 4, 2, 12, GOLD); for (let y = 0; y < 5; y++) { const w = 2 + y * 1.6; p.rect(9 - w, y, w * 2, 1, y % 2 ? '#f08aa6' : '#ffffff'); }
  ellipse(p, 9, 12, 4, 2, '#ffffff'); p.rect(11, 9, 2, 3, '#ffffff'); p.px(12, 9, '#2a2a3a'); p.rect(6, 13, 1, 3, '#ffffff'); p.rect(11, 13, 1, 3, '#ffffff');
}, '#4a2a3a');
export const balloonDecoSprite = () => makeSprite('tv:balloons2', 20, 28, p => {
  const cs = ['#e8443a', '#f6c445', '#4a9ae8', '#f08aa6', '#8bc87a'];
  const P = [[6, 9], [14, 8], [10, 3], [3, 15], [17, 15]];
  P.forEach(([x, y]) => p.rect(x, y + 3, 1, 24 - y, '#d8d8e0'));
  P.forEach(([x, y], i) => { ellipse(p, x, y, 3, 3.6, cs[i]); p.px(x - 1, y - 2, '#ffffff'); p.px(x, y + 4, cs[i]); });
  p.rect(7, 25, 7, 3, '#7a4e2c');
}, '#4a2a3a');
/** Ảnh lâu đài phủ một màu (lớp chiếu sáng show đêm) — vị trí khớp map lâu đài */
export function castleMaskAt(c: string): { sprite: Sprite; x: number; y: number } {
  const { cx, base, k } = CASTLE_SPOT, sp = castleSprite(k, c);
  return { sprite: sp, x: cx, y: base + 1 };
}

// ───────── Nhân vật hoá trang của công viên (tự thiết kế): Gấu Mật Ong, Thỏ Ngọc, Cáo Hoàng Tử, Rồng Bông, Mèo Phù Thuỷ, Cánh Cụt Thuỷ Thủ, Cú Giáo Sư, Gấu Trúc Bông ─────────
export const MASCOTS = [
  { id: 'bear', name: 'Gấu Mật Ong', hi: 'Chào bạn nhỏ! Ăn mật ong không? 🍯' },
  { id: 'bunny', name: 'Thỏ Ngọc', hi: 'Nhảy nhảy~ chụp ảnh với Thỏ nha! 🌸' },
  { id: 'fox', name: 'Cáo Hoàng Tử', hi: 'Ta là hoàng tử của vương quốc này! 👑' },
  { id: 'dragon', name: 'Rồng Bông', hi: 'Phù~ Rồng Bông phun lửa trái tim nè 💖' },
  { id: 'cat', name: 'Mèo Phù Thuỷ', hi: 'Meo~ biến hai bạn thành công chúa hoàng tử nè ✨' },
  { id: 'penguin', name: 'Cánh Cụt Thuỷ Thủ', hi: 'Ahoy! Lên tàu lượn chưa? ⚓' },
  { id: 'owl', name: 'Cú Giáo Sư', hi: 'Hú hú~ hai bạn là cặp đôi dễ thương nhất hôm nay! 🎓' },
  { id: 'panda', name: 'Gấu Trúc Bông', hi: 'Ôm một cái thật chặt nào! 🎋' },
] as const;
type ToonId = (typeof MASCOTS)[number]['id'];
/** f: 0 đứng · 1 bước · 2 vẫy tay · 3 dang tay ôm */
export const mascotSprite = (i: number, f: 0 | 1 | 2 | 3) => makeSprite(`fa-mascot2:${i}:${f}`, 30, 40, p => {
  const id: ToonId = MASCOTS[i % MASCOTS.length].id, cx = 15, K = '#1a1a22', W = '#ffffff';
  const fur = { bear: '#b07840', bunny: '#ffffff', fox: '#f08a3a', dragon: '#a88ae8', cat: '#8a9ac8', penguin: '#2a2a3a', owl: '#9a6a3a', panda: '#ffffff' }[id];
  const muz = { bear: '#f6d8a8', bunny: '#ffe8f0', fox: '#ffffff', dragon: '#f6e8b0', cat: '#e8ecf8', penguin: '#ffffff', owl: '#f0d8a8', panda: '#ffffff' }[id];
  const cloth = { bear: '#4a8ad8', bunny: '#f08aa6', fox: '#7a4ac8', dragon: '#5ac88a', cat: '#5a3a9a', penguin: '#e8303a', owl: '#3a5a8a', panda: '#f08ac0' }[id];
  const limb = id === 'panda' ? K : id === 'penguin' ? K : fur, step = f === 1 ? 1 : 0;
  // tai / sừng (sau đầu)
  if (id === 'bear') { circle(p, cx - 7, 5, 3, fur); circle(p, cx + 7, 5, 3, fur); p.px(cx - 7, 5, '#e8a0a0'); p.px(cx + 7, 5, '#e8a0a0'); }
  if (id === 'panda') { circle(p, cx - 7, 5, 3, K); circle(p, cx + 7, 5, 3, K); }
  if (id === 'bunny') for (const s of [-1, 1]) { p.rect(cx + s * 4 - 1, 0, 4, 9, fur); p.rect(cx + s * 4, 1, 2, 7, '#f6b8cc'); }
  if (id === 'fox' || id === 'cat') for (const s of [-1, 1]) for (let y = 0; y < 6; y++) { const w = Math.max(1, 6 - y); p.rect(cx + s * 6 - w / 2, 8 - y, w, 1, y > 3 && id === 'fox' ? '#2a1a1a' : fur); }
  if (id === 'dragon') for (const s of [-1, 1]) { p.rect(cx + s * 5, 1, 2, 4, '#f6e8b0'); p.px(cx + s * 5 + (s > 0 ? 1 : 0), 0, '#f6e8b0'); }
  if (id === 'owl') for (const s of [-1, 1]) { p.rect(cx + s * 6 - 1, 3, 3, 3, fur); }
  // đầu
  ellipse(p, cx, 12, id === 'penguin' ? 7.5 : 8.5, 7.5, fur);
  if (id === 'penguin') ellipse(p, cx, 13, 5.5, 5, W); else if (id !== 'owl') ellipse(p, cx, 15, 5.5, 3.6, muz);
  if (id === 'panda') { ellipse(p, cx - 3.5, 11, 2.4, 2.8, K); ellipse(p, cx + 3.5, 11, 2.4, 2.8, K); }
  if (id === 'owl') { circle(p, cx - 3.5, 11, 3, W); circle(p, cx + 3.5, 11, 3, W); circle(p, cx - 3.5, 11, 1, K); circle(p, cx + 3.5, 11, 1, K); p.rect(cx - 7, 8, 14, 1, '#c8a060'); p.rect(cx - 1, 14, 2, 3, '#f6a030'); }
  else { p.rect(cx - 4, 9, 2, 3, id === 'panda' ? W : K); p.rect(cx + 2, 9, 2, 3, id === 'panda' ? W : K); if (id === 'panda') { p.px(cx - 3, 10, K); p.px(cx + 3, 10, K); } else { p.px(cx - 4, 9, W); p.px(cx + 2, 9, W); } }
  if (id === 'penguin') { p.rect(cx - 2, 14, 5, 2, '#f6a030'); }
  else if (id !== 'owl') { p.rect(cx - 1, 13, 3, 2, id === 'bunny' || id === 'cat' ? '#f08aa6' : '#3a2020'); p.rect(cx - 2, 16, 5, 1, '#c84a5a'); p.px(cx - 3, 15, '#c84a5a'); p.px(cx + 3, 15, '#c84a5a'); }
  p.rect(cx - 8, 14, 2, 1, '#ff9ab0'); p.rect(cx + 7, 14, 2, 1, '#ff9ab0');
  if (id === 'cat') for (const s of [-1, 1]) { p.rect(cx + s * 6 - (s < 0 ? 3 : 0), 14, 4, 1, '#5a5a7a'); }
  // mũ / phụ kiện đầu
  if (id === 'fox') { p.rect(cx - 4, 2, 9, 3, GOLD); p.px(cx - 4, 1, GOLD); p.px(cx, 1, '#e8507a'); p.px(cx + 4, 1, GOLD); }
  if (id === 'bunny') for (let k = 0; k < 5; k++) p.px(cx - 6 + k * 3, 4, ['#ff8ad8', '#fff2a0', '#8ad8ff'][k % 3]);
  if (id === 'cat') { for (let y = 0; y < 8; y++) { const w = 1 + y; p.rect(cx - w + 1, y - 2, w * 2, 1, '#5a3a9a'); } p.rect(cx - 8, 5, 16, 1, '#3a2a7a'); p.px(cx - 1, 1, GOLD); p.px(cx + 2, 3, GOLD); }
  if (id === 'penguin') { p.rect(cx - 5, 3, 10, 3, W); p.rect(cx - 5, 5, 10, 1, '#3a5ad8'); circle(p, cx, 2, 1, '#e8303a'); }
  if (id === 'owl') { p.rect(cx - 7, 2, 14, 2, K); p.rect(cx - 3, 4, 6, 2, K); p.rect(cx + 5, 3, 1, 5, GOLD); }
  // thân + đồ
  p.rect(cx - 6, 20, 12, 10, id === 'penguin' ? K : cloth); ellipse(p, cx, 25, 3.5, 3.5, id === 'penguin' ? W : muz);
  if (id === 'penguin') { p.rect(cx - 4, 20, 8, 2, '#3a5ad8'); p.px(cx, 21, '#e8303a'); }
  if (id === 'bear') { p.rect(cx - 3, 19, 6, 2, GOLD); p.px(cx, 20, '#e8443a'); }
  if (id === 'bunny') for (let y = 26; y < 31; y++) p.rect(cx - 6 - (y - 26), y, 12 + (y - 26) * 2, 1, y % 2 ? cloth : lt(cloth, 0.3));
  if (id === 'fox') { p.rect(cx - 8, 20, 2, 11, '#c83a5a'); p.rect(cx + 6, 20, 2, 11, '#c83a5a'); p.rect(cx + 7, 26, 5, 3, fur); p.px(cx + 11, 26, W); }
  if (id === 'dragon') { for (const s of [-1, 1]) for (let y = 0; y < 5; y++) p.rect(cx + s * (7 + y) - (s < 0 ? 1 : 0), 20 + y, 1, 4 - Math.floor(y / 2), '#7ae0a8'); p.rect(cx + 6, 27, 6, 2, fur); }
  if (id === 'cat') { for (let y = 26; y < 33; y++) p.rect(cx - 6 - (y - 26) * 0.5, y, 12 + (y - 26), 1, '#5a3a9a'); p.px(cx - 3, 28, GOLD); p.px(cx + 2, 30, GOLD); p.rect(cx + 7, 24, 5, 2, fur); }
  if (id === 'owl') { p.rect(cx - 6, 20, 12, 10, fur); ellipse(p, cx, 25, 4, 4, '#f0d8a8'); p.rect(cx - 2, 20, 4, 2, '#e8303a'); }
  if (id === 'panda') { p.rect(cx - 6, 19, 12, 2, cloth); p.rect(cx + 3, 21, 2, 5, cloth); }
  // tay
  const hand = (x: number, y: number) => circle(p, x, y, 2, id === 'panda' || id === 'penguin' ? K : muz);
  if (f === 3) { for (const s of [-1, 1]) { p.rect(cx + s * 6 - (s < 0 ? 5 : 0), 21, 5, 2, limb); hand(cx + s * 12, 21); } }
  else {
    p.rect(cx - 8, 21, 2, 6, limb); hand(cx - 8, 28);
    if (f === 2) { p.rect(cx + 6, 14, 2, 7, limb); hand(cx + 7, 13); } else { p.rect(cx + 6, 21, 2, 6, limb); hand(cx + 7, 28); }
  }
  if (id === 'cat' && f !== 3) { p.rect(cx - 10, 18, 1, 11, '#7a4e2c'); p.px(cx - 10, 17, GOLD); p.px(cx - 11, 17, '#fff2a0'); p.px(cx - 9, 17, '#fff2a0'); }
  if (id === 'panda' && f !== 3) { p.rect(cx - 11, 18, 2, 14, '#6ab84a'); for (let y = 20; y < 32; y += 4) p.px(cx - 11, y, '#3a8a2a'); }
  // chân
  p.rect(cx - 5 + step, 30, 4, 5, limb); p.rect(cx + 1 - step, 30, 4, 5, limb);
  const shoe = id === 'penguin' || id === 'owl' ? '#f6a030' : id === 'panda' ? K : '#3a2a3a';
  p.rect(cx - 6 + step, 35, 5, 3, shoe); p.rect(cx + 1 - step, 35, 5, 3, shoe);
}, '#2a1a24');

/** Trống diễu hành (dùi gõ lên xuống) */
export const drumSprite = (f: 0 | 1) => makeSprite(`fa-drum2:${f}`, 9, 8, p => {
  p.rect(1, 3, 7, 5, '#e8303a'); p.rect(1, 3, 7, 1, '#ffffff'); p.rect(1, 7, 7, 1, '#ffffff'); p.px(3, 5, GOLD); p.px(5, 5, GOLD);
  p.rect(f ? 2 : 1, f ? 1 : 0, 1, 3, '#f6eedf'); p.rect(f ? 6 : 7, f ? 0 : 1, 1, 3, '#f6eedf');
}, '#3a1a24');
/** Cờ hoa phất qua lại */
export const flagSprite = (k: number, f: 0 | 1) => makeSprite(`fa-flag2:${k % 3}:${f}`, 8, 15, p => {
  const c = ['#ff4a7a', '#4ad8ff', '#ffd84a'][k % 3];
  p.rect(0, 1, 1, 14, GOLD_D); p.px(0, 0, GOLD);
  for (let y = 0; y < 6; y++) { const w = 6 - Math.round(Math.abs(y - 3) * 0.5) - (f ? (y % 2) : ((y + 1) % 2)); p.rect(1, 1 + y, w, 1, y % 3 ? c : '#ffffff'); }
}, '#3a1a24');
