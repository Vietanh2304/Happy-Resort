// Đồ trang trí vẽ tay: nội thất nhìn nghiêng cho nhà gỗ/phòng ngủ, đồ treo tường, đồ vườn.
// Món nào không có ở đây sẽ dùng hình pixel tự sinh từ emoji (xem emojiSprite).
import { ellipse, isoSprite, shade, type IsoPen } from './iso';
import { EXTRA_ART } from './appliances';
import { HOLIDAY_ART } from './holiday';
import { TRIP_ART } from './tripArt';
import { KID_ART } from './kidRoom';
import { makeSprite, mix, type Pen, type Sprite } from './pixel';

// hang: treo được — đặt trên sàn, ngoài vườn, hoặc treo lên tường
export type Place = 'floor' | 'wall' | 'garden' | 'any' | 'hang';
export interface Art {
  place: Place;
  size?: [number, number];   // số ô chiếm (theo gx, theo gy); mặc định 1×1
  sprite: () => Sprite;
  glow?: boolean;            // tỏa sáng khi trời tối
  flat?: boolean;            // nằm sát đất (thảm, đá lót) — luôn ở dưới mọi thứ
}

const WOOD = '#c99366';
const WOOD_D = '#a8703f';
const PINK = '#f4a7b9';
const LEAF = '#a5d470';

function leaves(p: Pen, cx: number, cy: number, r: number, base = LEAF, seed = 0) {
  const blobs: [number, number, number][] = [[0, 0, 1], [-0.6, 0.25, 0.7], [0.6, 0.3, 0.7], [-0.25, -0.55, 0.65], [0.35, -0.45, 0.6]];
  blobs.forEach(([dx, dy, k], i) => ellipse(p, cx + dx * r, cy + dy * r, r * k * 0.75, r * k * 0.7, i % 2 ? mix(base, '#2f6b3a', 0.15) : base));
  for (let i = 0; i < 6; i++) {
    const a = (i * 2.4 + seed) % 6.28;
    p.px(Math.round(cx + Math.cos(a) * r * 0.5), Math.round(cy + Math.sin(a) * r * 0.4 - 1), mix(base, '#ffffff', 0.4));
  }
}

// ───────── Nội thất (isometric) — phong cách cung điện: gỗ trắng ngà, nhung hồng, viền vàng ─────────
const IVORY = '#f6ecdc', IVORY_D = '#e2cfb4', ROSE = '#d8607a', ROSE_L = '#f29ab0', WALNUT = '#7a4a30', MARBLE = '#f8f4ee';
/** tô một mặt đứng theo trục gx (mặt trước, gy cố định) */
const face = (q: IsoPen, g0: number, g1: number, gy: number, z0: number, z1: number, c: string) => q.poly([q.pt(g0, gy, z0), q.pt(g1, gy, z0), q.pt(g1, gy, z1), q.pt(g0, gy, z1)], c);
/** chân tủ/bàn mạ vàng */
const goldFeet = (q: IsoPen, pts: [number, number][], h: number, s = 0.12) => pts.forEach(([a, b]) => q.box(a, b, 0, s, s, h, shade('#e8b84a', 0.6)));
/** bó hoa hồng nhỏ trong bình */
function roses(q: IsoPen, x: number, y: number, vase = '#bfe3f2') { q.rect(x - 1, y - 4, 3, 4, vase); q.px(x - 1, y - 4, '#ffffff'); for (const [dx, dy, c] of [[-2, -6, '#e8406a'], [0, -7, '#ff7a9a'], [2, -6, '#e8406a'], [-1, -8, '#c82a4a'], [1, -9, '#ff9ab4']] as const) { q.px(x + dx, y + dy, c); q.px(x + dx, y + dy + 1, '#5a9a4a'); } }

const ROYAL = '#9a2244', ROYAL_D = '#6e1632', VELVET = '#c23a62', GOLD = '#e8b84a', GOLD_L = '#ffe08a', BLUSH = '#f8c4d2';
/** rèm voan buông từ màn trướng, thắt eo bằng dây vàng, xoè ra dưới chân (mặt phẳng gx cố định) */
function drape(q: IsoPen, gx: number) {
  for (let z = 0; z <= 59; z++) {
    const w = z > 26 && z < 34 ? 0.14 : z >= 34 ? 0.14 + (z - 34) / 25 * 0.2 : 0.14 + (26 - z) / 26 * 0.22, c0 = 0.42;
    const [x0, y0] = q.pt(gx, c0 - w, z), [x1] = q.pt(gx, c0 + w, z);
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { const k = Math.abs(x - x0); q.px(x, y0 - Math.round((x - x0) / 2), k % 3 === 0 ? mix(BLUSH, '#c86a8a', 0.35) : k % 3 === 1 ? BLUSH : '#fde6ee'); }
  }
}
/** Giường vua & hoàng hậu: đầu giường nhung đỏ đính nút vàng hình vòm có vương miện, màn trướng treo trên đầu, rèm voan hồng buộc dây vàng, chân giường mạ vàng */
const bed = () => isoSprite('bed:v4', 2, 3, 64, q => {
  const v = shade(ROYAL), g = shade(GOLD, 0.7);
  // hai cột vàng phía sau đỡ màn trướng
  q.box(0, 0, 0, 0.16, 0.16, 60, g); q.box(1.84, 0, 0, 0.16, 0.16, 60, g);
  // rèm voan bên trái (mặt gx = 0), buộc túm giữa bằng dây vàng
  drape(q, 0);
  { const [x, y] = q.pt(0, 0.5, 30); q.rect(x - 2, y, 5, 2, GOLD); q.px(x, y + 2, GOLD_L); q.px(x, y + 3, GOLD); }
  // đầu giường nhung: khối + vòm cong + vương miện
  q.box(0, 0.06, 0, 2, 0.24, 24, v);
  const arch = (z0: number, h: number, inset: number) => { const pts: [number, number][] = [q.pt(inset, 0.3, 6)]; for (let s2 = 0; s2 <= 20; s2++) { const u = s2 / 20, gx = inset + u * (2 - inset * 2); pts.push(q.pt(gx, 0.3, z0 + Math.sin(u * Math.PI) * h)); } pts.push(q.pt(2 - inset, 0.3, 6)); return pts; };
  q.poly(arch(24, 16, 0), GOLD); q.poly(arch(23, 14, 0.12), ROYAL); q.poly(arch(22, 11, 0.24), VELVET);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const gx = 0.4 + c * 0.24 + (r % 2) * 0.12; if (gx > 1.7) continue; const [x, y] = q.pt(gx, 0.3, 12 + r * 6); q.px(x, y, r === 3 && (c === 0 || c === 5) ? VELVET : GOLD_L); q.px(x + 1, y + 1, ROYAL_D); }
  { const [x, y] = q.pt(1, 0.3, 41); // vương miện
    q.rect(x - 4, y, 9, 3, GOLD); for (const dx of [-4, -2, 0, 2, 4]) q.rect(x + dx, y - (dx === 0 ? 4 : Math.abs(dx) === 2 ? 2 : 3), 1, 4, GOLD); q.px(x, y - 5, GOLD_L); q.px(x - 4, y - 4, GOLD_L); q.px(x + 4, y - 4, GOLD_L);
    q.px(x - 2, y + 1, '#e8406a'); q.px(x, y + 1, '#5ac8f0'); q.px(x + 2, y + 1, '#e8406a'); q.rect(x - 4, y + 3, 9, 1, '#a8782a'); }
  // màn trướng nhung treo trên đầu giường, viền tua vàng hình vỏ sò
  q.flat(0, 0, 60, 2, 0.95, ROYAL_D);
  q.poly([q.pt(0, 0.95, 60), q.pt(2, 0.95, 60), q.pt(2, 0.95, 53), q.pt(0, 0.95, 53)], ROYAL);
  q.poly([q.pt(2, 0, 60), q.pt(2, 0.95, 60), q.pt(2, 0.95, 53), q.pt(2, 0, 53)], mix(ROYAL, '#3b2416', 0.2));
  for (let k = 0; k < 10; k++) { const [x, y] = q.pt(0.1 + k * 0.2, 0.95, 53); q.rect(x - 1, y, 3, 1, GOLD); q.px(x, y + 1, GOLD); q.px(x, y + 2, GOLD_L); }
  { const [x0, y0] = q.pt(0, 0.95, 60), [x1, y1] = q.pt(2, 0.95, 60); for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) q.px(x, Math.round(y0 + (y1 - y0) * (x - x0) / (x1 - x0 || 1)), GOLD_L); }
  // khung giường nhung, viền chỉ vàng & tua rua
  q.box(0, 0.3, 0, 2, 2.7, 6, v);
  for (const z of [1, 5]) { q.poly([q.pt(0, 3, z), q.pt(2, 3, z), q.pt(2, 3, z + 1), q.pt(0, 3, z + 1)], GOLD); q.poly([q.pt(2, 0.3, z), q.pt(2, 3, z), q.pt(2, 3, z + 1), q.pt(2, 0.3, z + 1)], GOLD); }
  // nệm lụa, gối viền vàng
  q.box(0.1, 0.35, 6, 1.8, 2.55, 3, shade('#fff4e6', 0.6));
  q.box(0.2, 0.5, 9, 0.75, 0.55, 3, shade('#fff8ee', 0.5)); q.box(1.05, 0.5, 9, 0.75, 0.55, 3, shade('#fff8ee', 0.5));
  for (const gx of [0.2, 1.05]) q.poly([q.pt(gx, 1.05, 9), q.pt(gx + 0.75, 1.05, 9), q.pt(gx + 0.75, 1.05, 10), q.pt(gx, 1.05, 10)], GOLD);
  for (const g2 of [0.45, 1.3]) { const [x, y] = q.pt(g2, 0.7, 12); q.px(x - 1, y - 1, PINK); q.px(x + 1, y - 1, PINK); }
  // chăn bông xám (giữ nguyên màu), mép gập trắng, rắc cánh hoa hồng
  q.box(0.05, 1.2, 6, 1.9, 1.75, 6, shade('#8e8e98'));
  q.flat(0.05, 1.2, 12, 1.9, 0.35, '#ffffff');
  q.flat(0.05, 1.55, 12, 1.9, 0.06, '#e4e4ea');
  for (const [gx, gy, c] of [[0.4, 2.0, '#e8406a'], [0.9, 2.4, '#ff7a9a'], [1.5, 1.9, '#e8406a'], [1.2, 2.7, '#c82a4a'], [0.6, 2.8, '#ff7a9a'], [1.7, 2.5, '#e8406a']] as const) { const [x, y] = q.pt(gx, gy, 12); q.rect(x, y, 2, 1, c); q.px(x, y + 1, mix(c, '#000000', 0.2)); }
  { const [x, y] = q.pt(1, 2.3, 12); q.px(x - 1, y, '#e8406a'); q.px(x + 1, y, '#e8406a'); q.rect(x - 1, y + 1, 3, 1, '#e8406a'); q.px(x, y + 2, '#e8406a'); }
  // chân giường mạ vàng + hai cột trụ có quả cầu
  q.box(0, 2.88, 0, 2, 0.12, 13, v); q.flat(0, 2.88, 13, 2, 0.12, GOLD);
  for (const gx of [0, 1.84]) { q.box(gx, 2.84, 0, 0.16, 0.16, 18, g); const [x, y] = q.pt(gx + 0.08, 2.92, 19); q.ellipse(x, y, 1.8, 1.8, GOLD_L); }
  // rèm voan bên phải (mặt gx = 2) trước đầu giường
  drape(q, 2);
  { const [x, y] = q.pt(2, 0.5, 30); q.rect(x - 2, y, 5, 2, GOLD); q.px(x, y + 2, GOLD_L); q.px(x, y + 3, GOLD); }
});

const wardrobe = () => isoSprite('wardrobe', 2, 1, 40, q => {
  goldFeet(q, [[0.08, 0.12], [1.8, 0.12], [0.08, 0.78], [1.8, 0.78]], 2);
  q.box(0.05, 0.1, 2, 1.9, 0.8, 32, shade(IVORY));
  q.box(0, 0.05, 34, 2, 0.9, 3, shade(GOLD, 0.6));
  const ar: [number, number][] = [q.pt(0.45, 0.95, 37)]; for (let s = 0; s <= 10; s++) { const u = s / 10; ar.push(q.pt(0.45 + u * 1.1, 0.95, 37 + Math.sin(u * Math.PI) * 5)); } ar.push(q.pt(1.55, 0.95, 37)); q.poly(ar, GOLD);
  { const [x, y] = q.pt(1, 0.95, 39); q.rect(x - 1, y - 1, 2, 2, '#e8406a'); q.px(x - 2, y, '#5a9a4a'); q.px(x + 1, y, '#5a9a4a'); }
  for (const [a, b] of [[0.14, 0.94], [1.06, 1.86]]) {
    face(q, a, b, 0.9, 5, 32, GOLD); face(q, a + 0.04, b - 0.04, 0.9, 6, 31, IVORY);
    face(q, a + 0.1, b - 0.1, 0.9, 8, 17, IVORY_D); face(q, a + 0.13, b - 0.13, 0.9, 9, 16, IVORY);
    face(q, a + 0.1, b - 0.1, 0.9, 19, 29, IVORY_D); face(q, a + 0.13, b - 0.13, 0.9, 20, 28, IVORY);
  }
  { const [x, y] = q.pt(0.54, 0.9, 24); q.ellipse(x, y, 3, 4.4, GOLD); q.ellipse(x, y, 2.2, 3.6, '#d7ecf7'); q.px(x - 1, y - 2, '#ffffff'); }
  for (const g of [0.88, 1.12]) { const [x, y] = q.pt(g, 0.9, 18); q.rect(x, y, 1, 3, GOLD_L); }
});

const nightstand = () => isoSprite('nightstand', 1, 1, 18, q => {
  goldFeet(q, [[0.12, 0.12], [0.76, 0.12], [0.12, 0.76], [0.76, 0.76]], 3);
  q.box(0.1, 0.1, 3, 0.8, 0.8, 8, shade(IVORY));
  q.flat(0.1, 0.1, 11, 0.8, 0.8, MARBLE); { const [x0, y0] = q.pt(0.2, 0.3, 11), [x1, y1] = q.pt(0.7, 0.6, 11); q.px(Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2), '#d8d4dc'); }
  face(q, 0.18, 0.82, 0.9, 5, 10, GOLD); face(q, 0.21, 0.79, 0.9, 5.5, 9.5, IVORY_D);
  const [x, y] = q.pt(0.5, 0.9, 7); q.rect(x - 1, y, 2, 1, GOLD_L);
  roses(q, ...xy(q.pt(0.3, 0.3, 11)));
});

const floorLamp = () => isoSprite('floor_lamp', 1, 1, 34, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  q.ellipse(x, y, 4, 2, '#c8902a'); q.ellipse(x, y - 1, 3, 1.4, GOLD);
  q.rect(x, y - 22, 1, 22, GOLD); q.px(x + 1, y - 22, GOLD_L); q.rect(x - 1, y - 12, 3, 1, GOLD_L); q.rect(x - 1, y - 6, 3, 1, GOLD_L);
  q.box(0.18, 0.18, 21, 0.64, 0.64, 9, { top: '#fff4c8', left: '#fbd8e0', right: '#f2c0cc' });
  for (let g = 0.2; g <= 0.8; g += 0.12) { const [fx, fy] = q.pt(g, 0.82, 21); q.px(fx, fy, GOLD); q.px(fx, fy + 1, GOLD_L); const [rx, ry] = q.pt(0.82, g, 21); q.px(rx, ry, GOLD); }
});

const pottedPlant = () => isoSprite('potted_plant', 1, 1, 28, q => {
  q.box(0.25, 0.25, 0, 0.5, 0.5, 7, shade('#fbfbff'));
  q.flat(0.25, 0.25, 7, 0.5, 0.5, '#5a3a2a');
  for (const z of [1, 6]) face(q, 0.25, 0.75, 0.75, z, z + 1, GOLD);
  { const [x, y] = q.pt(0.5, 0.75, 4); q.px(x - 1, y, '#5a8ad8'); q.px(x + 1, y, '#5a8ad8'); q.px(x, y - 1, '#5a8ad8'); }
  const [x, y] = q.pt(0.5, 0.5, 15);
  leaves(q, x, y, 8, '#6ab85a', 1);
  for (const [dx, dy] of [[-4, -3], [3, -5], [5, 1], [-2, 3], [0, -7]]) { q.px(x + dx, y + dy, '#ff7a9a'); q.px(x + dx + 1, y + dy, '#ffd0dc'); }
});

const bearChair = () => isoSprite('chair', 1, 1, 26, q => {
  goldFeet(q, [[0.2, 0.2], [0.68, 0.2], [0.2, 0.68], [0.68, 0.68]], 6);
  q.box(0.15, 0.15, 6, 0.7, 0.7, 2, shade(IVORY));
  q.box(0.2, 0.22, 8, 0.6, 0.58, 1, shade(ROSE));
  { const [x, y] = q.pt(0.5, 0.5, 9); q.px(x, y, GOLD_L); }
  q.box(0.15, 0.1, 8, 0.7, 0.14, 10, shade(IVORY));
  const [ox, oy] = q.pt(0.5, 0.24, 13); q.ellipse(ox, oy, 3.6, 3.6, GOLD); q.ellipse(ox, oy, 2.8, 2.8, ROSE); q.px(ox, oy, GOLD_L);
  const [cx, cy] = q.pt(0.5, 0.15, 19); q.rect(cx - 2, cy, 5, 1, GOLD); q.px(cx, cy - 1, GOLD_L);
});

const lowTable = () => isoSprite('low_table', 2, 1, 14, q => {
  goldFeet(q, [[0.1, 0.15], [1.8, 0.15], [0.1, 0.75], [1.8, 0.75]], 6);
  q.box(0, 0.05, 6, 2, 0.9, 2, { top: MARBLE, left: GOLD, right: '#c8902a' });
  for (const [a, b, c, d] of [[0.2, 0.3, 0.7, 0.6], [1.1, 0.2, 1.6, 0.7]]) { const [x0, y0] = q.pt(a, b, 8), [x1, y1] = q.pt(c, d, 8); for (let k = 0; k <= 6; k++) q.px(Math.round(x0 + (x1 - x0) * k / 6), Math.round(y0 + (y1 - y0) * k / 6), '#dcd6de'); }
  roses(q, ...xy(q.pt(1, 0.5, 8)), '#fbe0e8');
});

const roundRug = () => isoSprite('round_rug', 2, 2, 2, q => {
  const [x, y] = q.pt(1, 1, 0);
  for (const [r, c] of [[19, '#b8324e'], [17.5, GOLD], [16.5, '#f6ecdc'], [12, '#f29ab0'], [11, GOLD], [10, '#f6ecdc'], [4, '#d8607a']] as const) q.ellipse(x, y, r, r / 2, c);
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; q.px(Math.round(x + Math.cos(a) * 14), Math.round(y + Math.sin(a) * 7), k % 2 ? '#e8406a' : '#5a9a4a'); q.px(Math.round(x + Math.cos(a) * 7), Math.round(y + Math.sin(a) * 3.5), '#e8b84a'); }
}, '#8a1e3a');

const sofa = () => isoSprite('sofa', 2, 1, 20, q => {
  const c = shade(ROSE);
  goldFeet(q, [[0.05, 0.15], [1.83, 0.15], [0.05, 0.8], [1.83, 0.8]], 1);
  q.box(0, 0.1, 1, 2, 0.85, 6, c);
  q.box(0, 0.05, 7, 2, 0.25, 9, c);
  for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) { const [x, y] = q.pt(0.28 + k * 0.24 + (r % 2) * 0.12, 0.3, 10 + r * 3.5); q.px(x, y, '#a83a56'); q.px(x, y - 1, ROSE_L); }
  q.box(0, 0.1, 7, 0.22, 0.85, 4, c); q.box(1.78, 0.1, 7, 0.22, 0.85, 4, c);
  q.flat(0.25, 0.35, 7, 0.7, 0.55, ROSE_L); q.flat(1.05, 0.35, 7, 0.7, 0.55, ROSE_L);
  face(q, 0, 2, 0.95, 6, 6.6, GOLD);
  q.box(0.3, 0.3, 7, 0.3, 0.16, 4, shade('#fff4e6')); q.box(1.35, 0.3, 7, 0.3, 0.16, 4, shade(GOLD));
});

const bookshelf = () => isoSprite('bookshelf', 2, 1, 36, q => {
  q.box(0.05, 0.1, 0, 1.9, 0.6, 30, shade(WALNUT));
  q.box(0, 0.06, 30, 2, 0.68, 2, shade(GOLD, 0.6));
  face(q, 0.15, 1.85, 0.7, 2, 28, '#4a2a1a');
  const cols = ['#9a2244', '#2a5a8a', '#3a7a4a', '#e8b84a', '#6a3a8a', '#c86a3a', '#f6ecdc'];
  for (const z of [3, 12, 21]) {
    const [sx, sy] = q.pt(0.15, 0.7, z), [ex] = q.pt(1.85, 0.7, z);
    face(q, 0.15, 1.85, 0.7, z - 1, z, GOLD);
    for (let x = sx + 1, i = z; x < ex - 1; x += 2, i++) {
      const y = sy + Math.round((x - sx) * 0.5);
      if (z === 12 && x > sx + 18 && x < sx + 24) { if (x < sx + 20) { q.ellipse(x + 1, y - 3, 2.4, 2.4, '#5ab0e8'); q.px(x, y - 4, '#6ac86a'); q.rect(x + 1, y - 1, 1, 1, GOLD); } continue; }
      if (z === 21 && x > sx + 6 && x < sx + 10) { if (x < sx + 8) roses(q, x + 1, y); continue; }
      const h = Math.max(3, Math.round((5 + ((i * 7) % 3)) * q.k));
      const c = cols[(i * 3) % cols.length]; q.rect(x, y - h, 2, h, c); q.px(x, y - h + 1, GOLD_L);
    }
  }
});

const teddy = () => isoSprite('teddy', 1, 1, 18, q => {
  const [x, y] = q.pt(0.5, 0.5, 0);
  const b = '#c98b5a', l = '#f3d2b0';
  q.ellipse(x, y - 5, 5, 4.5, b);                                // thân
  q.ellipse(x, y - 4, 2.6, 2.4, l);
  q.ellipse(x, y - 12, 4.5, 4, b);                               // đầu
  q.ellipse(x - 4, y - 15, 1.8, 1.8, b); q.ellipse(x + 4, y - 15, 1.8, 1.8, b);
  q.ellipse(x, y - 11, 1.8, 1.3, l);
  q.px(x - 2, y - 13, '#3b2d3f'); q.px(x + 2, y - 13, '#3b2d3f'); q.px(x, y - 12, '#3b2d3f');
  q.px(x - 3, y - 11, PINK); q.px(x + 3, y - 11, PINK);
});

const desk = () => isoSprite('desk', 2, 1, 26, q => {
  q.box(0.05, 0.1, 0, 0.4, 0.8, 12, shade(IVORY));
  face(q, 0.1, 0.4, 0.9, 2, 6, IVORY_D); face(q, 0.1, 0.4, 0.9, 7, 11, IVORY_D);
  for (const z of [4, 9]) { const [x, y] = q.pt(0.25, 0.9, z); q.px(x, y, GOLD_L); }
  goldFeet(q, [[1.85, 0.1], [1.85, 0.78]], 12);
  q.box(0, 0.05, 12, 2, 0.9, 2, { top: MARBLE, left: GOLD, right: '#c8902a' });
  q.box(0.8, 0.25, 14, 0.7, 0.45, 1, shade('#f0c8c0'));
  face(q, 0.8, 1.5, 0.25, 15, 23, '#e8b8b0'); face(q, 0.85, 1.45, 0.25, 16, 22, '#bcd8f2');
  const [x, y] = q.pt(0.3, 0.5, 14); q.rect(x, y - 5, 1, 5, GOLD); q.ellipse(x, y - 7, 3, 2, '#fbd8e0'); q.px(x, y - 8, '#fff4c8');
  roses(q, ...xy(q.pt(1.75, 0.4, 14)));
});

// ───────── Đồ treo tường (vẽ thẳng, khi hiển thị sẽ được nghiêng theo tường) ─────────

const painting = () => makeSprite('wall:painting', 14, 11, p => {
  p.rect(0, 0, 14, 11, '#e8b84a'); p.rect(1, 1, 12, 9, '#c8902a'); p.rect(2, 2, 10, 7, '#ffd8a8');
  p.rect(2, 2, 10, 3, '#f8b0a0'); p.rect(2, 6, 10, 3, '#8ac08a'); ellipse(p, 9, 5, 1.6, 1.6, '#fff4c8'); p.rect(3, 5, 4, 1, '#6a9a6a');
  for (const [x, y] of [[0, 0], [13, 0], [0, 10], [13, 10]]) p.px(x, y, '#ffe08a');
}, '#7a5020');
const clock = () => makeSprite('wall:clock', 11, 11, p => {
  ellipse(p, 5.5, 5.5, 5.5, 5.5, '#e8b84a'); ellipse(p, 5.5, 5.5, 4.4, 4.4, '#c8902a'); ellipse(p, 5.5, 5.5, 3.8, 3.8, '#fffaf0');
  for (const [x, y] of [[5, 2], [5, 8], [2, 5], [8, 5]]) p.px(x, y, '#c8902a');
  p.rect(5, 3, 1, 3, '#3a2a2a'); p.rect(5, 5, 2, 1, '#3a2a2a'); p.px(5, 0, '#ffe08a');
}, '#7a5020');
const mirror = () => makeSprite('wall:mirror', 10, 15, p => {
  ellipse(p, 5, 7.5, 5, 7.5, '#e8b84a'); ellipse(p, 5, 7.5, 4.2, 6.6, '#c8902a'); ellipse(p, 5, 7.5, 3.6, 6, '#d7ecf7');
  p.rect(3, 3, 1, 4, '#ffffff'); p.px(4, 2, '#ffffff'); p.px(5, 0, '#ffe08a'); p.px(4, 0, '#e8406a'); p.px(6, 0, '#e8406a');
}, '#7a5020');
const bunting = () => makeSprite('wall:bunting', 20, 8, p => {
  for (let x = 0; x < 20; x++) p.px(x, Math.round(Math.abs(x - 10) / 5), '#8a5a3c');
  ['#f59ab3', '#f6c64e', '#d6f1a4', '#8db8ef'].forEach((c, i) => {
    const x0 = 1 + i * 5, y0 = 1 + Math.round(Math.abs(x0 + 1.5 - 10) / 5);
    for (let r = 0; r < 4; r++) p.rect(x0 + Math.floor(r / 2), y0 + r, 4 - Math.floor(r / 2) * 2, 1, c);
  });
}, null);
const wallShelf = () => makeSprite('wall:shelf', 18, 12, p => {
  p.rect(0, 9, 18, 2, '#a8703f'); p.rect(2, 11, 1, 1, '#a8703f'); p.rect(15, 11, 1, 1, '#a8703f');
  p.rect(2, 5, 4, 4, '#d9895a'); leaves(p, 4, 3, 3, LEAF, 2);
  p.rect(8, 2, 5, 7, '#fff8ee'); p.rect(9, 3, 3, 4, '#f6c0a0');
  p.rect(14, 6, 2, 3, '#8db8ef');
}, '#5a3a2e');
const photoString = () => makeSprite('wall:photos', 22, 10, p => {
  for (let x = 0; x < 22; x++) p.px(x, Math.round(Math.abs(x - 11) / 6), '#8a5a3c');
  ['#f6c0a0', '#bcd8f2', '#c9e8b8'].forEach((c, i) => {
    const x0 = 2 + i * 7, y0 = 2 + (i === 1 ? 0 : 1);
    p.rect(x0, y0, 5, 6, '#ffffff'); p.rect(x0 + 1, y0 + 1, 3, 3, c); p.px(x0 + 2, y0 - 1, '#e8505b');
  });
}, null);
const heartFrame = () => makeSprite('wall:heart', 11, 10, p => p.map([
  '.RRR...RRR.', 'RRPPR.RPPRR', 'RPWPPRPPPPR', 'RPPPPPPPPPR', 'RPPPPPPPPPR', '.RPPPPPPPR.', '..RPPPPPR..', '...RPPPR...', '....RPR....', '.....R.....',
], { R: '#e86a8a', P: '#f9c6d2', W: '#ffffff' }), '#5a3a2e');

// ───────── Đồ vườn (nhìn chính diện hơi từ trên xuống) ─────────

const hedge = () => makeSprite('g:hedge:v2', 16, 15, p => {
  p.rect(0, 1, 16, 14, '#86c257');
  p.rect(0, 10, 16, 5, '#76b44a');
  p.rect(0, 14, 16, 1, '#5f9a3e');
  p.rect(0, 1, 16, 9, '#b5df7e');
  p.rect(1, 1, 14, 1, '#cdeb9a');
  for (let x = 1; x < 15; x += 3) for (let y = 3; y < 10; y += 3) if ((x + y) % 2) p.px(x, y, '#d6f1a4');
  for (let x = 2; x < 15; x += 4) p.px(x, 12, '#6aa645');
}, '#4f7a3a');

function flowerBed(key: string, petal: string, center: string, tall = false) {
  return () => makeSprite(`g:${key}`, 16, tall ? 20 : 14, p => {
    const oy = tall ? 6 : 0;
    p.rect(1, 9 + oy, 14, 5, '#8a6a4a');
    p.rect(1, 9 + oy, 14, 1, '#a8825a');
    for (const [x, y] of [[3, 4], [8, 2], [13, 4], [5, 8], [11, 8]]) {
      p.rect(x, y + 2 + oy, 1, 6 - (y > 5 ? 3 : 0), '#86c257');
      p.px(x - 1, y + 5 + oy, '#a5d470'); p.px(x + 1, y + 6 + oy, '#a5d470');
      if (tall) p.rect(x, y + oy - 4, 1, 6, '#86c257');
      const fy = tall ? y + oy - 6 : y;
      p.rect(x - 1, fy, 3, 3, petal); p.px(x, fy - 1, petal); p.px(x, fy + 1, center);
    }
  }, '#3b5a3a');
}

const roseArch = () => makeSprite('g:rose_arch', 26, 30, p => {
  for (let a = 0; a <= 26; a++) {
    const t = (a / 26) * Math.PI;
    const x = 13 - Math.cos(t) * 11, y = 13 - Math.sin(t) * 11;
    p.rect(Math.round(x) - 1, Math.round(y), 3, 2, '#fbf6ee');
  }
  p.rect(1, 13, 3, 17, '#fbf6ee'); p.rect(22, 13, 3, 17, '#fbf6ee');
  for (let i = 0; i < 16; i++) {
    const t = (i / 15) * Math.PI, x = 13 - Math.cos(t) * 11, y = 13 - Math.sin(t) * 11;
    ellipse(p, x, y, 2, 1.6, i % 2 ? '#a5d470' : '#86c257');
    if (i % 2 === 0) ellipse(p, x + 0.5, y - 0.5, 1.3, 1.3, i % 4 ? '#f59ab3' : '#e0718f');
  }
  for (const y of [17, 22, 27]) { ellipse(p, 2.5, y, 2, 1.6, '#a5d470'); ellipse(p, 23.5, y + 2, 2, 1.6, '#a5d470'); p.px(2, y - 1, '#f59ab3'); p.px(23, y + 1, '#f59ab3'); }
}, '#5a5a6a');

const gazebo = () => makeSprite('g:gazebo', 30, 38, p => {
  ellipse(p, 15, 35, 14, 3, '#e8e0d4');                          // nền đá
  for (const x of [3, 9, 15, 21, 27]) p.rect(x, 14, 1, 21, '#fbf6ee'); // song lồng chim
  p.rect(2, 22, 27, 1, '#fbf6ee');
  for (let i = 0; i < 14; i++) {                                  // mái vòm
    const half = Math.round(Math.sqrt(Math.max(0, 196 - (14 - i) * (14 - i))));
    p.rect(15 - half, i + 1, half * 2, 1, i < 3 ? '#fff' : mix('#fbf6ee', '#e8d8c8', i / 14));
  }
  p.rect(14, 0, 2, 2, '#e8c070');
  for (let i = 0; i < 9; i++) ellipse(p, 3 + i * 3, 14 + (i % 2), 1.8, 1.4, i % 2 ? '#a5d470' : '#d6f1a4'); // dây leo
  for (const [x, y] of [[4, 13], [11, 15], [19, 13], [26, 15], [3, 26], [27, 24]]) p.px(x, y, '#f59ab3');
  p.rect(10, 28, 10, 2, '#c99366');                               // ghế bên trong
}, '#6a6a7a');

const bench = () => makeSprite('g:bench', 20, 14, p => {
  p.rect(1, 2, 18, 2, WOOD); p.rect(1, 5, 18, 2, WOOD);
  p.rect(0, 8, 20, 3, '#d9a070'); p.rect(0, 8, 20, 1, '#e8b88a');
  p.rect(2, 11, 2, 3, '#6b4630'); p.rect(16, 11, 2, 3, '#6b4630');
  p.rect(2, 2, 1, 7, '#6b4630'); p.rect(17, 2, 1, 7, '#6b4630');
}, '#4a3020');

const lampPost = () => makeSprite('g:lamp_post', 8, 30, p => {
  p.rect(3, 8, 2, 20, '#3f4a5a'); p.rect(1, 27, 6, 3, '#3f4a5a');
  p.rect(1, 2, 6, 6, '#fff1b8'); p.rect(0, 1, 8, 1, '#3f4a5a'); p.rect(1, 0, 6, 1, '#3f4a5a');
  p.rect(1, 8, 6, 1, '#3f4a5a'); p.rect(3, 3, 2, 4, '#fbe6a0');
}, '#2a3040');

const birdbath = () => makeSprite('g:birdbath', 14, 16, p => {
  p.rect(5, 6, 4, 8, '#d8d4cc'); p.rect(3, 13, 8, 3, '#c8c2b8');
  ellipse(p, 7, 5, 7, 2.6, '#e8e4dc'); ellipse(p, 7, 4.6, 5.4, 1.6, '#9fd3f2');
  p.px(5, 4, '#ffffff');
  p.rect(10, 1, 3, 2, '#8db8ef'); p.px(12, 0, '#8db8ef'); p.px(13, 1, '#f6c64e');  // chú chim nhỏ
}, '#6a6660');

const picketFence = () => makeSprite('g:fence', 16, 12, p => {
  for (let x = 0; x < 16; x += 4) { p.rect(x + 1, 1, 2, 11, '#fbf6ee'); p.px(x + 1, 0, '#fbf6ee'); p.rect(x + 1, 11, 2, 1, '#e0d8cc'); }
  p.rect(0, 4, 16, 1, '#e8e0d4'); p.rect(0, 8, 16, 1, '#e8e0d4');
}, '#8a8070');

const cherryTree = () => makeSprite('g:cherry_tree', 26, 32, p => {
  p.rect(11, 18, 4, 14, '#8a5a3c'); p.rect(9, 30, 8, 2, '#8a5a3c'); p.rect(14, 20, 4, 2, '#8a5a3c');
  leaves(p, 13, 12, 12, '#f6b8cc', 4);
  for (const [x, y] of [[6, 8], [18, 6], [10, 16], [20, 14], [13, 4]]) p.px(x, y, '#ffffff');
}, '#8a4a5a');

const stonePath = () => makeSprite('g:stones', 16, 10, p => {
  ellipse(p, 4, 4, 3.5, 2.2, '#d8d0c4'); ellipse(p, 11, 6, 4, 2.4, '#e2dace'); ellipse(p, 6, 8, 2.5, 1.5, '#cfc6b8');
  p.px(3, 3, '#f4f0e8'); p.px(10, 5, '#f4f0e8');
}, '#9a9080');

const pondLily = () => makeSprite('g:mini_pond', 22, 12, p => {
  ellipse(p, 11, 6, 11, 6, '#c8c2b8'); ellipse(p, 11, 6, 9, 4.6, '#7cc3e8'); ellipse(p, 11, 5.2, 7, 3, '#9fd3f2');
  ellipse(p, 7, 6, 2.2, 1.3, '#a5d470'); p.px(7, 5, '#f9c6d2'); ellipse(p, 15, 7, 1.8, 1.1, '#a5d470');
}, '#6a6660');

const swing = () => makeSprite('g:swing', 22, 30, p => {
  p.rect(0, 0, 22, 3, WOOD); p.rect(1, 3, 2, 27, WOOD_D); p.rect(19, 3, 2, 27, WOOD_D);
  p.rect(6, 3, 1, 18, '#e8dcc4'); p.rect(15, 3, 1, 18, '#e8dcc4');
  p.rect(5, 21, 12, 2, '#f59ab3');
  for (let i = 0; i < 6; i++) ellipse(p, 2 + i * 3.6, 2 + (i % 2), 1.6, 1.3, i % 2 ? '#a5d470' : '#f6b8cc');
}, '#4a3020');

export const ART: Record<string, Art> = {
  bed: { place: 'floor', size: [2, 3], sprite: bed },
  wardrobe: { place: 'floor', size: [2, 1], sprite: wardrobe },
  nightstand: { place: 'floor', sprite: nightstand },
  floor_lamp: { place: 'floor', sprite: floorLamp, glow: true },
  potted_plant: { place: 'any', sprite: pottedPlant },
  chair: { place: 'any', sprite: bearChair },
  low_table: { place: 'floor', size: [2, 1], sprite: lowTable },
  round_rug: { place: 'floor', size: [2, 2], sprite: roundRug, flat: true },
  sofa: { place: 'floor', size: [2, 1], sprite: sofa },
  bookshelf: { place: 'floor', size: [2, 1], sprite: bookshelf },
  teddy: { place: 'any', sprite: teddy },
  desk: { place: 'floor', size: [2, 1], sprite: desk },

  painting: { place: 'wall', sprite: painting },
  clock: { place: 'wall', sprite: clock },
  mirror: { place: 'wall', sprite: mirror },
  bunting: { place: 'wall', sprite: bunting },
  wall_shelf: { place: 'wall', sprite: wallShelf },
  photo_string: { place: 'wall', sprite: photoString },
  heart_frame: { place: 'wall', sprite: heartFrame },

  hedge: { place: 'garden', sprite: hedge },
  tulip_bed: { place: 'garden', sprite: flowerBed('tulip', '#f59ab3', '#e0718f') },
  daisy_bed: { place: 'garden', sprite: flowerBed('daisy', '#ffffff', '#f6c64e') },
  hydrangea: { place: 'garden', sprite: flowerBed('hydrangea', '#a9b8f2', '#c9a2e8') },
  sunflower: { place: 'garden', sprite: flowerBed('sunflower', '#f6c64e', '#8a5a3c', true) },
  rose_arch: { place: 'garden', sprite: roseArch },
  gazebo: { place: 'garden', size: [2, 2], sprite: gazebo },
  garden_bench: { place: 'garden', sprite: bench },
  lamp_post: { place: 'garden', sprite: lampPost, glow: true },
  birdbath: { place: 'garden', sprite: birdbath },
  picket_fence: { place: 'garden', sprite: picketFence },
  cherry_tree: { place: 'garden', size: [2, 1], sprite: cherryTree },
  stone_path: { place: 'garden', sprite: stonePath, flat: true },
  mini_pond: { place: 'garden', size: [2, 1], sprite: pondLily, flat: true },
  swing: { place: 'garden', size: [2, 1], sprite: swing },
  ...EXTRA_ART,
  ...HOLIDAY_ART,
  ...TRIP_ART,
  ...KID_ART,
};

function xy(p: [number, number]): [number, number] {
  return p;
}

/** Nơi một món được đặt: đồ không vẽ tay (emoji) đặt được trên sàn và ngoài vườn */
/** Đồ không vẽ tay nhưng treo được lên tường */
const HANGABLE = new Set(['certificate', 'lantern', 'chime', 'guitar', 'photo_frame', 'den_ca_chep', 'bong_bay_tim', 'kite', 'star_lantern', 'kid_card', 'peach']);
/** Mặt trên của bàn / tủ: cao bao nhiêu điểm ảnh (để bày đồ nhỏ lên) */
export const SURFACE: Record<string, number> = { nightstand: 9, low_table: 8, desk: 10, bookshelf: 23, wardrobe: 27, dining_table: 8, dresser: 11, kitchen_counter: 11 };
/** Món nhỏ bày được lên mặt bàn / tủ: đồ 1 ô đặt-đâu-cũng-được (trừ ghế) */
export const canTop = (itemId: string) => placeOf(itemId) === 'any' && itemId !== 'chair' && sizeOf(itemId)[0] === 1 && sizeOf(itemId)[1] === 1;
export const placeOf = (itemId: string): Place => (HANGABLE.has(itemId) ? 'hang' : ART[itemId]?.place ?? 'any');

/**
 * Cỡ (px) cho đồ vẽ từ emoji, theo kích thước thật so với nhân vật cao ~24 px
 * (ấm trà, nến, radio chỉ cỡ cái đầu; đàn guitar cao tới ngực).
 */
const EMOJI_PX: Record<string, number> = {
  // đồ nhỏ cầm tay
  teapot: 8, candle: 7, radio: 9, books: 8, mushroom: 8, pet_toy: 7, pet_ball: 6, kid_card: 8, firefly_jar: 9, whale_pearl: 9,
  flower: 9, chime: 9, photo_frame: 9, gift_box: 9, bucket: 9, lotus: 10, moon_flower: 10, bouquet: 10, lantern: 10,
  rainbow_shard: 10, stardust: 10, keepsake: 10, pumpkin: 11,
  // đồ vừa (tới đầu gối / thắt lưng)
  sandcastle: 12, cactus: 12, driftwood: 12, ice_lantern: 12, star_lantern: 12, coral: 12, pet_bed: 12,
  campfire: 14, fishing: 14, kite: 14, fern: 14, guitar: 15, lost_umbrella: 16,
  // đồ to (ngang hoặc cao hơn người)
  peach: 18, trident: 18, snowman: 20, canoe: 22, umbrella: 24, tent: 26, xmas_tree: 26, palm: 30, hut: 30,
};
export const emojiPx = (itemId: string) => EMOJI_PX[itemId] ?? 12;
export const sizeOf = (itemId: string): [number, number] => ART[itemId]?.size ?? [1, 1];

/** Chăn đắp phủ lên người đang nằm (cùng khung với giường để đặt trùng vị trí) */
export const bedQuiltSprite = () => isoSprite('bed-quilt', 2, 3, 30, q => {
  q.box(0, 0.95, 6, 2, 2.0, 7, shade('#f59ab3'));
  q.flat(0, 0.95, 13, 2, 0.3, '#ffd6e2');
  for (const [gx, gy] of [[0.5, 1.6], [1.4, 1.5], [0.9, 2.2], [1.6, 2.5], [0.4, 2.6]]) {
    const [x, y] = q.pt(gx, gy, 13);
    q.px(x - 1, y, '#ffffff'); q.px(x + 1, y, '#ffffff'); q.rect(x - 1, y + 1, 3, 1, '#ffffff'); q.px(x, y + 2, '#ffffff');
  }
});
/** Hai chiếc gối trên giường (tọa độ trong khung giường 2×3) */
export const BED_PILLOWS: [number, number][] = [[0.575, 0.775], [1.425, 0.775]];
