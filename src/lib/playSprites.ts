// Sprite pixel cho các trò chơi toàn màn hình (thay cho emoji để cùng một nét vẽ với cả game).
// Kích thước logic theo ô 16 px; hiển thị bằng cùng hệ số phóng với sân chơi.
import { makeSprite, type Pen } from './pixel';

function ell(p: Pen, cx: number, cy: number, rx: number, ry: number, c: string) {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const w = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
    if (w >= 0.5) p.rect(Math.round(cx - w), y, Math.round(w * 2), 1, c);
  }
}

export const snowmanSprite = () => makeSprite('pl:snowman', 14, 19, p => {
  ell(p, 7, 14, 6, 4.5, '#f4f9fd'); ell(p, 6, 13, 4, 2.5, '#ffffff');
  ell(p, 7, 6, 4.5, 4, '#f4f9fd'); ell(p, 6, 5, 3, 2, '#ffffff');
  p.rect(3, 9, 8, 2, '#e8604a'); p.rect(9, 10, 2, 4, '#e8604a');      // khăn
  p.px(5, 5, '#3b2d3f'); p.px(8, 5, '#3b2d3f'); p.rect(7, 6, 3, 1, '#f7894a');
  p.rect(3, 0, 8, 2, '#3b2d3f'); p.rect(4, -2 + 2, 6, 1, '#3b2d3f');   // mũ
  p.px(7, 13, '#3b2d3f'); p.px(7, 16, '#3b2d3f');
});
export const sandcastleSprite = () => makeSprite('pl:castle', 16, 15, p => {
  p.rect(1, 7, 14, 8, '#e8c87a'); p.rect(1, 7, 14, 1, '#f6dca0');
  p.rect(0, 3, 5, 12, '#e0bc6a'); p.rect(11, 3, 5, 12, '#e0bc6a'); p.rect(5, 1, 6, 6, '#e8c87a');
  for (const x of [0, 2, 4, 11, 13, 15]) p.px(x, 2, '#e0bc6a');
  p.rect(6, 10, 4, 5, '#a8823a'); p.rect(7, 9, 2, 1, '#a8823a');
  p.rect(7, 0, 1, 2, '#8a6a3a'); p.rect(8, -1 + 1, 3, 1, '#e8604a');
  p.px(2, 9, '#c8a050'); p.px(13, 11, '#c8a050');
});
export const beachUmbrellaSprite = () => makeSprite('pl:umbrella', 18, 18, p => {
  p.rect(8, 6, 2, 12, '#a8826a');
  for (let y = 0; y < 6; y++) { const w = 3 + y * 1.4; for (let x = Math.round(9 - w); x < Math.round(9 + w); x++) p.px(x, y, Math.floor((x + 20) / 3) % 2 ? '#e8604a' : '#fff6ec'); }
  p.rect(1, 6, 16, 1, '#c84a3a');
});
export const barrelSprite = () => makeSprite('pl:barrel', 12, 14, p => {
  p.rect(1, 1, 10, 13, '#b07a4a'); p.rect(0, 3, 12, 9, '#b07a4a'); p.rect(2, 1, 2, 13, '#c8905a');
  p.rect(0, 3, 12, 1, '#7a7a88'); p.rect(0, 10, 12, 1, '#7a7a88'); ell(p, 6, 1, 5, 1.2, '#8a5a3c');
});
export const crateSprite = () => makeSprite('pl:crate', 14, 13, p => {
  p.rect(0, 0, 14, 13, '#d8a868'); p.rect(0, 0, 14, 2, '#e8c088'); p.rect(0, 11, 14, 2, '#b07a4a');
  p.rect(0, 0, 2, 13, '#c8905a'); p.rect(12, 0, 2, 13, '#c8905a');
  for (let i = 0; i < 9; i++) p.rect(2 + i, 2 + i, 2, 1, '#b07a4a');
});
export const haystackSprite = () => makeSprite('pl:hay', 16, 13, p => {
  ell(p, 8, 8, 8, 5.5, '#e8c45a'); ell(p, 7, 6, 6, 4, '#f6dc7a');
  for (const [x, y] of [[3, 8], [6, 5], [10, 7], [12, 10], [5, 11], [9, 3]]) p.rect(x, y, 2, 1, '#c8a040');
});
export const rockSprite = () => makeSprite('pl:rock', 14, 10, p => {
  ell(p, 7, 6, 7, 4.5, '#8a8a96'); ell(p, 6, 5, 5, 3, '#a8a8b4'); p.rect(4, 3, 3, 1, '#c8c8d4');
});
export const miniFountainSprite = () => makeSprite('pl:fountain', 30, 26, p => {
  ell(p, 15, 19, 15, 6, '#c8beb0'); ell(p, 15, 18.5, 13, 4.5, '#e8e0d4'); ell(p, 15, 19, 11, 3.5, '#7fcde3');
  p.rect(13, 6, 4, 13, '#d8d0c4'); p.rect(13, 6, 1, 13, '#f0ebe4'); ell(p, 15, 7, 6, 2, '#e8e0d4');
  p.rect(14, 1, 2, 5, '#cdeef7'); for (const [x, y] of [[11, 3], [19, 3], [9, 7], [21, 7]]) p.px(x, y, '#cdeef7');
});
export const miniPalmSprite = () => makeSprite('pl:palm', 18, 22, p => {
  for (let i = 0; i < 14; i++) p.rect(8 + Math.round(Math.sin(i / 5) * 1.5), 8 + i, 3, 1, i % 3 ? '#b07a4a' : '#8a5a3c');
  for (const [dx, dy] of [[-7, 2], [7, 2], [-5, -3], [5, -3], [0, -4]]) {
    for (let k = 0; k <= 6; k++) p.rect(9 + Math.round((dx * k) / 6), 7 + Math.round((dy * k) / 6 + (k * k) / 12), 2, 1, k > 3 ? '#5aa645' : '#7cc457');
  }
  p.px(8, 8, '#8a5a3c'); p.px(11, 8, '#8a5a3c');
});
export const flowerBedSprite = () => makeSprite('pl:flowers', 16, 12, p => {
  ell(p, 8, 7, 8, 5, '#6aa645'); ell(p, 7, 6, 6, 3.5, '#86c257');
  for (const [x, y, c] of [[3, 5, '#f59ab3'], [7, 3, '#f6c64e'], [11, 5, '#e8506a'], [5, 8, '#b7a6e8'], [10, 8, '#f59ab3'], [13, 8, '#fffaf0']] as const) { p.rect(x, y, 2, 2, c); p.px(x, y, '#ffffff'); }
});
export const golfFlagSprite = () => makeSprite('pl:flag', 9, 16, p => {
  p.rect(1, 0, 1, 16, '#fffaf0'); p.rect(2, 0, 7, 5, '#e8604a'); p.rect(2, 4, 4, 1, '#c84a3a');
});
export const houseSprite = () => makeSprite('pl:house', 32, 30, p => {
  for (let y = 0; y < 12; y++) p.rect(16 - y * 1.4 - 2, y, (y * 1.4 + 2) * 2, 1, y % 3 === 2 ? '#a8423a' : '#c8564a');
  p.rect(2, 12, 28, 18, '#f4e6d0'); p.rect(2, 12, 28, 2, '#e0ccb0');
  p.rect(13, 19, 6, 11, '#a8693c'); p.px(17, 24, '#f6c64e');
  p.rect(5, 16, 6, 5, '#9fd4f5'); p.rect(21, 16, 6, 5, '#9fd4f5'); p.rect(7, 16, 1, 5, '#fffaf0'); p.rect(23, 16, 1, 5, '#fffaf0');
});
export const islandSprite = (r: number) => makeSprite(`pl:island:${r}`, r * 2, Math.round(r * 1.5), p => {
  ell(p, r, r * 0.8, r, r * 0.65, '#9fd4f5'); ell(p, r, r * 0.75, r - 2, r * 0.55, '#f2dca0'); ell(p, r - 2, r * 0.68, r * 0.6, r * 0.3, '#f8e8b8');
  ell(p, r + r * 0.25, r * 0.7, r * 0.35, r * 0.22, '#86c257');
}, null);
export const shuttleSprite = () => makeSprite('pl:shuttle', 7, 8, p => {
  p.rect(1, 0, 5, 4, '#fffaf0'); p.px(0, 1, '#fffaf0'); p.px(6, 1, '#fffaf0'); p.rect(2, 1, 1, 3, '#e8e0d4'); p.rect(4, 1, 1, 3, '#e8e0d4');
  p.rect(2, 4, 3, 1, '#e8604a'); ell(p, 3.5, 6, 2, 1.6, '#f6f1e6');
});
export const snowballSprite = () => makeSprite('pl:snowball', 6, 6, p => { ell(p, 3, 3, 3, 3, '#ffffff'); p.px(2, 1, '#e8f4ff'); p.rect(3, 4, 2, 1, '#cfe2f0'); });
export const dropSprite = () => makeSprite('pl:drop', 5, 7, p => {
  p.px(2, 0, '#5aa8e0'); p.rect(1, 1, 3, 2, '#7cc4ea'); p.rect(0, 3, 5, 3, '#7cc4ea'); p.rect(1, 6, 3, 1, '#5aa8e0'); p.px(1, 3, '#d8f2ff');
});
export const waterGunSprite = () => makeSprite('pl:gun', 12, 8, p => {
  p.rect(0, 1, 10, 4, '#5aa8e0'); p.rect(10, 2, 2, 2, '#f6c64e'); p.rect(2, 4, 3, 4, '#3a88c0'); ell(p, 6, 1, 3, 1.5, '#f59ab3'); p.rect(1, 2, 6, 1, '#9fd4f5');
});
export const leafSprite = () => makeSprite('pl:leaf', 5, 4, p => { p.rect(1, 0, 3, 1, '#86c257'); p.rect(0, 1, 5, 2, '#6aa645'); p.rect(1, 3, 2, 1, '#5a9a3a'); });
