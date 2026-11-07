// Bãi nhảy dù: máy bay cất cánh lên 4000m → bấm nhảy → rơi tự do → bung dù đung đưa → lái dù hạ cánh xuống bãi cỏ có hồng tâm.
// Trạng thái mỗi người chỉ gồm pha + mốc thời gian (+ độ cao lúc đổi pha, vị trí ngang), mỗi máy tự tính độ cao theo đồng hồ.
import type { Phase } from './content';
import { makeSprite, mix, type Pen } from './pixel';
import { seeded } from './rng';

export type JumpPhase = 'plane' | 'free' | 'chute' | 'land';
/** pa = chuyến bay (lúc lên máy bay) mà người này vừa nhảy ra */
export interface Jump { ph: JumpPhase; at: number; alt?: number; x?: number; pa?: number }

export const TOP = 4000;                      // độ cao bay bằng
export const JUMP_MIN = 3000;                 // đủ độ cao mới được nhảy
const TAXI = 3;                               // giây chạy đà trên đường băng
const CLIMB = 230;                            // m/s (rút gọn cho vui)
const FREE = 190;                             // m/s rơi tự do
const CHUTE = 55;                             // m/s dưới dù
export const AUTO_OPEN = 900;                 // tự bung dù ở độ cao này
export const CHUTE_MIN_FREE = 1.2;            // rơi ít nhất chừng này giây mới cho bung dù

/** Độ cao máy bay sau khi lên máy bay t giây */
export const planeAlt = (t: number) => Math.min(TOP, Math.max(0, (t - TAXI) * CLIMB));

/** Độ cao và vị trí ngang hiện tại (m) của một người */
export function altOf(j: Jump | null | undefined, now: number): number {
  if (!j) return 0;
  const t = Math.max(0, (now - j.at) / 1000);
  if (j.ph === 'plane') return planeAlt(t);
  if (j.ph === 'free') return Math.max(0, (j.alt ?? TOP) - FREE * t);
  if (j.ph === 'chute') return Math.max(0, (j.alt ?? AUTO_OPEN) - CHUTE * t);
  return 0;
}
/** Cửa máy bay ở đâu so với hồng tâm (theo chuyến bay, cố định) */
export const doorX = (planeAt: number) => Math.round((seeded(`plane:${planeAt}`)() - 0.5) * 120);

/** Đánh giá cú hạ cánh theo khoảng cách tới hồng tâm */
export function landingNote(x: number) {
  const d = Math.abs(Math.round(x));
  if (d <= 3) return `🎯 Trúng hồng tâm! (cách ${d}m)`;
  if (d <= 10) return `🌟 Hạ cánh đẹp — cách tâm ${d}m`;
  if (d <= 25) return `👍 Ổn áp — cách tâm ${d}m`;
  return `🌾 Đáp xuống bãi cỏ — cách tâm ${d}m`;
}

// ───────── Hình vẽ ─────────

function ell(p: Pen, cx: number, cy: number, rx: number, ry: number, c: string) {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const w = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2));
    if (w >= 0.5) p.rect(Math.round(cx - w), y, Math.round(w * 2), 1, c);
  }
}

/** Máy bay thả dù (nhìn ngang, bay sang phải), cửa hông mở */
export const planeSprite = () => makeSprite('skyplane:v1', 96, 30, p => {
  const body = '#f4f0f8', shade = '#c8c0d8', stripe = '#e8607a';
  for (let x = 6; x < 88; x++) { const t = x < 20 ? (x - 6) / 14 : x > 76 ? (88 - x) / 12 : 1; const h = Math.round(5 + t * 5); p.rect(x, 16 - h, 1, h * 2, body); p.px(x, 16 + h - 1, shade); }
  p.rect(10, 15, 76, 2, stripe);
  for (let y = 0; y < 12; y++) p.rect(4 + Math.round(y * 0.6), 4 + y, 8 - Math.round(y * 0.4), 1, y < 3 ? stripe : body);   // đuôi đứng
  p.rect(2, 13, 14, 3, body);                                                                      // đuôi ngang
  for (let x = 30; x < 64; x++) p.rect(x, 17 + Math.round((x - 30) * 0.08), 1, 3, x % 6 ? '#dcd4e8' : shade);   // cánh
  for (let x = 66; x < 84; x += 5) p.rect(x, 10, 3, 3, '#7ab8e8');                               // cửa sổ
  for (let x = 20; x < 40; x += 5) p.rect(x, 10, 3, 3, '#7ab8e8');
  p.rect(44, 8, 14, 14, '#3a3448'); p.rect(45, 9, 12, 12, '#4a4458');                              // cửa hông mở
  p.rect(84, 12, 6, 8, '#d8d0e0'); p.rect(90, 9, 2, 14, '#8a8098');                                // mũi + cánh quạt
  p.rect(48, 24, 2, 4, '#8a8098'); p.rect(70, 24, 2, 4, '#8a8098'); p.rect(46, 27, 6, 2, '#3a3448'); p.rect(68, 27, 6, 2, '#3a3448');   // càng
});

/** Tán dù (2 màu xen kẽ) */
export const canopySprite = (c: string) => makeSprite(`canopy:${c}`, 34, 22, p => {
  for (let y = 0; y < 10; y++) {
    const half = Math.round(Math.sqrt(1 - ((9 - y) / 10) ** 2) * 16) + 1;
    for (let x = 17 - half; x < 17 + half; x++) p.px(x, y, Math.floor((x + 1) / 5) % 2 ? c : '#fffaf0');
  }
  for (let x = 1; x < 33; x += 4) p.rect(x, 10, 3, 1, mix(c, '#3a2a4a', 0.25));
  // dây dù chụm xuống tay người
  for (const x0 of [2, 9, 25, 32]) for (let y = 11; y < 22; y++) p.px(Math.round(x0 + ((17 - x0) * (y - 11)) / 11), y, '#8a8098');
});
/** Dù xếp nằm trên cỏ sau khi đáp */
export const canopyDownSprite = (c: string) => makeSprite(`canopy-down:${c}`, 26, 6, p => {
  for (let x = 0; x < 26; x++) { const h = 2 + Math.round(Math.sin(x / 3) + 1); p.rect(x, 6 - h, 1, h, Math.floor(x / 5) % 2 ? c : '#fffaf0'); }
});

/** Bãi đáp: cỏ xanh, hồng tâm, đường băng, nhà chứa máy bay, cờ gió, hàng cây, đồi xa. Mặt đất ở y = 60 (trong ảnh). */
export function airfieldSprite(phase: Phase) {
  return makeSprite(`airfield:v1:${phase}`, 320, 96, p => {
    const night = phase === 'night', d = (c: string) => (night ? mix(c, '#141a3a', 0.55) : phase === 'sunset' ? mix(c, '#ff9a6a', 0.15) : c);
    const G = 60, rand = seeded('airfield');
    // đồi xa + rừng
    for (let x = 0; x < 320; x++) { const h = 14 + Math.round(Math.sin(x / 31) * 6 + Math.sin(x / 11) * 2); p.rect(x, G - h, 1, h, d('#7aa8a0')); }
    for (let x = 0; x < 320; x += 3) { const h = 5 + Math.round(rand() * 5); ell(p, x, G - h, 2.5, h * 0.6, d(x % 2 ? '#4a8a4a' : '#3a7a44')); }
    // cỏ
    for (let y = G; y < 96; y++) p.rect(0, y, 320, 1, d(mix('#7ac860', '#5aa84a', (y - G) / 36)));
    for (let i = 0; i < 500; i++) p.px(Math.floor(rand() * 320), G + 1 + Math.floor(rand() * 35), d(rand() < 0.5 ? '#9ad870' : '#4a9a3a'));
    for (let i = 0; i < 40; i++) p.px(Math.floor(rand() * 320), G + 4 + Math.floor(rand() * 30), d(['#ffffff', '#f6d84a', '#f59ab3'][i % 3]));   // hoa dại
    // đường băng
    p.rect(0, G + 2, 120, 6, d('#6a6a78')); for (let x = 4; x < 120; x += 12) p.rect(x, G + 4, 6, 1, d('#f4f0e8'));
    // nhà chứa máy bay
    p.rect(14, G - 22, 40, 22, d('#c8ccd8')); for (let x = 14; x < 54; x += 4) p.rect(x, G - 22, 1, 22, d('#a8acb8'));
    for (let y = 0; y < 6; y++) p.rect(12 + y, G - 28 + y, 44 - y * 2, 1, d('#e8607a'));
    p.rect(24, G - 14, 20, 14, d('#4a4a5a'));
    // cờ gió
    p.rect(64, G - 20, 1, 20, d('#e8e0d8')); for (let i = 0; i < 4; i++) p.rect(65 + i * 2, G - 20 + Math.round(i * 0.4), 2, 3, d(i % 2 ? '#ffffff' : '#f7894a'));
    // hồng tâm (giữa ảnh = x 200)
    for (const [r, c] of [[26, '#ffffff'], [21, '#e8604a'], [15, '#ffffff'], [9, '#e8604a'], [3, '#ffffff']] as const) ell(p, 200, G + 12, r, r * 0.32, d(c));
    // hàng rào + cây
    for (let x = 240; x < 320; x += 6) { p.rect(x, G - 4, 1, 5, d('#c8a070')); } p.rect(240, G - 3, 80, 1, d('#c8a070'));
    for (const x of [260, 290, 312]) { p.rect(x, G - 14, 2, 14, d('#8a5a3c')); ell(p, x + 1, G - 18, 6, 6, d('#4a9a4a')); ell(p, x - 1, G - 20, 3, 3, d('#6aba5a')); }
  }, null);
}
export const AIRFIELD = { w: 320, h: 96, ground: 60, target: 200 };
