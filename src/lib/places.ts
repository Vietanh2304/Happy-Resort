// Địa điểm mới: quán cà phê sách, vòng đu quay bên biển, bãi cắm trại có lửa trại; cùng thú cưng chung.
import type { Phase } from './content';
import { ellipse } from './iso';
import { makeSprite, mix, type Pen } from './pixel';
import { seeded } from './rng';
import type { HillSky } from './townSprites';

const OUT = '#5a3a2e';
const BOOKS = ['#e86a7a', '#f6c64e', '#8db8ef', '#a5d470', '#b7a6e8', '#f7a98a', '#7cc8b4', '#c98a52', '#f59ab3'];

function bands(p: Pen, colors: string[], y0: number, y1: number, w: number) {
  const n = colors.length, h = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    p.rect(0, y0 + Math.floor(i * h), w, Math.ceil(h) + 1, colors[i]);
    if (i < n - 1) for (let x = (i * 3) % 4; x < w; x += 4) p.px(x, y0 + Math.floor((i + 1) * h), colors[i + 1]);
  }
}
function shelf(p: Pen, x: number, y: number, w: number, rows: number, rand: () => number) {
  p.rect(x, y, w, rows * 14 + 3, '#8a5a3c'); p.rect(x + 1, y + 1, w - 2, rows * 14 + 1, '#6e4630');
  for (let r = 0; r < rows; r++) {
    const by = y + 2 + r * 14;
    let bx = x + 2;
    while (bx < x + w - 4) {
      const bw = 2 + Math.floor(rand() * 2), bh = 8 + Math.floor(rand() * 4), c = BOOKS[Math.floor(rand() * BOOKS.length)];
      if (rand() < 0.12) { p.rect(bx, by + 12 - 3, 7, 3, c); p.rect(bx, by + 12 - 3, 7, 1, mix(c, '#ffffff', 0.4)); bx += 8; continue; }
      p.rect(bx, by + 12 - bh, bw, bh, c); p.px(bx, by + 12 - bh, mix(c, '#ffffff', 0.4)); p.rect(bx, by + 8, bw, 1, mix(c, '#000000', 0.2));
      bx += bw + (rand() < 0.2 ? 1 : 0);
    }
    p.rect(x + 1, by + 12, w - 2, 2, '#a8724a'); p.rect(x + 1, by + 12, w - 2, 1, '#c98a52');
  }
}

// ───────── Quán cà phê sách ─────────

export function cafeBuildingSprite(lit: boolean) {
  return makeSprite(`cafe-bld:${lit}`, 58, 60, p => {
    // Tường gỗ xanh rêu, mái nâu ngói, ống khói
    p.rect(48, 2, 6, 12, '#b07a5a'); p.rect(47, 1, 8, 2, '#8a5a3c');
    for (let y = 8; y < 24; y++) { const inset = Math.max(0, 24 - y) / 2; p.rect(inset, y, 58 - inset * 2, 1, (y % 3 === 0) ? '#8a4a3a' : '#a85a46'); }
    p.rect(0, 22, 58, 2, '#7a3a2e');
    p.rect(3, 24, 52, 32, '#7ea886');
    for (let x = 3; x < 55; x += 5) p.rect(x, 24, 1, 32, '#6c9474');
    p.rect(3, 24, 52, 2, '#9cc4a2');
    // Biển hiệu cốc cà phê và quyển sách
    p.rect(14, 10, 30, 9, '#fff4dc'); p.rect(14, 10, 30, 1, '#ffffff'); p.rect(14, 18, 30, 1, '#d8c09a');
    p.rect(18, 12, 6, 5, '#8a5a3c'); p.rect(24, 13, 2, 2, '#8a5a3c'); p.px(20, 11, '#d8c09a'); p.px(22, 10, '#d8c09a');
    p.rect(29, 12, 11, 5, '#e86a7a'); p.rect(34, 12, 1, 5, '#fff4dc'); p.rect(30, 13, 3, 1, '#fff4dc'); p.rect(36, 13, 3, 1, '#fff4dc');
    // Mái hiên sọc kem-nâu
    for (let x = 1; x < 57; x++) { const c = Math.floor((x - 1) / 4) % 2 ? '#fff4dc' : '#c98a52'; p.rect(x, 26, 1, 5, c); if ((x - 1) % 4 > 0 && (x - 1) % 4 < 3) p.px(x, 31, c); }
    // Cửa sổ lớn thấy kệ sách và đèn vàng
    const glass = lit ? '#ffe7a8' : '#d8eef2';
    p.rect(6, 34, 24, 16, '#5a3a2e'); p.rect(7, 35, 22, 14, glass);
    for (let i = 0; i < 9; i++) p.rect(8 + i * 2.4, 40 + (i % 3), 2, 8 - (i % 3), BOOKS[i]);
    p.rect(7, 47, 22, 2, '#8a5a3c'); p.rect(17, 35, 1, 14, '#5a3a2e');
    ellipse(p, 12, 37, 1.5, 1.5, lit ? '#fff8d0' : '#f6c64e');
    // Cửa gỗ có chuông
    p.rect(35, 34, 14, 22, '#8a5a3c'); p.rect(36, 35, 12, 20, '#a8724a'); p.rect(38, 37, 8, 8, glass); p.px(46, 46, '#f6c64e');
    p.px(42, 33, '#f6c64e');
    // Bảng phấn, chậu hoa, bậc thềm
    p.rect(50, 42, 6, 10, '#3a3a3a'); p.rect(51, 43, 4, 1, '#ffffff'); p.rect(51, 45, 3, 1, '#f6c64e'); p.rect(51, 47, 4, 1, '#ffffff');
    p.rect(3, 52, 8, 4, '#dc9a6a'); for (let i = 0; i < 4; i++) p.px(4 + i * 2, 51, BOOKS[i]);
    p.rect(2, 56, 54, 3, '#c8beb0'); p.rect(2, 56, 54, 1, '#e8e0d4');
  }, OUT);
}

export function cafeRoom() {
  return makeSprite('room:cafe:v1', 192, 144, p => {
    const rand = seeded('cafe');
    // Tường gỗ ấm, ốp chân tường xanh rêu
    p.rect(0, 0, 192, 92, '#d8a878');
    for (let x = 0; x < 192; x += 8) { p.rect(x, 0, 1, 92, '#c8956a'); p.rect(x + 1, 0, 1, 92, '#e2b688'); }
    p.rect(0, 70, 192, 22, '#6c9474'); p.rect(0, 70, 192, 2, '#9cc4a2'); p.rect(0, 91, 192, 1, '#4e7458');
    for (let x = 4; x < 192; x += 12) p.rect(x, 74, 1, 16, '#5e8466');
    // Hai kệ sách lớn
    // Cửa sổ lớn nhìn ra phố (ô kính chia ô, chậu cây treo)
    p.rect(56, 10, 80, 54, '#8a5a3c'); p.rect(58, 12, 76, 50, '#bfe3ef');
    bands(p, ['#9fd0e8', '#bfe3ef', '#e2f2f6'], 12, 44, 192);
    p.rect(0, 0, 56, 70, '#d8a878'); p.rect(136, 0, 56, 70, '#d8a878');
    shelf(p, 4, 6, 42, 4, seeded('cafe'));
    shelf(p, 146, 6, 42, 4, seeded('cafe2'));
    p.rect(56, 10, 80, 2, '#8a5a3c'); p.rect(56, 10, 2, 54, '#8a5a3c'); p.rect(134, 10, 2, 54, '#8a5a3c');
    // Phố bên ngoài: mái nhà và cây
    for (let x = 58; x < 134; x += 14) { const h = 10 + Math.floor(rand() * 8); p.rect(x, 54 - h, 12, h, ['#f4d6c0', '#e8c8e0', '#d0e4c8'][x % 3]); p.rect(x - 1, 54 - h - 2, 14, 3, '#c86a5a'); p.rect(x + 3, 54 - h + 4, 3, 3, '#ffe7a8'); }
    for (const x of [64, 104, 126]) { ellipse(p, x, 46, 6, 6, '#86c257'); ellipse(p, x - 2, 44, 3, 3, '#b4dc7c'); }
    p.rect(58, 54, 76, 8, '#d8d0c4');
    p.rect(95, 12, 2, 50, '#8a5a3c'); p.rect(58, 36, 76, 2, '#8a5a3c');
    p.rect(54, 62, 84, 4, '#a8724a'); p.rect(54, 62, 84, 1, '#c98a52');
    // Bậu cửa: chậu cây, mèo ngủ
    for (const x of [62, 126]) { p.rect(x - 3, 56, 7, 6, '#dc9a6a'); ellipse(p, x, 54, 5, 4, '#6aa645'); ellipse(p, x - 1, 52, 2, 2, '#a5d470'); }
    // Dây đèn bóng tròn
    for (let x = 0; x < 192; x += 1) { const y = 4 + Math.round(Math.sin((x / 192) * Math.PI) * 6); p.px(x, y, '#5a3a2e'); if (x % 16 === 8) { p.rect(x - 1, y + 1, 3, 3, '#ffe9a0'); p.px(x, y + 1, '#fff8d0'); } }
    // Quầy pha chế bên phải, máy espresso
    p.rect(148, 66, 44, 26, '#8a5a3c'); p.rect(148, 66, 44, 3, '#c98a52'); p.rect(150, 72, 40, 18, '#a8724a');
    for (let x = 152; x < 190; x += 6) p.rect(x, 74, 1, 14, '#8a5a3c');
    p.rect(166, 52, 16, 14, '#c8ccd4'); p.rect(167, 53, 14, 4, '#e8ecf0'); p.rect(170, 60, 3, 4, '#5a5a6a'); p.rect(176, 60, 3, 4, '#5a5a6a');
    p.rect(152, 58, 5, 8, '#fffaf0'); p.rect(158, 60, 5, 6, '#fffaf0'); p.rect(153, 59, 3, 2, '#8a5a3c');
    // Sàn gỗ xương cá
    p.rect(0, 92, 192, 52, '#c98a52');
    for (let y = 92; y < 144; y += 4) for (let x = ((y / 4) % 2) * 6; x < 192; x += 12) { p.rect(x, y, 6, 4, '#b57a46'); p.rect(x, y, 6, 1, '#d8a066'); }
    // Thảm tròn dưới bàn
    ellipse(p, 96, 124, 50, 14, '#e8c8a0'); ellipse(p, 96, 124, 46, 12, '#f2dcc0');
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; p.px(96 + Math.cos(a) * 42, 124 + Math.sin(a) * 10, '#e86a7a'); }
  }, null);
}

export function cafeTableSprite() {
  return makeSprite('cafe-table', 40, 26, p => {
    ellipse(p, 20, 6, 19, 6, '#a8724a'); ellipse(p, 20, 5, 18, 5, '#c98a52'); ellipse(p, 17, 4, 8, 2, '#d8a066');
    p.rect(18, 10, 4, 12, '#6e4630'); p.rect(12, 22, 16, 3, '#6e4630');
    // Chồng sách nhỏ và chậu hoa trên bàn
    p.rect(26, 0, 8, 2, '#8db8ef'); p.rect(27, -1, 7, 1, '#e86a7a');
    p.rect(6, 1, 4, 3, '#dc9a6a'); p.px(7, 0, '#f59ab3'); p.px(9, 0, '#f6c64e');
  }, OUT);
}
export function cafeChairSprite() {
  return makeSprite('cafe-chair', 22, 30, p => {
    p.rect(2, 0, 18, 18, '#7ea886'); p.rect(4, 2, 14, 14, '#9cc4a2'); p.rect(4, 2, 14, 2, '#b8dcbc');
    p.rect(0, 10, 4, 14, '#6c9474'); p.rect(18, 10, 4, 14, '#6c9474');
    p.rect(2, 18, 18, 6, '#9cc4a2'); p.rect(2, 18, 18, 1, '#b8dcbc');
    p.rect(3, 24, 2, 6, '#6e4630'); p.rect(17, 24, 2, 6, '#6e4630');
  }, OUT);
}

// ───────── Vòng đu quay ─────────

export function ferrisWheelSprite() {
  return makeSprite('ferris:v1', 72, 92, p => {
    const cx = 36, cy = 36, R = 32;
    const cab = ['#f59ab3', '#f6c64e', '#8db8ef', '#a5d470', '#b7a6e8', '#f7a98a', '#7cc8b4', '#e86a7a'];
    // Chân đỡ chữ A
    for (let y = cy; y < 90; y++) { const k = (y - cy) / (90 - cy); p.rect(cx - 2 - k * 20, y, 3, 1, '#d8d0e0'); p.rect(cx - 1 + k * 20, y, 3, 1, '#c0b8cc'); }
    p.rect(cx - 26, 88, 52, 3, '#a8a0b8');
    // Vành và nan hoa
    for (let a = 0; a < 360; a += 1) { const r = (a * Math.PI) / 180; p.px(cx + Math.cos(r) * R, cy + Math.sin(r) * R, '#ffffff'); p.px(cx + Math.cos(r) * (R - 3), cy + Math.sin(r) * (R - 3), '#f2d0e0'); }
    for (let i = 0; i < 16; i++) { const r = (i / 16) * Math.PI * 2; for (let t = 4; t < R; t += 1) p.px(cx + Math.cos(r) * t, cy + Math.sin(r) * t, i % 2 ? '#f2d0e0' : '#ffffff'); }
    ellipse(p, cx, cy, 4, 4, '#f59ab3'); ellipse(p, cx, cy, 2, 2, '#fff1a8');
    // Đèn trên vành
    for (let i = 0; i < 24; i++) { const r = (i / 24) * Math.PI * 2; p.px(cx + Math.cos(r) * (R + 1), cy + Math.sin(r) * (R + 1), i % 2 ? '#fff1a8' : '#ffc6dc'); }
    // Cabin treo
    for (let i = 0; i < 8; i++) {
      const r = (i / 8) * Math.PI * 2, x = cx + Math.cos(r) * R, y = cy + Math.sin(r) * R;
      p.rect(x, y, 1, 2, '#8a8098');
      p.rect(x - 4, y + 2, 9, 7, cab[i]); p.rect(x - 3, y + 3, 7, 3, '#e8f6ff'); p.rect(x - 4, y + 2, 9, 1, mix(cab[i], '#ffffff', 0.4));
    }
    // Quầy vé
    p.rect(cx - 8, 80, 16, 9, '#f59ab3'); p.rect(cx - 9, 78, 18, 3, '#ffffff'); p.rect(cx - 4, 83, 8, 4, '#fff1a8');
  }, '#6a5a7a');
}

/** Cabin nhìn từ bên trong: khung cửa sổ lớn (trong suốt để thấy cảnh trôi bên ngoài), hai ghế đối diện */
export function wheelCabinSprite() {
  return makeSprite('wheel-cabin:v1', 192, 144, p => {
    const wall = '#f6b8cc', wallD = '#e898b0', wallL = '#ffd6e2';
    for (let y = 0; y < 144; y++) for (let x = 0; x < 192; x++) {
      const inWin = x >= 18 && x < 174 && y >= 12 && y < 96 && !((x < 24 || x >= 168) && (y < 18 || y >= 90) && ((x < 24 ? 24 - x : x - 167) + (y < 18 ? 18 - y : y - 89)) > 7);
      if (inWin) continue;
      p.px(x, y, y < 12 ? wallD : wall);
    }
    // Viền cửa sổ trắng và thanh chia
    for (let x = 18; x < 174; x++) { p.px(x, 11, '#ffffff'); p.px(x, 96, '#ffffff'); p.px(x, 97, wallD); }
    for (let y = 12; y < 96; y++) { p.px(17, y, '#ffffff'); p.px(174, y, '#ffffff'); }
    p.rect(95, 12, 3, 84, '#ffffff'); p.rect(96, 12, 1, 84, '#f2e8ee');
    p.rect(18, 52, 156, 2, 'rgba(255,255,255,0.75)');
    // Tay vịn, trần có đèn tim
    p.rect(0, 0, 192, 4, wallD); p.rect(0, 4, 192, 1, wallL);
    p.rect(88, 2, 16, 6, '#fff1a8'); p.map(['.R.R.', 'RRRRR', '.RRR.', '..R..'], { R: '#f59ab3' }, 94, 2);
    // Hai ghế bọc nệm đối diện
    for (const [x0, dir] of [[8, 1], [128, -1]] as const) {
      p.rect(x0, 104, 56, 10, '#e86a8a'); p.rect(x0, 104, 56, 2, '#ff9ab4');
      p.rect(x0 + (dir === 1 ? 0 : 50), 84, 6, 24, '#d8607a'); p.rect(x0 + (dir === 1 ? 1 : 51), 85, 4, 22, '#ff9ab4');
      p.rect(x0, 114, 56, 14, wallD);
    }
    // Sàn
    p.rect(0, 128, 192, 16, '#c8a8b8'); for (let x = 0; x < 192; x += 10) p.rect(x, 128, 1, 16, '#b898a8');
    // Bàn nhỏ giữa có lọ hoa
    p.rect(84, 112, 24, 3, '#ffffff'); p.rect(94, 115, 4, 13, '#e8e0e8');
    p.rect(93, 106, 6, 6, '#bfe3ef'); p.px(94, 104, '#e86a7a'); p.px(96, 103, '#f59ab3'); p.px(97, 105, '#e86a7a'); p.rect(95, 104, 1, 3, '#6aa645');
  }, null);
}

const PANO: Record<string, string[]> = {
  day: ['#3fa9f5', '#6cc0f8', '#9fd6fb', '#c8ecff', '#e2f6ff'],
  sunset: ['#3a2f8a', '#6a3fa8', '#b84a9a', '#f0608a', '#ff8a5c', '#ffb347', '#ffd98a'],
  dawn: ['#6a7ad8', '#9a8ae0', '#e0a0c8', '#ffb8a0', '#ffd8b0'],
  night: ['#060a2a', '#0c1440', '#16205a', '#1f2c72', '#2e3a86'],
};
/** Cảnh bên ngoài cabin, cao 360: trên là trời, giữa là biển, dưới là làng. Cabin lên cao thì thấy nhiều trời hơn. */
export function wheelPanorama(sky: HillSky) {
  const mode = sky === 'meteor' || sky === 'aurora' ? 'night' : sky;
  return makeSprite(`wheel-pano:${mode}`, 192, 360, p => {
    const rand = seeded(`pano-${mode}`);
    const H = 236; // đường chân trời
    bands(p, PANO[mode], 0, H, 192);
    if (mode === 'night') {
      for (let i = 0; i < 160; i++) { const x = Math.floor(rand() * 192), y = Math.floor(rand() * (H - 10)); p.px(x, y, rand() < 0.2 ? '#ffe9a0' : '#ffffff'); }
      ellipse(p, 140, 150, 10, 10, '#fff6c8'); ellipse(p, 144, 147, 9, 9, '#0c1440');
    } else if (mode === 'sunset' || mode === 'dawn') {
      const sx = mode === 'sunset' ? 120 : 70;
      ellipse(p, sx, H, 26, 22, mix(PANO[mode][PANO[mode].length - 2], '#ffffff', 0.25));
      ellipse(p, sx, H, 16, 16, '#fbe6a0');
      for (const [cx, cy, w] of [[40, 160, 40], [150, 140, 30], [90, 190, 50], [170, 200, 24], [30, 110, 30]]) {
        p.rect(cx - w / 2, cy, w, 3, mode === 'sunset' ? '#f4b0c6' : '#ffd6e6'); p.rect(cx - w / 2 + 5, cy + 3, w - 10, 1, '#c8508a');
      }
    } else {
      ellipse(p, 150, 120, 8, 8, '#fff6a8');
      for (const [cx, cy] of [[40, 150], [110, 180], [168, 200], [70, 90]]) { ellipse(p, cx, cy, 14, 5, '#ffffff'); ellipse(p, cx - 6, cy - 3, 7, 4, '#ffffff'); }
    }
    // Chim bay
    if (mode !== 'night') for (const [x, y] of [[60, 120], [70, 126], [140, 170]]) { p.px(x, y, '#5a4a6a'); p.px(x - 1, y - 1, '#5a4a6a'); p.px(x + 1, y - 1, '#5a4a6a'); }
    // Biển
    const sea = mode === 'night' ? '#16245a' : mode === 'sunset' ? '#b04a8a' : mode === 'dawn' ? '#8a8ad8' : '#1fa0e0';
    p.rect(0, H, 192, 50, sea);
    for (let i = 0; i < 60; i++) p.rect(Math.floor(rand() * 192), H + 2 + Math.floor(rand() * 46), 2 + Math.floor(rand() * 5), 1, mix(sea, '#ffffff', 0.35));
    if (mode !== 'day') { const gx = mode === 'sunset' ? 120 : mode === 'dawn' ? 70 : 140; for (let y = H + 1; y < H + 30; y += 2) { const w = 14 - (y - H) / 3; p.rect(gx - w / 2, y, w, 1, '#fbe6a0'); } }
    // Bờ và làng phía dưới: mái nhà, cây, đèn đường
    const land = mode === 'night' ? '#2a4a3a' : mode === 'sunset' ? '#7a8a4a' : '#86c257';
    p.rect(0, H + 50, 192, 74, land);
    p.rect(0, H + 50, 192, 3, '#f4e3bd');
    for (let i = 0; i < 16; i++) {
      const x = i * 12 + Math.floor(rand() * 4), y = H + 62 + (i % 3) * 14, c = ['#f08aa6', '#8db8ef', '#f6c64e', '#c86a5a', '#b7a6e8'][i % 5];
      p.rect(x, y, 10, 8, mode === 'night' ? '#5a5a7a' : '#fbecd2'); p.rect(x - 1, y - 3, 12, 4, mode === 'night' ? mix(c, '#000033', 0.5) : c);
      p.rect(x + 3, y + 3, 3, 3, mode === 'night' ? '#ffe7a8' : '#bfe3ef');
    }
    for (let i = 0; i < 20; i++) { const x = Math.floor(rand() * 192), y = H + 58 + Math.floor(rand() * 60); ellipse(p, x, y, 4, 4, mode === 'night' ? '#1e3a2e' : '#5f9a48'); }
    if (mode === 'night') for (let i = 0; i < 30; i++) p.px(Math.floor(rand() * 192), H + 56 + Math.floor(rand() * 64), '#ffd27a');
  }, null);
}

// ───────── Bãi cắm trại ─────────

const CAMP_SKY: Record<Phase, string[]> = {
  dawn: ['#6a7ad8', '#c8a0d0', '#ffc8a8'],
  day: ['#4fb0f5', '#8fd4ff', '#c8ecff'],
  sunset: ['#4a3a9a', '#c0508a', '#ff9a5c', '#ffd08a'],
  night: ['#060a2a', '#101a4a', '#1c2a6a'],
};
export function campBackground(phase: Phase) {
  return makeSprite(`camp:${phase}`, 192, 144, p => {
    const rand = seeded('camp');
    const dark = phase === 'night';
    bands(p, CAMP_SKY[phase], 0, 62, 192);
    if (dark) {
      for (let i = 0; i < 90; i++) p.px(Math.floor(rand() * 192), Math.floor(rand() * 50), rand() < 0.2 ? '#ffe9a0' : '#ffffff');
      for (let i = 0; i < 260; i++) { const t = rand(); p.px(Math.floor(t * 192), Math.floor(8 + t * 30 + (rand() - 0.5) * 12), '#4a4a8a'); }
      ellipse(p, 156, 16, 7, 7, '#fff6c8');
    } else if (phase === 'sunset') ellipse(p, 60, 58, 12, 10, '#fbe6a0');
    // Núi và rừng thông phía xa
    for (let x = 0; x < 192; x++) { const h = 14 + Math.sin(x / 23) * 8 + Math.sin(x / 9) * 2; p.rect(x, 62 - h, 1, h, dark ? '#1a2050' : phase === 'sunset' ? '#7a4a8a' : '#7aa0d0'); }
    // Hồ phản chiếu
    const lake = dark ? '#16245a' : phase === 'sunset' ? '#c06a9a' : '#5fb8e0';
    p.rect(0, 62, 192, 18, lake);
    for (let i = 0; i < 30; i++) p.rect(Math.floor(rand() * 192), 63 + Math.floor(rand() * 16), 3, 1, mix(lake, '#ffffff', 0.3));
    if (dark) for (let y = 63; y < 79; y += 2) p.rect(153 + ((y / 2) % 2), y, 6, 1, '#fff6c8');
    // Hàng thông hai bên
    const pine = dark ? '#16302a' : '#3e7a4a', pineL = dark ? '#22443a' : '#5a9a5a';
    for (let i = 0; i < 26; i++) {
      const x = i < 13 ? i * 6 - 4 : 120 + (i - 13) * 6, base = 80 + (i % 3) * 2, h = 26 + (i % 4) * 5;
      if (x > 60 && x < 124) continue;
      for (let y = 0; y < h; y++) { const w = Math.floor((y / h) * 7) + 1; p.rect(x - w, base - h + y, w * 2 + 1, 1, y % 5 < 2 ? pineL : pine); }
      p.rect(x, base, 2, 3, '#4a3020');
    }
    // Bãi cỏ, lối đất quanh lửa trại
    const grass = dark ? '#2a4a3a' : phase === 'sunset' ? '#7a9a4a' : '#8cc65c';
    p.rect(0, 80, 192, 64, grass);
    for (let i = 0; i < 300; i++) { const x = Math.floor(rand() * 192), y = 82 + Math.floor(rand() * 62); p.px(x, y, mix(grass, '#ffffff', 0.15)); p.px(x + 2, y, mix(grass, '#000000', 0.15)); }
    ellipse(p, 96, 122, 44, 16, dark ? '#4a3a30' : '#c8a070'); ellipse(p, 96, 122, 40, 13, dark ? '#5a4636' : '#d8b080');
    for (let i = 0; i < 20; i++) p.px(60 + Math.floor(rand() * 72), 112 + Math.floor(rand() * 20), dark ? '#3a2e26' : '#b08a5a');
    // Hoa dại
    for (let i = 0; i < 24; i++) { const x = Math.floor(rand() * 192), y = 88 + Math.floor(rand() * 54); if (Math.abs(x - 96) < 46 && y > 106) continue; p.px(x, y, dark ? '#c8d0ff' : ['#f59ab3', '#f6c64e', '#ffffff'][i % 3]); }
  }, null);
}

export function tentSprite() {
  return makeSprite('tent:v1', 46, 32, p => {
    for (let y = 0; y < 30; y++) {
      const half = Math.floor(y * 0.8) + 1;
      p.rect(23 - half, y, half, 1, '#f6a95e'); p.rect(23, y, half, 1, '#e8884a');
    }
    for (let y = 10; y < 30; y++) { const half = Math.floor((y - 10) * 0.45) + 1; p.rect(23 - half, y, half * 2, 1, '#ffd8a0'); }
    for (let y = 16; y < 30; y++) { const half = Math.floor((y - 16) * 0.35); p.rect(23 - half, y, half * 2, 1, '#5a3a2e'); }
    p.rect(0, 29, 46, 2, '#8a5a3c');
    // Dây đèn nhỏ trên lều
    for (let i = 0; i < 9; i++) p.px(6 + i * 4, 26 - Math.floor(Math.abs(4 - i) * 1.5) - 12, ['#fff1a8', '#ffc6dc', '#c8f0ff'][i % 3]);
  }, OUT);
}
export function campfireSprite() {
  return makeSprite('campfire:v1', 26, 12, p => {
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; ellipse(p, 13 + Math.cos(a) * 10, 7 + Math.sin(a) * 3.5, 2, 1.5, i % 2 ? '#a8a0a0' : '#c8c0c0'); }
    p.rect(5, 5, 16, 3, '#8a5a3c'); p.rect(5, 5, 16, 1, '#b07a4a');
    p.rect(9, 3, 3, 7, '#6e4630'); p.rect(14, 3, 3, 7, '#7a5038');
    ellipse(p, 13, 7, 4, 2, '#ff8a3d');
  }, OUT);
}
export function logSeatSprite() {
  return makeSprite('log-seat', 30, 10, p => {
    p.rect(2, 1, 26, 7, '#a8724a'); p.rect(2, 1, 26, 2, '#c98a52'); p.rect(2, 7, 26, 1, '#7a5038');
    ellipse(p, 2, 4.5, 2, 3.5, '#e8c8a0'); ellipse(p, 2, 4.5, 1, 2, '#c8a070');
    ellipse(p, 28, 4.5, 2, 3.5, '#e8c8a0'); ellipse(p, 28, 4.5, 1, 2, '#c8a070');
  }, OUT);
}

// ───────── Thú cưng ─────────

export type PetFrame = 'sit' | 'walk' | 'sleep';
const PETS: Record<string, { body: string; light: string; dark: string; ear: 'point' | 'flop' | 'long' | 'round' | 'big'; tail: 'curl' | 'wag' | 'puff' | 'none' }> = {
  cat: { body: '#f6b26b', light: '#fff1d6', dark: '#d88a4a', ear: 'point', tail: 'curl' },
  dog: { body: '#c98a52', light: '#f6e0c0', dark: '#8a5a3c', ear: 'flop', tail: 'wag' },
  bunny: { body: '#fffaf0', light: '#ffffff', dark: '#e8d8d0', ear: 'long', tail: 'puff' },
  corgi: { body: '#f0a050', light: '#ffffff', dark: '#c87a3a', ear: 'big', tail: 'puff' },
  hamster: { body: '#f2c890', light: '#fff6e8', dark: '#d8a060', ear: 'round', tail: 'none' },
};
export const PET_KINDS: { id: string; name: string; icon: string }[] = [
  { id: 'cat', name: 'Mèo con', icon: '🐱' }, { id: 'dog', name: 'Cún con', icon: '🐶' }, { id: 'corgi', name: 'Corgi', icon: '🦊' },
  { id: 'bunny', name: 'Thỏ trắng', icon: '🐰' }, { id: 'hamster', name: 'Hamster', icon: '🐹' },
];

export function petSprite(kind: string, frame: PetFrame) {
  const c = PETS[kind] ?? PETS.cat;
  return makeSprite(`pet:${kind}:${frame}`, 18, 16, p => {
    const sleep = frame === 'sleep';
    const step = frame === 'walk';
    const by = sleep ? 11 : 9;
    // Đuôi
    if (c.tail === 'curl') { p.rect(1, by - 3, 2, 4, c.body); p.px(2, by - 4, c.body); p.px(3, by - 5, c.dark); }
    if (c.tail === 'wag') { p.rect(1, by - (step ? 4 : 2), 2, 4, c.dark); }
    if (c.tail === 'puff') ellipse(p, 2.5, by, 1.6, 1.6, c.light);
    // Thân
    ellipse(p, 7.5, by + 1, 5.5, sleep ? 3 : 3.5, c.body);
    ellipse(p, 8, by + 2, 3.5, 1.6, c.light);
    // Chân
    if (!sleep) {
      p.rect(4 + (step ? 1 : 0), by + 3, 2, 3, c.dark); p.rect(9 - (step ? 1 : 0), by + 3, 2, 3, c.dark);
      p.rect(4 + (step ? 1 : 0), by + 5, 2, 1, c.light); p.rect(9 - (step ? 1 : 0), by + 5, 2, 1, c.light);
    }
    // Đầu
    const hx = sleep ? 13 : 13, hy = sleep ? by : by - 4;
    ellipse(p, hx, hy, 4.2, 3.8, c.body);
    ellipse(p, hx + 0.5, hy + 1.5, 2.6, 1.6, c.light);
    // Tai
    if (c.ear === 'point') { p.rect(hx - 3, hy - 5, 2, 3, c.body); p.px(hx - 2, hy - 4, '#f59ab3'); p.rect(hx + 2, hy - 5, 2, 3, c.body); p.px(hx + 2, hy - 4, '#f59ab3'); }
    if (c.ear === 'big') { p.rect(hx - 4, hy - 6, 3, 4, c.body); p.px(hx - 3, hy - 5, c.light); p.rect(hx + 2, hy - 6, 3, 4, c.body); p.px(hx + 3, hy - 5, c.light); }
    if (c.ear === 'flop') { p.rect(hx - 5, hy - 2, 2, 5, c.dark); p.rect(hx + 4, hy - 2, 2, 5, c.dark); }
    if (c.ear === 'long') { p.rect(hx - 2, hy - (sleep ? 4 : 9), 2, sleep ? 3 : 6, c.body); p.rect(hx + 1, hy - (sleep ? 4 : 9), 2, sleep ? 3 : 6, c.body); p.px(hx - 1, hy - 6, '#f8c8d8'); p.px(hx + 2, hy - 6, '#f8c8d8'); }
    if (c.ear === 'round') { ellipse(p, hx - 3, hy - 3, 1.5, 1.5, c.dark); ellipse(p, hx + 3, hy - 3, 1.5, 1.5, c.dark); }
    // Mặt
    if (sleep) { p.rect(hx - 2, hy, 2, 1, '#3b2d3f'); p.rect(hx + 1, hy, 2, 1, '#3b2d3f'); }
    else { p.px(hx - 2, hy - 1, '#3b2d3f'); p.px(hx + 2, hy - 1, '#3b2d3f'); p.px(hx - 2, hy - 2, '#ffffff'); p.px(hx + 2, hy - 2, '#ffffff'); }
    p.px(hx, hy + 1, '#e86a7a');
    p.px(hx - 3, hy + 1, '#f8a8b8'); p.px(hx + 3, hy + 1, '#f8a8b8');
    if (kind === 'corgi') { p.px(hx, hy - 3, c.light); p.px(hx, hy - 2, c.light); }
  }, OUT);
}

// ───────── Đài quan sát hai bờ ─────────

export type CityKind = 'seoul' | 'taipei' | 'gwangju' | 'taichung' | 'generic';
export function cityKind(name?: string | null): CityKind {
  const n = (name ?? '').toLowerCase();
  if (/seoul|서울|hán thành/.test(n)) return 'seoul';
  if (/taipei|đài bắc|台北|臺北|taibei/.test(n)) return 'taipei';
  if (/gwangju|광주|kwangju/.test(n)) return 'gwangju';
  if (/taichung|đài trung|台中|臺中|taizhong/.test(n)) return 'taichung';
  return 'generic';
}

/** Khung cảnh một thành phố theo giờ thật bên đó: trời, đường chân trời, đèn cửa sổ ban đêm */
export function citySprite(kind: CityKind, phase: Phase, seed: string) {
  return makeSprite(`city:${kind}:${phase}:${seed}`, 80, 70, p => {
    const rand = seeded(`city-${seed}`);
    const sky: Record<Phase, string[]> = {
      dawn: ['#6a7ad8', '#c8a0d0', '#ffc8a8'], day: ['#3fa9f5', '#8fd4ff', '#d8f0ff'],
      sunset: ['#4a3a9a', '#c0508a', '#ff9a5c', '#ffd08a'], night: ['#060a2a', '#101a4a', '#1f2c72'],
    };
    bands(p, sky[phase], 0, 70, 80);
    const dark = phase === 'night';
    if (dark) { for (let i = 0; i < 40; i++) p.px(Math.floor(rand() * 80), Math.floor(rand() * 34), rand() < 0.2 ? '#ffe9a0' : '#ffffff'); ellipse(p, 62, 10, 4, 4, '#fff6c8'); }
    else if (phase === 'day') { ellipse(p, 64, 12, 5, 5, '#fff6a8'); ellipse(p, 20, 16, 8, 3, '#ffffff'); }
    else ellipse(p, phase === 'sunset' ? 58 : 16, 46, 9, 9, '#fbe6a0');
    const sil = dark ? '#1a1f45' : phase === 'sunset' ? '#5a2f6a' : phase === 'dawn' ? '#6a5a9a' : '#5a7aa8';
    const sil2 = mix(sil, '#ffffff', dark ? 0.08 : 0.25);
    const lit = (x: number, y: number, w: number, h: number) => { if (!dark) return; for (let yy = y + 2; yy < y + h - 1; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2) if (rand() < 0.45) p.px(xx, yy, '#ffd27a'); };
    // Dãy nhà phía xa
    for (let x = 0; x < 80; x += 6) { const h = 8 + Math.floor(rand() * 10); p.rect(x, 62 - h, 6, h, sil2); }
    if (kind === 'seoul') {
      // Núi Namsan và tháp cao trên đỉnh, sông Hán phía dưới
      for (let x = 0; x < 80; x++) { const h = Math.max(0, 22 - Math.abs(x - 30) * 0.7); p.rect(x, 54 - h, 1, h + 8, sil); }
      p.rect(29, 14, 2, 18, sil); p.rect(27, 22, 6, 3, sil); p.rect(28, 20, 4, 2, sil); p.px(29, 12, sil); p.px(30, 11, dark ? '#ff6a6a' : sil);
      if (dark) { p.rect(27, 23, 6, 1, '#ffd27a'); }
      for (let x = 44; x < 80; x += 7) { const h = 12 + Math.floor(rand() * 14); p.rect(x, 62 - h, 6, h, sil); lit(x, 62 - h, 6, h); }
    } else if (kind === 'taipei') {
      // Tòa tháp nhiều tầng như đốt tre, núi xa phía sau
      for (let x = 0; x < 80; x++) { const h = Math.max(0, 10 - Math.abs(x - 62) * 0.3); p.rect(x, 52 - h, 1, h, mix(sil, '#ffffff', 0.15)); }
      const tx = 38;
      p.rect(tx - 4, 48, 9, 14, sil);
      for (let i = 0; i < 8; i++) { const y = 46 - i * 4; p.rect(tx - 3, y, 7, 4, sil); p.px(tx - 4, y, sil); p.px(tx + 4, y, sil); if (dark) p.rect(tx - 2, y + 1, 5, 1, i % 2 ? '#8af0d0' : '#ffd27a'); }
      p.rect(tx - 1, 10, 3, 4, sil); p.rect(tx, 4, 1, 6, sil);
      for (const x of [6, 14, 52, 60, 70]) { const h = 10 + Math.floor(rand() * 12); p.rect(x, 62 - h, 7, h, sil); lit(x, 62 - h, 7, h); }
    } else if (kind === 'gwangju') {
      // Núi Mudeung tròn rộng phía sau với các cột đá trên đỉnh, chung cư cao tầng phía trước
      const far = mix(sil, '#ffffff', dark ? 0.05 : 0.3);
      for (let x = 0; x < 80; x++) { const h = Math.max(0, 30 - ((x - 40) / 30) ** 2 * 22); p.rect(x, 52 - h, 1, h + 10, far); }
      for (const x of [36, 39, 42, 45]) p.rect(x, 21 - (x % 3), 2, 4, mix(far, '#ffffff', dark ? 0.1 : 0.35));
      for (let x = 2; x < 80; x += 11) {
        const h = 18 + Math.floor(rand() * 10);
        p.rect(x, 62 - h, 9, h, sil); p.rect(x, 62 - h, 9, 1, sil2);
        if (dark) lit(x, 62 - h, 9, h); else for (let yy = 64 - h; yy < 60; yy += 3) p.rect(x + 1, yy, 7, 1, sil2);
        p.px(x + 2, 64 - h, dark ? '#ffd27a' : '#ffffff');
      }
    } else if (kind === 'taichung') {
      // Núi xa, nhà hát lượn sóng có các ô cửa tròn, vài tòa cao phía sau, hàng cây xanh
      for (let x = 0; x < 80; x++) { const h = 12 + Math.sin(x / 9) * 4; p.rect(x, 50 - h, 1, h, mix(sil, '#ffffff', dark ? 0.06 : 0.3)); }
      for (const [x, h] of [[8, 26], [18, 32], [66, 28], [74, 22]]) { p.rect(x, 62 - h, 6, h, sil2); lit(x, 62 - h, 6, h); }
      const th = dark ? '#d8d0e0' : '#f2eee6';
      for (let x = 26; x < 62; x++) { const top = 40 + Math.round(Math.sin((x - 26) / 5.5) * 2); p.rect(x, top, 1, 62 - top, th); }
      for (const [x, y] of [[30, 48], [38, 45], [46, 49], [54, 46], [34, 55], [50, 55]]) { ellipse(p, x, y, 2.5, 3, dark ? '#ffd27a' : '#9ab8c8'); }
      for (let x = 0; x < 80; x += 5) ellipse(p, x + 2, 60, 3, 2.5, dark ? '#1e3a2e' : '#5f9a48');
    } else {
      for (let x = 0; x < 80; x += 9) { const h = 14 + Math.floor(rand() * 22); p.rect(x, 62 - h, 8, h, sil); lit(x, 62 - h, 8, h); }
    }
    // Sông / mặt nước phía trước
    const water = dark ? '#16245a' : phase === 'sunset' ? '#b04a8a' : '#4fa8e0';
    p.rect(0, 62, 80, 8, water);
    for (let i = 0; i < 12; i++) p.rect(Math.floor(rand() * 76), 63 + Math.floor(rand() * 6), 3, 1, mix(water, '#ffffff', 0.35));
    if (dark) for (let i = 0; i < 10; i++) p.px(Math.floor(rand() * 80), 63 + Math.floor(rand() * 6), '#ffd27a');
  }, null);
}

export function observatoryRoom() {
  return makeSprite('room:observatory', 192, 144, p => {
    p.rect(0, 0, 192, 144, '#2a2450');
    for (let i = 0; i < 70; i++) { const x = (i * 53) % 192, y = (i * 29) % 96; p.px(x, y, i % 4 ? '#4a4a8a' : '#c8c8ff'); }
    // Vòm kính và khung đồng
    for (const x0 of [6, 98]) {
      p.rect(x0, 6, 88, 82, '#c8a060'); p.rect(x0 + 1, 7, 86, 80, '#8a6a3a'); p.rect(x0 + 2, 8, 84, 78, '#1a1838');
    }
    p.rect(94, 6, 4, 82, '#c8a060');
    // Sàn gỗ, lan can
    p.rect(0, 96, 192, 48, '#8a5a3c');
    for (let y = 96; y < 144; y += 6) p.rect(0, y, 192, 1, '#7a4a32');
    for (let x = 0; x < 192; x += 16) p.rect(x, 96, 1, 48, '#9a6a4a');
    p.rect(0, 92, 192, 4, '#c8a060'); p.rect(0, 92, 192, 1, '#f2d48a');
    for (let x = 4; x < 192; x += 10) p.rect(x, 88, 2, 5, '#c8a060');
    // Kính viễn vọng ở giữa
    p.rect(92, 98, 8, 2, '#5a4a6a'); p.rect(95, 86, 2, 12, '#5a4a6a');
    for (let i = 0; i < 12; i++) p.rect(90 + i, 84 - Math.floor(i / 2), 3, 3, i < 2 ? '#f2d48a' : '#c8a060');
    // Ghế đôi
    p.rect(74, 124, 44, 4, '#c98a52'); p.rect(74, 124, 44, 1, '#e8b07a'); p.rect(76, 128, 3, 8, '#8a5a3c'); p.rect(113, 128, 3, 8, '#8a5a3c');
    p.rect(74, 112, 44, 3, '#c98a52'); p.rect(74, 116, 44, 2, '#c98a52');
  }, null);
}

export function telescopeSprite() {
  return makeSprite('telescope', 16, 22, p => {
    p.rect(7, 10, 2, 11, '#5a4a6a'); p.rect(3, 20, 10, 2, '#5a4a6a'); p.px(4, 19, '#5a4a6a'); p.px(11, 19, '#5a4a6a');
    for (let i = 0; i < 9; i++) p.rect(2 + i, 9 - Math.floor(i / 2), 3, 3, i < 2 ? '#f2d48a' : '#c8a060');
    p.px(12, 4, '#ffffff');
  });
}

/** Khoảng cách giữa hai nơi (km) */
export function distanceKm(a?: { lat: number | null; lon: number | null } | null, b?: { lat: number | null; lon: number | null } | null) {
  if (a?.lat == null || a.lon == null || b?.lat == null || b.lon == null) return null;
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)));
}

// ───────── Cảnh thay đổi theo thời tiết, mùa, mỗi ngày ─────────

/** Ô che mưa (cán dài xuống tới tay nhân vật) */
export function umbrellaSprite(color = '#f08aa6') {
  return makeSprite(`umbrella:${color}`, 20, 29, p => {
    for (let y = 0; y < 7; y++) { const w = Math.round(Math.sqrt(1 - ((6 - y) / 7) ** 2) * 10); p.rect(10 - w, y, w * 2, 1, y % 2 ? mix(color, '#ffffff', 0.25) : color); }
    for (let x = 0; x < 20; x += 5) { p.px(x, 7, color); p.px(x + 1, 7, color); }
    for (let x = 2; x < 20; x += 5) p.rect(x, 1, 1, 6, mix(color, '#ffffff', 0.45));
    p.px(10, 0, '#8a5a3c');
    p.rect(15, 7, 1, 21, '#8a5a3c'); p.px(14, 28, '#8a5a3c'); p.px(13, 27, '#8a5a3c');
  }, '#5a3a4a');
}

export function hotAirBalloonSprite(color: string) {
  return makeSprite(`hab:${color}`, 16, 24, p => {
    for (let y = 0; y < 15; y++) { const w = Math.round(Math.sqrt(1 - ((y - 7) / 8) ** 2) * 8); p.rect(8 - w, y, w * 2, 1, color); }
    for (let x = 3; x < 14; x += 4) for (let y = 1; y < 14; y++) p.px(x + (y > 7 ? (x < 8 ? 1 : -1) : 0), y, mix(color, '#ffffff', 0.4));
    p.rect(5, 15, 6, 1, mix(color, '#2a1a1a', 0.3));
    p.px(5, 16, '#8a5a3c'); p.px(10, 16, '#8a5a3c'); p.px(5, 17, '#8a5a3c'); p.px(10, 17, '#8a5a3c');
    p.rect(5, 18, 6, 4, '#c98a52'); p.rect(5, 18, 6, 1, '#e8b07a');
  });
}
export function kiteSprite(color: string) {
  return makeSprite(`kite:${color}`, 12, 22, p => {
    for (let y = 0; y < 10; y++) { const w = y < 4 ? y + 1 : 9 - y; p.rect(6 - w, y, w * 2, 1, y < 4 ? color : mix(color, '#ffffff', 0.3)); }
    p.rect(6, 0, 1, 10, '#fffaf0'); p.rect(1, 4, 10, 1, '#fffaf0');
    for (let i = 0; i < 12; i++) p.px(6 + Math.round(Math.sin(i / 2) * 2), 10 + i, i % 3 ? '#f6c64e' : '#f59ab3');
  });
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const seasonOfMonth = (m: number): Season => (m >= 3 && m <= 5 ? 'spring' : m <= 8 && m >= 6 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter');
/** Mỗi ngày một cảnh bất ngờ trong làng (cố định trong ngày, hai máy thấy giống nhau) */
export type Happening = 'balloons' | 'birds' | 'kites' | 'cat' | 'none';
export function happeningOf(date: string): Happening {
  const h = [...date].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  return (['balloons', 'birds', 'kites', 'cat', 'none'] as Happening[])[h % 5];
}

// ───────── Bưu thiếp ở Đài quan sát: vài nơi nổi tiếng của mỗi thành phố ─────────
export interface Landmark { name: string; icon: string; text: string }
export const LANDMARKS: Record<CityKind, Landmark[]> = {
  gwangju: [
    { name: 'Núi Mudeung', icon: '⛰️', text: 'Ngọn núi của Gwangju, trên đỉnh có những cột đá lục giác. Mùa thu lá đỏ phủ kín sườn núi.' },
    { name: 'Làng Penguin', icon: '🐧', text: 'Con hẻm ở Yangnim-dong treo đầy đồng hồ cũ, đồ cổ và tranh vẽ ngộ nghĩnh.' },
    { name: 'Chợ Yangdong', icon: '🍗', text: 'Chợ truyền thống lớn của Gwangju, nổi tiếng với gà rán giòn và bánh gạo.' },
    { name: 'Trung tâm Văn hoá Châu Á', icon: '🏛️', text: 'Khu triển lãm và biểu diễn rộng lớn ở trung tâm thành phố, tối lên đèn rất đẹp.' },
  ],
  taichung: [
    { name: 'Làng Cầu Vồng', icon: '🌈', text: 'Xóm nhà cũ được một ông cụ vẽ kín tường bằng hình sặc sỡ.' },
    { name: 'Chợ đêm Fengjia', icon: '🍢', text: 'Một trong những chợ đêm lớn nhất Đài Loan, đi hết một vòng là no căng.' },
    { name: 'Đầm lầy Gaomei', icon: '🌅', text: 'Hàng cối xay gió bên bãi bùn ven biển, hoàng hôn ở đây đẹp nổi tiếng.' },
    { name: 'Trà sữa trân châu', icon: '🧋', text: 'Nhiều người kể trà sữa trân châu ra đời ở Đài Trung vào những năm 1980.' },
    { name: 'Nhà hát Quốc gia', icon: '🎭', text: 'Nhà hát có vách cong mềm như hang động, nhìn từ ngoài như một tổ ong.' },
  ],
  seoul: [
    { name: 'Tháp Namsan', icon: '🗼', text: 'Tháp trên núi Namsan, nơi các cặp đôi treo ổ khoá tình yêu.' },
    { name: 'Sông Hán', icon: '🌉', text: 'Ăn gà rán, ngắm cầu cầu vồng phun nước buổi tối bên sông.' },
  ],
  taipei: [
    { name: 'Taipei 101', icon: '🏙️', text: 'Toà tháp như đốt tre, đêm giao thừa bắn pháo hoa rực rỡ.' },
    { name: 'Cửu Phần', icon: '🏮', text: 'Phố núi treo đèn lồng đỏ, uống trà nhìn ra biển.' },
  ],
  generic: [],
};
/** Vị trí ghim trên khung thành phố (80×70) */
export const PIN_AT: [number, number][] = [[40, 24], [14, 46], [62, 46], [28, 60], [54, 60]];
