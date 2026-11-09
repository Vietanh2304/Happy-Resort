// Hình vẽ trang trại chăn nuôi: nền (cỏ, hàng rào, chuồng, nhà xưởng), nong tằm, tổ ong.
import { ellipse } from './iso';
import { makeSprite, mix, type Pen } from './pixel';
import { RANCH } from './ranch';
import { seeded } from './rng';

function fence(p: Pen, b: { x0: number; x1: number; y0: number; y1: number }, open = 0) {
  const post = '#a8703f', rail = '#c8905a';
  for (let x = b.x0; x <= b.x1; x++) { p.px(x, b.y0, rail); p.px(x, b.y0 + 3, rail); if (x < (b.x0 + b.x1) / 2 - open / 2 || x > (b.x0 + b.x1) / 2 + open / 2) { p.px(x, b.y1, rail); p.px(x, b.y1 - 3, rail); } }
  for (let y = b.y0; y <= b.y1; y++) { p.px(b.x0, y, rail); p.px(b.x1, y, rail); }
  for (let x = b.x0; x <= b.x1; x += 8) { p.rect(x, b.y0 - 2, 1, 6, post); if (x < (b.x0 + b.x1) / 2 - open / 2 || x > (b.x0 + b.x1) / 2 + open / 2) p.rect(x, b.y1 - 4, 1, 6, post); }
}

export function ranchBackground(dark: boolean) {
  return makeSprite(`ranch:v1:${dark}`, RANCH.w, RANCH.h, p => {
    const d = (c: string) => (dark ? mix(c, '#1a2440', 0.45) : c);
    const rand = seeded('ranch');
    p.rect(0, 0, 256, 192, d('#9fd067'));
    for (let y = 0; y < 192; y += 8) for (let x = 0; x < 256; x += 8) if (((x + y) / 8) % 2) p.rect(x, y, 8, 8, d('#a4d36c'));
    for (let i = 0; i < 500; i++) p.px(Math.floor(rand() * 256), Math.floor(rand() * 192), d(rand() < 0.5 ? '#8cc65c' : '#b9e086'));
    // đồi xa + hàng cây phía trên
    for (let x = 0; x < 256; x++) { const h = 30 + Math.round(Math.sin(x / 23) * 6 + Math.sin(x / 9) * 2); p.rect(x, 0, 1, h, d('#7ab858')); }
    for (let x = 4; x < 256; x += 14) { ellipse(p, x, 26 + (x % 3), 7, 7, d('#4a9a4a')); ellipse(p, x - 2, 23 + (x % 3), 3, 3, d('#6aba5a')); }
    // lối đi đất ở giữa (từ cổng lên nhà xưởng) + nhánh sang hai bên
    for (let y = 80; y < 192; y++) p.rect(118, y, 20, 1, d('#d8b880'));
    p.rect(92, 112, 72, 12, d('#d8b880'));
    // đồng cỏ cừu: cỏ đậm hơn
    const m = RANCH.pens.meadow; p.rect(m.x0, m.y0, m.x1 - m.x0, m.y1 - m.y0, d('#8ac85a'));
    // sân gà rải rơm
    const c = RANCH.pens.coop; for (let i = 0; i < 90; i++) p.rect(c.x0 + 2 + Math.floor(rand() * (c.x1 - c.x0 - 4)), c.y0 + 4 + Math.floor(rand() * (c.y1 - c.y0 - 6)), 2, 1, d('#e8d08a'));
    // chuồng gà (nhà nhỏ mái đỏ)
    p.rect(14, 46, 30, 18, d('#e8c890')); for (let i = 0; i < 8; i++) p.rect(12 + i, 38 + i, 34 - i * 2, 1, d('#d8584a')); p.rect(25, 54, 8, 10, d('#6a4028')); p.rect(16, 50, 6, 4, d('#fff1a8'));
    // chuồng bò lớn (chuồng đỏ kiểu nông trại)
    p.rect(198, 36, 44, 30, d('#c8483a')); for (let i = 0; i < 12; i++) p.rect(196 + i, 26 + i, 48 - i * 2, 1, d('#8a3a32')); p.rect(212, 46, 16, 20, d('#6a3028'));
    p.rect(213, 47, 14, 18, d('#fffaf0')); p.rect(219, 47, 2, 18, d('#c8483a')); for (let k = 0; k < 14; k++) { p.px(213 + k, 47 + k, d('#c8483a')); p.px(226 - k, 47 + k, d('#c8483a')); }
    p.rect(166, 92, 18, 6, d('#e8d08a')); p.rect(166, 92, 18, 1, d('#f8e8a8'));                      // máng cỏ khô
    // nhà nuôi tằm (lá chuối, mái tranh)
    p.rect(152, 132, 34, 14, d('#d8b880')); for (let i = 0; i < 7; i++) p.rect(150 + i, 125 + i, 38 - i * 2, 1, d('#b08a3a'));
    // vườn hoa quanh tổ ong
    for (let i = 0; i < 40; i++) p.px(196 + Math.floor(rand() * 48), 148 + Math.floor(rand() * 28), d(['#f59ab3', '#f6c64e', '#b07ae0', '#ffffff'][i % 4]));
    // nhà xưởng (chế biến + xưởng may)
    const w = RANCH.workshop;
    p.rect(w.x - 30, w.y - 30, 60, 30, d('#f2e2c4')); for (let i = 0; i < 10; i++) p.rect(w.x - 33 + i, w.y - 40 + i, 66 - i * 2, 1, d('#5a8ab8'));
    p.rect(w.x - 20, w.y - 16, 10, 16, d('#8a5a3c')); p.rect(w.x + 8, w.y - 16, 10, 16, d('#8a5a3c'));
    p.rect(w.x - 4, w.y - 24, 8, 6, d('#a8d8f0'));
    // hàng rào các chuồng
    fence(p, RANCH.pens.coop, 14); fence(p, RANCH.pens.barn, 14); fence(p, RANCH.pens.meadow, 14);
    // cổng ra nông trại
    p.rect(114, 182, 2, 10, d('#a8703f')); p.rect(140, 182, 2, 10, d('#a8703f')); p.rect(114, 182, 28, 2, d('#c8905a'));
  }, null);
}

/** Nong tằm: tằm trắng bò trên lá dâu */
export const silkTraySprite = (n: number) => makeSprite(`silktray:${Math.min(n, 4)}`, 22, 10, p => {
  ellipse(p, 11, 6, 10, 3.5, '#c8a060'); ellipse(p, 11, 5.5, 9, 2.8, '#e8c888');
  for (let i = 0; i < 6; i++) ellipse(p, 4 + i * 3, 5, 1.8, 1.2, '#5aa84a');
  for (let i = 0; i < Math.min(n, 4) * 2; i++) p.rect(4 + (i * 5) % 15, 4 + (i % 2), 3, 1, '#fffaf0');
});
/** Tổ ong gỗ */
export const hiveSprite = () => makeSprite('hive:v1', 14, 16, p => {
  p.rect(2, 4, 10, 10, '#f6c64e'); for (const y of [6, 9, 12]) p.rect(2, y, 10, 1, '#c8a020'); p.rect(1, 2, 12, 2, '#a8703f'); p.rect(6, 11, 2, 2, '#5a3a1a'); p.rect(3, 14, 2, 2, '#8a5a3c'); p.rect(9, 14, 2, 2, '#8a5a3c');
});
/** Bảng "Mua con giống" */
export const ranchSignSprite = () => makeSprite('ranch-sign', 22, 18, p => {
  p.rect(10, 8, 2, 10, '#8a5a3c'); p.rect(1, 1, 20, 9, '#e8c890'); p.rect(1, 1, 20, 1, '#fff2d0'); p.rect(4, 4, 3, 3, '#f59ab3'); p.rect(9, 4, 3, 3, '#f6c64e'); p.rect(14, 4, 3, 3, '#a5d470');
});

/** Chuồng ngựa nhỏ: mái gỗ đỏ, máng cỏ */
export const stableSprite = () => makeSprite('stable', 30, 26, p => {
  for (let i = 0; i < 7; i++) p.rect(1 + i, i, 28 - i * 2, 1, i % 2 ? '#c8483a' : '#e8604a');
  p.rect(3, 7, 24, 19, '#c88a5a'); for (let x = 4; x < 27; x += 4) p.rect(x, 7, 1, 19, '#a8693f');
  p.rect(10, 13, 10, 13, '#5a3a2a'); p.rect(11, 14, 8, 12, '#3a2a20');
  p.rect(1, 22, 8, 4, '#a8693f'); p.rect(2, 21, 6, 2, '#e8d070');
});
