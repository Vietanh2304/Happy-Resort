// Thuyền cổ tích: hai người ngồi thuyền trôi trên dòng suối, qua cổng tháp đồng hồ vào 6 hầm cổ tích
// (Kẹo Ngọt, Đáy đại dương, Rừng phép thuật, Bầu trời sao, Vũ hội lâu đài, Cổng cầu vồng) — búp bê nhảy múa, đèn lấp lánh.
// Mỗi hầm: lớp nền xa trôi chậm (chiều sâu) + lớp cảnh chính vẽ sẵn chi tiết + đồ động vẽ từng khung; mặt nước soi bóng cả cảnh.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterSprite, type AvatarLook } from '../lib/sprites';
import { archWin, bake, circ, cloud, cone, ell, glow, half, heart, line, poly, R, star, twinkle, type Ctx } from '../lib/canvasArt';

export const BOAT_WAIT = 4000;
const SPEED = 30, LEN = 1520, W = 320, HH = 180, Z = 2, BX = 120, BANK = 128, WATER = 132;
export const BOAT_MS = BOAT_WAIT + (LEN / SPEED) * 1000;
const ROOMS = [
  { x0: -150, x1: 150, k: 'gate', name: '🕰️ Cổng tháp đồng hồ — lên thuyền nào!' },
  { x0: 150, x1: 380, k: 'candy', name: '🍭 Vương quốc Kẹo Ngọt' },
  { x0: 380, x1: 610, k: 'sea', name: '🐠 Đáy đại dương' },
  { x0: 610, x1: 840, k: 'forest', name: '🍄 Rừng phép thuật' },
  { x0: 840, x1: 1070, k: 'sky', name: '🌙 Bầu trời sao' },
  { x0: 1070, x1: 1300, k: 'ball', name: '💃 Vũ hội lâu đài' },
  { x0: 1300, x1: 1720, k: 'rainbow', name: '🌈 Cổng cầu vồng — hạnh phúc mãi mãi 💖' },
] as const;
type Room = (typeof ROOMS)[number];
type RoomK = Room['k'];
const roomAt = (x: number) => ROOMS.find(r => x >= r.x0 && x < r.x1) ?? ROOMS[ROOMS.length - 1];
const img = (url: string) => { const i = new Image(); i.src = url; return i; };

const BG: Record<RoomK, [string, string, string]> = {
  gate: ['#6ab8f8', '#bfe4ff', '#ffe6f2'], candy: ['#ff9ccc', '#ffc8e4', '#fff2f8'], sea: ['#3ab8e8', '#1a6ab8', '#0a2a6a'],
  forest: ['#141a44', '#1e3a5a', '#2a6a5a'], sky: ['#06061e', '#1a1450', '#4a2a7a'], ball: ['#4a1a4a', '#a8507a', '#f6c0d8'], rainbow: ['#7ac8ff', '#c0e6ff', '#fff0f8'],
};
const PAR: Record<RoomK, number> = { gate: 0.45, candy: 0.5, sea: 0.5, forest: 0.45, sky: 0.3, ball: 0.6, rainbow: 0.4 };
const RW = (r: Room) => r.x1 - r.x0;
const farW = (r: Room) => RW(r) + (RW(r) + W) * (1 - PAR[r.k]);

/** Lớp xa (trôi chậm) */
function far(r: Room) {
  const w = farW(r);
  return bake(`far:${r.k}`, w, 140, (c, rnd) => {
    if (r.k === 'gate') {
      for (let k = 0; k < 9; k++) cloud(c, k * w / 9 + rnd() * 20, 18 + rnd() * 26, 26 + rnd() * 20, '#ffffff', '#dcecff');
      for (let x = 0; x < w; x += 2) { const h = 30 + Math.sin(x / 40) * 8 + Math.sin(x / 13) * 3; R(c, x, 128 - h, 2, h, '#9ad8a8'); }
      // lâu đài xa màu tím nhạt
      for (const [cx, sc] of [[w * 0.2, 0.8], [w * 0.62, 1], [w * 0.9, 0.7]]) {
        R(c, cx - 30 * sc, 128 - 50 * sc, 60 * sc, 50 * sc, '#d8c8f0');
        for (const [dx, th] of [[-26, 62], [-12, 74], [0, 90], [12, 74], [26, 62]]) { R(c, cx + dx * sc - 4 * sc, 128 - th * sc, 8 * sc, th * sc, '#e4d8f8'); cone(c, cx + dx * sc, 128 - th * sc, 11 * sc, 16 * sc, '#b8a0e8', '#a890d8'); }
      }
      for (let x = 0; x < w; x += 2) { const h = 14 + Math.sin(x / 23 + 1) * 5; R(c, x, 128 - h, 2, h, '#7ac890'); }
    }
    if (r.k === 'candy') {
      for (let k = 0; k < 8; k++) cloud(c, k * w / 8 + rnd() * 16, 14 + rnd() * 20, 24 + rnd() * 16, '#fff0fa', '#ffd0ea');
      // núi kem phủ đường chảy
      const HILL = ['#ffd8a8', '#c8f0d8', '#e0d0ff', '#ffe8a0'];
      for (let k = 0; k < 9; k++) {
        const cx = k * w / 8, rr = 34 + rnd() * 18, col = HILL[k % 4];
        half(c, cx, 128, rr, col); half(c, cx, 128 - rr + 12, 14, '#ffffff');
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx, 128, rr, Math.PI * 1.15, Math.PI * 1.85); c.lineTo(cx + rr * 0.6, 128 - rr * 0.55); c.fill();
        for (let d = -3; d <= 3; d++) R(c, cx + d * rr * 0.2, 128 - rr * 0.78 + Math.abs(d) * 4, 2.5, 5 + (d + 3) % 3 * 3, '#ffffff');
        for (let s = 0; s < 14; s++) R(c, cx - rr * 0.6 + rnd() * rr * 1.2, 128 - rr * 0.2 - rnd() * rr * 0.5, 1.5, 0.75, ['#ff4a8a', '#4ad8ff', '#ffd84a', '#8a5aff'][s % 4]);
      }
      // lâu đài bánh gừng xa
      const gx = w * 0.55; R(c, gx - 30, 64, 60, 50, '#d8925a'); for (let x = -30; x < 30; x += 5) half(c, gx + x + 2.5, 64, 2.5, '#ffffff');
      for (const [dx, th] of [[-30, 70], [0, 86], [30, 70]]) { R(c, gx + dx - 6, 114 - th, 12, th, '#c8804a'); cone(c, gx + dx, 114 - th, 16, 18, '#ff8ac0', '#ffffff'); circ(c, gx + dx, 114 - th - 19, 2, '#ff3a5a'); archWin(c, gx + dx - 2, 120 - th, 4, 7, '#fff0a0', '#ffffff'); }
    }
    if (r.k === 'sea') {
      for (let x = 0; x < w; x += 2) { const h = 26 + Math.sin(x / 30) * 10 + Math.sin(x / 9) * 3; R(c, x, 128 - h, 2, h, '#14508a'); }
      // cung điện san hô của nàng tiên cá
      const px = w * 0.5; for (const [dx, th, ww] of [[-28, 54, 12], [-12, 70, 12], [0, 86, 14], [12, 70, 12], [28, 54, 12]]) { R(c, px + dx - ww / 2, 128 - th, ww, th, '#3a7ab8'); half(c, px + dx, 128 - th, ww / 2 + 2, '#5a9ad0'); for (let y = 128 - th + 8; y < 120; y += 10) { R(c, px + dx - 2, y, 4, 5, '#ffe8a0'); glow(c, px + dx, y + 2, 6, '#ffe8a0', 0.4); } }
      // xác tàu đắm
      const sx = w * 0.15; poly(c, [sx - 36, 110, sx + 30, 104, sx + 24, 124, sx - 30, 126], '#1a3a60'); R(c, sx - 4, 64, 3, 44, '#1a3a60'); poly(c, [sx - 2, 66, sx + 18, 74, sx - 2, 88], '#24507a');
      for (let x = 0; x < w; x += 2) { const h = 12 + Math.sin(x / 17 + 2) * 6; R(c, x, 128 - h, 2, h, '#0e3a70'); }
    }
    if (r.k === 'forest') {
      glow(c, w * 0.5, 28, 40, '#c8e8ff', 0.5); circ(c, w * 0.5, 28, 13, '#f0f6ff'); circ(c, w * 0.5 - 4, 25, 3, '#dce8f8'); circ(c, w * 0.5 + 5, 31, 2, '#dce8f8');
      const LAY = ['#22406a', '#1a3456', '#122840'];
      LAY.forEach((col, li) => { for (let x = -10; x < w + 10; x += 14 + li * 4) { const h = 60 - li * 12 + rnd() * 20; poly(c, [x - 10, 128, x, 128 - h, x + 10, 128], col); poly(c, [x - 8, 128 - h * 0.4, x, 128 - h * 1.08, x + 8, 128 - h * 0.4], col); } });
      // lâu đài tiên xa có cửa sổ sáng
      const cx = w * 0.72; for (const [dx, th] of [[-14, 50], [0, 66], [14, 50]]) { R(c, cx + dx - 5, 118 - th, 10, th, '#2a3a5a'); cone(c, cx + dx, 118 - th, 13, 16, '#3a4a7a', '#2a3a6a'); R(c, cx + dx - 1, 124 - th, 2, 3, '#ffe880'); glow(c, cx + dx, 125 - th, 5, '#ffe880', 0.5); }
      c.globalAlpha = 0.35; for (let x = 0; x < w; x += 2) R(c, x, 108 + Math.sin(x / 20) * 3, 2, 20, '#8ad8d0'); c.globalAlpha = 1;
    }
    if (r.k === 'sky') {
      for (const [x, y, rr, col] of [[w * 0.2, 40, 50, '#ff5ab8'], [w * 0.5, 60, 60, '#5a8aff'], [w * 0.8, 36, 46, '#b85aff'], [w * 0.65, 90, 40, '#ff8a5a']] as const) glow(c, x, y, rr, col, 0.22);
      for (let k = 0; k < 420; k++) { const x = rnd() * w, band = (x / w) * 70 + 20, y = band + (rnd() - 0.5) * 30 * rnd(); R(c, x, y, 0.5, 0.5, rnd() < 0.3 ? '#c8d8ff' : '#ffffff'); }
      for (let k = 0; k < 160; k++) R(c, rnd() * w, rnd() * 130, 0.5, 0.5, '#ffffffa0');
      // chòm sao nối nét
      for (let g = 0; g < 4; g++) { const ox = w * (0.12 + g * 0.24), oy = 20 + (g % 2) * 30; let px = ox, py = oy; for (let k = 0; k < 5; k++) { const nx = ox + k * 9 + rnd() * 6, ny = oy + Math.sin(k * 1.7 + g) * 9; line(c, px, py, nx, ny, 0.4, '#8aa8ff80'); circ(c, nx, ny, 0.9, '#ffffff'); px = nx; py = ny; } }
    }
    if (r.k === 'ball') {
      R(c, 0, 0, w, 140, '#c87aa8'); for (let x = 0; x < w; x += 36) { R(c, x, 0, 36, 140, '#d890b8'); R(c, x + 2, 20, 32, 96, '#e8a8c8'); R(c, x + 4, 22, 28, 92, '#f0b8d4'); }
      for (let x = 10; x < w; x += 36) {
        // cửa sổ cao nhìn ra trời đêm
        R(c, x - 1, 24, 18, 84, '#f6c445'); half(c, x + 8, 24, 10, '#f6c445'); R(c, x, 26, 16, 80, '#1a1a5a'); half(c, x + 8, 26, 8, '#1a1a5a');
        for (let k = 0; k < 8; k++) R(c, x + rnd() * 15, 22 + rnd() * 70, 0.5, 0.5, '#ffffff'); if (x % 72 === 10) { circ(c, x + 11, 36, 3, '#fff6c0'); circ(c, x + 12.5, 35, 2.6, '#1a1a5a'); }
        R(c, x + 7.5, 18, 1, 88, '#f6c445'); for (let y = 40; y < 104; y += 16) R(c, x, y, 16, 1, '#f6c445');
        // rèm nhung đỏ buộc dây vàng
        for (const s of [-1, 1]) { const rx = s < 0 ? x - 6 : x + 16; poly(c, [rx, 14, rx + 6, 14, rx + 6 - s * 2, 70, rx + 3 + s * 4, 112, rx, 112], '#b8203a'); R(c, rx, 14, 6, 112 - 14, '#00000000'); R(c, rx + (s < 0 ? 4 : 0), 66, 2.5, 3, '#f6c445'); R(c, rx + 2, 14, 1, 90, '#d83a54'); }
      }
      R(c, 0, 10, w, 4, '#f6c445'); for (let x = 0; x < w; x += 6) half(c, x + 3, 14, 3, '#e8b830');
    }
    if (r.k === 'rainbow') {
      for (let k = 0; k < 9; k++) cloud(c, k * w / 9 + rnd() * 20, 16 + rnd() * 30, 28 + rnd() * 20, '#ffffff', '#e8f0ff');
      for (let x = 0; x < w; x += 2) { const h = 34 + Math.sin(x / 36) * 10; R(c, x, 128 - h, 2, h, '#a8e8b0'); }
      // lâu đài hồng trên đồi
      const cx = w * 0.55; R(c, cx - 26, 70, 52, 30, '#ffd8e8'); for (const [dx, th] of [[-24, 42], [-10, 56], [0, 70], [10, 56], [24, 42]]) { R(c, cx + dx - 4, 100 - th, 8, th, '#fff0f6'); cone(c, cx + dx, 100 - th, 11, 15, '#ff8ac0', '#ff6aa8'); R(c, cx + dx - 0.5, 84 - th - 4, 1, 4, '#f6c445'); archWin(c, cx + dx - 1.5, 104 - th, 3, 6, '#8ac8ff'); }
      for (let x = 0; x < w; x += 2) { const h = 18 + Math.sin(x / 19 + 2) * 6; R(c, x, 128 - h, 2, h, '#7ad890'); }
      for (let k = 0; k < 80; k++) circ(c, rnd() * w, 112 + rnd() * 14, 0.8, ['#ff6a9a', '#ffd84a', '#ffffff', '#b88aff'][k % 4]);
    }
  });
}

/** Lớp cảnh chính (đi cùng thuyền), toạ độ u = wx - r.x0 */
function mid(r: Room) {
  const w = RW(r);
  return bake(`mid:${r.k}`, w, 140, (c, rnd) => {
    const U = (wx: number) => wx - r.x0;
    if (r.k === 'gate') {
      // mặt tiền tháp đồng hồ trắng–vàng–hồng
      const L = U(-110), Rt = U(146), cx = U(40);
      R(c, L, 62, Rt - L, 64, '#fff6ee'); R(c, L, 62, Rt - L, 2, '#f6c445'); R(c, L, 95, Rt - L, 2, '#f6c445'); R(c, L, 118, Rt - L, 10, '#ffe0ec'); R(c, L, 118, Rt - L, 1, '#f6c445');
      for (let x = L; x < Rt; x += 18) { R(c, x, 64, 3, 54, '#ffd6e6'); R(c, x - 1, 64, 5, 2, '#f6c445'); R(c, x - 1, 116, 5, 2, '#f6c445'); }
      for (let x = L + 5; x < Rt - 12; x += 18) { if (Math.abs(x + 6 - cx) < 24) continue; archWin(c, x + 1, 68, 10, 22, ['#ff9ac8', '#8ac8ff', '#c8a8ff'][Math.floor(x / 18) % 3]); archWin(c, x + 2, 100, 8, 15, '#7ab0e8'); }
      // dãy tháp nhỏ trên nóc
      const TW: [number, number, string, string][] = [[-100, 26, '#ffd0e4', '#ff8ac0'], [-78, 36, '#d0e8ff', '#6aa8f0'], [-56, 28, '#fff0b8', '#f6b830'], [-34, 44, '#ffd0e4', '#c87ae8'], [-12, 30, '#d0e8ff', '#ff8ac0'],
        [92, 30, '#d0e8ff', '#ff8ac0'], [114, 44, '#ffd0e4', '#c87ae8'], [136, 30, '#fff0b8', '#6aa8f0']];
      for (const [dx, th, body, cc] of TW) {
        const x = U(dx); R(c, x - 6, 62 - th, 12, th, body); R(c, x + 3, 62 - th, 3, th, '#00000014'); R(c, x - 7, 62 - th, 14, 2, '#f6c445');
        archWin(c, x - 2, 66 - th, 4, 8, '#ff9ac8'); for (let k = 0; k < 4; k++) R(c, x - 6 + k * 3.5, 60 - th - 2, 2, 2, body);
        cone(c, x, 60 - th, 15, 22, cc, '#ffffff'); circ(c, x, 60 - th - 23, 1.4, '#f6c445'); R(c, x - 0.25, 60 - th - 30, 0.5, 7, '#c8902a');
      }
      // tháp đồng hồ chính
      R(c, cx - 22, 6, 44, 58, '#ffffff'); R(c, cx + 14, 6, 8, 58, '#f4e8f0'); R(c, cx - 23, 6, 46, 2, '#f6c445'); R(c, cx - 23, 58, 46, 3, '#f6c445');
      for (const dx of [-20, 17]) { R(c, cx + dx, 8, 3, 50, '#ffd6e6'); circ(c, cx + dx + 1.5, 8, 2, '#f6c445'); }
      circ(c, cx, 30, 16, '#f6c445'); circ(c, cx, 30, 14.5, '#c8902a'); circ(c, cx, 30, 13.5, '#fffbea');
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; R(c, cx + Math.sin(a) * 11.5 - 0.5, 30 - Math.cos(a) * 11.5 - (i % 3 ? 0.5 : 1), 1, i % 3 ? 1 : 2, '#3a2a3a'); }
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; circ(c, cx + Math.sin(a) * 18, 30 - Math.cos(a) * 18, 1.3, ['#ff8ac0', '#6aa8f0', '#f6b830'][i % 3]); }
      // cửa nhỏ cho búp bê chạy ra + ban công
      archWin(c, cx - 14, 46, 8, 11, '#3a1a3a', '#f6c445'); archWin(c, cx + 6, 46, 8, 11, '#3a1a3a', '#f6c445'); R(c, cx - 26, 60, 52, 2, '#c8902a');
      for (let x = cx - 25; x < cx + 26; x += 3) R(c, x, 56, 1, 4, '#f6c445');
      // hộp hoa + dây cờ
      for (let x = L + 4; x < Rt - 8; x += 18) { R(c, x, 90, 12, 3, '#9a5a3a'); for (let k = 0; k < 6; k++) circ(c, x + 1 + k * 2, 89, 1.3, ['#ff5a9a', '#ffd84a', '#ffffff', '#ff8a3a', '#b88aff'][(k + x) % 5]); R(c, x, 89.5, 12, 0.5, '#4a9a4a'); }
      for (let x = L; x < Rt; x += 8) { const y = 63 + Math.sin(((x - L) % 48) / 48 * Math.PI) * 4; poly(c, [x, y, x + 6, y, x + 3, y + 5], ['#ff5a9a', '#ffd84a', '#5ab8ff', '#8ae87a'][Math.floor(x / 8) % 4]); }
      // hàng rào cây cắt tỉa + hoa ở bờ
      for (let x = 0; x < w; x += 5) circ(c, x + 2.5, 124, 4.2, '#4aa860'); R(c, 0, 124, w, 4, '#4aa860'); for (let x = 0; x < w; x += 5) circ(c, x + 2, 122, 2.4, '#6ac87a');
      for (let k = 0; k < 70; k++) circ(c, rnd() * w, 120 + rnd() * 7, 0.9, ['#ff5a9a', '#ffffff', '#ffd84a', '#ff8ad8'][k % 4]);
      for (const dx of [-130, -64, 80, 128]) { const x = U(dx); R(c, x - 1, 100, 2, 22, '#7a5a3a'); circ(c, x, 98, 7, '#3a9a50'); circ(c, x, 90, 5, '#4aaa60'); circ(c, x, 84, 3, '#5aba70'); }
    }
    if (r.k === 'candy') {
      // nền sàn sô-cô-la chảy
      R(c, 0, 116, w, 12, '#8a4a2a'); for (let x = 0; x < w; x += 4) { R(c, x, 114, 4, 3 + (x * 7) % 5, '#a8603a'); R(c, x + 1, 113, 2, 1, '#c87a50'); }
      // gậy kẹo cong làm vòm
      for (let x = 14; x < w; x += 76) {
        for (const s of [0, 32]) { for (let y = 40; y < 116; y += 3) R(c, x + s, y, 4, 3, (y / 3) % 2 ? '#ffffff' : '#ff3a5a'); }
        for (let k = 0; k <= 16; k++) { const a = Math.PI + (k / 16) * Math.PI; R(c, x + 18 + Math.cos(a) * 16, 40 + Math.sin(a) * 16, 4, 3, k % 2 ? '#ffffff' : '#ff3a5a'); }
        for (let k = 0; k < 7; k++) circ(c, x + 4 + k * 4.4, 30 - Math.sin(k / 6 * Math.PI) * 6, 1.2, ['#ffd84a', '#5ad8ff', '#ff8ad8'][k % 3]);
      }
      // ngôi nhà bánh gừng
      const hx = U(r.x0 + 96);
      R(c, hx - 26, 72, 52, 44, '#c87a40'); for (let y = 76; y < 114; y += 6) for (let x = -24; x < 24; x += 8) R(c, hx + x + ((y / 6) % 2) * 4, y, 6, 4, '#d88a50');
      for (let y = 0; y < 28; y++) R(c, hx - 32 + y * 1.15, 72 - y, 64 - y * 2.3, 1, y % 5 === 0 ? '#ffffff' : '#a85a30');
      for (let x = -32; x < 32; x += 4) half(c, hx + x + 2, 73, 2, '#ffffff'); for (let k = 0; k < 7; k++) circ(c, hx - 15 + k * 5, 46 + Math.abs(k - 3) * 3.6, 2, ['#ff3a5a', '#5ac85a', '#ffd84a', '#5ab8ff'][k % 4]);
      R(c, hx + 12, 44, 7, 16, '#c87a40'); R(c, hx + 11, 43, 9, 2, '#ffffff');
      R(c, hx - 6, 96, 12, 20, '#ff6aa8'); half(c, hx, 96, 6, '#ff6aa8'); circ(c, hx + 3, 106, 1, '#f6c445'); for (let k = 0; k < 6; k++) R(c, hx - 6, 90 + k * 0.1, 12, 0.5, '#00000000');
      for (const dx of [-20, 11]) { R(c, hx + dx, 84, 10, 10, '#ffffff'); R(c, hx + dx + 1, 85, 8, 8, '#fff0a0'); R(c, hx + dx + 4.5, 85, 1, 8, '#ffffff'); R(c, hx + dx + 1, 88.5, 8, 1, '#ffffff'); }
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; poly(c, [hx, 62, hx + Math.cos(a) * 4, 62 + Math.sin(a) * 4, hx + Math.cos(a + 0.4) * 4, 62 + Math.sin(a + 0.4) * 4], k % 2 ? '#ffffff' : '#ff3a5a'); }
      // nhà cupcake
      for (const [ux, col] of [[U(r.x0 + 34), '#ff8ad8'], [U(r.x0 + 204), '#8ad8ff']] as const) {
        poly(c, [ux - 14, 92, ux + 14, 92, ux + 11, 116, ux - 11, 116], '#ffe0a0'); for (let x = -12; x < 12; x += 3) R(c, ux + x, 93, 1, 23, '#f0c070');
        for (let k = 0; k < 6; k++) circ(c, ux - 12 + k * 4.8, 90, 4, col); circ(c, ux, 82, 9, col); circ(c, ux - 5, 86, 6, col); circ(c, ux + 5, 86, 6, col);
        for (let k = 0; k < 14; k++) R(c, ux - 9 + rnd() * 18, 78 + rnd() * 12, 1.5, 0.75, ['#ffffff', '#ffd84a', '#5ac85a', '#ff3a5a'][k % 4]);
        circ(c, ux, 72, 3.5, '#e8203a'); R(c, ux + 1, 66, 0.5, 4, '#4a8a3a'); R(c, ux - 1, 70.5, 1, 1, '#ffffff');
        archWin(c, ux - 3, 100, 6, 10, '#fff0a0', '#ffffff');
      }
      // cây kem ốc quế khổng lồ
      for (const ux of [U(r.x0 + 60), U(r.x0 + 226)]) { poly(c, [ux - 7, 84, ux + 7, 84, ux, 116], '#e8b060'); for (let k = 0; k < 4; k++) line(c, ux - 6 + k * 3, 86, ux + 1 + k, 112, 0.5, '#c88a40'); circ(c, ux, 80, 7, '#fff0f6'); circ(c, ux - 2, 73, 6, '#ffb8d0'); circ(c, ux + 1, 67, 5, '#c8f0d8'); circ(c, ux + 1, 62, 2, '#e8203a'); }
      // kẹo dẻo dọc bờ
      for (let x = 2; x < w; x += 9) { const col = ['#ff5a8a', '#5ac8ff', '#ffd84a', '#8aff8a', '#c88aff'][Math.floor(x / 9) % 5]; half(c, x + 3, 122, 4, col); R(c, x - 1, 122, 8, 4, col); R(c, x + 1, 119, 1.5, 1, '#ffffffc0'); }
      R(c, 0, 125, w, 3, '#ffe0f0');
    }
    if (r.k === 'sea') {
      R(c, 0, 118, w, 10, '#e8d098'); for (let k = 0; k < 120; k++) R(c, rnd() * w, 118 + rnd() * 10, 0.5, 0.5, '#c8a870');
      // san hô nhánh
      const coral = (x: number, y: number, h: number, col: string) => { const br = (x0: number, y0: number, a: number, len: number, d: number) => { if (d > 3 || len < 3) return; const x1 = x0 + Math.sin(a) * len, y1 = y0 - Math.cos(a) * len; line(c, x0, y0, x1, y1, 3 - d * 0.6, col); circ(c, x1, y1, 1.6 - d * 0.2, col); br(x1, y1, a - 0.5, len * 0.7, d + 1); br(x1, y1, a + 0.45, len * 0.65, d + 1); }; br(x, y, 0, h * 0.4, 0); };
      for (let k = 0; k < 9; k++) coral(8 + k * 26 + rnd() * 8, 122, 28 + rnd() * 20, ['#ff6a8a', '#ff9a3a', '#ff8ad8', '#c86aff'][k % 4]);
      // quạt biển + san hô não
      for (let k = 0; k < 4; k++) { const x = 30 + k * 58, rr = 12 + rnd() * 5, col = ['#b85aff', '#ff5aa8'][k % 2]; for (let j = 0; j < 9; j++) { const a = -Math.PI * 0.85 + j / 8 * Math.PI * 0.7; line(c, x, 122, x + Math.cos(a) * rr, 122 + Math.sin(a) * rr, 0.6, col); } c.strokeStyle = col; c.lineWidth = 0.5; for (let q = 4; q < rr; q += 3) { c.beginPath(); c.arc(x, 122, q, -Math.PI * 0.85, -Math.PI * 0.15); c.stroke(); } }
      for (let k = 0; k < 5; k++) { const x = 16 + k * 48, col = ['#ffb05a', '#ff8a9a'][k % 2]; half(c, x, 124, 8, col); c.strokeStyle = '#00000030'; c.lineWidth = 0.5; for (let q = 0; q < 4; q++) { c.beginPath(); c.arc(x, 124, 2 + q * 1.6, Math.PI, 0); c.stroke(); } }
      // hòm kho báu
      const tx = U(r.x0 + 150); R(c, tx - 10, 110, 20, 12, '#8a4a20'); R(c, tx - 10, 110, 20, 1.5, '#f6c445'); R(c, tx - 1, 110, 2, 12, '#f6c445'); R(c, tx - 1.5, 113, 3, 3, '#c8902a');
      poly(c, [tx - 10, 110, tx - 8, 101, tx + 8, 101, tx + 10, 110], '#a85a28'); R(c, tx - 8, 101, 16, 1, '#f6c445');
      for (let k = 0; k < 14; k++) circ(c, tx - 9 + rnd() * 18, 108.5 + rnd() * 2, 1.2, rnd() < 0.3 ? '#ff5a9a' : '#ffd84a');
      for (let k = 0; k < 10; k++) circ(c, tx - 14 + k * 3, 121.5, 1.2, '#ffd84a');
      // sao biển, vỏ ốc
      for (let k = 0; k < 10; k++) star(c, rnd() * w, 121 + rnd() * 5, 2.2, ['#ff7a5a', '#ffb03a', '#ff5a9a'][k % 3], rnd());
      for (let k = 0; k < 8; k++) { const x = rnd() * w, y = 123 + rnd() * 4; half(c, x, y, 2.2, '#fff0e0'); for (let j = -1; j <= 1; j++) line(c, x, y, x + j * 1.6, y - 1.8, 0.3, '#e8b898'); }
      // đá cho tiên cá ngồi
      for (let x = 20; x < w; x += 58) { ell(c, x, 120, 12, 6, '#5a6a8a'); ell(c, x - 2, 118, 9, 4, '#6a7a9a'); R(c, x - 6, 116, 4, 1, '#8a9aba'); }
    }
    if (r.k === 'forest') {
      R(c, 0, 116, w, 12, '#1a3a2a'); for (let x = 0; x < w; x += 2) R(c, x, 113 + Math.sin(x / 5) * 1.5, 2, 4, '#245a3a');
      // cây cổ thụ uốn lượn, có nhà trên cây
      for (let k = 0; k < 4; k++) {
        const x = 18 + k * 62, top = 18 + rnd() * 10;
        for (let y = top; y < 118; y++) { const bend = Math.sin(y / 14 + k) * 3, ww = 10 + (y > 100 ? (y - 100) * 0.8 : 0); R(c, x + bend - ww / 2, y, ww, 1, '#3a2a3a'); R(c, x + bend + ww / 2 - 3, y, 3, 1, '#2a1a2a'); if (y % 7 === 0) R(c, x + bend - 2, y, 3, 0.5, '#4a3a4a'); }
        for (const s of [-1, 1]) { poly(c, [x, 116, x + s * 16, 120, x + s * 10, 117], '#3a2a3a'); }
        for (let j = 0; j < 12; j++) circ(c, x + (rnd() - 0.5) * 50, top + (rnd() - 0.5) * 22, 9 + rnd() * 7, ['#1a4a3a', '#245a44', '#2a6a4e'][j % 3]);
        for (let j = 0; j < 10; j++) circ(c, x + (rnd() - 0.5) * 44, top - 4 + (rnd() - 0.5) * 16, 2 + rnd() * 2, '#3a8a5a');
        if (k % 2 === 0) { const dy = 76; archWin(c, x - 3, dy, 6, 12, '#ffd860', '#c8902a', true); circ(c, x + 1.5, dy + 8, 0.6, '#c8902a'); R(c, x - 6, dy + 12, 12, 1, '#7a5a3a'); }
        else { circ(c, x + 2, 66, 3.2, '#ffd860'); glow(c, x + 2, 66, 9, '#ffd860', 0.45); R(c, x + 2, 63, 0.5, 6, '#c8902a'); R(c, x - 1, 66, 6, 0.5, '#c8902a'); }
      }
      // hoa chuông xanh phát sáng
      for (let k = 0; k < 30; k++) { const x = rnd() * w, y = 114 + rnd() * 6; R(c, x, y - 5, 0.5, 5, '#3a8a5a'); circ(c, x + 0.5, y - 5, 1.3, ['#8ad8ff', '#c88aff', '#ff8ad8'][k % 3]); }
    }
    if (r.k === 'sky') {
      // biển mây và lâu đài trên mây
      const cx = U(r.x0 + 150);
      for (const [dx, th] of [[-20, 40], [-8, 56], [4, 70], [16, 50], [26, 38]]) { R(c, cx + dx - 4, 102 - th, 8, th, '#e8e0ff'); R(c, cx + dx + 2, 102 - th, 2, th, '#c8c0f0'); cone(c, cx + dx, 102 - th, 11, 15, '#8a7ae8', '#b0a0ff'); R(c, cx + dx - 0.25, 102 - th - 20, 0.5, 5, '#f6c445'); for (let y = 108 - th; y < 98; y += 9) { R(c, cx + dx - 1, y, 2, 3, '#ffe880'); } }
      for (let k = 0; k < 14; k++) cloud(c, k * 18 - 10 + rnd() * 6, 108 + rnd() * 6, 26 + rnd() * 10, '#f0eaff', '#b8a8e8');
      R(c, 0, 112, w, 16, '#f0eaff'); for (let x = 0; x < w; x += 7) circ(c, x + 3, 126, 5, '#d8d0f8');
      // hành tinh có vành
      for (const [x, y, rr, col, rg] of [[U(r.x0 + 40), 34, 8, '#ff9a5a', '#ffe0a0'], [U(r.x0 + 200), 52, 6, '#8ab8ff', '#e0f0ff']] as const) {
        c.strokeStyle = rg; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, rr * 1.9, rr * 0.5, -0.3, Math.PI, Math.PI * 2); c.stroke(); circ(c, x, y, rr, col); ell(c, x - rr * 0.3, y - rr * 0.3, rr * 0.4, rr * 0.25, '#ffffff50'); for (let q = -2; q <= 2; q++) R(c, x - rr * 0.8, y + q * 2, rr * 1.6, 0.5, '#00000018');
        c.beginPath(); c.ellipse(x, y, rr * 1.9, rr * 0.5, -0.3, 0, Math.PI); c.stroke();
      }
    }
    if (r.k === 'ball') {
      // sàn đá cẩm thạch ô bàn cờ
      for (let x = 0; x < w; x += 6) for (let y = 116; y < 128; y += 4) R(c, x, y, 6, 4, ((x / 6 + (y - 116) / 4) % 2) ? '#fff6fa' : '#e8c0d8');
      R(c, 0, 115, w, 1.5, '#f6c445');
      // cầu thang lớn trải thảm đỏ
      const sx = U(r.x0 + 120);
      for (let k = 0; k < 9; k++) { const ww = 70 - k * 5, y = 114 - k * 4; R(c, sx - ww / 2, y, ww, 4, '#fff0f6'); R(c, sx - ww / 2, y + 3, ww, 1, '#d8b0c8'); R(c, sx - 10, y, 20, 4, '#c8203a'); R(c, sx - 10, y, 20, 0.5, '#f6c445'); }
      for (const s of [-1, 1]) { for (let k = 0; k < 9; k++) { const x = sx + s * (35 - k * 2.5), y = 114 - k * 4; R(c, x - 0.5, y - 6, 1, 6, '#f6c445'); } line(c, sx + s * 35, 108, sx + s * 15, 72, 1.2, '#f6c445'); circ(c, sx + s * 35, 106, 2, '#f6c445'); }
      R(c, sx - 24, 66, 48, 6, '#fff0f6'); R(c, sx - 24, 66, 48, 1, '#f6c445');
      // cột vàng có đầu cột
      for (let x = 8; x < w; x += 46) { if (Math.abs(x - sx) < 40) continue; R(c, x - 4, 18, 8, 98, '#f6c445'); R(c, x - 4, 18, 2, 98, '#ffe080'); R(c, x + 2, 18, 2, 98, '#c8902a'); for (let y = 24; y < 112; y += 8) R(c, x - 4, y, 8, 0.5, '#c8902a'); R(c, x - 7, 14, 14, 5, '#f6c445'); R(c, x - 6, 110, 12, 6, '#f6c445'); circ(c, x - 6, 16, 2, '#ffe080'); circ(c, x + 6, 16, 2, '#ffe080'); }
      // bình hoa hồng hai bên thang
      for (const s of [-1, 1]) { const x = sx + s * 46; poly(c, [x - 4, 100, x + 4, 100, x + 3, 114, x - 3, 114], '#f6c445'); for (let k = 0; k < 9; k++) circ(c, x - 6 + rnd() * 12, 92 + rnd() * 8, 2, ['#ff3a5a', '#ff8ab0', '#ffffff'][k % 3]); }
    }
    if (r.k === 'rainbow') {
      // cầu vồng lớn với hai đầu mây
      const cx = U(r.x0 + 130), RB = ['#ff4a5a', '#ff9a3a', '#ffe04a', '#5ad86a', '#4aa8ff', '#9a6aff'];
      RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 6; c.beginPath(); c.arc(cx, 124, 100 - k * 6, Math.PI, 0); c.stroke(); });
      c.strokeStyle = '#ffffff60'; c.lineWidth = 1; c.beginPath(); c.arc(cx, 124, 102, Math.PI, 0); c.stroke();
      for (const s of [-1, 1]) { cloud(c, cx + s * 85 - 22, 118, 44, '#ffffff', '#e0e8ff'); cloud(c, cx + s * 85 - 14, 108, 28, '#ffffff', '#e0e8ff'); }
      // vòm hoa hồng tim
      const ax = U(r.x0 + 230); c.strokeStyle = '#4a9a4a'; c.lineWidth = 3; c.beginPath(); c.arc(ax, 116, 26, Math.PI, 0); c.stroke();
      for (let k = 0; k <= 18; k++) { const a = Math.PI + k / 18 * Math.PI; circ(c, ax + Math.cos(a) * 26, 116 + Math.sin(a) * 26, 2.6, ['#ff3a6a', '#ff8ab0', '#ffffff'][k % 3]); }
      heart(c, ax, 84, 6, '#ff3a6a'); heart(c, ax, 84.5, 4, '#ff8ab0');
      // đồng hoa tulip
      R(c, 0, 116, w, 12, '#6ac87a'); for (let k = 0; k < 110; k++) { const x = rnd() * w, y = 114 + rnd() * 12; R(c, x, y, 0.5, 3, '#3a9a4a'); const col = ['#ff4a6a', '#ffd84a', '#ff8ad8', '#ffffff', '#b88aff'][k % 5]; R(c, x - 1, y - 2, 2.5, 2.5, col); R(c, x - 1, y - 3, 0.75, 1, col); R(c, x + 0.75, y - 3, 0.75, 1, col); }
    }
  });
}

/** Búp bê nhảy múa nhỏ (kiểu: váy / đuôi tiên cá / tiên rừng / thiên thần / kẹo / khiêu vũ) */
function doll(c: Ctx, x: number, y: number, k: number, t: number, kind: 'dress' | 'mermaid' | 'elf' | 'angel' | 'candy' | 'waltz') {
  const SK = ['#fde3d0', '#f6cfae', '#e0aa80', '#a8714f'][k % 4], HAIR = ['#4a3430', '#c98b4b', '#f3d58f', '#2e2a3a', '#f2a7c3'][k % 5];
  const DR = ['#ff5a9a', '#5ad8ff', '#ffd84a', '#9a7aff', '#5aff8a', '#ff8a3a'][k % 6], DRL = '#ffffff';
  const bob = Math.round(Math.sin(t * 6 + k) * 1.2), arm = Math.sin(t * 6 + k) > 0;
  y += bob;
  if (kind === 'angel') { const fl = Math.sin(t * 10 + k) > 0 ? 1 : 0; ell(c, x - 4.5, y - 10 - fl, 3, 2, '#ffffff'); ell(c, x + 4.5, y - 10 - fl, 3, 2, '#ffffff'); c.strokeStyle = '#ffe06a'; c.lineWidth = 0.6; c.beginPath(); c.ellipse(x, y - 16, 2.5, 0.8, 0, 0, Math.PI * 2); c.stroke(); }
  if (kind === 'mermaid') { for (let i = 0; i < 7; i++) R(c, x - 2 + Math.sin(t * 5 + i) * 0.6, y - 6 + i, 4 - i * 0.45, 1, i % 2 ? '#3ac8a8' : '#5ae0c0'); poly(c, [x - 3, y + 2, x + 3, y + 2, x, y], '#3ac8a8'); }
  else if (kind === 'waltz') { for (let i = 0; i < 6; i++) R(c, x - 2 - i * 0.7, y - 6 + i, 4 + i * 1.4, 1, i === 5 ? DRL : DR); }
  else { for (let i = 0; i < 5; i++) R(c, x - 1.5 - i * 0.5, y - 6 + i, 3 + i, 1, kind === 'elf' ? '#3aa84a' : kind === 'candy' ? (i % 2 ? '#ffffff' : DR) : i === 4 ? DRL : DR); R(c, x - 1, y - 1, 1, 2, SK); R(c, x + 1, y - 1, 1, 2, SK); }
  R(c, x - 1.5, y - 9, 3, 3, kind === 'elf' ? '#3aa84a' : DR); R(c, x - 0.5, y - 8, 1, 1, '#ffffff80');
  R(c, x - 3, y - 9 + (arm ? -2 : 1), 1, 3, SK); R(c, x + 2, y - 9 + (arm ? 1 : -2), 1, 3, SK);
  circ(c, x, y - 12, 2.4, SK); R(c, x - 2.5, y - 15, 5, 2, HAIR); R(c, x - 2.7, y - 14, 1, 3, HAIR); R(c, x + 1.7, y - 14, 1, 3, HAIR);
  if (kind === 'elf') { R(c, x - 2, y - 17, 4, 2, '#3aa84a'); R(c, x - 1, y - 19, 2, 2, '#3aa84a'); R(c, x, y - 20, 1, 1, '#ffd84a'); }
  if (kind === 'candy') { R(c, x - 3, y - 16, 6, 1, '#ff5a9a'); R(c, x - 1, y - 18, 2, 2, '#ffffff'); }
  if (kind === 'dress' || kind === 'mermaid') { R(c, x - 1.5, y - 16, 3, 1, '#f6c445'); R(c, x - 0.5, y - 17, 1, 1, '#f6c445'); }
  R(c, x - 1, y - 12, 0.6, 0.8, '#2a1a2a'); R(c, x + 0.6, y - 12, 0.6, 0.8, '#2a1a2a'); R(c, x - 2, y - 11, 0.8, 0.5, '#ff9ab0'); R(c, x + 1.4, y - 11, 0.8, 0.5, '#ff9ab0');
}

/** Đồ động từng khung của mỗi hầm (toạ độ thế giới qua SX) */
function live(c: Ctx, r: Room, SX: (x: number) => number, t: number) {
  const along = (step: number, f: (x: number, i: number) => void, a: number = r.x0, b: number = r.x1) => { for (let wx = a + step / 2, i = 0; wx < b; wx += step, i++) { const x = SX(wx); if (x > -30 && x < W + 30) f(x, i); } };
  if (r.k === 'gate') {
    const cx = SX(40), h = t * 0.5, m = t * 4;
    line(c, cx, 30, cx + Math.sin(h) * 7, 30 - Math.cos(h) * 7, 1.4, '#3a2a3a'); line(c, cx, 30, cx + Math.sin(m) * 10, 30 - Math.cos(m) * 10, 0.8, '#3a2a3a'); circ(c, cx, 30, 1.2, '#c8902a');
    // con lắc
    const sw = Math.sin(t * 3) * 0.35; line(c, cx, 44, cx + Math.sin(sw) * 8, 44 + Math.cos(sw) * 8, 0.5, '#c8902a'); circ(c, cx + Math.sin(sw) * 8, 44 + Math.cos(sw) * 8, 1.4, '#f6c445');
    // búp bê diễu hành ra từ hai cửa nhỏ, đi vòng ban công
    for (let k = 0; k < 6; k++) { const p = ((t * 0.12 + k / 6) % 1), x = cx - 22 + p * 44; doll(c, x, 60, k, t, k % 2 ? 'dress' : 'candy'); }
    // cờ bay trên các chóp
    for (const [dx, th] of [[-100, 26], [-78, 36], [-56, 28], [-34, 44], [-12, 30], [92, 30], [114, 44], [136, 30]]) { const x = SX(dx), y = 62 - th - 2 - 30, f = Math.sin(t * 6 + dx) * 1; poly(c, [x, y, x + 6, y + 1.5 + f, x, y + 3], ['#ff5a9a', '#5ab8ff', '#ffd84a'][Math.abs(dx) % 3]); }
    // chim bay
    for (let k = 0; k < 4; k++) { const x = SX(-140 + ((t * 14 + k * 70) % 320)), y = 30 + k * 9 + Math.sin(t * 2 + k) * 3, f = Math.sin(t * 12 + k) > 0; line(c, x - 3, y + (f ? -1.5 : 1), x, y, 0.7, '#5a5a7a'); line(c, x, y, x + 3, y + (f ? -1.5 : 1), 0.7, '#5a5a7a'); }
    // cổng hầm: vòm tối có viền đèn
    const ex = SX(150); poly(c, [ex - 26, 128, ex - 26, 86, ex - 22, 76, ex - 12, 69, ex, 67, ex + 12, 69, ex + 22, 76, ex + 26, 86, ex + 26, 128], '#2a1838');
    for (let i = 0; i <= 18; i++) { const a = Math.PI + i / 18 * Math.PI, on = (Math.floor(t * 4) + i) % 2; const x = ex + Math.cos(a) * 28, y = 92 + Math.sin(a) * 25; circ(c, x, y, 1.4, on ? '#fff6c0' : ['#ff5a9a', '#5ad8ff', '#ffd84a'][i % 3]); if (on) glow(c, x, y, 4, '#fff0a0', 0.5); }
    for (let k = 0; k < 6; k++) { const s = 0.5 + 0.5 * Math.sin(t * 2 + k); twinkle(c, ex - 14 + k * 6, 96 + (k % 2) * 10, 1 + s, '#ffe8a0'); }
  }
  if (r.k === 'candy') {
    // kẹo mút xoáy quay
    along(76, (x, i) => { const lx = x + 2, ly = 58 + (i % 2) * 10; R(c, lx - 0.75, ly, 1.5, 116 - ly, '#ffffff'); circ(c, lx, ly, 11, '#ffffff'); for (let k = 0; k < 4; k++) { c.strokeStyle = ['#ff3a7a', '#3ab8ff', '#ffd84a', '#8a5aff'][(k + i) % 4]; c.lineWidth = 2.2; c.beginPath(); c.arc(lx, ly, 2.5 + k * 2.3, t * 2 + k * 1.4, t * 2 + k * 1.4 + 3.6); c.stroke(); } }, r.x0 + 30, r.x1);
    // vòng đu quay bánh donut
    const fx = SX(r.x0 + 156), fy = 60; c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.beginPath(); c.arc(fx, fy, 22, 0, Math.PI * 2); c.stroke();
    line(c, fx, fy, fx - 14, 116, 1.5, '#ff8ac0'); line(c, fx, fy, fx + 14, 116, 1.5, '#ff8ac0');
    for (let k = 0; k < 8; k++) { const a = t * 0.6 + k / 8 * Math.PI * 2, x = fx + Math.cos(a) * 22, y = fy + Math.sin(a) * 22; line(c, fx, fy, x, y, 0.5, '#ffffff'); circ(c, x, y + 4, 4, ['#ff8ac0', '#c8784a', '#ffe08a', '#8ad8ff'][k % 4]); circ(c, x, y + 4, 1.4, '#ffd0ea'); for (let s = 0; s < 3; s++) R(c, x - 2 + s * 1.6, y + 2 + (s % 2), 0.8, 0.5, '#ffffff'); }
    circ(c, fx, fy, 3, '#ff3a7a'); circ(c, fx, fy, 1.2, '#ffffff');
    // khói kẹo bông từ ống khói
    for (let k = 0; k < 4; k++) { const p = (t * 0.4 + k / 4) % 1, x = SX(r.x0 + 111.5) + Math.sin(p * 6 + k) * 3, y = 42 - p * 30; c.globalAlpha = 1 - p; circ(c, x, y, 3 + p * 4, '#ffd0ec'); c.globalAlpha = 1; }
    // rắc cốm rơi
    for (let k = 0; k < 40; k++) { const x = SX(r.x0 + (k * 37) % RW(r)) + Math.sin(t * 2 + k) * 4, y = (t * 16 + k * 23) % 120; R(c, x, y, 1.5, 0.75, ['#ff3a7a', '#3ab8ff', '#ffd84a', '#8aff8a', '#ffffff'][k % 5]); }
    along(24, (x, i) => doll(c, x, BANK - 4, i, t, 'candy'));
  }
  if (r.k === 'sea') {
    // tia nắng xuyên nước
    for (let k = 0; k < 7; k++) { const rx = SX(r.x0 + k * 36) + Math.sin(t * 0.7 + k) * 8; c.globalAlpha = 0.1 + 0.05 * Math.sin(t + k); poly(c, [rx, 0, rx + 10, 0, rx + 34, 128, rx + 14, 128], '#e0f8ff'); c.globalAlpha = 1; }
    // rong biển đung đưa
    along(19, (x, i) => { const hgt = 22 + (i * 7) % 18; for (let y = 0; y < hgt; y++) { const dx = Math.sin(y / 5 + t * 2 + i) * (y / hgt) * 4; R(c, x + dx, BANK - 6 - y, 1.6, 1, i % 2 ? '#2ac86a' : '#1aa858'); if (y % 6 === 3) ell(c, x + dx + 2, BANK - 6 - y, 2, 0.8, '#3ad87a'); } });
    // đàn cá bơi theo đội hình
    for (let g = 0; g < 4; g++) { const span = RW(r) + 80, gx = r.x0 - 40 + ((t * (12 + g * 4) + g * 90) % span), gy = 30 + g * 18; for (let k = 0; k < 7; k++) { const x = SX(gx - (k % 3) * 7 - Math.floor(k / 3) * 3), y = gy + Math.sin(t * 3 + k) * 1.5 + ((k * 5) % 9) - 4, col = ['#ffd84a', '#ff8a3a', '#5ad8ff', '#ff5a9a'][g]; ell(c, x, y, 2.6, 1.4, col); poly(c, [x - 2.4, y, x - 4.5, y - 1.5, x - 4.5, y + 1.5], col); R(c, x + 1.2, y - 0.6, 0.6, 0.6, '#1a1a2a'); R(c, x - 0.5, y - 1.4, 0.5, 2.8, '#ffffff90'); } }
    // rùa biển
    const tx = SX(r.x0 + ((t * 9) % (RW(r) + 60)) - 30), ty = 76 + Math.sin(t) * 4, fl = Math.sin(t * 3) * 2; ell(c, tx, ty, 7, 4.5, '#3a8a5a'); for (let q = -1; q <= 1; q++) R(c, tx + q * 3 - 1, ty - 2, 2, 2, '#5aaa6a'); circ(c, tx + 8, ty, 2, '#7ab87a'); ell(c, tx + 3, ty + 4 + fl * 0.3, 3, 1.2, '#7ab87a', 0.5); ell(c, tx - 4, ty + 4 - fl * 0.3, 3, 1.2, '#7ab87a', -0.5); R(c, tx + 8.5, ty - 0.6, 0.6, 0.6, '#1a1a2a');
    // sứa phát sáng
    for (let k = 0; k < 5; k++) { const x = SX(r.x0 + 26 + k * 46), y = 28 + Math.sin(t * 1.2 + k) * 8 + (k % 2) * 16, pu = 1 + Math.sin(t * 3 + k) * 0.12; glow(c, x, y, 14, ['#ff8ad8', '#8ad8ff', '#c88aff'][k % 3], 0.5); ell(c, x, y, 5 * pu, 4 / pu, ['#ffb8e8', '#b8e8ff', '#e0c8ff'][k % 3]); R(c, x - 3, y - 1, 2, 1, '#ffffffa0'); for (let j = 0; j < 5; j++) for (let s = 0; s < 9; s++) R(c, x - 4 + j * 2 + Math.sin(t * 3 + j + s / 3) * 0.8, y + 2 + s, 0.5, 1, ['#ffb8e8', '#b8e8ff', '#e0c8ff'][k % 3]); }
    // ngọc trai trong vỏ trai mở đóng
    for (let k = 0; k < 3; k++) { const x = SX(r.x0 + 50 + k * 70), y = 124, op = Math.max(0, Math.sin(t * 1.5 + k * 2)) * 5; ell(c, x, y, 7, 2.5, '#ffd8e8'); c.fillStyle = '#ffc0d8'; c.beginPath(); c.ellipse(x, y - 1, 7, 3 + op * 0.4, 0, Math.PI, 0); c.fill(); circ(c, x, y - 1.5 - op * 0.3, 1.8, '#ffffff'); if (op > 2) glow(c, x, y - 2, 6, '#ffffff', 0.6); }
    // kho báu lấp lánh + bong bóng
    const ch = SX(r.x0 + 150); glow(c, ch, 104, 14, '#ffe06a', 0.4 + 0.2 * Math.sin(t * 4)); if (Math.floor(t * 3) % 2) twinkle(c, ch - 4, 106, 2, '#fff6c0');
    for (let k = 0; k < 26; k++) { const x = SX(r.x0 + (k * 41) % RW(r)) + Math.sin(t * 2 + k) * 2, y = 128 - ((t * 16 + k * 23) % 128); c.strokeStyle = '#ffffffb0'; c.lineWidth = 0.5; c.beginPath(); c.arc(x, y, 0.8 + (k % 3) * 0.7, 0, Math.PI * 2); c.stroke(); R(c, x - 0.5, y - 0.8, 0.5, 0.5, '#ffffff'); }
    along(58, (x, i) => doll(c, x, 115, i, t, 'mermaid'), r.x0 + 20 - 29, r.x1);
  }
  if (r.k === 'forest') {
    // đèn lồng treo cành đung đưa
    for (let k = 0; k < 7; k++) { const ax = SX(r.x0 + 14 + k * 33), sw = Math.sin(t * 1.6 + k) * 0.25, L = 16 + (k % 3) * 8, x = ax + Math.sin(sw) * L, y = 18 + Math.cos(sw) * L; line(c, ax, 18, x, y, 0.4, '#5a4a3a'); glow(c, x, y + 3, 10, '#ffc860', 0.5); R(c, x - 2, y, 4, 6, '#ffb040'); R(c, x - 2.5, y - 0.5, 5, 1, '#7a4a2a'); R(c, x - 2.5, y + 5.5, 5, 1, '#7a4a2a'); R(c, x - 0.5, y + 1, 1, 4, '#fff0a0'); }
    // nấm phát sáng nhấp nháy
    along(26, (x, i) => { const mx = x + 6, my = BANK - 8 - (i % 3) * 2, s = 0.7 + 0.3 * Math.sin(t * 2 + i), big = i % 4 === 0 ? 1.6 : 1, col = ['#ff3a7a', '#3ad8c8', '#c86aff'][i % 3];
      glow(c, mx, my - 5 * big, 14 * big, col, 0.45 * s); R(c, mx - 1.2 * big, my - 4 * big, 2.4 * big, 5 * big, '#fff0d8'); c.fillStyle = col; c.beginPath(); c.arc(mx, my - 4 * big, 5.5 * big, Math.PI, 0); c.fill(); R(c, mx - 5.5 * big, my - 4.5 * big, 11 * big, 1, col);
      for (const [dx, dy] of [[-3, -6], [1, -8], [3, -5], [-1, -5]]) circ(c, mx + dx * big, my + dy * big, 0.8 * big, '#ffffff');
      if (i % 2) { R(c, mx + 6, my - 2, 1.4, 3, '#fff0d8'); half(c, mx + 6.7, my - 2, 2.4, col); } });
    // cú mèo chớp mắt
    for (let k = 0; k < 2; k++) { const x = SX(r.x0 + 48 + k * 124), y = 46, bl = (Math.floor(t * 1.3 + k * 3) % 5) === 0; ell(c, x, y, 4, 5, '#7a5a4a'); ell(c, x, y + 1.5, 2.6, 3, '#c8a888'); poly(c, [x - 4, y - 4, x - 2.5, y - 7, x - 1.5, y - 4], '#7a5a4a'); poly(c, [x + 4, y - 4, x + 2.5, y - 7, x + 1.5, y - 4], '#7a5a4a'); if (bl) { R(c, x - 3, y - 2, 2.4, 0.6, '#2a1a1a'); R(c, x + 0.6, y - 2, 2.4, 0.6, '#2a1a1a'); } else { circ(c, x - 1.8, y - 2, 1.4, '#ffe060'); circ(c, x + 1.8, y - 2, 1.4, '#ffe060'); R(c, x - 2, y - 2.4, 0.6, 0.8, '#1a1a1a'); R(c, x + 1.6, y - 2.4, 0.6, 0.8, '#1a1a1a'); } poly(c, [x - 0.6, y - 0.5, x + 0.6, y - 0.5, x, y + 0.8], '#f6b830'); }
    // đom đóm + phấn tiên
    for (let k = 0; k < 50; k++) { const x = SX(r.x0 + (k * 37) % RW(r)) + Math.sin(t * 0.8 + k) * 6, y = 20 + (k * 53) % 96 + Math.cos(t * 1.1 + k) * 4; if ((Math.floor(t * 3) + k) % 4) { glow(c, x, y, 3.5, k % 5 ? '#d8ff6a' : '#8ad8ff', 0.8); R(c, x - 0.25, y - 0.25, 0.75, 0.75, '#ffffe0'); } }
    // tiên nhỏ bay vòng
    for (let k = 0; k < 3; k++) { const a = t * (0.8 + k * 0.2) + k * 2, x = SX(r.x0 + 60 + k * 60) + Math.cos(a) * 24, y = 60 + Math.sin(a * 1.4) * 14; glow(c, x, y, 8, '#fff6a0', 0.7); circ(c, x, y, 1.2, '#ffffff'); for (let j = 1; j < 8; j++) R(c, x - Math.cos(a) * j * 1.6, y - Math.sin(a * 1.4) * j * 1.2 + j * 0.3, 0.5, 0.5, '#fff6a0'); }
    along(30, (x, i) => doll(c, x, BANK - 6, i, t, 'elf'));
  }
  if (r.k === 'sky') {
    // trăng khuyết + thiên thần ngồi xích đu
    const mx = SX(r.x0 + 100); glow(c, mx, 34, 36, '#fff6c0', 0.45); circ(c, mx, 34, 16, '#fff6c0'); circ(c, mx + 7, 29, 14, '#120e3a'); circ(c, mx - 9, 36, 1.6, '#f0e0a0'); circ(c, mx - 6, 43, 1.1, '#f0e0a0');
    const sw = Math.sin(t * 1.5) * 0.35, sx = mx - 6 + Math.sin(sw) * 28, sy = 46 + Math.cos(sw) * 28;
    line(c, mx - 9, 46, sx - 3, sy, 0.4, '#fff6c0'); line(c, mx - 3, 46, sx + 3, sy, 0.4, '#fff6c0'); R(c, sx - 4, sy, 8, 1, '#f6c445'); doll(c, sx, sy + 1, 3, t, 'angel');
    // sao treo dây vàng từ trần
    for (let k = 0; k < 9; k++) { const ax = SX(r.x0 + 12 + k * 26), L = 18 + (k * 13) % 30, sw2 = Math.sin(t + k) * 0.12, x = ax + Math.sin(sw2) * L, y = 14 + Math.cos(sw2) * L, s = 0.5 + 0.5 * Math.sin(t * 3 + k * 1.7); line(c, ax, 14, x, y, 0.3, '#f6c44590'); glow(c, x, y, 8, '#fff6a0', 0.3 + 0.3 * s); star(c, x, y, 3.2, '#ffd84a', Math.sin(t + k) * 0.3); star(c, x, y, 1.8, '#fff6c0', Math.sin(t + k) * 0.3); }
    // sao lấp lánh + sao băng
    for (let k = 0; k < 30; k++) { const x = SX(r.x0 + (k * 29) % RW(r)), y = 18 + (k * 47) % 80; if ((Math.floor(t * 2.5) + k) % 5 === 0) twinkle(c, x, y, 2.5, '#ffffff'); }
    for (let q = 0; q < 2; q++) { const p = (t * 0.35 + q * 0.5) % 1; if (p < 0.4) { const sx2 = SX(r.x0 + 30 + q * 110) + p * 160, sy2 = 10 + p * 70 + q * 10; for (let j = 0; j < 14; j++) { c.globalAlpha = 1 - j / 14; R(c, sx2 - j * 2, sy2 - j * 0.9, 1.5, 0.75, '#fff6c0'); } c.globalAlpha = 1; glow(c, sx2, sy2, 5, '#ffffff', 0.8); } }
    // cửa sổ lâu đài mây lấp lánh
    for (let k = 0; k < 5; k++) if ((Math.floor(t * 2) + k) % 3) glow(c, SX(r.x0 + 130 + k * 12), 60 + (k % 3) * 12, 5, '#ffe880', 0.5);
    along(30, (x, i) => doll(c, x, BANK - 8 + Math.sin(t + i) * 1.5, i, t, 'angel'));
  }
  if (r.k === 'ball') {
    // đèn chùm pha lê, nến lung linh
    for (let k = 0; k < 5; k++) {
      const x = SX(r.x0 + 22 + k * 48), cy = 26 + (k % 2) * 6, fl = 0.75 + 0.25 * Math.sin(t * 9 + k * 3);
      R(c, x - 0.25, 0, 0.5, cy - 4, '#f6c445'); glow(c, x, cy + 4, 30, '#fff0a0', 0.45 * fl);
      ell(c, x, cy + 6, 12, 3, '#f6c445'); ell(c, x, cy + 5, 10, 2, '#ffe080'); R(c, x - 1.5, cy - 4, 3, 10, '#f6c445'); ell(c, x, cy - 4, 4, 1.5, '#f6c445');
      for (let j = 0; j < 9; j++) { const a = (j / 8) * Math.PI, px = x + Math.cos(a) * 11, py = cy + 6 + Math.sin(a) * 2.5; R(c, px - 0.5, py - 4, 1, 3, '#fffbe8'); ell(c, px, py - 5, 0.6, 1 * fl + 0.3, '#ffcc40'); R(c, px - 0.25, py + 1, 0.5, 3, '#c8f4ff'); circ(c, px, py + 4.5, 0.7, (Math.floor(t * 4) + j) % 3 ? '#e0f8ff' : '#ffffff'); }
      for (let j = 0; j < 5; j++) R(c, x - 6 + j * 3, cy + 9, 0.5, 4 + (j % 2) * 3, '#c8f4ff');
      if (Math.floor(t * 3 + k) % 3 === 0) twinkle(c, x + 6, cy + 12, 2, '#ffffff');
    }
    // hoa giấy rơi
    for (let k = 0; k < 40; k++) { const x = SX(r.x0 + (k * 31) % RW(r)) + Math.sin(t * 2 + k) * 4, y = (t * 18 + k * 19) % 116; const spin = Math.abs(Math.sin(t * 4 + k)); R(c, x, y, 2 * spin + 0.3, 1.2, ['#ff5a9a', '#ffd84a', '#5ad8ff', '#ffffff', '#c88aff'][k % 5]); }
    // các cặp khiêu vũ xoay vòng + công chúa trên cầu thang
    along(30, (x, i) => { const a = t * 2 + i, ox = Math.cos(a) * 3; doll(c, x + ox, BANK - 6, i, t, 'waltz'); doll(c, x - ox + (Math.sin(a) > 0 ? 3 : -3), BANK - 6, i + 3, t, 'dress'); if (Math.sin(a) > 0.9) heart(c, x, BANK - 26, 1.6, '#ff5a8a'); });
    const sx = SX(r.x0 + 120); doll(c, sx - 4, 66, 2, t * 0.6, 'dress'); doll(c, sx + 4, 66, 5, t * 0.6, 'waltz');
  }
  if (r.k === 'rainbow') {
    // tia nắng quay
    const cx = SX(r.x0 + 130); c.globalAlpha = 0.16; for (let k = 0; k < 12; k++) { const a = t * 0.15 + k / 12 * Math.PI * 2; poly(c, [cx, 30, cx + Math.cos(a) * 260, 30 + Math.sin(a) * 260, cx + Math.cos(a + 0.12) * 260, 30 + Math.sin(a + 0.12) * 260], '#fffbe0'); } c.globalAlpha = 1;
    // bóng bay tim bay lên
    for (let k = 0; k < 10; k++) { const x = SX(r.x0 + 16 + k * 26) + Math.sin(t + k) * 3, y = 110 - ((t * 8 + k * 21) % 120), col = ['#ff3a6a', '#ff8ab0', '#ffd84a', '#b88aff', '#5ad8ff'][k % 5]; line(c, x, y + 5, x + Math.sin(t * 2 + k) * 2, y + 16, 0.4, '#ffffffc0'); heart(c, x, y, 4, col); R(c, x - 2.5, y - 1, 1.2, 1.2, '#ffffffb0'); }
    // bướm
    for (let k = 0; k < 6; k++) { const x = SX(r.x0 + 30 + k * 40) + Math.sin(t * 0.9 + k) * 18, y = 96 + Math.sin(t * 1.7 + k) * 8, f = Math.abs(Math.sin(t * 10 + k)); const col = ['#ff8ad8', '#ffd84a', '#8ad8ff'][k % 3]; ell(c, x - 1.6 * f - 0.4, y, 1.6 * f + 0.3, 2, col); ell(c, x + 1.6 * f + 0.4, y, 1.6 * f + 0.3, 2, col); R(c, x - 0.25, y - 1.5, 0.5, 3, '#3a2a3a'); }
    // pháo hoa nhỏ trên lâu đài xa
    for (let q = 0; q < 3; q++) { const p = (t * 0.5 + q / 3) % 1; if (p < 0.6) { const fx = SX(r.x0 + 70 + q * 60), fy = 34 + q * 8, rr = p * 18; c.globalAlpha = 1 - p / 0.6; for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2; circ(c, fx + Math.cos(a) * rr, fy + Math.sin(a) * rr + p * p * 6, 0.9, ['#ff5a9a', '#ffd84a', '#5ad8ff'][(j + q) % 3]); } c.globalAlpha = 1; } }
    // cánh hoa rơi
    for (let k = 0; k < 30; k++) { const x = SX(r.x0 + (k * 23) % RW(r)) + Math.sin(t * 1.5 + k) * 6, y = (t * 14 + k * 17) % 120; ell(c, x, y, 1.4, 0.8, k % 2 ? '#ffb8d0' : '#ffffff', t + k); }
    along(22, (x, i) => doll(c, x, BANK - 6, i, t, i % 3 === 0 ? 'waltz' : i % 3 === 1 ? 'dress' : 'candy'));
  }
}

/** Màn rèm trên trần hầm: vải xếp nếp màu theo phòng, viền vàng, tua rua */
const DRAPE: Record<RoomK, [string, string]> = { gate: ['', ''], candy: ['#ff6aa8', '#ff9ac8'], sea: ['#1a5a9a', '#2a7ab8'], forest: ['#2a4a3a', '#3a6a4a'], sky: ['#2a1a6a', '#4a3a9a'], ball: ['#b8203a', '#d83a54'], rainbow: ['#ff8ab0', '#ffb8d0'] };
function valance(c: Ctx, camX: number) {
  for (let wx = Math.floor(camX / 24) * 24; wx < camX + W + 24; wx += 24) {
    const rm = roomAt(wx + 12); if (rm.k === 'gate') continue;
    const x = wx - camX, [a, b] = DRAPE[rm.k];
    R(c, x, 0, 24, 5, a); c.fillStyle = a; c.beginPath(); c.moveTo(x, 5); c.quadraticCurveTo(x + 12, 20, x + 24, 5); c.fill();
    c.fillStyle = b; c.beginPath(); c.moveTo(x + 4, 5); c.quadraticCurveTo(x + 12, 14, x + 20, 5); c.fill();
    c.strokeStyle = '#f6c445'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 5.5); c.quadraticCurveTo(x + 12, 20.5, x + 24, 5.5); c.stroke();
    R(c, x, 0, 24, 2, '#f6c445'); R(c, x + 11.5, 12.5, 1, 4, '#f6c445'); circ(c, x + 12, 17, 1.4, '#f6c445'); R(c, x - 0.5, 4, 1, 6, '#f6c445'); circ(c, x, 10, 1.2, '#f6c445');
  }
}

export function BoatRide({ at: t0, me, them, onExit }: { at: number; me: AvatarLook; them: AvatarLook | null; onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [line, setLine] = useState('');
  const [photo, setPhoto] = useState('');
  const [done, setDone] = useState(false);
  const pics = useMemo(() => [me, ...(them ? [them] : [])].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)).map(l => ({ sit: img(characterSprite(l, 'sit').url), up: img(characterSprite(l, 'actsit', undefined, 'front', 12).url) })),
    [JSON.stringify(me), JSON.stringify(them)]); // eslint-disable-line react-hooks/exhaustive-deps
  const exitRef = useRef(onExit); exitRef.current = onExit;
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!;
    let raf = 0, last = '', snapped = false, ended = false;
    const frame = () => {
      const ms = Date.now() - t0, t = ms / 1000, mv = Math.max(0, ms - BOAT_WAIT) / 1000;
      const bx = Math.min(LEN - 20, 10 + mv * SPEED), camX = bx - BX, SX = (x: number) => x - camX;
      ctx.setTransform(Z, 0, 0, Z, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#1a1030'; ctx.fillRect(0, 0, W, HH);
      for (const r of ROOMS) {
        const x0 = SX(r.x0), x1 = SX(r.x1); if (x1 < 0 || x0 > W) continue;
        ctx.save(); ctx.beginPath(); ctx.rect(Math.max(0, x0), 0, Math.min(W, x1) - Math.max(0, x0), WATER); ctx.clip();
        const [a, b, d] = BG[r.k], g = ctx.createLinearGradient(0, 0, 0, WATER); g.addColorStop(0, a); g.addColorStop(0.55, b); g.addColorStop(1, d); ctx.fillStyle = g; ctx.fillRect(0, 0, W, WATER);
        const p = PAR[r.k], E = (RW(r) + W) * (1 - p), off = (camX - (r.x0 - W)) * (1 - p);
        ctx.drawImage(far(r), x0 + off - E, 0, farW(r), 140);
        ctx.drawImage(mid(r), x0, 0, RW(r), 140);
        live(ctx, r, SX, t);
        ctx.restore();
      }
      // vòm cổng giữa các hầm: cột vàng có bóng đèn chạy
      for (const r of ROOMS.slice(1)) {
        const x = SX(r.x0); if (x < -40 || x > W + 40) continue;
        R(ctx, x - 7, 0, 14, WATER, '#2a1838'); R(ctx, x - 8, 0, 3, WATER, '#f6c445'); R(ctx, x + 5, 0, 3, WATER, '#f6c445'); R(ctx, x - 7.5, 0, 1, WATER, '#ffe080'); R(ctx, x + 5.5, 0, 1, WATER, '#ffe080');
        for (let y = 20; y < WATER; y += 22) { R(ctx, x - 9, y, 18, 2, '#f6c445'); star(ctx, x, y + 9, 3, '#ffd84a'); }
        for (let y = 6; y < WATER - 2; y += 6) { const on = (Math.floor(t * 5) + y / 6) % 3 === 0; circ(ctx, x - 6.5, y, 1.2, on ? '#ffffff' : '#ffc84a'); circ(ctx, x + 6.5, y, 1.2, on ? '#ffffff' : '#ffc84a'); if (on) { glow(ctx, x - 6.5, y, 5, '#fff0a0', 0.6); glow(ctx, x + 6.5, y, 5, '#fff0a0', 0.6); } }
      }
      valance(ctx, camX);
      // mặt nước: màu theo phòng + soi bóng cả cảnh (gợn sóng)
      const rm = roomAt(bx), WC: Record<RoomK, [string, string]> = { gate: ['#5ab8f0', '#2a78c8'], candy: ['#ff9ac8', '#c85a9a'], sea: ['#1a6ac8', '#0a3a8a'], forest: ['#1a5a5a', '#0a2a3a'], sky: ['#2a2a7a', '#0a0a3a'], ball: ['#c86a9a', '#6a2a5a'], rainbow: ['#6ac8f0', '#3a88d0'] };
      const wc = WC[rm.k], wg = ctx.createLinearGradient(0, WATER, 0, HH); wg.addColorStop(0, wc[0]); wg.addColorStop(1, wc[1]); ctx.fillStyle = wg; ctx.fillRect(0, WATER, W, HH - WATER);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.42;
      for (let j = 0; j < (HH - WATER) * Z; j += Z) { const dx = Math.sin(j / Z / 2.5 + t * 3) * Z * (0.6 + j / ((HH - WATER) * Z) * 1.6); ctx.drawImage(c, 0, WATER * Z - 1 - j * 1.4, W * Z, Z, dx, WATER * Z + j, W * Z, Z); }
      ctx.restore();
      R(ctx, 0, WATER, W, 1, '#ffffff90');
      for (let k = 0; k < 44; k++) { const x = ((k * 53 - camX + Math.sin(t + k) * 3) % (W + 20) + W + 20) % (W + 20) - 10, y = WATER + 3 + (k * 17) % 44; R(ctx, x, y, 3 + (k % 4) * 2, 0.5, '#ffffff70'); }
      for (let k = 0; k < 18; k++) { const x = ((k * 47 - camX) % W + W) % W; if ((Math.floor(t * 4) + k) % 3 === 0) twinkle(ctx, x, WATER + 6 + (k % 6) * 6, 1.5, '#fff6c0'); }
      // thuyền thiên nga vàng + hai người ngồi
      const by = 148 + Math.sin(t * 1.8) * 1.2, wave = Math.floor(t / 5) % 3 === 0 && (t % 5) < 1.6;
      ctx.globalAlpha = 0.3; ell(ctx, BX, by + 4, 34, 3, '#000020'); ctx.globalAlpha = 1;
      // cổ thiên nga ở mũi thuyền
      for (let i = 0; i < 16; i++) { const a = i / 15, x = BX + 26 + Math.sin(a * 2.4) * 6 - a * 2, y = by - 6 - a * 20; circ(ctx, x, y, 2.6 - a * 0.8, '#ffffff'); }
      circ(ctx, BX + 28, by - 27, 3, '#ffffff'); poly(ctx, [BX + 30, by - 28, BX + 35, by - 26.5, BX + 30, by - 25.5], '#ff9a3a'); R(ctx, BX + 28.5, by - 28.5, 0.8, 0.8, '#1a1a2a'); circ(ctx, BX + 27, by - 31, 1.4, '#f6c445');
      // đuôi cánh cong ở đuôi thuyền
      for (let i = 0; i < 8; i++) ell(ctx, BX - 26 - i * 0.6, by - 8 - i * 2.2, 5 - i * 0.4, 1.6, i % 2 ? '#fff6e0' : '#ffffff', -0.6);
      pics.forEach((pc, k) => { const im = wave && k === 0 ? pc.up : pc.sit; if (!im.complete || !im.height) return; const h = im.height / Z, w = im.width / Z; ctx.drawImage(im, BX + (k ? -10 : 6) - w / 2, by - 6 - h, w, h); });
      // thân thuyền: vàng, cánh thiên nga ốp hai bên, đèn nhỏ
      poly(ctx, [BX - 30, by - 9, BX + 30, by - 9, BX + 26, by + 3, BX - 26, by + 3], '#ffffff');
      for (let k = 0; k < 7; k++) ell(ctx, BX - 16 + k * 5, by - 4 + Math.abs(k - 3) * 0.3, 4, 2.4, k % 2 ? '#fff6e8' : '#f4ecf8', -0.25);
      R(ctx, BX - 30, by - 10, 60, 2, '#f6c445'); R(ctx, BX - 26, by + 2, 52, 1.5, '#c8902a');
      for (let x = -24; x <= 24; x += 6) { const on = (Math.floor(t * 4) + x / 6) % 2; circ(ctx, BX + x, by - 9, 1.2, on ? '#fff6c0' : ['#ff5a9a', '#5ad8ff', '#ffd84a'][Math.abs(x / 6) % 3]); if (on) glow(ctx, BX + x, by - 9, 4, '#fff0a0', 0.5); }
      R(ctx, BX - 34, by + 3, 68, 0.75, '#ffffffa0');
      for (let k = 0; k < 4; k++) { const p = (t * 0.8 + k / 4) % 1; ctx.globalAlpha = 1 - p; R(ctx, BX - 30 - p * 30, by + 3 + k % 2, 6, 0.6, '#ffffff'); ctx.globalAlpha = 1; }
      // đồ trôi trên mặt nước phía trước (trôi nhanh hơn — gần mắt)
      const near = (step: number, f: (x: number, k: number) => void) => { for (let k = 0; k < 8; k++) { const x = ((k * step - camX * 1.3) % (W + 60) + W + 60) % (W + 60) - 30; f(x, k); } };
      if (rm.k === 'candy') near(53, (x, k) => { ell(ctx, x, 170 + (k % 3) * 3, 6, 2, ['#ff8ac0', '#c8784a', '#ffe08a'][k % 3]); ell(ctx, x, 170 + (k % 3) * 3, 2, 0.7, wc[0]); });
      if (rm.k === 'forest' || rm.k === 'gate') near(57, (x, k) => { const y = 168 + (k % 3) * 4; ell(ctx, x, y, 6, 2, '#3aa860'); poly(ctx, [x, y, x + 6, y - 1, x + 6, y + 1], wc[0]); if (k % 2) { glow(ctx, x - 1, y - 2, 6, '#ff8ad8', 0.5); for (let j = 0; j < 5; j++) ell(ctx, x - 1 + Math.cos(j * 1.25) * 1.6, y - 2, 1.4, 0.8, '#ffb8e0', j * 1.25); circ(ctx, x - 1, y - 2.2, 0.8, '#ffe06a'); } });
      if (rm.k === 'ball' || rm.k === 'rainbow') near(41, (x, k) => ell(ctx, x, 166 + (k % 4) * 3, 1.6, 0.9, ['#ff3a6a', '#ff8ab0', '#ffffff'][k % 3], k));
      if (rm.k === 'sky') near(37, (x, k) => { if ((Math.floor(t * 3) + k) % 2) star(ctx, x, 166 + (k % 4) * 3, 1.6, '#fff6c0'); });
      if (rm.k === 'sea') near(31, (x, k) => { ctx.strokeStyle = '#ffffffb0'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(x, 176 - ((t * 10 + k * 7) % 20), 1 + k % 2, 0, Math.PI * 2); ctx.stroke(); });
      // tên phòng
      const ln = ms < BOAT_WAIT ? `🛶 Ngồi vững nhé… ${Math.ceil((BOAT_WAIT - ms) / 1000)}` : rm.name;
      if (ln !== last) { last = ln; setLine(ln); }
      if (!snapped && rm.k === 'ball' && bx > rm.x0 + 110) {
        snapped = true; const ph = document.createElement('canvas'); ph.width = 512; ph.height = 288; const pc2 = ph.getContext('2d')!; pc2.imageSmoothingEnabled = false;
        pc2.drawImage(c, (BX - 72) * Z, 72 * Z, 144 * Z, 81 * Z, 0, 0, 512, 288); setPhoto(ph.toDataURL('image/png'));
      }
      if (!ended && ms > BOAT_MS + 600) { ended = true; setDone(true); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [t0, pics]);
  useEffect(() => { if (!done) return; const t = setTimeout(() => exitRef.current(), 15000); return () => clearTimeout(t); }, [done]);
  return createPortal(
    <div className="coaster">
      <canvas ref={cv} width={W * Z} height={HH * Z} />
      {!done && line && <b className="coaster-line">{line}</b>}
      {done && (
        <div className="coaster-end">
          <h3>🛶 Ảnh trên thuyền cổ tích</h3>
          {photo && <img src={photo} alt="Ảnh thuyền cổ tích" />}
          <div className="row">
            {photo && <a className="btn small ghost" href={photo} download="thuyen-co-tich.png">💾 Lưu ảnh</a>}
            <button className="btn small" onClick={() => exitRef.current()}>🚶 Lên bờ</button>
          </div>
        </div>
      )}
      {!done && <button className="coaster-x btn small ghost" onClick={() => { if (confirm('Lên bờ giữa chừng?')) exitRef.current(); }}>✖</button>}
    </div>,
    document.body,
  );
}
