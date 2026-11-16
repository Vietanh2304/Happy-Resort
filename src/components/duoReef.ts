// Ba màn dưới biển cho hai người (ở chỗ lặn ngắm san hô):
// 1. Hát cùng cá voi — hai đứa cùng hát thì cá voi lưng gù hát đáp, cá voi con tới dụi, lưới bong bóng, lên mặt nước lúc hoàng hôn xem cá voi nhảy & cầu vồng.
// 2. Kho báu tàu đắm — lặn vào xác tàu tối om bằng đèn pin, mỗi người tìm một nửa chìa khoá, bạch tuộc khổng lồ giữ rương phun mực, cù cho nó buông, cùng tra chìa.
// 3. Vũ hội tiên cá — chạm ngọc thần hoá đuôi tiên cá, bơi vào cung điện vỏ sò, nhảy theo nhịp, kết bằng nụ hôn trong bong bóng & pháo hoa dưới biển.
import type { DuoCfg, F, Seat } from './Duo';
import type { Frame } from '../lib/sprites';
import type { View } from '../lib/chibi';
import { bake, circ, ell, heart, line, poly, R, twinkle, type Ctx } from '../lib/canvasArt';
import { fireworks, haloAt, mix, rr } from './duoSky';

const W = 320, H = 180, TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
const grad = (c: Ctx, y0: number, y1: number, cols: string[]) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); };
const putAt = (f: F, im: HTMLImageElement, x: number, foot: number, sc: number, flip = false) => { if (im.width) f.put(im, x - (im.width * sc) / 2, foot - im.height * sc, sc, flip); };
const fadeIn = (c: Ctx, el: number) => { if (el < 1200) { c.globalAlpha = 1 - el / 1200; c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; } };
const lit = (c: Ctx, fn: () => void) => { c.save(); c.globalCompositeOperation = 'lighter'; fn(); c.restore(); };
/** điểm trên đường trái tim (a 0..2π), cỡ ~16×14 */
const hpt = (a: number): [number, number] => [16 * Math.pow(Math.sin(a), 3), -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))];
/** tia nắng xiên xuống nước, đung đưa */
const rays = (c: Ctx, t: number, a: number) => { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const x = 20 + k * 58 + Math.sin(t * 0.4 + k) * 10; c.globalAlpha = a * (0.5 + 0.5 * Math.sin(t * 0.7 + k * 1.7)); poly(c, [x, 0, x + 16, 0, x + 64, H, x + 30, H], '#9adcff22'); } c.restore(); };
const bubbles = (c: Ctx, t: number, x: number, y: number, n: number, seed: number) => { for (let k = 0; k < n; k++) { const q = (t * 0.35 + rr(k, seed)) % 1, bx = x + Math.sin(q * 9 + k) * 4 + (rr(k, seed + 1) - 0.5) * 20; c.globalAlpha = 0.8 * (1 - q); circ(c, bx, y - q * 90, 0.8 + rr(k, seed + 2) * 1.4, '#e8faff'); R(c, bx - 0.4, y - q * 90 - 0.6, 0.5, 0.5, '#ffffff'); } c.globalAlpha = 1; };
const ring = (c: Ctx, x: number, y: number, r: number, col: string, w = 0.6) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(x, y, Math.max(0.3, r), 0, TAU); c.stroke(); };
function fish(c: Ctx, x: number, y: number, s: number, col: string, dir = -1, wag = 0) {
  ell(c, x, y, 4 * s, 2 * s, col); poly(c, [x - dir * 3.4 * s, y, x - dir * 6.5 * s, y - (2 + wag) * s, x - dir * 6.5 * s, y + (2 - wag) * s], mix(col, '#000000', 0.15));
  R(c, x + dir * 2 * s - 0.4, y - 0.8 * s, 0.8, 0.8, '#1a1a2a'); R(c, x - 1, y - 2 * s, 2 * s, 0.6, mix(col, '#ffffff', 0.4));
}
function jelly(c: Ctx, x: number, y: number, t: number, col: string, s = 1) {
  const p = 1 + Math.sin(t * 3) * 0.12;
  lit(c, () => haloAt(c, x, y, 14 * s, col, 0.55));
  c.globalAlpha = 0.85; ell(c, x, y, 7 * s * p, 5 * s / p, mix(col, '#ffffff', 0.35)); c.globalAlpha = 1;
  R(c, x - 6 * s * p, y, 12 * s * p, 1, col);
  for (let k = 0; k < 5; k++) { const tx = x - 4 * s + k * 2 * s; c.strokeStyle = col; c.globalAlpha = 0.7; c.lineWidth = 0.6; c.beginPath(); c.moveTo(tx, y + 1); for (let j = 1; j < 7; j++) c.lineTo(tx + Math.sin(t * 3 + j + k) * 1.5, y + 1 + j * 2.2 * s); c.stroke(); c.globalAlpha = 1; }
}
/** nốt nhạc nhỏ */
const note = (c: Ctx, x: number, y: number, col: string) => { ell(c, x, y, 1.6, 1.2, col, -0.4); R(c, x + 1.1, y - 6, 0.7, 6, col); R(c, x + 1.1, y - 6, 2.6, 0.8, col); };
const kissing = (f: F) => f.n === 2 && [0, 1].some(i => f.last(i, 'kiss') < 3500);
/** mốc thời gian (el) hai người cùng bấm nút id trong vòng `win` ms — chơi một mình thì lần bấm đầu tiên */
function together(f: F, id: string, win: number, after = 0): number | null {
  const ts = f.taps.filter(x => x.id === id && x.i >= 0).map(x => ({ i: x.i, el: f.el - (f.now - x.at) })).filter(x => x.el >= after);
  if (f.n < 2) return ts.length ? ts[0].el : null;
  for (const a of ts) { const b = ts.find(x => x.i !== a.i && Math.abs(x.el - a.el) <= win); if (b) return Math.max(a.el, b.el); }
  return null;
}
const tapsOf = (f: F, id: string, from = 0, to = Infinity) => f.taps.filter(x => x.id === id && x.i >= 0).map(x => ({ i: x.i, el: f.el - (f.now - x.at) })).filter(x => x.el >= from && x.el < to);

// ═════════ 1. Hát cùng cá voi ═════════
const WH_IN = 9000, WH_NET = 38000, WH_UP = 50000, WH_BREACH = 56500, WH_MS = 72000;
/** cá voi lưng gù: vây ngực dài trắng, rãnh họng, u sần trên đầu; đầu quay sang phải (dir 1) */
function humpback(c: Ctx, x: number, y: number, s: number, a: number, t: number, dir = 1) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s * dir, s);
  const sw = Math.sin(t * 1.4) * 5, fin = Math.sin(t * 0.9) * 0.25;
  // vây đuôi
  poly(c, [-58, 0, -78, -12 + sw, -86, -14 + sw, -76, sw * 0.4, -86, 14 + sw, -78, 12 + sw], '#25405a');
  poly(c, [-36, -9, -60, -3, -60, 3, -36, 10], '#2a4864');
  // thân
  ell(c, 4, 0, 46, 15, '#2e4c6a'); ell(c, 8, 6, 38, 8, '#c8d8e4');
  for (let k = 0; k < 7; k++) line(c, 12 + k * 4, 4 + k * 0.3, 38 - k * 2, 9 - k * 0.2, 0.5, '#8aa0b4');   // rãnh họng
  ell(c, 40, -1, 12, 11, '#2e4c6a'); R(c, 44, 5, 8, 1.2, '#1a2a3a');
  for (const [ux, uy] of [[42, -8], [47, -6], [37, -10], [50, -3]]) circ(c, ux, uy, 1.1, '#3e5c7a');
  poly(c, [-22, -13, -16, -21, -12, -14], '#25405a');   // vây lưng
  R(c, 36, -3, 1.6, 1.6, '#0a141e'); R(c, 36.4, -2.8, 0.5, 0.5, '#ffffff');
  // vây ngực rất dài
  c.save(); c.translate(18, 8); c.rotate(0.5 + fin); poly(c, [-2, -3, 7, 0, 6, 14, 3, 34, -2, 31, -4, 12], '#d8e4ee'); for (let k = 0; k < 4; k++) circ(c, 4 - k * 0.4, 4 + k * 8, 1, '#9ab0c4'); c.restore();
  c.restore();
}
const whaleCal = (f: F) => {
  // mỗi lần hai đứa cùng hát (lệch nhau ≤ 2.5 s) là một lần cá voi hát đáp
  const s = tapsOf(f, 'sing', 0, WH_UP), out: number[] = [];
  for (const a of s) { if (out.some(x => Math.abs(x - a.el) < 2600)) continue; const b = f.n < 2 ? a : s.find(x => x.i !== a.i && Math.abs(x.el - a.el) <= 2500); if (b) out.push(Math.max(a.el, b.el) + 400); }
  return out;
};
const PX = (i: number) => 128 + i * 26;
function drawWhale(f: F) {
  const { c, el, t } = f, surf = ease(clamp((el - WH_UP) / 4500));
  const answers = whaleCal(f), sung = answers.filter(x => x <= el);
  if (surf < 1) {
    const deep = clamp(el / WH_NET) * 0.3;
    grad(c, 0, H, [mix('#3aa8e0', '#1a5a98', deep), mix('#1a78c0', '#0a3a78', deep), '#0a3e78', '#05183a']);
    rays(c, t, 0.9 - deep);
    // sinh vật phù du — sáng dần lên mỗi lần cá voi hát đáp
    const glowAmt = clamp(sung.length / 4);
    lit(c, () => { for (let k = 0; k < 120; k++) { const x = (rr(k, 1) * W + t * 3 + Math.sin(t * 0.4 + k) * 6) % W, y = rr(k, 2) * H; haloAt(c, x, y, 1.4 + glowAmt * 1.4, k % 2 ? '#8af0ff' : '#c8ffe8', 0.1 + glowAmt * 0.35); } });
    // cá voi mẹ & con
    const inQ = ease(clamp((el - WH_IN) / 13000)), net = el > WH_NET;
    let mx = lerp(430, 196, inQ) + Math.sin(t * 0.3) * 14, my = 58 + Math.sin(t * 0.5) * 5, ma = Math.sin(t * 0.5) * 0.05, md = -1, ms = 1;
    if (net) { const q = clamp((el - WH_NET) / 1500), a = (el - WH_NET) / 1000 * 0.9; mx = lerp(mx, 160 + Math.cos(a) * 110, q); my = lerp(my, 158 + Math.sin(a) * 8, q); md = Math.sin(a) > 0 ? -1 : 1; ma = 0; ms = lerp(1, 0.6, q); }
    if (el > WH_IN) humpback(c, mx, my, ms, ma, t, md);
    // cá voi hát đáp: sóng âm cầu vồng toả ra từ đầu cá voi
    const head = mx + md * 40 * ms;
    lit(c, () => { for (const a0 of sung) { const q = (el - a0) / 4500; if (q > 1) continue; for (let k = 0; k < 4; k++) { const r = (q * 1.3 - k * 0.12) * 200; if (r < 2) continue; c.globalAlpha = (1 - q) * 0.7; ring(c, head, my, r, ['#ff8ad8', '#ffd84a', '#7affc8', '#8ac8ff'][k], 1.4); } c.globalAlpha = 1; for (let k = 0; k < 8; k++) note(c, head + Math.cos(k) * q * 60, my - 10 - q * 40 + Math.sin(k * 2) * 10, '#fff2c0'); } });
    // cá voi con: theo mẹ; ai vẫy thì bơi tới dụi đầu vào người đó
    const pets = tapsOf(f, 'pet', WH_IN, WH_NET), pet = pets[pets.length - 1];
    let cx = mx - md * 10 + Math.sin(t * 0.8) * 8, cy = my + 30 + Math.sin(t * 1.1) * 4, cd = md;
    if (pet && el - pet.el < 6000) { const q = ease(clamp((el - pet.el) / 1800)) * (1 - ease(clamp((el - pet.el - 4800) / 1200))); cx = lerp(cx, PX(pet.i) + 22, q); cy = lerp(cy, 98 + Math.sin(t * 6) * 1.5 * q, q); if (q > 0.5) cd = -1; }
    if (el > WH_IN + 2000 && !net) humpback(c, cx, cy, 0.34, Math.sin(t * 1.3) * 0.08, t * 1.6, cd);
    if (pet && el - pet.el > 1600 && el - pet.el < 5000) lit(c, () => { for (let k = 0; k < 5; k++) { const q = ((el - pet.el) / 1200 + k / 5) % 1; c.globalAlpha = 1 - q; heart(c, PX(pet.i) + 12 + Math.sin(k * 2) * 6, 86 - q * 30, 1.6, '#ff9ad0'); } c.globalAlpha = 1; });
    // lưới bong bóng xoắn ốc bao quanh hai đứa
    if (net) { const nq = clamp((el - WH_NET - 1500) / 2000); for (let k = 0; k < 110; k++) { const yy = H + 10 - ((t * 34 + k * 5.5) % 210), a = k * 0.55 + t * 0.7, r = 54 + Math.sin(k) * 4, bx = 141 + Math.cos(a) * r, front = Math.sin(a) > 0; c.globalAlpha = nq * (front ? 0.9 : 0.4); ring(c, bx, yy, 1 + rr(k, 3) * 1.8, sung.length > 1 ? ['#ffd0f0', '#d0fff4', '#fff4c0'][k % 3] : '#e8faff'); } c.globalAlpha = 1; }
    // hai đứa lơ lửng; hát thì nốt nhạc bay lên; được dụi thì giơ tay vui
    f.seats.forEach((p, i) => {
      if (!p) return; const x = PX(i), foot = 112 + Math.sin(t * 1.8 + i * 2) * 2.5;
      const touched = pet && pet.i === i && el - pet.el > 1600 && el - pet.el < 4600, singing = f.last(i, 'sing') < 1800;
      const im = net && kissing(f) ? p.img('kiss', 0, 'side') : touched ? p.img('act', 12) : singing ? p.img('act', 3) : p.img('idle', 0, net ? 'side' : 'front');
      putAt(f, im, net && kissing(f) ? 141 + (i ? 4 : -4) : x, foot, 0.55, (net || kissing(f)) && i === 1);
      if (singing) { const q = f.last(i, 'sing') / 1800; for (let k = 0; k < 3; k++) { c.globalAlpha = 1 - q; note(c, x + 4 + k * 4 + Math.sin(q * 6 + k) * 3, foot - 30 - q * 24 - k * 4, '#fff6d0'); } c.globalAlpha = 1; }
    });
    bubbles(c, t, 141, 84, 6, 4);
    if (net && kissing(f)) lit(c, () => { for (let k = 0; k < 8; k++) { const q = (t * 0.6 + k / 8) % 1; heart(c, 141 + Math.sin(k * 2.1) * 12, 80 - q * 30, 1.8, '#ff9ad8'); } });
  }
  // ── lên mặt nước lúc hoàng hôn ──
  if (surf > 0) {
    c.globalAlpha = surf; const HZ = 78;
    grad(c, 0, HZ, ['#2a1e6a', '#7a2e86', '#e8607a', '#ffa858', '#ffe0a0']);
    for (let k = 0; k < 24; k++) { c.globalAlpha = surf * (0.4 + 0.6 * Math.sin(t * 2 + k)); R(c, rr(k, 9) * W, rr(k, 8) * 30, 0.6, 0.6, '#ffffff'); }
    c.globalAlpha = surf; lit(c, () => haloAt(c, 236, HZ - 6, 46, '#ffb060', 0.7 * surf)); circ(c, 236, HZ - 6, 14, '#fff0b8');
    grad(c, HZ, H, ['#e8906a', '#9a4a7a', '#3a2a6a', '#141640']);
    for (let y = HZ + 2; y < H; y += 3) { const w = 6 + (y - HZ) * 0.5 + Math.sin(t * 3 + y) * 3; R(c, 236 - w / 2 + Math.sin(t * 2 + y * 0.3) * 3, y, w, 0.8, '#ffd8a0'); R(c, (rr(y, 3) * W + t * 6) % W, y + 1, 10, 0.5, '#ffffff22'); }
    // cá voi nhảy vọt khỏi mặt nước
    const bq = (el - WH_BREACH) / 4200;
    if (bq > 0 && bq < 1) {
      const bx = 60 + bq * 110, by = HZ + 30 - Math.sin(bq * Math.PI) * 78, ba = -1.25 + bq * 2.6;
      c.save(); c.beginPath(); c.rect(0, 0, W, HZ + 1); c.clip(); humpback(c, bx, by, 0.62, ba, t, 1); c.restore();
      for (let k = 0; k < 40; k++) { for (const [sx, s0] of [[66, 0], [168, 0.78]] as const) { const q = (bq - s0) / 0.25; if (q < 0 || q > 1) continue; const a = -Math.PI / 2 + (rr(k, 2) - 0.5) * 1.6, v = 30 + rr(k, 3) * 40; c.globalAlpha = surf * (1 - q); circ(c, sx + Math.cos(a) * v * q, HZ - Math.sin(-a) * v * q + q * q * 40, 1 + rr(k, 4), '#ffffff'); } }
      c.globalAlpha = surf;
    }
    // cột nước phun & cầu vồng trong hơi nước
    if (el > WH_BREACH + 4600) {
      const q = clamp((el - WH_BREACH - 4600) / 1500);
      ell(c, 168, HZ + 3, 18, 3, '#2e4c6a');
      for (let k = 0; k < 50; k++) { const qq = (t * 0.8 + rr(k, 5)) % 1; c.globalAlpha = surf * q * (1 - qq) * 0.8; circ(c, 168 + (rr(k, 6) - 0.5) * qq * 30, HZ - qq * 48, 1 + qq * 2, '#ffffff'); }
      lit(c, () => { ['#ff4a4a', '#ff9a3a', '#ffe04a', '#5ae86a', '#4ab0ff', '#9a6aff'].forEach((col, k) => { c.globalAlpha = surf * q * 0.32; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(168, HZ + 10, 52 - k * 2.2, Math.PI, TAU); c.stroke(); }); });
      c.globalAlpha = surf;
    }
    // hai đứa ngoi đầu lên, nước gợn quanh vai
    const kiss = el > WH_MS - 9000 || kissing(f);
    f.seats.forEach((p, i) => {
      if (!p) return; const x = kiss ? 150 + (i ? 4 : -4) : 140 + i * 22, wl = 104 + Math.sin(t * 1.6 + i) * 0.8, im = kiss ? p.img('kiss', 0, 'side') : p.img('idle', 0, 'side');
      c.save(); c.beginPath(); c.rect(0, 0, W, wl); c.clip(); putAt(f, im, x, wl + 14, 0.55, i === 1); c.restore();
      c.globalAlpha = surf * 0.8; ell(c, x, wl + 0.5, 9 + Math.sin(t * 2 + i) * 1.5, 1.6, '#ffe8d066'); c.globalAlpha = surf;
    });
    if (kiss) lit(c, () => { for (let k = 0; k < 8; k++) { const q = (t * 0.5 + k / 8) % 1; c.globalAlpha = surf * (1 - q); heart(c, 150 + Math.sin(k * 2.3 + q * 4) * 10, 82 - q * 34, 1.6 + (k % 2) * 0.8, k % 2 ? '#ff8ab0' : '#ffd0e0'); } });
    c.globalAlpha = 1;
  }
  fadeIn(c, el);
}
export const whale: DuoCfg = {
  title: 'Hát cùng cá voi', ms: WH_MS, join: 25000, wait: true, price: 0,
  ask: '🐋 Lặn ra biển khơi, hát cùng cá voi lưng gù', joinAsk: '🐋 Lặn cùng người ấy', invite: '🐋 Người ấy rủ ra biển khơi hát cùng cá voi', yes: 'Đi thôi!', late: 'Cá voi bơi xa mất rồi — lần sau nha',
  buttons: [{ id: 'sing', label: '🎵 Hát cùng nhau', from: 3000, to: WH_UP }, { id: 'pet', label: '🤚 Vẫy cá voi con', from: WH_IN + 6000, to: WH_NET }, { id: 'kiss', label: '💋 Hôn', from: WH_NET, to: WH_MS }, { id: 'photo', label: '📸 Chụp', from: 3000, to: WH_MS }],
  caption: el => el < WH_IN ? '🎵 Nghe kìa… có tiếng hát từ ngoài khơi xa' : el < 22000 ? '🐋 Cá voi lưng gù mẹ dắt con tới — hai đứa cùng bấm 🎵 để hát với nó' : el < WH_NET ? '🎶 Cùng hát một lúc thì cá voi hát đáp · vẫy cho cá voi con tới dụi đầu' : el < WH_UP ? '🫧 Cá voi thổi lưới bong bóng xoắn quanh hai đứa' : el < WH_BREACH ? '🌅 Ngoi lên mặt nước — hoàng hôn đỏ rực' : el < WH_BREACH + 4600 ? '🐋 Cá voi nhảy vọt lên chào hai đứa!' : '🌈 Cột nước phun thành cầu vồng giữa hoàng hôn',
  draw: drawWhale, snap: [20000, 33000, 45000, WH_BREACH + 7000], endTitle: '🐋 Bài hát của cá voi', endNote: 'Cả đại dương nghe hai đứa mình hát chung một bài 🎶',
};

// ═════════ 2. Kho báu tàu đắm (đèn pin trong bóng tối) ═════════
const WR_IN = 12000, WR_OCT = 40000, WR_INK = 46000, WR_TICK = 50500, WR_KEY = 56000, WR_MS = 76000;
const wreckOut = () => bake('reef:wreck', W, H, (c, rnd) => {
  grad(c, 0, H, ['#14466a', '#0c2c4a', '#061a30', '#030c18']);
  for (let x = 0; x < W; x += 3) R(c, x, 148 + Math.sin(x * 0.04) * 4, 3, 40, x % 6 ? '#3a3a3a' : '#423f38');
  c.save(); c.translate(160, 118); c.rotate(-0.12);
  poly(c, [-110, -20, 100, -26, 120, -50, 104, 20, -96, 28], '#3a2618');
  for (let k = 0; k < 6; k++) line(c, -104, -14 + k * 7, 106, -20 + k * 7, 0.7, '#2a1a10');
  for (let k = 0; k < 6; k++) { circ(c, -70 + k * 30, -6, 3.4, '#a88a4a'); circ(c, -70 + k * 30, -6, 2.4, '#0a1420'); }
  poly(c, [30, -24, 50, -26, 40, 6], '#0a1420');   // lỗ thủng = cửa vào
  line(c, -20, -24, -10, -110, 3, '#2a1a10'); line(c, -40, -86, 10, -92, 2, '#2a1a10');
  poly(c, [-36, -84, 6, -88, 0, -50, -14, -60, -30, -46], '#c8b89066');
  line(c, 70, -30, 100, -80, 2.4, '#2a1a10');
  c.restore();
  for (let k = 0; k < 14; k++) { const x = rnd() * W; for (let y = 152; y > 110 + rnd() * 20; y -= 4) circ(c, x + Math.sin(y * 0.2) * 3, y, 2, '#1e4a2e'); }
});
const hull = () => bake('reef:hull', W, H, (c, rnd) => {
  grad(c, 0, H, ['#4a3424', '#3a281a', '#2a1c12']);
  for (let y = 0; y < 150; y += 9) { R(c, 0, y, W, 1, '#22160e'); for (let x = (y / 9) % 2 ? 0 : 30; x < W; x += 60) R(c, x, y, 1, 9, '#22160e'); }
  for (let k = 0; k < 8; k++) { const x = 18 + k * 42; c.strokeStyle = '#24180e'; c.lineWidth = 7; c.beginPath(); c.moveTo(x - 8, 0); c.quadraticCurveTo(x + (k - 3.5) * 4, 70, x + (k - 3.5) * 8, 150); c.stroke(); c.strokeStyle = '#5a4030'; c.lineWidth = 1; c.stroke(); }
  for (const [px, py] of [[70, 40], [250, 36]]) { circ(c, px, py, 10, '#a88a4a'); circ(c, px, py, 8, '#1e5a86'); circ(c, px - 2, py - 2, 3, '#4a8ab8'); }
  for (let x = 0; x < W; x += 3) R(c, x, 148 + Math.sin(x * 0.06) * 3, 3, 40, x % 6 ? '#8a7650' : '#9a8660');
  for (const [bx, by] of [[34, 146], [282, 138]]) { ell(c, bx, by - 14, 14, 18, '#6a4428'); for (const d of [-9, 0, 9]) R(c, bx - 14, by - 14 + d, 28, 1.6, '#3a2a1a'); }
  poly(c, [190, 150, 196, 132, 222, 134, 226, 152], '#5a3e24'); line(c, 192, 140, 224, 144, 1, '#3a2814');
  R(c, 92, 146, 26, 7, '#2a2a30'); circ(c, 90, 149, 4, '#2a2a30'); circ(c, 108, 154, 4, '#1a1a20');
  // tấm bản đồ kho báu trên vách
  poly(c, [38, 62, 66, 60, 68, 86, 40, 88], '#d8c090'); line(c, 44, 80, 50, 70, 0.6, '#8a5a3a'); line(c, 50, 70, 58, 76, 0.6, '#8a5a3a'); line(c, 58, 72, 62, 66, 0.8, '#c83a3a'); line(c, 62, 72, 58, 66, 0.8, '#c83a3a');
  for (let k = 0; k < 24; k++) { circ(c, 40 + rnd() * 250, 152 + rnd() * 10, 1.2, '#e8c04a'); }
  line(c, 215, 0, 215, 26, 0.7, '#5a4a3a');
});
let dark: HTMLCanvasElement | null = null;
type Poi = 'map' | 'keyA' | 'keyB' | 'crab' | 'eel' | 'puffer' | 'lantern';
const POI: Record<Poi, [number, number]> = { map: [53, 74], keyA: [100, 150], keyB: [250, 58], crab: [44, 158], eel: [282, 122], puffer: [238, 100], lantern: [215, 32] };
const LISTS: Poi[][] = [['map', 'keyA', 'crab', 'lantern'], ['puffer', 'keyB', 'eel', 'map']];
const SOLO: Poi[] = ['map', 'keyA', 'puffer', 'keyB', 'eel', 'crab'];
const WX = (i: number) => 116 + i * 88;
/** đèn pin của ghế i đang soi đâu, đã soi được những gì (mỗi lần bấm 🔦 hoặc 7 s lại soi chỗ mới) */
function beam(f: F, i: number) {
  const list = f.n < 2 ? SOLO : LISTS[i], ev = [...tapsOf(f, 'look', WR_IN, WR_OCT).filter(x => f.n < 2 || x.i === i).map(x => x.el)];
  for (let a = WR_IN + 7000; a < Math.min(f.el, WR_OCT); a += 7000) ev.push(a);
  ev.sort((a, b) => a - b); const done = ev.filter(x => x <= f.el), idx = done.length, at = done.length ? done[done.length - 1] : WR_IN;
  const cur = list[idx % list.length], prev = idx ? list[(idx - 1) % list.length] : null;
  const seen = new Map<Poi, number>(); seen.set(list[0], WR_IN); done.forEach((x, k) => { const p = list[(k + 1) % list.length]; if (!seen.has(p)) seen.set(p, x); });
  return { cur, prev, at, seen };
}
function octopus(c: Ctx, x: number, y: number, t: number, giggle: number, hold: number) {
  const sh = giggle > 0 ? Math.sin(t * 40) * 1.5 * giggle : 0; x += sh;
  for (let k = 0; k < 8; k++) {
    const side = k < 4 ? -1 : 1, j = k % 4, len = 46 + j * 8;
    c.lineCap = 'round'; let px = x + side * (4 + j * 3), py = y + 10;
    for (let s = 1; s <= 10; s++) { const u = s / 10, wave = Math.sin(t * 2 + k + u * 5) * 6 * u; const hx = x + side * (8 + j * 5 + u * len * 0.6) + wave * (1 - hold * 0.6), hy = y + 10 + u * (hold ? 34 + j * 2 : len * 0.5) + Math.cos(t * 2 + k) * 2 * u;
      line(c, px, py, hx, hy, 7 * (1 - u * 0.75), j % 2 ? '#c8405a' : '#d04862'); if (s % 2 === 0 && s < 9) circ(c, (px + hx) / 2, (py + hy) / 2 + 1.4, 1.1 * (1 - u * 0.6), '#ffc0c8'); px = hx; py = hy; }
  }
  c.lineCap = 'butt';
  ell(c, x, y - 6, 24, 22, '#d8506a'); ell(c, x - 6, y - 14, 9, 7, '#e87a8a');
  for (const [sx, sy] of [[-12, -16], [10, -20], [14, -6], [-16, -2], [2, -26]]) circ(c, x + sx, y + sy, 2, '#b8304a');
  for (const d of [-8, 8]) { if (giggle > 0) { line(c, x + d - 3, y + 2, x + d, y - 1, 1, '#2a0a14'); line(c, x + d, y - 1, x + d + 3, y + 2, 1, '#2a0a14'); } else { ell(c, x + d, y + 1, 4, 5, '#fff6f0'); circ(c, x + d + Math.sin(t) * 0.8, y + 2, 2.2, '#1a0a14'); R(c, x + d, y - 1, 0.8, 0.8, '#ffffff'); } }
  ell(c, x - 14, y + 6, 3, 1.6, '#ff8aa8'); ell(c, x + 14, y + 6, 3, 1.6, '#ff8aa8');
}
function chest(c: Ctx, x: number, y: number, open: number) {
  R(c, x - 18, y - 14, 36, 16, '#7a4a22'); R(c, x - 18, y - 14, 36, 2, '#9a6a32'); for (const d of [-12, 12]) R(c, x + d - 1.5, y - 14, 3, 16, '#c8a040'); R(c, x - 3, y - 12, 6, 6, '#e8c04a'); R(c, x - 0.8, y - 10, 1.6, 2.6, '#3a2010');
  c.save(); c.translate(x - 18, y - 14); c.rotate(-open * 1.9); ell(c, 18, 0, 18, 8, '#8a5228'); R(c, 0, -0.5, 36, 1.5, '#c8a040'); for (const d of [6, 30]) R(c, d - 1.5, -8, 3, 8, '#c8a040'); c.restore();
}
function drawWreck(f: F) {
  const { c, el, t } = f;
  const inside = el >= WR_IN, B = [0, 1].map(i => (f.seats[i] || (f.n < 2 && i === 0) ? beam(f, f.n < 2 ? 0 : i) : null));
  const seenAt = (p: Poi) => Math.min(...B.map(b => b?.seen.get(p) ?? Infinity));
  const keysAt = Math.max(seenAt('keyA'), seenAt('keyB'));
  const ticks = tapsOf(f, 'tickle', WR_TICK, WR_KEY), letGo = ticks.length >= (f.n < 2 ? 2 : 3) ? ticks[f.n < 2 ? 1 : 2].el : WR_KEY - 500;
  const openEl = Math.min(together(f, 'key', 3000, WR_KEY) ?? Infinity, WR_KEY + 8000), opened = el > openEl ? clamp((el - openEl) / 1400) : 0;
  const inkQ = el > WR_INK && el < WR_TICK + 600 ? clamp((el - WR_INK) / 900) * (1 - clamp((el - WR_TICK + 1200) / 1800)) : 0;
  // vị trí hai đứa
  const pos = (i: number): [number, number] => {
    if (!inside) { const q = el / WR_IN; return [150 + i * 22, lerp(150, 128, q) + Math.sin(t * 2 + i) * 2]; }
    const hug = inkQ > 0.3 ? 1 : 0, fin = el > openEl + 4500 ? ease(clamp((el - openEl - 4500) / 2000)) : 0;
    return [lerp(WX(i), 150 + i * 20, Math.max(hug, fin)), (hug ? 118 : 132) + Math.sin(t * 1.8 + i * 2) * 2 - fin * 8];
  };
  // điểm đèn pin chiếu tới
  const aim = (i: number): [number, number] => {
    if (!inside) return [160, 100];
    if (el > WR_OCT) return el > openEl ? [160, 120] : el > letGo ? [160, 134] : [160 + (i ? 8 : -8), 100];
    const b = B[i]; if (!b) return [160, 100]; const q = ease(clamp((el - b.at) / 700)), a = POI[b.cur], p = b.prev ? POI[b.prev] : [160, 110];
    return [lerp(p[0], a[0], q) + Math.sin(t * 1.3 + i) * 4, lerp(p[1], a[1], q) + Math.cos(t * 1.1 + i) * 3];
  };
  if (!inside) { const z = 1 + ease(el / WR_IN) * 0.9; c.save(); c.translate(198, 110); c.scale(z, z); c.drawImage(wreckOut(), -198, -110, W, H); c.restore(); }
  else c.drawImage(hull(), 0, 0, W, H);
  // ── các thứ trong khoang tàu ──
  if (inside) {
    const sinceSeen = (p: Poi) => el - seenAt(p);
    // cua đội mũ thuyền trưởng vẫy càng
    { const [x, y] = POI.crab, wv = sinceSeen('crab') > 0 && sinceSeen('crab') < 4000 ? Math.sin(t * 10) * 3 : 0; ell(c, x, y - 3, 7, 4, '#e8503a'); line(c, x - 6, y - 4, x - 11, y - 9 - wv, 1.6, '#e8503a'); line(c, x + 6, y - 4, x + 11, y - 9 + wv, 1.6, '#e8503a'); circ(c, x - 11, y - 10 - wv, 2, '#ff6a4a'); circ(c, x + 11, y - 10 + wv, 2, '#ff6a4a'); R(c, x - 2.5, y - 8, 1.2, 1.2, '#1a0a0a'); R(c, x + 1.5, y - 8, 1.2, 1.2, '#1a0a0a'); poly(c, [x - 6, y - 7, x + 6, y - 7, x + 3, y - 11, x - 3, y - 11], '#1a1a2a'); R(c, x - 1, y - 10.4, 2, 1, '#e8c04a'); }
    // cá nóc phồng lên khi bị soi
    { const [x, y] = POI.puffer, s = sinceSeen('puffer'), pf = s > 0 && s < 5000 ? ease(clamp(s / 500)) * (1 - ease(clamp((s - 4000) / 1000))) : 0, r = 5 + pf * 6; circ(c, x, y, r, '#e8c85a'); circ(c, x, y + r * 0.3, r * 0.75, '#f8e8a8'); if (pf > 0.3) for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; line(c, x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2), 0.7, '#a8883a'); } circ(c, x + r * 0.5, y - 1, 1.6, '#ffffff'); R(c, x + r * 0.5, y - 1.4, 1, 1, '#1a1a1a'); poly(c, [x - r, y, x - r - 4, y - 3, x - r - 4, y + 3], '#d8b84a'); }
    // lươn biển thò ra từ thùng gỗ — giật mình!
    { const [x, y] = POI.eel, s = sinceSeen('eel'), out = s > 0 && s < 3500 ? ease(clamp(s / 250)) * (1 - ease(clamp((s - 2500) / 1000))) : 0.15; for (let k = 0; k < 8; k++) circ(c, x - k * out * 3.2, y + Math.sin(k + t * 6) * out * 1.6, 3 - k * 0.15, k % 2 ? '#4a6a3a' : '#5a7a44'); if (out > 0.3) { const hx = x - 26 * out; ell(c, hx, y, 5, 3.4, '#6a8a4a'); poly(c, [hx - 5, y + 1, hx + 1, y + 3, hx - 4, y + 4], '#3a1a1a'); R(c, hx - 1, y - 2, 1.2, 1.2, '#ffe04a'); } }
    // đèn lồng treo — soi trúng thì thắp sáng
    { const [x, y] = POI.lantern, on = sinceSeen('lantern') > 0 ? 1 : 0; R(c, x - 4, y - 6, 8, 11, '#3a2a1a'); R(c, x - 3, y - 5, 6, 9, on ? '#ffd870' : '#5a5040'); }
    // hai nửa chìa khoá
    if (el < keysAt) for (const k of ['keyA', 'keyB'] as const) { const [x, y] = POI[k]; R(c, x - 4, y - 1, 8, 2, '#e8c04a'); circ(c, k === 'keyA' ? x - 5 : x + 5, y, 3, '#e8c04a'); circ(c, k === 'keyA' ? x - 5 : x + 5, y, 1.2, '#3a2a1a'); }
    // rương báu + bạch tuộc khổng lồ ôm chặt
    const oq = ease(clamp((el - WR_OCT) / 2600)), lastT = ticks.length ? el - ticks[ticks.length - 1].el : Infinity, giggle = lastT < 900 ? 1 - lastT / 900 : 0;
    const away = el > letGo ? ease(clamp((el - letGo - 600) / 3000)) : 0;
    if (el > WR_OCT && away < 1) octopus(c, 160 + away * 40, lerp(150, 112, oq) - away * 160, t, el > letGo && el < letGo + 600 ? 1 : giggle, el < letGo ? oq : 0);
    chest(c, 160, 150, ease(opened));
    if (giggle > 0) { c.globalAlpha = giggle; for (let k = 0; k < 3; k++) circ(c, 186 + k * 5, 90 - k * 6 - (1 - giggle) * 10, 1.4 + k * 0.5, '#ffe0f0'); c.globalAlpha = 1; }
  } else {
    for (let k = 0; k < 18; k++) { const x = ((rr(k, 2) * 380 - t * 6) % 380 + 380) % 380 - 30; fish(c, x, 40 + rr(k, 3) * 60, 0.6, '#1a3a5a', -1, Math.sin(t * 8 + k)); }
  }
  // ── bóng tối & đèn pin ──
  const darkA = inside ? 0.94 * (1 - ease(clamp((el - openEl) / 2600))) : 0.6;
  if (darkA > 0.01) {
    dark ??= document.createElement('canvas'); dark.width = W * 2; dark.height = H * 2;
    const d = dark.getContext('2d')!; d.setTransform(2, 0, 0, 2, 0, 0); d.globalCompositeOperation = 'source-over'; d.globalAlpha = darkA; d.fillStyle = '#02060e'; d.fillRect(0, 0, W, H); d.globalAlpha = 1; d.globalCompositeOperation = 'destination-out';
    const hole = (x: number, y: number, r: number, a = 1) => { const g = d.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.8})`); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g; d.fillRect(x - r, y - r, r * 2, r * 2); };
    for (let i = 0; i < 2; i++) {
      if (!f.seats[i]) continue; const [px, py] = pos(i), ox = px + (i ? -6 : 6), oy = py - 16, [ax, ay] = aim(i), ang = Math.atan2(ay - oy, ax - ox), L = Math.hypot(ax - ox, ay - oy) + 26;
      const g = d.createRadialGradient(ox, oy, 2, ox, oy, L); g.addColorStop(0, 'rgba(0,0,0,0.95)'); g.addColorStop(0.75, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); d.fillStyle = g;
      d.beginPath(); d.moveTo(ox, oy); d.arc(ox, oy, L, ang - 0.26, ang + 0.26); d.closePath(); d.fill();
      hole(ax, ay, 26); hole(px, py - 12, 18, 0.6);
    }
    if (inside) { hole(70, 40, 16, 0.5); hole(250, 36, 16, 0.5); if (seenAt('lantern') < el) hole(POI.lantern[0], POI.lantern[1] + 6, 40, 0.8); if (el > WR_OCT) hole(160, 124, 74 + Math.sin(t * 2) * 3, 0.7); }
    c.drawImage(dark, 0, 0, W, H);
    // vệt sáng mờ của đèn pin trong nước
    lit(c, () => { for (let i = 0; i < 2; i++) { if (!f.seats[i]) continue; const [px, py] = pos(i), ox = px + (i ? -6 : 6), oy = py - 16, [ax, ay] = aim(i), ang = Math.atan2(ay - oy, ax - ox), L = Math.hypot(ax - ox, ay - oy); c.globalAlpha = 0.08 * darkA; c.fillStyle = '#fff4c8'; c.beginPath(); c.moveTo(ox, oy); c.arc(ox, oy, L, ang - 0.2, ang + 0.2); c.closePath(); c.fill(); haloAt(c, ox, oy, 4, '#fff6d0', 0.9); } });
  }
  // ── hai nửa chìa ghép thành chìa trái tim ──
  if (inside && el > keysAt && el < openEl + 800) {
    const q = ease(clamp((el - keysAt) / 1600)), x = 160, y = 76 + Math.sin(t * 2) * 2;
    for (const [k, s] of [['keyA', -1], ['keyB', 1]] as const) { const [kx, ky] = POI[k]; const xx = lerp(kx, x + s * 3, q), yy = lerp(ky, y, q); R(c, xx - 4, yy - 1, 8, 2, '#ffd84a'); }
    if (q >= 1) { lit(c, () => haloAt(c, x, y, 16, '#ffd870', 0.7)); heart(c, x, y - 4, 4, '#ffd84a'); R(c, x - 0.8, y, 1.6, 9, '#ffd84a'); R(c, x, y + 6, 3, 1.4, '#ffd84a'); R(c, x, y + 3.5, 2.4, 1.2, '#ffd84a'); }
  }
  // ── rương mở: ánh vàng, mưa tiền vàng, mặt dây chuyền có hình hai đứa ──
  if (opened > 0) {
    const s = el - openEl;
    lit(c, () => { c.globalAlpha = clamp(1 - s / 9000) * 0.5 + 0.2; poly(c, [146, 140, 174, 140, 214, 0, 106, 0], '#ffd87044'); haloAt(c, 160, 138, 50, '#ffd060', 0.7); c.globalAlpha = 1; });
    for (let k = 0; k < 70; k++) { const life = 2200, q = ((s + rr(k, 1) * life) % life) / life; if (s < rr(k, 1) * life) continue; const a = -Math.PI / 2 + (rr(k, 2) - 0.5) * 1.8, v = 70 + rr(k, 3) * 40; const x = 160 + Math.cos(a) * v * q, y = 138 + Math.sin(a) * v * q + q * q * 90; const fl = Math.abs(Math.sin(t * 9 + k)); if (k % 5) ell(c, x, y, 1.6 * fl + 0.4, 1.6, k % 3 ? '#ffd84a' : '#ffe890'); else { poly(c, [x, y - 2, x + 1.6, y, x, y + 2, x - 1.6, y], ['#ff4a8a', '#4ad8ff', '#7aff8a'][k % 3]); } }
    const lq = ease(clamp((s - 800) / 2200)), lx = 160, ly = lerp(138, 58, lq) + Math.sin(t * 1.6) * 2;
    if (lq > 0) {
      line(c, lx - 12, ly - 22, lx, ly - 14, 0.6, '#e8c04a'); line(c, lx + 12, ly - 22, lx, ly - 14, 0.6, '#e8c04a');
      lit(c, () => haloAt(c, lx, ly, 30, '#ffe0a0', 0.6 * lq));
      heart(c, lx, ly - 4, 14, '#e8b83a'); heart(c, lx, ly - 4, 12, '#ffd0dc');
      c.save(); c.beginPath(); c.arc(lx - 6, ly - 4, 6.6, 0, TAU); c.arc(lx + 6, ly - 4, 6.6, 0, TAU); c.moveTo(lx - 12.4, ly - 1.8); c.lineTo(lx, ly + 11); c.lineTo(lx + 12.4, ly - 1.8); c.closePath(); c.clip();
      f.all.forEach((p, i) => putAt(f, p.img('idle'), lx - 4 + i * 8, ly + 12, 0.36)); c.restore();
      for (let k = 0; k < 6; k++) twinkle(c, lx + Math.cos(t * 1.5 + k) * 20, ly - 4 + Math.sin(t * 1.5 + k) * 16, 1.4, '#ffffff');
    }
  }
  // ── mực bạch tuộc ──
  if (inkQ > 0) { c.globalAlpha = inkQ * 0.95; for (let k = 0; k < 18; k++) { const a = k / 18 * TAU, r = 30 + inkQ * 150; circ(c, 160 + Math.cos(a) * r * 0.6 * rr(k, 1), 110 + Math.sin(a) * r * 0.4 * rr(k, 2), r * 0.55, '#0a0612'); } c.fillStyle = '#0a0612'; c.globalAlpha = inkQ * 0.85; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  // ── hai đứa ──
  const hug = inkQ > 0.3, fin = el > openEl + 4500;
  f.seats.forEach((p, i) => {
    if (!p) return; const [x, y] = pos(i), s = B[f.n < 2 ? 0 : i], b = s && el < WR_OCT ? el - s.at : Infinity, cur = s?.cur;
    const scared = cur === 'eel' && b < 2200, found = (cur === 'keyA' || cur === 'keyB') && b < 2500;
    const tickling = f.last(i, 'tickle') < 900, cheer = el > openEl && el < openEl + 4500;
    const im = !inside ? p.img('idle', 0, 'back') : hug ? p.img('embrace', 0, 'side') : fin && (kissing(f) || el > WR_MS - 9000) ? p.img('kiss', 0, 'side') : scared ? p.img('act', 11) : found || cheer ? p.img('act', 12) : tickling ? p.img('act', 10) : el > WR_OCT ? p.img('idle', 0, 'side') : p.img('idle');
    const side = hug || fin || (el > WR_OCT && !tickling && !cheer);
    putAt(f, im, x, y, !inside ? lerp(0.4, 0.5, el / WR_IN) : 0.55, side && i === 1);
    if (!hug && !fin && inside) { const [ax, ay] = aim(i); const ox = x + (i ? -6 : 6), oy = y - 16, a = Math.atan2(ay - oy, ax - ox); c.save(); c.translate(ox, oy); c.rotate(a); R(c, -5, -1.2, 6, 2.4, '#3a3a4a'); R(c, 0, -1.6, 2, 3.2, '#5a5a6a'); c.restore(); }
    if (scared) { c.globalAlpha = 1 - b / 2200; R(c, x - 0.5, y - 40, 1.4, 4, '#ffffff'); R(c, x - 0.5, y - 35, 1.4, 1.4, '#ffffff'); c.globalAlpha = 1; }
  });
  if (hug) lit(c, () => { for (let k = 0; k < 8; k++) { const q = (t * 0.7 + k / 8) % 1; c.globalAlpha = inkQ * (1 - q); heart(c, 160 + Math.sin(k * 2.1) * 12, 86 - q * 30, 1.8, '#ff8ad0'); } c.globalAlpha = 1; });
  if (fin && (kissing(f) || el > WR_MS - 9000)) lit(c, () => { for (let k = 0; k < 6; k++) { const q = (t * 0.6 + k / 6) % 1; heart(c, 160 + Math.sin(k * 2.3) * 10, 92 - q * 30, 1.6, '#ff9ad8'); } });
  bubbles(c, t, 160, 118, 5, 8);
  fadeIn(c, el);
}
export const wreck: DuoCfg = {
  title: 'Kho báu tàu đắm', ms: WR_MS, join: 25000, wait: true, price: 0,
  ask: '🏴‍☠️ Cầm đèn pin lặn vào xác tàu đắm tìm kho báu', joinAsk: '🏴‍☠️ Tìm kho báu cùng người ấy', invite: '🏴‍☠️ Người ấy rủ lặn vào tàu đắm tìm kho báu', yes: 'Bật đèn pin!', late: 'Người ấy lặn vào tàu mất rồi — lần sau nha',
  buttons: [{ id: 'look', label: '🔦 Soi chỗ khác', from: WR_IN, to: WR_OCT }, { id: 'tickle', label: '🪶 Cù bạch tuộc', from: WR_TICK, to: WR_KEY }, { id: 'key', label: '🗝️ Cùng tra chìa', from: WR_KEY, to: WR_KEY + 8000 }, { id: 'kiss', label: '💋 Hôn', from: WR_KEY + 8000, to: WR_MS }, { id: 'photo', label: '📸 Chụp', from: 3000, to: WR_MS }],
  caption: el => el < WR_IN ? '🏴‍☠️ Xác tàu cướp biển nằm im dưới đáy biển tối…' : el < 26000 ? '🔦 Mỗi người soi một phía — chìa khoá rương bị bẻ làm đôi!' : el < WR_OCT ? '🔦 Soi khắp khoang tàu… coi chừng có gì nhảy ra đó!' : el < WR_INK ? '🐙 Bạch tuộc khổng lồ đang ôm chặt rương báu!' : el < WR_TICK ? '🖤 Nó phun mực! Tối om — ôm chặt nhau nào' : el < WR_KEY ? '🪶 Cù cho bạch tuộc buồn cười mà buông rương ra' : el < WR_KEY + 8000 ? '🗝️ Hai đứa cùng bấm tra chìa một lúc mới mở được' : '💛 Trong rương là mặt dây chuyền có hình hai đứa',
  draw: drawWreck, snap: [24000, 42000, WR_KEY + 5000, WR_MS - 6000], endTitle: '🏴‍☠️ Kho báu tàu đắm', endNote: 'Kho báu quý nhất là được đi cùng em tới tận đáy biển 💛',
};

// ═════════ 3. Vũ hội tiên cá ═════════
const M_TR = 2500, M_SWIM = 14000, M_DANCE = 22000, M_FIN = 52000, M_MS = 76000;
const TAILS: [string, string][] = [['#2ad0c0', '#a8fff0'], ['#ff5aa0', '#ffd0e8']];
const grotto = () => bake('reef:grotto', W, H, (c, rnd) => {
  grad(c, 0, H, ['#1a0e3a', '#2a1650', '#1a0e3a']);
  for (let k = 0; k < 40; k++) { const a = rnd() * TAU, x = 160 + Math.cos(a) * (150 + rnd() * 40), y = 90 + Math.sin(a) * (100 + rnd() * 20); circ(c, x, y, 30 + rnd() * 30, k % 2 ? '#0e0828' : '#140a30'); }
  for (let k = 0; k < 16; k++) { const x = rnd() * W, y = 150 + rnd() * 30, h = 10 + rnd() * 20, col = k % 2 ? '#6af0ff' : '#c08aff'; poly(c, [x - 3, y, x, y - h, x + 3, y], col); poly(c, [x, y, x, y - h, x + 3, y], mix(col, '#ffffff', 0.4)); }
  for (let x = 0; x < W; x += 3) R(c, x, 150 + Math.sin(x * 0.05) * 3, 3, 40, '#2a1a4a');
  poly(c, [146, 152, 174, 152, 168, 128, 152, 128], '#8a7ab0'); R(c, 148, 126, 24, 4, '#b0a0d8');
});
const ballroom = () => bake('reef:ball', W, H, (c, rnd) => {
  grad(c, 0, H, ['#1a1e5a', '#2a2a7a', '#3a2470', '#1a1040']);
  for (let k = 0; k < 3; k++) {   // ba ô cửa vòm vỏ sò
    const x = 70 + k * 90, w = k === 1 ? 46 : 34, top = k === 1 ? 20 : 34;
    c.fillStyle = '#5ab8e8'; c.beginPath(); c.moveTo(x - w / 2, 120); c.lineTo(x - w / 2, top + w / 2); c.arc(x, top + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, 120); c.fill();
    for (let j = 0; j < 9; j++) { const a = Math.PI + (j / 8) * Math.PI; line(c, x, top + w / 2 + 6, x + Math.cos(a) * w / 2, top + w / 2 + Math.sin(a) * w / 2, 0.8, '#bfe8ff'); }
    for (let j = 0; j < 10; j++) circ(c, x - w / 2 + (j + 0.5) * w / 10, top + w / 2 - Math.sin((j + 0.5) / 10 * Math.PI) * w / 2, 2, '#ffe8f0');
  }
  for (const x of [25, 115, 205, 295]) { R(c, x - 5, 30, 10, 96, '#e88aa8'); for (let y = 34; y < 126; y += 6) circ(c, x + (y % 12 ? -2 : 2), y, 2, '#ffb0c8'); R(c, x - 7, 26, 14, 5, '#ffd0e0'); }
  for (let y = 126; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 8; x < W; x += 16) { R(c, x, y, 15, 3.5, y % 8 ? '#e8d8f0' : '#f8e8f8'); R(c, x, y, 15, 0.6, '#ffffff'); }
  for (let k = 0; k < 20; k++) R(c, rnd() * W, 128 + rnd() * 50, 0.8, 0.8, '#ffffff');
});
/** tiên cá: vẽ nửa trên của nhân vật, nửa dưới là đuôi cá lấp lánh (grown 0..1 khi mới hoá) */
function mer(f: F, p: Seat, frame: Frame, step: number, view: View, x: number, foot: number, sc: number, flip: boolean, i: number, grown: number) {
  const c = f.c, im = p.img(frame, step, view); if (!im.width) return;
  const w = im.width * sc, h = im.height * sc, top = foot - h, hip = top + h * 0.7, [col, hi] = TAILS[i], k = sc / 0.5;
  if (grown <= 0) { f.put(im, x - w / 2, top, sc, flip); return; }
  c.save(); c.beginPath(); c.rect(x - w, top - 4, w * 2, h * 0.72 + 4); c.clip(); f.put(im, x - w / 2, top, sc, flip); c.restore();
  const len = h * 0.62 * grown, N = 10, Lp: number[] = [], Rp: number[] = [], t = f.t, ph = i * 1.7;
  let ex = x, ey = hip;
  for (let s = 0; s <= N; s++) { const u = s / N, cx = x + Math.sin(t * 3 + ph - u * 2.6) * u * 3.5 * k, cy = hip + u * len, ww = 3.4 * k * (1 - u * 0.62); Lp.push(cx - ww, cy); Rp.unshift(cx + ww, cy); ex = cx; ey = cy; }
  poly(c, [...Lp, ...Rp], col);
  for (let s = 1; s < N; s++) { const u = s / N, cx = x + Math.sin(t * 3 + ph - u * 2.6) * u * 3.5 * k, cy = hip + u * len; R(c, cx - 1.4 * k + (s % 2) * 1.2 * k, cy, 1.2 * k, 0.6, hi); }
  R(c, x - 3.6 * k, hip - 0.4, 7.2 * k, 1.2, hi);
  const fl = Math.sin(t * 3 + ph - 2.6) * 2 * k, c2 = mix(col, '#ffffff', 0.3);
  poly(c, [ex - 0.6, ey - 1, ex - 7 * k, ey + 4 * k + fl, ex - 2.4 * k, ey + 4 * k], c2); poly(c, [ex + 0.6, ey - 1, ex + 7 * k, ey + 4 * k - fl, ex + 2.4 * k, ey + 4 * k], c2);
  lit(c, () => { for (let s = 0; s < 3; s++) { const u = (t * 0.7 + s / 3 + i * 0.2) % 1; twinkle(c, x + Math.sin(t * 3 + ph - u * 2.6) * u * 3.5 * k, hip + u * len, 1, '#ffffff'); } });
}
function drawMermaid(f: F) {
  const { c, el, t } = f;
  const trAt = (i: number) => { const tp = tapsOf(f, 'magic', M_TR, M_SWIM).find(x => x.i === i); return Math.min(tp ? tp.el : Infinity, 10000 + i * 900); };
  const grown = (i: number) => ease(clamp((el - trAt(i) - 1200) / 1300));
  const sw = ease(clamp((el - M_SWIM) / 4000));
  // ── hang ngọc thần ──
  if (sw < 1) {
    c.drawImage(grotto(), 0, 0, W, H);
    const pg = 0.6 + 0.4 * Math.sin(t * 2);
    lit(c, () => { haloAt(c, 160, 116, 34 * pg + 10, '#c8a8ff', 0.8); for (let k = 0; k < 10; k++) twinkle(c, 160 + Math.cos(t + k) * 22, 116 + Math.sin(t * 1.3 + k) * 14, 1.2, '#ffffff'); });
    circ(c, 160, 116, 9, '#f0e8ff'); circ(c, 157, 113, 3, '#ffffff');
  }
  if (sw > 0) { c.globalAlpha = sw; c.drawImage(ballroom(), 0, 0, W, H); c.globalAlpha = 1; }
  const hall = sw > 0.5;
  const sc = f.n === 2 ? (f.score(0, 'dance') + f.score(1, 'dance')) / 2 : f.score(f.seats[0] ? 0 : 1, 'dance');
  const cheer = [0, 1].some(i => f.seats[i] && f.last(i) < 400 && el > M_DANCE);
  if (hall) {
    const a = sw;
    // đèn sân khấu quét
    lit(c, () => { [60, 160, 260].forEach((x, k) => { const tx = 160 + Math.sin(t * 0.8 + k * 2) * 70; c.globalAlpha = a * (0.06 + 0.22 * sc + (cheer ? 0.08 : 0)); poly(c, [x - 3, 0, x + 3, 0, tx + 24, 150, tx - 24, 150], ['#ff8ad8', '#8ae8ff', '#ffe08a'][k]); }); c.globalAlpha = 1; });
    // đèn chùm sứa
    for (const [x, y, col] of [[70, 22, '#ff7ad8'], [160, 14, '#8ae8ff'], [250, 22, '#ffd84a']] as const) jelly(c, x, y + Math.sin(t + x) * 2, t + x, col, 1.3);
    // khán giả cá hai bên & ban nhạc cá ngựa
    for (let k = 0; k < 26; k++) { const left = k < 13, j = k % 13, x = (left ? 10 : 252) + (j % 5) * 13 + (Math.floor(j / 5) % 2) * 6, y = 118 + Math.floor(j / 5) * 12, jump = cheer ? Math.abs(Math.sin(t * 12 + k)) * 4 : Math.sin(t * 2 + k) * 1; fish(c, x, y - jump, 0.8, ['#ffd24a', '#ff8a5a', '#5ad8ff', '#ff6ab0', '#9aff8a'][k % 5], left ? 1 : -1, Math.sin(t * 9 + k)); }
    for (const [x, d] of [[38, 1], [282, -1]] as const) { const y = 92 + Math.sin(t * 4) * 2; ell(c, x, y, 3, 5, '#ffb84a'); circ(c, x + d * 2, y - 6, 2.4, '#ffb84a'); R(c, x + d * 4, y - 6.5, 2.2 * d, 1, '#ffb84a'); line(c, x, y + 4, x - d * 2, y + 10, 1.4, '#ffb84a'); R(c, x + d * 2.4, y - 7, 0.8, 0.8, '#1a1a2a'); ell(c, x + d * 8, y + 8, 5, 2.6, '#a88ad8'); if (el > M_DANCE && Math.sin(t * 8) > 0) line(c, x + d * 4, y - 2, x + d * 7, y + 6, 0.8, '#ffffff'); }
    // sân khấu vỏ sò khổng lồ (mở ra ở màn cuối)
    const so = ease(clamp((el - M_FIN) / 2500));
    ell(c, 160, 156, 46, 10, '#f0c8d8'); for (let k = 0; k < 9; k++) line(c, 160, 160, 160 + (k - 4) * 11, 150, 1, '#d8a0b8');
    if (so > 0) lit(c, () => haloAt(c, 160, 148, 50 * so, '#ffd8f0', so * 0.8));
    c.save(); c.translate(160, 152); c.scale(1, 1 - so * 1.8); c.beginPath(); c.arc(0, 0, 46, Math.PI, 0); c.fillStyle = '#ffd8e8'; c.fill(); for (let k = 0; k < 9; k++) { const aa = Math.PI + (k + 0.5) / 9 * Math.PI; line(c, 0, 0, Math.cos(aa) * 46, Math.sin(aa) * 46, 1, '#e8a8c0'); } c.restore();
    if (el > M_DANCE) for (let k = 0; k < 40; k++) { const q = (t * 0.3 + rr(k, 4)) % 1; c.globalAlpha = (1 - q) * (0.3 + sc * 0.7); R(c, rr(k, 5) * W, 150 - q * 140, 1, 1, ['#ffe0f0', '#d0fff8', '#fff6c0'][k % 3]); } c.globalAlpha = 1;
  }
  // pháo hoa sinh vật phát sáng & đàn cá xếp thành trái tim
  if (el > M_FIN) {
    fireworks(c, el, M_FIN + 2000, 1100, [30, 14, 260, 60], 7);
    const hq = ease(clamp((el - M_FIN - 5000) / 4000));
    for (let k = 0; k < 44; k++) { const a = k / 44 * TAU, [hx, hy] = hpt(a), sx = ((rr(k, 2) * 380 + t * 20) % 380) - 30, sy = 20 + rr(k, 3) * 60; fish(c, lerp(sx, 160 + hx * 3.6, hq), lerp(sy, 60 + hy * 3, hq), 0.6, ['#ff8ab0', '#ffd24a', '#ffffff'][k % 3], Math.cos(a) > 0 ? 1 : -1, Math.sin(t * 9 + k)); }
  }
  // ── hai đứa ──
  const dance = el > M_DANCE && el < M_FIN, finale = el > M_FIN + 2000;
  const kiss = finale && (kissing(f) || el > M_FIN + 9000);
  if (finale) { const by = lerp(150, 104, ease(clamp((el - M_FIN - 2000) / 2500))); lit(c, () => haloAt(c, 160, by - 12, 34, '#ffd0f0', 0.4)); c.globalAlpha = 0.6; ring(c, 160, by - 12, 26, '#ffffff', 1); c.globalAlpha = 0.25; circ(c, 160, by - 12, 26, '#d8f4ff'); c.globalAlpha = 1; R(c, 150, by - 32, 5, 2, '#ffffff'); }
  const order = [0, 1].sort((a, b) => (dance ? Math.sin(t * 1.4 + a * Math.PI) - Math.sin(t * 1.4 + b * Math.PI) : 0));
  for (const i of order) {
    const p = f.seats[i]; if (!p) continue;
    const g = grown(i), tr = el - trAt(i);
    if (!hall) {
      const x = 142 + i * 36 - sw * 30 + (el > M_SWIM ? Math.sin(t * 2) * 3 : 0), foot = 140 - (g > 0 ? 8 + Math.sin(t * 2 + i) * 2 : 0);
      mer(f, p, tr > 0 && tr < 2500 ? 'act' : 'idle', 12, g > 0 ? 'side' : 'front', x, foot, 0.55, i === 1 && g > 0, i, g);
      if (tr > 0 && tr < 2600) lit(c, () => { for (let k = 0; k < 18; k++) { const q = tr / 2600, a = k * 0.7 + q * 9, r = 16 * (1 - q) + 4; twinkle(c, x + Math.cos(a) * r, foot - 10 - q * 6 + Math.sin(a) * r * 0.6 + (k / 18) * 14, 1.3, TAILS[i][1]); } haloAt(c, x, foot - 6, 16, TAILS[i][0], 0.5 * (1 - Math.abs(tr / 1300 - 1))); });
    } else if (dance) {
      const a = t * 1.4 + i * Math.PI, x = 160 + Math.cos(a) * 20, foot = 116 + Math.sin(a) * 4 + Math.sin(t * 4) * 1.5, hit = f.last(i) < 500;
      mer(f, p, 'dance', Math.floor(t * 2.5 + i) % 8, 'front', x, foot, 0.55, false, i, 1);
      if (hit) lit(c, () => { const q = f.last(i) / 500; for (let k = 0; k < 8; k++) { const b = k / 8 * TAU; twinkle(c, x + Math.cos(b) * q * 16, foot - 14 + Math.sin(b) * q * 12, 1.4, TAILS[i][1]); } });
    } else if (finale) {
      const by = lerp(150, 104, ease(clamp((el - M_FIN - 2000) / 2500)));
      mer(f, p, kiss ? 'kiss' : 'idle', 0, 'side', 160 + (i ? 4 : -4) + (kiss ? 0 : (i ? 3 : -3)), by, 0.5, i === 1, i, 1);
    } else {
      const x = lerp(60, 150 + i * 20, ease(clamp((el - M_SWIM - 2000) / 5000))), foot = 116 + Math.sin(t * 2 + i) * 3;
      mer(f, p, 'idle', 0, 'side', x, foot, 0.55, false, i, 1);
    }
  }
  if (kiss) lit(c, () => { for (let k = 0; k < 10; k++) { const q = (t * 0.5 + k / 10) % 1; c.globalAlpha = 1 - q; heart(c, 160 + Math.sin(k * 2.1 + q * 4) * 14, 78 - q * 36, 1.6 + (k % 2) * 0.8, k % 2 ? '#ff8ab0' : '#ffd0e8'); } c.globalAlpha = 1; });
  bubbles(c, t, 160, 120, 5, 11);
  fadeIn(c, el);
}
export const mermaid: DuoCfg = {
  title: 'Vũ hội tiên cá', ms: M_MS, join: 25000, wait: true, price: 0,
  ask: '🧜 Chạm ngọc thần hoá tiên cá, đi dự vũ hội dưới biển', joinAsk: '🧜 Hoá tiên cá cùng người ấy', invite: '🧜 Người ấy rủ hoá tiên cá đi vũ hội dưới biển', yes: 'Hoá tiên cá!', late: 'Vũ hội bắt đầu mất rồi — lần sau nha',
  beats: [{ ph: 'dance', from: M_DANCE, to: M_FIN }],
  buttons: [{ id: 'magic', label: '🔮 Chạm ngọc thần', from: M_TR, to: M_SWIM }, { id: 'kiss', label: '💋 Hôn', from: M_FIN + 2000, to: M_MS }, { id: 'photo', label: '📸 Chụp', from: M_TR, to: M_MS }],
  caption: el => el < 10000 ? '🔮 Viên ngọc thần trong hang — chạm vào để hoá tiên cá' : el < M_SWIM ? '🧜 Đuôi cá lấp lánh mọc ra rồi!' : el < M_DANCE ? '🐚 Bơi vào cung điện vỏ sò — cả biển đang chờ' : el < M_FIN ? '💃 Nhảy theo nhịp! Càng trúng nhịp đèn càng rực rỡ' : el < M_FIN + 5000 ? '🐚 Vỏ sò khổng lồ mở ra, bong bóng nâng hai đứa lên' : '🎆 Pháo hoa dưới biển — đàn cá xếp thành trái tim',
  draw: drawMermaid, snap: [13000, 36000, M_FIN + 10000, M_MS - 5000], endTitle: '🧜 Vũ hội tiên cá', endNote: 'Hoá thành tiên cá cũng chỉ muốn nhảy cùng em 🐚',
};

export const REEF_SCENES = { whale, wreck, mermaid };
