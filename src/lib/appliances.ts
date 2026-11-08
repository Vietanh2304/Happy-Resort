// Đồ gia dụng (nhìn nghiêng) và đồ trang trí nông trại (nhìn chính diện).
import type { Art } from './furniture';
import { ellipse, isoSprite, shade, type IsoPen } from './iso';
import { makeSprite, mix, type Pen } from './pixel';

const WOOD = '#d29a63';
const WOOD_D = '#a8703f';

function leftFace(q: IsoPen, g0: number, g1: number, gy: number, z0: number, z1: number, c: string) {
  q.poly([q.pt(g0, gy, z0), q.pt(g1, gy, z0), q.pt(g1, gy, z1), q.pt(g0, gy, z1)], c);
}
// ───────── Gia dụng ─────────

const tv = () => isoSprite('tv', 2, 1, 30, q => {
  q.box(0.05, 0.15, 0, 1.9, 0.75, 9, shade(WOOD));
  leftFace(q, 0.15, 0.95, 0.9, 2, 7, mix(WOOD, '#000', 0.12)); leftFace(q, 1.05, 1.85, 0.9, 2, 7, mix(WOOD, '#000', 0.12));
  q.box(0.85, 0.4, 9, 0.3, 0.2, 2, shade('#5a5a6a'));
  q.box(0.15, 0.4, 11, 1.7, 0.12, 15, shade('#3a3a4a'));
  leftFace(q, 0.25, 1.75, 0.52, 12, 25, '#7ac0e8');
  leftFace(q, 0.25, 1.75, 0.52, 20, 25, '#a8dcf5');
  const [x, y] = q.pt(0.5, 0.52, 23); q.px(x, y, '#ffffff'); q.px(x + 1, y, '#ffffff');
}, '#3a2a2a');

const fridge = () => isoSprite('fridge', 1, 1, 38, q => {
  q.box(0.1, 0.1, 0, 0.8, 0.8, 34, shade('#a8dcc8'));
  leftFace(q, 0.1, 0.9, 0.9, 21, 22, '#7ab8a4');
  for (const z of [12, 26]) { const [x, y] = q.pt(0.8, 0.9, z); q.rect(x, y - 3, 1, 5, '#e8f4f0'); }
  const [hx, hy] = q.pt(0.35, 0.9, 28); q.px(hx, hy, '#f08aa6'); q.px(hx + 2, hy, '#f08aa6'); q.rect(hx, hy + 1, 3, 1, '#f08aa6'); q.px(hx + 1, hy + 2, '#f08aa6');
  const [sx, sy] = q.pt(0.3, 0.9, 16); q.rect(sx, sy, 3, 3, '#f6c64e');
});

const washer = () => isoSprite('washer', 1, 1, 22, q => {
  q.box(0.1, 0.1, 0, 0.8, 0.8, 17, shade('#f4f4f8'));
  leftFace(q, 0.1, 0.9, 0.9, 13, 17, '#d8dcec');
  const [x, y] = q.pt(0.5, 0.9, 7);
  ellipse(q, x, y, 4, 4, '#9aa0b8'); ellipse(q, x, y, 3, 3, '#8db8ef'); q.px(x - 1, y - 1, '#ffffff');
  const [bx, by] = q.pt(0.25, 0.9, 15); q.px(bx, by, '#f08aa6'); q.px(bx + 2, by + 1, '#7cc8b4');
});

const stove = () => isoSprite('stove', 1, 1, 20, q => {
  q.box(0.1, 0.1, 0, 0.8, 0.8, 15, shade('#fbf1dc'));
  for (const [a, b] of [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) { const [x, y] = q.pt(a, b, 15); ellipse(q, x, y, 2, 1, '#3a3a4a'); }
  leftFace(q, 0.2, 0.8, 0.9, 3, 10, '#4a3a3a'); leftFace(q, 0.28, 0.72, 0.9, 4, 9, '#f8a85a');
  const [x, y] = q.pt(0.3, 0.3, 18); q.rect(x - 2, y, 5, 3, '#c0c4d0'); q.px(x, y - 2, '#ffffff');      // nồi đang sôi
});

const kitchenCounter = () => isoSprite('kitchen_counter', 2, 1, 22, q => {
  q.box(0.05, 0.1, 0, 1.9, 0.8, 13, shade('#f7b8cc'));
  q.flat(0.05, 0.1, 13, 1.9, 0.8, '#fdf6ee');
  q.flat(0.3, 0.25, 13, 0.6, 0.5, '#bfe3f2');
  const [fx, fy] = q.pt(0.6, 0.2, 13); q.rect(fx, fy - 5, 1, 5, '#a8a8b8'); q.rect(fx, fy - 5, 3, 1, '#a8a8b8');
  for (const g of [0.5, 1.5]) { const [x, y] = q.pt(g, 0.9, 7); q.rect(x - 1, y, 3, 1, '#f6c64e'); }
  const [px_, py] = q.pt(1.5, 0.45, 13); ellipse(q, px_, py - 3, 2.5, 3, '#a5d470'); q.rect(px_ - 1, py - 1, 3, 2, '#dc9a6a');
});

const microwave = () => isoSprite('microwave', 1, 1, 22, q => {
  q.box(0.15, 0.15, 0, 0.7, 0.7, 10, shade(WOOD));
  q.box(0.15, 0.2, 10, 0.7, 0.6, 7, shade('#f4f4f8'));
  leftFace(q, 0.2, 0.6, 0.8, 11, 16, '#4a4a5a'); leftFace(q, 0.65, 0.8, 0.8, 11, 16, '#c8ccd8');
});

const diningTable = () => isoSprite('dining_table', 2, 2, 24, q => {
  const w = shade(WOOD);
  for (const [a, b] of [[0.2, 0.2], [1.7, 0.2], [0.2, 1.7], [1.7, 1.7]]) q.box(a, b, 0, 0.12, 0.12, 11, w);
  q.box(0.1, 0.1, 11, 1.8, 1.8, 2, w);
  q.flat(0.3, 0.3, 13, 1.4, 1.4, '#fffaf0');
  q.flat(0.3, 0.8, 13, 1.4, 0.4, '#f7b8cc');
  const [x, y] = q.pt(1, 1, 13);
  q.rect(x - 1, y - 5, 3, 5, '#bfe3f2'); ellipse(q, x, y - 7, 3, 2.5, '#f59ab3'); q.px(x - 1, y - 8, '#ffffff');
}, '#5a3a2e');

const armchair = () => isoSprite('armchair', 1, 1, 22, q => {
  const c = shade('#f6c64e');
  q.box(0.1, 0.15, 0, 0.8, 0.75, 7, c);
  q.box(0.1, 0.08, 7, 0.8, 0.22, 10, c);
  q.box(0.1, 0.15, 7, 0.16, 0.75, 4, c); q.box(0.74, 0.15, 7, 0.16, 0.75, 4, c);
  q.flat(0.3, 0.35, 7, 0.4, 0.45, '#fbe08a');
  q.box(0.35, 0.3, 7, 0.3, 0.12, 4, shade('#f59ab3'));
});

const dresser = () => isoSprite('dresser:v2', 2, 1, 40, q => {
  // bàn trang điểm: mặt bàn trắng hồng, 4 chân mảnh, ngăn kéo giữa
  for (const [a, b] of [[0.12, 0.25], [1.8, 0.25], [0.12, 0.8], [1.8, 0.8]]) q.box(a, b, 0, 0.08, 0.08, 11, shade('#e8c8a8'));
  q.box(0.05, 0.15, 11, 1.9, 0.75, 3, shade('#fbeee4'));
  leftFace(q, 0.6, 1.4, 0.9, 8, 11, '#f2dcc8'); { const [x, y] = q.pt(1, 0.9, 9.5); q.px(x, y, '#d29a63'); }
  // gương bầu dục lớn viền vàng + bóng đèn
  const [mx, my] = q.pt(1, 0.3, 14);
  ellipse(q, mx, my - 11, 7, 10, '#e8c070'); ellipse(q, mx, my - 11, 5.5, 8.5, '#d7ecf7'); q.rect(mx - 3, my - 16, 1, 4, '#ffffff'); q.px(mx - 2, my - 17, '#ffffff');
  for (const [dx, dy] of [[-7, -16], [7, -16], [-8, -9], [8, -9], [0, -22]]) { q.px(mx + dx, my + dy, '#fff1a8'); q.px(mx + dx, my + dy - 1, '#ffffff'); }
  // nước hoa, son, hộp phấn, lọ hoa
  const [ax, ay] = q.pt(0.35, 0.55, 14); q.rect(ax - 1, ay - 4, 3, 4, '#f59ab3'); q.px(ax, ay - 5, '#e8c070');
  const [bx, by] = q.pt(0.55, 0.7, 14); q.rect(bx, by - 3, 1, 3, '#e8604a'); q.px(bx, by - 4, '#c8483a');
  const [cx, cy] = q.pt(1.55, 0.6, 14); ellipse(q, cx, cy - 1, 2, 1, '#c8a2e8'); q.px(cx, cy - 2, '#ffffff');
  const [dx, dy] = q.pt(1.75, 0.45, 14); q.rect(dx - 1, dy - 3, 2, 3, '#a8d8f0'); ellipse(q, dx, dy - 5, 2, 1.6, '#f59ab3'); q.px(dx - 1, dy - 6, '#f6c64e');
});

const piano = () => isoSprite('piano', 2, 1, 30, q => {
  const c = shade('#3a3040');
  q.box(0.05, 0.1, 0, 1.9, 0.5, 24, c);
  q.box(0.05, 0.55, 9, 1.9, 0.35, 2, shade('#4a4050'));
  leftFace(q, 0.1, 1.9, 0.9, 10.5, 11.5, '#fffaf0');
  for (let g = 0.2; g < 1.9; g += 0.18) { const [x, y] = q.pt(g, 0.9, 11.5); q.px(x, y - 1, '#3a3040'); }
  for (const [a, b] of [[0.15, 0.6], [1.75, 0.6]]) q.box(a, b, 0, 0.1, 0.1, 9, c);
  const [nx, ny] = q.pt(1, 0.6, 20); q.rect(nx - 3, ny, 6, 4, '#fffaf0'); q.px(nx - 1, ny + 1, '#3a3040'); q.px(nx + 1, ny + 2, '#3a3040');
}, '#2a2030');

const aquarium = () => isoSprite('aquarium', 2, 1, 28, q => {
  q.box(0.05, 0.15, 0, 1.9, 0.75, 9, shade(WOOD));
  q.box(0.1, 0.2, 9, 1.8, 0.65, 14, { top: '#d0f0f8', left: '#8fd6e8', right: '#6cc0dc' });
  leftFace(q, 0.1, 1.9, 0.85, 9, 12, '#e8d8a8');
  for (const [g, z, c] of [[0.5, 16, '#f7a98a'], [1.2, 19, '#f6c64e'], [1.5, 14, '#f59ab3']] as const) { const [x, y] = q.pt(g, 0.85, z); q.rect(x, y, 3, 2, c); q.px(x + 3, y, c); }
  const [wx, wy] = q.pt(0.3, 0.85, 12); q.rect(wx, wy - 6, 1, 6, '#86c257'); q.rect(wx + 2, wy - 4, 1, 4, '#a5d470');
});

const recordPlayer = () => isoSprite('record_player', 1, 1, 20, q => {
  q.box(0.1, 0.15, 0, 0.8, 0.75, 10, shade(WOOD_D));
  q.box(0.1, 0.15, 10, 0.8, 0.75, 2, shade('#e8d8c0'));
  const [x, y] = q.pt(0.5, 0.5, 12); ellipse(q, x, y, 5, 2.5, '#2a2a3a'); ellipse(q, x, y, 1.5, 0.8, '#f08aa6');
  q.rect(x + 3, y - 3, 1, 3, '#c0c4d0');
});

const fan = () => isoSprite('standing_fan', 1, 1, 30, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  ellipse(q, x, y, 4, 2, '#f4f4f8'); q.rect(x, y - 18, 1, 18, '#e0e0ea');
  ellipse(q, x, y - 22, 6, 6, '#bfe3f2'); ellipse(q, x, y - 22, 4.5, 4.5, '#e8f6fb');
  for (const [dx, dy] of [[-2, -1], [2, 1], [1, -2], [-1, 2]]) q.px(x + dx, y - 22 + dy, '#8db8ef');
  q.px(x, y - 22, '#f08aa6');
});

const bathtub = () => isoSprite('bathtub', 2, 1, 16, q => {
  q.box(0.05, 0.1, 0, 1.9, 0.8, 9, shade('#fbfbff'));
  q.flat(0.2, 0.25, 9, 1.6, 0.5, '#bfe3f2');
  for (const [g, d] of [[0.4, 0.4], [0.8, 0.5], [1.3, 0.35], [1.6, 0.55]]) { const [x, y] = q.pt(g, d, 10); ellipse(q, x, y, 2, 1.5, '#ffffff'); }
  const [dx, dy] = q.pt(1.2, 0.45, 10); q.rect(dx, dy - 2, 3, 2, '#f6c64e'); q.px(dx + 3, dy - 2, '#f7a98a');   // vịt cao su
});

const coatRack = () => isoSprite('coat_rack', 1, 1, 32, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  ellipse(q, x, y, 3, 1.5, WOOD_D); q.rect(x, y - 28, 1, 28, WOOD_D);
  q.rect(x - 3, y - 26, 7, 1, WOOD_D);
  q.rect(x - 4, y - 25, 3, 9, '#f59ab3'); q.rect(x + 2, y - 25, 3, 6, '#f6c64e'); ellipse(q, x + 3, y - 18, 2, 1.5, '#8db8ef');
});

const beanBag = () => isoSprite('bean_bag', 1, 1, 12, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  ellipse(q, x, y - 4, 8, 5, '#f59ab3'); ellipse(q, x - 1, y - 6, 5, 3, '#f7b8cc'); ellipse(q, x - 3, y - 7, 1.5, 1, '#fde6ee');
});

const riceCooker = () => isoSprite('rice_cooker', 1, 1, 16, q => {
  q.box(0.15, 0.15, 0, 0.7, 0.7, 8, shade(WOOD));
  const [x, y] = q.pt(0.5, 0.5, 8); ellipse(q, x, y - 3, 4.5, 3.5, '#fbfbff'); ellipse(q, x, y - 5, 3.5, 1.5, '#f7b8cc'); q.px(x, y - 7, '#a8a8b8');
});

const airCon = () => makeSprite('wall:aircon', 20, 9, p => {
  p.rect(0, 0, 20, 8, '#fbfbff'); p.rect(0, 0, 20, 1, '#ffffff'); p.rect(2, 5, 16, 2, '#d8dcec');
  p.px(17, 2, '#7cc8b4'); for (let x = 3; x < 17; x += 2) p.px(x, 6, '#b8bcd0');
}, '#6a6a7a');
const wallTv = () => makeSprite('wall:tv', 20, 13, p => {
  p.rect(0, 0, 20, 13, '#3a3a4a'); p.rect(1, 1, 18, 10, '#7ac0e8'); p.rect(1, 1, 18, 4, '#a8dcf5');
  p.rect(3, 7, 4, 3, '#a5d470'); p.rect(12, 6, 5, 4, '#f6c64e');
}, '#2a2a3a');
const curtainWindow = () => makeSprite('wall:window', 18, 16, p => {
  p.rect(2, 1, 14, 13, '#c08658'); p.rect(3, 2, 12, 11, '#bfe3f2'); p.rect(8, 2, 2, 11, '#c08658'); p.rect(3, 7, 12, 1, '#c08658');
  p.rect(0, 0, 4, 16, '#f7b8cc'); p.rect(14, 0, 4, 16, '#f7b8cc'); p.rect(0, 0, 18, 2, '#f59ab3');
  p.px(5, 3, '#ffffff'); p.px(6, 4, '#ffffff');
}, '#5a3a2e');

// ───────── Đồ nông trại (nhìn chính diện) ─────────

const scarecrow = () => makeSprite('f:scarecrow', 18, 28, p => {
  p.rect(8, 10, 2, 18, '#a8703f'); p.rect(1, 12, 16, 2, '#a8703f');
  p.rect(5, 11, 8, 9, '#8db8ef'); p.rect(5, 15, 8, 1, '#6a8ac8'); p.px(8, 13, '#f6c64e');
  for (const x of [0, 17]) p.rect(x, 12, 1, 3, '#f6d68a');
  ellipse(p, 9, 6, 4, 4, '#f6d6a8'); p.px(7, 6, '#3a2838'); p.px(10, 6, '#3a2838'); p.rect(8, 8, 2, 1, '#c0606a');
  p.rect(3, 2, 12, 2, '#c08658'); p.rect(5, 0, 8, 3, '#c08658'); p.rect(5, 2, 8, 1, '#e86a7a');
}, '#5a3a2e');
const hayBale = () => makeSprite('f:hay', 16, 12, p => {
  p.rect(0, 1, 16, 11, '#f2cf6a'); p.rect(0, 1, 16, 4, '#f8e08a');
  for (let x = 1; x < 16; x += 3) p.rect(x, 5, 1, 6, '#d8b04a');
  p.rect(4, 1, 1, 11, '#c08658'); p.rect(11, 1, 1, 11, '#c08658');
}, '#8a6a3a');
const wheelbarrow = () => makeSprite('f:barrow', 20, 13, p => {
  p.rect(2, 2, 13, 6, '#e86a7a'); p.rect(2, 2, 13, 1, '#f4a0a8');
  ellipse(p, 5, 3, 2, 1.5, '#ec7a7a'); ellipse(p, 9, 2, 2, 1.5, '#a5d470'); ellipse(p, 12, 3, 2, 1.5, '#f6a95e');
  ellipse(p, 6, 10, 2.5, 2.5, '#5a4a4a'); p.rect(15, 5, 5, 1, '#a8703f'); p.rect(13, 8, 1, 4, '#a8703f');
}, '#4a2a2a');
const beehive = () => makeSprite('f:beehive', 14, 18, p => {
  p.rect(6, 12, 2, 6, '#a8703f');
  for (let i = 0; i < 4; i++) ellipse(p, 7, 3 + i * 3, 4 + (i === 0 ? -1 : i === 3 ? -0.5 : 0.5), 1.8, i % 2 ? '#f2c050' : '#f8d86a');
  p.rect(6, 9, 2, 2, '#6a4a2a');
  p.px(1, 2, '#3a3a3a'); p.px(0, 1, '#ffffff'); p.px(12, 5, '#3a3a3a'); p.px(13, 4, '#ffffff');
}, '#8a6a3a');
const well = () => makeSprite('f:well', 22, 26, p => {
  p.rect(2, 2, 18, 3, '#c05a52'); p.rect(4, 0, 14, 2, '#e3786c');
  p.rect(4, 5, 2, 12, '#a8703f'); p.rect(16, 5, 2, 12, '#a8703f'); p.rect(6, 8, 10, 1, '#8a5a3c');
  p.rect(10, 9, 1, 4, '#c8c2b8'); p.rect(9, 12, 3, 3, '#a8703f');
  p.rect(1, 16, 20, 10, '#c8c2b8');
  for (let y = 17; y < 26; y += 3) for (let x = 1 + ((y / 3) % 2) * 2; x < 21; x += 5) p.rect(x, y, 4, 2, '#dcd6cc');
  p.rect(1, 16, 20, 1, '#e8e4dc');
}, '#5a5048');
const windmill = () => makeSprite('f:windmill', 30, 42, p => {
  p.rect(10, 18, 10, 24, '#fbf1dc'); p.rect(9, 16, 12, 3, '#c05a52'); p.rect(11, 13, 8, 3, '#e3786c');
  p.rect(13, 32, 4, 10, '#a06a48'); p.rect(13, 22, 4, 4, '#bfe3f2');
  for (let i = -12; i <= 12; i++) { p.px(15 + i, 12 + Math.round(i * 0.35), '#a8703f'); p.px(15 + Math.round(i * 0.35), 12 - i, '#a8703f'); }
  for (const [x, y] of [[3, 7], [24, 15], [11, 1], [18, 22]]) p.rect(x, y, 4, 3, '#fffaf0');
  ellipse(p, 15, 12, 1.5, 1.5, '#5a3a2e');
}, '#5a3a2e');
const farmSign = () => makeSprite('f:sign', 16, 16, p => {
  p.rect(7, 8, 2, 8, '#a8703f'); p.rect(0, 0, 16, 9, '#c08658'); p.rect(1, 1, 14, 7, '#ecc18e');
  p.rect(3, 3, 2, 3, '#86c257'); p.rect(7, 2, 2, 4, '#f6c64e'); p.rect(11, 3, 2, 3, '#ec7a7a');
}, '#5a3a2e');
const flowerPot = () => makeSprite('f:pots', 18, 12, p => {
  for (const [x, c] of [[2, '#f59ab3'], [8, '#f6c64e'], [14, '#b7a6e8']] as const) {
    p.rect(x - 2, 7, 5, 5, '#dc9a6a'); p.rect(x - 2, 7, 5, 1, '#ecc18e');
    ellipse(p as Pen, x, 4, 2.5, 2.5, '#86c257'); p.px(x, 3, c); p.px(x - 1, 4, c); p.px(x + 1, 4, c);
  }
}, '#5a3a2e');

const kidDrawing = () => makeSprite('wall:kid-drawing', 16, 13, p => {
  p.rect(0, 0, 16, 13, '#c98a52'); p.rect(1, 1, 14, 11, '#fffaf0');
  p.rect(1, 9, 14, 3, '#b8e08a');
  for (let i = 0; i < 5; i++) p.px(11 + (i % 2), 2 + Math.floor(i / 2), '#f6c64e');           // mặt trời
  p.px(12, 3, '#f6a040');
  for (const [x, c, h] of [[3, '#8db8ef', 6], [7, '#f59ab3', 6], [5, '#f6c64e', 4]] as [number, string, number][]) {
    p.px(x, 11 - h, '#3b2d3f'); p.rect(x, 12 - h, 1, h - 3, c); p.px(x - 1, 13 - h, c); p.px(x + 1, 13 - h, c); p.px(x - 1, 10, '#3b2d3f'); p.px(x + 1, 10, '#3b2d3f');
  }
  p.px(9, 4, '#e86a7a'); p.px(10, 4, '#e86a7a'); p.px(9, 5, '#e86a7a');                        // trái tim
}, '#8a5a3c');

export const EXTRA_ART: Record<string, Art> = {
  kid_drawing: { place: 'wall', sprite: kidDrawing },
  tv: { place: 'floor', size: [2, 1], sprite: tv },
  fridge: { place: 'floor', sprite: fridge },
  washer: { place: 'floor', sprite: washer },
  stove: { place: 'floor', sprite: stove },
  kitchen_counter: { place: 'floor', size: [2, 1], sprite: kitchenCounter },
  microwave: { place: 'floor', sprite: microwave },
  dining_table: { place: 'floor', size: [2, 2], sprite: diningTable },
  armchair: { place: 'floor', sprite: armchair },
  dresser: { place: 'floor', size: [2, 1], sprite: dresser },
  piano: { place: 'floor', size: [2, 1], sprite: piano },
  aquarium: { place: 'floor', size: [2, 1], sprite: aquarium },
  record_player: { place: 'floor', sprite: recordPlayer },
  standing_fan: { place: 'floor', sprite: fan },
  bathtub: { place: 'floor', size: [2, 1], sprite: bathtub },
  coat_rack: { place: 'floor', sprite: coatRack },
  bean_bag: { place: 'floor', sprite: beanBag },
  rice_cooker: { place: 'floor', sprite: riceCooker },
  air_conditioner: { place: 'wall', sprite: airCon },
  wall_tv: { place: 'wall', sprite: wallTv },
  curtain_window: { place: 'wall', sprite: curtainWindow },

  scarecrow: { place: 'garden', sprite: scarecrow },
  hay_bale: { place: 'garden', sprite: hayBale },
  wheelbarrow: { place: 'garden', sprite: wheelbarrow },
  beehive: { place: 'garden', sprite: beehive },
  well: { place: 'garden', sprite: well },
  windmill: { place: 'garden', size: [2, 1], sprite: windmill },
  farm_sign: { place: 'garden', sprite: farmSign },
  flower_pots: { place: 'garden', sprite: flowerPot },
};
