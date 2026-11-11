// Disneyland: công viên giải trí ở điểm du lịch — lâu đài, đại lộ diễu hành, khu trò chơi (tàu lượn, ngựa gỗ, tách trà).
// Toàn bộ vẽ pixel tay; lâu đài dùng chung cho phố chính, map lâu đài, chuyến tàu lượn và quà lưu niệm.
import { ellipse } from './iso';
import { makeSprite, mix, type Pen, type Sprite } from './pixel';
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
export const CASTLE_SPOT = { cx: 128, base: 128, k: 0.55 };

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
  P.forEach(([dx, dy], i) => { circle(p, x + dx, y + dy, 2, cs[i]); circle(p, x + dx - 2, y + dy - 2, 1, cs[i]); circle(p, x + dx + 2, y + dy - 2, 1, cs[i]); p.px(x + dx - 1, y + dy - 1, '#ffffff'); });
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
  castle(p, L, 128, 110, 0.44);
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
  water(p, L, 128, 140, '#5aa8e0', '#3a88c8');
  p.rect(116, 126, 24, 16, '#c8b8a0'); for (let x = 117; x < 140; x += 3) p.rect(x, 126, 1, 16, '#a89880'); p.rect(114, 126, 2, 16, GOLD_D); p.rect(140, 126, 2, 16, GOLD_D);
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
  castle(p, L, 128, 98, 0.34);
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
export const FLOATS = ['dragon', 'pumpkin', 'teaparty', 'castle'] as const;
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
export const balloonDecoSprite = () => makeSprite('tv:mickeyballoons', 20, 28, p => {
  const cs = ['#e8443a', '#f6c445', '#4a9ae8', '#f08aa6', '#8bc87a'];
  const P = [[6, 9], [14, 8], [10, 3], [3, 15], [17, 15]];
  P.forEach(([x, y]) => p.rect(x, y + 3, 1, 24 - y, '#d8d8e0'));
  P.forEach(([x, y], i) => { const c = cs[i]; circle(p, x, y, 3, c); circle(p, x - 3, y - 3, 1, c); circle(p, x + 3, y - 3, 1, c); p.px(x - 1, y - 1, '#ffffff'); });
  p.rect(7, 25, 7, 3, '#7a4e2c');
}, '#4a2a3a');
/** Ảnh lâu đài phủ một màu (lớp chiếu sáng show đêm) — vị trí khớp map lâu đài */
export function castleMaskAt(c: string): { sprite: Sprite; x: number; y: number } {
  const { cx, base, k } = CASTLE_SPOT, sp = castleSprite(k, c);
  return { sprite: sp, x: cx, y: base + 1 };
}

// ───────── Nhân vật Disney: Mickey, Minnie, Donald, Goofy, Daisy, Pluto, Chip, Dale, Mickey phù thuỷ, Huey, Dewey, Louie, Scrooge ─────────
export const MASCOTS = [
  { id: 'mickey', name: 'Mickey', hi: 'Hot dog! Chào mừng tới Disneyland! 🎉' },
  { id: 'minnie', name: 'Minnie', hi: 'Ôi dễ thương quá, chụp chung với Minnie nha! 🎀' },
  { id: 'donald', name: 'Donald', hi: 'Quạc quạc! Hai bạn đi chơi vui không? 🦆' },
  { id: 'goofy', name: 'Goofy', hi: 'A-hyuck! Đi tàu lượn với Goofy không? 😆' },
  { id: 'daisy', name: 'Daisy', hi: 'Hai bạn đẹp đôi ghê! 💗' },
  { id: 'pluto', name: 'Pluto', hi: 'Gâu gâu! 🐾' },
  { id: 'chip', name: 'Chip', hi: 'Có hạt dẻ không? 🌰' },
  { id: 'dale', name: 'Dale', hi: 'Hihi, Dale nè! 🌰' },
  { id: 'sorcerer', name: 'Mickey phù thuỷ', hi: 'Abracadabra! ✨' },
  { id: 'huey', name: 'Huey', hi: 'Bọn cháu đi diễu hành nè! ❤️' },
  { id: 'dewey', name: 'Dewey', hi: 'Chụp ảnh không? 💙' },
  { id: 'louie', name: 'Louie', hi: 'Vẫy tay nào! 💚' },
  { id: 'scrooge', name: 'Scrooge', hi: 'Vé vào cổng đắt lắm đó nha! 🎩' },
] as const;
type ToonId = (typeof MASCOTS)[number]['id'];
/** f: 0 đứng · 1 bước · 2 vẫy tay · 3 dang tay ôm */
export const mascotSprite = (i: number, f: 0 | 1 | 2 | 3) => makeSprite(`fa-toon:${i}:${f}`, 30, 40, p => {
  const id: ToonId = MASCOTS[i % MASCOTS.length].id, cx = 15;
  const K = '#1a1a22', SKIN = '#f8d4b4', W = '#ffffff', RED = '#e8303a', YEL = '#f6c445', OR = '#f6a030';
  const step = f === 1 ? 1 : 0;
  const glove = (x: number, y: number) => { circle(p, x, y, 2, W); p.px(x, y - 1, '#e0e0e8'); };
  const arms = (c: string, y0: number, gloves = true) => {
    const hand = (x: number, y: number) => (gloves ? glove(x, y) : circle(p, x, y, 1, c));
    if (f === 3) { for (const s of [-1, 1]) { p.rect(cx + s * 6 - (s < 0 ? 5 : 0), y0 + 1, 5, 2, c); hand(cx + s * 12, y0 + 1); } return; }
    p.rect(cx - 8, y0 + 1, 2, 6, c); hand(cx - 8, y0 + 8);
    if (f === 2) { p.rect(cx + 6, y0 - 6, 2, 7, c); hand(cx + 7, y0 - 7); } else { p.rect(cx + 6, y0 + 1, 2, 6, c); hand(cx + 7, y0 + 8); }
  };
  const feet = (c: string, y: number, rx = 3.4) => { ellipse(p, cx - 4 + step, y, rx, 1.8, c); ellipse(p, cx + 4 - step, y, rx, 1.8, c); };
  const legs = (c: string, y: number, h: number, w = 2) => { p.rect(cx - 4 + step, y, w, h, c); p.rect(cx + 2 - step, y, w, h, c); };
  // ── chuột: Mickey, Minnie, Mickey phù thuỷ
  if (id === 'mickey' || id === 'minnie' || id === 'sorcerer') {
    circle(p, cx - 8, 5, 4, K); circle(p, cx + 8, 5, 4, K);
    ellipse(p, cx, 13, 7.5, 7, K);
    ellipse(p, cx, 16, 6, 4, SKIN); ellipse(p, cx - 2.4, 11, 2.4, 3.4, SKIN); ellipse(p, cx + 2.4, 11, 2.4, 3.4, SKIN);
    p.rect(cx - 3, 9, 2, 4, K); p.rect(cx + 1, 9, 2, 4, K); p.px(cx - 3, 9, W); p.px(cx + 1, 9, W);
    ellipse(p, cx, 14.5, 1.8, 1.2, K);
    p.rect(cx - 3, 17, 7, 1, '#5a1a1a'); p.rect(cx - 2, 18, 5, 1, '#5a1a1a'); p.rect(cx - 1, 18, 3, 1, '#f07a8a');
    if (id === 'minnie') {
      p.rect(cx - 6, 2, 12, 5, RED); p.rect(cx - 1, 3, 3, 3, '#c02028'); for (const [x, y] of [[-5, 3], [-3, 5], [3, 3], [5, 5]]) p.px(cx + x, y, W);
      p.px(cx - 4, 8, K); p.px(cx + 4, 8, K);
      for (let y = 21; y < 31; y++) { const w = 5 + Math.floor((y - 21) * 0.7); p.rect(cx - w, y, w * 2, 1, RED); }
      for (const [x, y] of [[-3, 23], [2, 22], [-5, 27], [0, 26], [4, 28], [-1, 29]]) p.px(cx + x, y, W);
      p.rect(cx - 5, 20, 10, 2, K); arms(K, 20); legs(K, 31, 5); feet(YEL, 37, 3);
    } else if (id === 'sorcerer') {
      for (let y = 0; y < 8; y++) { const w = 1 + y * 0.9; p.rect(cx - w, y - 1, w * 2, 1, '#3a4ac8'); }
      p.px(cx - 1, 2, YEL); p.px(cx + 2, 4, YEL); p.px(cx - 3, 5, YEL); p.rect(cx - 7, 6, 14, 1, '#2a3aa8');
      for (let y = 20; y < 36; y++) { const w = 6 + Math.floor((y - 20) * 0.3); p.rect(cx - w, y, w * 2, 1, y % 5 ? RED : '#c82028'); }
      p.rect(cx - 1, 20, 2, 16, '#a81820'); arms(RED, 20); feet(YEL, 37);
    } else {
      p.rect(cx - 4, 20, 8, 4, K); arms(K, 20);
      p.rect(cx - 6, 24, 12, 6, RED); p.rect(cx - 6, 24, 12, 1, '#ff6a6a'); p.rect(cx - 3, 25, 2, 2, W); p.rect(cx + 1, 25, 2, 2, W);
      legs(K, 30, 5); feet(YEL, 37);
    }
    return;
  }
  // ── vịt: Donald, Daisy, Huey/Dewey/Louie, Scrooge
  if (id === 'donald' || id === 'daisy' || id === 'huey' || id === 'dewey' || id === 'louie' || id === 'scrooge') {
    const kid = id === 'huey' || id === 'dewey' || id === 'louie', oy = kid ? 4 : 0;
    const kc = id === 'huey' ? '#e8303a' : id === 'dewey' ? '#3a7ae8' : '#3aa84a';
    ellipse(p, cx, 12 + oy, kid ? 6.5 : 7.5, kid ? 6 : 7, W);
    ellipse(p, cx - 2.5, 10 + oy, 2, 2.6, W); ellipse(p, cx + 2.5, 10 + oy, 2, 2.6, W); p.rect(cx - 2, 10 + oy, 1, 2, K); p.rect(cx + 2, 10 + oy, 1, 2, K);
    ellipse(p, cx + 1, 15.5 + oy, kid ? 5 : 6, 2, OR); ellipse(p, cx + 1, 17 + oy, 4, 1.3, '#e88a20'); p.rect(cx - 3, 15 + oy, 8, 1, '#c87018');
    if (id === 'donald') { const B = '#2a5ad0'; p.rect(cx - 6, 3, 12, 3, B); p.rect(cx - 7, 5, 14, 2, '#1a1a3a'); p.rect(cx + 5, 6, 4, 2, '#1a1a3a'); p.rect(cx - 2, 1, 5, 2, B);
      p.rect(cx - 6, 20, 12, 7, B); p.rect(cx - 6, 20, 12, 1, '#5a8af0'); p.rect(cx - 2, 20, 4, 2, RED); p.px(cx, 22, RED); }
    if (id === 'daisy') { p.rect(cx - 5, 2, 10, 4, '#f08ac0'); p.rect(cx - 1, 3, 2, 2, '#d0609a'); p.px(cx - 4, 8, K); p.px(cx + 4, 8, K); p.px(cx - 5, 9, K); p.px(cx + 5, 9, K);
      p.rect(cx - 6, 20, 12, 8, '#9a5ad8'); p.rect(cx - 6, 20, 12, 1, '#c08af0'); for (let k = 0; k < 4; k++) p.px(cx - 4 + k * 3, 24, '#f08ac0'); }
    if (kid) { p.rect(cx - 6, 4 + oy, 12, 3, kc); p.rect(cx + 2, 6 + oy, 7, 2, kc); p.rect(cx - 5, 21 + oy, 10, 6, kc); p.rect(cx - 5, 21 + oy, 10, 1, lt(kc, 0.4)); }
    if (id === 'scrooge') {
      p.rect(cx - 4, -1 + 1, 8, 6, K); p.rect(cx - 6, 5, 12, 1, K); p.rect(cx - 4, 4, 8, 1, '#c02028');
      p.rect(cx - 5, 9, 4, 3, '#a8c8e8'); p.rect(cx + 1, 9, 4, 3, '#a8c8e8'); p.rect(cx - 1, 10, 2, 1, K);
      p.rect(cx - 8, 12, 2, 4, W); p.rect(cx + 6, 12, 2, 4, W);
      p.rect(cx - 6, 20, 12, 9, '#c82838'); p.rect(cx - 7, 27, 3, 5, '#c82838'); p.rect(cx + 4, 27, 3, 5, '#c82838'); for (let y = 21; y < 28; y += 2) p.px(cx, y, YEL);
      p.rect(cx + 9, 22, 1, 14, '#6a3a1a'); p.rect(cx + 8, 21, 3, 1, YEL);
    }
    if (!kid && id !== 'scrooge' && id !== 'donald' && id !== 'daisy') { /* (không có) */ }
    for (let y = 27 + (kid ? 0 : 0); y < 32; y++) p.rect(cx - 5 + (y - 27) * 0.4, y, 10 - (y - 27) * 0.8, 1, W);
    arms(id === 'scrooge' ? '#c82838' : id === 'daisy' ? '#9a5ad8' : kid ? kc : id === 'donald' ? '#2a5ad0' : W, 20 + (kid ? oy : 0), false);
    p.rect(cx - 3 + step, 32, 2, 3, OR); p.rect(cx + 1 - step, 32, 2, 3, OR);
    p.rect(cx - 6 + step, 35, 5, 3, OR); p.rect(cx + 1 - step, 35, 5, 3, OR);
    return;
  }
  if (id === 'goofy') {
    p.rect(cx - 9, 7, 3, 12, K); p.rect(cx + 6, 7, 3, 12, K);
    ellipse(p, cx, 11, 6.5, 7, K);
    ellipse(p, cx + 1, 15, 5.5, 3.6, SKIN); ellipse(p, cx + 2, 12.5, 2.6, 1.8, K);
    ellipse(p, cx - 2, 8, 2, 2.6, W); ellipse(p, cx + 2, 8, 2, 2.6, W); p.px(cx - 2, 9, K); p.px(cx + 2, 9, K);
    p.rect(cx - 2, 17, 6, 1, '#5a1a1a'); p.rect(cx, 18, 2, 2, W);
    p.rect(cx - 5, 1, 10, 4, '#3a9a4a'); p.rect(cx - 7, 4, 14, 1, '#2a7a3a'); p.rect(cx - 5, 3, 10, 1, K);
    p.rect(cx - 5, 20, 10, 7, '#f08a3a'); p.rect(cx - 5, 20, 3, 7, K); p.rect(cx + 2, 20, 3, 7, K); p.rect(cx - 2, 19, 4, 2, '#f08a3a');
    arms('#f08a3a', 20);
    p.rect(cx - 4, 27, 8, 3, '#3a5ab8'); legs('#3a5ab8', 30, 5, 3); feet('#7a4a2a', 37, 3.6);
    return;
  }
  if (id === 'pluto') {
    const Y = '#f0b030';
    p.rect(cx - 9, 6, 3, 11, K); p.rect(cx + 6, 6, 3, 11, K);
    ellipse(p, cx, 11, 6.5, 6.5, Y); ellipse(p, cx + 1, 14, 6, 3.4, '#f6c860'); ellipse(p, cx + 2, 11, 2.6, 1.8, K);
    ellipse(p, cx - 2, 7, 1.6, 2.4, W); ellipse(p, cx + 2, 7, 1.6, 2.4, W); p.px(cx - 2, 8, K); p.px(cx + 2, 8, K);
    p.rect(cx, 17, 3, 3, '#f06a7a');
    p.rect(cx - 5, 19, 10, 2, '#3aa84a'); p.px(cx, 21, YEL);
    ellipse(p, cx, 26, 6, 6, Y); arms(Y, 20, false);
    legs(Y, 31, 4, 3); feet(Y, 36, 3); p.rect(cx + 6, 27, 6, 2, K); p.rect(cx + 11, 24, 2, 4, K);
    return;
  }
  // ── sóc: Chip (mũi đen), Dale (mũi đỏ, sáng màu hơn)
  const fur = id === 'chip' ? '#9a6232' : '#c07a3e', cream = '#f6dcb0';
  circle(p, cx - 6, 5, 3, fur); circle(p, cx + 6, 5, 3, fur);
  ellipse(p, cx, 12, 7, 6.5, fur); ellipse(p, cx, 15, 5, 3.6, cream); p.rect(cx - 1, 4, 2, 5, dk(fur, 0.4));
  ellipse(p, cx - 2.5, 10, 1.8, 2.4, W); ellipse(p, cx + 2.5, 10, 1.8, 2.4, W); p.px(cx - 2, 11, K); p.px(cx + 2, 11, K);
  ellipse(p, cx, 13.5, id === 'dale' ? 1.8 : 1.3, id === 'dale' ? 1.4 : 1, id === 'dale' ? '#d83a3a' : K);
  if (id === 'chip') { p.rect(cx - 2, 17, 2, 2, W); p.rect(cx, 17, 2, 2, W); } else { p.rect(cx - 1, 17, 2, 2, W); }
  ellipse(p, cx, 26, 6, 6, fur); ellipse(p, cx, 27, 3.6, 4.5, cream);
  arms(fur, 20, false); legs(fur, 31, 4, 3); feet(fur, 36, 3);
  for (let y = 18; y < 34; y++) p.rect(cx + 7 + Math.round(Math.sin(y / 3) * 2), y, 4, 1, y % 3 ? fur : dk(fur, 0.2));
}, '#2a1a24');
