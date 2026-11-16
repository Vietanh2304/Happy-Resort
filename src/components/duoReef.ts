// Ba màn dưới biển cho hai người (ở chỗ lặn ngắm san hô): cưỡi rùa biển qua đường hầm san hô gặp đàn cá heo & cá đuối,
// đêm biển phát quang (sinh vật phát sáng, sứa đèn lồng, trái tim plankton), săn ngọc trai trong cung điện san hô.
import type { DuoCfg, F } from './Duo';
import { bake, circ, ell, heart, line, poly, R, twinkle, type Ctx } from '../lib/canvasArt';
import { haloAt, mix, rr } from './duoSky';

const W = 320, H = 180, TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const grad = (c: Ctx, y0: number, y1: number, cols: string[]) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); };
const scroll = (c: Ctx, im: HTMLCanvasElement, off: number, y: number) => { const w = im.width / 2, o = ((off % w) + w) % w; c.drawImage(im, -o, y, w, im.height / 2); c.drawImage(im, w - o, y, w, im.height / 2); };
const putAt = (f: F, im: HTMLImageElement, x: number, foot: number, sc: number, flip = false) => { if (im.width) f.put(im, x - (im.width * sc) / 2, foot - im.height * sc, sc, flip); };
const fadeIn = (c: Ctx, el: number) => { if (el < 1200) { c.globalAlpha = 1 - el / 1200; c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; } };
const lit = (c: Ctx, fn: () => void) => { c.save(); c.globalCompositeOperation = 'lighter'; fn(); c.restore(); };
/** tia nắng xiên xuống nước, đung đưa */
const rays = (c: Ctx, t: number, a: number) => { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const x = 20 + k * 58 + Math.sin(t * 0.4 + k) * 10; c.globalAlpha = a * (0.5 + 0.5 * Math.sin(t * 0.7 + k * 1.7)); poly(c, [x, 0, x + 16, 0, x + 64, H, x + 30, H], '#9adcff22'); } c.restore(); };
/** gợn sáng caustics trên mặt cát */
const caustics = (c: Ctx, t: number, y0: number, col: string) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.strokeStyle = col; c.lineWidth = 0.7; for (let k = 0; k < 14; k++) { c.beginPath(); for (let x = 0; x <= W; x += 8) c.lineTo(x, y0 + k * 4 + Math.sin(x * 0.07 + t * 1.6 + k) * 2); c.stroke(); } c.restore(); };
const bubbles = (c: Ctx, t: number, x: number, y: number, n: number, seed: number) => { for (let k = 0; k < n; k++) { const q = (t * 0.35 + rr(k, seed)) % 1, bx = x + Math.sin(q * 9 + k) * 4 + (rr(k, seed + 1) - 0.5) * 20; c.globalAlpha = 0.8 * (1 - q); circ(c, bx, y - q * 90, 0.8 + rr(k, seed + 2) * 1.4, '#e8faff'); R(c, bx - 0.4, y - q * 90 - 0.6, 0.5, 0.5, '#ffffff'); } c.globalAlpha = 1; };
function fish(c: Ctx, x: number, y: number, s: number, col: string, dir = -1, wag = 0) {
  ell(c, x, y, 4 * s, 2 * s, col); poly(c, [x - dir * 3.4 * s, y, x - dir * 6.5 * s, y - (2 + wag) * s, x - dir * 6.5 * s, y + (2 - wag) * s], mix(col, '#000000', 0.15));
  R(c, x + dir * 2 * s - 0.4, y - 0.8 * s, 0.8, 0.8, '#1a1a2a'); R(c, x - 1, y - 2 * s, 2 * s, 0.6, mix(col, '#ffffff', 0.4));
}
function dolphin(c: Ctx, x: number, y: number, a: number, s = 1) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  ell(c, 0, 0, 16, 5, '#7a9ac8'); ell(c, 2, 2, 12, 3, '#d8e8f8'); poly(c, [14, -1, 22, -1, 14, 2], '#7a9ac8');
  poly(c, [-2, -4, 3, -10, 5, -4], '#6a8ab8'); poly(c, [-14, 0, -21, -6, -19, 0, -21, 6], '#6a8ab8'); R(c, 9, -2, 1, 1, '#1a2a3a');
  c.restore();
}
function manta(c: Ctx, x: number, y: number, t: number, col: string, glowEdge = false) {
  const fl = Math.sin(t * 2.4) * 7;
  poly(c, [x - 34, y - fl, x - 6, y - 8, x + 6, y - 8, x + 34, y - fl, x + 8, y + 8, x - 8, y + 8], col);
  poly(c, [x - 6, y - 8, x + 6, y - 8, x + 2, y + 10, x - 2, y + 10], mix(col, '#ffffff', 0.15)); line(c, x, y + 8, x, y + 26, 0.8, col);
  if (glowEdge) lit(c, () => { for (let k = 0; k <= 10; k++) { const q = k / 10; haloAt(c, x - 34 + q * 28, y - fl + q * (fl - 8), 3, '#5af0ff', 0.6); haloAt(c, x + 34 - q * 28, y - fl + q * (fl - 8), 3, '#5af0ff', 0.6); } });
}
function jelly(c: Ctx, x: number, y: number, t: number, col: string, s = 1) {
  const p = 1 + Math.sin(t * 3) * 0.12;
  lit(c, () => haloAt(c, x, y, 14 * s, col, 0.55));
  c.globalAlpha = 0.85; ell(c, x, y, 7 * s * p, 5 * s / p, mix(col, '#ffffff', 0.35)); c.globalAlpha = 1;
  R(c, x - 6 * s * p, y, 12 * s * p, 1, col);
  for (let k = 0; k < 5; k++) { const tx = x - 4 * s + k * 2 * s; c.strokeStyle = col; c.globalAlpha = 0.7; c.lineWidth = 0.6; c.beginPath(); c.moveTo(tx, y + 1); for (let j = 1; j < 7; j++) c.lineTo(tx + Math.sin(t * 3 + j + k) * 1.5, y + 1 + j * 2.2 * s); c.stroke(); c.globalAlpha = 1; }
}
/** hai đứa (đang có mặt), đứng/ngồi cạnh nhau */
const pair = (f: F, x: number, foot: number, frame: 'sit' | 'idle', sc: number, gap = 15, bob = 0) =>
  f.seats.forEach((p, i) => { if (p) putAt(f, p.img(frame), x + (i - 0.5) * gap, foot + Math.sin(f.t * 2 + i) * bob, sc); });
const kissing = (f: F) => f.n === 2 && [0, 1].some(i => f.last(i, 'kiss') < 3500);

// ═════════ 1. Cưỡi rùa biển qua đường hầm san hô ═════════
const T_MS = 64000;
const coralFar = () => bake('reef:far', 640, 110, (c, rnd) => {
  for (let k = 0; k < 26; k++) { const x = rnd() * 640, w = 20 + rnd() * 40, h = 20 + rnd() * 50; ell(c, x, 110, w, h, rnd() < 0.5 ? '#0d4a6a' : '#115a7a'); }
  for (let k = 0; k < 14; k++) { const x = rnd() * 640; for (let j = 0; j < 5; j++) line(c, x, 110, x + (j - 2) * 6, 110 - 30 - rnd() * 25, 2, '#0f5270'); }
});
const coralNear = () => bake('reef:near', 640, 80, (c, rnd) => {
  for (let x = 0; x < 640; x += 4) R(c, x, 64 + Math.sin(x * 0.05) * 3, 4, 20, x % 8 ? '#e8d4a8' : '#f2e2bc');
  for (let k = 0; k < 22; k++) {
    const x = 10 + k * 29 + rnd() * 10, kind = k % 5, col = ['#ff7aa8', '#ffb84a', '#b88aff', '#ff5a6a', '#5ad8c8'][Math.floor(rnd() * 5)];
    if (kind === 0) { for (let j = 0; j < 9; j++) { const a = -Math.PI / 2 + (j - 4) * 0.28; line(c, x, 66, x + Math.cos(a) * 22, 66 + Math.sin(a) * 22, 2, col); } }   // san hô quạt
    else if (kind === 1) { circ(c, x, 58, 10, col); for (let j = 0; j < 6; j++) line(c, x - 8, 54 + j * 2, x + 8, 54 + j * 2, 0.6, mix(col, '#000000', 0.2)); }   // san hô não
    else if (kind === 2) { for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (j - 3) * 0.35, h = 10 + rnd() * 8; line(c, x, 66, x + Math.cos(a) * h, 66 + Math.sin(a) * h, 2.4, col); circ(c, x + Math.cos(a) * h, 66 + Math.sin(a) * h, 1.6, mix(col, '#ffffff', 0.4)); } }   // hải quỳ
    else if (kind === 3) { line(c, x, 66, x, 34, 3, col); line(c, x, 50, x - 9, 40, 2.4, col); line(c, x, 44, x + 8, 32, 2.4, col); }   // san hô sừng hươu
    else { for (let j = 0; j < 4; j++) ell(c, x + (j - 1.5) * 5, 62 - j % 2 * 3, 4, 7, col); }   // bọt biển ống
  }
});
function drawTurtle(f: F) {
  const { c, el, t } = f, sp = el * 0.02;
  grad(c, 0, H, ['#3fb8e8', '#1a84c8', '#0d5a9a', '#08386a']);
  rays(c, t, 1);
  c.globalAlpha = 0.75; scroll(c, coralFar(), sp * 0.4, 70); c.globalAlpha = 1;
  // đàn cá nhỏ bơi ngược chiều, lượn sóng
  for (let k = 0; k < 46; k++) { const x = ((rr(k, 3) * 700 - el * (0.03 + rr(k, 4) * 0.02)) % 700 + 700) % 700 - 40, y = 20 + rr(k, 5) * 110 + Math.sin(t * 2 + k) * 3; fish(c, x, y, 0.7 + rr(k, 6) * 0.5, ['#ffd24a', '#ff8a5a', '#5ad8ff', '#ffffff', '#ff6ab0'][k % 5], -1, Math.sin(t * 9 + k)); }
  // cá heo nhảy múa qua (18–30s) và mỗi lần bấm gọi cá heo
  const calls = f.taps.filter(x => x.id === 'dolphin').map(x => el - (f.now - x.at));
  for (const t0 of [18000, 21500, 25000, ...calls]) { const q = (el - t0) / 7000; if (q < 0 || q > 1) continue; for (let d = 0; d < 3; d++) { const qq = q - d * 0.06, x = -30 + qq * 380, y = 60 + Math.sin(qq * TAU * 1.5) * 26 + d * 10; dolphin(c, x, y, Math.cos(qq * TAU * 1.5) * -0.5, 0.9 - d * 0.1); } lit(c, () => haloAt(c, -30 + q * 380, 60, 26, '#bfe8ff', 0.25)); }
  // cá đuối khổng lồ lướt ngang phía trên (32–46s)
  if (el > 32000 && el < 46000) { const q = (el - 32000) / 14000; c.globalAlpha = 0.9; manta(c, 360 - q * 420, 32 + Math.sin(q * 6) * 6, t, '#2a4a6a'); c.globalAlpha = 1; }
  scroll(c, coralNear(), sp, 104);
  caustics(c, t, 150, '#bfefff');
  // rùa biển chở hai đứa
  const tx = 160, ty = 104 + Math.sin(t * 1.6) * 3, fl = Math.sin(t * 2.2);
  poly(c, [tx - 18, ty + 2, tx - 34, ty + 10 + fl * 6, tx - 22, ty + 8], '#5a8a4a'); poly(c, [tx + 16, ty + 2, tx + 34, ty + 9 - fl * 6, tx + 22, ty + 8], '#5a8a4a');
  ell(c, tx + 30, ty - 1, 7, 5, '#6a9a5a'); R(c, tx + 33, ty - 3, 1.2, 1.2, '#1a2a1a');
  ell(c, tx, ty, 30, 12, '#5a3a22'); ell(c, tx, ty - 2, 28, 10, '#8a6a3a');
  for (const [dx, dy] of [[-14, -3], [0, -5], [14, -3], [-7, 2], [7, 2]]) poly(c, [tx + dx - 5, ty + dy, tx + dx - 2, ty + dy - 3, tx + dx + 2, ty + dy - 3, tx + dx + 5, ty + dy, tx + dx + 2, ty + dy + 3, tx + dx - 2, ty + dy + 3], '#a8884a');
  pair(f, tx, ty - 6, 'sit', 0.5, 16);
  // bong bóng tim
  const blow = f.taps.filter(x => x.id === 'bubble' && f.now - x.at < 4000);
  for (const b of blow) { const q = (f.now - b.at) / 4000; for (let k = 0; k < 6; k++) { const y = ty - 20 - q * 90 - k * 8, x = tx + Math.sin(q * 8 + k) * 12 + (k - 2.5) * 5; c.globalAlpha = 1 - q; heart(c, x, y, 2.2, '#ffb0d0'); R(c, x - 1.2, y - 1.2, 0.8, 0.8, '#ffffff'); } c.globalAlpha = 1; }
  bubbles(c, t, tx, ty - 8, 8, 9);
  // vòm san hô cuối đường hầm + trái tim bong bóng
  if (el > 50000) { const q = ease(clamp((el - 50000) / 5000)); c.globalAlpha = q; for (let k = 0; k <= 24; k++) { const a = Math.PI + (k / 24) * Math.PI, x = 160 + Math.cos(a) * 120, y = 150 + Math.sin(a) * 120; circ(c, x, y, 6, ['#ff7aa8', '#ffb84a', '#b88aff', '#5ad8c8'][k % 4]); }
    lit(c, () => { for (let k = 0; k < 40; k++) { const a = (k / 40) * TAU, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); haloAt(c, 160 + hx * 2.2, 46 + hy * 2.2, 3, '#ffd0e8', 0.8); } }); c.globalAlpha = 1; }
  fadeIn(c, el);
}
export const turtle: DuoCfg = {
  title: 'Cưỡi rùa biển qua đường hầm san hô', ms: T_MS, join: 25000, wait: true, price: 0,
  ask: '🐢 Cưỡi rùa biển khổng lồ bơi qua đường hầm san hô', joinAsk: '🐢 Lên lưng rùa cùng người ấy', invite: '🐢 Người ấy rủ cưỡi rùa biển đi ngắm san hô', yes: 'Lên lưng rùa!', late: 'Rùa bơi đi mất rồi — lần sau nha',
  buttons: [{ id: 'dolphin', label: '🐬 Gọi cá heo', from: 3000, to: T_MS }, { id: 'bubble', label: '🫧 Thổi bong bóng tim', from: 3000, to: T_MS }, { id: 'photo', label: '📸 Chụp', from: 3000, to: T_MS }],
  caption: el => el < 18000 ? '🐢 Rùa biển chở hai đứa lướt qua rừng san hô' : el < 32000 ? '🐬 Đàn cá heo nhảy múa chào hai đứa!' : el < 48000 ? '🦈 Cá đuối khổng lồ lướt ngang trên đầu' : '💗 Cuối đường hầm là vòm san hô và trái tim bong bóng',
  draw: drawTurtle, snap: [12000, 24000, 40000, 56000], endTitle: '🐢 Chuyến cưỡi rùa biển', endNote: 'Dưới đáy biển cũng chỉ muốn nắm tay em 💙',
};

// ═════════ 2. Đêm biển phát quang ═════════
const G_MS = 62000, G_HEART = 44000;
function drawGlow(f: F) {
  const { c, el, t } = f;
  grad(c, 0, H, ['#0a1a3a', '#061230', '#040a20', '#020612']);
  lit(c, () => { c.globalAlpha = 0.22; poly(c, [150, 0, 190, 0, 230, H, 120, H], '#8ab8ff'); c.globalAlpha = 1; haloAt(c, 170, -10, 40, '#cfe0ff', 0.5); });
  // sinh vật phù du phát sáng trôi lững lờ — sáng rực quanh hai đứa & khi khuấy nước
  const stirs = f.taps.filter(x => x.id === 'stir' && f.now - x.at < 5000).map(x => (f.now - x.at) / 5000);
  const cx = 160, cy = 100;
  lit(c, () => {
    for (let k = 0; k < 420; k++) {
      let x = (rr(k, 1) * W + Math.sin(t * 0.3 + k) * 8 + t * 2) % W, y = rr(k, 2) * H + Math.cos(t * 0.4 + k * 1.3) * 5;
      const hq = el > G_HEART ? ease(clamp((el - G_HEART - rr(k, 9) * 3000) / 4000)) : 0;   // xếp thành trái tim quanh hai đứa
      if (hq > 0 && k < 180) { const a = (k / 180) * TAU, hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); x = x + (cx + hx * 3.4 - x) * hq; y = y + (cy - 34 + hy * 3.4 - y) * hq; }
      const d = Math.hypot(x - cx, y - cy);
      let b = 0.25 + 0.2 * Math.sin(t * 3 + k) + (d < 50 ? (50 - d) / 80 : 0) + (hq > 0 && k < 180 ? 0.6 * hq : 0);
      for (const q of stirs) { const ring = Math.abs(d - q * 140); if (ring < 14) b += (1 - q) * (1 - ring / 14) * 1.4; }
      haloAt(c, x, y, 2.2 + b * 2, k % 3 ? '#5af0ff' : '#7affc8', clamp(b));
    }
  });
  // cá đuối viền sáng lướt qua
  if (el > 20000 && el < 36000) { const q = (el - 20000) / 16000; c.globalAlpha = 0.85; manta(c, -40 + q * 400, 40 + Math.sin(q * 5) * 8, t, '#0a1a2e', true); c.globalAlpha = 1; }
  // sứa đèn lồng bay lên
  const rel = f.taps.filter(x => x.id === 'jelly').map(x => el - (f.now - x.at));
  for (let k = 0; k < 9; k++) { const q = ((t * 0.04 + rr(k, 7)) % 1); jelly(c, 20 + rr(k, 8) * 280, H + 10 - q * (H + 30), t + k, ['#ff7ad8', '#b07aff', '#5ad8ff', '#ffd84a'][k % 4], 0.7 + rr(k, 4) * 0.5); }
  for (const r0 of rel) { const q = (el - r0) / 9000; if (q < 0 || q > 1) continue; for (let k = 0; k < 6; k++) jelly(c, cx + (k - 2.5) * 16 + Math.sin(q * 6 + k) * 6, cy - 10 - q * 130 - k % 2 * 10, t + k, ['#ff7ad8', '#5ad8ff', '#ffd84a'][k % 3], 0.8); }
  // hai đứa trôi lơ lửng nắm tay; hôn thì quay sang nhau giữa vòng plankton sáng
  if (kissing(f)) { f.seats.forEach((p, i) => { if (p) { const im = p.img('kiss', 0, 'side'); putAt(f, im, cx + (i ? 4 : -4), cy + 20, 0.62, i === 1); } }); lit(c, () => { for (let k = 0; k < 10; k++) { const q = (t * 0.6 + k / 10) % 1; heart(c, cx + Math.sin(k * 2.1) * 14, cy - 30 - q * 30, 2, '#ff9ad8'); } }); }
  else pair(f, cx, cy + 20, 'idle', 0.62, 16, 2.5);
  bubbles(c, t, cx, cy - 20, 6, 3);
  fadeIn(c, el);
}
export const glow: DuoCfg = {
  title: 'Đêm biển phát quang', ms: G_MS, join: 25000, wait: true, price: 0,
  ask: '✨ Lặn đêm giữa biển sinh vật phát quang', joinAsk: '✨ Lặn đêm cùng người ấy', invite: '✨ Người ấy rủ lặn đêm ngắm biển phát quang', yes: 'Lặn thôi!', late: 'Người ấy lặn xuống mất rồi — lần sau nha',
  buttons: [{ id: 'stir', label: '🌀 Khuấy nước sáng', from: 2000, to: G_MS }, { id: 'jelly', label: '🪼 Thả sứa đèn', from: 2000, to: G_MS }, { id: 'kiss', label: '💋 Hôn', from: 2000, to: G_MS }, { id: 'photo', label: '📸 Chụp', from: 2000, to: G_MS }],
  caption: el => el < 20000 ? '✨ Mỗi cái quẫy tay là một vệt sáng xanh' : el < 36000 ? '🦈 Cá đuối viền ánh sáng lướt qua' : el < G_HEART ? '🪼 Sứa đèn lồng bay lên như đèn trời' : '💗 Cả biển sáng thành trái tim quanh hai đứa',
  draw: drawGlow, snap: [14000, 28000, G_HEART + 9000], endTitle: '✨ Đêm biển phát quang', endNote: 'Cả biển sáng lên cũng không bằng nụ cười của em 💫',
};

// ═════════ 3. Săn ngọc trai ở cung điện san hô ═════════
const P_MS = 60000, CLAMS = [70, 160, 250];
const palaceBg = () => bake('reef:palace', W, H, (c, rnd) => {
  grad(c, 0, H, ['#2a9ad8', '#1470b0', '#0c4a80', '#0a3060']);
  // cung điện chìm: bậc thềm, hàng cột, mái vòm, cửa vòm
  poly(c, [60, 120, 260, 120, 270, 132, 50, 132], '#8ab8c8'); poly(c, [70, 112, 250, 112, 260, 120, 60, 120], '#a8d0dc');
  R(c, 90, 52, 140, 60, '#7aa8ba'); for (let k = 0; k < 6; k++) { const x = 96 + k * 25; R(c, x, 56, 8, 56, '#c8e8f0'); R(c, x - 1, 54, 10, 3, '#e0f4f8'); R(c, x + 1, 58, 1, 52, '#ffffff66'); }
  poly(c, [84, 54, 236, 54, 160, 30], '#9ac8d8'); circ(c, 160, 34, 22, '#8ab8ca'); circ(c, 160, 34, 18, '#a8d4e2'); R(c, 159, 6, 2, 10, '#e0c060'); circ(c, 160, 6, 2.4, '#ffe080');
  c.fillStyle = '#0c3a5a'; c.beginPath(); c.moveTo(146, 112); c.lineTo(146, 82); c.arc(160, 82, 14, Math.PI, 0); c.lineTo(174, 112); c.fill();
  // san hô mọc phủ cung điện, rong biển, cát
  for (let x = 0; x < W; x += 3) R(c, x, 132 + Math.sin(x * 0.08) * 2, 3, 50, x % 6 ? '#e8d6aa' : '#f2e4c0');
  for (let k = 0; k < 18; k++) { const x = rnd() * W, col = ['#ff7aa8', '#ffb84a', '#b88aff', '#5ad8c8'][k % 4]; for (let j = 0; j < 6; j++) { const a = -Math.PI / 2 + (j - 2.5) * 0.3, h = 8 + rnd() * 12; line(c, x, 136, x + Math.cos(a) * h, 136 + Math.sin(a) * h, 2, col); } }
  for (let k = 0; k < 10; k++) { const x = rnd() * W; for (let y = 136; y > 80 + rnd() * 30; y -= 4) circ(c, x + Math.sin(y * 0.2) * 3, y, 2.2, '#3a9a5a'); }
});
function drawPearl(f: F) {
  const { c, el, t } = f;
  c.drawImage(palaceBg(), 0, 0, W, H);
  rays(c, t, 0.8);
  for (let k = 0; k < 24; k++) { const x = ((rr(k, 2) * 380 + t * (8 + rr(k, 3) * 10) * (k % 2 ? 1 : -1)) % 380 + 380) % 380 - 30, y = 20 + rr(k, 4) * 90; fish(c, x, y, 0.7, ['#ffd24a', '#ff8a5a', '#5ad8ff'][k % 3], k % 2 ? 1 : -1, Math.sin(t * 8 + k)); }
  // ba con sò tai tượng: thở mở khép; bấm "Mở sò" thì lần lượt mở toang, ngọc trai toả sáng
  const opens = f.taps.filter(x => x.id === 'open');
  CLAMS.forEach((x, i) => {
    const mine = opens.filter((_, j) => j % 3 === i), last = mine.length ? f.now - mine[mine.length - 1].at : Infinity;
    const wide = last < 6000 ? ease(clamp(last / 700)) * (1 - ease(clamp((last - 5000) / 1000))) : 0, a = 0.12 + 0.08 * Math.sin(t * 1.2 + i) + wide * 0.6;
    ell(c, x, 146, 22, 7, '#5a4a7a'); ell(c, x, 144, 20, 6, '#8a7ab8');
    if (wide > 0.2) lit(c, () => { haloAt(c, x, 138, 20 * wide, '#fff6e0', wide); for (let k = 0; k < 6; k++) twinkle(c, x + Math.cos(t * 2 + k) * 12 * wide, 132 + Math.sin(t * 2 + k) * 8 * wide, 2, '#ffffff'); });
    circ(c, x, 140, 3.4, '#fffaf0'); R(c, x - 1.4, 138, 1.2, 1.2, '#ffffff');
    c.save(); c.translate(x - 20, 142); c.rotate(-a * 1.6); ell(c, 20, -3, 20, 7, '#9a8ac8'); for (let k = 0; k < 5; k++) line(c, 4 + k * 8, -8, 6 + k * 8, 2, 0.8, '#6a5a9a'); c.restore();
  });
  // ngọc đã tìm được bay quanh hai đứa; cuối màn kết thành chuỗi trái tim
  const found = opens.length, cx = 160, cy = 112;
  const hq = el > 44000 ? ease(clamp((el - 44000) / 4000)) : 0;
  lit(c, () => { for (let k = 0; k < Math.min(24, found * 2 + (hq > 0 ? 24 : 0)); k++) { const a = (k / 24) * TAU + t * 0.8, ox = Math.cos(a) * 26, oy = Math.sin(a) * 10 - 22; const hx = 16 * Math.pow(Math.sin((k / 24) * TAU), 3), hy = -(13 * Math.cos((k / 24) * TAU) - 5 * Math.cos(2 * (k / 24) * TAU) - 2 * Math.cos(3 * (k / 24) * TAU) - Math.cos(4 * (k / 24) * TAU)); const x = cx + ox + (hx * 2.4 - ox) * hq, y = cy + oy + (hy * 2.4 - 36 - oy) * hq; haloAt(c, x, y, 4, '#fff6e0', 0.9); circ(c, x, y, 1.6, '#fffaf0'); } });
  // cá ngựa đôi chụm đuôi thành trái tim
  for (const [sx, d] of [[118, 1], [202, -1]] as const) { const y = 70 + Math.sin(t * 1.5) * 4, x = sx; ell(c, x, y, 3, 5, '#ffb84a'); circ(c, x + d * 2, y - 6, 2.4, '#ffb84a'); R(c, x + d * 4, y - 6.5, 2.2 * d, 1, '#ffb84a'); line(c, x, y + 4, x - d * 2, y + 10, 1.4, '#ffb84a'); R(c, x + d * 2.4, y - 7, 0.8, 0.8, '#1a1a2a'); }
  if (kissing(f)) f.seats.forEach((p, i) => { if (p) putAt(f, p.img('kiss', 0, 'side'), cx + (i ? 4 : -4), cy + 16, 0.6, i === 1); });
  else pair(f, cx, cy + 16, 'idle', 0.6, 16, 1.5);
  bubbles(c, t, cx, cy - 10, 5, 5); bubbles(c, t, 70, 140, 4, 6); bubbles(c, t, 250, 140, 4, 7);
  fadeIn(c, el);
}
export const pearl: DuoCfg = {
  title: 'Săn ngọc trai ở cung điện san hô', ms: P_MS, join: 25000, wait: true, price: 0,
  ask: '🦪 Lặn xuống cung điện san hô chìm săn ngọc trai', joinAsk: '🦪 Săn ngọc cùng người ấy', invite: '🦪 Người ấy rủ đi săn ngọc trai ở cung điện san hô', yes: 'Đi săn ngọc!', late: 'Người ấy lặn xuống mất rồi — lần sau nha',
  buttons: [{ id: 'open', label: '🦪 Mở sò', from: 2500, to: 44000 }, { id: 'kiss', label: '💋 Hôn', from: 2500, to: P_MS }, { id: 'photo', label: '📸 Chụp', from: 2500, to: P_MS }],
  caption: el => el < 12000 ? '🏛️ Cung điện san hô chìm dưới đáy biển' : el < 44000 ? '🦪 Mở sò tai tượng — viên ngọc nào sáng nhất?' : '💎 Những viên ngọc kết thành chuỗi trái tim tặng người thương',
  draw: drawPearl, snap: [15000, 34000, 50000], endTitle: '🦪 Cung điện san hô', endNote: 'Ngọc trai đẹp mấy cũng không bằng em 💎',
};

export const REEF_SCENES = { turtle, glow, pearl };
