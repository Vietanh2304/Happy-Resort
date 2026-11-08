// Khuôn viên trường (bản đồ riêng, ngoài làng): toà nhà hai tầng, nhà ăn, sân trường có cột cờ, góc bóng rổ & cầu trượt,
// hàng rào có cổng; ngoài cổng là vỉa hè với 2 xe hàng rong (bánh mì, kem & bánh tráng).
import { ellipse } from './iso';
import { makeSprite, mix } from './pixel';
import { seeded } from './rng';

export const CAMPUS = {
  kidScale: 0.9,                                           // các bé nhỏ hơn người lớn (× cỡ nhân vật)
  w: 256, h: 192,
  door: { x: 128, y: 98 },                                 // cửa chính vào lớp
  canteen: { x: 30, door: { x: 30, y: 98 } },
  flag: { x: 182, y: 106 },
  gym: { x: 226, door: { x: 226, y: 100 } },
  hoop: { x: 236, y: 112 },
  yard: { x0: 12, x1: 244, y0: 104, y1: 146 },
  field: { x0: 136, x1: 232, y0: 112, y1: 146 },            // khu thể dục / đá bóng
  tables: [{ x: 36, y: 122 }, { x: 36, y: 142 }, { x: 84, y: 122 }, { x: 84, y: 142 }],
  gate: { x0: 110, x1: 146, y: 152 },
  carts: { bread: { x: 64, y: 176 }, sweet: { x: 196, y: 176 } },
  guard: { x: 156, y: 168 },
  toTown: { x: 16, y: 176 },
};

export function campusBackground(phase: 'day' | 'night' | 'sunset' | 'dawn') {
  return makeSprite(`campus:v1:${phase}`, CAMPUS.w, CAMPUS.h, p => {
    const night = phase === 'night', dusk = phase === 'sunset';
    const r = seeded('campus');
    const sky = night ? ['#0e1640', '#2a3270'] : dusk ? ['#6a4fc4', '#ff9a6a'] : ['#6ac0f6', '#d0eeff'];
    for (let y = 0; y < 60; y++) p.rect(0, y, 256, 1, mix(sky[0], sky[1], y / 60));
    // hàng cây xa phía sau
    for (let x = -4; x < 260; x += 11) ellipse(p, x, 50 + (r() * 4 | 0), 9, 8, night ? '#1e3a2e' : mix('#5aa84a', '#3a8a4a', r()));
    // bãi cỏ + bờ tường thấp phía sau sân (lấp khoảng giữa các toà nhà)
    for (let y = 54; y < 96; y++) p.rect(0, y, 256, 1, night ? '#24452f' : mix('#7ac860', '#5aa84a', (y - 54) / 42));
    p.rect(0, 86, 256, 10, night ? '#8a7a68' : '#e8d4b0'); p.rect(0, 86, 256, 1, night ? '#a89878' : '#f8e8c8');
    const win = (x: number, y: number) => { p.rect(x, y, 9, 8, '#ffffff'); p.rect(x + 1, y + 1, 7, 6, night ? (r() < 0.4 ? '#ffe08a' : '#2a3a5a') : '#a8d8f0'); p.rect(x + 4, y + 1, 1, 6, '#ffffff'); };
    // toà nhà chính hai tầng (mái đỏ, tháp đồng hồ)
    const wall = night ? '#c8b898' : '#fff2d8', wallD = night ? '#a89878' : '#e8d4b0';
    p.rect(64, 34, 128, 62, wall); p.rect(64, 64, 128, 2, wallD); p.rect(64, 94, 128, 2, wallD);
    for (let i = 0; i < 8; i++) p.rect(60 + i, 26 + i, 136 - i * 2, 1, i % 3 === 2 ? '#c8483a' : '#e8604a');
    p.rect(60, 33, 136, 2, '#c8483a');
    p.rect(114, 8, 28, 26, wall); for (let i = 0; i < 6; i++) p.rect(112 + i, 2 + i, 32 - i * 2, 1, '#e8604a');
    ellipse(p, 128, 19, 7, 7, '#ffffff'); ellipse(p, 128, 19, 6, 6, '#fffaf0'); p.rect(128, 14, 1, 5, '#3a3448'); p.rect(128, 19, 4, 1, '#3a3448');
    p.rect(96, 37, 64, 7, '#5aa8e0'); for (let x = 99; x < 158; x += 4) p.rect(x, 39, 2, 3, '#ffffff');      // bảng tên trường
    for (let x = 70; x < 186; x += 14) { if (x > 110 && x < 140) continue; win(x, 48); win(x, 72); }
    win(116, 48); win(132, 48);
    p.rect(116, 72, 24, 24, '#8a5a3c'); p.rect(118, 74, 9, 22, '#c88a5a'); p.rect(129, 74, 9, 22, '#c88a5a'); p.rect(127, 74, 2, 22, '#5a3a2a');
    p.rect(112, 94, 32, 3, '#c8b8a0'); p.rect(110, 97, 36, 2, '#b8a890');                                // bậc thềm
    // nhà ăn bên trái (mái xanh, mái hiên)
    p.rect(4, 52, 54, 44, night ? '#c8b0a0' : '#fde0d0'); for (let i = 0; i < 6; i++) p.rect(2 + i, 46 + i, 58 - i * 2, 1, '#3a9a8a');
    p.rect(2, 51, 58, 2, '#2a7a6a'); p.rect(16, 58, 30, 6, '#fffaf0'); p.rect(18, 59, 26, 4, '#f6a03a');
    win(8, 68); win(45, 68); p.rect(22, 72, 16, 24, '#a8693f'); p.rect(23, 73, 14, 9, '#ffe8a8');
    for (let x = 2; x < 60; x += 6) p.rect(x, 64, 6, 3, x % 12 ? '#e8604a' : '#fffaf0');
    // góc phải: nhà thể chất mái vòm xanh
    const gw = night ? '#b8c0d0' : '#e8f0fa';
    p.rect(200, 52, 54, 44, gw); p.rect(200, 94, 54, 2, '#c8d0e0');
    for (let x = 198; x < 256; x++) { const t = (x - 227) / 29; const h = Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * 14); p.rect(x, 52 - h, 1, h + 2, x % 6 ? '#3a7ac8' : '#2a5aa8'); }
    p.rect(212, 56, 30, 6, '#fffaf0'); p.rect(214, 57, 26, 4, '#e8604a'); ellipse(p, 227, 59, 2, 2, '#f6a03a');
    win(204, 66); win(241, 66);
    p.rect(217, 72, 20, 24, '#5a7ab0'); p.rect(219, 74, 7, 22, '#a8d0f0'); p.rect(228, 74, 7, 22, '#a8d0f0');
    // sân trường lát gạch, vẽ ô lò cò + vòng tròn
    for (let y = 96; y < 150; y++) p.rect(0, y, 256, 1, (y - 96) % 7 === 0 ? (night ? '#8a8270' : '#d8ccb0') : night ? '#a09884' : '#efe4c8');
    for (let x = 0; x < 256; x += 14) p.rect(x, 96, 1, 54, night ? '#968e7a' : '#e2d6ba');
    for (let i = 0; i < 4; i++) { p.rect(96, 104 + i * 8, 10, 1, '#ffffff'); p.rect(96, 104 + i * 8, 1, 8, '#ffffff'); p.rect(106, 104 + i * 8, 1, 8, '#ffffff'); }
    p.rect(136, 112, 96, 1, '#ffffff'); p.rect(136, 146, 96, 1, '#ffffff'); p.rect(136, 112, 1, 34, '#ffffff'); p.rect(232, 112, 1, 35, '#ffffff'); p.rect(184, 112, 1, 34, '#ffffff');
    for (let a = 0; a < 40; a++) { const t = (a / 40) * Math.PI * 2; p.px(184 + Math.round(Math.cos(t) * 8), 129 + Math.round(Math.sin(t) * 6), '#ffffff'); }
    // bồn hoa dọc chân tường
    for (let x = 4; x < 252; x += 6) { if (x > 108 && x < 148) continue; ellipse(p, x + 2, 98, 3, 2, night ? '#2a5a3a' : '#5aa84a'); if (r() < 0.5) p.px(x + 2, 97, ['#f59ab3', '#f6c64e', '#ffffff'][(r() * 3) | 0]); }
    // hàng rào sắt xanh + cổng mở
    for (let x = 0; x < 256; x++) {
      if (x >= CAMPUS.gate.x0 && x < CAMPUS.gate.x1) continue;
      p.px(x, 148, '#2a7a5a'); p.px(x, 154, '#2a7a5a'); if (x % 4 === 0) p.rect(x, 146, 1, 10, '#3a9a6a');
    }
    p.rect(CAMPUS.gate.x0 - 3, 140, 4, 16, '#e8d4b0'); p.rect(CAMPUS.gate.x1 - 1, 140, 4, 16, '#e8d4b0');
    p.rect(CAMPUS.gate.x0 - 4, 138, 6, 3, '#c8483a'); p.rect(CAMPUS.gate.x1 - 2, 138, 6, 3, '#c8483a');
    for (let i = 0; i < 8; i++) { p.rect(CAMPUS.gate.x0 + 1 + i, 148 - (i >> 2), 1, 9, '#3a9a6a'); p.rect(CAMPUS.gate.x1 - 2 - i, 148 - (i >> 2), 1, 9, '#3a9a6a'); }
    // vỉa hè + lòng đường
    for (let y = 156; y < 182; y++) p.rect(0, y, 256, 1, (y - 156) % 6 === 0 ? '#b8b0a8' : '#d8d0c4');
    for (let x = 0; x < 256; x += 12) p.rect(x, 156, 1, 26, '#c4bcb0');
    p.rect(0, 182, 256, 10, '#4a4a58'); p.rect(0, 182, 256, 1, '#8a8a98'); for (let x = 112; x < 146; x += 6) p.rect(x, 184, 4, 8, '#e8e8f0');
    // biển "đi chậm — trường học"
    p.rect(100, 160, 1, 16, '#5a5a6a'); p.rect(96, 156, 9, 7, '#f6c64e'); p.px(99, 158, '#3a3448'); p.px(101, 158, '#3a3448'); p.rect(99, 160, 3, 1, '#3a3448');
    // cây trên vỉa hè + biển về làng
    for (const x of [36, 232]) { p.rect(x, 168, 2, 10, '#7a5a3a'); ellipse(p, x + 1, 164, 7, 6, night ? '#2a5a3a' : '#5aa84a'); }
    p.rect(8, 164, 2, 16, '#8a5a3c'); p.rect(2, 160, 16, 6, '#c8905a'); p.px(4, 162, '#fffaf0'); p.rect(6, 162, 8, 1, '#fffaf0');
  }, null);
}

/** Xe hàng rong có ô che */
export const cartSprite = (kind: 'bread' | 'sweet') => makeSprite(`cart:${kind}`, 32, 30, p => {
  const umb = kind === 'bread' ? ['#e8604a', '#fffaf0'] : ['#5aa8e0', '#f59ab3'];
  for (let i = 0; i < 6; i++) { const w = 6 + i * 3; for (let x = 16 - w; x < 16 + w; x++) p.px(x, i, umb[Math.floor((x + 32) / 5) % 2]); }
  p.rect(15, 6, 2, 10, '#8a8098');
  p.rect(2, 14, 28, 10, kind === 'bread' ? '#f6e8c8' : '#fffaf0'); p.rect(2, 14, 28, 2, kind === 'bread' ? '#c8905a' : '#7ad0d0');
  p.rect(4, 17, 24, 5, '#a8d8f0'); p.rect(4, 17, 24, 1, '#ffffff');
  if (kind === 'bread') { for (let x = 6; x < 26; x += 6) { p.rect(x, 19, 5, 2, '#d8a050'); p.px(x + 1, 19, '#f6c87a'); } }
  else { for (let x = 6; x < 26; x += 5) { p.rect(x + 1, 18, 2, 3, ['#f59ab3', '#fffaf0', '#a5d470', '#f6c64e'][(x / 5) | 0]); p.px(x + 1, 21, '#c8905a'); } }
  p.rect(2, 24, 28, 1, '#8a5a3c');
  ellipse(p, 7, 27, 2.5, 2.5, '#3a3448'); ellipse(p, 25, 27, 2.5, 2.5, '#3a3448'); p.px(7, 27, '#c8c8d8'); p.px(25, 27, '#c8c8d8');
  p.rect(28, 12, 4, 1, '#8a5a3c');
});

/** Bàn ăn dài ngoài sân (có mái che nhỏ là ô trên bàn) */
export const lunchTableSprite = () => makeSprite('lunch-table', 40, 12, p => {
  p.rect(0, 2, 40, 4, '#e8c890'); p.rect(0, 2, 40, 1, '#f8dcb0'); p.rect(2, 6, 2, 6, '#a8703f'); p.rect(36, 6, 2, 6, '#a8703f');
  p.rect(-0, 8, 40, 2, '#c8905a');
});
/** Khay cơm */
export const trayFood = ['🍱', '🍚', '🍗', '🥣', '🍌'];

/** Cột cờ */
export const flagSprite = () => makeSprite('flagpole', 14, 46, p => {
  p.rect(2, 2, 1, 42, '#c8c8d8'); p.px(2, 1, '#f6c64e');
  p.rect(3, 3, 10, 7, '#e8483a'); p.px(7, 5, '#f6e04a'); p.px(8, 6, '#f6e04a'); p.px(6, 6, '#f6e04a'); p.px(7, 7, '#f6e04a');
  p.rect(0, 43, 6, 3, '#a8a0a0');
});

/** Biển xe đưa đón học sinh trong làng (đi tới trường) */
export const schoolStopSprite = () => makeSprite('school-stop', 22, 28, p => {
  p.rect(10, 6, 2, 22, '#5a5a6a'); p.rect(3, 0, 16, 10, '#f6c64e'); p.rect(4, 1, 14, 8, '#ffe08a');
  p.rect(6, 3, 10, 5, '#e8604a'); p.rect(8, 2, 6, 2, '#e8604a'); p.rect(10, 5, 2, 3, '#a8693f');
  p.rect(1, 22, 20, 2, '#8a5a3c'); p.rect(2, 24, 1, 4, '#5a3a2a'); p.rect(19, 24, 1, 4, '#5a3a2a');
});

/** Nhà thể chất bên trong: sàn gỗ kẻ sân, rổ bóng hai đầu, khán đài, thang gióng, đệm nhảy, bảng điểm */
export const GYM = { court: { x0: 16, x1: 176, y0: 86, y1: 136 }, hoops: [{ x: 18, y: 64 }, { x: 174, y: 64 }], mats: { x: 96, y: 128 } };
export function gymBackground(night: boolean) {
  return makeSprite(`gym:v1:${night}`, 192, 144, p => {
    const wall = night ? '#c8c0b0' : '#f2ead8';
    p.rect(0, 0, 192, 80, wall);
    for (let x = 0; x < 192; x += 16) p.rect(x, 0, 1, 80, mix(wall, '#000000', 0.06));
    // cửa sổ cao + đèn trần
    for (let x = 20; x < 180; x += 32) { p.rect(x, 6, 18, 12, '#ffffff'); p.rect(x + 1, 7, 16, 10, night ? '#2a3a6a' : '#a8d8f0'); p.rect(x + 8, 7, 1, 10, '#ffffff'); }
    for (let x = 36; x < 170; x += 40) { p.rect(x, 0, 1, 3, '#8a8098'); p.rect(x - 4, 3, 9, 2, night ? '#fff1a8' : '#e8e8f0'); }
    // khán đài bậc thang
    for (let i = 0; i < 4; i++) p.rect(52 - i * 4, 40 + i * 9, 88 + i * 8, 9, i % 2 ? '#5a7ab0' : '#4a6aa0');
    for (let i = 0; i < 4; i++) for (let x = 54 - i * 4; x < 138 + i * 4; x += 6) p.rect(x, 41 + i * 9, 4, 2, ['#e8604a', '#f6c64e', '#7ac860'][(x + i) % 3]);
    // bảng điểm
    p.rect(80, 22, 32, 14, '#2a2a3a'); p.rect(83, 25, 10, 8, '#e8604a'); p.rect(99, 25, 10, 8, '#5aa8e0'); p.px(88, 28, '#ffffff'); p.px(104, 28, '#ffffff');
    // thang gióng hai bên
    for (const x0 of [4, 172]) { p.rect(x0, 30, 1, 46, '#a8703f'); p.rect(x0 + 14, 30, 1, 46, '#a8703f'); for (let y = 32; y < 76; y += 5) p.rect(x0, y, 15, 1, '#c8905a'); }
    // sàn gỗ + vạch sân
    for (let y = 80; y < 144; y++) p.rect(0, y, 192, 1, (y - 80) % 8 === 0 ? '#c8905a' : mix('#e8b878', '#d8a060', (y - 80) / 64));
    for (let y = 80; y < 144; y += 8) for (let x = ((y / 8) % 2) * 24; x < 192; x += 48) p.rect(x, y, 1, 8, '#c08850');
    p.rect(16, 86, 160, 1, '#ffffff'); p.rect(16, 136, 160, 1, '#ffffff'); p.rect(16, 86, 1, 51, '#ffffff'); p.rect(175, 86, 1, 51, '#ffffff'); p.rect(96, 86, 1, 50, '#ffffff');
    for (let a = 0; a < 48; a++) { const t = (a / 48) * Math.PI * 2; p.px(96 + Math.round(Math.cos(t) * 12), 111 + Math.round(Math.sin(t) * 9), '#ffffff'); }
    for (const [cx, dir] of [[16, 1], [176, -1]] as const) for (let a = -10; a <= 10; a++) p.px(cx + dir * Math.round(Math.sqrt(100 - a * a) * 1.6), 111 + a, '#e8604a');
    // rổ bóng
    for (const h of GYM.hoops) { p.rect(h.x - 1, 40, 2, 40, '#8a8098'); p.rect(h.x - 8, 34, 16, 11, '#ffffff'); p.rect(h.x - 8, 34, 16, 1, '#3a3448'); p.rect(h.x - 3, 38, 6, 4, '#e8604a'); p.rect(h.x - 4, 45, 8, 1, '#f6a03a'); for (let x = h.x - 4; x <= h.x + 4; x += 2) p.rect(x, 46, 1, 4, '#ffffff'); }
    // giỏ bóng + đệm
    p.rect(150, 70, 12, 8, '#8a8098'); for (let x = 151; x < 161; x += 3) ellipse(p, x + 1, 69, 1.6, 1.6, '#f6a03a');
  }, null);
}
/** Tấm đệm nhảy xanh */
export const matSprite = () => makeSprite('gym-mat', 30, 8, p => { p.rect(0, 2, 30, 6, '#5aa8e0'); p.rect(0, 2, 30, 1, '#8ad0f0'); for (let x = 7; x < 30; x += 8) p.rect(x, 2, 1, 6, '#3a88c0'); });

/** Bồn cầu sứ trắng (phòng tắm) */
export const toiletSprite = () => makeSprite('toilet:v1', 14, 18, p => {
  p.rect(1, 0, 8, 9, '#f4f6fa'); p.rect(1, 0, 8, 1, '#ffffff'); p.rect(2, 2, 6, 1, '#d8dce6'); p.px(7, 1, '#a8b0c0');
  ellipse(p, 7, 11, 6, 3.4, '#e8ecf2'); ellipse(p, 7, 10.6, 4.6, 2.4, '#ffffff'); ellipse(p, 7, 10.8, 3, 1.4, '#a8d8f0');
  p.rect(4, 13, 6, 5, '#e8ecf2'); p.rect(4, 17, 6, 1, '#c8ccd8');
});
