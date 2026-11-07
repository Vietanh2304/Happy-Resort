// Hình vẽ trang trí cho cảnh ngắm biển: tàu lá dừa khung góc, dâm bụt, ván lướt sóng, lâu đài cát, du thuyền.
import { makeSprite, mix, type Pen } from './pixel';

function line(p: Pen, x0: number, y0: number, x1: number, y1: number, c: string, w = 1) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) p.rect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), w, w, c);
}
function ell(p: Pen, cx: number, cy: number, rx: number, ry: number, c: string) {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const w = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
    if (w >= 0.5) p.rect(Math.round(cx - w), y, Math.round(w * 2), 1, c);
  }
}

/** Chùm lá dừa rủ xuống từ góc trên bên trái (bên phải thì lật ngang) */
export const frondCornerSprite = () => makeSprite('frond-corner:v1', 84, 64, p => {
  const dark = '#2a6a3a', mid = '#3a8a44', light = '#6ab858', rib = '#8a7a3a';
  // mỗi tàu lá: sống lá cong từ gốc (ngoài khung) ra, lá chét hai bên rủ xuống
  const leaves: [number, number, number][] = [[0.15, 78, 0.55], [0.45, 70, 0.5], [0.8, 60, 0.45], [1.15, 48, 0.4], [-0.15, 66, 0.5]];
  leaves.forEach(([ang, len, droop], k) => {
    let x = -4, y = -6, a = ang;
    for (let i = 0; i < len; i++) {
      a += droop / len;                                   // càng ra xa càng rủ xuống
      x += Math.cos(a); y += Math.sin(a);
      const t = i / len, leaf = Math.round((1 - t) * 9 + 3);
      p.px(Math.round(x), Math.round(y), rib);
      if (i % 2 === 0) {
        const c = k % 2 ? mid : dark;
        line(p, x, y, x + Math.cos(a + 1.9) * leaf, y + Math.sin(a + 1.9) * leaf + 2, c);
        line(p, x, y, x + Math.cos(a - 1.2) * leaf * 0.7, y + Math.sin(a - 1.2) * leaf * 0.7 + 3, i % 4 ? c : light);
      }
    }
  });
  ell(p, 6, 4, 6, 5, '#7a5a2a'); ell(p, 4, 2, 3, 3, '#5a3a1a');                 // trái dừa
  ell(p, 13, 6, 4, 4, '#6a8a2a'); ell(p, 12, 5, 2, 2, '#9aba4a');
}, '#1a3a24');

/** Bụi dâm bụt hoa đỏ hồng */
export const hibiscusSprite = () => makeSprite('hibiscus:v1', 30, 20, p => {
  ell(p, 15, 12, 14, 8, '#2a7a3a'); ell(p, 11, 9, 8, 6, '#3a9a48'); ell(p, 20, 10, 7, 5, '#3a8a44');
  for (const [x, y, c] of [[8, 8, '#e8304a'], [17, 6, '#f05a8a'], [23, 11, '#e8304a'], [12, 14, '#f7894a'], [4, 13, '#f05a8a']] as const) {
    p.rect(x - 2, y, 5, 1, c); p.rect(x, y - 2, 1, 5, c); p.rect(x - 1, y - 1, 3, 3, c); p.px(x, y, '#f6e84a');
  }
});
/** Ván lướt sóng cắm đứng trên cát */
export const surfboardSprite = () => makeSprite('surfboard:v1', 8, 30, p => {
  ell(p, 4, 14, 3.5, 14, '#5ac8e8'); p.rect(3, 2, 2, 26, '#ffffff'); p.rect(1, 12, 6, 2, '#f7894a'); p.rect(0, 28, 8, 2, '#c8a070');
});
/** Lâu đài cát nhỏ có cờ */
export const sandcastleSprite = () => makeSprite('sandcastle:v1', 22, 16, p => {
  const c = '#e8c888', d = '#c8a060';
  p.rect(2, 8, 18, 8, c); p.rect(2, 14, 18, 2, d);
  p.rect(1, 4, 6, 6, c); p.rect(15, 4, 6, 6, c); p.rect(8, 2, 6, 8, c);
  for (const x of [1, 3, 5, 15, 17, 19]) p.px(x, 3, c);
  for (const x of [8, 10, 12]) p.px(x, 1, c);
  p.rect(10, 6, 2, 4, '#8a6a3a'); p.rect(11, -3 + 3, 1, 3, '#8a5a3c'); p.rect(12, 0, 3, 2, '#e8604a');
});
/** Du thuyền trắng xa (đêm sáng đèn) */
export const yachtSprite = (night: boolean) => makeSprite(`yacht:${night}`, 30, 10, p => {
  p.rect(2, 6, 26, 3, '#f4f0f8'); p.rect(4, 9, 22, 1, '#a8a8b8');
  p.rect(8, 3, 14, 3, '#e8e4f0'); p.rect(11, 1, 7, 2, '#d8d4e0');
  for (let x = 9; x < 21; x += 3) p.px(x, 4, night ? '#fff1a8' : '#5a8ab8');
  for (let x = 4; x < 27; x += 3) p.px(x, 7, night ? '#ffe08a' : '#8aa8c8');
  if (night) { p.px(15, 0, '#ff8aa8'); }
}, mix('#3a3448', '#000000', 0.2));

/** Đèn hoa đăng hình hoa sen có ngọn nến (của mình: hồng, của người ấy: vàng cam) */
export const lotusSprite = (mine: boolean) => makeSprite(`lotus:${mine}`, 14, 11, p => {
  const a = mine ? '#f590b8' : '#f6b05a', b = mine ? '#ffd0e4' : '#ffe0a0', d = mine ? '#d8608a' : '#d8883a';
  p.rect(5, 0, 1, 2, '#fff6a8'); p.px(5, 0, '#ffffff'); p.px(6, 1, '#ffb030');            // ngọn lửa
  p.rect(5, 2, 2, 3, '#fffaf0');                                                            // nến
  for (const [x, w] of [[1, 3], [10, 3]] as const) for (let y = 4; y < 8; y++) p.rect(x + (y - 4) * (x < 5 ? 0 : 0), y, w, 1, y === 4 ? b : a);
  for (const x of [3, 8]) for (let y = 3; y < 8; y++) p.rect(x, y, 3, 1, y === 3 ? b : a);
  p.rect(0, 7, 14, 2, d); p.rect(1, 9, 12, 1, '#3a8a44'); p.rect(0, 8, 14, 1, a);
  ell(p, 6.5, 6, 2.5, 1.5, b);
}, '#5a2a3a');
