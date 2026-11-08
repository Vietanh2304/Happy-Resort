// Văn phòng công ty: tường kính nhìn ra thành phố, dãy bàn làm việc, phòng sếp vách kính, máy in, cây nước.
import { ellipse } from './iso';
import { makeSprite, mix } from './pixel';
import { seeded } from './rng';

export const OFFICE = {
  myDesk: { x: 88, y: 106, stand: { x: 88, y: 116 } },
  boss: { x: 164, y: 84 },
  desks: [{ x: 40, y: 106 }, { x: 136, y: 106 }, { x: 40, y: 134 }, { x: 136, y: 134 }],
  printer: { x: 18, y: 80 }, cooler: { x: 112, y: 78 },
  door: { x: 96, y: 140 },
};

export function officeBackground(dark: boolean) {
  return makeSprite(`office:v1:${dark}`, 192, 144, p => {
    const r = seeded('office');
    // cửa kính lớn nhìn ra thành phố
    p.rect(0, 0, 192, 64, dark ? '#1a2048' : '#9ad0f0');
    for (let i = 0; i < 16; i++) { const x = i * 12 + Math.floor(r() * 4), h = 14 + Math.floor(r() * 30); p.rect(x, 52 - h, 10, h + 12, dark ? '#2a3060' : '#7aa0c8'); for (let yy = 56 - h; yy < 60; yy += 4) for (let xx = x + 2; xx < x + 9; xx += 3) p.px(xx, yy, dark ? (r() < 0.6 ? '#ffe08a' : '#3a4070') : '#c8e0f0'); }
    for (let x = 0; x < 192; x += 32) p.rect(x, 0, 2, 64, '#e8ecf0');
    p.rect(0, 0, 192, 3, '#c8ccd8'); p.rect(0, 62, 192, 3, '#c8ccd8');
    // sàn thảm xám xanh
    for (let y = 64; y < 144; y++) p.rect(0, y, 192, 1, mix('#b8c0cc', '#9aa4b4', (y - 64) / 80));
    for (let i = 0; i < 260; i++) p.px(Math.floor(r() * 192), 64 + Math.floor(r() * 80), r() < 0.5 ? '#aab2c0' : '#c4ccd8');
    // phòng sếp vách kính bên phải
    p.rect(146, 40, 46, 56, 'rgba(200,230,255,0.35)'); p.rect(146, 40, 46, 2, '#e8ecf0'); p.rect(146, 40, 2, 56, '#e8ecf0'); p.rect(146, 94, 46, 2, '#e8ecf0');
    p.rect(152, 46, 12, 8, '#f6c64e'); p.rect(153, 47, 10, 6, '#fffaf0'); p.px(156, 49, '#e8604a');   // bằng khen
    // máy in + cây nước + chậu cây
    p.rect(10, 66, 18, 12, '#e8e8f0'); p.rect(12, 64, 14, 3, '#c8c8d8'); p.rect(13, 70, 12, 2, '#3a3a4a');
    p.rect(108, 58, 8, 14, '#e8f0f8'); ellipse(p, 112, 56, 4, 4, '#8ad0f0'); p.rect(108, 72, 8, 6, '#c8ccd8');
    for (const x of [4, 128]) { p.rect(x, 74, 8, 6, '#c8905a'); ellipse(p, x + 4, 68, 6, 6, '#4a9a4a'); ellipse(p, x + 2, 65, 3, 3, '#6aba5a'); }
    // bảng trắng
    p.rect(40, 24, 50, 26, '#ffffff'); p.rect(40, 24, 50, 1, '#8a8098'); for (let i = 0; i < 4; i++) p.rect(44 + i * 11, 44 - i * 4, 6, 4 + i * 4, ['#5aa8e0', '#a5d470', '#f6c64e', '#e8604a'][i]);
  }, null);
}

/** Bàn làm việc có màn hình (nhìn từ phía trước) */
export const workDeskSprite = (mine: boolean) => makeSprite(`work-desk:${mine}`, 30, 18, p => {
  p.rect(0, 6, 30, 4, '#d8c0a0'); p.rect(0, 6, 30, 1, '#ecd8bc'); p.rect(1, 10, 28, 8, '#b89a78'); p.rect(2, 10, 1, 8, '#a08060'); p.rect(27, 10, 1, 8, '#a08060');
  p.rect(9, 0, 12, 7, '#3a3a4a'); p.rect(10, 1, 10, 5, mine ? '#8ad0f0' : '#6a9ac8'); p.rect(14, 6, 2, 1, '#3a3a4a');
  p.rect(22, 4, 3, 3, '#ffffff'); p.px(23, 4, '#8a5a3c');
  if (mine) { p.rect(3, 4, 4, 3, '#f59ab3'); p.px(4, 3, '#e8604a'); }   // khung ảnh người ấy
});
export const bossDeskSprite = () => makeSprite('boss-desk', 36, 18, p => {
  p.rect(0, 6, 36, 4, '#8a5a3c'); p.rect(0, 6, 36, 1, '#a8703f'); p.rect(1, 10, 34, 8, '#6a4028');
  p.rect(12, 0, 14, 7, '#2a2a3a'); p.rect(13, 1, 12, 5, '#5a7ab0'); p.rect(28, 3, 5, 4, '#c8c8d8');
});

/** Trạm xe buýt nhỏ trong làng (lên thành phố đi làm) */
export const busStopSprite = () => makeSprite('bus-stop', 16, 24, p => {
  p.rect(7, 4, 2, 20, '#5a5a6a'); p.rect(2, 0, 12, 8, '#3a6ab0'); p.rect(4, 2, 8, 4, '#ffffff'); p.rect(6, 3, 4, 2, '#f6c64e');
  p.rect(1, 18, 14, 2, '#8a5a3c'); p.rect(2, 20, 1, 4, '#5a3a2a'); p.rect(13, 20, 1, 4, '#5a3a2a');
});
