// Lễ hội băng tuyết Cáp Nhĩ Tân: lâu đài khối băng trong suốt chiếu đèn đổi màu, máng trượt băng dài, tượng tuyết, pháo hoa cuối buổi.
import type { DuoCfg, F } from './Duo';
import { bake, circ, ell, glow, line, poly, R, star, twinkle, type Ctx } from '../lib/canvasArt';
import { fireworks, mix, rr } from './duoSky';

const W = 320, H = 180;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const IMS = 64000, IFW = 40000;
const HUES = ['#3ab0ff', '#9a6aff', '#ff6ac8', '#3affb0', '#ffd84a'];
const hueAt = (t: number, k: number) => { const u = (t * 0.25 + k * 0.7) % HUES.length, i = Math.floor(u); return mix(HUES[i], HUES[(i + 1) % HUES.length], u - i); };
/** khối băng: ô gạch trong suốt, mép sáng, lõi chiếu đèn */
function ice(c: Ctx, x: number, y: number, w: number, h: number, col: string) {
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, mix(col, '#ffffff', 0.55)); g.addColorStop(1, mix(col, '#0a1a3a', 0.25)); c.fillStyle = g; c.fillRect(x, y, w, h);
  for (let yy = y; yy < y + h; yy += 4) { R(c, x, yy, w, 0.4, '#ffffff70'); for (let xx = x + ((yy - y) / 4 % 2) * 4; xx < x + w; xx += 8) R(c, xx, yy, 0.4, 4, '#ffffff50'); }
  R(c, x, y, 0.6, h, '#ffffffb0'); R(c, x + w - 0.6, y, 0.6, h, '#ffffff60');
}
function tower(c: Ctx, x: number, base: number, w: number, h: number, col: string, spire = true) {
  glow(c, x, base - h * 0.5, h * 0.9, col, 0.25);
  ice(c, x - w / 2, base - h, w, h, col);
  for (let k = 0; k < Math.floor(w / 5); k++) R(c, x - w / 2 + k * 5, base - h - 3, 3, 3, mix(col, '#ffffff', 0.5));
  if (spire) { poly(c, [x - w * 0.4, base - h - 3, x, base - h - w * 1.3, x + w * 0.4, base - h - 3], mix(col, '#ffffff', 0.35)); line(c, x, base - h - 3, x, base - h - w * 1.3, 0.5, '#ffffffb0'); }
  for (let k = 0; k < 3; k++) { const wy = base - h + 6 + k * (h / 3.4); if (wy < base - 6) { R(c, x - 2, wy, 4, 5, '#ffffffd0'); R(c, x - 1, wy - 1, 2, 1, '#ffffffd0'); } }
}
const icePark = () => bake('duo:icepark', W, H, (c, rnd) => {
  const g = c.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, '#02041a'); g.addColorStop(1, '#1a2258'); c.fillStyle = g; c.fillRect(0, 0, W, 134);
  for (let k = 0; k < 120; k++) R(c, rnd() * W, rnd() * 90, 0.5, 0.5, '#ffffff');
  R(c, 0, 132, W, H - 132, '#e8f0fa'); for (let k = 0; k < 160; k++) R(c, rnd() * W, 133 + rnd() * 46, 3 + rnd() * 8, 0.5, '#c8d8ec');
  // tượng tuyết trắng (gấu trúc, thiên nga, rồng) bên trái
  ell(c, 34, 128, 16, 10, '#f4f8ff'); circ(c, 30, 116, 7, '#f4f8ff'); circ(c, 26, 111, 2.4, '#f4f8ff'); circ(c, 34, 111, 2.4, '#f4f8ff'); ell(c, 28, 116, 1.6, 1.2, '#c8d4e8'); ell(c, 32, 116, 1.6, 1.2, '#c8d4e8');
  ell(c, 72, 126, 12, 7, '#f4f8ff'); line(c, 80, 122, 82, 108, 2.2, '#f4f8ff'); ell(c, 80, 107, 3, 2, '#f4f8ff'); poly(c, [60, 124, 52, 112, 66, 120], '#f4f8ff');
});
function drawIce(f: F) {
  const { c, el, t } = f, recolor = f.taps.filter(x => x.id === 'color').length, tt = t + recolor * 1.4;
  c.drawImage(icePark(), 0, 0, W, H);
  for (let k = 0; k < 60; k++) { const a = 0.5 + 0.5 * Math.sin(t * (1 + rr(k, 3) * 2) + k); c.globalAlpha = a; R(c, rr(k, 1) * W, rr(k, 2) * 80, 0.5, 0.5, '#ffffff'); c.globalAlpha = 1; }
  fireworks(c, el, IFW, 750, [20, 6, 280, 36], 9);
  // cung điện băng chính giữa: tháp cao, mái vòm, cổng vòm
  const base = 132;
  for (const [x, w, h, k] of [[104, 14, 54, 1], [216, 14, 54, 3], [124, 12, 70, 2], [196, 12, 70, 4]] as const) tower(c, x, base, w, h, hueAt(tt, k));
  { const col = hueAt(tt, 0); tower(c, 160, base, 30, 84, col); ell(c, 160, base - 84, 16, 10, mix(col, '#ffffff', 0.4)); star(c, 160, base - 102, 3.4, '#fff6c0', t * 0.3); glow(c, 160, base - 102, 10, '#fff6c0', 0.6);
    R(c, 152, base - 22, 16, 22, '#0a1a3a'); ell(c, 160, base - 22, 8, 6, '#0a1a3a'); glow(c, 160, base - 12, 14, col, 0.6); }
  for (const [x, w, h, k] of [[136, 18, 40, 3], [184, 18, 40, 1]] as const) tower(c, x, base, w, h, hueAt(tt, k), false);
  // máng trượt băng dài bên phải
  const slope = (u: number): [number, number] => [244 + u * 72, 70 + u * 60 + Math.sin(u * 9) * 2];
  c.strokeStyle = mix(hueAt(tt, 2), '#ffffff', 0.4); c.lineWidth = 4; c.beginPath(); for (let k = 0; k <= 20; k++) { const [x, y] = slope(k / 20); if (k) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
  c.strokeStyle = '#ffffffa0'; c.lineWidth = 0.6; c.stroke();
  tower(c, 240, 132, 12, 64, hueAt(tt, 2), false);
  // đèn lồng băng dọc lối đi
  for (let k = 0; k < 9; k++) { const x = 18 + k * 36, y = 150 + (k % 2) * 6, col = hueAt(tt, k); glow(c, x, y - 4, 10, col, 0.6); R(c, x - 2.5, y - 8, 5, 8, mix(col, '#ffffff', 0.5)); R(c, x - 2.5, y - 8, 5, 0.6, '#ffffff'); }
  // người dạo lễ hội (bóng nhỏ)
  for (let k = 0; k < 8; k++) { const x = ((k * 47 + t * (3 + k % 3)) % (W + 20)) - 10, y = 140 + (k % 3) * 4; R(c, x - 1.5, y - 8, 3, 7, ['#c8303a', '#3a5a8a', '#f6c445', '#8a4a8a'][k % 4]); circ(c, x, y - 9.5, 1.5, '#f4d0b0'); R(c, x - 1.7, y - 11.4, 3.4, 1.4, '#ffffff'); }
  // hai đứa: đứng ngắm, hoặc trượt máng băng
  const slideAt = f.taps.filter(x => x.id === 'slide').pop(), sq = slideAt ? (f.now - slideAt.at) / 4500 : 2;
  f.seats.forEach((p, i) => { if (!p) return;
    if (sq < 1) { const u = clamp(sq * 1.15 - i * 0.08), [x, y] = slope(u); const im = p.img('sit', 0, 'side'); f.put(im, x - im.width * 0.3, y - im.height * 0.62, 0.6, true); if (u > 0.2) for (let k = 0; k < 4; k++) R(c, x - 6 - k * 3, y + 1 - k, 1, 1, '#ffffff'); return; }
    const x = 148 + i * 26, im = el > IFW ? p.img('idle', 0, 'back') : p.img('idle'); f.put(im, x - im.width / 2, 172 - im.height); });
  // tuyết lất phất
  for (let k = 0; k < 60; k++) { const sp = 5 + rr(k, 1) * 7, x = (rr(k, 2) * W + Math.sin(t * 0.7 + k) * 6) % W, y = (rr(k, 3) * H + t * sp) % H; circ(c, x, y, 0.4 + rr(k, 4) * 0.5, '#ffffff'); }
  if (recolor) twinkle(c, 160, 40, 3, '#ffffff');
}
export const icecastle: DuoCfg = {
  title: 'Lâu đài băng Cáp Nhĩ Tân', ms: IMS, join: 12000, price: 25, gift: { item: 'hb_ice_lantern' },
  ask: '🏰 Đi lễ hội băng tuyết Cáp Nhĩ Tân ngắm lâu đài băng', joinAsk: '🏰 Đi lễ hội băng cùng người ấy', invite: '🏰 Người ấy rủ đi ngắm lâu đài băng Cáp Nhĩ Tân', yes: 'Đi cùng!', late: 'Lần sau đi cùng nha',
  buttons: [{ id: 'slide', label: '🛷 Trượt máng băng', from: 2000, to: IMS }, { id: 'color', label: '🌈 Đổi màu đèn', from: 2000, to: IMS }, { id: 'photo', label: '📸 Chụp', from: 2000, to: IMS }],
  caption: el => el < 4000 ? '❄️ Lễ hội băng tuyết Cáp Nhĩ Tân — âm 20 độ mà lung linh quá!' : el < 22000 ? '🏰 Cung điện xây bằng nghìn khối băng, đèn đổi màu liên tục' : el < IFW ? '🛷 Thử trượt máng băng dài nhất lễ hội đi!' : el < IMS ? '🎆 Pháo hoa nổ trên lâu đài băng!' : '❄️ Đêm băng tuyết thần tiên',
  draw: drawIce, snap: [IFW + 8000], endTitle: '🏰 Đêm lâu đài băng Cáp Nhĩ Tân', endNote: 'Một chiếc đèn lồng băng nhỏ đã vào túi đồ — tối lên đổi màu lung linh',
};
void circ;
