// Ba màn phiêu lưu kiểu phim hoạt hình: thu nhỏ đi lạc vào vườn khổng lồ, chuyến tàu ngân hà, xứ bánh kẹo trên mây.
import type { DuoCfg, F } from './Duo';
import { bake, circ, cloud, ell, heart, line, poly, R, star, twinkle, type Ctx } from '../lib/canvasArt';
import { fireworks, haloAt, mix, rr } from './duoSky';

const W = 320, H = 180, TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
const grad = (c: Ctx, y0: number, y1: number, cols: string[], a = 1) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); c.globalAlpha = a; c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); c.globalAlpha = 1; };
const scroll = (c: Ctx, im: HTMLCanvasElement, off: number, y: number, a = 1) => { const w = im.width / 2, o = ((off % w) + w) % w; c.globalAlpha = a; c.drawImage(im, -o, y, w, im.height / 2); c.drawImage(im, w - o, y, w, im.height / 2); c.globalAlpha = 1; };
const putAt = (f: F, im: HTMLImageElement, x: number, foot: number, sc: number, flip = false) => { if (im.width) f.put(im, x - (im.width * sc) / 2, foot - im.height * sc, sc, flip); };
const fadeIn = (c: Ctx, el: number) => { if (el < 1200) { c.globalAlpha = 1 - el / 1200; c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; } };
const heartsUp = (c: Ctx, t: number, x: number, y: number, n = 5) => { for (let k = 0; k < n; k++) { const q = (t * 0.7 + k / n) % 1; c.globalAlpha = 1 - q; heart(c, x + Math.sin(k * 2.3 + q * 5) * 7, y - q * 26, 1.3 + (k % 2) * 0.6, k % 2 ? '#ff8ab0' : '#ff4a7a'); } c.globalAlpha = 1; };

// ═════════ 1. Đèn pin thu nhỏ: lạc vào vườn khổng lồ ═════════
const T_SHRINK = 4500, T_FLY = 21000, T_SIT = 41000, T_MS = 64000;
const giantFlowers = () => bake('dream:giant', 640, 180, (c, rnd) => {
  for (let k = 0; k < 9; k++) {
    const x = 30 + k * 72 + rnd() * 20, top = 18 + rnd() * 40, col = ['#ff8ab0', '#ffd24a', '#ffffff', '#b88aff', '#ff6a6a', '#8ad8ff'][k % 6];
    c.strokeStyle = '#3a8a3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, 180); c.quadraticCurveTo(x + 14, 100, x, top); c.stroke();
    c.lineWidth = 2; c.strokeStyle = '#5aaa4a'; c.beginPath(); c.moveTo(x - 1, 180); c.quadraticCurveTo(x + 12, 100, x - 1, top); c.stroke();
    ell(c, x + 14, 120, 18, 6, '#4a9a3a', -0.5); ell(c, x - 12, 140, 16, 5, '#5aaa4a', 0.5);
    if (k % 3 === 0) { for (let j = 0; j < 12; j++) { const a = j * TAU / 12; ell(c, x + Math.cos(a) * 14, top + Math.sin(a) * 14, 9, 4, col, a); } circ(c, x, top, 8, '#ffc83a'); for (let j = 0; j < 14; j++) circ(c, x + (rnd() - 0.5) * 10, top + (rnd() - 0.5) * 10, 0.8, '#d89a2a'); }
    else if (k % 3 === 1) { poly(c, [x - 13, top - 4, x - 9, top + 16, x + 9, top + 16, x + 13, top - 4, x + 6, top + 4, x, top - 8, x - 6, top + 4], col); poly(c, [x - 6, top + 4, x, top - 8, x + 6, top + 4, x, top + 12], mix(col, '#ffffff', 0.3)); }
    else { for (let j = 0; j < 5; j++) circ(c, x + Math.cos(j * 1.25) * 7, top + Math.sin(j * 1.25) * 7, 8, mix(col, '#000000', 0.1)); circ(c, x, top, 7, col); circ(c, x - 2, top - 2, 3, mix(col, '#ffffff', 0.4)); }
  }
});
const grassMid = () => bake('dream:grass', 640, 90, (c, rnd) => {
  for (let k = 0; k < 90; k++) { const x = rnd() * 640, h = 30 + rnd() * 55, b = rnd() * 16 - 8; c.fillStyle = rnd() < 0.5 ? '#4aa04a' : '#6ab85a'; c.beginPath(); c.moveTo(x - 3, 90); c.quadraticCurveTo(x + b * 0.5, 90 - h * 0.6, x + b, 90 - h); c.quadraticCurveTo(x + b * 0.5 + 1, 90 - h * 0.6, x + 3, 90); c.fill(); }
  for (let k = 0; k < 5; k++) { // nhà nấm có cửa sổ
    const x = 50 + k * 128 + rnd() * 30, y = 90; R(c, x - 6, y - 22, 12, 22, '#fbefdc'); R(c, x - 2, y - 9, 4, 9, '#8a5a3a'); R(c, x - 5, y - 19, 3, 3, '#ffd27a'); R(c, x + 2, y - 19, 3, 3, '#ffd27a');
    ell(c, x, y - 24, 18, 10, '#e8303a'); ell(c, x, y - 21, 17, 4, '#c8202a'); for (let j = 0; j < 6; j++) circ(c, x - 12 + j * 5, y - 27 + (j % 2) * 3, 1.6, '#ffffff'); }
  for (let k = 0; k < 8; k++) { const x = rnd() * 640, y = 30 + rnd() * 40; ell(c, x, y + 4, 12, 3, '#3a8a3a', 0.2); circ(c, x, y, 5, '#cfeeff'); circ(c, x - 1.6, y - 1.6, 1.6, '#ffffff'); }
});
function drawTiny(f: F) {
  const { c, el, t } = f, dusk = ease(clamp((el - T_SIT + 4000) / 10000));
  const v = el < T_SHRINK ? 0 : el < T_FLY ? 7 : el < T_SIT ? 16 : Math.max(0, 16 - (el - T_SIT) / 200);
  const wx = (el < T_SHRINK ? 0 : (Math.min(el, T_FLY) - T_SHRINK) / 1000 * 7 + (el > T_FLY ? (Math.min(el, T_SIT) - T_FLY) / 1000 * 16 : 0) + (el > T_SIT ? Math.min(4000, el - T_SIT) / 1000 * 8 : 0));
  void v;
  grad(c, 0, H, ['#8ac8ff', '#c8e8ff', '#fff4e0']); if (dusk > 0) grad(c, 0, H, ['#1a1a5a', '#7a3a8a', '#ff9a7a'], dusk);
  if (dusk > 0.5) { haloAt(c, 260, 26, 20, '#fff6d8', dusk * 0.6); circ(c, 260, 26, 7, '#fff8e0'); }
  c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, 60, 10, 90, '#fff6c8', 0.5 * (1 - dusk)); c.restore();
  scroll(c, giantFlowers(), wx * 2, 0, 1); if (dusk > 0) { c.globalAlpha = dusk * 0.45; c.fillStyle = '#2a1a5a'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  scroll(c, grassMid(), wx * 5, 90);
  R(c, 0, 160, W, 20, dusk > 0.5 ? '#3a5a3a' : '#5a9a3a'); for (let k = 0; k < 30; k++) { const x = ((rr(k, 3) * 400 - wx * 8) % 400 + 400) % 400 - 40; ell(c, x, 166 + rr(k, 4) * 10, 6, 2, '#4a8a3a', 0.3); }
  // giọt sương khổng lồ ngay cạnh lối đi, chạm vào lấp lánh cầu vồng
  const dew = f.taps.filter(x => x.id === 'dew' && f.now - x.at < 2000).length;
  { const x = ((200 - wx * 8) % 480 + 480) % 480 - 80, y = 136; ell(c, x, y + 12, 22, 4, '#3a8a3a'); c.globalAlpha = 0.55; circ(c, x, y, 14, '#bfe8ff'); c.globalAlpha = 1; circ(c, x - 5, y - 5, 4, '#ffffff'); ell(c, x + 4, y + 6, 5, 2, '#ffffffa0');
    if (dew || dusk < 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { c.globalAlpha = 0.25 + (dew ? 0.3 : 0); c.strokeStyle = ['#ff5a5a', '#ffb04a', '#ffe84a', '#5aff7a', '#5ab8ff', '#b05aff'][k]; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, 18 + k * 1.4, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } c.restore(); c.globalAlpha = 1; } }
  // đèn pin thu nhỏ: chùm sáng chiếu xuống, hai đứa nhỏ dần
  const sc = el < T_SHRINK ? lerp(0.6, 0.34, ease(clamp((el - 1500) / 2500))) : 0.34;
  if (el < T_SHRINK + 800) { const a = el < T_SHRINK ? 1 : 1 - (el - T_SHRINK) / 800; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * a; poly(c, [140, -10, 180, -10, 200, 150, 120, 150], '#fff6c0'); c.globalAlpha = 1; for (let k = 0; k < 20; k++) twinkle(c, 130 + rr(k, 5) * 60, 160 - ((t * 40 + k * 9) % 150), 1.2, '#ffffff'); c.restore(); }
  const fire = f.taps.filter(x => x.id === 'firefly' && f.now - x.at < 4000).length;
  if (el < T_FLY) f.seats.forEach((p, i) => { if (!p) return; const im = el < T_SHRINK ? p.img('idle') : p.img('walk', Math.floor(t * 6) % 4, 'side'); putAt(f, im, 150 + i * 14 * sc / 0.34, 150, sc); });
  else if (el < T_SIT + 2000) { // cưỡi bướm
    const y = 90 + Math.sin(t * 1.3) * 14 - (el < T_FLY + 2000 ? (1 - (el - T_FLY) / 2000) * -60 : 0), x = 160, fl = Math.abs(Math.sin(t * 7));
    for (const sd of [-1, 1]) { ell(c, x + sd * 18 * fl, y - 12, 20 * fl + 3, 15, '#5ab8ff', sd * 0.4); ell(c, x + sd * 18 * fl, y - 12, 14 * fl + 2, 10, '#8ad8ff', sd * 0.4); ell(c, x + sd * 13 * fl, y + 5, 13 * fl + 3, 10, '#ff8ad8', sd * 0.4); circ(c, x + sd * 19 * fl, y - 14, 4, '#ffffff'); circ(c, x + sd * 13 * fl, y + 6, 2.4, '#ffe0f4'); }
    ell(c, x, y, 4, 18, '#3a2a4a', Math.PI / 2); circ(c, x + 18, y - 1, 3, '#3a2a4a'); line(c, x + 19, y - 3, x + 26, y - 12, 0.6, '#3a2a4a'); line(c, x + 20, y - 3, x + 29, y - 7, 0.6, '#3a2a4a'); circ(c, x + 26, y - 12, 0.9, '#3a2a4a'); circ(c, x + 29, y - 7, 0.9, '#3a2a4a');
    f.seats.forEach((p, i) => { if (p) putAt(f, p.img('sit', 0, 'side'), x - 6 + i * 11, y - 3, 0.32); });
    c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 8; k++) haloAt(c, x - 10 - k * 6, y + Math.sin(t * 3 - k) * 3, 3, '#8affff', 0.5 - k * 0.05); c.restore(); }
  if (el > T_SIT) { // ngồi trên cánh hoa súng khổng lồ lúc hoàng hôn
    const x = 160, y = 140, a = clamp((el - T_SIT) / 2000);
    c.globalAlpha = a; for (let j = 0; j < 10; j++) { const an = Math.PI + j * Math.PI / 9; ell(c, x + Math.cos(an) * 26, y + Math.sin(an) * 9, 16, 6, j % 2 ? '#ffb0d0' : '#ffd0e4', an); } ell(c, x, y + 4, 34, 6, '#3a8a5a'); c.globalAlpha = 1;
    if (el > T_SIT + 2000) f.seats.forEach((p, i) => { if (p) putAt(f, p.img('sit', 0, 'back'), x - 6 + i * 12, y - 1, 0.34); });
    heartsUp(c, t, x, y - 20, 4); }
  // đom đóm bay lên như đèn lồng
  const nf = Math.round(dusk * 40) + fire * 30;
  c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < nf; k++) { const x = (rr(k, 6) * W + Math.sin(t * 0.6 + k) * 10) % W, y = H - ((t * (5 + rr(k, 7) * 6) + rr(k, 8) * H) % H), a = 0.5 + 0.5 * Math.sin(t * 3 + k); haloAt(c, x, y, 4, '#d8ff6a', a * 0.8); R(c, x - 0.4, y - 0.4, 0.8, 0.8, '#ffffd0'); } c.restore();
  fadeIn(c, el);
}
export const tiny: DuoCfg = {
  title: 'Thu nhỏ phiêu lưu vườn khổng lồ', ms: T_MS, join: T_SHRINK, price: 0,
  ask: '🔦 Bật đèn pin thu nhỏ, hai đứa đi lạc vào khu vườn khổng lồ', joinAsk: '🔦 Thu nhỏ cùng người ấy', invite: '🔦 Người ấy rủ thu nhỏ đi phiêu lưu trong vườn', yes: 'Thu nhỏ thôi!', late: 'Người ấy thu nhỏ đi mất rồi — lần sau nha',
  buttons: [{ id: 'dew', label: '💧 Chạm giọt sương', from: T_SHRINK, to: T_FLY }, { id: 'firefly', label: '✨ Gọi đom đóm', from: T_SHRINK, to: T_MS }, { id: 'photo', label: '📸 Chụp', from: T_SHRINK, to: T_MS }],
  caption: el => el < T_SHRINK ? '🔦 Bật đèn pin thu nhỏ… bé dần, bé dần…' : el < T_FLY ? '🌼 Hoa cao như toà nhà, giọt sương to như hồ nước!' : el < T_SIT ? '🦋 Cưỡi bướm bay qua vườn hoa' : '🌸 Ngồi trên cánh hoa ngắm đom đóm lên đèn',
  draw: drawTiny, snap: [12000, 30000, 52000], endTitle: '🔦 Chuyến phiêu lưu tí hon', endNote: 'Thế giới to quá, may mà có nhau 💗',
};

// ═════════ 2. Chuyến tàu ngân hà ═════════
const GX_B = 5000, GX_R = 56000, GX_MS = GX_B + GX_R + 4000;
const nebula = () => bake('dream:nebula', 640, 180, (c, rnd) => {
  const g = c.createLinearGradient(0, 0, 0, 180); g.addColorStop(0, '#04021a'); g.addColorStop(0.5, '#120a3a'); g.addColorStop(1, '#0a1440'); c.fillStyle = g; c.fillRect(0, 0, 640, 180);
  for (let k = 0; k < 26; k++) { const x = rnd() * 640, y = 20 + rnd() * 140, r = 30 + rnd() * 60, col = ['#8a3aff', '#ff4ab8', '#3a8aff', '#3affd8'][k % 4]; const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col + '40'); rg.addColorStop(1, col + '00'); c.fillStyle = rg; c.fillRect(x - r, y - r, r * 2, r * 2); }
  c.save(); c.translate(320, 90); c.rotate(-0.25); for (let k = 0; k < 900; k++) { const x = (rnd() - 0.5) * 760, y = (rnd() + rnd() + rnd() - 1.5) * 26; c.globalAlpha = 0.3 + rnd() * 0.7; R(c, x, y, 0.5, 0.5, rnd() < 0.3 ? '#ffe8f8' : '#ffffff'); } c.restore(); c.globalAlpha = 1;
  for (let k = 0; k < 260; k++) R(c, rnd() * 640, rnd() * 180, 0.5, 0.5, '#ffffff');
});
function spaceTrain(f: F, y: number, lean: number) {
  const { c, t } = f;
  const car = (x: number, w: number) => { R(c, x, y, w, 18, '#1a2a6a'); R(c, x, y, w, 2, '#ffd24a'); R(c, x, y + 15, w, 1, '#ffd24a'); poly(c, [x - 1, y, x + w / 2, y - 5, x + w + 1, y], '#2a3a8a'); for (let k = 0; k < 2; k++) { circ(c, x + 7 + k * (w - 14), y + 19, 2.6, '#3a3a5a'); circ(c, x + 7 + k * (w - 14), y + 19, 1, '#ffd24a'); } };
  car(30, 60); car(94, 86);
  // đầu máy hơi nước
  R(c, 184, y + 2, 50, 16, '#1a2a6a'); ell(c, 222, y + 8, 14, 8, '#2a3a8a'); R(c, 184, y - 6, 20, 24, '#1a2a6a'); R(c, 186, y - 3, 16, 9, '#ffe0a0'); R(c, 220, y - 10, 6, 12, '#2a2a4a'); R(c, 218, y - 12, 10, 3, '#ffd24a'); R(c, 184, y - 7, 22, 2, '#ffd24a');
  for (let k = 0; k < 3; k++) { circ(c, 194 + k * 14, y + 19, 4, '#3a3a5a'); circ(c, 194 + k * 14, y + 19, 1.5, '#ffd24a'); line(c, 194 + k * 14, y + 19, 194 + k * 14 + Math.cos(t * 10) * 3.5, y + 19 + Math.sin(t * 10) * 3.5, 0.6, '#ffd24a'); }
  circ(c, 236, y + 8, 2, '#fff6c0'); c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, 240, y + 8, 18, '#fff6c0', 0.6); c.restore();
  // khói bằng sao
  for (let k = 0; k < 10; k++) { const q = ((t * 0.8 + k / 10) % 1), x = 223 - q * 70, yy = y - 14 - q * 30 + Math.sin(q * 8 + k) * 3; c.globalAlpha = 1 - q; star(c, x, yy, 1.5 + q * 2, ['#ffffff', '#ffd8f8', '#c8e8ff'][k % 3], t + k); } c.globalAlpha = 1;
  // cửa sổ toa sáng ấm: hai đứa ngồi trong
  for (let k = 0; k < 3; k++) R(c, 34 + k * 19, y + 4, 14, 9, '#ffd890');
  const gx = 98, gw = 78; R(c, gx, y + 3, gw, 11, '#ffe0a0');
  c.save(); c.beginPath(); c.rect(gx, y + 3, gw, 11); c.clip(); f.seats.forEach((p, i) => { if (p) f.put(lean ? p.img('act', 12) : p.img('idle'), gx + 22 + i * 22 + (lean && i === 0 ? 3 : 0) - (p.img('idle').width * 0.5) / 2, y + 2, 0.5, i === 1); }); c.restore();
  c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) haloAt(c, 40 + k * 36, y + 8, 12, '#ffc870', 0.35); c.restore();
  if (lean) heartsUp(c, t, gx + 40, y - 2);
}
function drawGalaxy(f: F) {
  const { c, el, t } = f, s = clamp((el - GX_B) / GX_R), wx = s * 3000 + (el < GX_B ? 0 : 0);
  scroll(c, nebula(), wx * 0.05 + t * 0.5, 0);
  for (let k = 0; k < 80; k++) { const x = ((rr(k, 1) * 480 - wx * (0.3 + rr(k, 2) * 0.5)) % 480 + 480) % 480 - 80, y = rr(k, 3) * H, a = 0.5 + 0.5 * Math.sin(t * 2 + k); if (rr(k, 4) < 0.15) twinkle(c, x, y, 1 + a, '#ffffff'); else { c.globalAlpha = a; R(c, x, y, 0.6, 0.6, '#ffffff'); c.globalAlpha = 1; } }
  const sight = (a: number, b: number) => clamp(Math.min((s - a) / 0.05, (b - s) / 0.05));
  // hành tinh kẹo có vành
  { const v = sight(0.05, 0.38); if (v > 0) { const x = 260 - (s - 0.05) * 500, y = 46; c.globalAlpha = v; c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, x, y, 50, '#ff8ad8', 0.4); c.restore();
    circ(c, x, y, 22, '#ffb0d8'); for (let k = 0; k < 5; k++) ell(c, x, y - 14 + k * 7, 21 - Math.abs(k - 2) * 4, 2, ['#ffd0ea', '#ff8ac8', '#fff0f8', '#ffa8d8', '#ffd0ea'][k]); circ(c, x - 7, y - 8, 5, '#ffe8f6');
    c.strokeStyle = '#ffe8a0'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(x, y, 40, 8, -0.3, 0.1, Math.PI - 0.1); c.stroke(); c.strokeStyle = '#a8f0ff'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 46, 10, -0.3, 0.1, Math.PI - 0.1); c.stroke(); c.globalAlpha = 1; } }
  // cá voi sao bơi qua
  { const v = sight(0.34, 0.64); if (v > 0) { const x = 330 - (s - 0.34) * 1100, y = 50 + Math.sin(t * 0.6) * 6, P: [number, number][] = [[0, 0], [12, -8], [30, -10], [50, -6], [64, 0], [72, -6], [80, -14], [78, 0], [80, 10], [72, 4], [62, 8], [44, 12], [24, 12], [8, 8]];
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = v; c.strokeStyle = '#8ad8ff80'; c.lineWidth = 0.6; c.beginPath(); P.forEach(([px, py], i) => (i ? c.lineTo(x + px, y + py) : c.moveTo(x + px, y + py))); c.closePath(); c.stroke();
    for (const [px, py] of P) { haloAt(c, x + px, y + py, 5, '#8ad8ff', 0.7); R(c, x + px - 0.5, y + py - 0.5, 1, 1, '#ffffff'); } haloAt(c, x + 10, y - 2, 3, '#ffffff', 1);
    for (let k = 0; k < 14; k++) { const q = ((t * 0.5 + k / 14) % 1); haloAt(c, x + 6 + Math.sin(k) * 3, y - 10 - q * 24, 2 + q * 2, '#a8f0ff', (1 - q) * 0.7); } c.restore(); c.globalAlpha = 1; } }
  // hành tinh nhỏ có bông hồng trong chuông kính
  { const v = sight(0.6, 0.84); if (v > 0) { const x = 300 - (s - 0.6) * 700, y = 58; c.globalAlpha = v; circ(c, x, y + 16, 18, '#7a6aa8'); circ(c, x - 6, y + 10, 4, '#8a7ab8'); ell(c, x, y - 1, 8, 2, '#4a8a4a'); line(c, x, y - 2, x, y - 10, 0.8, '#3a8a3a'); circ(c, x, y - 12, 2.6, '#e8203a'); circ(c, x - 0.6, y - 12.6, 1.4, '#ff4a6a');
    c.globalAlpha = v * 0.4; ell(c, x, y - 8, 6, 9, '#cfeaff'); c.globalAlpha = v; R(c, x + 9, y - 14, 0.8, 14, '#3a3a4a'); circ(c, x + 9.4, y - 15, 1.4, '#fff0a0'); c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, x + 9.4, y - 15, 10, '#ffd27a', 0.8 * v); haloAt(c, x, y - 12, 14, '#ff6a8a', 0.5 * v); c.restore(); c.globalAlpha = 1; } }
  // mưa sao băng + cực quang lúc cuối
  const fin = clamp((s - 0.82) / 0.08), wish = f.taps.filter(x => x.id === 'wish' && f.now - x.at < 2500).length;
  if (fin > 0) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { c.globalAlpha = 0.18 * fin; c.fillStyle = ['#3affb0', '#8a5aff', '#ff6ab8'][k]; c.beginPath(); c.moveTo(0, 50 + k * 10); for (let x = 0; x <= W; x += 10) c.lineTo(x, 30 + k * 10 + Math.sin(x * 0.03 + t * 0.5 + k) * 14); c.lineTo(W, 0); c.lineTo(0, 0); c.fill(); } c.restore(); c.globalAlpha = 1; }
  const nMet = Math.round(fin * 6) + wish * 4 + 1;
  for (let k = 0; k < nMet; k++) { const per = 2.2 + rr(k, 9) * 2, q = ((t + rr(k, 10) * per) % per) / per; if (q > 0.35) continue; const u = q / 0.35, x0 = 40 + rr(k, 11) * 300, y0 = 4 + rr(k, 12) * 40, x = x0 - u * 90, y = y0 + u * 45;
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(x, y, x + 24, y - 12); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffffff00'); c.strokeStyle = g; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 24, y - 12); c.stroke(); haloAt(c, x, y, 4, '#ffffff', 0.8); c.restore(); }
  // đường ray ánh sáng uốn lượn
  const RY = 128, ry = (x: number) => RY + Math.sin((x + wx) * 0.015) * 6;
  c.save(); c.globalCompositeOperation = 'lighter'; for (let x = 0; x <= W; x += 2) { haloAt(c, x, ry(x) + 22, 3, '#8affff', 0.35); R(c, x, ry(x) + 22, 2, 0.6, '#d8ffff'); } for (let k = 0; k < 20; k++) { const x = ((k * 20 - wx) % 400 + 400) % 400 - 40; R(c, x, ry(x) + 21, 1, 2.5, '#ffd8f8'); } c.restore();
  const lean = f.taps.filter(x => x.id === 'lean' && f.now - x.at < 3500).length;
  c.save(); c.translate(0, ry(140) - RY); spaceTrain(f, RY + 1, lean); c.restore();
  if (el < GX_B) { c.save(); c.font = 'bold 7px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffd24a'; c.fillText('✦ GA NGÂN HÀ ✦', 160, 30); c.restore(); }
  fadeIn(c, el);
}
export const galaxy: DuoCfg = {
  title: 'Chuyến tàu ngân hà', ms: GX_MS, join: GX_B, price: 0,
  ask: '🚂 Lên chuyến tàu bay xuyên dải ngân hà', joinAsk: '🚂 Lên tàu ngân hà cùng người ấy', invite: '🚂 Người ấy rủ đi tàu ngân hà', yes: 'Lên tàu!', late: 'Tàu đã bay lên trời mất rồi — lần sau nha',
  buttons: [{ id: 'wish', label: '🌠 Ước', from: GX_B, to: GX_MS }, { id: 'lean', label: '💞 Tựa vai', from: GX_B, to: GX_MS }, { id: 'photo', label: '📸 Chụp', from: GX_B, to: GX_MS }],
  caption: el => { const s = (el - GX_B) / GX_R; return el < GX_B ? `✦ Ga Ngân Hà — tàu sắp cất cánh… ${Math.ceil((GX_B - el) / 1000)}` : s < 0.36 ? '🪐 Hành tinh kẹo hồng có vành đai vàng' : s < 0.62 ? '🐋 Cá voi sao bơi ngang bầu trời' : s < 0.84 ? '🌹 Hành tinh nhỏ có một bông hồng' : s < 1 ? '🌠 Mưa sao băng! Ước đi nào' : '💫 Tới trạm cuối của dải ngân hà'; },
  draw: drawGalaxy, snap: [GX_B + GX_R * 0.2, GX_B + GX_R * 0.48, GX_B + GX_R * 0.9], endTitle: '🚂 Chuyến tàu ngân hà', endNote: 'Đi hết dải ngân hà vẫn thấy em đẹp nhất 💫',
};

// ═════════ 3. Xứ bánh kẹo trên mây ═════════
const C_MS = 62000, C_END = 46000;
const candyLand = () => bake('dream:candy', 640, 110, (c, rnd) => {
  for (let k = 0; k < 7; k++) { const x = 30 + k * 92 + rnd() * 20, y = 92; cloud(c, x, y + 8, 70, '#fff0f8', '#ffd0e8');
    if (k % 2) { // nhà bánh gừng mái kem
      R(c, x - 14, y - 22, 28, 22, '#c8844a'); poly(c, [x - 18, y - 22, x, y - 38, x + 18, y - 22], '#8a5a3a'); for (let j = 0; j < 7; j++) circ(c, x - 16 + j * 5.3, y - 22, 2.2, '#ffffff'); R(c, x - 4, y - 12, 8, 12, '#ff8ab0'); R(c, x - 11, y - 18, 5, 5, '#ffe08a'); R(c, x + 6, y - 18, 5, 5, '#ffe08a'); for (let j = 0; j < 4; j++) circ(c, x - 10 + j * 6, y - 3, 1.2, ['#e8303a', '#3ac83a', '#ffd24a', '#3a8aff'][j]); }
    else { // cây kẹo mút + gậy kẹo
      for (let j = 0; j < 3; j++) { const lx = x - 16 + j * 16, h = 26 + j % 2 * 10; R(c, lx - 0.8, y - h, 1.6, h, '#ffffff'); circ(c, lx, y - h, 7, ['#ff6ab8', '#6ad8ff', '#ffd24a'][j]); c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); for (let a = 0; a < 12; a += 0.3) c.lineTo(lx + Math.cos(a) * a * 0.5, y - h + Math.sin(a) * a * 0.5); c.stroke(); } } }
  for (let k = 0; k < 120; k++) R(c, rnd() * 640, 60 + rnd() * 50, 1.4, 0.5, ['#ff5a8a', '#5ad8ff', '#ffd24a', '#7aff9a', '#b88aff'][k % 5]);
});
const cakeCastle = () => bake('dream:cake', 120, 120, (c) => {
  const tiers: [number, number, string][] = [[100, 30, '#ffd0e4'], [76, 26, '#fff0f6'], [54, 22, '#ffd8b0'], [34, 18, '#ffe8f4']]; let y = 118;
  for (const [w, h, col] of tiers) { R(c, 60 - w / 2, y - h, w, h, col); R(c, 60 - w / 2, y - h, w, 4, '#ffffff'); for (let x = 60 - w / 2; x < 60 + w / 2; x += 6) ell(c, x + 3, y - h + 4, 2.4, 3, '#ffffff'); for (let x = 60 - w / 2 + 4; x < 60 + w / 2; x += 9) circ(c, x, y - h / 2 + 2, 1.6, '#ff4a7a'); y -= h; }
  for (const x of [20, 100]) { R(c, x - 5, 40, 10, 78, '#fff0f6'); poly(c, [x - 7, 40, x, 24, x + 7, 40], '#ff8ab0'); circ(c, x, 22, 2.4, '#e8203a'); for (let yy = 48; yy < 112; yy += 10) R(c, x - 2, yy, 4, 5, '#ffe08a'); }
  circ(c, 60, y - 4, 5, '#e8203a'); circ(c, 58.5, y - 5.5, 1.4, '#ff8a8a');
});
function drawCandy(f: F) {
  const { c, el, t } = f, s = clamp(el / C_END), wx = (1 - (1 - s) ** 1.6) * 1400, arrive = clamp((el - C_END + 6000) / 6000);
  grad(c, 0, H, ['#ffb8e0', '#e8c8ff', '#c8e8ff', '#fff0f8']);
  // cầu vồng
  c.save(); c.globalAlpha = 0.5; for (let k = 0; k < 6; k++) { c.strokeStyle = ['#ff6a8a', '#ffb06a', '#ffe86a', '#7aff9a', '#6ac8ff', '#b88aff'][k]; c.lineWidth = 3; c.beginPath(); c.arc(220 - wx * 0.03, 130, 90 - k * 3, Math.PI, 0); c.stroke(); } c.restore();
  for (let k = 0; k < 6; k++) { const x = ((k * 80 - wx * 0.1 + t * 2) % (W + 100) + W + 100) % (W + 100) - 50; cloud(c, x, 18 + (k % 3) * 14, 40 + (k % 2) * 20, ['#ffe0f0', '#e0f0ff', '#fff0e0'][k % 3], '#f0c0e0'); }
  // bóng bay macaron
  for (let k = 0; k < 8; k++) { const x = ((rr(k, 1) * 400 - wx * 0.25 + t * 3) % 400 + 400) % 400 - 40, y = 30 + rr(k, 2) * 50 + Math.sin(t + k) * 4, col = ['#ffb0c8', '#b0e8ff', '#d8ffb0', '#ffe0a0', '#d8b8ff'][k % 5]; ell(c, x, y - 2, 6, 2.4, col); R(c, x - 6, y - 1, 12, 1.2, '#fff8f0'); ell(c, x, y + 1, 6, 2.4, col); line(c, x, y + 3, x + Math.sin(t + k) * 2, y + 14, 0.3, '#ffffff'); }
  scroll(c, candyLand(), wx * 0.4, 56);
  // lâu đài bánh kem cuối hành trình
  if (arrive > 0) { const x = lerp(380, 230, ease(arrive)); c.drawImage(cakeCastle(), x - 60, 34, 120, 120); if (el > C_END) { c.save(); c.globalCompositeOperation = 'lighter'; for (const [dx, dy] of [[-40, 24], [40, 24], [0, 0]]) haloAt(c, x + dx, 34 + dy + 20, 10, '#ffd27a', 0.7 + 0.2 * Math.sin(t * 5)); c.restore(); } }
  // sông sô-cô-la
  grad(c, 140, H, ['#8a4a2a', '#5a2a1a']); for (let k = 0; k < 30; k++) { const x = ((rr(k, 3) * 400 - wx * 1.0 + t * 6) % 400 + 400) % 400 - 40, y = 144 + rr(k, 4) * 34; R(c, x, y + Math.sin(t * 2 + k), 6 + rr(k, 5) * 6, 0.6, '#b07a4a'); }
  c.fillStyle = '#ffe0f0'; c.beginPath(); c.moveTo(0, 142); for (let x = 0; x <= W; x += 6) c.lineTo(x, 140 + Math.sin((x + wx) * 0.08) * 2); c.lineTo(W, 146); c.lineTo(0, 146); c.fill();
  // cầu kẹo dẻo cầu vồng bắc qua sông
  { const x = ((300 - wx * 1.0) % 600 + 600) % 600 - 120; for (let k = 0; k < 5; k++) { c.strokeStyle = ['#ff6a8a', '#ffb06a', '#ffe86a', '#7aff9a', '#6ac8ff'][k]; c.lineWidth = 2; c.beginPath(); c.arc(x, 150, 34 - k * 2, Math.PI, 0); c.stroke(); } }
  // thuyền bánh quy mang hai đứa
  const by = 146 + Math.sin(t * 1.6) * 1.2, bx = 150, taste = f.taps.filter(x => x.id === 'taste' && f.now - x.at < 3000).length;
  f.seats.forEach((p, i) => { if (p) putAt(f, taste ? p.img('act', 4) : p.img('sit'), bx - 7 + i * 14, by - 2, 0.42); });
  ell(c, bx, by, 24, 6, '#d8a060'); ell(c, bx, by - 1.5, 22, 4, '#e8b878'); for (let k = 0; k < 9; k++) circ(c, bx - 18 + k * 4.5, by + 1, 0.8, '#a87040');
  R(c, bx + 14, by - 26, 1, 24, '#fff0f6'); poly(c, [bx + 15, by - 26, bx + 26, by - 12, bx + 15, by - 8], '#ffd8a8'); for (let k = 0; k < 4; k++) line(c, bx + 15, by - 24 + k * 4, bx + 22, by - 16 + k * 2, 0.4, '#e8b878');
  if (taste) { heartsUp(c, t, bx, by - 30, 5); for (let i = 0; i < 2; i++) { const x = bx - 3 + i * 14; R(c, x, by - 22, 0.6, 6, '#ffffff'); circ(c, x, by - 23, 2.4, ['#ff6ab8', '#6ad8ff'][i]); } }
  // mưa kẹo rắc
  const rain = f.taps.filter(x => x.id === 'rain' && f.now - x.at < 4000).length, n = 40 + rain * 80 + (el > C_END ? 60 : 0);
  for (let k = 0; k < n; k++) { const sp = 12 + rr(k, 6) * 14, x = ((rr(k, 7) * W + Math.sin(t + k) * 6) % W + W) % W, y = (rr(k, 8) * H + t * sp) % H, col = ['#ff5a8a', '#5ad8ff', '#ffd24a', '#7aff9a', '#b88aff', '#ffffff'][k % 6];
    if (k % 7 === 0) heart(c, x, y, 1.2, col); else if (k % 11 === 0) star(c, x, y, 1.4, col, t + k); else { c.save(); c.translate(x, y); c.rotate(k + t); R(c, -1.2, -0.4, 2.4, 0.8, col); c.restore(); } }
  if (el > C_END) fireworks(c, el, C_END, 900, [150, 6, 160, 40], 61);
  fadeIn(c, el);
}
export const candy: DuoCfg = {
  title: 'Xứ bánh kẹo trên mây', ms: C_MS, join: 10000, price: 0,
  ask: '🍭 Ngồi thuyền bánh quy trôi trên sông sô-cô-la, tới lâu đài bánh kem', joinAsk: '🍭 Lên thuyền bánh quy cùng người ấy', invite: '🍭 Người ấy rủ đi xứ bánh kẹo trên mây', yes: 'Lên thuyền!', late: 'Thuyền trôi đi mất rồi — lần sau nha',
  buttons: [{ id: 'taste', label: '🍭 Nếm kẹo', from: 2000, to: C_MS }, { id: 'rain', label: '🌈 Mưa kẹo', from: 2000, to: C_MS }, { id: 'photo', label: '📸 Chụp', from: 2000, to: C_MS }],
  caption: el => el < 4000 ? '☁️ Trôi lên những đám mây kẹo bông…' : el < 20000 ? '🍫 Sông sô-cô-la, nhà bánh gừng mái kem, cây kẹo mút' : el < C_END - 6000 ? '🌈 Qua cầu kẹo dẻo cầu vồng' : el < C_END ? '🎂 Lâu đài bánh kem hiện ra kìa!' : '🎆 Nến trên lâu đài bừng sáng, pháo hoa kẹo rực trời',
  draw: drawCandy, snap: [14000, 32000, C_END + 4000], endTitle: '🍭 Một ngày ở xứ bánh kẹo', endNote: 'Ngọt nhất vẫn là có nhau 💗',
};

export const DREAM_SCENES = { tiny, galaxy, candy };
