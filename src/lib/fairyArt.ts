// Vương quốc Cổ Tích: công viên giải trí ở điểm du lịch — lâu đài, đại lộ diễu hành, khu trò chơi (tàu lượn, ngựa gỗ, tách trà).
// Toàn bộ vẽ pixel tay; lâu đài dùng chung cho phố chính, map lâu đài, chuyến tàu lượn và quà lưu niệm.
import { ellipse } from './iso';
import { makeSprite, mix, type Pen, type Sprite } from './pixel';
import { band, bldg, circle, sky, speckle, string, tiles, tree, water, type Light } from './tripSpots';

const GOLD = '#f6c445', GOLD_D = '#c8902a';
const dk = (c: string, k = 0.3) => mix(c, '#2a1a3a', k), lt = (c: string, k = 0.35) => mix(c, '#ffffff', k);

/** Lâu đài pastel: tường kem, tháp hồng, mái chóp xanh, chóp vàng cờ hồng. `k` = tỉ lệ; `mono` = tô một màu (lớp chiếu sáng) */
export function castle(p: Pen, L: Light | null, cx: number, base: number, k: number, mono?: string) {
  const C = (c: string) => mono ?? c;
  const R = (x: number, y: number, w: number, h: number, c: string) => {
    const x0 = Math.round(cx + x * k), x1 = Math.round(cx + (x + w) * k), y1 = Math.round(base - y * k), y0 = Math.round(base - (y + h) * k);
    p.rect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0), C(c));
  };
  const WALL = '#f6eedf', WALL_D = '#dccbb4', PINK = '#f4cfe2', PINK_D = '#d8a8c4', ROOF = '#4a8ad8', ROOF_L = '#80b8f4', ROOF_D = '#2c5aa0';
  const win = (x: number, y: number, big = false) => {
    const w = big ? 4 : 3, h = big ? 8 : 6;
    R(x - w / 2 - 0.6, y - 0.6, w + 1.2, h + 1.6, '#c8b8a8'); R(x - w / 2, y, w, h, '#4a5a98'); R(x - w / 2, y + h - 1.5, w / 2, 1.5, '#9ab8f0');
    if (L && !mono) { const sx = Math.round(cx + (x - w / 2) * k), sy = Math.round(base - (y + h) * k); L.wins.push([sx, sy, Math.max(1, Math.round(w * k)), Math.max(2, Math.round(h * k))]); }
  };
  const cone = (x: number, w: number, y: number, h: number) => {
    for (let i = 0; i < h; i += 0.5) {
      const hw = (w / 2 + 1.5) * Math.pow(1 - i / h, 1.15);
      R(x - hw, y + i, hw * 2, 0.6, ROOF); R(x - hw, y + i, hw * 0.55, 0.6, ROOF_L); R(x + hw * 0.5, y + i, hw * 0.5, 0.6, ROOF_D);
    }
    for (let i = 3; i < h - 4; i += 6) R(x - (w / 2) * (1 - i / h) * 0.9, y + i, (w * (1 - i / h)) * 0.9, 0.5, ROOF_D);
    R(x - 2.5, y - 1, w * 0 + 5, 1.5, GOLD); R(x - (w / 2 + 1.5), y - 0.8, w + 3, 1.6, GOLD);
    R(x - 0.6, y + h, 1.2, 6, GOLD); R(x - 1.2, y + h + 2, 2.4, 1.6, GOLD_D);
    R(x + 0.6, y + h + 3.5, 6, 2.6, '#f07aa6'); R(x + 0.6, y + h + 3.5, 6, 1, '#ffb0cc');
  };
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
  if (L && !mono) for (const x of [-16, 16]) L.lamps.push({ x: Math.round(cx + x * k), y: Math.round(base - 14 * k), c: '#ffd88a' });
}

const DUMMY = (): Light => ({ ph: 'day', night: false, dusk: false, r: Math.random, wins: [], lamps: [], neon: [] });
/** Lâu đài rời (dùng ở tàu lượn, quà lưu niệm, lớp chiếu sáng) */
export const castleSprite = (k: number, mono?: string) => {
  const w = Math.ceil(140 * k) + 4, h = Math.ceil(184 * k) + 4;
  return makeSprite(`castle:${k}:${mono ?? ''}`, w, h, p => castle(p, DUMMY(), w / 2, h - 1, k, mono), null);
};
export const CASTLE_SPOT = { cx: 128, base: 120, k: 0.6 };

// ───────── nền các map ─────────
function shop(p: Pen, L: Light, x: number, w: number, h: number, wall: string, trim: string) {
  bldg(p, L, x, 104, w, h, wall, trim, '#8ac0e0', 8);
  for (let k = 0; k < w; k += 4) { p.rect(x + k, 104 - h + 6, 4, 4, (k / 4) % 2 ? trim : '#ffffff'); p.px(x + k + 1, 104 - h + 10, (k / 4) % 2 ? trim : '#ffffff'); }
  for (let k = 0; k <= 6; k++) p.rect(x + w / 2 - 6 + k * 2 - (k > 3 ? (k - 3) * 2 : 0) * 0, 104 - h - 4 - Math.min(k, 6 - k) * 2, 2, Math.min(k, 6 - k) * 2 + 1, trim);
}
function balloons(p: Pen, x: number, y: number) {
  const cs = ['#e8443a', '#f6c445', '#4a9ae8', '#f08aa6', '#8bc87a', '#b08ae0'];
  for (let i = 0; i < 6; i++) { const bx = x + (i % 3) * 5 - 5, by = y - 30 + Math.floor(i / 3) * 6 - (i % 2) * 2; p.rect(bx, by, 1, 30 - (by - y + 30) + 0, '#e8e8e8'); }
  for (let i = 0; i < 6; i++) { const bx = x + (i % 3) * 5 - 5, by = y - 30 + Math.floor(i / 3) * 6 - (i % 2) * 2; ellipse(p, bx, by, 2.6, 3.2, cs[i]); p.px(bx - 1, by - 2, '#ffffff'); }
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

export function drawFairyMain(p: Pen, L: Light) {
  sky(p, L, ['#8ac8f8', '#ffe0f0'], 100, 210);
  band(p, 80, 104, '#8ac878', '#6aa858');
  for (let i = 0; i < 10; i++) tree(p, 70 + i * 13, 98, 5, '#4a9a5a');
  castle(p, L, 128, 100, 0.46);
  shop(p, L, 2, 40, 44, '#f6d0a8', '#e8507a'); shop(p, L, 44, 38, 50, '#c8e0f8', '#3a7ad0'); shop(p, L, 84, 26, 34, '#fff0c8', '#8bc87a');
  shop(p, L, 146, 26, 34, '#e8d8f8', '#9a6ae0'); shop(p, L, 174, 38, 50, '#fff0c8', '#e8443a'); shop(p, L, 214, 42, 44, '#d8f0e0', '#f6a83a');
  tiles(p, 104, 192, '#e8c8a8', '#d8b494', 8);
  band(p, 120, 168, '#c87a6a', '#b86a5a'); for (let y = 122; y < 168; y += 5) for (let x = (y % 10) ? 0 : 6; x < 256; x += 12) p.rect(x, y, 10, 1, '#a85a4a');
  p.rect(0, 118, 256, 2, '#f6eedf'); p.rect(0, 168, 256, 2, '#f6eedf');
  for (const x of [14, 70, 186, 242]) lampPost(p, L, x, 118);
  flowerBed(p, L, 128, 182);
  balloons(p, 28, 150);
  string(p, L, 0, 256, 18, 8, ['#e8443a', '#f6c445', '#4a9ae8', '#f08aa6'], 12);
}

export function drawFairyCastle(p: Pen, L: Light) {
  sky(p, L, ['#7ab8f8', '#ffe8f4'], 110, 40);
  band(p, 90, 120, '#7ab868', '#5a9a50');
  for (let i = 0; i < 9; i++) tree(p, 6 + i * 31, 116, 7 + (i % 3), i % 2 ? '#3a8a4a' : '#4a9a5a');
  const { cx, base, k } = CASTLE_SPOT;
  castle(p, L, cx, base, k);
  water(p, L, 120, 134, '#5aa8e0', '#3a88c8');
  // cầu vào cổng
  p.rect(118, 118, 20, 18, '#c8b8a0'); for (let x = 119; x < 138; x += 3) p.rect(x, 118, 1, 18, '#a89880'); p.rect(116, 118, 2, 18, '#8a7a68'); p.rect(138, 118, 2, 18, '#8a7a68');
  band(p, 134, 192, '#8ac870', '#6aa858');
  // đường lát dẫn vào cổng + quảng trường
  for (let y = 134; y < 192; y++) { const w = 12 + (y - 134) * 0.9; p.rect(128 - w, y, w * 2, 1, (y % 6) ? '#e8dcc8' : '#d0c4ae'); }
  speckle(p, L, 0, 140, 256, 50, 160, ['#ffffff', '#f6e04a', '#e8507a', '#b08ae0']);
  // bụi cây cắt tỉa
  for (const x of [20, 70, 186, 236]) { circle(p, x, 150, 6, '#3a8a4a'); circle(p, x - 1, 148, 4, '#5aaa5a'); p.rect(x - 1, 156, 2, 4, '#6a4a32'); }
  // tảng đá cắm gươm
  ellipse(p, 220, 168, 12, 5, '#8a8a98'); for (let y = 0; y < 12; y++) p.rect(210 + y * 0.4, 156 + y, 20 - y * 0.8, 1, mix('#a8a8b8', '#7a7a88', y / 12));
  p.rect(208, 168, 24, 4, '#6a6a78'); p.rect(212, 158, 4, 2, '#c8c8d4');
  for (const x of [46, 210]) lampPost(p, L, x, 140);
}

export function drawFairyParade(p: Pen, L: Light) {
  sky(p, L, ['#80c0f8', '#ffe4f0'], 80, 200);
  castle(p, L, 128, 78, 0.3);
  // hai dãy nhà phố chạy về lâu đài
  const cs = ['#f6d0a8', '#c8e0f8', '#fff0c8', '#e8d8f8', '#d8f0e0', '#f8c8c8'];
  for (let i = 0; i < 4; i++) { bldg(p, L, i * 26, 100, 26, 30 + (i % 2) * 8, cs[i], ['#e8507a', '#3a7ad0', '#8bc87a', '#9a6ae0'][i], '#8ac0e0', 7); bldg(p, L, 256 - (i + 1) * 26, 100, 26, 30 + ((i + 1) % 2) * 8, cs[(i + 2) % 6], ['#f6a83a', '#e8443a', '#3a7ad0', '#e8507a'][i], '#8ac0e0', 7); }
  tiles(p, 100, 150, '#e8d4bc', '#d8c0a8', 8);
  // làn diễu hành
  band(p, 150, 192, '#9a7a8a', '#8a6a7a');
  for (let x = 0; x < 256; x += 16) p.rect(x, 170, 8, 1, '#f6e8c0');
  p.rect(0, 148, 256, 2, '#f6eedf');
  // dây chắn khán giả
  for (let x = 4; x < 256; x += 24) { p.rect(x, 140, 2, 9, GOLD_D); p.rect(x - 1, 139, 4, 2, GOLD); }
  for (let x = 4; x < 252; x++) { const t = ((x - 4) % 24) / 24; p.px(x, 142 + Math.round(Math.sin(t * Math.PI) * 3), '#c8304a'); }
  for (const x of [52, 204]) lampPost(p, L, x, 112);
  string(p, L, 0, 256, 16, 10, ['#e8443a', '#f6c445', '#4a9ae8', '#f08aa6', '#8bc87a'], 10);
  string(p, L, 0, 256, 40, 8, ['#f6c445', '#b08ae0', '#ffffff'], 14);
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
export const balloonDecoSprite = () => makeSprite('tv:balloons', 18, 26, p => {
  const cs = ['#e8443a', '#f6c445', '#4a9ae8', '#f08aa6', '#8bc87a'];
  for (let i = 0; i < 5; i++) { const x = 3 + (i % 3) * 6 - (i > 2 ? -3 : 0), y = 4 + Math.floor(i / 3) * 6; p.rect(x, y + 4, 1, 20 - y, '#d8d8e0'); }
  for (let i = 0; i < 5; i++) { const x = 3 + (i % 3) * 6 - (i > 2 ? -3 : 0), y = 4 + Math.floor(i / 3) * 6; for (let yy = -4; yy <= 4; yy++) for (let xx = -3; xx <= 3; xx++) { const X = xx / 3, Y = -yy / 3.6; if ((X * X + Y * Y - 1) ** 3 - X * X * Y * Y * Y <= 0) p.px(x + xx, y + yy, cs[i]); } p.px(x - 1, y - 2, '#ffffff'); }
  p.rect(6, 23, 7, 3, '#7a4e2c');
}, '#4a2a3a');

/** Ảnh lâu đài phủ một màu (lớp chiếu sáng show đêm) — vị trí khớp map lâu đài */
export function castleMaskAt(c: string): { sprite: Sprite; x: number; y: number } {
  const { cx, base, k } = CASTLE_SPOT, sp = castleSprite(k, c);
  return { sprite: sp, x: cx, y: base + 1 };
}
