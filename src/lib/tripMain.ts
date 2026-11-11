// Phố chính của 8 điểm đến: vẽ pixel chi tiết theo đặc trưng từng thành phố, xe cộ chạy, hiệu ứng động.
import type { Phase, WeatherType } from './content';
import { seeded } from './rng';
import type { Weather } from './weather';
import { mix, type Pen } from './pixel';
import { band, bldg, dither, eiffel, hoianHouse, roofEA, venHouse, vsign, circle, paint, pine, rail, ridge, sky, speckle, string, tiles, tree, water, type Fx, type Light } from './tripSpots';
import type { TripId } from './trips';
import { drawFairyMain } from './fairyArt';

interface MainDef { draw: (p: Pen, L: Light) => void; fx: Fx[]; lines: string[]; night?: boolean }

/** Đường nhựa có vạch, vỉa hè lát gạch (dùng cho phố có xe chạy) */
function street(p: Pen, y0: number, road: number) {
  tiles(p, y0, road, '#d0c4b0', '#c0b4a0', 8);
  p.rect(0, road, 256, 2, '#8a8478');
  band(p, road + 2, road + 26, '#5a5a62', '#4a4a52');
  for (let x = 4; x < 256; x += 20) p.rect(x, road + 13, 10, 1, '#f0e8c0');
  p.rect(0, road + 26, 256, 2, '#8a8478');
  tiles(p, road + 28, 192, '#d8ccb8', '#c8bca8', 10);
}
function palm(p: Pen, x: number, y: number) {
  for (let k = 0; k < 26; k++) p.rect(x + Math.round(Math.sin(k / 9) * 2), y - k, 2, 1, k % 3 ? '#8a6a4a' : '#6a4a32');
  for (let a = 0; a < 7; a++) { const ang = a / 7 * Math.PI * 2; for (let d = 0; d < 9; d++) p.px(x + 1 + Math.round(Math.cos(ang) * d), y - 26 + Math.round(Math.sin(ang) * d * 0.5 + d * d * 0.05), a % 2 ? '#3a8a3a' : '#4aa84a'); }
}
function awning(p: Pen, x: number, y: number, w: number, a: string, b = '#ffffff') { for (let k = 0; k < w; k += 4) { p.rect(x + k, y, 4, 6, (k / 4) % 2 ? a : b); p.rect(x + k + 1, y + 6, 2, 1, (k / 4) % 2 ? a : b); } }

const MAIN: Record<TripId, MainDef> = {
  taichung: {
    draw: (p, L) => {
      sky(p, L, ['#6ac0f0', '#d8f4ff'], 70, 210);
      // Nhà hát Opera Đài Trung (khối trắng có lỗ cong) ở xa
      p.rect(150, 26, 70, 44, '#eceef0'); for (let k = 0; k < 5; k++) { circle(p, 160 + k * 13, 46, 4, '#9ab0c8'); p.rect(156 + k * 13, 46, 9, 24, '#9ab0c8'); }
      for (let i = 0; i < 6; i++) bldg(p, L, i * 24, 70, 22, 22 + (i * 13) % 20, '#b0b8c8', undefined, '#8ab0d0', 5);
      for (let i = 0; i < 2; i++) bldg(p, L, 224 + i * 16, 70, 15, 30, '#a8b0c0', undefined, '#8ab0d0', 5);
      // Miyahara: toà gạch đỏ thời Nhật, vòm cửa, chữ vàng
      p.rect(8, 44, 96, 56, '#a8483a'); for (let y = 46; y < 100; y += 3) for (let x = 8 + (y % 6 ? 0 : 2); x < 104; x += 5) p.rect(x, y, 4, 1, '#b85a48');
      p.rect(6, 40, 100, 4, '#e8dcc0'); p.rect(30, 34, 52, 6, '#e8dcc0'); L.neon.push({ x: 36, y: 35, w: 40, h: 4, c: '#ffd86a' });
      for (let k = 0; k < 5; k++) { const x = 14 + k * 18; circle(p, x + 6, 64, 6, '#3a2a28'); p.rect(x, 64, 13, 16, '#3a2a28'); p.rect(x + 1, 66, 11, 12, '#f0c878'); L.wins.push([x + 1, 66, 11, 12]); p.rect(x, 84, 13, 16, '#5a3a2a'); p.rect(x + 2, 86, 9, 12, '#e8c070'); }
      // dãy quán trà sữa, biển dọc
      for (let i = 0; i < 4; i++) {
        const x = 112 + i * 36, c = ['#f6c445', '#e8443a', '#4aa8a0', '#f59ab3'][i];
        p.rect(x, 62, 34, 38, ['#fff4e0', '#f0f0f0', '#ffe8d0', '#f8f0ff'][i]); awning(p, x, 70, 34, c);
        p.rect(x + 3, 80, 28, 14, '#5a4a3a'); p.rect(x + 4, 81, 26, 12, '#ffe8b0'); L.wins.push([x + 4, 81, 26, 12]);
        for (let k = 0; k < 4; k++) { p.rect(x + 6 + k * 6, 86, 3, 5, '#d8a060'); p.px(x + 7 + k * 6, 85, '#3a2a2a'); }
        vsign(L, p, x + 27, 38 + (i % 2) * 6, 22, ['#ff4a6a', '#4af0ff', '#ffe04a', '#8aff6a'][i]);
      }
      string(p, L, 104, 256, 60, 5, ['#e8443a', '#ffb040'], 9);
      for (let i = 0; i < 4; i++) palm(p, 108 + i * 40, 100);
      street(p, 100, 132);
      // xe máy dựng vỉa hè
      for (let i = 0; i < 6; i++) { const x = 20 + i * 14; p.rect(x, 124, 10, 3, ['#e8443a', '#3a6ad0', '#f0f0f0', '#3a3a3a'][i % 4]); circle(p, x + 1, 128, 2, '#2a2a2a'); circle(p, x + 9, 128, 2, '#2a2a2a'); }
      for (let x = 30; x < 256; x += 60) { p.rect(x, 104, 2, 26, '#4a4a5a'); p.rect(x - 4, 102, 10, 2, '#4a4a5a'); L.lamps.push({ x: x - 5, y: 103, c: '#fff0b0' }); }
    },
    fx: [{ k: 'move', spr: 'scooter', x: -20, y: 146, dx: 300, dur: 9, loop: true }, { k: 'move', spr: 'scooter', x: 270, y: 156, dx: -300, dur: 11, loop: true }, { k: 'move', spr: 'bus', x: -60, y: 152, dx: 380, dur: 18, loop: true }, { k: 'sway', x: 140, y: 64, c: '#e8443a' }, { k: 'sway', x: 200, y: 64, c: '#ffb040' }, { k: 'steam', x: 128, y: 80, n: 2 }, { k: 'bird', x: 40, y: 20, icon: '🕊️', n: 2 }, { k: 'glow', x: 160, y: 80, r: 100, c: '#ffb04a', night: true }],
    lines: ['Đi Miyahara ăn kem không?', 'Trà sữa chỗ này gốc nè 🧋', 'Xe máy nhiều ghê', 'Ni hao!', 'Tối đi chợ đêm nha'],
  },
  gwangju: {
    draw: (p, L) => {
      sky(p, L, ['#80b8e8', '#f0e8d8'], 80, 60);
      ridge(p, 76, 40, 34, '#9a6a6a', 0.3); speckle(p, L, 0, 44, 256, 32, 180, ['#e8743a', '#d8402a', '#f6a83a']);
      // Trung tâm Văn hoá châu Á: khối kính thấp + mái cỏ
      p.rect(140, 64, 110, 36, '#7a9ab0'); for (let x = 142; x < 250; x += 8) { p.rect(x, 66, 6, 30, '#9ac0d8'); L.wins.push([x, 66, 6, 30]); } p.rect(138, 60, 114, 4, '#5a8a4a');
      // cổng hanok + toà hiện đại có biển Hàn
      for (let i = 0; i < 4; i++) bldg(p, L, i * 32, 100, 31, 40 + (i * 17) % 22, ['#e8d8d0', '#d0d8e0', '#f0e0c8', '#d8d0d8'][i], undefined, '#90b8d8', 6);
      for (let i = 0; i < 4; i++) vsign(L, p, 22 + i * 32, 58 + (i % 2) * 6, 22, ['#ff4a8a', '#4ae0ff', '#ffe04a', '#8aff6a'][i]);
      roofEA(p, 136, 58, 120, 6, '#4a5a4a', 0.2);
      // cửa hàng tiện lợi
      p.rect(4, 84, 60, 16, '#f0f0f0'); p.rect(4, 82, 60, 3, '#3a9a5a'); p.rect(8, 88, 52, 10, '#c8e8f0'); L.wins.push([8, 88, 52, 10]);
      // hàng phong đỏ hai bên đường
      street(p, 100, 132);
      for (let i = 0; i < 8; i++) tree(p, 10 + i * 34, 126, 9, ['#e8443a', '#f6a83a', '#d8502a', '#ffb84a'][i % 4], '#5a3a2a');
      speckle(p, L, 0, 100, 256, 30, 120, ['#e8743a', '#f0c050', '#c83a2a']);
      speckle(p, L, 0, 162, 256, 30, 80, ['#e8743a', '#d8402a']);
      // trạm xe buýt
      p.rect(210, 150, 30, 2, '#3a6ad0'); p.rect(212, 152, 2, 14, '#5a5a6a'); p.rect(236, 152, 2, 14, '#5a5a6a'); p.rect(216, 160, 18, 2, '#8a6a4a');
      for (let x = 20; x < 256; x += 70) L.lamps.push({ x, y: 104, c: '#fff0b0' });
    },
    fx: [{ k: 'fall', n: 26, c: ['#e8443a', '#f6a83a', '#d8502a', '#ffc04a'], size: 2 }, { k: 'move', spr: 'bus', x: 280, y: 150, dx: -380, dur: 16, loop: true }, { k: 'move', spr: 'car', x: -30, y: 158, dx: 320, dur: 8, loop: true }, { k: 'sparkle', x: 0, y: 60, w: 140, h: 40, n: 8, night: true }],
    lines: ['Lá phong rụng đẹp quá', 'Annyeong!', 'Đi bảo tàng không?', 'Lạnh rồi, uống trà gừng đi', 'Tối ăn gà nướng nha'],
  },
  hoian: {
    draw: (p, L) => {
      sky(p, L, ['#f6b06a', '#ffe0a8'], 50, 200);
      for (let i = 0; i < 6; i++) {
        hoianHouse(p, L, 2 + i * 43, 100, 41, 50);
      }
      string(p, L, 0, 256, 40, 6, ['#e8443a', '#f6c445', '#f59ab3', '#3aa86a', '#9a6ae0'], 7);
      string(p, L, 0, 256, 56, 4, ['#f6c445', '#e8443a'], 11);
      tiles(p, 100, 152, '#c8a878', '#b89060', 9);
      // lề sông Hoài + thuyền
      water(p, L, 152, 192, '#3a7a7a', '#2a5a6a'); p.rect(0, 150, 256, 3, '#7a5a3a');
      for (let x = 12; x < 256; x += 40) p.rect(x, 146, 3, 8, '#5a3a2a');
      // gánh hàng rong + nón lá
      p.rect(60, 120, 1, 14, '#8a6a4a'); p.rect(50, 120, 22, 1, '#8a6a4a'); circle(p, 50, 130, 4, '#c8a060'); circle(p, 72, 130, 4, '#c8a060');
      for (let k = 0; k < 9; k++) p.rect(57 - k / 2, 112 + k, 8 + k, 1, '#e8d8a0');
    },
    fx: [{ k: 'sway', x: 20, y: 76, c: '#e8443a', big: true }, { k: 'sway', x: 64, y: 76, c: '#f6c445', big: true }, { k: 'sway', x: 108, y: 76, c: '#f59ab3', big: true }, { k: 'sway', x: 150, y: 76, c: '#e8443a', big: true }, { k: 'sway', x: 194, y: 76, c: '#3aa86a', big: true }, { k: 'sway', x: 236, y: 76, c: '#f6c445', big: true }, { k: 'shim', x: 0, y: 154, w: 256, h: 36, n: 20, c: '#ffe0a0' }, { k: 'move', spr: 'sampan', x: 20, y: 178, dx: 200, dur: 26 }, { k: 'move', spr: 'cyclo', x: 280, y: 140, dx: -320, dur: 20, loop: true }, { k: 'glow', x: 128, y: 50, r: 120, c: '#ffa040', night: true }],
    lines: ['Đèn lồng đẹp quá', 'Ăn cao lầu chưa?', 'Đi xích lô không?', 'Hoa giấy hồng rực luôn', 'Tối thả hoa đăng nha'],
  },
  tokyo: {
    draw: (p, L) => {
      sky(p, L, ['#9ad0f8', '#ffe8f0'], 60, 220);
      // tháp Tokyo xa
      for (let y = 4; y < 60; y++) { const w = 1 + (y - 4) / 5; p.rect(60 - w, y, 2, 1, y % 8 < 4 ? '#e8443a' : '#ffffff'); p.rect(59 + w, y, 2, 1, y % 8 < 4 ? '#e8443a' : '#ffffff'); }
      p.rect(54, 30, 14, 3, '#e8443a'); if (L.night) L.lamps.push({ x: 59, y: 2, c: '#ffb060' });
      for (let i = 0; i < 10; i++) bldg(p, L, i * 26, 60, 25, 18 + (i * 11) % 18, '#b8c0d0', undefined, '#90b0d0', 5);
      // đường ray trên cao
      p.rect(0, 58, 256, 4, '#8a8a90'); for (let x = 10; x < 256; x += 50) p.rect(x, 62, 4, 10, '#7a7a80');
      // dãy shotengai: biển dọc, rèm noren, máy bán nước
      for (let i = 0; i < 7; i++) {
        const x = i * 37, wall = ['#e8dcc8', '#f0e8e0', '#d8d0c8', '#e8e0d0'][i % 4];
        p.rect(x, 64, 36, 36, wall); dither(p, x + 30, 64, 6, 36, wall, mix(wall, '#2a1a2a', 0.15)); roofEA(p, x - 1, 62, 38, 4, '#4a3a4a', 0.2);
        vsign(L, p, x + 29, 68, 18, ['#ff4a6a', '#ffe04a', '#4af0ff', '#ff8a3a'][i % 4]);
        for (let k = 0; k < 4; k++) p.rect(x + 3 + k * 6, 84, 5, 10, ['#3a3a6a', '#c83a2a', '#3a6a5a'][i % 3]);
        p.rect(x + 3, 94, 24, 6, '#ffe8b0'); L.wins.push([x + 3, 72, 24, 9]); p.rect(x + 3, 72, 24, 9, '#a0c0d8');
      }
      for (let i = 0; i < 3; i++) { const x = 60 + i * 74; p.rect(x, 86, 9, 14, ['#e8443a', '#3a8ad0', '#f0f0f0'][i]); for (let k = 0; k < 6; k++) p.px(x + 2 + (k % 3) * 2, 89 + Math.floor(k / 3) * 3, '#ffe060'); L.neon.push({ x: x + 1, y: 88, w: 7, h: 2, c: '#ffffff' }); }
      tiles(p, 100, 192, '#d8d0c0', '#c8c0b0', 12);
      for (let i = 0; i < 4; i++) { const x = 30 + i * 66; p.rect(x - 1, 100, 3, 22, '#5a3a2a'); for (let k = 0; k < 5; k++) circle(p, x - 10 + k * 5, 94 - (k % 2) * 4, 6, ['#f8b8cc', '#ffd0dc', '#f6a8c0', '#ffe0e8', '#f8c0d0'][k]); }
      speckle(p, L, 0, 104, 256, 88, 90, ['#f8b8cc', '#ffd8e4']);
      for (let x = 0; x < 256; x += 32) L.lamps.push({ x: x + 14, y: 62, c: '#ffd8e4' });
    },
    fx: [{ k: 'move', spr: 'train', x: -80, y: 58, dx: 420, dur: 12, loop: true }, { k: 'fall', n: 30, c: ['#f8b8cc', '#ffd8e4', '#ffffff'], size: 2, slow: true }, { k: 'sparkle', x: 0, y: 60, w: 256, h: 40, n: 10, night: true }, { k: 'glow', x: 128, y: 80, r: 110, c: '#ff6a9a', night: true }],
    lines: ['Hoa anh đào rơi kìa 🌸', 'Mua nước máy bán hàng không?', 'Konnichiwa!', 'Đi ăn ramen thôi', 'Tàu chạy êm ghê'],
  },
  paris: {
    draw: (p, L) => {
      sky(p, L, ['#9ac0f0', '#f0e0e8'], 70, 60);
      // Eiffel xa bên phải
      eiffel(p, L, 224, 100, 92);
      for (let i = 0; i < 4; i++) {
        const x = i * 50; p.rect(x, 28, 49, 72, '#ece0c8'); p.rect(x, 22, 49, 6, '#5a6a80'); for (let k = 0; k < 3; k++) p.rect(x + 6 + k * 15, 16, 6, 6, '#5a6a80');
        for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) { const wx = x + 6 + k * 15, wy = 32 + r * 18; p.rect(wx, wy, 8, 12, '#7a9ab8'); L.wins.push([wx, wy, 8, 12]); p.rect(wx - 1, wy + 12, 10, 1, '#2a2a2a'); circle(p, wx + 4, wy + 13, 1, '#e8443a'); }
      }
      // tiệm bánh có mái hiên + cửa metro art nouveau
      awning(p, 0, 84, 50, '#2a6a4a', '#f0e8d0'); awning(p, 50, 84, 50, '#c82a2a', '#f0e8d0'); awning(p, 100, 84, 50, '#2a3a6a', '#f0e8d0');
      for (let k = 0; k < 3; k++) { p.rect(4 + k * 50, 91, 42, 9, '#ffe0a0'); L.wins.push([4 + k * 50, 91, 42, 9]); }
      p.rect(160, 70, 2, 30, '#2a5a3a'); p.rect(186, 70, 2, 30, '#2a5a3a'); for (let x = 160; x < 188; x++) p.px(x, 70 - Math.round(Math.sin((x - 160) / 28 * Math.PI) * 6), '#2a5a3a');
      p.rect(166, 66, 16, 5, '#f6c445'); L.neon.push({ x: 160, y: 72, w: 3, h: 3, c: '#ffb04a' }, { x: 186, y: 72, w: 3, h: 3, c: '#ffb04a' });
      street(p, 100, 130);
      for (let i = 0; i < 6; i++) tree(p, 12 + i * 46, 128, 8, '#4a8a4a');
      for (let x = 30; x < 256; x += 46) { p.rect(x, 104, 2, 24, '#2a2a2a'); L.lamps.push({ x: x - 1, y: 101, c: '#ffe8a0' }); }
      for (let k = 0; k < 6; k++) { p.rect(210 + k * 7, 170, 5, 6, '#8a5a3a'); circle(p, 212 + k * 7, 168, 3, ['#e8443a', '#f6c445', '#f59ab3'][k % 3]); }
    },
    fx: [{ k: 'move', spr: 'vespa', x: -20, y: 146, dx: 300, dur: 10, loop: true }, { k: 'move', spr: 'car', x: 280, y: 156, dx: -320, dur: 9, loop: true }, { k: 'bird', x: 100, y: 110, icon: '🕊️', n: 4 }, { k: 'sparkle', x: 190, y: 10, w: 40, h: 60, n: 14, night: true }, { k: 'fall', n: 8, c: ['#e8b84a', '#d8903a'], size: 2, slow: true }],
    lines: ['Bonjour!', 'Croissant thơm quá', 'Đi metro không?', 'Paris đẹp ghê', 'Merci beaucoup'],
  },
  venice: {
    draw: (p, L) => {
      sky(p, L, ['#8ac8f0', '#fff0d8'], 40, 200);
      const cs = ['#e8a87a', '#f0d088', '#d8786a', '#f0c0a0', '#e89a6a', '#d8c098'];
      for (let i = 0; i < 10; i++) {
        const x = i * 26; venHouse(p, L, x, 96, 25, 50 + (i * 13) % 20, cs[i % 6]);
        p.rect(x + 3, 96 - 30, 18, 2, '#ffffff'); for (let k = 0; k < 4; k++) circle(p, x + 5 + k * 5, 64, 1, '#e8443a');
        for (let k = 0; k < 2; k++) { p.rect(x + 7 + k * 8, 2 + 96 - 66 - (i * 13) % 20 + 60, 0, 0, '#000'); }
      }
      // ống khói hình phễu
      for (let i = 0; i < 5; i++) { const x = 12 + i * 52; p.rect(x, 22, 3, 10, '#a85a3a'); p.rect(x - 2, 20, 7, 3, '#a85a3a'); }
      water(p, L, 96, 150, '#3a9aa8', '#2a7888');
      for (let x = 0; x < 256; x += 4) p.rect(x, 98 + (x % 8 ? 0 : 1), 3, 20, cs[(x / 26 | 0) % 6] + '40');
      // cầu đá nhỏ
      for (let x = 150; x < 230; x++) { const lift = Math.round(Math.sin((x - 150) / 80 * Math.PI) * 14); p.rect(x, 110 - lift, 1, 6, '#e8dcc0'); }
      for (let x = 152; x < 228; x += 5) p.rect(x, 104 - Math.round(Math.sin((x - 150) / 80 * Math.PI) * 14), 1, 6, '#c8bca8');
      for (let x = 20; x < 256; x += 60) for (let k = 0; k < 6; k++) p.rect(x, 116 + k * 4, 3, 4, k % 2 ? '#ffffff' : '#c83a3a');
      band(p, 150, 192, '#d0b890', '#c0a880'); p.rect(0, 150, 256, 2, '#a89070');
      for (let i = 0; i < 4; i++) { const x = 20 + i * 64; circle(p, x, 168, 5, '#ffffff'); p.rect(x, 168, 1, 8, '#3a3a3a'); p.rect(x - 12, 156, 24, 2, ['#2a6a9a', '#c83a3a'][i % 2]); }
      for (let x = 0; x < 256; x += 48) L.lamps.push({ x: x + 40, y: 140, c: '#ffd88a' });
    },
    fx: [{ k: 'shim', x: 0, y: 98, w: 256, h: 50, n: 30 }, { k: 'move', spr: 'gondola', x: 10, y: 140, dx: 200, dur: 22 }, { k: 'move', spr: 'gondola', x: 230, y: 124, dx: -180, dur: 28 }, { k: 'bird', x: 120, y: 30, icon: '🕊️', n: 3 }],
    lines: ['Ciao bella!', 'Gondola đẹp quá', 'Kênh này dẫn tới đâu ta?', 'Ăn gelato đi 🍨', 'Lạc đường nữa rồi 😂'],
  },
  swiss: {
    draw: (p, L) => {
      sky(p, L, ['#7ab8f0', '#e8f4ff'], 80, 60);
      ridge(p, 70, 50, 30, '#8a9ab8', 1.3, '#ffffff'); ridge(p, 86, 30, 18, '#5a8a5a', 0.2);
      for (let i = 0; i < 12; i++) pine(p, 4 + i * 22, 92, 18, '#2a6a3a');
      // nhà chalet có cửa sổ hoa + cờ Thuỵ Sĩ
      for (let i = 0; i < 5; i++) {
        const x = 4 + i * 52, yb = 102;
        p.rect(x, yb - 26, 42, 26, '#a8683a'); for (let k = 0; k < 6; k++) p.rect(x, yb - 26 + k * 5, 42, 1, '#8a5030');
        for (let k = 0; k < 7; k++) { const h = 14 - Math.abs(k - 3) * 4; p.rect(x - 4 + k * 7, yb - 26 - h, 8, h, '#5a2a1a'); }
        p.rect(x - 4, yb - 28, 50, 2, '#ffffff');
        for (let k = 0; k < 2; k++) { const wx = x + 6 + k * 22; p.rect(wx, yb - 20, 9, 8, '#fff0c8'); L.wins.push([wx, yb - 20, 9, 8]); p.rect(wx - 1, yb - 12, 11, 3, '#6a3a22'); for (let f = 0; f < 5; f++) p.px(wx + f * 2, yb - 13, ['#e8443a', '#f6c445', '#f59ab3'][f % 3]); }
        p.rect(x + 17, yb - 12, 8, 12, '#5a2a1a');
      }
      p.rect(120, 30, 1, 46, '#8a8a8a'); p.rect(121, 30, 10, 8, '#d8302a'); p.rect(125, 31, 2, 6, '#ffffff'); p.rect(123, 33, 6, 2, '#ffffff');
      tiles(p, 102, 134, '#c8c0b0', '#b8b0a0', 8);
      rail(p, 136, '#6a5a4a');
      band(p, 142, 192, '#8ac870', '#6aa858'); speckle(p, L, 0, 146, 256, 46, 140, ['#ffffff', '#f6e04a', '#e8443a', '#b08ae0']);
      // bò sữa
      for (let i = 0; i < 2; i++) { const x = 160 + i * 40; p.rect(x, 170, 16, 8, '#ffffff'); p.rect(x + 3, 171, 4, 3, '#2a2a2a'); p.rect(x + 10, 173, 4, 3, '#2a2a2a'); p.rect(x + 14, 166, 5, 5, '#ffffff'); p.rect(x + 1, 178, 2, 4, '#2a2a2a'); p.rect(x + 12, 178, 2, 4, '#2a2a2a'); p.px(x + 15, 172, '#f6c445'); }
      for (let x = 20; x < 256; x += 60) L.lamps.push({ x, y: 104, c: '#ffe8a0' });
    },
    fx: [{ k: 'move', spr: 'train', x: -80, y: 140, dx: 420, dur: 14, loop: true }, { k: 'steam', x: 40, y: 64, n: 2 }, { k: 'steam', x: 144, y: 64, n: 2 }, { k: 'fall', n: 16, c: ['#ffffff'], size: 2, slow: true }, { k: 'bird', x: 60, y: 20, icon: '🦅', n: 1 }],
    lines: ['Grüezi!', 'Tàu đỏ tới rồi kìa', 'Không khí trong lành ghê', 'Mua sô-cô-la đi', 'Bò đeo chuông dễ thương quá'],
  },
  fairy: {
    draw: drawFairyMain,
    fx: [{ k: 'sparkle', x: 80, y: 20, w: 96, h: 90, n: 18 }, { k: 'shim', x: 110, y: 154, w: 36, h: 8, n: 10 }, { k: 'sparkle', x: 116, y: 128, w: 24, h: 30, n: 10 }, { k: 'bird', x: 40, y: 20, icon: '🕊️', n: 2 }, { k: 'glow', x: 128, y: 80, r: 80, c: '#ff8ad8', night: true }, { k: 'glow', x: 128, y: 150, r: 40, c: '#8ad8ff', night: true }],
    lines: ['Lâu đài kìa!!', 'Mickey ở đằng kia!', 'Mua bóng bay tai Mickey đi', 'Mấy giờ diễu hành ta?', 'Vui như con nít luôn 😆'],
  },
  iceland: {
    night: true,
    draw: (p, L) => {
      sky(p, L, ['#0a1030', '#1a3060'], 100, 40);
      ridge(p, 90, 30, 28, '#2a3a5a', 0.8, '#d8e4f0');
      // nhà thờ Hallgrímskirkja bậc thang
      for (let k = 0; k < 8; k++) { const h = 20 + Math.min(k, 7 - k) * 10; p.rect(108 + k * 5, 100 - h, 5, h, '#c8ccd4'); p.rect(108 + k * 5, 100 - h, 1, h, '#a8acb4'); }
      p.rect(124, 14, 8, 30, '#d8dce4'); p.rect(126, 6, 4, 8, '#b8bcc4'); p.rect(127, 2, 2, 4, '#3a3a3a'); L.wins.push([126, 26, 4, 6]);
      // nhà mái tôn nhiều màu
      const cs = ['#d8302a', '#f6c445', '#3a6ad0', '#ffffff', '#3aa86a', '#f08a3a'];
      for (let i = 0; i < 6; i++) { const x = i < 3 ? 4 + i * 34 : 160 + (i - 3) * 32; bldg(p, L, x, 100, 30, 24, cs[i], '#2a2a3a', '#ffe08a', 8); for (let k = 0; k < 30; k += 2) p.px(x + k, 76, '#ffffff'); }
      band(p, 100, 192, '#e8f0f8', '#d0dcec');
      for (let x = 0; x < 256; x++) p.rect(x, 128 + Math.round(Math.sin(x / 20) * 2), 1, 22, '#7a8090');
      for (let x = 0; x < 256; x += 20) p.rect(x, 138, 10, 1, '#f0e8c0');
      for (let i = 0; i < 6; i++) pine(p, 10 + i * 46, 124, 14, '#1a3a3a', '#ffffff');
      // người tuyết + quán súp
      circle(p, 40, 172, 6, '#ffffff'); circle(p, 40, 162, 4, '#ffffff'); p.px(39, 161, '#2a2a2a'); p.px(41, 161, '#2a2a2a'); p.rect(40, 163, 3, 1, '#f08a3a'); p.rect(36, 166, 9, 2, '#d8302a');
      p.rect(190, 150, 40, 22, '#6a4a3a'); p.rect(186, 146, 48, 4, '#d8302a'); p.rect(194, 154, 32, 8, '#ffe0a0'); L.wins.push([194, 154, 32, 8]);
      for (let x = 20; x < 256; x += 56) L.lamps.push({ x, y: 104, c: '#ffd88a' });
    },
    fx: [{ k: 'aurora', y: 0 }, { k: 'sparkle', x: 0, y: 0, w: 256, h: 80, n: 30 }, { k: 'fall', n: 30, c: ['#ffffff', '#e8f4ff'], size: 2, slow: true }, { k: 'move', spr: 'car', x: -30, y: 146, dx: 320, dur: 12, loop: true }, { k: 'steam', x: 210, y: 146, n: 2 }],
    lines: ['Cực quang lên rồi!', 'Lạnh quá đi', 'Góðan daginn!', 'Đi ngâm suối nóng không?', 'Ăn súp cừu cho ấm'],
  },
};

export const mainOf = (id: TripId) => MAIN[id];

/** Khí hậu đặc trưng: [nhiệt độ thấp, cao], xác suất [nắng, mây, mưa, tuyết, sương] */
const CLIMATE: Record<TripId, [number, number, number[]]> = {
  taichung: [26, 31, [0.5, 0.3, 0.2, 0, 0]], gwangju: [9, 16, [0.5, 0.35, 0.15, 0, 0]], hoian: [27, 32, [0.6, 0.25, 0.15, 0, 0]],
  tokyo: [13, 19, [0.55, 0.35, 0.1, 0, 0]], paris: [11, 17, [0.35, 0.45, 0.2, 0, 0]], venice: [18, 24, [0.6, 0.3, 0, 0, 0.1]],
  swiss: [-3, 4, [0.45, 0.1, 0, 0.45, 0]], fairy: [18, 27, [0.75, 0.2, 0.05, 0, 0]], iceland: [-7, -1, [0.4, 0, 0, 0.5, 0.1]],
};
const WX: WeatherType[] = ['clear', 'cloudy', 'rain', 'snow', 'fog'];
/** Thời tiết ở điểm du lịch theo ngày + buổi (đổi mỗi 6 tiếng) */
export function tripWeather(id: TripId, date: string, hour: number): Weather {
  const [lo, hi, pr] = CLIMATE[id], r = seeded(`tripwx:${id}:${date}:${Math.floor(hour / 6)}`);
  let x = r(), k = 0; while (k < 4 && x >= pr[k]) { x -= pr[k]; k++; }
  return { type: WX[k], temp: Math.round(lo + r() * (hi - lo)), code: 0 };
}
export const mainBackground = (id: TripId, ph: Phase) => paint(`main:v7:${id}:${ph}`, id, MAIN[id].draw, ph, !!MAIN[id].night, id === 'fairy');
