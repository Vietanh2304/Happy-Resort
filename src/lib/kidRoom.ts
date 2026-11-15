// Phòng riêng của các con (nhìn thẳng): hai giường đầu đám mây (hồng / xanh), tủ đầu giường đèn ngủ, cửa sổ trăng sao,
// dây cờ & đèn dây, kệ sách, thảm tròn, hộp đồ chơi, hai bàn học có đèn — các con ngồi sau bàn học, nằm trong chăn.
import { ellipse } from './iso';
import { makeSprite, mix } from './pixel';

/** Vị trí đồ trong phòng (toạ độ cảnh 192×144) */
export const KIDROOM = {
  beds: [{ x: 30, pillow: 92, stand: { x: 56, y: 128 } }, { x: 82, pillow: 92, stand: { x: 108, y: 128 } }],
  desks: [{ x: 132, top: 108, stand: { x: 116, y: 134 } }, { x: 168, top: 108, stand: { x: 152, y: 134 } }],
  play: [{ x: 64, y: 134 }, { x: 92, y: 138 }, { x: 46, y: 140 }, { x: 104, y: 132 }, { x: 78, y: 140 }],
  door: { x: 186, y: 132 },
};
/** chỗ của một bé (0 = giường & bàn hồng, 1 = xanh): hai bé khác giới thì bé gái hồng, bé trai xanh */
export function kidSlot(kid: { id: string; gender: 'm' | 'f' | null }, grown: { id: string; gender: 'm' | 'f' | null }[]) {
  const i = Math.max(0, grown.findIndex(k => k.id === kid.id));
  if (grown.length === 2 && grown[0].gender !== grown[1].gender && kid.gender) return kid.gender === 'f' ? 0 : 1;
  return i % 2;
}
const BED = [{ head: '#f6b6cc', headD: '#e48aa8', quilt: '#ffd6e2', pat: '#f59ab3' }, { head: '#a8c8f4', headD: '#7aa0dc', quilt: '#d6e8ff', pat: '#8db8ef' }];

export function kidRoomBg() {
  return makeSprite('room:kids:v1', 192, 144, p => {
    // tường giấy dán màu oải hương nhạt có sao & mây
    p.rect(0, 0, 192, 88, '#f4ecfb');
    for (let y = 0; y < 88; y += 12) for (let x = (y / 12) % 2 ? 6 : 0; x < 192; x += 12) { p.px(x + 3, y + 4, '#e6d8f6'); p.px(x + 2, y + 5, '#e6d8f6'); p.px(x + 4, y + 5, '#e6d8f6'); p.px(x + 3, y + 6, '#e6d8f6'); }
    for (const [x, y] of [[118, 14], [150, 22], [176, 10], [8, 18]] as const) { ellipse(p, x, y, 6, 2.5, '#ffffff'); ellipse(p, x + 4, y - 1.5, 4, 2.5, '#ffffff'); }
    // ốp chân tường gỗ trắng + len chân tường
    p.rect(0, 66, 192, 22, '#fffaf4'); for (let x = 4; x < 192; x += 16) p.rect(x, 69, 12, 16, '#f6eee6'); p.rect(0, 66, 192, 2, '#e8dccc'); p.rect(0, 86, 192, 2, '#d8c4ac');
    // sàn gỗ sáng
    for (let y = 88; y < 144; y++) for (let x = 0; x < 192; x++) { const plank = Math.floor((y - 88) / 7), seam = (y - 88) % 7 === 0 || (x + plank * 23) % 46 === 0; p.px(x, y, seam ? '#d4a878' : plank % 2 ? '#f0cc9c' : '#ecc492'); }
    // cửa sổ vòm trăng sao giữa hai giường
    p.rect(42, 10, 28, 40, '#2a3a7a'); ellipse(p, 56, 10, 14, 9, '#2a3a7a');
    for (const [x, y] of [[47, 20], [62, 14], [52, 34], [65, 40], [46, 44], [58, 26]] as const) p.px(x, y, '#ffffff');
    ellipse(p, 61, 22, 4, 4, '#fff6d0'); ellipse(p, 63, 21, 3.5, 3.5, '#2a3a7a');
    p.rect(55, 4, 2, 46, '#ffffff'); p.rect(42, 28, 28, 2, '#ffffff'); p.rect(40, 49, 32, 3, '#ffffff');
    for (const sx of [34, 70]) { p.rect(sx, 4, 8, 50, '#ffd0e0'); for (let y = 6; y < 54; y += 4) p.rect(sx + (sx < 50 ? 6 : 1), y, 1, 2, '#f6a8c4'); }
    p.rect(32, 2, 48, 3, '#e8c46a');
    // dây cờ đuôi nheo + đèn dây
    for (let k = 0; k < 15; k++) { const x = 4 + k * 7, y = 4 + Math.round(Math.sin((k / 14) * Math.PI) * 5); p.rect(x, y, 5, 1, '#c8a080'); for (let j = 0; j < 4; j++) p.rect(x + j / 2 + 0.5, y + 1 + j, 4 - j, 1, ['#f59ab3', '#8db8ef', '#f6c64e', '#a5d470'][k % 4]); }
    for (let k = 0; k < 13; k++) { const x = 112 + k * 6, y = 6 + Math.round(Math.sin((k / 12) * Math.PI) * 4); p.px(x, y, '#8a7a6a'); p.rect(x, y + 1, 2, 2, ['#fff2a0', '#ffc8e0', '#c8f0ff'][k % 3]); }
    // kệ sách trên tường phía trên hai bàn học
    for (const sy of [34, 52]) { p.rect(114, sy, 72, 3, '#c8946a'); p.rect(114, sy + 3, 72, 1, '#9a6a48');
      for (let k = 0; k < 14; k++) { const h = 8 + (k * 7) % 5, x = 116 + k * 5 - (k > 6 ? 0 : 0); if (sy === 52 && k > 9) continue; p.rect(x, sy - h, 4, h, ['#e8606a', '#6aa8e0', '#f6c64e', '#8ad08a', '#b88ae0', '#f6a07a'][k % 6]); p.rect(x + 1, sy - h + 2, 2, 1, '#ffffff'); } }
    p.rect(166, 40, 10, 11, '#b07a4a'); ellipse(p, 171, 38, 5, 4, '#b07a4a'); p.px(169, 37, '#3a2a2a'); p.px(173, 37, '#3a2a2a');   // gấu ngồi trên kệ
    // đồng hồ treo tường
    ellipse(p, 96, 22, 7, 7, '#f6c64e'); ellipse(p, 96, 22, 5.5, 5.5, '#fffaf0'); p.rect(96, 18, 1, 4, '#3a2a3a'); p.rect(96, 22, 3, 1, '#3a2a3a');
    // tranh các con vẽ dán tường
    p.rect(98, 38, 12, 10, '#ffffff'); ellipse(p, 102, 43, 2, 2, '#f6c64e'); p.rect(100, 45, 8, 2, '#8ad08a'); p.rect(106, 41, 2, 4, '#e8606a');

    // ── hai giường đầu đám mây ──
    for (let i = 0; i < 2; i++) {
      const c = BED[i], x0 = i ? 64 : 12, w = 36, cx = x0 + w / 2;
      for (const [dx, r] of [[-11, 8], [0, 11], [11, 8]] as const) ellipse(p, cx + dx, 64, r, r - 1, c.head);
      p.rect(x0, 62, w, 26, c.head); p.rect(x0, 62, 2, 26, c.headD); p.rect(x0 + w - 2, 62, 2, 26, c.headD);
      for (const [dx, dy] of [[-8, 58], [6, 56], [0, 66], [-12, 70], [12, 70]] as const) p.px(cx + dx, dy, '#ffffff');
      p.rect(x0 - 1, 86, w + 2, 10, '#fffaf4');                                            // nệm
      ellipse(p, cx, 90, 11, 4, '#ffffff'); ellipse(p, cx, 89, 10, 3, '#fffdf8');             // gối
      p.rect(x0 - 2, 112, 3, 10, c.headD); p.rect(x0 + w - 1, 112, 3, 10, c.headD);          // chân giường
    }
    // tủ đầu giường + đèn ngủ nấm
    p.rect(51, 92, 10, 16, '#f6e6d0'); p.rect(51, 92, 10, 2, '#fffaf0'); p.rect(53, 99, 6, 1, '#d8c0a0'); p.px(56, 102, '#c8946a');
    p.rect(55, 84, 2, 8, '#d8c0a0'); ellipse(p, 56, 83, 5, 3, '#f59ab3'); for (const dx of [-2, 1, 3]) p.px(56 + dx, 82, '#ffffff');

    // ── hai bàn học: ghế phía sau (lưng ghế lộ trên mặt bàn), đèn bàn, sách ──
    for (let i = 0; i < 2; i++) {
      const cx = i ? 168 : 132;
      p.rect(cx - 6, 92, 12, 10, i ? '#8db8ef' : '#f59ab3'); p.rect(cx - 6, 92, 12, 2, mix(i ? '#8db8ef' : '#f59ab3', '#ffffff', 0.4));   // lưng ghế
    }
    // thảm tròn cầu vồng + đồ chơi
    for (const [r, col] of [[30, '#f6c4d4'], [26, '#fde2b8'], [22, '#d6ecc4'], [18, '#cfe2f8'], [14, '#e6d8f6']] as const) ellipse(p, 78, 132, r, r / 3.2, col);
    p.rect(14, 128, 18, 12, '#e8a060'); p.rect(14, 128, 18, 3, '#f6c084'); p.rect(21, 132, 4, 2, '#f6c64e');   // hộp đồ chơi
    for (const [x, y, col] of [[100, 138, '#e8606a'], [104, 138, '#6aa8e0'], [102, 134, '#f6c64e']] as const) { p.rect(x, y, 4, 4, col); p.px(x + 1, y + 1, '#ffffff'); }   // khối gỗ
    ellipse(p, 40, 140, 3, 3, '#e8606a'); p.rect(38, 139, 5, 1, '#ffffff');                 // bóng
    // cửa phòng bên phải
    p.rect(184, 54, 8, 34, '#e8d0b0'); p.rect(184, 54, 2, 34, '#c8a888'); p.px(187, 72, '#c8946a');
  }, null);
}

/** Chăn phủ lên giường (vẽ đè lên người các con khi ngủ) */
export function kidQuiltSprite(i: number) {
  const c = BED[i % 2];
  return makeSprite(`kidroom:quilt:${i % 2}`, 40, 28, p => {
    p.rect(1, 0, 38, 20, c.quilt); p.rect(1, 0, 38, 3, '#ffffff');
    for (let y = 6; y < 20; y += 6) for (let x = 4 + (y % 12 ? 3 : 0); x < 38; x += 7) { p.rect(x, y, 3, 3, c.pat); p.px(x + 1, y + 1, '#ffffff'); }
    p.rect(1, 20, 38, 6, mix(c.quilt, c.pat, 0.35)); p.rect(1, 25, 38, 1, c.pat);
    p.rect(0, 0, 1, 26, mix(c.quilt, '#2a2030', 0.15)); p.rect(39, 0, 1, 26, mix(c.quilt, '#2a2030', 0.15));
  });
}
/** Mặt trước bàn học (che chân con đang ngồi học) */
export function kidDeskSprite(i: number) {
  const col = i % 2 ? '#8db8ef' : '#f59ab3';
  return makeSprite(`kidroom:desk:${i % 2}`, 32, 30, p => {
    p.rect(0, 8, 32, 4, '#fffaf0'); p.rect(0, 11, 32, 1, '#e8dccc');                     // mặt bàn
    p.rect(1, 12, 30, 14, '#f6eee6'); p.rect(3, 14, 12, 5, mix(col, '#ffffff', 0.3)); p.rect(8, 16, 2, 1, '#ffffff');   // hộc kéo
    p.rect(1, 26, 3, 4, '#d8c4ac'); p.rect(28, 26, 3, 4, '#d8c4ac');
    p.rect(22, 0, 2, 8, '#8a7a6a'); ellipse(p, 23, 1, 4, 2, col); p.rect(20, 1, 6, 1, mix(col, '#2a2030', 0.2));   // đèn bàn
    p.rect(4, 6, 9, 2, '#e8606a'); p.rect(5, 4, 8, 2, '#6aa8e0'); p.rect(14, 6, 6, 2, '#ffffff'); p.px(16, 6, '#3a2a3a');   // sách vở
  });
}
/** Mép bồn cầu phía trước (che chân con đang ngồi) */
export function toiletFrontSprite() {
  return makeSprite('kidroom:toiletfront', 14, 7, p => { ellipse(p, 7, 2, 6.5, 2.5, '#ffffff'); p.rect(2, 2, 10, 5, '#ffffff'); p.rect(2, 6, 10, 1, '#d8d8e0'); p.rect(4, 0, 6, 1, '#e8e8f0'); });
}
