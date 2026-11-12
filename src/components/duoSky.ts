// Các màn ngắm cảnh hai người: thả đèn trời Bình Khê, khinh khí cầu Cappadocia, ngắm sao trên mái nhà,
// thuyền đáy kính biển phát sáng Maldives, chợ Giáng sinh + trượt băng + pháo hoa.
import type { DuoCfg, F } from './Duo';
import { bake, circ, cloud, ell, glow, heart, line, poly, R, star, twinkle, type Ctx } from '../lib/canvasArt';

const W = 320, H = 180, TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
export const rr = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
const hx = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export const mix = (a: string, b: string, t: number) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t)).toString(16).padStart(2, '0')).join(''); };
const grad = (c: Ctx, y0: number, y1: number, cols: string[]) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); };
/** quầng sáng vẽ sẵn (vẽ hàng trăm cái mỗi khung vẫn nhẹ) */
const halo = (col: string) => bake(`duo:halo:${col}`, 32, 32, c => glow(c, 16, 16, 16, col, 1), 2);
const haloAt = (c: Ctx, x: number, y: number, r: number, col: string, a = 1) => { c.globalAlpha = a; c.drawImage(halo(col), x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; };
const twinkles = (c: Ctx, t: number, n: number, y1: number, seed = 1) => { for (let i = 0; i < n; i++) { const a = 0.45 + 0.55 * Math.sin(t * (0.8 + rr(i, seed + 3) * 2.4) + i); c.globalAlpha = clamp(a); const x = rr(i, seed) * W, y = rr(i, seed + 1) * y1; if (rr(i, seed + 2) < 0.18) twinkle(c, x, y, 1 + a * 1.2, '#fff6dc'); else R(c, x, y, 0.5, 0.5, '#ffffff'); c.globalAlpha = 1; } };
const hearts = (f: F, id: string, ms: number, at: (i: number) => [number, number]) => { for (const tp of f.taps) { if (tp.id !== id || tp.i < 0) continue; const q = (f.now - tp.at) / ms; if (q < 0 || q > 1) continue; const [x, y] = at(tp.i); for (let j = 0; j < 5; j++) { f.c.globalAlpha = 1 - q; heart(f.c, x + Math.sin(j * 2.1 + q * 4) * 8, y - q * 34 - j * 5, 1.6 + (j % 2) * 0.8, j % 2 ? '#ff8ab0' : '#ff4a7a'); } f.c.globalAlpha = 1; } };

/** pháo hoa: mỗi phát bay lên rồi nở chùm hạt có trọng lực, vệt sáng cộng màu */
export function fireworks(c: Ctx, el: number, from: number, every: number, area: [number, number, number, number], seed = 3) {
  if (el < from) return;
  const PAL = [['#ff5a8a', '#ffd0e0'], ['#ffd84a', '#fff6c0'], ['#5ad8ff', '#d8f8ff'], ['#b87aff', '#f0e0ff'], ['#7aff9a', '#e0ffe8'], ['#ff8a3a', '#ffe0b0']];
  c.save(); c.globalCompositeOperation = 'lighter';
  const n0 = Math.max(0, Math.floor((el - from - 3200) / every)), n1 = Math.floor((el - from) / every);
  for (let j = n0; j <= n1; j++) {
    const start = from + j * every + rr(j, seed) * every * 0.6, age = el - start; if (age < 0 || age > 3200) continue;
    const x = area[0] + rr(j, seed + 1) * area[2], y = area[1] + rr(j, seed + 2) * area[3], pal = PAL[j % PAL.length], big = rr(j, seed + 4) < 0.3;
    const RISE = 650;
    if (age < RISE) { const q = age / RISE, yy = area[1] + area[3] + 50 - (area[1] + area[3] + 50 - y) * ease(q); for (let k = 0; k < 6; k++) { c.globalAlpha = (1 - k / 6) * 0.8; R(c, x + Math.sin(k) * 0.3, yy + k * 2, 0.7, 1.4, '#fff0c0'); } c.globalAlpha = 1; continue; }
    const q = (age - RISE) / 2550, n = big ? 46 : 32, sp = (big ? 34 : 24);
    haloAt(c, x, y, (big ? 46 : 32) * (1 - q * 0.6), pal[0], (1 - q) * 0.35);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + rr(j, k) * 0.2, v = sp * (0.75 + rr(k, j) * 0.3), d = v * (1 - Math.exp(-q * 3)), gy = q * q * 16;
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d + gy;
      c.globalAlpha = clamp((1 - q) * 1.2) * (0.6 + 0.4 * Math.sin(age / 60 + k));
      for (let s = 1; s < 4; s++) { const d2 = v * (1 - Math.exp(-(q - s * 0.025) * 3)); R(c, x + Math.cos(a) * d2, y + Math.sin(a) * d2 + gy * 0.9, 0.6, 0.6, pal[0]); }
      R(c, px - 0.4, py - 0.4, 0.9, 0.9, q < 0.5 ? pal[1] : pal[0]);
      if (big && q > 0.45 && k % 3 === 0 && Math.sin(age / 40 + k) > 0.3) R(c, px, py + 2, 0.6, 0.6, '#ffffff');
    }
    if (big && q < 0.15) haloAt(c, x, y, 18, '#ffffff', 0.7 * (1 - q / 0.15));
  }
  c.restore(); c.globalAlpha = 1;
}

// ═════════ 1. Thả đèn trời Bình Khê (Đài Loan) ═════════
const pingxi = () => bake('duo:pingxi', W, H, (c, rnd) => {
  // núi dốc đứng quanh thung lũng
  for (const [base, amp, col, f] of [[96, 46, '#141e3a', 21], [108, 34, '#1a2848', 13], [118, 22, '#22325a', 8]] as const) for (let x = 0; x < W; x += 0.5) { const h = amp * (0.55 + 0.3 * Math.sin(x / f + base) + 0.15 * Math.sin(x / (f / 3) + 1)); R(c, x, base - h, 0.5, h + 80, col); }
  for (let k = 0; k < 60; k++) { const x = rnd() * W, y = 100 + rnd() * 18; R(c, x, y, 0.6, 0.6, '#ffcf7a'); glow(c, x, y, 3, '#ffb048', 0.25); }
  // hai dãy phố cổ Thập Phần, đèn lồng đỏ treo hiên
  const block = (x0: number, x1: number) => { for (let x = x0; x < x1;) { const w = 26 + rnd() * 16, h = 34 + rnd() * 22, top = 140 - h; R(c, x, top, w, h + 4, ['#4a2e26', '#3a2a2a', '#5a3a2a'][Math.floor(rnd() * 3)]);
      poly(c, [x - 3, top + 2, x + w / 2, top - 7, x + w + 3, top + 2], '#1e1a22'); R(c, x - 3, top + 1, w + 6, 1.5, '#2a2430');
      for (let wy = top + 8; wy < 128; wy += 12) for (let wx = x + 4; wx < x + w - 6; wx += 9) { R(c, wx, wy, 5, 6, '#ffcf7a'); glow(c, wx + 2.5, wy + 3, 7, '#ffb048', 0.25); R(c, wx + 2.25, wy, 0.5, 6, '#8a5a3a'); }
      R(c, x + w - 7, top + 6, 4, 16, '#c8302a'); for (let k = 0; k < 4; k++) R(c, x + w - 6, top + 8 + k * 3.6, 2, 1.6, '#f6c445');
      R(c, x, 126, w, 2, '#2a1a14'); x += w + 2; } };
  block(-4, 104); block(216, W + 10);
  for (let k = 0; k < 18; k++) { const x = (k < 9 ? 6 + k * 11 : 220 + (k - 9) * 11), y = 128 + (k % 2) * 2; glow(c, x, y + 3, 7, '#ff6a3a', 0.45); ell(c, x, y + 3, 2.4, 3, '#e8302a'); R(c, x - 2, y, 4, 0.8, '#3a1a10'); R(c, x - 2, y + 5.6, 4, 0.8, '#3a1a10'); }
  // đường ray tàu chạy giữa phố
  grad(c, 140, H, ['#3a3440', '#2a2630']); for (let k = 0; k < 200; k++) R(c, rnd() * W, 141 + rnd() * 39, 2 + rnd() * 3, 0.5, '#4a4450');
  for (let x = 0; x < W; x += 7) R(c, x, 156, 3, 12, '#4a3a2a');
  for (const y of [157, 166]) { R(c, 0, y, W, 1.4, '#9a9aa8'); R(c, 0, y, W, 0.5, '#d8d8e0'); }
});
function lanternBig(c: Ctx, x: number, by: number, sc: number, lit: number, t: number, wishes: string[], hearts: number) {
  const tw = 15 * sc, bw = 11 * sc, h = 36 * sc;
  if (lit > 0) haloAt(c, x, by - h * 0.5, h * 1.6, '#ffb048', 0.55 * lit);
  const g = c.createLinearGradient(x - tw, 0, x + tw, 0);
  g.addColorStop(0, lit ? '#d8402a' : '#b8302a'); g.addColorStop(0.5, lit ? mix('#e84a3a', '#ffe090', lit) : '#e84a3a'); g.addColorStop(1, lit ? '#d8402a' : '#b8302a');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - bw, by); c.lineTo(x + bw, by); c.lineTo(x + tw, by - h); c.lineTo(x - tw, by - h); c.closePath(); c.fill();
  for (let k = 1; k < 4; k++) { const u = k / 4; line(c, x - bw + u * bw * 2, by, x - tw + u * tw * 2, by - h, 0.25 * sc, '#00000030'); }
  R(c, x - bw, by - 1.2 * sc, bw * 2, 1.2 * sc, '#f6c445'); R(c, x - tw, by - h, tw * 2, 1 * sc, '#f6c445');
  // điều ước viết bút lông trên giấy đèn
  if (sc > 0.45) { c.fillStyle = '#2a0a04'; c.textAlign = 'center'; c.font = `bold ${3.2 * sc}px sans-serif`;
    wishes.forEach((w, i) => { if (!w) return; const words = w.length > 13 ? [w.slice(0, 13), w.slice(13, 26)] : [w]; words.forEach((s, j) => c.fillText(s, x, by - h + (i ? 22 : 9) * sc + j * 4 * sc)); });
    c.textAlign = 'start'; }
  for (let k = 0; k < hearts; k++) heart(c, x - tw * 0.6 + (k % 3) * tw * 0.6, by - h * (0.2 + 0.32 * Math.floor(k / 3)) - 2 * sc, 1.4 * sc, '#ff6a9a');
  if (lit > 0) { const fl = 0.8 + 0.2 * Math.sin(t * 14); ell(c, x, by + 1 * sc, 1.6 * sc * fl, 2.2 * sc * fl, '#ffb030'); ell(c, x, by + 1.2 * sc, 0.8 * sc, 1.2 * sc, '#fff6c0'); }
}
const SKYL = Array.from({ length: 230 }, (_, i) => ({ d: 0.22 + rr(i, 1) * 0.78, x: rr(i, 2) * (W + 60) - 30, ts: 23500 + rr(i, 3) * 26000, v: 7 + rr(i, 4) * 7, col: ['#ff8a3a', '#ff6a4a', '#ffb048', '#ff7a9a', '#ffd06a'][i % 5] })).sort((a, b) => a.d - b.d);
const PX_ARRIVE = 5000, PX_LIGHT = 21000, PX_FLY = 24000, PX_MS = 62000;
function drawPingxi(f: F) {
  const { c, el, t } = f, py = ease(clamp((el - (PX_FLY + 1000)) / 14000)) * 120;
  grad(c, 0, H, ['#04081e', '#0e1640', '#2a1a4a', '#4a2a50']);
  { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0.25, '#00000000'); g.addColorStop(0.5, '#6a5ab030'); g.addColorStop(0.75, '#00000000'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  twinkles(c, t, 110, 120 + py, 7);
  haloAt(c, 262, 26, 40, '#d8e0ff', 0.4); circ(c, 262, 26, 7, '#fff6d8'); circ(c, 265, 24, 6, '#0e1640');
  const sky = (lo: boolean) => { for (const L of SKYL) { if ((L.d < 0.62) !== lo) continue; const age = (el - L.ts) / 1000; if (age < 0) continue;
      const base = 150 - (1 - L.d) * 56 + py * (0.35 + 0.65 * L.d), y = base - age * L.v * L.d * 1.3, x = L.x + Math.sin(age * 0.5 + L.x) * 4 * L.d + age * 1.2 * L.d; if (y < -12) continue;
      const s = 2 + L.d * 5.5; haloAt(c, x, y - s * 0.4, s * 2.6, L.col, 0.5 + 0.2 * Math.sin(t * 3 + L.x));
      poly(c, [x - s * 0.36, y, x + s * 0.36, y, x + s * 0.5, y - s * 1.1, x - s * 0.5, y - s * 1.1], L.col); R(c, x - s * 0.18, y - s * 0.8, s * 0.36, s * 0.6, '#fff0b0'); } };
  sky(true);
  c.drawImage(pingxi(), 0, py, W, H);
  // tàu nhỏ tuyến Bình Khê chạy ngang phố
  if (el < PX_ARRIVE + 1500) { const x = -160 + (el / (PX_ARRIVE + 1500)) * 640; for (let k = 0; k < 2; k++) { const cx = x + k * 74; R(c, cx, 136 + py, 70, 24, '#3a7ad0'); R(c, cx, 146 + py, 70, 3, '#ffffff'); for (let w = 0; w < 6; w++) { R(c, cx + 4 + w * 11, 139 + py, 8, 6, '#ffe7a8'); } R(c, cx + 2, 158 + py, 66, 2, '#2a2a3a'); circ(c, cx + 12, 161 + py, 2.4, '#1a1a22'); circ(c, cx + 58, 161 + py, 2.4, '#1a1a22'); }
    haloAt(c, x + 148, 152 + py, 16, '#fff6c0', 0.8); }
  // hai người hai bên chiếc đèn lớn
  const flying = el > PX_FLY, lit = clamp((el - PX_LIGHT) / 2500), q = clamp((el - PX_FLY) / 36000);
  [126, 194].forEach((x, i) => { const s = f.seats[i]; if (!s) return; const im = flying ? s.img('idle', 0, 'back') : f.last(i) < 600 ? s.img('act', 1) : s.img('idle'); f.put(im, x - im.width / 2, 168 + py - im.height); });
  const wishes = [f.text(0), f.text(1)], hc = Math.min(6, f.taps.filter(x => x.id === 'heart').length);
  const lx = 160 + Math.sin(t * 0.5) * 6 * q, lby = 166 + py - Math.pow(q, 1.25) * 260;
  lanternBig(c, lx, lby, 1 - q * 0.55, lit, t, wishes, hc);
  hearts(f, 'wish', 2600, () => [lx, lby - 20]);
  sky(false);
  if (!flying && lit > 0) for (let k = 0; k < 6; k++) { const qq = (t * 0.8 + k / 6) % 1; c.globalAlpha = 1 - qq; R(c, 160 + Math.sin(qq * 8 + k) * 4, 166 - qq * 18, 0.6, 0.6, '#ffd060'); c.globalAlpha = 1; }
}
const skylantern: DuoCfg = {
  title: 'Thả đèn trời Bình Khê', ms: PX_MS, join: PX_LIGHT, price: 15, gift: { item: 'tw_sky_lantern' },
  ask: '🏮 Đi tàu tới phố cổ Bình Khê viết điều ước lên đèn trời rồi cùng thả', joinAsk: '🏮 Thả đèn trời cùng người ấy', invite: '🏮 Người ấy rủ đi Bình Khê thả đèn trời', yes: 'Đi thả cùng!', late: 'Đèn bay lên mất rồi — lần sau nha',
  buttons: [{ id: 'write', label: '✍️ Viết điều ước', from: PX_ARRIVE, to: PX_LIGHT, prompt: 'Viết điều ước lên đèn trời (ngắn thôi nha):' }, { id: 'heart', label: '💗 Vẽ tim', from: PX_ARRIVE, to: PX_LIGHT }, { id: 'wish', label: '💫 Ước nguyện', from: PX_FLY + 1500, to: PX_MS }, { id: 'photo', label: '📸 Chụp', from: PX_FLY + 1500, to: PX_MS }],
  caption: el => el < PX_ARRIVE ? '🚂 Tàu nhỏ tuyến Bình Khê chạy qua phố cổ Thập Phần…' : el < PX_LIGHT ? '✍️ Viết điều ước lên đèn trời — mỗi người một dòng' : el < PX_FLY ? '🔥 Châm lửa… đèn căng phồng, ấm dần lên' : el < PX_FLY + 15000 ? '🏮 Thả! Cùng nghìn chiếc đèn bay lên trời đêm' : '✨ Cả thung lũng ngập đèn trời — điều ước bay tới trời rồi',
  draw: drawPingxi, snap: [PX_FLY + 20000], endTitle: '🏮 Điều ước đã bay lên trời', endNote: 'Một chiếc đèn trời nhỏ đã vào túi đồ — treo ở nhà cho sáng ấm nha',
};

// ═════════ 2. Khinh khí cầu Cappadocia lúc bình minh ═════════
const CB = 6000, CR = 54000, CMS = CB + CR + 5000;
const chimneys = (key: string, h: number, base: number, big: number, cols: [string, string, string]) => bake(key, 640, h, (c, rnd) => {
  for (let x = 0; x < 640; x += 0.5) { const hh = 10 + 8 * Math.sin(x / 37) + 4 * Math.sin(x / 11); R(c, x, base - hh, 0.5, hh + h, cols[0]); }
  for (let k = 0; k < 70; k++) { const x = rnd() * 640, hh = (12 + rnd() * 26) * big, w = hh * (0.28 + rnd() * 0.12), b = base - 4 + rnd() * 14;
    for (let j = 0; j < hh; j += 0.5) { const u = j / hh, ww = w * (1 - u * 0.75); R(c, x - ww, b - j, ww * 2, 0.5, cols[0]); R(c, x + ww * 0.35, b - j, ww * 0.65, 0.5, cols[1]); }
    ell(c, x, b - hh, w * 0.42, w * 0.22, cols[2]); for (let j = 0; j < 3; j++) if (rnd() < 0.6) { R(c, x - w * 0.3 + rnd() * w * 0.5, b - hh * (0.3 + rnd() * 0.4), 1.2 * big, 1.6 * big, '#4a2a1e'); } }
  for (let k = 0; k < 30; k++) R(c, rnd() * 640, base + 6 + rnd() * (h - base - 6), 6 + rnd() * 14, 1, '#7a9a5a80');
});
const BAL = Array.from({ length: 40 }, (_, i) => ({ d: 0.18 + rr(i, 5) * 0.82, x: rr(i, 6) * 900, y: rr(i, 7), c1: ['#e8443a', '#f6c445', '#3a8ae8', '#ff8ab0', '#5ac87a', '#b87aff', '#ff8a3a'][i % 7], c2: ['#ffffff', '#3a3a8a', '#f6c445', '#e8443a'][i % 4] })).sort((a, b) => a.d - b.d);
function balloon(c: Ctx, x: number, y: number, r: number, c1: string, c2: string, t: number, k: number, lit = 0) {
  if (lit > 0) haloAt(c, x, y + r * 1.15, r * 1.4, '#ffb048', lit * 0.5);
  ell(c, x, y, r, r * 1.08, c1);
  for (let s = -2; s <= 2; s += 2) ell(c, x + s * r * 0.28, y, r * 0.14, r * 1.06, c2);
  ell(c, x - r * 0.35, y - r * 0.35, r * 0.25, r * 0.4, '#ffffff40');
  poly(c, [x - r * 0.8, y + r * 0.55, x + r * 0.8, y + r * 0.55, x + r * 0.3, y + r * 1.25, x - r * 0.3, y + r * 1.25], c1);
  line(c, x - r * 0.3, y + r * 1.25, x - r * 0.22, y + r * 1.55, Math.max(0.2, r * 0.03), '#3a2a2a'); line(c, x + r * 0.3, y + r * 1.25, x + r * 0.22, y + r * 1.55, Math.max(0.2, r * 0.03), '#3a2a2a');
  R(c, x - r * 0.24, y + r * 1.55, r * 0.48, r * 0.3, '#8a5a2a');
  if (Math.sin(t * 1.3 + k * 2.7) > 0.85) haloAt(c, x, y + r * 1.3, r * 0.6, '#ffb048', 0.8);
}
function drawBalloon(f: F) {
  const { c, el, t } = f, s = clamp((el - CB) / CR), k = clamp(el / 42000);
  const fire = f.taps.filter(x => x.id === 'fire' && f.now - x.at < 1500).length;
  const alt = (s < 0.22 ? ease(s / 0.22) : s > 0.86 ? 1 - ease((s - 0.86) / 0.14) * 0.92 : 1) + Math.sin(t * 0.4) * 0.03 + fire * 0.02, wx = s * 900;
  grad(c, 0, 130, [mix('#1a1a5a', '#4a90e0', k), mix('#7a3a8a', '#9ac8f0', k), mix('#ff7a6a', '#ffe0c8', k), mix('#ffb070', '#fff4d8', k)]);
  const sy = 132 - ease(k) * 64; c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, 252, sy, 90, mix('#ff9a4a', '#fff0b0', k), 0.6); haloAt(c, 252, sy, 30, '#ffffff', 0.6); c.restore();
  circ(c, 252, sy, 9, mix('#ffd080', '#fffbe8', k));
  c.globalAlpha = 0.08; for (let j = 0; j < 12; j++) { const a = -Math.PI + j * 0.26 + t * 0.02; poly(c, [252, sy, 252 + Math.cos(a) * 300, sy + Math.sin(a) * 300, 252 + Math.cos(a + 0.1) * 300, sy + Math.sin(a + 0.1) * 300], '#fff4d0'); } c.globalAlpha = 1;
  for (let j = 0; j < 5; j++) { const x = ((j * 83 - t * 1.5 - wx * 0.03) % (W + 80) + W + 80) % (W + 80) - 40; cloud(c, x, 22 + (j % 3) * 10, 30 + (j % 2) * 16, mix('#ffb8c8', '#ffffff', k), mix('#c8709a', '#dceaf8', k)); }
  // núi lửa Erciyes phủ tuyết xa xa
  { const x = 80 - wx * 0.02, b = 116 + alt * 10; poly(c, [x - 70, b, x - 8, b - 38, x + 8, b - 38, x + 70, b], mix('#7a6a9a', '#a8b8d8', k)); poly(c, [x - 14, b - 30, x - 8, b - 38, x + 8, b - 38, x + 14, b - 30, x + 4, b - 27, x - 4, b - 31], '#fff4f8'); }
  const tile = (cv: HTMLCanvasElement, par: number, y: number, h: number) => { const off = ((wx * par) % 640 + 640) % 640; c.drawImage(cv, -off, y, 640, h); c.drawImage(cv, 640 - off, y, 640, h); };
  const far = BAL.filter(b => b.d < 0.5), near = BAL.filter(b => b.d >= 0.5);
  const drawB = (b: typeof BAL[number], i: number) => { const par = 0.04 + b.d * 0.4, x = ((b.x - wx * par + t * 2 * b.d) % (W + 120) + W + 120) % (W + 120) - 60, r = 2 + b.d * 8.5, y = 118 - b.d * 10 - b.y * (50 + b.d * 40) + alt * b.d * 50 + Math.sin(t * 0.3 + i) * 3; balloon(c, x, y, r, b.c1, b.c2, t, i, 1 - k * 0.6); };
  far.forEach(drawB);
  tile(chimneys('duo:capp1', 90, 30, 0.7, [mix('#c88a8a', '#e8c0a8', k), mix('#a86a7a', '#c89a88', k), mix('#8a5a5a', '#9a6a4a', k)]), 0.12, 96 + alt * 26, 90);
  c.globalAlpha = 0.35; for (let j = 0; j < 6; j++) { const x = ((j * 70 - wx * 0.2 + t * 2) % (W + 80) + W + 80) % (W + 80) - 40; ell(c, x, 128 + alt * 26 + (j % 2) * 4, 40, 4, '#fff0f0'); } c.globalAlpha = 1;
  // lâu đài đá Uçhisar
  { const x = 500 * 0.3 + 160 - wx * 0.3, b = 140 + alt * 40; if (x > -60 && x < W + 60) { poly(c, [x - 40, b, x - 26, b - 30, x - 12, b - 44, x + 10, b - 46, x + 26, b - 30, x + 42, b], mix('#c89a8a', '#e8c8a8', k)); for (let j = 0; j < 22; j++) R(c, x - 26 + (j * 7.3) % 52, b - 6 - ((j * 13) % 34), 1.4, 2, '#5a3424'); R(c, x - 1, b - 52, 1, 6, '#c8302a'); poly(c, [x, b - 52, x + 6, b - 50, x, b - 48], '#e8302a'); } }
  tile(chimneys('duo:capp2', 110, 40, 1.5, [mix('#d0928a', '#f0c8a8', k), mix('#a8707a', '#d0a088', k), mix('#7a4a4a', '#8a5a3a', k)]), 0.35, 112 + alt * 60, 110);
  near.forEach(drawB);
  // khinh khí cầu của hai đứa (giữa màn): bóng sọc lớn, giỏ mây, đèn đốt phụt lửa
  const CX = 150, sway = Math.sin(t * 0.7) * 1.5, by = 112 + Math.sin(t * 0.9) * 1.5;
  const burn = fire > 0 || Math.sin(t * 0.9) > 0.92, bx = CX + sway;
  ell(c, bx, by - 64, 44, 50, '#e8304a'); c.save(); c.beginPath(); c.ellipse(bx, by - 64, 44, 50, 0, 0, Math.PI * 2); c.clip(); for (let j = -3; j <= 3; j++) ell(c, bx + j * 12.5, by - 64, 4.2 * (1 - Math.abs(j) * 0.18), 49.5, j % 2 ? '#ffffff' : '#f6c445'); ell(c, bx + 26, by - 60, 20, 52, '#00000022'); c.restore(); ell(c, bx - 16, by - 84, 9, 16, '#ffffff38');
  poly(c, [bx - 36, by - 36, bx + 36, by - 36, bx + 13, by - 12, bx - 13, by - 12], '#e8304a'); for (let j = -1; j <= 1; j++) poly(c, [bx + j * 18 - 3, by - 36, bx + j * 18 + 3, by - 36, bx + j * 5 + 1, by - 12, bx + j * 5 - 1, by - 12], '#f6c445');
  for (const d of [-12, -5, 5, 12]) line(c, bx + d, by - 12, bx + d * 1.25, by + 2, 0.4, '#3a2a2a');
  if (burn) { haloAt(c, bx, by - 8, 26, '#ffb048', 0.9); const fl = 0.8 + 0.2 * Math.sin(t * 30); ell(c, bx, by - 9, 3 * fl, 7 * fl, '#ff8a2a'); ell(c, bx, by - 8, 1.6, 4, '#fff6c0'); }
  R(c, bx - 4, by - 3, 8, 3, '#5a5a62');
  f.seats.forEach((p, i) => { if (!p) return; const hug = f.last(i, 'hug') < 3000, im = hug ? p.img('act', 12) : p.img('idle'); f.put(im, bx - 15 + i * 14, by - 17 + Math.sin(t * 0.9) * 0.5, 0.5); });
  R(c, bx - 17, by + 2, 34, 13, '#a8743a'); for (let j = 0; j < 6; j++) R(c, bx - 17, by + 3 + j * 2, 34, 0.6, '#8a5a2a'); for (let j = 0; j < 9; j++) R(c, bx - 16 + j * 4, by + 2, 0.6, 13, '#c88a4a'); R(c, bx - 18, by + 1, 36, 2, '#6a4a2a');
  hearts(f, 'hug', 3000, () => [bx, by - 4]);
}
const balloonCfg: DuoCfg = {
  title: 'Khinh khí cầu Cappadocia', ms: CMS, join: CB, price: 30, gift: { item: 'cap_balloon' },
  ask: '🎈 Bay khinh khí cầu ngắm bình minh Cappadocia', joinAsk: '🎈 Lên giỏ khinh khí cầu cùng người ấy', invite: '🎈 Người ấy rủ bay khinh khí cầu Cappadocia', yes: 'Lên giỏ cùng!', late: 'Khinh khí cầu cất cánh mất rồi — lần sau nha',
  buttons: [{ id: 'fire', label: '🔥 Phun lửa', from: CB, to: CB + CR }, { id: 'hug', label: '💞 Ôm nhau', from: CB, to: CB + CR }, { id: 'photo', label: '📸 Chụp', from: CB, to: CB + CR }],
  caption: el => { const s = (el - CB) / CR; return el < CB ? `🎈 Lên giỏ thôi… phi công đang phun lửa làm nóng bóng ${Math.ceil((CB - el) / 1000)}` : s < 0.25 ? '🔥 Cất cánh lúc rạng đông, lơ lửng trên Thung lũng Tình Yêu' : s < 0.55 ? '🌅 Mặt trời lên — hàng trăm khinh khí cầu cùng bay quanh' : s < 0.86 ? '🏰 Lướt qua lâu đài đá Uçhisar và rừng ống khói tiên' : s < 1 ? '🧺 Hạ cánh nhẹ nhàng xuống cánh đồng' : '🥂 Chạm đất rồi! Mừng chuyến bay đầu tiên của hai đứa'; },
  draw: drawBalloon, snap: [CB + CR * 0.45], endTitle: '🎈 Chuyến bay bình minh Cappadocia', endNote: 'Mô hình khinh khí cầu nhỏ đã vào túi đồ — bày ở nhà nha',
};

// ═════════ 3. Ngắm sao trên mái nhà ═════════
const RMS = 62000, SHOWER = 42000;
const milky = () => bake('duo:milky', W, 140, (c, rnd) => {
  for (let i = 0; i < 2600; i++) { const u = rnd(), x = u * W, y = 130 - u * 120 + (rnd() - 0.5) * (26 + rnd() * 26) * (rnd() < 0.5 ? 1 : 0.5); R(c, x, y, 0.5, 0.5, ['#5a5aa8', '#8a7ac8', '#c8b8ff', '#ffd8f0', '#9ad0ff'][Math.floor(rnd() * 5)]); }
  for (let i = 0; i < 90; i++) { const u = rnd(); glow(c, u * W, 130 - u * 120 + (rnd() - 0.5) * 20, 8 + rnd() * 8, ['#7a6ad0', '#c87ab0', '#5a8ad8'][i % 3], 0.14); }
  for (let i = 0; i < 40; i++) { const u = rnd(); ell(c, u * W, 130 - u * 120 + (rnd() - 0.5) * 6, 6 + rnd() * 8, 1.4, '#0a0c2a90', -0.36); }
});
const CONS: { name: string; p: [number, number][]; l: [number, number][] }[] = [
  { name: '✨ Chòm Bắc Đẩu — cái gáo bảy ngôi sao', p: [[30, 26], [44, 22], [58, 26], [70, 34], [74, 48], [92, 50], [94, 36]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { name: '💫 Ngưu Lang & Chức Nữ — đàn chim ô thước bắc cầu qua sông Ngân', p: [[132, 44], [126, 52], [138, 54], [210, 88], [204, 82], [216, 94]], l: [[0, 1], [0, 2], [3, 4], [3, 5]] },
  { name: '🏹 Chòm Lạp Hộ — ba sao Tam Tinh thẳng hàng', p: [[250, 60], [280, 58], [258, 76], [265, 75], [272, 74], [252, 94], [282, 92]], l: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]] },
  { name: '👑 Chòm Thiên Hậu — chữ W trên trời', p: [[150, 14], [162, 22], [174, 14], [186, 22], [198, 12]], l: [[0, 1], [1, 2], [2, 3], [3, 4]] },
];
const roof = () => bake('duo:roof', W, 70, (c, rnd) => {
  // làng nhỏ phía xa + biển soi trăng
  for (let x = 0; x < W; x += 0.5) { const h = 6 + Math.sin(x / 23) * 4 + Math.sin(x / 7) * 1.2; R(c, x, 22 - h, 0.5, h + 4, '#141a3a'); }
  R(c, 0, 22, W, 10, '#101838'); for (let k = 0; k < 40; k++) R(c, rnd() * W, 23 + rnd() * 8, 3 + rnd() * 6, 0.5, '#3a4a8a');
  for (let k = 0; k < 26; k++) { const x = rnd() * W, y = 14 + rnd() * 6; R(c, x, y, 4, 4, '#1e2448'); R(c, x + 1, y + 1, 1, 1, '#ffcf7a'); glow(c, x + 1.5, y + 1.5, 4, '#ffb048', 0.35); }
  // mái ngói nhà gỗ của hai đứa
  for (let y = 30; y < 70; y += 0.5) { const u = (y - 30) / 40; R(c, 0, y, W, 0.5, mix('#6a3a3a', '#3a2028', u)); }
  for (let y = 32; y < 70; y += 5) for (let x = ((y / 5) % 2) * 6; x < W; x += 12) { R(c, x, y, 11, 0.6, '#4a2828'); R(c, x + 10.5, y, 0.6, 5, '#4a2828'); }
  R(c, 0, 29, W, 3, '#8a4a3a'); R(c, 0, 29, W, 0.6, '#b0685a');
  R(c, 244, 4, 16, 27, '#8a4a3a'); for (let y = 6; y < 30; y += 3) R(c, 244, y, 16, 0.5, '#6a3428'); R(c, 242, 2, 20, 3, '#5a2a22');
  // chăn trải trên mái
  for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) R(c, 126 + x * 4, 32 + y * 2.2, 4, 2.2, (x + y) % 2 ? '#e8788a' : '#fff0e0');
});
function drawRoof(f: F) {
  const { c, el, t } = f;
  grad(c, 0, H, ['#030620', '#0a1240', '#1a2060', '#3a2a6a']);
  c.drawImage(milky(), 0, 0, W, 140);
  twinkles(c, t, 160, 120, 11);
  haloAt(c, 276, 22, 34, '#d8e0ff', 0.45); circ(c, 276, 22, 7, '#fff6d8'); circ(c, 279, 20, 6.2, '#0a1240');
  // chòm sao đang chỉ (đồng bộ theo số lần bấm)
  const st = f.taps.filter(x => x.id === 'star'), lastSt = st[st.length - 1];
  if (lastSt && f.now - lastSt.at < 4500) { const C = CONS[(st.length - 1) % CONS.length], a = clamp((f.now - lastSt.at) / 900) * clamp((4500 - (f.now - lastSt.at)) / 600);
    c.globalAlpha = a * 0.7; for (const [i, j] of C.l) line(c, C.p[i][0], C.p[i][1], C.p[j][0], C.p[j][1], 0.4, '#bfe0ff'); c.globalAlpha = a;
    for (const [x, y] of C.p) { haloAt(c, x, y, 6, '#c8e0ff', 0.8); twinkle(c, x, y, 2, '#ffffff'); }
    if (C.p.length === 6) for (let k = 0; k < 14; k++) { const u = k / 13, x = 132 + (210 - 132) * u, y = 48 + (88 - 48) * u - Math.sin(u * Math.PI) * 16, w = Math.sin(t * 8 + k) * 1.2; line(c, x - 1.6, y - w, x, y, 0.4, '#e8e8ff'); line(c, x, y, x + 1.6, y - w, 0.4, '#e8e8ff'); }
    c.globalAlpha = 1; }
  // sao băng: lác đác, cuối buổi thành mưa sao băng
  const shoot = (j: number, every: number, off: number) => { const start = off + j * every + rr(j, off) * every * 0.5, q = (el - start) / 900; if (q < 0 || q > 1) return; const x0 = 30 + rr(j, off + 1) * 250, y0 = 6 + rr(j, off + 2) * 40, x = x0 + q * 46, y = y0 + q * 20;
    c.globalAlpha = Math.sin(q * Math.PI); const g = c.createLinearGradient(x - 22, y - 10, x, y); g.addColorStop(0, '#ffffff00'); g.addColorStop(1, '#ffffff'); c.strokeStyle = g; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - 22, y - 10); c.lineTo(x, y); c.stroke(); haloAt(c, x, y, 4, '#ffffff', 0.9); c.globalAlpha = 1; };
  for (let j = 0; j < 14; j++) shoot(j, 4200, 3000);
  if (el > SHOWER) for (let j = 0; j < 60; j++) shoot(j, 420, SHOWER);
  c.drawImage(roof(), 0, 110, W, 70);
  // khói ống khói + dây đèn dọc nóc mái
  for (let k = 0; k < 5; k++) { const q = (t * 0.15 + k / 5) % 1; c.globalAlpha = (1 - q) * 0.2; circ(c, 252 + q * 14 + Math.sin(q * 6) * 3, 112 - q * 40, 2 + q * 6, '#a8a8c0'); c.globalAlpha = 1; }
  for (let k = 0; k < 26; k++) { const x = 4 + k * 12.2, y = 141 + Math.sin(k * 1.3) * 0.8, col = ['#fff1a8', '#ffc6dc', '#c8f0ff', '#ffd27a'][k % 4], tw = 0.6 + 0.4 * Math.sin(t * 2.5 + k); haloAt(c, x, y, 5, col, 0.5 * tw); circ(c, x, y, 0.7, col); }
  // kính thiên văn trên giá ba chân
  { const x = 206, y = 150; line(c, x, y - 12, x - 6, y, 0.6, '#c8c8d8'); line(c, x, y - 12, x + 6, y, 0.6, '#c8c8d8'); line(c, x, y - 12, x, y + 1, 0.6, '#c8c8d8'); c.save(); c.translate(x, y - 13); c.rotate(-0.7); R(c, -2, -1.4, 16, 2.8, '#e8e8f0'); R(c, 12, -1.8, 3, 3.6, '#9a9ab0'); c.restore(); }
  // hai đứa ngồi tựa nhau trên chăn, quay lưng nhìn trời
  [141, 173].forEach((x, i) => { const s = f.seats[i]; if (!s) return; const im = s.img('sit', 0, 'back'); f.put(im, x - im.width / 2, 152 - im.height); });
  hearts(f, 'wish', 2600, i => [141 + i * 32, 106]);
  for (let k = 0; k < 10; k++) { const x = (rr(k, 9) * W + Math.sin(t * 0.3 + k) * 12 + W) % W, y = 122 + rr(k, 10) * 50 + Math.sin(t * 0.5 + k * 2) * 6, a = 0.5 + 0.5 * Math.sin(t * 2 + k * 1.3); haloAt(c, x, y, 3 + a * 2, '#fff7a8', a * 0.7); }
}
const rooftop: DuoCfg = {
  title: 'Ngắm sao trên mái nhà', ms: RMS, join: 15000, price: 0,
  ask: '🌙 Trèo lên mái nhà nằm ngắm sao', joinAsk: '🌙 Lên mái nhà ngắm sao cùng người ấy', invite: '🌙 Người ấy rủ lên mái nhà ngắm sao', yes: 'Lên ngồi cạnh!', late: 'Lần sau lên sớm hơn nha',
  buttons: [{ id: 'star', label: '🔭 Chòm sao', from: 3000, to: RMS }, { id: 'wish', label: '🌠 Ước', from: 3000, to: RMS }, { id: 'photo', label: '📸 Chụp', from: 3000, to: RMS }],
  caption: el => el < 3000 ? '🌙 Trèo lên mái, trải chăn ra…' : el < 20000 ? '🔭 Bấm "Chòm sao" để chỉ cho nhau từng chòm' : el < SHOWER ? '🌠 Thấy sao băng thì bấm "Ước" thật nhanh!' : el < RMS ? '☄️ Mưa sao băng!! Ước thật nhiều đi' : '🌌 Đêm nay đẹp quá…',
  draw: drawRoof, snap: [SHOWER + 6000], endTitle: '🌌 Một đêm ngắm sao trên mái nhà', endNote: 'Hai đứa đã ước bao nhiêu điều rồi nhỉ 💫',
};

// ═════════ 4. Thuyền đáy kính — biển phát sáng Maldives ═════════
const GMS = 60000, HZ = 62, WL = 94;
const mvTop = () => bake('duo:mvtop', W, WL, (c, rnd) => {
  // đảo cọ + dãy biệt thự trên mặt nước, đèn vàng ấm
  for (let x = 0; x < 120; x += 0.5) { const h = 4 + Math.sin(x / 19) * 2; R(c, x, HZ - h, 0.5, h, '#0a1424'); }
  for (const [x, h] of [[20, 20], [34, 26], [52, 18], [70, 24], [96, 16]] as const) { line(c, x, HZ - 2, x + 3, HZ - h, 1, '#0a1424'); for (let k = 0; k < 6; k++) { const a = -Math.PI + k * 0.6; line(c, x + 3, HZ - h, x + 3 + Math.cos(a) * 8, HZ - h + Math.sin(a) * 3 + 3, 0.8, '#0a1424'); } }
  R(c, 140, HZ + 6, 180, 1, '#5a4030');
  for (let k = 0; k < 8; k++) { const x = 146 + k * 22, y = HZ + 6; for (const dx of [2, 14]) R(c, x + dx, y, 1, 10, '#3a2a20'); R(c, x, y - 7, 18, 7, '#4a3424'); poly(c, [x - 3, y - 7, x + 9, y - 15, x + 21, y - 7], '#2a2018'); R(c, x + 4, y - 5, 4, 4, '#ffcf7a'); R(c, x + 10, y - 5, 4, 4, '#ffcf7a'); glow(c, x + 9, y - 3, 12, '#ffb048', 0.35); }
});
const PLANK = Array.from({ length: 320 }, (_, i) => ({ x: rr(i, 1) * 640, y: WL + 4 + rr(i, 2) * (H - WL - 6), d: 0.3 + rr(i, 3) * 0.7 }));
function drawGlow(f: F) {
  const { c, el, t } = f, wx = t * 9;
  grad(c, 0, HZ, ['#02051a', '#081440', '#14245a']);
  twinkles(c, t, 120, HZ - 4, 21);
  haloAt(c, 64, 20, 40, '#d0e0ff', 0.5); circ(c, 64, 20, 7, '#fff8e0');
  // mặt biển đêm có vệt trăng, sóng phát sáng xanh
  grad(c, HZ, WL, ['#0c1c48', '#081438']);
  for (let k = 0; k < 18; k++) { const y = HZ + 1 + k * 1.6, w = (3 + k) * (0.6 + 0.4 * Math.sin(t * 3 + k)); c.globalAlpha = 0.6; R(c, 64 + Math.sin(t + k * 2) * (1 + k * 0.4) - w / 2, y, w, 0.5, '#fff6d8'); c.globalAlpha = 1; }
  c.drawImage(mvTop(), 0, 0, W, WL);
  for (let k = 0; k < 8; k++) { const x = 146 + k * 22 + 9; for (let j = 0; j < 6; j++) { c.globalAlpha = 0.5 - j * 0.07; R(c, x - 2 + Math.sin(t * 2 + j + k) * 1.2, HZ + 18 + j * 2, 4, 0.6, '#ffcf7a'); } c.globalAlpha = 1; }
  for (let k = 0; k < 10; k++) { const x = ((k * 41 - wx * 0.8) % (W + 40) + W + 40) % (W + 40) - 20, y = HZ + 8 + (k % 4) * 6, a = 0.5 + 0.5 * Math.sin(t * 2 + k); haloAt(c, x, y, 10, '#3affe8', a * 0.4); R(c, x - 8, y, 16, 0.6, '#8afff0'); }
  // dưới đáy kính: biển sâu sinh vật phù du phát sáng
  grad(c, WL, H, ['#05306a', '#032050', '#011030']);
  c.globalAlpha = 0.08; for (let k = 0; k < 5; k++) { const x = 40 + k * 60 + Math.sin(t * 0.3 + k) * 10; poly(c, [x, WL, x + 14, WL, x + 50, H, x + 26, H], '#a8e8ff'); } c.globalAlpha = 1;
  // rạn san hô đáy biển, hải quỳ phát sáng thở nhịp
  for (let x = 0; x < W; x += 0.5) { const xx = x + wx * 0.6, h = 10 + Math.sin(xx / 17) * 5 + Math.sin(xx / 5) * 2; R(c, x, H - h, 0.5, h, '#0a2a4a'); }
  for (let k = 0; k < 16; k++) { const x = ((k * 29 - wx * 0.6) % (W + 30) + W + 30) % (W + 30) - 15, y = H - 10 - (k % 3) * 3, col = ['#ff6ad8', '#3affe8', '#ffd84a', '#8a7aff'][k % 4], a = 0.5 + 0.5 * Math.sin(t * 1.5 + k); haloAt(c, x, y, 8, col, a * 0.5); for (let j = 0; j < 5; j++) line(c, x, y + 3, x + Math.sin(t * 2 + j + k) * 2 + (j - 2) * 1.4, y - 3, 0.5, col); }
  c.save(); c.globalCompositeOperation = 'lighter';
  const stirs = f.taps.filter(x => x.id === 'stir' && f.now - x.at < 2500);
  for (const p of PLANK) { const x = ((p.x - wx * p.d * 1.6) % 640 + 640) % 640 * 0.5, y = p.y + Math.sin(t * 0.8 + p.x) * 2; let a = 0.25 + 0.35 * Math.sin(t * 2 + p.x * 3);
    for (const s of stirs) { const q = (f.now - s.at) / 2500, d = Math.hypot(x - 150, (y - WL) * 1.5), r = q * 120; if (Math.abs(d - r) < 14) a += (1 - q) * 1.4; }
    if (a > 0.1) { R(c, x, y, 0.6, 0.6, '#9afff8'); if (a > 0.5) haloAt(c, x, y, 3 + a * 2, '#3affe8', clamp(a * 0.5)); } }
  c.restore();
  // cá đuối manta lượn, viền phát sáng
  for (let k = 0; k < 2; k++) { const x = ((k * 190 + t * (8 + k * 3)) % (W + 120)) - 60, y = 128 + k * 18 + Math.sin(t * 0.6 + k) * 8, fl = Math.sin(t * 2 + k) * 4, s = 1 - k * 0.25;
    haloAt(c, x, y, 22 * s, '#3ac8ff', 0.25); poly(c, [x + 12 * s, y, x, y - 3 * s, x - 14 * s, y - fl * s, x - 6 * s, y + 2 * s, x - 14 * s, y + 4 * s + fl * 0.5, x, y + 3 * s], '#0a1a30'); line(c, x - 6 * s, y + 1, x - 22 * s, y + 3, 0.4, '#0a1a30'); line(c, x + 12 * s, y, x - 14 * s, y - fl * s, 0.3, '#5affff'); }
  // đàn cá bạc
  for (let k = 0; k < 26; k++) { const q = t * 0.25 + k * 0.02, x = ((q * 140 + rr(k, 4) * 30) % (W + 60)) - 30, y = 114 + Math.sin(q * 6 + k * 0.3) * 8 + rr(k, 5) * 14; R(c, x, y, 2, 0.8, '#c8e8ff'); R(c, x - 0.8, y - 0.2, 0.8, 1.2, '#a8c8e8'); }
  // rùa biển
  { const x = ((t * 5) % (W + 60)) - 30, y = 150 + Math.sin(t * 0.4) * 4, fl = Math.sin(t * 3) * 1.5; ell(c, x, y, 6, 3.4, '#2a5a4a'); ell(c, x, y - 0.5, 4.5, 2.4, '#4a8a6a'); circ(c, x + 7, y, 1.6, '#3a6a5a'); ell(c, x + 3, y + 3 + fl, 2.6, 1, '#3a6a5a', 0.5); ell(c, x - 3, y + 3 - fl, 2.6, 1, '#3a6a5a', -0.5); }
  // thuyền đáy kính: thân gỗ, đèn mũi, ô kính nhìn xuống
  const bx = 150, bob = Math.sin(t * 1.4) * 1;
  c.globalAlpha = 0.35; R(c, bx - 26, WL + bob, 52, 6, '#bfeaff'); c.globalAlpha = 1;
  for (const s of stirs) { const q = (f.now - s.at) / 2500; c.globalAlpha = (1 - q) * 0.9; c.strokeStyle = '#7afff0'; c.lineWidth = 0.6; c.beginPath(); c.ellipse(bx, WL + bob, 20 + q * 70, 3 + q * 8, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; }
  f.seats.forEach((p, i) => { if (!p) return; const im = f.last(i, 'stir') < 1000 ? p.img('actsit', 5) : p.img('sit'); f.put(im, bx - 16 + i * 14, WL - 20 + bob, 0.5); });
  poly(c, [bx - 34, WL - 8 + bob, bx + 34, WL - 8 + bob, bx + 26, WL + 1 + bob, bx - 26, WL + 1 + bob], '#7a4a2a'); R(c, bx - 34, WL - 8 + bob, 68, 1.2, '#a8683a'); R(c, bx - 28, WL - 4 + bob, 56, 0.6, '#f6c445');
  for (const dx of [-32, 32]) { R(c, bx + dx, WL - 16 + bob, 0.6, 8, '#3a2a1a'); haloAt(c, bx + dx, WL - 17 + bob, 9, '#ffb048', 0.7); R(c, bx + dx - 1, WL - 18 + bob, 2, 2.4, '#ffe0a0'); }
  for (let j = 0; j < 4; j++) { c.globalAlpha = 0.5 - j * 0.1; R(c, bx - 30 - j * 8, WL + 1 + bob, 6, 0.6, '#8afff0'); c.globalAlpha = 1; }
  void el;
}
const glowsea: DuoCfg = {
  title: 'Biển phát sáng Maldives', ms: GMS, join: 10000, price: 30, gift: { item: 'mv_glow_jar' },
  ask: '🚤 Đi thuyền đáy kính ngắm biển phát sáng Maldives', joinAsk: '🚤 Lên thuyền cùng người ấy', invite: '🚤 Người ấy rủ đi thuyền ngắm biển phát sáng', yes: 'Lên thuyền!', late: 'Thuyền rời bến mất rồi — lần sau nha',
  buttons: [{ id: 'stir', label: '✋ Khuấy nước', from: 2000, to: GMS }, { id: 'photo', label: '📸 Chụp', from: 2000, to: GMS }],
  caption: el => el < 4000 ? '🚤 Thuyền đáy kính rời cầu tàu biệt thự…' : el < 22000 ? '✨ Nhìn xuống đáy kính — sinh vật phù du phát sáng xanh!' : el < 40000 ? '✋ Khuấy nước thử xem — cả biển sáng bừng lên' : el < GMS ? '🐢 Cá đuối manta, rùa biển bơi ngay dưới chân…' : '🌙 Đêm Maldives đẹp như mơ',
  draw: drawGlow, snap: [26000], endTitle: '✨ Đêm biển phát sáng Maldives', endNote: 'Một hũ thuỷ tinh phát sáng đã vào túi đồ — đặt ở nhà ban đêm lung linh lắm',
};

// ═════════ 5. Chợ Giáng sinh + trượt băng (Thuỵ Sĩ) + pháo hoa ═════════
const XMS = 64000, FW = 40000;
const xmas = () => bake('duo:xmas', W, H, (c, rnd) => {
  grad(c, 0, 110, ['#050a26', '#101a4a', '#2a2a5a']);
  // phố cổ nhà khung gỗ mái tuyết
  for (let x = -4; x < W;) { const w = 22 + rnd() * 14, h = 34 + rnd() * 26, top = 108 - h; if (x > 120 && x < 196) { x += 6; continue; }
    R(c, x, top, w, h, ['#e8d8c0', '#d8c0a0', '#f0e0d0', '#c8a888'][Math.floor(rnd() * 4)]); for (let y = top + 4; y < 108; y += 8) R(c, x, y, w, 0.8, '#5a3424'); for (let xx = x; xx < x + w; xx += 7) R(c, xx, top, 0.8, h, '#5a3424');
    poly(c, [x - 2, top, x + w / 2, top - 14, x + w + 2, top], '#6a3a3a'); poly(c, [x - 2, top, x + w / 2, top - 14, x + w + 2, top, x + w / 2, top - 10], '#f4f8ff');
    for (let y = top + 6; y < 104; y += 9) for (let xx = x + 3; xx < x + w - 4; xx += 8) { R(c, xx, y, 4, 5, '#ffcf7a'); glow(c, xx + 2, y + 2.5, 6, '#ffb048', 0.25); }
    x += w + 1; }
  // tháp nhà thờ
  R(c, 150, 30, 20, 60, '#c8b8a0'); poly(c, [146, 30, 160, 2, 174, 30], '#3a5a6a'); R(c, 156, 40, 8, 10, '#ffcf7a'); circ(c, 160, 60, 4, '#f4ecd8'); R(c, 159.6, 57, 0.8, 3, '#2a2a2a');
  // dãy quầy chợ gỗ
  for (let k = 0; k < 7; k++) { const x = 4 + k * 46, y = 100; R(c, x, y, 38, 16, '#8a5a3a'); R(c, x + 2, y + 4, 34, 8, '#ffcf7a'); poly(c, [x - 3, y, x + 19, y - 10, x + 41, y], '#5a2a2a'); poly(c, [x - 3, y, x + 19, y - 10, x + 41, y, x + 19, y - 7], '#f4f8ff'); glow(c, x + 19, y + 8, 20, '#ffb048', 0.3); for (let j = 0; j < 5; j++) R(c, x + 4 + j * 7, y + 6, 4, 3, ['#e8443a', '#3a8a5a', '#f6c445', '#ffffff', '#c87a3a'][j]); }
  // nền tuyết + sân băng
  R(c, 0, 108, W, 72, '#e8f0fa'); for (let k = 0; k < 120; k++) R(c, rnd() * W, 110 + rnd() * 68, 3 + rnd() * 8, 0.5, '#c8d8ec');
  ell(c, 160, 150, 152, 30, '#d8e8f8'); ell(c, 160, 150, 146, 27, '#bcd8f0');
  for (let k = 0; k < 40; k++) { const a = rnd() * TAU, d = rnd(); R(c, 160 + Math.cos(a) * 140 * d, 150 + Math.sin(a) * 25 * d, 6 + rnd() * 10, 0.4, '#ffffff90'); }
  c.strokeStyle = '#8a5a3a'; c.lineWidth = 2; c.beginPath(); c.ellipse(160, 150, 152, 30, 0, 0, Math.PI); c.stroke();
  R(c, 0, 172, W, 8, '#f4f8ff'); for (let x = 0; x < W; x += 5) circ(c, x, 172, 3, '#f4f8ff');
});
const TREE = Array.from({ length: 70 }, (_, i) => { const u = rr(i, 1), y = 30 + u * 72, w = 4 + u * 26; return { x: 160 + (rr(i, 2) * 2 - 1) * w * 0.9, y, col: ['#ffd84a', '#ff5a6a', '#7ad8ff', '#ffffff', '#ff9ad8'][i % 5] }; });
function drawXmas(f: F) {
  const { c, el, t } = f;
  c.drawImage(xmas(), 0, 0, W, H);
  twinkles(c, t, 50, 40, 31);
  // pháo hoa trên phố cổ
  fireworks(c, el, FW, 800, [20, 8, 280, 40]);
  // cây thông khổng lồ lấp lánh + ngôi sao đỉnh
  for (let j = 0; j < 8; j++) { const y = 28 + j * 10, w = 6 + j * 4.2; poly(c, [160, y - 6, 160 + w, y + 10, 160 - w, y + 10], j % 2 ? '#1a4a32' : '#1e5a3a'); R(c, 160 - w + 2, y + 9, w * 2 - 4, 1, '#f4f8ff'); }
  R(c, 158, 108, 4, 6, '#4a2a1a');
  for (const [k, L] of TREE.entries()) { const a = 0.5 + 0.5 * Math.sin(t * 3 + k * 1.7); haloAt(c, L.x, L.y, 4, L.col, a * 0.7); R(c, L.x - 0.4, L.y - 0.4, 0.8, 0.8, L.col); }
  c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, 160, 22, 22, '#fff0a0', 0.6 + 0.2 * Math.sin(t * 2)); c.restore(); star(c, 160, 22, 4.5, '#ffe060', t * 0.3); star(c, 160, 22, 2.2, '#fffbe0', t * 0.3);
  // dây đèn giăng ngang phố
  for (let s = 0; s < 2; s++) for (let k = 1; k < 20; k++) { const u = k / 20, x = u * W, y = 46 + s * 14 + Math.sin(u * Math.PI) * 10, col = ['#fff1a8', '#ff8a9a', '#a8e0ff'][(k + s) % 3]; haloAt(c, x, y, 4, col, 0.5 + 0.3 * Math.sin(t * 3 + k)); circ(c, x, y, 0.6, col); }
  // người trượt băng xung quanh (bóng nhỏ)
  for (let k = 0; k < 7; k++) { const a = t * (0.3 + k * 0.03) + k * 0.9, x = 160 + Math.cos(a) * (60 + k * 10), y = 150 + Math.sin(a) * (10 + k * 2); R(c, x - 1.5, y - 9, 3, 7, ['#c8303a', '#3a5a8a', '#3a8a5a', '#8a4a8a'][k % 4]); circ(c, x, y - 10.5, 1.6, '#f4d0b0'); R(c, x - 1.6, y - 12.4, 3.2, 1.2, ['#ffffff', '#e8443a', '#f6c445'][k % 3]); R(c, x - 1.5, y - 2, 1, 2, '#2a2a3a'); R(c, x + 0.5, y - 2, 1, 2, '#2a2a3a'); }
  // hai đứa nắm tay lướt vòng quanh sân
  const spin = f.taps.filter(x => x.id === 'spin' && f.now - x.at < 1600).length > 0;
  const a0 = t * 0.42;
  f.seats.forEach((p, i) => { if (!p) return; const a = a0 - i * 0.15, x = 160 + Math.cos(a) * 100, y = 152 + Math.sin(a) * 18, right = -Math.sin(a) > 0;
    const view = spin ? (['front', 'side', 'back', 'side'] as const)[Math.floor(t * 10 + i) % 4] : 'side';
    const im = f.last(i, 'wine') < 4000 ? p.img('act', 12) : p.img('walk', Math.floor(t * 2) % 2, view);
    f.put(im, x - im.width * 0.35, y - im.height * 0.7, 0.7, right);
    if (f.last(i, 'wine') < 4000) { R(c, x + 4, y - 30, 3, 3, '#c8303a'); for (let j = 0; j < 3; j++) { const q = (t * 0.8 + j / 3) % 1; c.globalAlpha = 1 - q; circ(c, x + 5.5 + Math.sin(q * 6) * 1.5, y - 32 - q * 8, 1 + q, '#ffffff'); c.globalAlpha = 1; } } });
  if (spin) for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + t * 3, x = 160 + Math.cos(a0) * 100 + Math.cos(a) * 14, y = 140 + Math.sin(a0) * 18 + Math.sin(a) * 5; twinkle(c, x, y, 1.6, '#ffffff'); }
  hearts(f, 'wine', 3500, i => [160 + Math.cos(a0 - i * 0.15) * 100, 120 + Math.sin(a0) * 18]);
  // tuyết rơi
  for (let k = 0; k < 70; k++) { const sp = 6 + rr(k, 1) * 8, x = (rr(k, 2) * W + Math.sin(t * 0.7 + k) * 6 + t * 3) % W, y = (rr(k, 3) * H + t * sp) % H; circ(c, x, y, 0.4 + rr(k, 4) * 0.6, '#ffffff'); }
}
const skate: DuoCfg = {
  title: 'Chợ Giáng sinh & trượt băng', ms: XMS, join: 12000, price: 20, gift: { item: 'swiss_snowglobe' },
  ask: '⛸️ Dạo chợ Giáng sinh rồi trượt băng dưới cây thông khổng lồ', joinAsk: '⛸️ Trượt băng cùng người ấy', invite: '⛸️ Người ấy rủ đi trượt băng chợ Giáng sinh', yes: 'Nắm tay trượt!', late: 'Lần sau trượt cùng nha',
  buttons: [{ id: 'spin', label: '💫 Xoay vòng', from: 2000, to: XMS }, { id: 'wine', label: '🍷 Vang nóng', from: 2000, to: XMS }, { id: 'photo', label: '📸 Chụp', from: 2000, to: XMS }],
  caption: el => el < 4000 ? '🎄 Chợ Giáng sinh phố cổ — mùi quế, vang nóng, bánh gừng…' : el < 22000 ? '⛸️ Nắm tay nhau lướt vòng quanh cây thông khổng lồ' : el < FW ? '💫 Bấm "Xoay vòng" để xoay người như trượt băng nghệ thuật' : el < XMS ? '🎆 Pháo hoa nổ rực trên phố cổ!' : '🎄 Giáng sinh an lành nha',
  draw: drawXmas, snap: [FW + 9000], endTitle: '🎄 Một tối Giáng sinh ở Thuỵ Sĩ', endNote: 'Quả cầu tuyết đã vào túi đồ — lắc lên là tuyết rơi lấp lánh',
};

export const SKY_SCENES = { skylantern, balloon: balloonCfg, rooftop, glowsea, skate };
