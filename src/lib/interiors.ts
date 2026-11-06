// Nội thất & khu riêng: nhà hàng lãng mạn, cửa hàng, khu vui chơi, nông trại; cùng đạo cụ đi kèm.
import { ellipse, isoSprite, shade } from './iso';
import { makeSprite, mix, type Pen } from './pixel';
import { seeded } from './rng';
import { FARM } from './world';

const GOLD = '#d8b26a', GOLD_L = '#f2d48a', GOLD_D = '#a8823a';
const VELVET = '#b0304a', VELVET_D = '#8a2038', VELVET_L = '#d04a64';
const OUT = '#5a3a2e';
const PASTEL = ['#f59ab3', '#f6c64e', '#8db8ef', '#a5d470', '#b7a6e8', '#f7a98a', '#7cc8b4', '#fffaf0'];

function flame(p: Pen, x: number, y: number) {
  p.px(x, y - 2, '#fff1a8'); p.px(x, y - 1, '#ffb347'); p.px(x - 1, y - 1, '#ffd27a'); p.px(x, y, '#ff8a3d');
}
function candle(p: Pen, x: number, y: number, h = 5) {
  p.rect(x - 1, y - h, 2, h, '#fffaf0'); p.px(x - 1, y - h, '#ffffff'); flame(p, x, y - h - 1);
}

// ───────── Nhà hàng ─────────

export function restaurantRoom() {
  return makeSprite('room:restaurant:v2', 192, 144, p => {
    const rand = seeded('rest2');
    // Tường nhung đỏ rượu vang có hoa văn
    p.rect(0, 0, 192, 92, '#7a2e46');
    for (let y = 8; y < 72; y += 12) for (let x = ((y / 12) % 2) * 6; x < 192; x += 12) {
      p.px(x, y - 1, '#94405a'); p.px(x - 1, y, '#94405a'); p.px(x + 1, y, '#94405a'); p.px(x, y + 1, '#94405a'); p.px(x, y, '#c08a5a');
    }
    p.rect(0, 0, 192, 6, GOLD); p.rect(0, 0, 192, 1, GOLD_L); p.rect(0, 5, 192, 1, GOLD_D);
    // Ốp chân tường kem viền vàng
    p.rect(0, 72, 192, 20, '#f6e6cc'); p.rect(0, 72, 192, 2, GOLD); p.rect(0, 91, 192, 1, GOLD_D);
    for (let x = 4; x < 192; x += 31) { p.rect(x, 76, 25, 1, GOLD); p.rect(x, 88, 25, 1, GOLD); p.rect(x, 76, 1, 13, GOLD); p.rect(x + 24, 76, 1, 13, GOLD); }
    // Cửa sổ vòm nhìn ra thành phố về đêm
    const cx = 96;
    for (let y = 8; y < 76; y++) for (let x = 66; x < 126; x++) {
      const inArch = (r: number) => (y >= 34 ? Math.abs(x + 0.5 - cx) <= r : (x + 0.5 - cx) ** 2 + (y + 0.5 - 34) ** 2 <= r * r);
      if (inArch(30) && !inArch(26)) p.px(x, y, y % 3 ? GOLD : GOLD_L);
      else if (inArch(26) && y < 72) p.px(x, y, mix('#1a1f4a', '#5a3f7a', (y - 8) / 64));
    }
    for (let i = 0; i < 30; i++) { const x = 72 + Math.floor(rand() * 48), y = 12 + Math.floor(rand() * 34); if ((x - cx) ** 2 + (y - 34) ** 2 < 600 || y > 34) p.px(x, y, rand() < 0.3 ? '#ffe9a0' : '#ffffff'); }
    ellipse(p, 110, 24, 5, 5, '#fff6c8'); ellipse(p, 112, 22, 4, 4, '#2a2a5a');
    for (let x = 70; x < 122; x += 4) { const h = 6 + Math.floor(rand() * 10); p.rect(x, 72 - h, 4, h, '#2a2440'); if (rand() < 0.8) p.px(x + 1, 72 - h + 2, '#ffd27a'); if (h > 9) p.px(x + 2, 72 - h + 5, '#ffd27a'); }
    p.rect(95, 8, 2, 64, GOLD); p.rect(66, 50, 60, 1, GOLD);
    // Rèm nhung buộc dây tua vàng
    for (const [x0, dir] of [[50, 1], [124, -1]] as const) {
      for (let y = 10; y < 92; y++) {
        const pinch = y > 44 && y < 60 ? 6 : y >= 60 ? Math.max(0, 6 - (y - 60) / 4) : 0;
        const w = 18 - pinch;
        const left = dir === 1 ? x0 : x0 + pinch;
        for (let x = left; x < left + w; x++) p.px(x, y, (x - left) % 4 === 0 ? VELVET_D : (x - left) % 4 === 1 ? VELVET_L : VELVET);
      }
      const tx = dir === 1 ? x0 + 6 : x0 + 12;
      p.rect(tx - 2, 50, 5, 3, GOLD); p.rect(tx - 1, 53, 3, 5, GOLD_L);
    }
    for (let x = 48; x < 144; x++) { const sag = Math.round(Math.sin(((x - 48) / 48) * Math.PI) * 3); p.rect(x, 8, 1, 6 + sag, VELVET); p.px(x, 14 + sag, GOLD); }
    // Đèn tường
    for (const x of [22, 170]) {
      p.rect(x - 3, 36, 7, 10, GOLD_D); p.rect(x - 2, 37, 5, 8, GOLD); p.rect(x - 4, 46, 9, 2, GOLD);
      candle(p, x - 3, 46, 5); candle(p, x + 3, 46, 5);
    }
    // Dây đèn lấp lánh
    for (let x = 0; x < 192; x++) {
      const y = 9 + Math.round(Math.abs(Math.sin((x / 192) * Math.PI * 4)) * 5);
      if (x < 46 || x > 146) { p.px(x, y, '#5a2a3a'); if (x % 7 === 0) p.px(x, y + 1, '#fff1a8'); }
    }
    // Sàn đá cẩm thạch caro kim cương
    for (let y = 92; y < 144; y++) for (let x = 0; x < 192; x++) {
      const a = Math.floor((x + y * 2) / 16), b = Math.floor((x - y * 2 + 400) / 16);
      p.px(x, y, (a + b) % 2 ? '#f6ead8' : '#ecd0c8');
    }
    for (let i = 0; i < 40; i++) p.px(Math.floor(rand() * 192), 94 + Math.floor(rand() * 50), '#e0c0b8');
    // Thảm đỏ viền vàng dưới bàn
    ellipse(p, 96, 126, 66, 15, GOLD); ellipse(p, 96, 126, 64, 14, VELVET); ellipse(p, 96, 126, 56, 11, '#c8405a');
    for (let i = 0; i < 20; i++) { const t = (i / 20) * Math.PI * 2; p.px(Math.round(96 + Math.cos(t) * 60), Math.round(126 + Math.sin(t) * 12.5), GOLD_L); }
    // Chậu cây cảnh trong bình vàng
    for (const x of [12, 180]) {
      p.rect(x - 5, 100, 11, 12, GOLD); p.rect(x - 6, 99, 13, 2, GOLD_L); p.rect(x - 4, 104, 9, 1, GOLD_D);
      ellipse(p, x, 90, 8, 9, '#4f8a3c'); ellipse(p, x - 2, 88, 6, 6, '#6aa645'); ellipse(p, x - 3, 86, 2, 2, '#a5d470');
      for (const [dx, dy] of [[-4, 87], [3, 85], [1, 93], [-2, 95]]) p.px(x + dx, dy, '#f59ab3');
    }
    // Cánh hoa hồng rơi trên sàn
    for (let i = 0; i < 26; i++) { const x = Math.floor(rand() * 192), y = 98 + Math.floor(rand() * 44); p.px(x, y, '#e8607a'); p.px(x + 1, y, '#f08aa6'); }
  }, null);
}

/** Đèn chùm pha lê (sprite riêng để có quầng sáng) */
export function chandelierSprite() {
  return makeSprite('chandelier', 40, 30, p => {
    p.rect(19, 0, 2, 8, GOLD_D);
    ellipse(p, 20, 10, 4, 3, GOLD);
    for (let x = 3; x < 37; x++) p.px(x, 14 + Math.round(((x - 20) / 17) ** 2 * 5), GOLD);
    for (let x = 8; x < 32; x++) p.px(x, 19 + Math.round(((x - 20) / 12) ** 2 * 3), GOLD_D);
    for (const x of [3, 11, 20, 29, 36]) { const y = 14 + Math.round(((x - 20) / 17) ** 2 * 5); candle(p, x, y, 4); }
    for (const x of [6, 10, 14, 18, 22, 26, 30, 34]) { const y = 16 + Math.round(((x - 20) / 17) ** 2 * 5); p.px(x, y + 1, '#d0f0ff'); p.px(x, y + 2, '#ffffff'); }
    p.rect(19, 21, 2, 6, GOLD); ellipse(p, 20, 27, 2, 2, '#d0f0ff');
  }, GOLD_D);
}

/** Bàn tròn khăn trắng, nến và bình hoa hồng */
export function dinnerTableSprite() {
  return makeSprite('dinner-table', 48, 40, p => {
    p.rect(3, 16, 42, 21, '#fffaf0');
    for (let x = 6; x < 44; x += 5) p.rect(x, 18, 1, 18, '#efe6da');
    for (let x = 3; x < 45; x += 3) p.px(x, 37, '#efe6da');
    ellipse(p, 24, 16, 22, 4, '#ffffff');
    p.rect(19, 14, 10, 22, '#f7b8cc'); p.rect(19, 14, 1, 22, GOLD); p.rect(28, 14, 1, 22, GOLD); p.rect(19, 35, 10, 1, GOLD);
    ellipse(p, 9, 16, 5, 1.6, '#f4f4f8'); ellipse(p, 39, 16, 5, 1.6, '#f4f4f8');
    for (const x of [16, 32]) { p.rect(x - 1, 9, 2, 6, GOLD); p.rect(x - 2, 14, 4, 1, GOLD_D); candle(p, x, 9, 4); }
    p.rect(22, 9, 4, 6, '#cdeef7'); p.px(22, 10, '#ffffff');
    for (const [x, y, c] of [[21, 6, '#e8405a'], [24, 5, '#f08aa6'], [27, 6, '#e8405a'], [23, 8, '#c8304a'], [26, 8, '#f08aa6']] as const) ellipse(p, x, y, 1.6, 1.4, c);
    p.px(20, 8, '#6aa645'); p.px(28, 8, '#6aa645');
    // Hai ly rượu
    for (const x of [5, 43]) { p.rect(x - 1, 10, 3, 3, '#e8607a'); p.px(x - 1, 9, '#f4f4f8'); p.px(x + 1, 9, '#f4f4f8'); p.rect(x, 13, 1, 2, '#f4f4f8'); }
  }, OUT);
}

/** Ghế nhung lưng cao, nhìn nghiêng (lưng ghế bên trái, người ngồi quay sang phải) */
export function velvetChairSprite() {
  return makeSprite('velvet-chair', 20, 36, p => {
    p.rect(2, 0, 5, 24, GOLD); p.rect(3, 2, 3, 20, VELVET); p.px(4, 4, VELVET_L); p.px(4, 10, VELVET_L);
    ellipse(p, 4.5, 1, 3, 1.5, GOLD_L);
    p.rect(2, 22, 16, 5, VELVET); p.rect(2, 22, 16, 1, VELVET_L); p.rect(2, 27, 16, 1, GOLD);
    p.rect(3, 28, 2, 8, GOLD); p.rect(15, 28, 2, 8, GOLD); p.px(2, 35, GOLD_D); p.px(17, 35, GOLD_D);
  }, OUT);
}

// ───────── Cửa hàng ─────────

export function shopRoom() {
  return makeSprite('room:shop:v3', 192, 144, p => {
    const rand = seeded('shop3');
    p.rect(0, 0, 192, 88, '#fbecd2');
    for (let x = 0; x < 192; x += 8) p.rect(x, 6, 4, 82, '#f6e2c4');
    p.rect(0, 0, 192, 6, '#c08658'); p.rect(0, 5, 192, 1, '#a06a48');
    for (let x = 0; x < 192; x++) {                                   // dây cờ màu
      const y = 7 + Math.round(Math.abs(Math.sin((x / 192) * Math.PI * 5)) * 4);
      p.px(x, y, '#a06a48');
      if (x % 8 === 3) { const c = PASTEL[(x / 8) % 6 | 0]; p.rect(x - 1, y + 1, 3, 2, c); p.px(x, y + 3, c); }
    }
    // Hai kệ hàng đầy ắp
    for (const [x0, kind] of [[4, 0], [132, 1]] as const) {
      p.rect(x0, 16, 56, 70, '#c08658'); p.rect(x0 + 2, 18, 52, 66, '#ecd2b0');
      for (const sy of [36, 58, 84]) {
        p.rect(x0, sy - 2, 56, 3, '#a06a48'); p.rect(x0, sy - 2, 56, 1, '#d29a63');
        for (let x = x0 + 4; x < x0 + 52;) {
          const r = rand(), c = PASTEL[Math.floor(rand() * PASTEL.length)];
          if (kind === 0 && r < 0.3) { p.rect(x, sy - 9, 5, 7, '#cdeef7'); p.rect(x, sy - 10, 5, 1, c); p.rect(x + 1, sy - 6, 3, 3, c); x += 7; }
          else if (r < 0.5) { p.rect(x, sy - 6, 5, 4, '#dc9a6a'); ellipse(p, x + 2.5, sy - 9, 3, 3, '#86c257'); p.px(x + 2, sy - 10, c); x += 7; }
          else if (kind === 1 && r < 0.65) { p.rect(x, sy - 9, 8, 6, '#4a4a5a'); p.rect(x + 1, sy - 8, 6, 4, '#8db8ef'); p.rect(x + 3, sy - 3, 2, 1, '#4a4a5a'); x += 10; }
          else if (r < 0.8) { for (let i = 0; i < 3; i++) p.rect(x + i * 2, sy - 8 + (i % 2), 2, 6 - (i % 2), PASTEL[(i + x) % 8]); x += 7; }
          else { p.rect(x, sy - 5, 6, 3, c); p.rect(x + 1, sy - 8, 4, 3, mix(c, '#ffffff', 0.3)); x += 8; }
        }
      }
    }
    // Cửa sổ vòm giữa
    for (let y = 12; y < 46; y++) for (let x = 74; x < 118; x++) {
      const inA = (r: number) => (y >= 26 ? Math.abs(x + 0.5 - 96) <= r : (x + 0.5 - 96) ** 2 + (y + 0.5 - 26) ** 2 <= r * r);
      if (inA(21) && !inA(18)) p.px(x, y, '#fffaf0'); else if (inA(18)) p.px(x, y, mix('#8fd0f0', '#d8f2fb', (y - 12) / 34));
    }
    ellipse(p, 88, 30, 6, 2.5, '#ffffff'); ellipse(p, 104, 22, 5, 2, '#ffffff');
    p.rect(95, 8, 2, 38, '#fffaf0'); p.rect(74, 44, 44, 3, '#ecc18e');
    for (const x of [80, 92, 104]) { p.rect(x, 39, 5, 5, '#dc9a6a'); ellipse(p, x + 2.5, 37, 3, 3, '#86c257'); p.px(x + 2, 36, PASTEL[x % 4]); }
    // Biển hiệu đồng xu
    p.rect(78, 48, 36, 9, '#8a5a3c'); p.rect(79, 49, 34, 7, '#f6c64e');
    ellipse(p, 96, 52.5, 3, 3, '#e8b04a'); p.rect(95, 51, 2, 3, '#c89048');
    for (const x of [84, 108]) { p.px(x, 52, '#f08aa6'); p.px(x - 1, 53, '#f08aa6'); p.px(x + 1, 53, '#f08aa6'); }
    // Đèn thả
    for (const x of [36, 156]) { p.rect(x, 0, 1, 12, '#6a4a3a'); ellipse(p, x + 0.5, 14, 6, 3, '#f6c64e'); p.rect(x - 5, 14, 12, 2, '#f6c64e'); p.rect(x - 2, 16, 5, 1, '#fff1a8'); }
    // Sàn gỗ xương cá
    for (let y = 88; y < 144; y++) for (let x = 0; x < 192; x++) {
      const k = Math.floor((x + (Math.floor(y / 4) % 2) * 6) / 12), lx = (x + (Math.floor(y / 4) % 2) * 6) % 12;
      p.px(x, y, y % 4 === 0 || lx === 0 ? '#c08658' : k % 2 ? '#e4ae78' : '#dca06a');
    }
    // Quầy thu ngân
    p.rect(62, 62, 68, 26, '#c08658'); p.rect(62, 62, 68, 4, '#f6e2c8'); p.rect(62, 65, 68, 1, '#d8bc98');
    for (let x = 66; x < 128; x += 16) { p.rect(x, 69, 12, 16, '#d29a63'); p.rect(x, 69, 12, 1, '#ecc18e'); }
    p.rect(68, 55, 12, 7, '#f59ab3'); p.rect(69, 53, 10, 3, '#f7b8cc'); p.rect(70, 57, 8, 2, '#fffaf0');   // máy tính tiền
    p.rect(118, 56, 5, 6, '#cdeef7'); for (const [x, c] of [[119, '#ec7a7a'], [121, '#f6c64e'], [120, '#8db8ef']] as const) p.px(x, 59, c);
    p.rect(108, 58, 4, 4, '#cdeef7'); ellipse(p, 110, 55, 3, 3, '#f59ab3'); p.px(110, 54, '#f6c64e');
    // Thảm hồng
    ellipse(p, 96, 118, 52, 12, '#fffaf0'); ellipse(p, 96, 118, 49, 10.5, '#f59ab3'); ellipse(p, 96, 118, 38, 7, '#f7b8cc');
    // Góc trưng bày: sofa + đèn, xô hoa tươi
    p.rect(8, 104, 32, 10, '#8db8ef'); p.rect(8, 98, 32, 7, '#a8ccf4'); p.rect(6, 100, 4, 14, '#8db8ef'); p.rect(38, 100, 4, 14, '#8db8ef');
    p.rect(14, 102, 7, 4, '#f6c64e'); p.rect(10, 114, 2, 3, '#6a4a3a'); p.rect(36, 114, 2, 3, '#6a4a3a');
    p.rect(20, 92, 8, 4, '#fffaf0'); p.rect(21, 96, 6, 2, '#ec7a7a');                                    // nhãn giá
    for (let i = 0; i < 4; i++) {
      const x = 150 + i * 9;
      p.rect(x, 110, 7, 8, '#c8ccd8'); p.rect(x, 110, 7, 1, '#e8ecf4');
      for (let j = 0; j < 3; j++) { p.rect(x + 1 + j * 2, 104, 1, 6, '#6aa645'); ellipse(p, x + 1.5 + j * 2, 103, 1.5, 1.5, PASTEL[(i + j) % 6]); }
    }
    p.rect(84, 138, 24, 6, '#a06a48'); p.rect(86, 139, 20, 4, '#f59ab3');
  }, null);
}

// ───────── Khu vui chơi ─────────

export function arcadeRoom() {
  return makeSprite('room:arcade', 192, 144, p => {
    const rand = seeded('arcade');
    p.rect(0, 0, 192, 88, '#4a3a7a');
    for (let i = 0; i < 60; i++) { const x = Math.floor(rand() * 192), y = Math.floor(rand() * 80); p.px(x, y, '#6a5a9a'); p.px(x + 1, y, '#5a4a8a'); }
    for (const [y, c] of [[18, '#ff8ac8'], [74, '#7ae0f0']] as const) { p.rect(0, y, 192, 2, c); p.rect(0, y - 1, 192, 1, mix(c, '#4a3a7a', 0.5)); p.rect(0, y + 2, 192, 1, mix(c, '#4a3a7a', 0.5)); }
    // Áp phích
    for (const [x, c, icon] of [[60, '#f59ab3', 'heart'], [124, '#f6c64e', 'star']] as const) {
      p.rect(x, 26, 14, 18, '#fffaf0'); p.rect(x + 1, 27, 12, 16, c);
      if (icon === 'heart') p.map(['.R.R.', 'RRRRR', '.RRR.', '..R..'], { R: '#ffffff' }, x + 4, 31);
      else p.map(['..W..', 'WWWWW', '.WWW.', 'W...W'], { W: '#ffffff' }, x + 4, 31);
    }
    // Giá vẽ (Vẽ đoán)
    p.rect(22, 44, 2, 44, '#a06a48'); p.rect(40, 44, 2, 44, '#a06a48'); p.rect(31, 40, 2, 48, '#8a5a3c');
    p.rect(18, 34, 28, 26, '#fffaf0'); p.rect(18, 60, 28, 2, '#a06a48');
    for (let i = 0; i < 16; i++) p.px(22 + i, 46 + Math.round(Math.sin(i / 2) * 4), '#f59ab3');
    ellipse(p, 38, 42, 3, 3, '#f6c64e'); p.rect(24, 52, 6, 4, '#8db8ef');
    // Máy chơi game (Oẳn tù tì)
    p.rect(82, 28, 28, 60, '#f59ab3'); p.rect(80, 26, 32, 6, '#f7b8cc'); p.rect(82, 30, 28, 2, '#ffc6dc');
    p.rect(86, 36, 20, 16, '#2a2440'); p.rect(87, 37, 18, 14, '#3a4a8a');
    p.map(['.WW..', 'WWWW.', 'WWWWW', '.WWW.'], { W: '#fde6c8' }, 89, 41); p.map(['W.W', 'WWW', 'WWW'], { W: '#fde6c8' }, 98, 42);
    p.rect(84, 56, 24, 8, '#e86a8a'); ellipse(p, 90, 59, 2, 2, '#f6c64e'); ellipse(p, 97, 60, 2, 2, '#7ae0f0'); ellipse(p, 103, 59, 2, 2, '#a5d470');
    p.rect(88, 70, 16, 4, '#2a2440'); p.rect(94, 70, 4, 1, '#f6c64e');
    // Cây cảnh, ghế lười
    p.rect(170, 70, 10, 14, '#dc9a6a'); ellipse(p, 175, 62, 9, 10, '#6aa645'); ellipse(p, 172, 58, 4, 4, '#a5d470');
    // Thảm có hình confetti
    p.rect(0, 88, 192, 56, '#6a5aa0');
    p.rect(0, 88, 192, 2, '#5a4a8a');
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(rand() * 190), y = 92 + Math.floor(rand() * 50), c = PASTEL[i % 7];
      if (i % 3) { p.px(x, y, c); p.px(x + 1, y + 1, c); } else { p.px(x, y, c); p.px(x + 1, y, c); p.px(x + 2, y - 1, c); }
    }
    // Bàn cờ caro
    p.rect(14, 104, 52, 12, '#d29a63'); p.rect(14, 104, 52, 2, '#ecc18e'); p.rect(18, 116, 3, 10, '#a06a48'); p.rect(59, 116, 3, 10, '#a06a48');
    p.rect(26, 98, 28, 8, '#fffaf0'); for (let x = 26; x < 54; x += 4) p.rect(x, 98, 1, 8, '#c8c2b8'); for (let y = 98; y < 106; y += 2) p.rect(26, y, 28, 1, '#e8e2d8');
    p.px(33, 101, '#e8607a'); p.px(37, 101, '#5a7ac8'); p.px(41, 103, '#e8607a'); p.px(45, 99, '#5a7ac8');
    // Bàn lật thẻ
    p.rect(126, 104, 52, 12, '#d29a63'); p.rect(126, 104, 52, 2, '#ecc18e'); p.rect(130, 116, 3, 10, '#a06a48'); p.rect(171, 116, 3, 10, '#a06a48');
    for (let i = 0; i < 8; i++) { const x = 134 + (i % 4) * 9, y = 96 + Math.floor(i / 4) * 5; p.rect(x, y, 7, 4, i === 2 ? '#fffaf0' : '#b7a6e8'); p.px(x + 3, y + 1, i === 2 ? '#f59ab3' : '#d8ccf4'); }
    // Ghế lười
    ellipse(p, 98, 112, 10, 6, '#f6c64e'); ellipse(p, 96, 110, 7, 4, '#fbe08a');
    p.rect(84, 138, 24, 6, '#3a2a6a'); p.rect(86, 139, 20, 4, '#ff8ac8');
  }, null);
}

// ───────── Nông trại ─────────

export function farmBackground() {
  return makeSprite('farm:v1', 256, 192, p => {
    const rand = seeded('farm');
    p.rect(0, 0, 256, 192, '#9fd067');
    for (let y = 0; y < 192; y += 8) for (let x = 0; x < 256; x += 8) if (((x + y) / 8) % 2) p.rect(x, y, 8, 8, '#a4d36c');
    for (let i = 0; i < 500; i++) { const x = Math.floor(rand() * 256), y = Math.floor(rand() * 192); p.px(x, y, rand() < 0.5 ? '#8cc65c' : '#b9e086'); }
    // Chuồng đỏ & tháp silo
    ellipse(p, 50, 50, 34, 4, '#86b85a');
    p.rect(22, 18, 56, 32, '#d8606a'); for (let x = 24; x < 78; x += 4) p.rect(x, 20, 1, 30, '#c04a56');
    for (let i = 0; i < 16; i++) p.rect(50 - 30 + i, 18 - i, 60 - i * 2, 1, '#a8524a');
    p.rect(20, 17, 60, 2, '#fffaf0');
    p.rect(40, 30, 20, 20, '#fffaf0'); p.rect(42, 32, 16, 18, '#a8524a');
    for (let i = 0; i < 16; i++) { p.px(42 + i, 32 + i, '#fffaf0'); p.px(57 - i, 32 + i, '#fffaf0'); }
    p.rect(46, 6, 8, 7, '#fffaf0'); p.rect(47, 7, 6, 5, '#f2cf6a');
    p.rect(82, 10, 14, 40, '#b8c8dc'); ellipse(p, 89, 10, 7, 5, '#8aa8c8'); for (let y = 16; y < 50; y += 6) p.rect(82, y, 14, 1, '#9ab0c8');
    // Ao nhỏ có vịt
    ellipse(p, 214, 30, 30, 14, '#c8c2b8'); ellipse(p, 214, 30, 28, 12, '#7fcde3'); ellipse(p, 210, 28, 20, 7, '#a0dcec');
    for (const [x, y] of [[204, 30], [222, 26]]) { ellipse(p, x, y, 3, 2, '#fffaf0'); p.rect(x + 2, y - 3, 2, 2, '#fffaf0'); p.px(x + 4, y - 2, '#f6a95e'); }
    // Hàng rào trên
    for (let x = 0; x < 256; x += 6) { p.rect(x, 50, 2, 7, '#c08658'); p.px(x, 49, '#ecc18e'); }
    p.rect(0, 52, 256, 1, '#a06a48'); p.rect(0, 55, 256, 1, '#a06a48');
    // Ruộng (lưới ô trồng)
    const f = FARM, x1 = f.x + f.cols * f.cw, y1 = f.y + f.rows * f.ch;
    p.rect(f.x - 3, f.y - 3, x1 - f.x + 6, y1 - f.y + 6, '#b8a070');
    p.rect(f.x - 2, f.y - 2, x1 - f.x + 4, y1 - f.y + 4, '#c4dc8a');
    for (let y = f.y; y < y1; y += f.ch) for (let x = f.x; x < x1; x += f.cw) {
      p.rect(x + 1, y + 1, f.cw - 2, f.ch - 2, ((x / f.cw + y / f.ch) | 0) % 2 ? '#b6d97c' : '#aed474');
      p.px(x, y, '#9ac462');
    }
    // Hàng rào quanh ruộng (chừa cổng dưới)
    for (let x = f.x - 6; x <= x1 + 4; x += 6) { if (x > 116 && x < 140) continue; p.rect(x, y1 + 4, 2, 7, '#c08658'); }
    p.rect(f.x - 6, y1 + 6, 122 - f.x, 1, '#a06a48'); p.rect(140, y1 + 6, x1 - 136, 1, '#a06a48');
    // Lối đi xuống làng
    for (let y = y1 + 4; y < 192; y++) for (let x = 118; x < 138; x++) {
      const row = Math.floor(y / 4), lx = (x + (row % 2) * 3) % 6;
      p.px(x, y, lx === 0 || y % 4 === 0 ? '#dcc495' : '#f4e3bd');
    }
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(rand() * 256), y = 182 + Math.floor(rand() * 10);
      if (x > 112 && x < 142) continue;
      const c = PASTEL[i % 6]; p.px(x, y - 1, c); p.px(x - 1, y, c); p.px(x + 1, y, c); p.px(x, y, '#fff3a0');
    }
  }, null);
}

/** Ô đất đã xới (ướt thì sẫm hơn, bón phân thì có hạt vàng) */
export function soilSprite(wet: boolean, fert: boolean) {
  return makeSprite(`soil:${wet}:${fert}`, 14, 10, p => {
    const c = wet ? '#8a5a3a' : '#b98456', d = wet ? '#6a4228' : '#9a6a40';
    ellipse(p, 7, 5, 7, 4.5, c);
    p.rect(2, 3, 10, 1, d); p.rect(2, 6, 10, 1, d);
    if (wet) { p.px(4, 2, '#a8c8e8'); p.px(10, 5, '#a8c8e8'); }
    if (fert) { p.px(3, 4, '#f6c64e'); p.px(8, 2, '#f6c64e'); p.px(11, 7, '#f6c64e'); p.px(6, 7, '#fbe08a'); }
  }, '#5a3a2a');
}

export function plantSprite(stage: 'seed' | 'sprout' | 'grow' | 'ripe', flower: boolean) {
  return makeSprite(`plant:${stage}:${flower}`, 12, 14, p => {
    if (stage === 'seed') { p.px(4, 11, '#5a3a2a'); p.px(7, 12, '#5a3a2a'); return; }
    if (stage === 'sprout') { p.rect(5, 8, 1, 5, '#6aa645'); ellipse(p, 3.5, 8, 2, 1.2, '#86c257'); ellipse(p, 7.5, 7, 2, 1.2, '#a5d470'); return; }
    p.rect(5, 5, 2, 8, '#6aa645');
    ellipse(p, 3, 9, 3, 2, '#86c257'); ellipse(p, 9, 8, 3, 2, '#a5d470'); ellipse(p, 4, 5, 2.5, 1.6, '#a5d470'); ellipse(p, 8, 4, 2.5, 1.6, '#86c257');
    if (flower && stage === 'grow') ellipse(p, 6, 2, 2, 2, '#c4e894');
  }, '#3f6a2e');
}

// ───────── Lối vào trong làng ─────────

export function farmGateSprite() {
  return makeSprite('farm-gate', 32, 32, p => {
    p.rect(2, 8, 4, 24, '#a06a48'); p.rect(26, 8, 4, 24, '#a06a48');
    p.rect(0, 4, 32, 10, '#c08658'); p.rect(1, 5, 30, 8, '#ecc18e');
    for (const [x, c] of [[6, '#f6c64e'], [12, '#ec7a7a'], [19, '#f7a98a'], [25, '#a5d470']] as const) { ellipse(p, x, 9, 2, 2, c); p.px(x, 6, '#6aa645'); }
    p.rect(6, 22, 20, 2, '#c08658'); p.rect(6, 27, 20, 2, '#c08658');
    ellipse(p, 3, 3, 3, 2.5, '#86c257'); ellipse(p, 29, 3, 3, 2.5, '#86c257'); p.px(3, 2, '#f59ab3'); p.px(29, 2, '#f6c64e');
  }, OUT);
}

export function gameTentSprite() {
  return makeSprite('game-tent', 42, 38, p => {
    for (let i = 0; i < 24; i++) {
      const half = 3 + i * 0.85;
      for (let x = Math.round(21 - half); x < 21 + half; x++) p.px(x, 6 + i, Math.floor((x - 21 + 40) / 4) % 2 ? '#fffaf0' : '#f59ab3');
    }
    p.rect(1, 30, 40, 8, '#fffaf0'); for (let x = 1; x < 41; x += 8) p.rect(x, 30, 4, 8, '#b7a6e8');
    for (let x = 1; x < 41; x += 4) ellipse(p, x + 2, 30, 2, 1.5, '#f59ab3');
    p.rect(15, 26, 12, 12, '#4a3a7a'); ellipse(p, 21, 26, 6, 3, '#4a3a7a');
    p.map(['..Y..', 'YYYYY', '.YYY.', 'Y...Y'], { Y: '#f6c64e' }, 19, 29);
    p.rect(20, 0, 1, 7, '#8a5a3c'); p.rect(21, 0, 6, 4, '#f6c64e');
  }, OUT);
}

// ───────── Phòng tắm ─────────

export type BathWater = 'clear' | 'bubble' | 'rose' | 'milk' | 'lavender' | 'onsen';
export const BATH_WATERS: { id: BathWater; name: string; color: string; float: string[] }[] = [
  { id: 'clear', name: '💧 Nước ấm', color: '#9fdcf0', float: ['#d8f4fc'] },
  { id: 'bubble', name: '🫧 Bọt xà phòng', color: '#bfe6f4', float: ['#ffffff', '#f4fbff'] },
  { id: 'rose', name: '🌹 Cánh hoa hồng', color: '#f8c8d4', float: ['#e8405a', '#f08aa6', '#c8304a'] },
  { id: 'milk', name: '🥛 Sữa tắm', color: '#fbf3e8', float: ['#ffffff', '#f6e6d0'] },
  { id: 'lavender', name: '🪻 Oải hương', color: '#d4c4f4', float: ['#a88ae0', '#ffffff'] },
  { id: 'onsen', name: '♨️ Suối khoáng nóng', color: '#a8dcd0', float: ['#e0f4f0'] },
];
/** Kích thước bồn (ô sàn) và chiều cao thành bồn */
const TW = 4, TD = 3, TH = 15;
const waterOf = (w: BathWater) => BATH_WATERS.find(x => x.id === w) ?? BATH_WATERS[0];

/** Bồn tắm (lớp sau): thân bồn sứ chân vàng, lòng bồn và mặt nước */
export function tubBackSprite(w: BathWater) {
  const wt = waterOf(w);
  return isoSprite(`tub-back2:${w}`, TW, TD, TH + 9, q => {
    const por = { top: '#ffffff', left: '#f4f0f4', right: '#e0d8e4' };
    q.box(0, 0, 3, TW, TD, TH, por);
    for (const [a, b] of [[0.2, TD - 0.3], [TW - 0.3, TD - 0.3], [TW - 0.3, 0.2]]) q.box(a, b, 0, 0.15, 0.15, 3, shade(GOLD));
    q.flat(0.2, 0.2, TH + 3, TW - 0.4, TD - 0.4, '#e8e0ec');
    q.flat(0.25, 0.25, TH, TW - 0.5, TD - 0.5, wt.color);
    const r = seeded(`tub-${w}`);
    for (let i = 0; i < 44; i++) {
      const [x, y] = q.pt(0.35 + r() * (TW - 0.7), 0.35 + r() * (TD - 0.7), TH);
      const c = wt.float[i % wt.float.length];
      if (w === 'bubble' || w === 'milk') ellipse(q, x, y, 1.6 + r() * 1.5, 1 + r(), c); else { q.px(x, y, c); q.px(x + 1, y, c); }
    }
    const [fx, fy] = q.pt(0.1, TD / 2, TH + 3); q.rect(fx - 1, fy - 6, 2, 6, GOLD); q.rect(fx - 1, fy - 6, 4, 1, GOLD);   // vòi nước
    for (const [g, d] of [[TW - 0.15, 0.1], [TW - 0.15, 0.4], [0.15, 0.1]]) { const [x, y] = q.pt(g, d, TH + 3); candle(q, x, y, 3); }
  }, '#8a7a8a');
}

/** Bồn tắm (lớp trước): thành bồn phía trước che thân người đang ngâm, kèm bọt/hoa trôi sát thành */
export function tubFrontSprite(w: BathWater) {
  const wt = waterOf(w);
  return isoSprite(`tub-front2:${w}`, TW, TD, TH + 9, q => {
    const L = q.pt(0, TD, 3), F = q.pt(TW, TD, 3), R = q.pt(TW, 0, 3);
    const up = ([x, y]: [number, number], h: number): [number, number] => [x, y - h];
    q.poly([L, F, up(F, TH), up(L, TH)], '#f4f0f4');
    q.poly([F, R, up(R, TH), up(F, TH)], '#e0d8e4');
    q.poly([q.pt(0, TD - 0.2, TH + 3), q.pt(TW, TD - 0.2, TH + 3), q.pt(TW, TD, TH + 3), q.pt(0, TD, TH + 3)], '#ffffff');
    q.poly([q.pt(TW - 0.2, 0, TH + 3), q.pt(TW, 0, TH + 3), q.pt(TW, TD, TH + 3), q.pt(TW - 0.2, TD, TH + 3)], '#ffffff');
    for (let g = 0.2; g < TW - 0.1; g += 0.5) { const [x, y] = q.pt(g, TD, 10); q.rect(x, y, 2, 1, GOLD_L); }
    const r = seeded(`tubf-${w}`);
    for (let i = 0; i < 20; i++) {
      const [x, y] = q.pt(0.3 + r() * (TW - 0.6), TD - 0.45 + r() * 0.2, TH + 1);
      const c = wt.float[i % wt.float.length];
      if (w === 'bubble' || w === 'milk') ellipse(q, x, y, 2 + r() * 1.5, 1.4, c); else { q.px(x, y, c); q.px(x + 1, y - 1, c); }
    }
    for (const [a, b] of [[0.2, TD - 0.3], [TW - 0.3, TD - 0.3], [TW - 0.3, 0.2]]) q.box(a, b, 0, 0.15, 0.15, 3, shade(GOLD));
  }, '#8a7a8a');
}

// ───────── Đồi ngắm cảnh: thảm picnic ─────────

export function picnicSprite() {
  return makeSprite('picnic', 40, 18, p => {
    for (let y = 8; y < 18; y++) for (let x = 0; x < 40; x++) {
      const sx = x - (17 - y) * 0.6;
      if (sx < 0 || sx > 34) continue;
      p.px(x, y, (Math.floor(sx / 4) + Math.floor(y / 3)) % 2 ? '#fffaf0' : '#f08aa6');
    }
    p.rect(22, 3, 10, 7, '#d29a63'); p.rect(22, 3, 10, 2, '#ecc18e'); p.rect(24, 0, 1, 4, '#a8703f'); p.rect(29, 0, 1, 4, '#a8703f'); p.rect(24, 0, 6, 1, '#a8703f');
    p.rect(23, 2, 2, 1, '#ec7a7a'); p.px(27, 2, '#f6c64e');
    p.rect(12, 2, 3, 9, '#7a2e46'); p.rect(13, 0, 1, 2, '#7a2e46'); p.rect(12, 6, 3, 2, '#f2d48a');      // chai vang
    for (const x of [6, 17]) { p.rect(x, 7, 2, 2, '#e8607a'); p.px(x, 6, '#f4f4f8'); p.px(x + 1, 6, '#f4f4f8'); p.px(x, 9, '#f4f4f8'); }
    for (const [x, y] of [[33, 12], [35, 11], [8, 13]]) { p.px(x, y, '#e8405a'); p.px(x + 1, y, '#e8405a'); p.px(x, y - 1, '#6aa645'); }
  }, OUT);
}
