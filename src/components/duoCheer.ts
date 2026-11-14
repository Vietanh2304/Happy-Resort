// Các màn cổ vũ người ấy: bong bóng xả stress, đêm pháo đài gối, show đèn drone xếp hình + ảnh kỷ niệm của hai đứa.
import type { DuoCfg, F } from './Duo';
import { giverOf } from './duoGreet';
import { bake, circ, ell, glow, heart, line, poly, R, star, type Ctx } from '../lib/canvasArt';
import { fireworks, haloAt, mix, rr } from './duoSky';

const W = 320, H = 180, TAU = Math.PI * 2;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const lerp = (a: number, b: number, q: number) => a + (b - a) * q;
const grad = (c: Ctx, y0: number, y1: number, cols: string[], a = 1) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); c.globalAlpha = a; c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); c.globalAlpha = 1; };
/** vẽ nhân vật đặt theo chân (giữa dưới) */
const putAt = (f: F, im: HTMLImageElement, x: number, foot: number, sc: number, flip = false) => { if (im.width) f.put(im, x - (im.width * sc) / 2, foot - im.height * sc, sc, flip); };
/** người tặng = nhân vật nam (không có thì ghế đầu) */

// ═════════ Bong bóng xả stress ═════════
const B_MS = 58000, B_FIN = 44000;
const WORDS = ['Áp lực', 'Mệt mỏi', 'Khách khó tính', 'Đứng cả ngày', 'Lo lắng', 'Buồn ngủ', 'Bị mắng', 'Đau chân', 'Deadline', 'Bực mình'];
const SPAWN = [2500, 5000, 7500, 10500, 13500, 17000, 21000, 25500, 30000, 35000];
const said = new Map<string, string>();
const bubbleBg = () => bake('cheer:bubble', W, H, (c, rnd) => {
  grad(c, 0, 120, ['#0a0e30', '#1a2060', '#3a3a8a', '#7a5aa8']);
  for (let k = 0; k < 90; k++) R(c, rnd() * W, rnd() * 100, 0.5, 0.5, '#ffffff');
  c.fillStyle = '#1a1a40'; c.beginPath(); c.moveTo(0, 118); for (let x = 0; x <= W; x += 8) c.lineTo(x, 110 + Math.sin(x * 0.05) * 3 + (x > 220 ? -8 : 0)); c.lineTo(W, 122); c.lineTo(0, 122); c.fill();
  grad(c, 120, H, ['#2a3a7a', '#141a40']);
  R(c, 130, 150, 60, 5, '#6a4a3a'); for (let k = 0; k < 6; k++) R(c, 132 + k * 10, 150, 0.6, 5, '#4a2a1a'); R(c, 134, 155, 2, 25, '#4a2a1a'); R(c, 184, 155, 2, 25, '#4a2a1a');
});
function drawBubble(f: F) {
  const { c, el, t } = f;
  c.drawImage(bubbleBg(), 0, 0, W, H);
  // cực quang nhẹ + trăng in mặt hồ
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { c.globalAlpha = 0.18; c.fillStyle = ['#3affb0', '#8a5aff', '#ff6ab8'][k]; c.beginPath(); c.moveTo(0, 40 + k * 8); for (let x = 0; x <= W; x += 10) c.lineTo(x, 30 + k * 8 + Math.sin(x * 0.03 + t * 0.4 + k) * 10); c.lineTo(W, 0); c.lineTo(0, 0); c.fill(); }
  c.globalAlpha = 1; haloAt(c, 70, 30, 30, '#d8e0ff', 0.5); c.restore(); circ(c, 70, 30, 8, '#fff8e0');
  for (let k = 0; k < 8; k++) { c.globalAlpha = 0.5; R(c, 64 + Math.sin(t * 2 + k) * 3, 124 + k * 3, 12 - k, 0.6, '#fff8e0'); } c.globalAlpha = 1;
  // bong bóng: chữ mặc định + chữ hai đứa viết
  type B = { at: number; text: string; k: number; pop: number };
  const list: B[] = SPAWN.filter(s => s <= el).map((s, k) => ({ at: s, text: WORDS[k % WORDS.length], k, pop: Infinity }));
  for (const tp of f.taps) if (tp.id === 'write' && tp.i >= 0) { const key = `${tp.at}:${tp.i}`; if (!said.has(key)) said.set(key, f.text(tp.i)); const at = tp.at - (f.now - el); list.push({ at, text: said.get(key) || '…', k: 20 + list.length, pop: Infinity }); }
  list.sort((a, b) => a.at - b.at);
  const pops = f.taps.filter(x => x.id === 'pop' || x.id === 'popall').map(x => ({ at: x.at - (f.now - el), all: x.id === 'popall' })).sort((a, b) => a.at - b.at);
  for (const p of pops) { const alive = list.filter(b => b.pop === Infinity && b.at + 900 < p.at); if (p.all) alive.forEach(b => (b.pop = p.at)); else if (alive[0]) alive[0].pop = p.at; }
  list.forEach((b, i) => { if (b.pop === Infinity && el > B_FIN + i * 250) b.pop = B_FIN + i * 250; });
  let popped = 0;
  for (const b of list) { const age = el - b.at, pq = (el - b.pop) / 1400;
    const tx = 30 + rr(b.k, 1) * 260, ty = 22 + rr(b.k, 2) * 70, rise = ease(clamp(age / 3000));
    const x = lerp(160, tx, rise) + Math.sin(t * 0.8 + b.k) * 4, y = lerp(140, ty, rise) + Math.sin(t * 1.1 + b.k * 2) * 3, rad = 9 + Math.min(10, b.text.length * 0.9);
    if (pq >= 0) { popped++; if (pq > 1) continue;
      c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, x, y, rad * 2.2, '#ff8ad8', (1 - pq) * 0.6); c.restore();
      for (let k = 0; k < 18; k++) { const a = k * TAU / 18 + b.k, d = rad * 0.6 + pq * 34, col = ['#ff8ab0', '#ffd24a', '#7affd8', '#b88aff', '#ffffff'][k % 5]; c.globalAlpha = 1 - pq; if (k % 3 === 0) heart(c, x + Math.cos(a) * d, y + Math.sin(a) * d + pq * 8, 1.6, col); else if (k % 3 === 1) star(c, x + Math.cos(a) * d, y + Math.sin(a) * d + pq * 8, 1.6, col, t); else circ(c, x + Math.cos(a) * d, y + Math.sin(a) * d + pq * 8, 1, col); }
      c.globalAlpha = 1; continue; }
    // thân bong bóng trong suốt, viền ánh cầu vồng
    c.globalAlpha = 0.18; circ(c, x, y, rad, '#bfe8ff'); c.globalAlpha = 1;
    c.lineWidth = 0.8; for (let k = 0; k < 6; k++) { c.strokeStyle = ['#ff8ab0', '#ffd24a', '#7affd8', '#7ab8ff', '#b88aff', '#ff8ab0'][k] + 'b0'; c.beginPath(); c.arc(x, y, rad, k * TAU / 6 + t * 0.5, (k + 1) * TAU / 6 + t * 0.5); c.stroke(); }
    ell(c, x - rad * 0.4, y - rad * 0.45, rad * 0.25, rad * 0.14, '#ffffffd0', -0.6); circ(c, x + rad * 0.45, y + rad * 0.4, 0.8, '#ffffffa0');
    c.save(); c.font = 'bold 5px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffffff'; c.shadowColor = '#3a2a6a'; c.shadowBlur = 2; c.fillText(b.text.slice(0, 20), x, y, rad * 1.8); c.restore(); }
  // hai đứa ngồi trên cầu gỗ, quay lưng ngắm
  f.seats.forEach((p, i) => { if (!p) return; const pop = f.last(i, 'pop') < 600 || f.last(i, 'popall') < 900; putAt(f, pop ? p.img('act', 12, 'back') : p.img('sit', 0, 'back'), 152 + i * 16, 152, 0.5); });
  if (el > B_FIN + 1500) { fireworks(c, el, B_FIN + 1500, 800, [30, 10, 260, 50], 33); const a = clamp((el - B_FIN - 3000) / 1500);
    c.save(); c.globalAlpha = a; c.font = 'bold 11px serif'; c.textAlign = 'center'; c.fillStyle = '#fff6f0'; c.shadowColor = '#ff6a9a'; c.shadowBlur = 8; c.fillText('Nhẹ lòng rồi nè 💗', 160, 100); c.restore(); }
  void popped;
}
export const bubble: DuoCfg = {
  title: 'Bong bóng xả stress', ms: B_MS, join: 25000, wait: true, price: 0,
  ask: '🫧 Thả hết mệt mỏi vào bong bóng rồi cùng đập vỡ nhé', joinAsk: '🫧 Đập bong bóng cùng người ấy', invite: '🫧 Người ấy rủ đập bong bóng xả stress', yes: 'Đập thôi!', late: 'Lần sau đập cùng nha',
  buttons: [{ id: 'write', label: '✍️ Viết điều mệt', from: 1000, to: B_FIN, prompt: 'Hôm nay điều gì làm bạn mệt? (viết vào bong bóng)' }, { id: 'pop', label: '💥 Đập!', from: 2000, to: B_FIN }, { id: 'popall', label: '🎆 Bùm hết', from: 8000, to: B_FIN }, { id: 'photo', label: '📸 Chụp', from: 2000, to: B_MS }],
  caption: el => el < 3000 ? '🌙 Ngồi bên hồ, thở thật sâu…' : el < 20000 ? '🫧 Mỗi điều mệt mỏi là một bong bóng — bấm "Đập!" cho vỡ tan' : el < B_FIN ? '✍️ Viết thêm điều gì làm mình buồn, rồi đập luôn!' : '🎆 Bùm! Mệt mỏi bay hết thành pháo hoa',
  draw: drawBubble, snap: [B_FIN + 6000], endTitle: '🫧 Mệt mỏi vỡ tan hết rồi', endNote: 'Mai đi làm lại có người cổ vũ nè 💪💗',
};

// ═════════ Đêm pháo đài gối: mưa ngoài cửa sổ, đèn dây, bắp rang, phim hoạt hình hai đứa ═════════
const P_MS = 64000;
const fortRoom = () => bake('cheer:fort', W, H, (c, rnd) => {
  grad(c, 0, H, ['#2a2050', '#3a2a5a', '#4a3060']);
  for (let y = 0; y < 120; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < W; x += 8) circ(c, x, y, 0.6, '#5a4a7a');
  // cửa sổ mưa
  R(c, 14, 20, 70, 62, '#e8d8c0'); R(c, 18, 24, 62, 54, '#0e1430'); for (let k = 0; k < 30; k++) R(c, 18 + rnd() * 62, 50 + rnd() * 26, 1, 1.4, ['#ffd27a', '#ff8ab0', '#8ad8ff'][k % 3]);
  R(c, 48, 24, 2, 54, '#e8d8c0'); R(c, 18, 50, 62, 2, '#e8d8c0');
  for (const x of [8, 82]) { R(c, x, 14, 10, 80, '#c86a8a'); for (let y = 16; y < 94; y += 6) R(c, x + 2, y, 6, 1, '#a84a6a'); }
  // sàn gỗ + thảm tròn
  R(c, 0, 120, W, 60, '#6a4a3a'); for (let y = 124; y < H; y += 6) R(c, 0, y, W, 0.6, '#5a3a2a');
  ell(c, 150, 158, 110, 18, '#e8a0b8'); ell(c, 150, 158, 100, 15, '#f4c0d0'); ell(c, 150, 158, 70, 10, '#e8a0b8');
  // pháo đài chăn: 2 ghế + chăn caro hồng phủ thành lều
  R(c, 92, 100, 4, 50, '#8a5a3a'); R(c, 200, 100, 4, 50, '#8a5a3a');
  poly(c, [84, 150, 94, 96, 150, 82, 206, 96, 216, 150, 196, 150, 150, 104, 104, 150], '#f4b0c8');
  for (let k = 0; k < 10; k++) { line(c, 94 + k * 11, 96 - (k < 5 ? k : 9 - k) * 2.8, 104 + k * 9.2, 150, 0.5, '#e890b0'); }
  poly(c, [104, 150, 150, 104, 196, 150], '#2a1a30');
  // gối chất quanh
  for (const [x, y, col] of [[88, 148, '#ffe08a'], [212, 148, '#8ad8ff'], [74, 152, '#b88aff'], [226, 154, '#ff8ab0']] as const) { ell(c, x, y, 10, 6, col); ell(c, x - 2, y - 2, 6, 3, mix(col, '#ffffff', 0.4)); }
  // máy chiếu trên ghế đẩu
  R(c, 262, 130, 3, 20, '#5a3a2a'); R(c, 252, 128, 24, 3, '#8a5a3a'); R(c, 256, 120, 16, 8, '#3a3a4a'); circ(c, 256, 124, 3, '#8ad8ff');
  // mèo ngủ cuộn tròn trên gối
  ell(c, 228, 147, 6, 3.5, '#f0a050'); circ(c, 223, 146, 2.6, '#f0a050'); poly(c, [221, 144, 222, 141, 223.5, 143.5], '#f0a050'); poly(c, [224, 143.5, 225, 141, 226, 144], '#f0a050'); R(c, 221.5, 146, 1.2, 0.3, '#3a2a1a');
});
function miniCartoon(f: F, x0: number, y0: number, w: number, h: number) {
  const { c, t } = f, ep = Math.floor(t / 10) % 3, q = (t % 10) / 10;
  c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
  const sky = [['#5a8ad8', '#a8d8ff'], ['#0a1440', '#2a3a7a'], ['#ffd0e0', '#fff0f6']][ep];
  const g = c.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(x0, y0, w, h);
  const ims = f.all.map(p => p.img(ep === 1 ? 'sit' : ep === 0 ? 'walk' : 'kiss', Math.floor(t * 6) % 4, 'side'));
  if (ep === 0) { // đi chung ô dưới mưa
    for (let k = 0; k < 20; k++) R(c, x0 + ((k * 13 + t * 30) % w), y0 + ((k * 7 + t * 60) % h), 0.4, 2, '#ffffffa0');
    R(c, x0, y0 + h - 6, w, 6, '#4a8a4a'); const cx = x0 + 10 + q * (w - 20);
    ims.forEach((im, i) => { if (im) putAt(f, im, cx - 4 + i * 8, y0 + h - 5, 0.3); });
    c.fillStyle = '#ff4a6a'; c.beginPath(); c.arc(cx, y0 + h - 22, 10, Math.PI, 0); c.fill(); line(c, cx, y0 + h - 22, cx, y0 + h - 12, 0.5, '#3a2a2a'); }
  else if (ep === 1) { // ngồi trên mặt trăng câu sao
    for (let k = 0; k < 25; k++) R(c, x0 + rr(k, 4) * w, y0 + rr(k, 5) * h, 0.5, 0.5, '#ffffff');
    circ(c, x0 + w / 2, y0 + h + 6, 22, '#fff0b0'); for (let k = 0; k < 4; k++) circ(c, x0 + w / 2 - 12 + k * 7, y0 + h - 8 + (k % 2) * 4, 1.6, '#f0d890');
    ims.forEach((im, i) => { if (im) putAt(f, im, x0 + w / 2 - 6 + i * 12, y0 + h - 14, 0.3, i === 1); });
    line(c, x0 + w / 2 + 12, y0 + h - 24, x0 + w / 2 + 26, y0 + 10, 0.5, '#ffffff'); line(c, x0 + w / 2 + 26, y0 + 10, x0 + w / 2 + 26, y0 + 22 + Math.sin(t * 2) * 3, 0.3, '#ffffff'); star(c, x0 + w / 2 + 26, y0 + 24 + Math.sin(t * 2) * 3, 2.4, '#ffd24a', t); }
  else { // trái tim nở + chữ
    ims.forEach((im, i) => { if (im) putAt(f, im, x0 + w / 2 - 5 + i * 10, y0 + h - 4, 0.32, i === 1); });
    const s = 4 + ease(q) * 12; heart(c, x0 + w / 2, y0 + 16, s, '#ff4a7a'); c.save(); c.font = 'bold 5px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffffff'; c.fillText('Hai đứa mình', x0 + w / 2, y0 + 18, w - 6); c.restore(); }
  c.restore();
}
function drawFort(f: F) {
  const { c, el, t } = f;
  c.drawImage(fortRoom(), 0, 0, W, H);
  // mưa trên cửa sổ + chớp xa
  c.save(); c.beginPath(); c.rect(18, 24, 62, 54); c.clip(); for (let k = 0; k < 40; k++) { const x = 18 + rr(k, 1) * 62, y = 24 + ((rr(k, 2) * 54 + t * (30 + rr(k, 3) * 20)) % 54); R(c, x, y, 0.4, 2.5, '#a8c8ff90'); }
  for (let k = 0; k < 6; k++) { const x = 20 + rr(k, 7) * 58, y = 26 + ((t * 3 + k * 9) % 50); circ(c, x, y, 0.9, '#d8e8ff90'); }
  if (Math.sin(t * 0.7) > 0.985) { c.globalAlpha = 0.5; c.fillStyle = '#e8f0ff'; c.fillRect(18, 24, 62, 54); c.globalAlpha = 1; } c.restore();
  // dây đèn ấm vắt qua tường và pháo đài
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 30; k++) { const x = 4 + k * 10.6, y = 12 + Math.sin(k * 0.5) * 5; haloAt(c, x, y, 4.5, ['#ffd27a', '#ff8ab0', '#8ad8ff', '#b8ff8a'][k % 4], 0.55 + 0.35 * Math.sin(t * 2 + k)); }
  for (let k = 0; k < 12; k++) { const u = k / 11, x = 94 + u * 112, y = 96 - Math.sin(u * Math.PI) * 13; haloAt(c, x, y, 4, '#ffd27a', 0.7 + 0.3 * Math.sin(t * 3 + k)); }
  haloAt(c, 150, 136, 40, '#ffb070', 0.45);
  // chùm sáng máy chiếu
  c.globalAlpha = 0.12; poly(c, [256, 124, 214, 30, 304, 30, 304, 84, 256, 124], '#cfe8ff'); c.globalAlpha = 1; c.restore();
  R(c, 212, 28, 94, 58, '#f4f0e8'); miniCartoon(f, 214, 30, 90, 54);
  // hai đứa trong lều chăn: ngồi, rúc vào nhau, ăn bắp
  const cuddle = f.last(0, 'cuddle') < 4000 || f.last(1, 'cuddle') < 4000 || el > 45000;
  f.seats.forEach((p, i) => { if (!p) return; const eat = f.last(i, 'popcorn') < 2500; const im = eat ? p.img('actsit', Math.floor(t * 4) % 4) : p.img('sit'); putAt(f, im, 150 + (i ? 1 : -1) * (cuddle ? 6 : 11), 150, 0.6); });
  if (cuddle) { poly(c, [132, 144, 150, 137, 168, 144, 166, 151, 134, 151], '#ffe0ec'); for (let k = 0; k < 4; k++) R(c, 137 + k * 7.5, 143, 3.5, 8, '#ffc0d4'); }
  // bát bắp rang + bỏng nổ
  ell(c, 150, 152, 7, 2.5, '#e83a3a'); R(c, 143, 149, 14, 3, '#ffffff'); R(c, 143, 149, 2, 3, '#e83a3a'); R(c, 147, 149, 2, 3, '#e83a3a'); R(c, 151, 149, 2, 3, '#e83a3a'); R(c, 155, 149, 2, 3, '#e83a3a');
  for (let k = 0; k < 6; k++) circ(c, 145 + k * 2, 148.5, 1.2, '#fff6d8');
  for (const tp of f.taps) { if (tp.id !== 'popcorn') continue; const q = (f.now - tp.at) / 1500; if (q < 0 || q > 1) continue; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.4; circ(c, 150 + Math.cos(a) * q * 18, 146 + Math.sin(a) * q * 20 + q * q * 14, 1.2, '#fff6d8'); } }
  for (let k = 0; k < 5; k++) { const q = (t * 0.5 + k / 5) % 1; if (!cuddle) break; c.globalAlpha = 1 - q; heart(c, 150 + Math.sin(k * 2 + q * 4) * 8, 112 - q * 26, 1.4, '#ff8ab0'); } c.globalAlpha = 1;
  if (el < 1200) { c.globalAlpha = 1 - el / 1200; c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
}
export const fort: DuoCfg = {
  title: 'Đêm pháo đài gối', ms: P_MS, join: 30000, wait: true, price: 0,
  ask: '🛋️ Dựng pháo đài chăn gối, ăn bắp rang, xem phim hoạt hình hai đứa', joinAsk: '🛋️ Chui vào pháo đài gối cùng người ấy', invite: '🛋️ Người ấy rủ vào pháo đài gối xem phim', yes: 'Chui vào!', late: 'Lần sau chui sớm nha',
  buttons: [{ id: 'cuddle', label: '🫂 Rúc vào nhau', from: 1500, to: P_MS }, { id: 'popcorn', label: '🍿 Ăn bắp', from: 1500, to: P_MS }, { id: 'photo', label: '📸 Chụp', from: 1500, to: P_MS }],
  caption: el => el < 4000 ? '🌧️ Ngoài trời mưa rồi… dựng pháo đài chăn gối thôi' : el < 25000 ? '🎬 Phim hoạt hình tối nay: “Hai đứa mình”' : el < 45000 ? '🍿 Bắp rang nóng hổi, mèo ngủ khò khò' : '🫂 Rúc vào nhau nghe mưa rơi…',
  draw: drawFort, snap: [20000, 50000], endTitle: '🛋️ Một tối mưa trong pháo đài gối', endNote: 'Ấm áp ghê 💗',
};

// ═════════ Show đèn drone cổ vũ: tim → sao → hoa nở → lời nhắn → hai đứa → tim khổng lồ + pháo hoa ═════════
type Pt3 = [number, number, string];
/** ảnh kỷ niệm cho show drone: ảnh thật giữ nguyên tỉ lệ (không cắt), lưu trong dữ liệu chung của hai đứa.
 *  Drone xếp thành ảnh chấm sáng lấy màu từ ảnh → rồi chính tấm ảnh hiện dần trong khung đèn (giữ nguyên khuôn mặt). */
export const PIC_DOTS = 2200, PCX = 160, PCY = 64, PMAXW = 230, PMAXH = 118;
export const dronePics: { list: { id: string; img: string }[]; msg: string } = { list: [], msg: '' };
const picIms = new Map<string, HTMLImageElement>();
export const picImg = (id: string, src: string) => { let im = picIms.get(id); if (!im) { im = new Image(); im.src = src; picIms.set(id, im); } return im.complete && im.width ? im : null; };
/** lưới chấm theo đúng tỉ lệ ảnh: tổng ~PIC_DOTS chấm, vừa khung PMAXW×PMAXH */
export function picLayout(iw: number, ih: number, cx = PCX, cy = PCY, maxW = PMAXW, maxH = PMAXH) {
  const asp = iw / ih, gw = Math.max(8, Math.round(Math.sqrt(PIC_DOTS * asp))), gh = Math.max(8, Math.round(PIC_DOTS / gw));
  const step = Math.min(maxW / gw, maxH / gh), w = gw * step, h = gh * step;
  return { gw, gh, step, w, h, x0: cx - w / 2, y0: cy - h / 2 };
}
export function samplePic(im: HTMLImageElement, L = picLayout(im.width, im.height)): Pt3[] {
  const { gw, gh, step, x0, y0 } = L;
  const cv = document.createElement('canvas'); cv.width = gw; cv.height = gh; const c = cv.getContext('2d', { willReadFrequently: true })!;
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(im, 0, 0, gw, gh);
  const d = c.getImageData(0, 0, gw, gh).data, out: Pt3[] = [];
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const k = (y * gw + x) * 4, rgb = [d[k], d[k + 1], d[k + 2]];
    if (Math.max(...rgb) < 12) continue;
    const lift = rgb.map(v => Math.round(255 * (v / 255) ** 0.75));
    out.push([x0 + (x + 0.5) * step, y0 + (y + 0.5) * step, `rgb(${lift[0]},${lift[1]},${lift[2]})`]);
  }
  return out;
}
const rrect = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
const D_MS = 110000, ND = PIC_DOTS;
const PH: { t: number; k: string }[] = [{ t: 0, k: 'ground' }, { t: 2500, k: 'cloud' }, { t: 8000, k: 'heart' }, { t: 16000, k: 'pic0' }, { t: 26000, k: 'star' }, { t: 33000, k: 'pic1' }, { t: 43000, k: 'flower' }, { t: 51000, k: 'pic2' }, { t: 61000, k: 'text' }, { t: 78000, k: 'pic3' }, { t: 88000, k: 'couple' }, { t: 97000, k: 'big' }];
const PI = (k: string) => PH.findIndex(p => p.k === k);
const shuffle = <T,>(a: T[]) => a.map((v, i) => [rr(i, 77), v] as const).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const fill = (pts: Pt3[]): Pt3[] => (!pts.length ? [] : pts.length >= ND ? Array.from({ length: ND }, (_, i) => pts[Math.floor((i * pts.length) / ND)]) : Array.from({ length: ND }, (_, i) => (i < pts.length ? pts[i] : [pts[i % pts.length][0], pts[i % pts.length][1], ''] as Pt3)));
/** điểm xếp đều theo lưới (giống drone thật cách đều nhau) */
const grid = (sp: number, x0: number, y0: number, x1: number, y1: number, at: (x: number, y: number) => string | null): Pt3[] => { const out: Pt3[] = []; for (let y = y0; y <= y1; y += sp) for (let x = x0; x <= x1; x += sp) { const col = at(x, y); if (col) out.push([x, y, col]); } return shuffle(out); };
const sample = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, ox: number, oy: number, sc: number, step = 1): Pt3[] => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d', { willReadFrequently: true })!; draw(c);
  const d = c.getImageData(0, 0, w, h).data, out: Pt3[] = [];
  for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) { const k = (y * w + x) * 4; if (d[k + 3] > 140) out.push([ox + x * sc, oy + y * sc, `rgb(${d[k]},${d[k + 1]},${d[k + 2]})`]); }
  return shuffle(out);
};
const shapes = new Map<string, Pt3[]>();
/** chia lời nhắn thành các trang ≤ 2 dòng: mỗi đoạn (ngăn bằng "/") ngắt dòng cân đối, ở trọn trong trang của nó; tối đa 3 trang */
function pages(msg: string): string[] {
  const out: string[] = [];
  for (const seg of msg.split('\n').map(x => x.trim()).filter(Boolean)) {
    const words = seg.split(/\s+/), n = Math.ceil(seg.length / 18), lim = Math.max(seg.length / n + 3, ...words.map(w => w.length));
    const lines: string[] = []; let cur = '';
    for (const w of words) { if (cur && (cur + ' ' + w).length > lim) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    if (cur) lines.push(cur);
    for (let i = 0; i < lines.length; i += 2) out.push(lines.slice(i, i + 2).join('\n'));
  }
  while (out.length > 3) { const i = out.findIndex((x, k) => k < out.length - 1 && !x.includes('\n') && !out[k + 1].includes('\n')); if (i < 0) break; out.splice(i, 2, out[i] + '\n' + out[i + 1]); }
  return (out.length ? out : ['♥']).slice(0, 3);
}
const textSpan = () => [PH[PI('text')].t, PH[PI('text') + 1].t] as const;
const pageAt = (pg: string[], e: number) => { const [a, b] = textSpan(); return Math.max(0, Math.min(pg.length - 1, Math.floor(((e - a) / (b - a)) * pg.length))); };
function shape(k: string, f: F, msg: string): Pt3[] {
  if (k.startsWith('pic')) { const n = dronePics.list.length, j = +k.slice(3);
    if (!n) return shape(['couple', 'flower', 'star', 'heart'][j % 4], f, msg);
    const pic = dronePics.list[j % n], key = `pic:${pic.id}`, hit = shapes.get(key); if (hit) return hit;
    const im = picImg(pic.id, pic.img); if (!im) return shape('heart', f, msg);   // ảnh chưa tải xong: tạm xếp tim
    const out = fill(shuffle(samplePic(im))); shapes.set(key, out); return out; }
  const key = k === 'text' ? `text:${msg}` : k === 'couple' ? `couple:${f.all.map(p => p.key).join('|')}` : k;
  const hit = shapes.get(key); if (hit && hit.length) return hit;
  let pts: Pt3[] = [];
  if (k === 'cloud') pts = Array.from({ length: ND }, (_, i) => [30 + rr(i, 1) * 260, 20 + rr(i, 2) * 80, '#cfe8ff']);
  else if (k === 'heart' || k === 'big') { const s = k === 'big' ? 44 : 32; pts = grid(k === 'big' ? 3.1 : 2.8, 160 - s * 1.3, 64 - s * 1.3, 160 + s * 1.3, 64 + s * 1.3, (X, Y) => { const x = (X - 160) / s, y = (64 - Y) / s, v = (x * x + y * y - 1) ** 3 - x * x * y ** 3; return v > 0 ? null : v > -0.08 ? '#ff3a7a' : '#ff8ab0'; }); }
  else if (k === 'star') pts = grid(2.8, 112, 14, 208, 110, (x, y) => { const a = Math.atan2(y - 62, x - 160), r = Math.hypot(x - 160, y - 62), sp = Math.cos(5 * (a + Math.PI / 2)) * 0.5 + 0.5, rmax = 18 + sp ** 3 * 28; return r > rmax ? null : r > rmax * 0.8 ? '#fff0a0' : '#ffc83a'; });
  else if (k === 'flower') pts = grid(2.8, 112, 14, 208, 110, (x, y) => { const a = Math.atan2(y - 62, x - 160), r = Math.hypot(x - 160, y - 62), rmax = 12 + 34 * Math.abs(Math.cos(2.5 * a)); return r > rmax ? null : r < 9 ? '#ffd24a' : mix('#ff6ab8', '#9a6aff', r / rmax); });
  else if (k === 'text') { const lines = msg.split('\n').slice(0, 2); pts = sample(300, 80, c => { c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 30; c.font = `bold ${fs}px sans-serif`; while (fs > 12 && Math.max(...lines.map(l => c.measureText(l).width)) > 290) { fs -= 2; c.font = `bold ${fs}px sans-serif`; } lines.forEach((l, i) => c.fillText(l, 150, 40 + (i - (lines.length - 1) / 2) * fs * 1.05)); }, 160 - 150 * 0.8, 62 - 40 * 0.8, 0.8, 3).map(([x, y], i) => [x, y, mix('#8affff', '#ff9ad8', rr(i, 11))] as Pt3); }
  else if (k === 'couple') { const ims = f.all.map(p => p.img('idle')); if (ims.every(im => !im || !im.width)) return shape('heart', f, msg);
    pts = sample(120, 70, c => { c.imageSmoothingEnabled = false; ims.forEach((im, i) => { if (im && im.width) { const sc = 66 / im.height; c.drawImage(im, 30 + i * 30 - (im.width * sc) / 2 + 15, 2, im.width * sc, im.height * sc); } }); }, 160 - 60 * 1.1, 62 - 35 * 1.1, 1.1, 2); }
  const out = fill(pts); shapes.set(key, out); return out;
}
const bayBg = () => bake('cheer:bay', W, H, (c, rnd) => {
  grad(c, 0, 132, ['#02030f', '#070c2a', '#121a48', '#22285a']);
  for (let k = 0; k < 120; k++) R(c, rnd() * W, rnd() * 110, 0.5, 0.5, rnd() < 0.2 ? '#fff6dc' : '#ffffff');
  // đường chân trời phố cao tầng lên đèn
  for (let x = 0; x < W;) { const w = 6 + rnd() * 12, h = 8 + rnd() * 26 + (Math.abs(x - 160) < 50 ? 10 : 0); R(c, x, 132 - h, w, h, '#0e1230'); for (let y = 132 - h + 2; y < 130; y += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2.5) if (rnd() < 0.45) R(c, xx, y, 1, 1, ['#ffd27a', '#fff6c0', '#8ad8ff'][Math.floor(rnd() * 3)]); x += w + 1; }
  grad(c, 132, H, ['#0a1440', '#050820']);
  // cầu tàu gỗ góc trái nơi hai đứa ngồi
  poly(c, [0, 160, 92, 152, 96, 156, 0, 166], '#5a3a2a'); for (let k = 0; k < 8; k++) R(c, k * 12, 160 - k, 1.2, 20, '#3a2418');
});
function drawDrone(f: F) {
  const { c, el, t } = f;
  c.drawImage(bayBg(), 0, 0, W, H);
  // trăng + quầng sáng
  c.save(); c.globalCompositeOperation = 'lighter'; haloAt(c, 286, 22, 34, '#d8e0ff', 0.5); c.restore(); circ(c, 286, 22, 7, '#fff8e0'); circ(c, 289, 20, 6, '#0a1036');
  // cầu dây văng giăng đèn phía xa bên trái + đu quay phát sáng bên phải
  { c.strokeStyle = '#2a2a50'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 118); c.lineTo(110, 118); c.stroke(); for (const tx of [26, 84]) { R(c, tx - 1, 92, 2, 26, '#2a2a50'); for (let j = -5; j <= 5; j++) line(c, tx, 93, tx + j * 5, 118, 0.3, '#3a3a6a'); }
    c.save(); c.globalCompositeOperation = 'lighter'; for (let j = 0; j < 22; j++) { const x = j * 5, y = 118 - Math.abs(Math.sin((x / 58) * Math.PI)) * 0; haloAt(c, x, y - 0.5, 2.6, ['#ffd27a', '#ff8ad8', '#8affff'][(j + Math.floor(t * 2)) % 3], 0.7); } for (const tx of [26, 84]) haloAt(c, tx, 91, 5, '#ff4a6a', 0.5 + 0.5 * Math.sin(t * 3)); c.restore(); }
  { const cx = 262, cy = 96, r = 24, a0 = t * 0.15; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#ff8ad870'; c.lineWidth = 0.8; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
    for (let k = 0; k < 16; k++) { const a = a0 + (k * TAU) / 16, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r, col = ['#ff6ab8', '#ffd24a', '#6ad8ff', '#b88aff'][(k + Math.floor(t)) % 4]; line(c, cx, cy, x, y, 0.3, col + '60'); haloAt(c, x, y, 3, col, 0.8); } haloAt(c, cx, cy, 6, '#ffffff', 0.6); c.restore(); line(c, cx, cy, cx - 9, 132, 0.8, '#2a2a50'); line(c, cx, cy, cx + 9, 132, 0.8, '#2a2a50'); }
  // phố in bóng nước lăn tăn
  for (let k = 0; k < 60; k++) { const x = rr(k, 12) * W, y = 134 + rr(k, 13) * 40, a = Math.sin(t * 2 + k); if (a > 0) { c.globalAlpha = a * 0.6; R(c, x, y, 2 + rr(k, 14) * 4, 0.5, ['#ffd27a', '#8ad8ff', '#ff9ad8'][k % 3]); } } c.globalAlpha = 1;
  const msg = (f.text(giverOf(f)) || f.text(1 - giverOf(f)) || dronePics.msg || 'EM GIỎI LẮM!\nCỐ LÊN NHA 💗').replace(/ ?\/ ?/g, '\n'), pg = pages(msg);
  const cheer = f.taps.filter(x => x.id === 'cheer' && f.now - x.at < 2500).length;
  c.save(); c.globalCompositeOperation = 'lighter';
  const pos: [number, number, string][] = [];
  for (let i = 0; i < ND; i++) {
    const dl = rr(i, 15) * 900, e = el - dl; let k = 0; while (k + 1 < PH.length && PH[k + 1].t <= e) k++;
    const at = (kk: number): Pt3 => { const s = PH[kk].k; if (s === 'ground') return [36 + rr(i, 16) * 250, 146 + rr(i, 17) * 4, '#ffffff']; const p = shape(s, f, s === 'text' ? pg[pageAt(pg, e)] : msg)[i] ?? [160, 60, '#ffffff'];
      if (s === 'star') { const a = t * 0.9, dx = p[0] - 160; return [160 + dx * Math.cos(a), p[1], p[2]]; }
      if (s === 'flower') { const a = t * 0.25, dx = p[0] - 160, dy = p[1] - 62, bloom = 0.6 + 0.4 * ease(clamp((e - PH[PI('flower')].t) / 4000)); return [160 + (dx * Math.cos(a) - dy * Math.sin(a)) * bloom, 62 + (dx * Math.sin(a) + dy * Math.cos(a)) * bloom, p[2]]; }
      if (s === 'big') { const beat = 1 + 0.05 * Math.sin(t * 5); return [160 + (p[0] - 160) * beat, 64 + (p[1] - 64) * beat, mix('#ff3a7a', '#ffd24a', 0.5 + 0.5 * Math.sin(t * 2 + i * 0.05))]; }
      if (s === 'cloud') return [p[0] + Math.sin(t + i) * 2, p[1] + Math.cos(t * 0.8 + i) * 2, p[2]];
      return p; };
    const to = at(k); let from = k ? at(k - 1) : to, q = ease(clamp((e - PH[k].t) / 2600));
    if (PH[k].k === 'text') { const n = pageAt(pg, e); if (n > 0) { const [a, b] = textSpan(), ps = a + ((b - a) * n) / pg.length; from = shape('text', f, pg[n - 1])[i] ?? to; q = ease(clamp((e - ps) / 1300)); } }
    const arc = Math.sin(q * Math.PI) * (rr(i, 41) - 0.5) * 36, hov = q > 0.98 ? 1 : 0;
    const x = lerp(from[0], to[0], q) + arc * 0.4 + Math.sin(t * 1.3 + i) * 0.3 * hov, y = lerp(from[1], to[1], q) - Math.abs(arc) * 0.6 + Math.cos(t * 1.1 + i * 1.7) * 0.3 * hov, col = q < 0.5 ? from[2] : to[2];
    pos.push([x, y, col]);
    const tw = 0.7 + 0.3 * Math.sin(t * 4 + i) + (cheer ? 0.4 : 0);
    const pic = PH[k].k.startsWith('pic') && q > 0.9;
    if (col) haloAt(c, x, y, (pic ? 1.5 : 1.7) + (cheer ? 0.8 : 0), col, (pic ? 0.45 : 0.6) * tw);
  }
  c.restore();
  // chấm drone vẽ thường (không cộng sáng) để hình sắc nét, không cháy trắng khi nhiều drone chồng nhau
  for (let i = 0; i < ND; i++) { const [x, y, col] = pos[i]; if (!col) continue; R(c, x - 0.55, y - 0.55, 1.1, 1.1, col); R(c, x - 0.2, y - 0.2, 0.4, 0.4, '#ffffff'); }
  c.save(); c.globalCompositeOperation = 'lighter';
  // bóng drone trên mặt nước
  c.globalAlpha = 0.18; for (let i = 0; i < ND; i += 2) { const [x, y, col] = pos[i]; if (col && y < 132) R(c, x + Math.sin(t * 2 + y) * 1, 132 + (132 - y) * 0.35, 0.8, 1.2, col); } c.globalAlpha = 1;
  c.restore();
  // ảnh thật hiện dần trong khung bầu dục sáng khi drone đã xếp xong — mặt giữ y như ảnh gốc
  { let k = 0; while (k + 1 < PH.length && PH[k + 1].t <= el) k++;
    const n = dronePics.list.length, ph = PH[k];
    if (n && ph.k.startsWith('pic')) { const pic = dronePics.list[+ph.k.slice(3) % n], im = picImg(pic.id, pic.img), next = PH[k + 1]?.t ?? D_MS;
      const a = ease(clamp((el - ph.t - 3400) / 2200)) * clamp((next - el - 300) / 1300);
      if (im && a > 0) { const { x0, y0, w, h } = picLayout(im.width, im.height);
        c.save(); rrect(c, x0, y0, w, h, 3); c.clip(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.globalAlpha = a * 0.97; c.drawImage(im, x0, y0, w, h); c.restore();
        // vẫn là "ảnh bằng đèn": khung viền đèn lấp lánh + lớp chấm sáng mỏng phủ lên
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
        c.strokeStyle = '#ffd8f0'; c.lineWidth = 0.8; rrect(c, x0 - 1.5, y0 - 1.5, w + 3, h + 3, 4); c.stroke();
        const per = 2 * (w + h) + 12, nb = Math.round(per / 2.6);
        for (let j = 0; j < nb; j++) { let u = ((j / nb + t * 0.02) % 1) * per, x: number, y: number; const ww = w + 6, hh = h + 6, X = x0 - 3, Y = y0 - 3;
          if (u < ww) { x = X + u; y = Y; } else if ((u -= ww) < hh) { x = X + ww; y = Y + u; } else if ((u -= hh) < ww) { x = X + ww - u; y = Y + hh; } else { u -= ww; x = X; y = Y + hh - u; }
          haloAt(c, x, y, 2.2, ['#ff8ad8', '#ffd24a', '#8affff'][j % 3], 0.5 + 0.4 * Math.sin(t * 3 + j)); }
        c.globalAlpha = a * 0.1; for (let i = 0; i < ND; i++) { const [x, y, col] = pos[i]; if (col) R(c, x - 0.5, y - 0.5, 1, 1, col); }
        c.restore(); } } }
  if (cheer) fireworks(c, el, 0, 900, [30, 8, 260, 50], 44);
  // pháo hoa tự bắn hai bên suốt show (chừa khoảng giữa cho hình drone)
  fireworks(c, el, 5000, 1700, [6, 6, 70, 46], 51); fireworks(c, el, 5800, 1900, [244, 6, 70, 46], 52);
  // đèn trời bay lên chậm + thuyền thả đèn trên vịnh
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 14; k++) { const x = (rr(k, 30) < 0.5 ? 8 + rr(k, 31) * 80 : 232 + rr(k, 31) * 80) + Math.sin(t * 0.4 + k) * 4, y = 132 - ((t * (3 + rr(k, 32) * 3) + rr(k, 33) * 130) % 130); haloAt(c, x, y, 5, '#ffa048', 0.55); R(c, x - 1, y - 1.5, 2, 2.6, '#ffd890'); }
  for (let k = 0; k < 5; k++) { const x = ((k * 70 + t * 2.5) % (W + 40)) - 20, y = 140 + (k % 3) * 9; haloAt(c, x, y - 2, 6, '#ffd27a', 0.6); haloAt(c, x, y + 4, 4, '#ffd27a', 0.25); }
  c.restore();
  for (let k = 0; k < 5; k++) { const x = ((k * 70 + t * 2.5) % (W + 40)) - 20, y = 140 + (k % 3) * 9; poly(c, [x - 5, y, x + 5, y, x + 3, y + 2, x - 3, y + 2], '#1a1430'); R(c, x - 0.3, y - 6, 0.6, 6, '#3a3050'); R(c, x - 1, y - 3, 2, 2, '#ffd890'); }
  fireworks(c, el, PH[PI('big')].t + 1500, 650, [10, 4, 300, 60], 45);
  // hai đứa ngồi cầu tàu quay lưng ngắm
  f.seats.forEach((p, i) => { if (!p) return; const cheerMe = f.last(i, 'cheer') < 1500; putAt(f, cheerMe ? p.img('act', 12, 'back') : p.img('sit', 0, 'back'), 40 + i * 15, 158, 0.5); });
  if (el < 1200) { c.globalAlpha = 1 - el / 1200; c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  void ell; void glow; void poly; void line;
}
export const drone: DuoCfg = {
  title: 'Show đèn drone cổ vũ người ấy', ms: D_MS, Z: 3, join: 45000, wait: true, price: 0,
  ask: '🛸 Bật show đèn drone dành riêng cho người ấy', joinAsk: '🛸 Ra cầu tàu xem show drone', invite: '🛸 Người ấy có một show đèn drone dành cho bạn!', yes: 'Xem ngay!', late: 'Show bắt đầu mất rồi — lần sau nha',
  buttons: [{ id: 'msg', label: '💬 Lời cho drone', from: 1000, to: PH[PI('text')].t + 8000, prompt: 'Drone sẽ xếp thành chữ gì? (xuống dòng bằng " / ", vd: EM GIỎI LẮM / ANH THƯƠNG EM)' }, { id: 'cheer', label: '📣 Cổ vũ', from: 3000, to: D_MS }, { id: 'photo', label: '📸 Chụp', from: 3000, to: D_MS }],
  caption: el => { let i = 0; while (i + 1 < PH.length && PH[i + 1].t <= el) i++; const k = PH[i].k;
    return ({ ground: '🛸 Hơn hai nghìn chiếc drone cất cánh trên vịnh…', cloud: '🛸 Hơn hai nghìn chiếc drone cất cánh trên vịnh…', heart: '💗 Một trái tim cho người giỏi nhất', star: '⭐ Ngôi sao xoay — em là ngôi sao của anh', flower: '🌸 Bông hoa nở rộ giữa trời đêm', text: '💬 Lời nhắn bằng đèn trên trời', couple: '👫 Là hai đứa mình đó!', big: '🎆 Trái tim khổng lồ và pháo hoa rực trời!' } as Record<string, string>)[k] ?? (dronePics.list.length ? '📸 Drone xếp lại kỷ niệm của hai đứa' : '✨ Drone vẽ hình trên trời'); },
  draw: drawDrone, snap: [PH[PI('pic0')].t + 6000, PH[PI('pic1')].t + 6000, PH[PI('text')].t + 6000, PH[PI('big')].t + 5000], endTitle: '🛸 Show drone dành riêng cho em', endNote: 'Mỗi ngày đi làm vất vả rồi — có người luôn tự hào về em 💗',
};

export const CHEER_SCENES = { bubble, fort, drone };
