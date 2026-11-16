// Sprite cho làng, bãi biển, đồi ngắm cảnh, các tòa nhà và nội thất — bảng màu tươi, nhiều chi tiết.
import type { Phase } from './content';
import { ellipse, isoPen, shade } from './iso';
import { makeSprite, mix, type Pen } from './pixel';
import { seeded } from './rng';
import { SEA, SKY } from './sky';
import { BEACH, BUILDINGS, GARDEN, KROOM, ROOM, TOWN } from './world';

// ───────── Bảng màu ─────────
const G = '#9fd067';
const STONE = '#f4e3bd', STONE_L = '#fdf3dc', STONE_D = '#dcc495';
const FLOWERS = ['#f59ab3', '#f6c64e', '#ffffff', '#b7a6e8', '#f7a98a', '#8db8ef'];
const OUT = '#6b4a3a';

type Pred = (x: number, y: number) => boolean;

/** Đá lát kiểu viên gạch tròn mép */
function cobble(p: Pen, x0: number, y0: number, x1: number, y1: number, where: Pred = () => true) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (!where(x, y)) continue;
      const row = Math.floor(y / 4), lx = (x + (row % 2) * 3) % 6, ly = y % 4;
      const seam = lx === 0 || ly === 0;
      const v = ((row * 7 + Math.floor((x + (row % 2) * 3) / 6) * 13) % 5) / 40;
      p.px(x, y, seam ? STONE_D : lx === 1 && ly === 1 ? STONE_L : mix(STONE, '#ffffff', v));
    }
  }
}

/** Rào cây xanh có khối: mặt trên sáng, mặt trước tối hơn, bo tròn hai đầu */
function hedgeBand(p: Pen, x: number, y: number, w: number, h: number) {
  const front = Math.min(4, Math.max(2, Math.floor(h / 2)));
  p.rect(x + 1, y, w - 2, h, '#86c257');
  p.rect(x, y + 1, w, h - 2, '#86c257');
  p.rect(x + 1, y + h - front, w - 2, front, '#76b44a');
  p.rect(x + 1, y + h - 1, w - 2, 1, '#5f9a3e');
  p.rect(x + 1, y + 1, w - 2, h - front - 1, '#b5df7e');
  p.rect(x + 2, y + 1, w - 4, 1, '#cdeb9a');
  for (let i = x + 2; i < x + w - 2; i += 3) for (let j = y + 2; j < y + h - front; j += 3) if ((i + j) % 2) p.px(i, j, '#d6f1a4');
  for (let i = x + 2; i < x + w - 2; i += 4) p.px(i, y + h - front + 1, '#6aa645');
}

function tuft(p: Pen, x: number, y: number, c: string) {
  p.px(x, y, c); p.px(x + 2, y, c); p.px(x + 1, y - 1, c);
}

function flowerDot(p: Pen, x: number, y: number, c: string) {
  p.px(x, y - 1, c); p.px(x - 1, y, c); p.px(x + 1, y, c); p.px(x, y + 1, c); p.px(x, y, '#fff3a0');
}

// ───────── Làng ─────────

export function townBackground() {
  return makeSprite('town:v4', 384, 288, p => {
    const rand = seeded('town-v3');
    p.rect(0, 0, 384, 288, G);
    for (let y = 0; y < 288; y += 8) for (let x = 0; x < 384; x += 8) if (((x + y) / 8) % 2) p.rect(x, y, 8, 8, '#a4d36c');
    for (let i = 0; i < 900; i++) {
      const x = Math.floor(rand() * 384), y = Math.floor(rand() * 288), r = rand();
      if (r < 0.45) p.px(x, y, '#b9e086');
      else if (r < 0.85) tuft(p, x, y, '#8cc65c');
      else { p.px(x, y, '#7fbc52'); p.px(x + 1, y, '#7fbc52'); p.px(x, y + 1, '#7fbc52'); p.px(x + 1, y - 1, '#c4e894'); }
    }
    // Bóng đổ dưới nhà, cây, đèn
    const shadow = (x: number, y: number, rx: number, ry: number) => ellipse(p, x, y, rx, ry, '#86b85a');
    for (const b of BUILDINGS) shadow(b.x + 3, b.y - 1, 34, 5);
    for (const [, x, y] of TOWN.trees) shadow(x + 2, y - 1, 12, 4);
    for (const [x, y] of TOWN.bushes) shadow(x + 1, y - 1, 8, 2.5);
    for (const [x, y] of TOWN.lamps) shadow(x + 2, y - 1, 4, 1.5);

    // Rừng phía bắc (chừa lối lên đồi)
    p.rect(0, 0, 384, 44, '#5f9a48');
    for (let row = 0; row < 3; row++) {
      for (let x = -8 + row * 7; x < 392; x += 15) {
        if ((x > 334 && x < 372) || (x > 0 && x < 34)) continue;
        const cy = 6 + row * 13 + Math.floor(rand() * 3);
        ellipse(p, x, cy, 11, 9, '#78b356');
        ellipse(p, x - 2, cy - 2, 8, 6, '#86c257');
        ellipse(p, x - 4, cy - 4, 4, 3, '#a9d878');
      }
    }
    for (let x = 0; x < 384; x++) if ((x < 336 || x > 370) && (x < 2 || x > 30)) p.rect(x, 44 + (x % 5 === 0 ? 1 : 0), 1, 2, '#5f9a48');
    // Lối đá lên đồi ngắm cảnh
    cobble(p, 342, 0, 364, 98);
    for (let y = 6; y < 56; y += 7) p.rect(342, y, 22, 1, STONE_D);
    hedgeBand(p, 334, 0, 8, 50); hedgeBand(p, 364, 0, 8, 50);
    // Lối mòn đất vào rừng thông → bãi cắm trại
    for (let y = 0; y < 97; y++) for (let x = 6; x < 26; x++) {
      const edge = x === 6 || x === 25;
      p.px(x, y, edge ? '#b08a5a' : ((x * 7 + y * 3) % 11 === 0 ? '#b8946a' : (x + y) % 9 === 0 ? '#e0c49a' : '#d0b080'));
    }
    for (let y = 8; y < 90; y += 13) { ellipse(p, 12 + (y % 3), y, 2, 1, '#c8c0b0'); ellipse(p, 20 - (y % 2), y + 6, 1.5, 1, '#c8c0b0'); }
    hedgeBand(p, 0, 0, 6, 50); hedgeBand(p, 26, 0, 8, 50);
    // Lối đá xuống quán cà phê sách
    cobble(p, 216, 276, 250, 287);
    shadow(253, 273, 30, 5);

    // Đường chính, lối xuống quảng trường, biển, vườn, ruộng rau
    cobble(p, 0, 96, 384, 112);
    cobble(p, 182, 112, 202, 130);
    const fx = TOWN.fountain.x, fy = TOWN.fountain.y;
    cobble(p, fx - 40, fy - 36, fx + 40, fy + 36, (x, y) => ((x - fx) / 40) ** 2 + ((y - fy) / 33) ** 2 <= 1);
    cobble(p, 200, 186, 216, 288);
    cobble(p, 98, 166, 160, 178);
    cobble(p, 98, 178, 114, 190);
    cobble(p, 224, 166, 276, 178);
    // Mép đá bo viền
    for (let x = 0; x < 384; x++) { p.px(x, 95, '#e8d4a8'); p.px(x, 112, '#d2b583'); p.px(x, 113, '#8cbf5a'); }

    // Vườn hoa có hàng rào cây xanh (người chơi trang trí bên trong)
    const g = GARDEN, gx1 = g.x + g.cols * g.cw, gy1 = g.y + g.rows * g.ch;
    for (let y = g.y - 4; y < gy1 + 4; y++) p.rect(g.x - 4, y, gx1 - g.x + 8, 1, Math.floor((y - g.y) / 7) % 2 ? '#acd977' : '#a2d06c');
    hedgeBand(p, g.x - 10, g.y - 10, 82, 7); hedgeBand(p, 114, g.y - 10, gx1 - 104, 7);
    hedgeBand(p, g.x - 10, gy1 + 4, gx1 - g.x + 20, 7);
    hedgeBand(p, g.x - 10, g.y - 10, 6, gy1 - g.y + 20); hedgeBand(p, gx1 + 4, g.y - 10, 6, gy1 - g.y + 20);

    // Lối sang nông trại & khu vui chơi
    cobble(p, 224, 166, 318, 178);
    cobble(p, 255, 178, 270, 214);
    cobble(p, 299, 178, 314, 212);
    for (const [x, y] of [[262, 214], [306, 212]]) shadow(x + 2, y - 1, 18, 3);
    // Hồ sen có cầu gỗ
    const px0 = 330, py0 = 240;
    ellipse(p, px0, py0, 47, 30, '#d8cfc0');
    ellipse(p, px0, py0 + 1, 44, 27, '#b8ad9c');
    ellipse(p, px0, py0, 42, 25, '#7fcde3');
    ellipse(p, px0 - 4, py0 - 3, 34, 18, '#a0dcec');
    for (let i = 0; i < 26; i++) p.rect(px0 - 34 + Math.floor(rand() * 64), py0 - 16 + Math.floor(rand() * 30), 3 + Math.floor(rand() * 4), 1, '#e0f7fb');
    for (const [x, y] of [[312, 230], [346, 250], [356, 228], [322, 254], [338, 236]]) {
      ellipse(p, x, y, 4, 2.4, '#86c257'); p.px(x + 2, y, '#7fcde3');
      if ((x + y) % 3) flowerDot(p, x - 1, y - 1, '#f59ab3');
    }
    for (let x = 282; x < 300; x++) p.rect(x, 236 + (x % 3 === 0 ? 0 : 0), 1, 9, x % 3 === 0 ? '#b07a4a' : '#c98a52');
    p.rect(282, 244, 18, 2, '#8a5a3c');

    // Hoa dại rải rác (tránh lối đi)
    const zones: [number, number, number, number][] = [[0, 50, 384, 44], [0, 114, 176, 50], [216, 114, 168, 50], [0, 280, 200, 8], [222, 246, 60, 40], [130, 120, 40, 40], [250, 130, 90, 30]];
    for (const [zx, zy, zw, zh] of zones) {
      for (let i = 0; i < (zw * zh) / 260; i++) {
        const x = zx + Math.floor(rand() * zw), y = zy + Math.floor(rand() * zh);
        flowerDot(p, x, y, FLOWERS[Math.floor(rand() * FLOWERS.length)]);
      }
    }
  }, null);
}

export function beachBackground(phase: Phase) {
  return makeSprite(`beach:v2:${phase}`, 192, 144, p => {
    skyBands(p, SKY[phase], 0, BEACH.horizon, 192);
    p.rect(0, BEACH.horizon, 192, BEACH.sandTop - BEACH.horizon, mix(SEA[phase], '#ffffff', 0.2));
    p.rect(0, BEACH.horizon, 192, 1, mix(SEA[phase], '#ffffff', 0.5));
    const sand = phase === 'night' ? '#9a8fc0' : phase === 'sunset' ? '#ffc890' : '#ffe0a0';
    p.rect(0, BEACH.sandTop, 192, BEACH.wet - BEACH.sandTop, sand);
    p.rect(0, BEACH.sandTop, 192, 2, mix(sand, '#ffffff', 0.5));
    const rand = seeded('beach');
    for (let i = 0; i < 220; i++) p.px(Math.floor(rand() * 192), BEACH.sandTop + 2 + Math.floor(rand() * 70), rand() < 0.5 ? mix(sand, '#a0602a', 0.18) : mix(sand, '#ffffff', 0.45));
    for (let i = 0; i < 6; i++) {                                    // vỏ sò, sao biển
      const x = 10 + Math.floor(rand() * 172), y = 70 + Math.floor(rand() * 36);
      if (i % 2) { p.px(x, y, '#ff8a6a'); p.px(x - 1, y + 1, '#ff8a6a'); p.px(x + 1, y + 1, '#ff8a6a'); p.px(x, y + 1, '#ffb090'); }
      else { p.rect(x, y, 3, 2, '#ffd6e0'); p.px(x + 1, y - 1, '#ffd6e0'); }
    }
    for (let y = BEACH.sandTop; y < 62; y += 5) p.rect(92 + ((y / 5) % 2) * 3, y, 6, 3, mix(sand, '#a0602a', 0.22));
    p.rect(0, BEACH.wet, 192, BEACH.water - BEACH.wet, mix(sand, '#8a5a30', 0.25));
    p.rect(0, BEACH.water, 192, 144 - BEACH.water, SEA[phase]);
    p.rect(0, BEACH.water + 8, 192, 144 - BEACH.water - 8, mix(SEA[phase], '#003a6a', 0.15));
    for (let x = 0; x < 192; x += 6) p.rect(x + (x % 12 ? 2 : 0), BEACH.water, 4, 1, '#ffffff');
    for (let i = 0; i < 30; i++) p.rect(Math.floor(rand() * 192), BEACH.water + 3 + Math.floor(rand() * 18), 3, 1, mix(SEA[phase], '#ffffff', 0.45));
  }, null);
}

/** Dải màu trời có hòa sắc caro giữa các dải */
function skyBands(p: Pen, stops: string[], y0: number, y1: number, w: number) {
  const n = 8, h = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), seg = t * (stops.length - 1), k = Math.min(stops.length - 2, Math.floor(seg));
    const c = mix(stops[k], stops[k + 1], seg - k);
    const top = Math.round(y0 + i * h), bot = Math.round(y0 + (i + 1) * h);
    p.rect(0, top, w, bot - top, c);
    if (i > 0) {
      const prev = mix(stops[Math.min(stops.length - 2, Math.floor(((i - 1) / (n - 1)) * (stops.length - 1)))], c, 0.5);
      for (let x = 0; x < w; x += 2) p.px(x + (top % 2), top, prev);
    }
  }
}

// ───────── Tòa nhà ─────────

export function cabinSprite(lit: boolean) {
  return makeSprite(`cabin:v3:${lit}`, 66, 62, p => {
    // Ống khói đá
    p.rect(46, 2, 9, 18, '#a89a8a');
    for (let y = 3; y < 20; y += 3) for (let x = 46 + (y % 2) * 2; x < 55; x += 4) p.rect(x, y, 3, 2, '#c8bcae');
    p.rect(45, 1, 11, 2, '#7a6a5a');
    // Mái ngói đỏ
    for (let i = 0; i < 26; i++) {
      const half = 9 + i * 1.18, y = 6 + i;
      const row = Math.floor(i / 3);
      p.rect(33 - half, y, half * 2, 1, row % 2 ? '#e3786c' : '#ec8a7a');
      if (i % 3 === 2) for (let x = Math.ceil(33 - half) + (row % 2) * 2; x < 33 + half; x += 4) p.px(x, y, '#c05a52');
    }
    p.rect(1, 32, 64, 3, '#a8524a');
    p.rect(3, 31, 60, 1, '#f6a898');
    // Ô cửa sổ tròn trên mái
    ellipse(p, 33, 20, 5.5, 5.5, '#fff1d6'); ellipse(p, 33, 20, 4, 4, lit ? '#f6c64e' : '#a8dcef');
    p.rect(32, 16, 1, 9, '#fff1d6'); p.rect(29, 20, 9, 1, '#fff1d6');
    // Tường gỗ tròn
    for (let y = 35; y < 58; y += 4) {
      p.rect(4, y, 58, 4, '#d9a06a');
      p.rect(4, y, 58, 1, '#ecc18e');
      p.rect(4, y + 3, 58, 1, '#b07a4a');
      for (const x of [4, 61]) { ellipse(p, x, y + 2, 2.2, 2, '#f6dcb4'); p.px(x, y + 2, '#b88050'); }
    }
    // Cửa sổ có rèm, chớp xanh và hộp hoa
    for (const wx of [9, 45]) {
      p.rect(wx - 3, 38, 3, 12, '#7cc59a'); p.rect(wx + 12, 38, 3, 12, '#7cc59a');
      for (let y = 39; y < 50; y += 2) { p.px(wx - 2, y, '#a8dfbc'); p.px(wx + 13, y, '#a8dfbc'); }
      p.rect(wx, 38, 12, 12, '#fff6e6');
      p.rect(wx + 1, 39, 10, 10, lit ? '#f6c64e' : '#a8dcef');
      if (!lit) { p.px(wx + 2, 40, '#ffffff'); p.px(wx + 3, 41, '#ffffff'); }
      else { p.rect(wx + 1, 39, 10, 2, '#fff1a8'); }
      p.rect(wx + 1, 39, 3, 6, '#f7b8cc'); p.rect(wx + 8, 39, 3, 6, '#f7b8cc');   // rèm
      p.rect(wx + 5, 39, 2, 10, '#fff6e6'); p.rect(wx + 1, 44, 10, 1, '#fff6e6');
      p.rect(wx - 1, 50, 14, 3, '#a06a48');
      for (let x = wx; x < wx + 12; x += 2) flowerDot(p, x + 1, 49, FLOWERS[(x / 2) % 4]);
    }
    // Cửa vòm
    p.rect(26, 42, 14, 16, '#8a5a3c'); ellipse(p, 33, 42, 7, 4, '#8a5a3c');
    p.rect(28, 43, 10, 14, '#c08658'); ellipse(p, 33, 43, 5, 3, '#c08658');
    p.rect(28, 49, 10, 1, '#8a5a3c');
    p.px(31, 44, '#f08aa6'); p.px(34, 44, '#f08aa6'); p.rect(31, 45, 4, 1, '#f08aa6'); p.rect(32, 46, 2, 1, '#f08aa6'); // tim trên cửa
    p.rect(36, 51, 2, 2, '#f6c64e');
    // Đèn treo và bậc thềm
    p.rect(43, 42, 3, 4, '#3a3a4a'); p.rect(44, 43, 1, 2, lit ? '#fff1a8' : '#f6c64e');
    p.rect(22, 58, 22, 4, '#c8beb0'); p.rect(22, 58, 22, 1, '#e8e0d4');
    p.rect(13, 58, 6, 4, '#dc9a6a'); ellipse(p, 16, 56, 4, 3, '#86c257'); flowerDot(p, 15, 55, '#f59ab3');
  }, OUT);
}

export function shopSprite() {
  return makeSprite('shop:v3', 62, 58, p => {
    // Tường gạch kem
    p.rect(3, 20, 56, 34, '#fbecd2');
    for (let y = 20; y < 54; y += 4) {
      p.rect(3, y, 56, 1, '#efd6ae');
      for (let x = 3 + ((y / 4) % 2) * 4; x < 59; x += 8) p.rect(x, y, 1, 4, '#efd6ae');
    }
    // Mái hồng và biển hiệu đồng xu
    p.rect(1, 12, 60, 7, '#f08aa6'); p.rect(1, 12, 60, 2, '#f7b3c6'); p.rect(1, 18, 60, 1, '#d06a88');
    p.rect(14, 0, 34, 13, '#8a5a3c'); p.rect(16, 2, 30, 9, '#f6c64e'); p.rect(16, 2, 30, 2, '#fff1a8');
    ellipse(p, 31, 6.5, 4, 4, '#e8b04a'); ellipse(p, 31, 6.5, 2.6, 2.6, '#f6c64e'); p.rect(30, 5, 2, 3, '#c89048');
    for (const x of [20, 41]) { p.px(x, 6, '#f08aa6'); p.px(x - 1, 7, '#f08aa6'); p.px(x + 1, 7, '#f08aa6'); p.px(x, 8, '#f08aa6'); }
    // Mái hiên sọc có viền lượn
    for (let x = 1; x < 61; x++) {
      const c = Math.floor((x - 1) / 5) % 2 ? '#ffffff' : '#f08aa6';
      p.rect(x, 20, 1, 7, c);
      const sc = (x - 1) % 5;
      if (sc > 0 && sc < 4) p.px(x, 27, c);
    }
    p.rect(1, 20, 60, 1, '#d06a88');
    // Tủ kính bày hàng
    p.rect(6, 30, 26, 18, '#ffffff'); p.rect(7, 31, 24, 16, '#cdeef7');
    p.rect(7, 38, 24, 1, '#c98a52'); p.rect(7, 46, 24, 1, '#c98a52');
    const goods = ['#f08aa6', '#f6c64e', '#8db8ef', '#9fd067', '#b7a6e8', '#f7a98a'];
    for (let i = 0; i < 6; i++) { p.rect(8 + i * 4, 34, 3, 4, goods[i]); p.rect(9 + i * 4, 42, 3, 4, goods[(i + 3) % 6]); }
    p.px(10, 32, '#ffffff'); p.px(11, 31, '#ffffff'); p.px(26, 33, '#ffffff');
    // Cửa xanh ngọc
    p.rect(37, 28, 15, 26, '#6cbcae'); p.rect(39, 30, 11, 10, '#cdeef7'); p.rect(39, 42, 11, 10, '#8fd0c2');
    p.rect(48, 44, 2, 2, '#f6c64e');
    p.rect(40, 32, 9, 4, '#ffffff'); p.rect(41, 33, 7, 2, '#f08aa6');            // bảng "mở cửa"
    // Bệ đá, chậu cây, thùng trái cây
    p.rect(3, 53, 56, 3, '#c8beb0'); p.rect(3, 53, 56, 1, '#e8e0d4');
    p.rect(53, 48, 6, 6, '#dc9a6a'); ellipse(p, 56, 45, 4, 4, '#86c257'); flowerDot(p, 56, 44, '#f6c64e');
    p.rect(4, 49, 10, 6, '#c98a52'); p.rect(4, 49, 10, 1, '#e8b07a');
    for (let x = 5; x < 14; x += 3) ellipse(p, x + 1, 48, 1.6, 1.5, x % 2 ? '#ec7a7a' : '#f6a95e');
  }, OUT);
}

export function cinemaSprite(lit = false) {
  return makeSprite(`cinema:v3:${lit}`, 64, 64, p => {
    // Thân rạp đỏ nhung, trụ vàng
    p.rect(2, 18, 60, 42, '#d8606a');
    for (const x of [2, 19, 43, 60]) { p.rect(x, 18, 3, 42, '#b04a56'); p.rect(x + 1, 18, 1, 42, '#f2cc6a'); }
    // Vương miện nghệ thuật
    p.rect(20, 0, 24, 18, '#b04a56'); p.rect(14, 8, 36, 10, '#b04a56'); p.rect(8, 13, 48, 5, '#b04a56');
    p.rect(20, 0, 24, 2, '#f2cc6a'); p.rect(14, 8, 6, 1, '#f2cc6a'); p.rect(44, 8, 6, 1, '#f2cc6a'); p.rect(8, 13, 6, 1, '#f2cc6a'); p.rect(50, 13, 6, 1, '#f2cc6a');
    p.map(['...Y...', '..YYY..', 'YYYYYYY', '.YYYYY.', '.YY.YY.', 'Y.....Y'], { Y: '#fbe6a0' }, 28, 5);
    // Bảng đèn
    p.rect(5, 20, 54, 12, '#4a3a5a');
    for (let x = 6; x < 58; x += 3) { p.px(x, 21, x % 6 ? '#fbe6a0' : '#fff6c0'); p.px(x, 30, x % 6 ? '#fff6c0' : '#fbe6a0'); }
    p.rect(9, 23, 46, 6, '#fff1c8');
    const letters = [[11, 3], [15, 2], [18, 3], [22, 3], [26, 2], [31, 3], [35, 3], [39, 2], [43, 3], [47, 3]];
    letters.forEach(([x, w], i) => p.rect(x, 24, w, 4, i % 3 === 1 ? '#f08aa6' : '#d8606a'));
    // Áp phích
    for (const [x, bg, ic] of [[6, '#8db8ef', '#f08aa6'], [46, '#b7a6e8', '#f6c64e']] as const) {
      p.rect(x, 35, 12, 17, '#f2cc6a'); p.rect(x + 1, 36, 10, 15, bg);
      ellipse(p, x + 6, 42, 3, 3, ic); p.rect(x + 2, 47, 8, 1, '#ffffff'); p.rect(x + 3, 49, 6, 1, '#ffffff');
    }
    // Cửa kính và thảm đỏ
    p.rect(22, 36, 20, 24, '#f2cc6a'); p.rect(23, 37, 18, 23, lit ? '#ffe9a8' : '#5a4a6a');
    p.rect(31, 37, 2, 23, '#f2cc6a'); p.rect(29, 48, 1, 4, '#f2cc6a'); p.rect(34, 48, 1, 4, '#f2cc6a');
    if (!lit) { p.px(25, 39, '#8a7aaa'); p.px(26, 40, '#8a7aaa'); }
    p.rect(24, 60, 16, 4, '#e8707a'); p.rect(24, 60, 16, 1, '#f4a0a8');
    for (const x of [19, 44]) { p.rect(x, 53, 2, 8, '#f2cc6a'); ellipse(p, x + 1, 53, 1.6, 1.6, '#fbe6a0'); }
    p.rect(20, 55, 25, 1, '#b04a56');
  }, OUT);
}

export function restaurantSprite(lit: boolean) {
  return makeSprite(`rest:v3:${lit}`, 62, 60, p => {
    // Mái ngói xanh ngọc
    p.rect(44, 2, 7, 12, '#a89a8a'); p.rect(43, 1, 9, 2, '#7a6a5a');
    for (let i = 0; i < 16; i++) {
      const half = 18 + i * 0.9, y = 4 + i, row = Math.floor(i / 3);
      p.rect(31 - half, y, half * 2, 1, row % 2 ? '#6cbca4' : '#88d0b8');
      if (i % 3 === 2) for (let x = Math.ceil(31 - half) + (row % 2) * 2; x < 31 + half; x += 4) p.px(x, y, '#4f9a86');
    }
    p.rect(1, 20, 60, 2, '#4f9a86');
    // Tường kem có khung gỗ
    p.rect(4, 22, 54, 34, '#fbe8c8');
    for (const x of [4, 18, 43, 57]) p.rect(x, 22, 2, 34, '#a06a48');
    p.rect(4, 22, 54, 2, '#a06a48'); p.rect(4, 38, 14, 1, '#a06a48'); p.rect(44, 38, 14, 1, '#a06a48');
    p.px(8, 26, '#a06a48'); p.px(10, 28, '#a06a48'); p.px(52, 26, '#a06a48'); p.px(50, 28, '#a06a48');
    // Dây đèn màu
    for (let x = 2; x < 60; x++) {
      const y = 23 + Math.round(Math.abs(((x - 2) % 14) - 7) / 3);
      p.px(x, y, '#5a3a2a');
      if (x % 4 === 0) p.px(x, y + 1, ['#f08aa6', '#f6c64e', '#8db8ef', '#9fd067'][(x / 4) % 4]);
    }
    // Cửa sổ vòm sáng ấm, có nến và hoa
    for (const wx of [7, 45]) {
      p.rect(wx, 32, 10, 14, '#fff6e6'); ellipse(p, wx + 5, 32, 5, 3.5, '#fff6e6');
      p.rect(wx + 1, 33, 8, 12, lit ? '#f8d880' : '#b0e0f0'); ellipse(p, wx + 5, 33, 4, 2.5, lit ? '#ffe9a0' : '#cdeef7');
      p.rect(wx + 4, 40, 2, 3, '#ffffff'); p.px(wx + 4, 39, '#f7a98a');
      p.rect(wx - 1, 46, 12, 3, '#a06a48');
      for (let x = wx; x < wx + 10; x += 2) flowerDot(p, x + 1, 45, FLOWERS[(x / 2) % 4]);
    }
    // Mái hiên sọc xanh trên cửa
    for (let x = 20; x < 42; x++) p.rect(x, 28, 1, 5, Math.floor((x - 20) / 3) % 2 ? '#ffffff' : '#88d0b8');
    for (let x = 21; x < 42; x += 3) p.px(x, 33, '#88d0b8');
    // Cửa có ô tròn
    p.rect(24, 35, 14, 21, '#8a5a3c'); p.rect(26, 37, 10, 19, '#c08658');
    ellipse(p, 31, 41, 3, 3, lit ? '#f8d880' : '#cdeef7'); p.rect(33, 48, 2, 2, '#f6c64e');
    // Bảng menu phấn, bậc thềm
    p.rect(50, 48, 10, 10, '#7a4a2a'); p.rect(51, 49, 8, 7, '#2f3e3a');
    p.rect(52, 50, 5, 1, '#ffffff'); p.rect(52, 52, 6, 1, '#ffffff'); p.px(56, 54, '#f08aa6');
    p.rect(20, 56, 22, 4, '#c8beb0'); p.rect(20, 56, 22, 1, '#e8e0d4');
    p.rect(2, 52, 7, 6, '#dc9a6a'); ellipse(p, 5.5, 50, 4, 3.5, '#86c257'); flowerDot(p, 5, 49, '#ffffff');
  }, OUT);
}

// ───────── Cây cối, đài phun nước, biển chỉ đường ─────────

export function treeSprite(variant = 0) {
  return makeSprite(`tree:v3:${variant}`, 32, 40, p => {
    p.rect(13, 24, 6, 16, '#b07a4a'); p.rect(16, 24, 3, 16, '#8a5a3c'); p.rect(11, 37, 10, 3, '#b07a4a');
    ellipse(p, 16, 16, 15, 13, '#6aa645');
    ellipse(p, 14, 14, 13, 11, '#8cc75a');
    ellipse(p, 12, 11, 8, 6, '#a8d878');
    ellipse(p, 10, 9, 3.5, 2.5, '#cdeca0');
    const fruit = variant === 1 ? '#ec7a7a' : variant === 2 ? '#f6a95e' : null;
    if (fruit) for (const [x, y] of [[8, 18], [20, 12], [24, 20], [14, 22], [18, 7]]) { ellipse(p, x, y, 1.6, 1.6, fruit); p.px(x - 1, y - 1, '#ffffff'); }
  }, '#4f7a3a');
}

export function cherrySprite() {
  return makeSprite('cherry:v3', 34, 40, p => {
    p.rect(15, 24, 5, 16, '#8a4a3a'); p.rect(18, 24, 2, 16, '#6a3428'); p.rect(19, 26, 6, 2, '#8a4a3a'); p.rect(10, 28, 6, 2, '#8a4a3a');
    ellipse(p, 17, 15, 16, 13, '#e996b0');
    ellipse(p, 15, 13, 14, 11, '#f4b0c6');
    ellipse(p, 12, 10, 8, 6, '#f9cad8');
    ellipse(p, 10, 8, 3.5, 2.5, '#fde6ee');
    for (const [x, y] of [[6, 16], [22, 8], [26, 18], [14, 22], [19, 13], [9, 12]]) p.px(x, y, '#ffffff');
  }, '#a0607a');
}

export function pineSprite() {
  return makeSprite('pine:v3', 22, 38, p => {
    p.rect(9, 30, 4, 8, '#8a5a3c');
    for (let layer = 0; layer < 3; layer++) {
      for (let i = 0; i < 12; i++) {
        const half = 2 + i * 0.75 + layer, y = 2 + layer * 9 + i;
        p.rect(11 - half, y, half * 2, 1, i < 3 ? '#8cc48a' : '#6aa86a');
        p.rect(11 - half, y, Math.max(1, half * 0.6), 1, '#a8d8a0');
      }
    }
  }, '#4f7a3a');
}

export function bushSprite(variant = 0) {
  return makeSprite(`bush:v3:${variant}`, 18, 12, p => {
    ellipse(p, 9, 7, 9, 5.5, '#86c257'); ellipse(p, 8, 6, 7, 4.2, '#9fd067'); ellipse(p, 6, 4, 3, 2, '#d6f1a4');
    const c = FLOWERS[variant % FLOWERS.length];
    for (const [x, y] of [[4, 6], [10, 4], [13, 7], [7, 9]]) flowerDot(p, x, y, c);
  }, '#4f7a3a');
}

export function fountainSprite() {
  return makeSprite('fountain:v3', 46, 34, p => {
    ellipse(p, 23, 26, 23, 8, '#c8beb0');
    ellipse(p, 23, 25, 21, 6.5, '#e8e0d4');
    ellipse(p, 23, 26, 18, 5, '#7fcde3');
    ellipse(p, 21, 25, 13, 3, '#b8ecf5');
    p.rect(20, 10, 6, 16, '#d8d0c4'); p.rect(20, 10, 2, 16, '#f0ebe4');
    ellipse(p, 23, 11, 10, 3, '#e8e0d4'); ellipse(p, 23, 10.5, 8, 2, '#b8ecf5');
    p.rect(22, 3, 2, 7, '#cdeef7');
    for (const [x, y] of [[18, 5], [28, 5], [15, 9], [31, 9], [13, 14], [33, 14], [12, 19], [34, 19]]) p.px(x, y, '#cdeef7');
    for (const [x, y] of [[10, 26], [30, 27], [20, 28]]) p.rect(x, y, 3, 1, '#ffffff');
  }, '#5a5048');
}

export function signSprite() {
  return makeSprite('sign:v3', 16, 16, p => {
    p.rect(7, 7, 2, 9, '#8a5a3c');
    p.rect(0, 0, 16, 8, '#a8602f'); p.rect(1, 1, 14, 6, '#ecc18e'); p.rect(1, 1, 14, 1, '#ffc890');
    p.map(['..W..', '.WWW.', 'WWWWW'], { W: '#ffffff' }, 3, 2);
  }, OUT);
}

export function mailboxSprite() {
  return makeSprite('mailbox:v3', 10, 16, p => {
    p.rect(4, 8, 2, 8, '#8a5a3c');
    p.rect(0, 2, 10, 7, '#ec8080'); ellipse(p, 5, 2.5, 5, 2.5, '#ec8080'); p.rect(0, 2, 10, 1, '#f6aaaa');
    p.rect(2, 5, 6, 1, '#c05a52'); p.rect(9, 0, 1, 5, '#3a3a4a'); p.rect(9, 0, 3, 2, '#f6c64e');
  }, OUT);
}

// ───────── Nội thất phòng nhìn nghiêng ─────────

/** Phòng búp bê: hai bức tường, sàn gỗ hình thoi, đồ cố định (bếp, cửa, khung cửa sổ) */
export function roomBackground(kind: 'house' | 'bedroom' | 'bath' | 'kid') {
  const big = kind === 'kid' || kind === 'bedroom';
  const BW = big ? 216 : 192, BH = big ? 164 : 144;
  return makeSprite(`room:v6:${kind}`, BW, BH, p => {
    const { ox, oy, n, wallH } = big ? KROOM : ROOM;
    const q = isoPen(p, ox, oy);
    const dg = n - 8;                                                   // cửa trái luôn ở 2 ô cuối tường
    p.rect(0, 0, BW, BH, kind === 'house' ? '#fbecd6' : kind === 'kid' ? '#eef0fb' : kind === 'bedroom' ? '#2a1424' : '#fbe4ea');
    const rand = seeded(kind);
    for (let i = 0; i < 40; i++) p.px(Math.floor(rand() * BW), Math.floor(rand() * BH), kind === 'house' ? '#ffd6a8' : kind === 'kid' ? '#d6dcf6' : kind === 'bedroom' ? '#f6d870' : '#ffc6d6');

    // Bệ sàn (độ dày nhà búp bê)
    q.poly([q.pt(0, n), q.pt(n, n), q.pt(n, 0), q.pt(n, 0, -6), q.pt(n, n, -6), q.pt(0, n, -6)], '#a06a48');
    q.poly([q.pt(n, n), q.pt(n, 0), q.pt(n, 0, -6), q.pt(n, n, -6)], '#6a3420');

    // Sàn gỗ: ván chạy theo gx, mạch so le
    for (let y = oy; y < oy + n * 10 + 1; y++) {
      for (let x = ox - n * 10; x < ox + n * 10; x++) {
        const a = (x + 0.5 - ox) / 10, b = (y + 0.5 - oy) / 5;
        const gx = (a + b) / 2, gy = (b - a) / 2;
        if (gx < 0 || gy < 0 || gx >= n || gy >= n) continue;
        const plank = Math.floor(gy * 3), along = gx + (plank % 3) * 0.37;
        const seamRow = gy * 3 - plank < 0.12, seamCol = along - Math.floor(along / 1.5) * 1.5 < 0.07;
        if (kind === 'bath') {
          const tx = gx * 2, ty = gy * 2;
          const grout = tx - Math.floor(tx) < 0.08 || ty - Math.floor(ty) < 0.08;
          p.px(x, y, grout ? '#d8d0d8' : (Math.floor(tx) + Math.floor(ty)) % 2 ? '#fffaf6' : '#f6d6e0');
          continue;
        }
        const base = kind === 'house' ? (plank % 2 ? '#e4ae78' : '#dca06a') : kind === 'kid' ? (plank % 2 ? '#f2d2a4' : '#ecc898') : (plank % 2 ? '#b8744a' : '#ae6a42');
        p.px(x, y, seamRow || seamCol ? (kind === 'kid' ? '#d4ae80' : kind === 'bedroom' ? '#8a4a2a' : '#b98456') : base);
      }
    }

    // Tường trái (gx = 0) và tường phải (gy = 0)
    const wall = (left: boolean) => {
      for (let i = 0; i < n * 10; i++) {
        const x = left ? ox - 1 - i : ox + i;
        const yb = oy + Math.floor((i + 0.5) / 2);
        for (let v = 0; v < wallH; v++) {
          const y = yb - v;
          let c: string;
          if (kind === 'bath') {
            const grout = v % 6 === 0 || i % 6 === 0;
            c = grout ? '#e6eef0' : left ? (v > 30 ? '#e0f4f6' : '#bfe6ee') : (v > 30 ? '#fdeef2' : '#f8d4e0');
            if (v === 30) c = '#f2b8cc';
          } else if (kind === 'house') {
            const log = Math.floor(v / 6), lv = v % 6;
            c = lv === 0 ? '#b07a4a' : lv === 5 ? '#ecc18e' : log % 2 ? '#d9a06a' : '#d29660';
            if (left) c = mix(c, '#3a1a0a', 0.06);
          } else if (kind === 'kid') {
            if (v < 13) c = v === 12 ? '#e6d8c8' : i % 10 === 0 ? '#efe4d8' : '#fffaf4';          // ốp gỗ trắng chân tường
            else if (left) c = (Math.floor(i / 2) + Math.floor(v / 4)) % 9 === 0 && v % 4 === 1 ? '#ffffff' : '#e3eafb';   // xanh trời lấm tấm sao
            else c = Math.floor(i / 5) % 2 ? '#f8eefc' : '#efe2f8';                              // sọc oải hương
          } else if (kind === 'bedroom') {
            const pi = i % 10;
            if (v < 13) c = v === 12 ? '#e8b84a' : v === 11 ? '#fff4e6' : pi < 1 ? '#efd8c4' : (v === 3 || v === 9) && pi >= 2 && pi <= 8 ? '#e8c8b0' : (pi === 2 || pi === 8) && v > 3 && v < 9 ? '#e8c8b0' : '#fff6ea';   // ốp tường trắng ngà, khung nổi
            else if (v >= wallH - 6) c = v === wallH - 4 ? '#ffe08a' : v === wallH - 6 ? '#c8902a' : '#e8b84a';                                  // phào chỉ vàng
            else { const mx = i % 8, my = (v - 13) % 8, d = Math.abs(mx - 4) + Math.abs(my - 4);                                                   // giấy dán tường gấm hoa
              c = left ? '#f4cbd6' : '#f9ddd8'; if (d === 3) c = left ? '#e8a8bc' : '#f0bcc0'; if (d === 0) c = '#e8b84a'; if (mx === 0 && my === 0) c = '#ffffff'; }
            if (left) c = mix(c, '#3a0a1a', 0.05);
          } else if (v < 12) {
            c = v === 11 ? '#d29660' : v % 4 === 0 ? '#dca474' : '#e8b488';
            if (i % 8 === 0) c = '#d29660';
          } else {
            c = left ? '#fbdde6' : '#fdf3e0';
            if (left && (i + v) % 10 === 0 && v % 5 === 0) c = '#f7b8cc';
            if (!left && i % 8 < 4) c = '#fbecd6';
          }
          if (v === wallH - 1 || v === wallH - 2) c = kind === 'bedroom' ? '#a8782a' : '#8a5a3c';
          if (v < 2) c = '#8a5a3c';
          p.px(x, y, c);
        }
      }
    };
    wall(true); wall(false);
    p.rect(ox - n * 10 - 3, oy + n * 5 - wallH, 3, wallH + 1, '#8a5a3c');
    p.rect(ox + n * 10, oy + n * 5 - wallH, 3, wallH + 1, '#8a5a3c');
    p.rect(ox, oy - wallH, 1, wallH, '#b07a4a');

    // Cửa sang phòng khác (tường trái, ô 6–7)
    q.poly([q.pt(0, 6.1 + dg, 0), q.pt(0, 7.5 + dg, 0), q.pt(0, 7.5 + dg, 30), q.pt(0, 6.1 + dg, 30)], '#8a5a3c');
    q.poly([q.pt(0, 6.3 + dg, 0), q.pt(0, 7.3 + dg, 0), q.pt(0, 7.3 + dg, 28), q.pt(0, 6.3 + dg, 28)], kind === 'house' ? '#f7b8cc' : kind === 'bath' ? '#c8b8f0' : kind === 'kid' ? '#ffe08a' : '#b0e0f0');
    q.poly([q.pt(0, 6.45 + dg, 16), q.pt(0, 7.15 + dg, 16), q.pt(0, 7.15 + dg, 25), q.pt(0, 6.45 + dg, 25)], kind === 'house' ? '#ffc6dc' : kind === 'bath' ? '#e0d8f8' : kind === 'kid' ? '#fff2c0' : '#cdeef7');
    if (kind === 'house') {                                            // cửa sang phòng các con (tường phải): cửa vàng có ngôi sao hồng
      q.poly([q.pt(6.4, 0, 0), q.pt(7.8, 0, 0), q.pt(7.8, 0, 31), q.pt(6.4, 0, 31)], '#8a5a3c');
      q.poly([q.pt(6.6, 0, 0), q.pt(7.6, 0, 0), q.pt(7.6, 0, 29), q.pt(6.6, 0, 29)], '#ffe08a');
      q.poly([q.pt(6.75, 0, 3), q.pt(7.45, 0, 3), q.pt(7.45, 0, 12), q.pt(6.75, 0, 12)], '#ffd060');
      { const [x, y] = q.pt(7.1, 0, 21); for (const [dx, dy] of [[0, -3], [0, -2], [-1, -1], [0, -1], [1, -1], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [-1, 1], [0, 1], [1, 1], [-2, 2], [-1, 2], [1, 2], [2, 2]]) p.px(x + dx, y + dy, '#f59ab3'); }
      { const [dx, dy] = q.pt(7.4, 0, 13); p.rect(dx, dy, 2, 2, '#c08658'); }
      q.flat(6.5, 0.05, 0, 1.2, 0.5, '#b8d8f4');
    }
    if (kind === 'bedroom') {                                          // cửa sang phòng tắm (tường phải, ô 7.6–9): cửa trắng viền vàng
      q.poly([q.pt(7.6, 0, 0), q.pt(9.0, 0, 0), q.pt(9.0, 0, 31), q.pt(7.6, 0, 31)], '#c8902a');
      q.poly([q.pt(7.8, 0, 0), q.pt(8.8, 0, 0), q.pt(8.8, 0, 29), q.pt(7.8, 0, 29)], '#fff4ec');
      q.poly([q.pt(7.95, 0, 16), q.pt(8.65, 0, 16), q.pt(8.65, 0, 26), q.pt(7.95, 0, 26)], '#f8d8e4');
      q.poly([q.pt(7.95, 0, 3), q.pt(8.65, 0, 3), q.pt(8.65, 0, 13), q.pt(7.95, 0, 13)], '#f8d8e4');
      const [dx, dy] = q.pt(8.6, 0, 13); p.rect(dx, dy, 2, 2, '#e8b84a');
    }
    { const [x, y] = q.pt(0, 6.5 + dg, 12); p.rect(x, y, 2, 2, '#f6c64e'); }

    // Khung cửa sổ (tường phải, ô 3–5) — trời bên người ấy hiện đè lên
    q.poly([q.pt(2.8, 0, 13), q.pt(6.2, 0, 13), q.pt(6.2, 0, 40), q.pt(2.8, 0, 40)], '#8a5a3c');
    q.poly([q.pt(2.6, 0, 11), q.pt(6.4, 0, 11), q.pt(6.4, 0, 14), q.pt(2.6, 0, 14)], '#c08658');
    if (kind === 'bedroom') bedroomWalls(p, q);

    if (kind === 'kid') kidWalls(p, q);

    if (kind === 'bath') {
      // Bàn rửa mặt + gương tròn + kệ nến dọc tường trái
      q.box(0, 1, 0, 0.9, 1.6, 13, shade('#f6e2c8'));
      q.flat(0, 1, 13, 0.9, 1.6, '#fffaf6');
      { const [x, y] = q.pt(0.45, 1.8, 13); ellipse(p, x, y, 4, 1.8, '#cdeef7'); p.rect(x - 3, y - 4, 1, 4, '#c0c4d0'); }
      { const [x, y] = q.pt(0, 1.8, 27); ellipse(p, x, y, 6, 8, '#e8c070'); ellipse(p, x, y, 4.5, 6.5, '#e0f4fa'); p.px(x - 2, y - 3, '#ffffff'); p.px(x - 1, y - 4, '#ffffff'); }
      q.poly([q.pt(0, 0.1, 22), q.pt(0, 0.9, 22), q.pt(0, 0.9, 20), q.pt(0, 0.1, 20)], '#c08658');
      for (const g of [0.3, 0.6]) { const [x, y] = q.pt(0, g, 22); p.rect(x, y - 4, 2, 4, '#fffaf0'); p.px(x, y - 5, '#ffb347'); }
      // Thảm chân & giá khăn
      q.flat(3.6, 3.4, 0, 1.8, 0.9, '#c8b8f0'); q.flat(3.75, 3.5, 0, 1.5, 0.7, '#e0d8f8');
      q.poly([q.pt(0, 3.4, 20), q.pt(0, 4.6, 20), q.pt(0, 4.6, 19), q.pt(0, 3.4, 19)], '#c0c4d0');
      q.poly([q.pt(0, 3.5, 19), q.pt(0, 4.0, 19), q.pt(0, 4.0, 8), q.pt(0, 3.5, 8)], '#f7b8cc');
      q.poly([q.pt(0, 4.05, 19), q.pt(0, 4.5, 19), q.pt(0, 4.5, 10), q.pt(0, 4.05, 10)], '#bfe6ee');
    }

    if (kind === 'house') {
      // Bếp dọc tường trái: tủ, bồn rửa, bếp nấu, tủ lạnh
      q.box(0, 0, 0, 0.9, 3, 14, shade('#f7b8cc'));
      q.flat(0, 0, 14, 0.9, 3, '#fff6ee');
      q.flat(0.15, 0.4, 14, 0.6, 0.9, '#cdeef7');
      { const [x, y] = q.pt(0.1, 0.8, 18); p.rect(x, y, 1, 4, '#a8a8b8'); }
      for (const g of [1.6, 2.4]) { const [x, y] = q.pt(0.45, g, 14); ellipse(p, x, y, 3, 1.5, '#3a3a4a'); ellipse(p, x, y, 1.5, 0.8, '#ec8080'); }
      for (const g of [0.5, 1.5, 2.5]) { const [x, y] = q.pt(0.9, g, 8); p.rect(x - 1, y, 3, 1, '#f6c64e'); }
      q.box(0, 3.05, 0, 0.9, 1, 24, shade('#a8dcc8'));                  // tủ lạnh bạc hà (ngang tầm người)
      { const [x, y] = q.pt(0.9, 3.5, 16); p.rect(x, y, 1, 5, '#ffffff'); }
      // Kệ treo có hũ gia vị
      q.poly([q.pt(0, 0.2, 30), q.pt(0, 2.8, 30), q.pt(0, 2.8, 28), q.pt(0, 0.2, 28)], '#a06a48');
      for (let i = 0; i < 5; i++) { const [x, y] = q.pt(0, 0.5 + i * 0.5, 30); p.rect(x - 1, y - 4, 3, 4, FLOWERS[i]); }
      // Thảm cửa ra làng
      q.flat(4.2, 7.1, 0, 1.6, 0.8, '#f08aa6');
      q.flat(4.35, 7.2, 0, 1.3, 0.6, '#f7b8cc');
    }
  }, null);
}

export function shopInterior() {
  return makeSprite('in:shop:v2', 160, 120, p => {
    p.rect(0, 0, 160, 66, '#fbecd2');
    for (let x = 0; x < 160; x += 10) p.rect(x, 0, 5, 66, '#f6e2c4');
    for (const sy of [14, 32, 50]) {
      p.rect(6, sy, 148, 3, '#a06a48');
      const rand = seeded(`shelf${sy}`);
      for (let x = 10; x < 150; x += 9) {
        const c = ['#f08aa6', '#8db8ef', '#9fd067', '#f6c64e', '#b7a6e8', '#f7a98a'][Math.floor(rand() * 6)];
        const h = 4 + Math.floor(rand() * 6);
        p.rect(x, sy - h, 6, h, c);
        p.rect(x, sy - h, 6, 1, mix(c, '#ffffff', 0.45));
      }
    }
    for (let y = 66; y < 120; y += 8) for (let x = 0; x < 160; x += 8) p.rect(x, y, 8, 8, (x + y) % 16 ? '#f8e2c6' : '#fdf5e6');
    p.rect(44, 58, 72, 14, '#d9a06a'); p.rect(44, 58, 72, 3, '#ecc08e');
    p.rect(52, 52, 8, 6, '#f6c64e'); p.rect(53, 50, 6, 2, '#e8b04a');
    p.rect(70, 116, 20, 4, '#8a5a3c');
  }, null);
}

// ───────── Đồi ngắm cảnh ─────────

export type HillSky = 'dawn' | 'day' | 'sunset' | 'night' | 'meteor' | 'aurora';
const HILL_SKY: Record<HillSky, string[]> = {
  dawn: ['#5a5cc4', '#b07ad8', '#f7b8cc', '#ffc49a', '#fff0b8'],
  day: ['#2f8fe8', '#4fb0f5', '#8fd4ff', '#c8ecff'],
  sunset: ['#2e2a7a', '#7a3fa8', '#e0508a', '#ff7a4a', '#ffb347', '#ffe08a'],
  night: ['#060a2a', '#0f1848', '#1c2a6a', '#2e3a86'],
  meteor: ['#04061f', '#0c1240', '#1a1f5c', '#3a2f7a'],
  aurora: ['#02101f', '#06223a', '#0c3050', '#1a3a5a'],
};
const HORIZON = 90;

export function hillBackground(mode: HillSky) {
  return makeSprite(`hill:${mode}`, 192, 144, p => {
    const rand = seeded(`hill-${mode}`);
    const dark = mode === 'night' || mode === 'meteor' || mode === 'aurora';
    skyBands(p, HILL_SKY[mode], 0, HORIZON, 192);
    if (dark) {
      if (mode === 'meteor') {                                        // dải ngân hà
        for (let i = 0; i < 500; i++) {
          const t = rand(), x = t * 192, y = 70 - t * 60 + (rand() - 0.5) * 22;
          p.px(Math.floor(x), Math.floor(y), rand() < 0.5 ? '#5a4f9a' : '#7a6ab8');
        }
      }
      for (let i = 0; i < (mode === 'night' ? 70 : 110); i++) {
        const x = Math.floor(rand() * 192), y = Math.floor(rand() * (HORIZON - 14));
        const c = rand() < 0.2 ? '#ffe9a0' : '#ffffff';
        p.px(x, y, c);
        if (rand() < 0.12) { p.px(x - 1, y, mix(c, '#000033', 0.5)); p.px(x + 1, y, mix(c, '#000033', 0.5)); p.px(x, y - 1, mix(c, '#000033', 0.5)); p.px(x, y + 1, mix(c, '#000033', 0.5)); }
      }
      if (mode === 'night') { ellipse(p, 40, 22, 9, 9, '#fff6c8'); ellipse(p, 44, 19, 8, 8, HILL_SKY.night[0]); }
    } else if (mode === 'sunset' || mode === 'dawn') {
      const sx = mode === 'sunset' ? 130 : 56, r = mode === 'sunset' ? 15 : 11;
      ellipse(p, sx, HORIZON, r + 8, r + 6, mix(HILL_SKY[mode][4], '#ffffff', 0.25));
      ellipse(p, sx, HORIZON, r, r, mode === 'sunset' ? '#fbe6a0' : '#fff1b8');
      for (const [cx, cy, w] of [[40, 30, 30], [150, 22, 26], [90, 46, 36], [170, 56, 20]]) {
        p.rect(cx - w / 2, cy, w, 2, mode === 'sunset' ? '#f4b0c6' : '#ffd6e6');
        p.rect(cx - w / 2 + 4, cy + 2, w - 8, 1, mode === 'sunset' ? '#c8508a' : '#d8a8d8');
      }
    } else {
      ellipse(p, 150, 18, 7, 7, '#fff6a8'); ellipse(p, 150, 18, 5, 5, '#ffe14a');
      for (const [cx, cy] of [[40, 22], [100, 34], [168, 46]]) {
        ellipse(p, cx, cy, 12, 4, '#ffffff'); ellipse(p, cx - 6, cy - 2, 6, 4, '#ffffff'); ellipse(p, cx + 5, cy - 3, 7, 4.5, '#ffffff');
        p.rect(cx - 10, cy + 2, 20, 1, '#d8ecff');
      }
    }
    // Núi xa hai lớp
    const far = dark ? '#2a2a6a' : mode === 'sunset' ? '#8a4a9a' : mode === 'dawn' ? '#9a7ac8' : '#6aa0d8';
    const near = dark ? '#1a2050' : mode === 'sunset' ? '#5a2f7a' : mode === 'dawn' ? '#6a5aa8' : '#4a88c0';
    const sunX = mode === 'sunset' ? 130 : mode === 'dawn' ? 56 : -999;
    for (let x = 0; x < 192; x++) {
      const valley = Math.min(1, Math.max(0.15, Math.abs(x - sunX) / 34));   // thung lũng chừa chỗ cho mặt trời
      const h1 = (14 + Math.sin(x / 19) * 7 + Math.sin(x / 7) * 2) * valley;
      p.rect(x, HORIZON - h1, 1, h1, far);
      if (!dark && h1 > 19) p.px(x, HORIZON - Math.floor(h1), '#ffffff');
      const h2 = (7 + Math.sin(x / 11 + 2) * 4) * valley;
      p.rect(x, HORIZON - h2, 1, h2, near);
    }
    // Biển và bóng phản chiếu
    const sea = dark ? '#16245a' : mode === 'sunset' ? '#b04a8a' : mode === 'dawn' ? '#8a8ad8' : '#1fa0e0';
    p.rect(0, HORIZON, 192, 36, sea);
    for (let i = 0; i < 40; i++) p.rect(Math.floor(rand() * 192), HORIZON + 2 + Math.floor(rand() * 15), 2 + Math.floor(rand() * 4), 1, mix(sea, '#ffffff', 0.35));
    const glint = mode === 'sunset' ? [130, '#fbe6a0'] : mode === 'dawn' ? [56, '#fff1b8'] : mode === 'night' ? [40, '#fff6c8'] : null;
    if (glint) for (let y = HORIZON + 1; y < HORIZON + 18; y += 2) { const w = 10 - (y - HORIZON) / 3; p.rect((glint[0] as number) - w / 2 + ((y / 2) % 2) * 2, y, w, 1, glint[1] as string); }
    // Đồi cỏ phía trước
    const grass = dark ? '#2a5a4a' : mode === 'sunset' ? '#6a9a4a' : '#9fd067';
    const grassL = dark ? '#3a7058' : mode === 'sunset' ? '#8ab85a' : '#b4dc7c';
    for (let x = 0; x < 192; x++) {
      const top = 104 + Math.round(((x - 96) / 96) ** 2 * 16);
      p.rect(x, top, 1, 144 - top, grass);
      p.rect(x, top, 1, 2, grassL);
    }
    for (let i = 0; i < 260; i++) tuft(p, Math.floor(rand() * 192), 112 + Math.floor(rand() * 32), rand() < 0.5 ? mix(grass, '#000000', 0.15) : grassL);
    for (let i = 0; i < 26; i++) flowerDot(p, Math.floor(rand() * 192), 116 + Math.floor(rand() * 26), dark ? '#c8d0ff' : FLOWERS[i % FLOWERS.length]);
    // Hàng rào gỗ bên phải
    for (let x = 150; x < 192; x += 7) { p.rect(x, 104 + Math.round(((x - 96) / 96) ** 2 * 16) - 8, 2, 10, dark ? '#5a3a3a' : '#a8602f'); }
    for (let x = 150; x < 192; x++) p.px(x, 104 + Math.round(((x - 96) / 96) ** 2 * 16) - 5, dark ? '#5a3a3a' : '#c98a52');
  }, null);
}

/** Ghế dài trên đồi */
export function hillBenchSprite() {
  return makeSprite('hill-bench', 34, 16, p => {
    p.rect(1, 1, 32, 3, '#c98a52'); p.rect(1, 5, 32, 3, '#c98a52'); p.rect(1, 1, 32, 1, '#e8b07a');
    p.rect(0, 9, 34, 3, '#ecc18e'); p.rect(0, 9, 34, 1, '#ffc890');
    for (const x of [3, 29]) { p.rect(x, 1, 2, 15, '#8a5a3c'); }
  }, OUT);
}

export const sunSprite = () => makeSprite('sun', 10, 10, p => p.map([
  '...YYYY...', '.YYYYYYYY.', '.YYWWYYYY.', 'YYYWYYYYYY', 'YYYYYYYYYY', 'YYYYYYYYYY', 'YYYYYYYYYY', '.YYYYYYYY.', '.YYYYYYYY.', '...YYYY...',
], { Y: '#f6c64e', W: '#fff4c2' }), '#f29a2e');
export const moonSprite = () => makeSprite('moon', 9, 9, p => p.map([
  '...MMM...', '..MMM....', '.MMM.....', 'MMMM.....', 'MMMM.....', 'MMMM.....', '.MMMM....', '..MMMMM..', '...MMM...',
], { M: '#fff2c4' }), '#d9c27a');
export const sparkleSprite = () => makeSprite('sparkle', 7, 7, p => p.map([
  '...W...', '...W...', '..WYW..', 'WWYYYWW', '..WYW..', '...W...', '...W...',
], { W: '#ffffff', Y: '#fbe6a0' }), null);

/** Trang trí phòng các con: cầu vồng & mây dán tường, sao, đèn dây, dây cờ, rèm sao, tranh con vẽ, thước đo chiều cao, thảm cầu vồng */
/** Phòng ngủ hoàng gia: rèm nhung đỏ buộc tua vàng, đèn chùm pha lê, đèn tường nến, vòng hoa hồng, thảm nhung trái tim */
function bedroomWalls(p: Pen, q: ReturnType<typeof isoPen>) {
  const GOLD = '#e8b84a', GOLD_L = '#ffe08a', RED = '#9a2244', RED_D = '#6e1632';
  // rèm nhung hai bên cửa sổ + lớp voan hồng + diềm rèm uốn sóng + dây tua vàng
  for (const [a, b] of [[2.85, 3.6], [5.4, 6.15]]) q.poly([q.pt(a, 0, 13), q.pt(b, 0, 13), q.pt(b, 0, 40), q.pt(a, 0, 40)], '#fbe0e8');
  for (const [a, b, s] of [[2.0, 3.0, 1], [6.0, 7.0, -1]] as const) {
    for (let z = 2; z < 43; z++) { const w = z > 18 && z < 26 ? 0.55 : 1; const a2 = s > 0 ? a : b - (b - a) * w, b2 = s > 0 ? a + (b - a) * w : b; const [x0, y0] = q.pt(a2, 0, z), [x1] = q.pt(b2, 0, z); for (let x = x0; x <= x1; x++) p.px(x, y0 + Math.round((x - x0) / 2), (x - x0) % 3 === 0 ? RED_D : RED); }
    const [tx, ty] = q.pt(s > 0 ? a + 0.5 : b - 0.5, 0, 22); p.rect(tx - 2, ty, 5, 2, GOLD); p.px(tx, ty + 2, GOLD); p.rect(tx - 1, ty + 3, 3, 3, GOLD_L);
  }
  for (let k = 0; k <= 50; k++) { const g = 2.0 + k * 0.1, sag = Math.abs(Math.sin(k / 50 * Math.PI * 3)) * 4; const [x, y] = q.pt(g, 0, 44 - sag); p.rect(x, y, 1, 4, RED); p.px(x, y + 4, GOLD); }
  // đèn tường nến (hai trên tường trái, hai trên tường phải)
  const sconce = (x: number, y: number) => { p.rect(x - 2, y + 4, 5, 1, GOLD); p.rect(x, y + 2, 1, 4, GOLD); p.rect(x - 2, y + 1, 1, 3, GOLD); p.rect(x + 2, y + 1, 1, 3, GOLD); for (const dx of [-2, 0, 2]) { p.rect(x + dx, y - 2, 1, 3, '#fffaf0'); p.px(x + dx, y - 3, '#ffb347'); p.px(x + dx, y - 4, '#fff2a0'); } };
  for (const g of [1.3, 5.2]) { const [x, y] = q.pt(0, g, 27); sconce(x, y); }
  for (const g of [1.2, 9.5]) { const [x, y] = q.pt(g, 0, 27); sconce(x, y); }
  // vòng hoa hồng rủ dọc mép trên hai bức tường
  for (const left of [true, false]) for (let k = 0; k < 20; k++) { const g = 0.25 + k * 0.48, sag = Math.sin(((k % 4) / 4) * Math.PI) * 3; const [x, y] = left ? q.pt(0, g, 36 - sag) : q.pt(g, 0, 36 - sag); if (!left && g > 1.9 && g < 7.2) continue; p.px(x - 1, y + 1, '#5a9a4a'); p.px(x + 1, y + 1, '#6aaa5a'); p.rect(x - 1, y - 1, 2, 2, k % 3 ? '#e8406a' : '#ffb0c8'); p.px(x, y - 1, '#ffffff'); }
  // vương miện & trái tim trên khung cửa trái
  { const [x, y] = q.pt(0, 8.8, 36); p.rect(x - 4, y, 9, 2, GOLD); for (const dx of [-4, 0, 4]) p.rect(x + dx, y - 3, 1, 3, GOLD); p.px(x - 2, y - 2, GOLD); p.px(x + 2, y - 2, GOLD); p.px(x, y - 4, GOLD_L); p.px(x, y + 1, '#e8406a'); }
  // đèn chùm pha lê treo ở góc trần
  { const x = 108, y = 6; p.rect(x, 0, 1, y, GOLD);
    for (let k = -3; k <= 3; k++) { const ax = x + k * 3, ay = y + 6 - Math.round(Math.abs(k) * 0.6); p.rect(Math.min(x, ax), y + 4, Math.abs(ax - x) + 1, 1, GOLD); p.rect(ax, ay - 3, 1, 3, '#fffaf0'); p.px(ax, ay - 4, '#ffb347'); p.px(ax, ay - 5, '#fff2a0'); p.px(ax, ay + 1, '#d8f4ff'); p.px(ax, ay + 2, '#ffffff'); }
    ellipse(p, x + 0.5, y + 5, 4, 2, GOLD); p.px(x, y + 8, '#d8f4ff'); p.px(x, y + 9, '#ffffff'); p.px(x, y + 10, '#d8f4ff'); }
  // thảm nhung đỏ viền vàng, giữa có huy hiệu trái tim; cánh hoa rải quanh
  { const [x, y] = q.pt(5.4, 6.0, 0);
    for (const [rx, c] of [[46, '#7a1830'], [44, GOLD], [42, '#9a2244'], [36, '#b8324e'], [34, GOLD], [32, '#9a2244']] as const) ellipse(p, x, y, rx, rx / 2, c);
    for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; p.px(Math.round(x + Math.cos(a) * 39), Math.round(y + Math.sin(a) * 19.5), GOLD_L); }
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; p.rect(Math.round(x + Math.cos(a) * 25), Math.round(y + Math.sin(a) * 12.5), 2, 1, '#e8b84a'); }
    ellipse(p, x - 3, y - 1, 4, 3, '#f8c4d2'); ellipse(p, x + 3, y - 1, 4, 3, '#f8c4d2'); for (let r = 0; r < 6; r++) p.rect(x - 6 + r, y + 1 + r, 12 - r * 2, 1, '#f8c4d2'); }
  const rnd = seeded('petals');
  for (let k = 0; k < 40; k++) { const [x, y] = q.pt(1 + rnd() * 8.5, 1 + rnd() * 8.5, 0); p.rect(x, y, 2, 1, ['#e8406a', '#ff7a9a', '#c82a4a', '#ffb0c8'][k % 4]); }
}

function kidWalls(p: Pen, q: ReturnType<typeof isoPen>) {
  const dot = (x: number, y: number, c: string, s = 2) => p.rect(x, y, s, s, c);
  // cầu vồng dán tường trái (gy 1.6–5.2), mây hai đầu
  const bands = ['#f59ab3', '#f6b884', '#f6e08a', '#a8dc9a', '#9cc8f4', '#c4a8f0'];
  bands.forEach((c, b) => { const r = 1.75 - b * 0.17; for (let t = 0; t <= Math.PI; t += 0.035) { const [x, y] = q.pt(0, 4.3 + Math.cos(t) * r, 17 + Math.sin(t) * r * 9); dot(x, y, c); } });
  for (const g of [2.45, 6.15]) { const [x, y] = q.pt(0, g, 18); ellipse(p, x, y, 6, 3, '#ffffff'); ellipse(p, x - 3, y - 2, 3.5, 3, '#ffffff'); ellipse(p, x + 3, y - 2.5, 3.5, 3.2, '#ffffff'); }
  // sao vàng rải tường trái
  for (const [g, z] of [[0.7, 36], [2.2, 40], [4.6, 39], [6.9, 33], [7.6, 38], [1.2, 26], [7.4, 24], [9.3, 40]]) { const [x, y] = q.pt(0, g, z); dot(x, y - 1, '#f6c64e', 1); dot(x - 1, y, '#f6c64e', 3); p.px(x, y + 1, '#f6c64e'); }
  // đèn dây dọc mép trên tường trái
  for (let k = 0; k < 19; k++) { const g = 0.3 + k * 0.5, sag = Math.sin(((k % 5) / 4) * Math.PI) * 2.5; const [x, y] = q.pt(0, g, 42 - sag); p.px(x, y - 1, '#8a7a6a'); dot(x, y, ['#fff2a0', '#ffc8e0', '#c8f0ff'][k % 3]); }
  // dây cờ đuôi nheo trên tường phải
  for (let k = 0; k < 19; k++) {
    const g = 0.35 + k * 0.5, sag = Math.sin(((k % 5) / 4) * Math.PI) * 3; const [x, y] = q.pt(g, 0, 43 - sag);
    const c = ['#f59ab3', '#8db8ef', '#f6c64e', '#a5d470', '#c4a8f0'][k % 5];
    p.px(x, y - 1, '#c8a080'); for (let j = 0; j < 4; j++) p.rect(x - 1 + Math.floor(j / 2), y + j, 4 - j, 1, c);
  }
  // rèm sao hai bên cửa sổ
  for (const [a, b] of [[2.2, 2.95], [6.05, 6.8]]) {
    q.poly([q.pt(a, 0, 8), q.pt(b, 0, 8), q.pt(b, 0, 40), q.pt(a, 0, 40)], '#c4d8f8');
    for (let z = 12; z < 40; z += 6) { const [x, y] = q.pt((a + b) / 2, 0, z); p.px(x, y, '#ffffff'); p.px(x - 1, y, '#fff6b0'); }
  }
  q.poly([q.pt(2.0, 0, 40), q.pt(7.0, 0, 40), q.pt(7.0, 0, 41), q.pt(2.0, 0, 41)], '#e8c46a');
  // khung ảnh gia đình & bảng tên các con (tường phải, gx 7.4–9)
  q.poly([q.pt(7.3, 0, 24), q.pt(8.6, 0, 24), q.pt(8.6, 0, 34), q.pt(7.3, 0, 34)], '#e8c46a'); q.poly([q.pt(7.45, 0, 25), q.pt(8.45, 0, 25), q.pt(8.45, 0, 33), q.pt(7.45, 0, 33)], '#fff6e8');
  for (const [g, c] of [[7.7, '#f59ab3'], [8.0, '#8db8ef'], [8.25, '#a5d470']] as const) { const [x, y] = q.pt(g, 0, 28); ellipse(p, x, y - 1, 1.6, 1.6, '#f3c9a8'); p.rect(x - 1, y + 1, 3, 2, c); }
  // tranh các con vẽ dán tường phải
  for (const [g, z, c] of [[0.5, 28, '#fff6d0'], [1.25, 22, '#e8f6ff']] as const) {
    q.poly([q.pt(g, 0, z), q.pt(g + 0.6, 0, z), q.pt(g + 0.6, 0, z + 8), q.pt(g, 0, z + 8)], c);
    const [x, y] = q.pt(g + 0.3, 0, z + 4);
    ellipse(p, x - 1, y - 1, 1.5, 1.5, '#f6c64e'); p.rect(x - 3, y + 2, 6, 1, '#8ad08a'); p.px(x + 2, y, '#e8606a'); p.px(x + 2, y + 1, '#e8606a');
  }
  // thước đo chiều cao hươu cao cổ (tường phải, sát góc)
  for (let z = 2; z < 34; z++) { const [x, y] = q.pt(9.55, 0, z); p.rect(x, y, 3, 1, Math.floor(z / 4) % 2 ? '#f6c64e' : '#f6dc94'); if (z % 4 === 0) p.px(x - 1, y, '#a06a48'); }
  { const [x, y] = q.pt(9.6, 0, 34); ellipse(p, x + 1, y - 2, 3, 2.5, '#f6c64e'); p.px(x + 2, y - 3, '#3a2a2a'); p.px(x - 1, y - 5, '#a06a48'); p.px(x + 2, y - 5, '#a06a48'); }
  // trăng khuyết trên cửa
  { const [x, y] = q.pt(0, 8.8, 37); ellipse(p, x, y, 4.5, 4.5, '#f6c64e'); ellipse(p, x + 2, y - 1, 3.5, 3.5, '#e3eafb'); }
  // thảm tròn cầu vồng giữa phòng
  { const [x, y] = q.pt(6, 6.6, 0); for (const [rx, c] of [[32, '#f6c4d4'], [27, '#fde2b8'], [22, '#d6ecc4'], [17, '#cfe2f8'], [12, '#e6d8f6'], [6, '#fffaf4']] as const) ellipse(p, x, y, rx, rx / 2, c); }
  // thảm mây trước hai giường
  for (const g of [4.5, 6.5, 8.4]) { const [x, y] = q.pt(g + 0.5, 3.6, 0); ellipse(p, x, y, 9, 3.5, '#ffffff'); ellipse(p, x - 5, y - 1, 4, 2.5, '#ffffff'); ellipse(p, x + 5, y - 1, 4, 2.5, '#ffffff'); }
  // khối gỗ & xe đồ chơi trên sàn
  for (const [g, h, c] of [[8.6, 8.2, '#e8606a'], [8.9, 8.0, '#6aa8e0'], [8.75, 8.5, '#f6c64e']] as const) { const [x, y] = q.pt(g, h, 0); p.rect(x - 2, y - 4, 4, 4, c); p.px(x - 1, y - 3, '#ffffff'); }
  { const [x, y] = q.pt(7.2, 9.0, 0); p.rect(x - 4, y - 4, 8, 3, '#8ad08a'); p.rect(x - 2, y - 6, 4, 2, '#bfe6ee'); p.rect(x - 3, y - 1, 2, 2, '#3a3a4a'); p.rect(x + 2, y - 1, 2, 2, '#3a3a4a'); }
}
