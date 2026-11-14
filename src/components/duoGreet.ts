// Quà mỗi ngày: hôm nào hai đứa cùng vào lần đầu → người ấy (nam) tặng bó hoa, mở hộp quà, hôn, ôm, viết lời nhắn lên trời.
import type { DuoCfg, F } from './Duo';
import type { AvatarLook } from '../lib/sprites';
import { bake, circ, ell, glow, heart, line, poly, R, twinkle, type Ctx } from '../lib/canvasArt';
import { fireworks, haloAt, mix, rr } from './duoSky';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { toast } from '../lib/toast';

const W = 320, H = 180, TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
const grad = (c: Ctx, y0: number, y1: number, cols: string[]) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); };
const putAt = (f: F, im: HTMLImageElement, x: number, foot: number, sc: number, flip = false) => { if (im.width) f.put(im, x - (im.width * sc) / 2, foot - im.height * sc, sc, flip); };
export const giverOf = (f: F) => { const i = f.seats.findIndex(p => !!p && (JSON.parse(p.key) as AvatarLook).gender === 'm'); return i < 0 ? 0 : i; };
const petals = (c: Ctx, t: number, n: number, cols: string[]) => { for (let k = 0; k < n; k++) { const sp = 6 + rr(k, 1) * 8, x = ((rr(k, 2) * W + Math.sin(t * 0.8 + k) * 14 + t * 4) % (W + 10) + W + 10) % (W + 10) - 5, y = (rr(k, 3) * H + t * sp) % (H + 10) - 5; ell(c, x, y, 1.3, 0.8, cols[k % cols.length], Math.sin(t * 2 + k)); } };

const GIFTS = ['teddy', 'chocolate', 'love_cake', 'swiss_snowglobe', 'cupcake', 'balloon', 'candle'];
export const dayKey = () => new Date().toLocaleDateString('sv');
export const giftToday = () => GIFTS[Math.floor(Date.now() / 864e5) % GIFTS.length];

function bouquet(c: Ctx, x: number, y: number, s = 1) {
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.32; line(c, x, y + 4 * s, x + Math.cos(a) * 11 * s, y - 2 * s + Math.sin(a) * 6 * s, 1.2 * s, '#4a8a3a'); }
  poly(c, [x - 8 * s, y - 3 * s, x + 8 * s, y - 3 * s, x + 1.5 * s, y + 12 * s, x - 1.5 * s, y + 12 * s], '#ffc0d4'); poly(c, [x - 8 * s, y - 3 * s, x - 2 * s, y - 3 * s, x - 0.5 * s, y + 12 * s, x - 1.5 * s, y + 12 * s], '#ffe0ea');
  const roses: [number, number, string][] = [[-4, -6, '#e8203a'], [0, -8, '#ff4a6a'], [4, -6, '#e8203a'], [-2, -3, '#ff8ab0'], [2.5, -3, '#ff4a6a'], [-6, -2, '#ff8ab0'], [6, -2, '#ff8ab0'], [0, -11, '#e8203a']];
  for (const [dx, dy, col] of roses) { circ(c, x + dx * s, y + dy * s, 2.2 * s, mix(col, '#000000', 0.2)); circ(c, x + (dx - 0.3) * s, y + (dy - 0.3) * s, 1.6 * s, col); circ(c, x + (dx - 0.5) * s, y + (dy - 0.6) * s, 0.6 * s, mix(col, '#ffffff', 0.4)); }
  for (let k = 0; k < 10; k++) circ(c, x + (rr(k, 3) - 0.5) * 16 * s, y - 4 * s - rr(k, 4) * 8 * s, 0.6 * s, '#ffffff');
  R(c, x - 2.5 * s, y + 5 * s, 5 * s, 1.6 * s, '#e8203a'); ell(c, x - 3 * s, y + 5.5 * s, 2 * s, 1.2 * s, '#e8203a'); ell(c, x + 3 * s, y + 5.5 * s, 2 * s, 1.2 * s, '#e8203a');
}
function giftBox(c: Ctx, x: number, y: number, lid: number) {
  R(c, x - 9, y - 12, 18, 12, '#ff8ab0'); R(c, x - 9, y - 12, 18, 2, '#ffb0c8'); R(c, x - 1.5, y - 12, 3, 12, '#ffd24a'); R(c, x - 9, y - 7, 18, 0.6, '#ff6a98');
  const ly = y - 12 - lid * 14;
  c.save(); c.translate(x, ly); c.rotate(-lid * 0.5); R(c, -10, -3, 20, 3, '#ff6a98'); R(c, -10, -3, 20, 1, '#ffb0c8'); R(c, -1.5, -3, 3, 3, '#ffd24a');
  ell(c, -3.5, -4.5, 3.5, 2, '#ffd24a'); ell(c, 3.5, -4.5, 3.5, 2, '#ffd24a'); circ(c, 0, -4, 1.3, '#f6b030'); c.restore();
}
function giftArt(c: Ctx, id: string, x: number, y: number) {
  if (id === 'teddy') { circ(c, x, y + 2, 6, '#b07a4a'); circ(c, x, y - 6, 5, '#b07a4a'); circ(c, x - 4, y - 10, 2, '#b07a4a'); circ(c, x + 4, y - 10, 2, '#b07a4a'); ell(c, x, y - 4.5, 2.2, 1.6, '#e8c8a0'); R(c, x - 2, y - 7, 1, 1, '#2a1a1a'); R(c, x + 1, y - 7, 1, 1, '#2a1a1a'); circ(c, x, y - 5, 0.6, '#2a1a1a'); heart(c, x, y + 2, 2.2, '#ff4a6a'); R(c, x - 3, y - 1.5, 6, 1, '#e8203a'); }
  else if (id === 'chocolate') { heart(c, x, y - 3, 9, '#c8203a'); heart(c, x, y - 3, 7.5, '#6a3a1a'); for (let k = 0; k < 6; k++) circ(c, x - 4 + (k % 3) * 4, y - 5 + Math.floor(k / 3) * 4, 1.4, k % 2 ? '#3a1a0a' : '#c8905a'); }
  else if (id === 'love_cake') { R(c, x - 8, y - 4, 16, 7, '#ffd0e0'); R(c, x - 6, y - 10, 12, 6, '#ffe8f0'); R(c, x - 8, y - 4, 16, 1.2, '#ffffff'); R(c, x - 6, y - 10, 12, 1, '#ffffff'); heart(c, x, y - 1, 2, '#ff4a6a'); R(c, x - 0.4, y - 14, 0.8, 4, '#fff6c0'); ell(c, x, y - 15, 0.8, 1.4, '#ffb048'); glow(c, x, y - 15, 4, '#ffd27a', 0.7); }
  else if (id === 'swiss_snowglobe') { R(c, x - 6, y + 1, 12, 3, '#8a5a3a'); circ(c, x, y - 5, 7, '#cfeaff'); poly(c, [x - 3, y, x, y - 8, x + 3, y], '#3a8a4a'); for (let k = 0; k < 6; k++) R(c, x - 5 + rr(k, 1) * 10, y - 10 + rr(k, 2) * 9, 0.6, 0.6, '#ffffff'); ell(c, x - 3, y - 8, 1.6, 2.4, '#ffffff60'); }
  else if (id === 'cupcake') { poly(c, [x - 5, y - 4, x + 5, y - 4, x + 4, y + 3, x - 4, y + 3], '#ffb0c8'); circ(c, x - 3, y - 6, 3, '#fff0f6'); circ(c, x + 3, y - 6, 3, '#fff0f6'); circ(c, x, y - 8, 3.5, '#fff0f6'); circ(c, x, y - 11, 1.6, '#e8203a'); for (let k = 0; k < 5; k++) R(c, x - 4 + k * 2, y - 7 + (k % 2) * 2, 0.8, 0.4, ['#5ad8ff', '#ffd24a', '#7aff9a'][k % 3]); }
  else if (id === 'balloon') { for (let k = 0; k < 3; k++) { const bx = x - 5 + k * 5, by = y - 10 - (k % 2) * 3; heart(c, bx, by, 3.4, ['#ff4a6a', '#ff8ab0', '#ffd24a'][k]); line(c, bx, by + 4, x, y + 4, 0.3, '#ffffff'); } }
  else { R(c, x - 5, y - 6, 10, 9, '#f4e8f8'); R(c, x - 5, y - 6, 10, 1.5, '#d8b8e8'); R(c, x - 0.3, y - 9, 0.6, 3, '#3a3a3a'); ell(c, x, y - 10.5, 1, 1.8, '#ffb048'); glow(c, x, y - 10, 6, '#ffd27a', 0.8); }
}
const greetBg = () => bake('cheer:greet', W, H, (c, rnd) => {
  grad(c, 0, 120, ['#1a1446', '#4a2a7a', '#a8508a', '#f08a8a', '#ffc8a0']);
  for (let k = 0; k < 70; k++) R(c, rnd() * W, rnd() * 60, 0.5, 0.5, '#ffffff');
  circ(c, 262, 26, 9, '#fff6dc'); circ(c, 266, 23, 8, '#3a2470');
  c.fillStyle = '#4a2a5a'; c.beginPath(); c.moveTo(0, 112); for (let x = 0; x <= W; x += 10) c.lineTo(x, 104 + Math.sin(x * 0.03) * 5); c.lineTo(W, 120); c.lineTo(0, 120); c.fill();
  for (let k = 0; k < 40; k++) R(c, rnd() * W, 106 + rnd() * 10, 0.8, 0.8, ['#ffd27a', '#ffb0c8', '#fff6c0'][k % 3]);
  grad(c, 112, H, ['#3a6a4a', '#2a4a3a']); for (let k = 0; k < 300; k++) R(c, rnd() * W, 114 + rnd() * 66, 1, 0.5, rnd() < 0.5 ? '#4a7a5a' : '#2a5a3a');
  poly(c, [130, 120, 190, 120, 260, H, 60, H], '#e8c8c0'); for (let k = 0; k < 14; k++) R(c, 70 + rnd() * 180, 124 + rnd() * 54, 6, 1, '#d8a8a8');
  for (const side of [0, 1]) for (let k = 0; k < 9; k++) { const x = side ? 222 + k * 12 : 2 + k * 12, y = 118; ell(c, x + 6, y, 8, 7, '#2a5a3a'); for (let j = 0; j < 4; j++) circ(c, x + 2 + rnd() * 8, y - 4 + rnd() * 7, 1.3, ['#ff4a6a', '#ffb0c8', '#ffffff'][j % 3]); }
  c.strokeStyle = '#fbf6ee'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(126, 150); c.lineTo(126, 92); c.arc(160, 92, 34, Math.PI, 0); c.lineTo(194, 150); c.stroke();
  for (let k = 0; k < 46; k++) { const a = Math.PI + (k / 45) * Math.PI, r = 34 + (rnd() - 0.5) * 4; circ(c, 160 + Math.cos(a) * r, 92 + Math.sin(a) * r, 1.4 + rnd() * 1.2, ['#ff3a6a', '#ff8ab0', '#ffffff', '#e8203a'][k % 4]); if (k % 3 === 0) ell(c, 160 + Math.cos(a) * (r + 2), 92 + Math.sin(a) * (r + 2), 1.5, 0.8, '#3a7a3a', a); }
  for (const x of [126, 194]) for (let y = 96; y < 150; y += 4) circ(c, x + (rnd() - 0.5) * 3, y, 1.2 + rnd(), ['#ff3a6a', '#ff8ab0', '#ffffff', '#3a7a3a'][Math.floor(rnd() * 4)]);
  for (const x of [96, 224]) { R(c, x - 0.8, 100, 1.6, 50, '#2a2a3a'); R(c, x - 3, 96, 6, 5, '#fff0c0'); poly(c, [x - 4, 96, x, 92, x + 4, 96], '#2a2a3a'); }
});
const G_WALK = 3500, G_BQ = 9000, G_GIFT = 15500, G_KISS = 22000, G_MS = 38000;
function drawGreet(f: F) {
  const { c, el, t } = f, g = giverOf(f), r = 1 - g, gid = giftToday();
  c.drawImage(greetBg(), 0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let s = 0; s < 2; s++) for (let k = 0; k < 24; k++) { const x = k * 14 + s * 7, y = 8 + s * 10 + Math.sin(k * 0.45) * 6; haloAt(c, x, y, 4, ['#ffd27a', '#ffb0c8'][(k + s) % 2], 0.5 + 0.4 * Math.sin(t * 2 + k)); }
  for (const x of [96, 224]) haloAt(c, x, 98, 16, '#ffd27a', 0.7);
  for (let k = 0; k < 9; k++) { const x = 20 + k * 36 + Math.sin(t * 0.3 + k) * 6, y = 70 - ((t * 3 + k * 23) % 80); haloAt(c, x, y, 5, '#ffb048', 0.6); R(c, x - 1, y - 1.5, 2, 3, '#ffd890'); }
  for (let k = 0; k < 6; k++) for (const sd of [-1, 1]) { const q = k / 5, x = 160 + sd * (34 + q * 70), y = 124 + q * 50, fl = 0.8 + 0.2 * Math.sin(t * 9 + k); haloAt(c, x, y - 4, 7, '#ffb048', 0.7 * fl); R(c, x - 1, y - 3, 2, 3, '#fff6ec'); R(c, x - 0.4, y - 5, 0.8, 1.6 * fl, '#ffd04a'); }
  c.restore();
  const SC = 0.8, FY = 152, gp = f.seats[g], rp = f.seats[r];
  const gx = el < G_WALK ? lerp(28, 138, clamp(el / G_WALK)) : el < G_KISS ? 138 : 152, rx = el < G_KISS ? 184 : 168;
  const close = el >= G_KISS;
  const kissing = (el >= G_KISS && el < G_KISS + 6000) || f.last(0, 'kiss') < 3500 || f.last(1, 'kiss') < 3500;
  const hugging = !kissing && (el >= G_KISS + 6000 || f.last(0, 'hug') < 3500 || f.last(1, 'hug') < 3500);
  const happy = el > G_WALK + 1500 && el < G_GIFT + 2000;
  if (gp) { const im = close && kissing ? gp.img('kiss', 0, 'side') : close && hugging ? gp.img('embrace', 0, 'side') : el < G_WALK ? gp.img('walk', Math.floor(t * 8) % 4, 'side') : gp.img('idle', 0, 'side'); putAt(f, im, gx, FY, SC, false); }
  if (rp) { const front = !close && happy, im = close && kissing ? rp.img('kiss', 0, 'side') : close && hugging ? rp.img('embrace', 0, 'side') : front ? rp.img('act', 12) : rp.img('idle', 0, 'side'); putAt(f, im, rx, FY, SC, !front); }
  const bq = clamp((el - G_WALK - 2500) / 1500);
  if (el < G_WALK) bouquet(c, gx - 8, FY - 20, 0.8);
  else if (!close) bouquet(c, lerp(gx + 12, rx - 10, bq), FY - 22 - Math.sin(bq * Math.PI) * 4, 1);
  else bouquet(c, rx + 9, FY - 20, 0.8);
  if (el > G_BQ - 500 && el < G_KISS) { const x = 161, y = FY - 4, lid = ease(clamp((el - G_BQ - 2000) / 900)), rise = ease(clamp((el - G_BQ - 2300) / 1500));
    giftBox(c, x, y, lid);
    if (rise > 0) { c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, x, y - 14 - rise * 22, 22, '#fff0a0', 0.8); c.restore(); giftArt(c, gid, x, y - 12 - rise * 22);
      for (let k = 0; k < 12; k++) { const a = k * TAU / 12 + t, d = 10 + (t * 18 + k * 5) % 16; twinkle(c, x + Math.cos(a) * d, y - 30 + Math.sin(a) * d * 0.7, 1.2, k % 2 ? '#ffd24a' : '#ffffff'); }
      c.save(); c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffffff'; c.shadowColor = '#ff4a8a'; c.shadowBlur = 4; c.fillText(item(gid).name, x, y - 52); c.restore(); } }
  if ((el > G_WALK + 2500 && el < G_WALK + 5500) || close) for (let k = 0; k < (close ? 10 : 6); k++) { const q = (t * 0.6 + k / 10) % 1, x = (close ? 160 : rx) + Math.sin(k * 2.3 + q * 5) * 12; c.globalAlpha = 1 - q; heart(c, x, FY - 40 - q * 50, 1.5 + (k % 3) * 0.7, ['#ff4a7a', '#ff8ab0', '#ffd0e0'][k % 3]); } c.globalAlpha = 1;
  if (close) { c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, 160, FY - 30, 60, '#ff6a9a', 0.25 + 0.08 * Math.sin(t * 2)); c.restore(); fireworks(c, el, G_KISS, 1300, [30, 6, 260, 40], 21); }
  if (el > G_KISS + 4000) { const msg = f.text(g) || f.text(r) || 'Hôm nay em vất vả rồi — anh thương em nhiều lắm 💗';
    c.save(); c.globalAlpha = clamp((el - G_KISS - 4000) / 1500); c.font = 'bold 9px serif'; c.textAlign = 'center'; c.lineJoin = 'round'; c.strokeStyle = '#4a1a4a'; c.lineWidth = 2.4; c.strokeText(msg.slice(0, 46), 160, 46, 300); c.fillStyle = '#fff6f0'; c.shadowColor = '#ff6a9a'; c.shadowBlur = 8; c.fillText(msg.slice(0, 46), 160, 46, 300); c.restore(); }
  petals(c, t, 40, ['#ff8ab0', '#ffd0e0', '#ff4a6a', '#ffffff']);
  if (el < 1200) { c.globalAlpha = 1 - el / 1200; c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
}
export const greet: DuoCfg = {
  title: 'Quà hôm nay cho người thương', ms: G_MS, join: G_WALK + 12000, price: 0,
  ask: '💐 Hai đứa cùng vào rồi! Tặng hoa và quà hôm nay cho người ấy nhé', joinAsk: '💝 Nhận quà của người ấy', invite: '💐 Người ấy có bất ngờ cho bạn!', yes: 'Nhận quà 💝', late: 'Lỡ mất rồi, lần sau nhanh tay nha',
  buttons: [{ id: 'kiss', label: '💋 Hôn', from: G_KISS, to: G_MS }, { id: 'hug', label: '🤗 Ôm', from: G_KISS, to: G_MS }, { id: 'note', label: '💌 Lời nhắn', from: G_WALK, to: G_MS, prompt: 'Lời nhắn hôm nay cho người ấy:' }, { id: 'photo', label: '📸 Chụp', from: G_WALK, to: G_MS }],
  caption: el => el < G_WALK ? '🌹 Có người giấu gì sau lưng kìa…' : el < G_BQ ? '💐 Tặng em bó hoa hôm nay' : el < G_GIFT ? `🎁 Mở quà nào… ${item(giftToday()).name}!` : el < G_KISS ? '💗 Thích không?' : el < G_KISS + 6000 ? '💋 Chụt!' : '🤗 Ôm một cái thật lâu',
  draw: drawGreet, snap: [G_BQ - 1000, G_GIFT, G_KISS + 2500], endTitle: '💐 Quà hôm nay', endNote: 'Bó hoa và món quà đã vào túi đồ chung — mai lại có quà mới nha 💗',
  onStart: async () => { const ok = await api.claim(`greet:${dayKey()}`, [{ id: 'bouquet', n: 1 }, { id: giftToday(), n: 1 }]); if (ok) notify('inventory', 'claims'); else toast('💐 Quà hôm nay tặng rồi — vẫn tặng thêm nụ hôn nha'); },
};
