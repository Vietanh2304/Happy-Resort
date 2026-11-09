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
  return makeSprite(`ranch:v2:${dark}`, RANCH.w, RANCH.h, p => {
    const d = (c: string) => (dark ? mix(c, '#1a2440', 0.45) : c);
    const rand = seeded('ranch');
    p.rect(0, 0, 256, 262, d('#9fd067'));
    for (let y = 0; y < 262; y += 8) for (let x = 0; x < 256; x += 8) if (((x + y) / 8) % 2) p.rect(x, y, 8, 8, d('#a4d36c'));
    for (let i = 0; i < 500; i++) p.px(Math.floor(rand() * 256), Math.floor(rand() * 262), d(rand() < 0.5 ? '#8cc65c' : '#b9e086'));
    // đồi xa + hàng cây phía trên
    for (let x = 0; x < 256; x++) { const h = 30 + Math.round(Math.sin(x / 23) * 6 + Math.sin(x / 9) * 2); p.rect(x, 0, 1, h, d('#7ab858')); }
    for (let x = 4; x < 256; x += 14) { ellipse(p, x, 26 + (x % 3), 7, 7, d('#4a9a4a')); ellipse(p, x - 2, 23 + (x % 3), 3, 3, d('#6aba5a')); }
    // lối đi đất ở giữa (từ cổng lên nhà xưởng) + nhánh sang hai bên
    for (let y = 80; y < 262; y++) p.rect(118, y, 20, 1, d('#d8b880'));
    p.rect(60, 222, 140, 10, d('#d8b880'));
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
    // ── phần dưới: chuồng ngựa + bãi tập (trái), ao cá nước ngọt (phải) ──
    const st = RANCH.pens.stable;
    p.rect(8, 186, 40, 34, d('#b8784a')); for (let x = 9; x < 48; x += 4) p.rect(x, 186, 1, 34, d('#9a6038'));
    for (let i = 0; i < 9; i++) p.rect(5 + i, 177 + i, 46 - i * 2, 1, d(i % 2 ? '#a8483a' : '#c8584a'));
    p.rect(20, 200, 16, 20, d('#4a2a1a')); p.rect(22, 202, 12, 18, d('#2a1a10')); p.rect(26, 192, 4, 4, d('#fff1a8'));
    p.rect(st.x0, st.y0, st.x1 - st.x0, st.y1 - st.y0, d('#c8b070'));                                       // bãi tập đất cát
    for (let i = 0; i < 60; i++) p.px(st.x0 + Math.floor(rand() * (st.x1 - st.x0)), st.y0 + Math.floor(rand() * (st.y1 - st.y0)), d('#b89a58'));
    p.rect(st.x1 - 14, st.y1 - 8, 12, 6, d('#e8d08a')); p.rect(st.x1 - 14, st.y1 - 8, 12, 1, d('#f8e8a8'));        // máng cỏ
    fence(p, st, 14);
    const pd = RANCH.pens.pond;
    ellipse(p, (pd.x0 + pd.x1) / 2, (pd.y0 + pd.y1) / 2, (pd.x1 - pd.x0) / 2 + 6, (pd.y1 - pd.y0) / 2 + 6, d('#c8b08a'));
    ellipse(p, (pd.x0 + pd.x1) / 2, (pd.y0 + pd.y1) / 2, (pd.x1 - pd.x0) / 2 + 3, (pd.y1 - pd.y0) / 2 + 3, d('#5aa8d0'));
    ellipse(p, (pd.x0 + pd.x1) / 2, (pd.y0 + pd.y1) / 2 - 2, (pd.x1 - pd.x0) / 2 - 4, (pd.y1 - pd.y0) / 2 - 4, d('#7ac8e8'));
    for (const [x, y] of [[pd.x0 + 6, pd.y0 + 4], [pd.x1 - 10, pd.y1 - 6]]) { ellipse(p, x, y, 4, 2, d('#5aa84a')); p.px(x + 1, y - 1, d('#f59ab3')); }
    for (let x = pd.x0 - 6; x < pd.x1 + 6; x += 5) { p.rect(x, pd.y0 - 8, 1, 3, d('#4a9a4a')); }
    // cổng ra nông trại (đáy bản đồ)
    p.rect(114, 252, 2, 10, d('#a8703f')); p.rect(140, 252, 2, 10, d('#a8703f')); p.rect(114, 252, 28, 2, d('#c8905a'));
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

/** Ngựa vẽ riêng (nhìn ngang, quay phải): thân dài, cổ & đầu ngẩng, bờm, đuôi, 4 chân có móng, 2 khung bước. Ba màu lông. */
const HORSE_COLORS: Record<string, { body: string; dark: string; light: string; mane: string; hoof: string; nose: string }> = {
  horse: { body: '#a8693f', dark: '#7a4a2a', light: '#c88a5a', mane: '#3a2216', hoof: '#2a1a12', nose: '#5a3a28' },
  horse_white: { body: '#f6f2ec', dark: '#d0c8be', light: '#ffffff', mane: '#c8c0b8', hoof: '#8a8078', nose: '#e8b8b8' },
  horse_black: { body: '#2e2834', dark: '#1a1620', light: '#4a4256', mane: '#0e0c12', hoof: '#0a0a0e', nose: '#4a3a44' },
};
export function horseSprite(kind: string, f: 0 | 1, saddle = false) {
  const c = HORSE_COLORS[kind] ?? HORSE_COLORS.horse;
  return makeSprite(`horse:v3:${kind}:${f}:${saddle}`, 40, 32, p => {
    // chân (khung bước: chân trước/sau so le), móng
    const legs = f ? [[9, 1], [13, -1], [23, -1], [27, 1]] : [[9, 0], [13, 0], [23, 0], [27, 0]];
    legs.forEach(([x, dx], i) => { const col = i % 2 ? c.dark : c.body; p.rect(x + dx, 20, 3, 9, col); p.rect(x + dx, 28, 3, 2, c.hoof); });
    // thân
    ellipse(p, 18, 17, 12, 6.5, c.body); ellipse(p, 18, 14.5, 10, 3, c.light); ellipse(p, 18, 21, 10, 2, c.dark);
    // cổ nghiêng chéo lên phía trước (dày ở vai, thon dần)
    for (let i = 0; i < 7; i++) p.rect(24 + i, 14 - i * 1.4, 6 - Math.floor(i / 3), 6, c.body);
    // đầu ngựa dài: trán → mõm chúc xuống phía trước (vẽ theo từng hàng)
    const head: [number, number, number][] = [[1, 31, 34], [2, 30, 35], [3, 30, 36], [4, 30, 37], [5, 31, 38], [6, 32, 39], [7, 33, 39], [8, 34, 39], [9, 35, 38]];
    for (const [y, x0, x1] of head) p.rect(x0, y, x1 - x0 + 1, 1, c.body);
    p.rect(36, 8, 3, 2, c.light); p.px(38, 8, c.nose); p.px(37, 9, c.dark);                 // mõm sáng màu, lỗ mũi, miệng
    p.rect(32, 3, 2, 2, '#1a1418'); p.px(32, 3, '#ffffff');                                // mắt
    p.rect(30, -1, 2, 3, c.body); p.px(30, -1, c.dark); p.rect(32, 0, 1, 2, c.dark);        // tai
    // bờm dọc gáy (mép sau cổ) + chỏm lông trước trán
    for (let i = 0; i < 8; i++) p.rect(23 + i, 12 - i * 1.4, 2, 4, c.mane);
    p.rect(31, 1, 2, 2, c.mane);
    // đuôi
    p.rect(5, 13, 3, 3, c.mane); p.rect(3, 14, 3, 8, c.mane); p.rect(4, 21, 2, 4, c.mane); p.px(3, 24 + f, c.mane);
    if (saddle) { p.rect(13, 9, 10, 3, '#8a3a32'); p.rect(13, 9, 10, 1, '#c8583a'); p.rect(17, 12, 2, 5, '#5a3a2a'); p.rect(16, 16, 4, 1, '#c8c8d8'); }
  });
}
