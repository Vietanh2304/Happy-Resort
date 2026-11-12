// Lễ hội băng tuyết Cáp Nhĩ Tân: cung điện xây từ nghìn khối băng trong suốt, đèn chiếu từ bên trong đổi màu,
// quầng sáng toả (bloom), đèn pha quét trời, chùa tháp mái cong, cụm tháp vòm củ hành, đu quay băng, máng trượt dài, pháo hoa.
import type { DuoCfg, F } from './Duo';
import { bake, circ, ell, glow, line, poly, R, star, type Ctx } from '../lib/canvasArt';
import { fireworks, mix, rr } from './duoSky';

const W = 320, H = 180, Z = 2, TAU = Math.PI * 2, G = 134;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease3 = (v: number) => v * v * (1.4 - 0.4 * v);
const IMS = 64000, IFW = 40000;
const HUES = ['#2aa8ff', '#8a5aff', '#ff4ab8', '#2affb0', '#ffc83a', '#3a6aff'];
const hueAt = (t: number, k: number) => { const u = ((t * 0.12 + k * 0.9) % HUES.length + HUES.length) % HUES.length, i = Math.floor(u), q = u - i; return mix(HUES[i], HUES[(i + 1) % HUES.length], q * q * (3 - 2 * q)); };

/** tường băng: từng khối trong suốt sáng tối khác nhau, mạch ghép, mép bắt sáng */
function iceWall(c: Ctx, x: number, y: number, w: number, h: number, rnd: () => number, bw = 6, bh = 3.5) {
  for (let yy = y, row = 0; yy < y + h; yy += bh, row++) for (let xx = x - (row % 2) * bw / 2; xx < x + w; xx += bw) {
    const x0 = Math.max(x, xx), x1 = Math.min(x + w, xx + bw), hh = Math.min(bh, y + h - yy); if (x1 <= x0) continue;
    const a = 0.35 + rnd() * 0.5; c.globalAlpha = a; R(c, x0, yy, x1 - x0, hh, rnd() < 0.15 ? '#ffffff' : '#a8d0ec'); c.globalAlpha = 1;
    R(c, x0, yy, x1 - x0, 0.4, '#f4fcff'); R(c, x0, yy, 0.4, hh, '#d8eefc'); if (rnd() < 0.12) R(c, x0 + 1, yy + 1, (x1 - x0) * 0.5, 0.5, '#ffffff');
  }
}
const crenel = (c: Ctx, x: number, y: number, w: number) => { for (let xx = x; xx < x + w - 1; xx += 4) R(c, xx, y - 2.5, 2.5, 2.5, '#f0faff'); };
const archWin = (c: Ctx, x: number, y: number, w: number, h: number) => { R(c, x, y + w / 2, w, h - w / 2, '#ffffff'); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.fill(); };
const onion = (c: Ctx, x: number, y: number, r: number) => { ell(c, x, y, r, r * 0.9, '#f4fcff'); poly(c, [x - r * 0.55, y - r * 0.55, x, y - r * 2.1, x + r * 0.55, y - r * 0.55], '#f4fcff'); ell(c, x - r * 0.35, y - r * 0.2, r * 0.25, r * 0.5, '#ffffff'); R(c, x - 0.3, y - r * 2.6, 0.6, r * 0.6, '#ffffff'); };
/** mái cong kiểu chùa tháp */
const eave = (c: Ctx, x: number, y: number, w: number) => { poly(c, [x - w / 2 - 4, y - 1, x - w / 2 - 6, y - 4, x - w / 2 + 2, y - 3, x + w / 2 - 2, y - 3, x + w / 2 + 6, y - 4, x + w / 2 + 4, y - 1], '#f4fcff'); R(c, x - w / 2 - 3, y - 1, w + 6, 1, '#ffffff'); };

/** toàn bộ công trình băng vẽ bằng màu băng trắng — đèn màu nhuộm lên mỗi khung (source-atop) */
const iceCity = () => bake('duo:icecity2', W, H, (c, rnd) => {
  // dãy công trình băng xa mờ
  c.globalAlpha = 0.55; for (let x = -4; x < W;) { const w = 10 + rnd() * 14, h = 18 + rnd() * 26; iceWall(c, x, G - 14 - h, w, h, rnd, 4, 2.5); if (rnd() < 0.5) onion(c, x + w / 2, G - 14 - h - 3, w * 0.3); else poly(c, [x, G - 14 - h, x + w / 2, G - 26 - h, x + w, G - 14 - h], '#e8f8ff'); x += w + 2 + rnd() * 6; } c.globalAlpha = 1;
  // chùa tháp băng 5 tầng (trái)
  { const x = 70; for (let k = 0; k < 5; k++) { const w = 28 - k * 4, b = G - k * 13; iceWall(c, x - w / 2, b - 11, w, 11, rnd, 5, 3); archWin(c, x - 2, b - 9, 4, 6); eave(c, x, b - 11, w); } R(c, x - 0.6, G - 78, 1.2, 12, '#ffffff'); for (let k = 0; k < 4; k++) circ(c, x, G - 70 - k * 2.6, 1.4 - k * 0.2, '#ffffff'); }
  // cụm tháp vòm củ hành (phải)
  for (const [x, w, h] of [[236, 14, 52], [252, 18, 70], [270, 13, 46]] as const) { iceWall(c, x - w / 2, G - h, w, h, rnd, 5, 3); crenel(c, x - w / 2, G - h, w); for (let k = 0; k < 3; k++) archWin(c, x - 2, G - h + 8 + k * 13, 4, 7); onion(c, x, G - h - w * 0.45, w * 0.55); }
  // cung điện chính nhiều tầng + cổng vòm lớn + tháp góc
  { const x = 160;
    iceWall(c, x - 52, G - 36, 104, 36, rnd); crenel(c, x - 52, G - 36, 104);
    for (let k = 0; k < 8; k++) if (k < 3 || k > 4) archWin(c, x - 46 + k * 12, G - 30, 5, 9);
    iceWall(c, x - 38, G - 60, 76, 24, rnd); crenel(c, x - 38, G - 60, 76); for (let k = 0; k < 6; k++) archWin(c, x - 32 + k * 12, G - 55, 4.5, 8);
    iceWall(c, x - 24, G - 82, 48, 22, rnd); crenel(c, x - 24, G - 82, 48); for (let k = 0; k < 4; k++) archWin(c, x - 18 + k * 11, G - 77, 4, 8);
    iceWall(c, x - 10, G - 104, 20, 22, rnd, 5, 3); archWin(c, x - 3, G - 99, 6, 12); onion(c, x, G - 112, 11);
    for (const dx of [-56, 52]) { iceWall(c, x + dx, G - 66, 12, 66, rnd, 4, 3); poly(c, [x + dx - 1, G - 66, x + dx + 6, G - 84, x + dx + 13, G - 66], '#f0faff'); for (let k = 0; k < 4; k++) archWin(c, x + dx + 4, G - 58 + k * 13, 4, 6); }
    // cổng vòm tối để đèn bên trong toả ra
    R(c, x - 10, G - 24, 20, 24, '#0a1838'); c.fillStyle = '#0a1838'; c.beginPath(); c.arc(x, G - 24, 10, Math.PI, 0); c.fill(); }
  // tường băng thấp phía trước có lỗ châu mai
  iceWall(c, 0, G - 2, 140, 8, rnd, 6, 4); iceWall(c, 180, G - 2, 140, 8, rnd, 6, 4); crenel(c, 0, G - 2, 140); crenel(c, 180, G - 2, 140);
  // tháp máng trượt (phải ngoài)
  iceWall(c, 294, G - 72, 14, 72, rnd, 4, 3); crenel(c, 294, G - 72, 14);
});
let off: HTMLCanvasElement | null = null, small: HTMLCanvasElement | null = null;
/** công trình băng nhuộm đèn màu đổi dần + quầng sáng toả (vẽ nhỏ rồi phóng to = bloom nhẹ) */
function litCity(c: Ctx, t: number) {
  if (!off) { off = document.createElement('canvas'); off.width = W * Z; off.height = H * Z; small = document.createElement('canvas'); small.width = W / 4; small.height = H / 4; }
  const o = off.getContext('2d')!; o.setTransform(Z, 0, 0, Z, 0, 0); o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, W, H); o.imageSmoothingEnabled = false;
  o.drawImage(iceCity(), 0, 0, W, H);
  o.globalCompositeOperation = 'source-atop';
  const gx = o.createLinearGradient(0, 0, W, 0); [[0, 0], [0.22, 1], [0.38, 2], [0.5, 3], [0.62, 2], [0.78, 4], [0.95, 5], [1, 0]].forEach(([u, k]) => gx.addColorStop(u, hueAt(t, k))); o.globalAlpha = 0.62; o.fillStyle = gx; o.fillRect(0, 0, W, H);
  const gy = o.createLinearGradient(0, 20, 0, G); gy.addColorStop(0, '#00000000'); gy.addColorStop(1, '#ffffff'); o.globalAlpha = 0.12; o.fillStyle = gy; o.fillRect(0, 0, W, H);
  o.globalAlpha = 1; o.globalCompositeOperation = 'source-over';
  c.drawImage(off, 0, 0, W, H);
  const s = small!.getContext('2d')!; s.clearRect(0, 0, W / 4, H / 4); s.imageSmoothingEnabled = true; s.drawImage(off, 0, 0, W / 4, H / 4);
  c.save(); c.imageSmoothingEnabled = true; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28; c.drawImage(small!, -3, -3, W + 6, H + 6); c.globalAlpha = 0.16; c.drawImage(small!, -10, -10, W + 20, H + 20); c.restore();
}
function drawIce(f: F) {
  const { c, el, t } = f, tt = t + f.taps.filter(x => x.id === 'color').length * 2.5;
  const sky = c.createLinearGradient(0, 0, 0, G); sky.addColorStop(0, '#01020e'); sky.addColorStop(0.6, '#0a1236'); sky.addColorStop(1, '#1a1a48'); c.fillStyle = sky; c.fillRect(0, 0, W, G);
  for (let k = 0; k < 90; k++) { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + rr(k, 3)) + k)); R(c, rr(k, 1) * W, rr(k, 2) * 90, 0.5, 0.5, '#ffffff'); c.globalAlpha = 1; }
  // đèn pha quét trời
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 4; k++) { const x = 60 + k * 70, a = -Math.PI / 2 + Math.sin(t * 0.35 + k * 1.7) * 0.5, col = hueAt(tt, k + 2); const g = c.createLinearGradient(x, G, x + Math.cos(a) * 200, G + Math.sin(a) * 200); g.addColorStop(0, col + '50'); g.addColorStop(1, col + '00'); c.fillStyle = g; c.beginPath(); c.moveTo(x - 1, G - 4); c.lineTo(x + Math.cos(a - 0.05) * 220, G - 4 + Math.sin(a - 0.05) * 220); c.lineTo(x + Math.cos(a + 0.05) * 220, G - 4 + Math.sin(a + 0.05) * 220); c.lineTo(x + 1, G - 4); c.fill(); }
  c.restore();
  fireworks(c, el, IFW, 700, [20, 4, 280, 34], 9);
  // đu quay băng phát sáng (trái, phía sau)
  { const cx = 18, cy = 70, r = 34, a0 = t * 0.12; c.strokeStyle = hueAt(tt, 3) + 'c0'; c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); glow(c, cx, cy, r + 8, hueAt(tt, 3), 0.2);
    for (let k = 0; k < 12; k++) { const a = a0 + k * TAU / 12, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; line(c, cx, cy, x, y, 0.3, '#ffffff60'); R(c, x - 1.6, y, 3.2, 2.6, hueAt(tt, k)); glow(c, x, y + 1, 4, hueAt(tt, k), 0.6); } line(c, cx, cy, cx - 10, G, 0.8, '#bfe0f4'); line(c, cx, cy, cx + 12, G, 0.8, '#bfe0f4'); }
  litCity(c, tt);
  // đèn sáng trong cửa sổ băng nhấp nháy
  
  // ánh vàng ấm từ cổng vòm
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 160, G - 12, 26, '#ffd890', 0.6 + 0.1 * Math.sin(t * 3)); c.restore();
  // nền tuyết loang màu đèn
  const sn = c.createLinearGradient(0, G, 0, H); sn.addColorStop(0, '#c8d8f0'); sn.addColorStop(1, '#eef4fc'); c.fillStyle = sn; c.fillRect(0, G + 6, W, H - G - 6);
  c.save(); c.globalCompositeOperation = 'source-atop'; for (let k = 0; k < 7; k++) { const x = 20 + k * 46; c.globalAlpha = 0.35; ell(c, x, G + 14, 38, 8, hueAt(tt, k)); } c.restore(); c.globalAlpha = 1;
  for (let k = 0; k < 60; k++) R(c, rr(k, 6) * W, G + 8 + rr(k, 7) * 40, 4 + rr(k, 8) * 8, 0.4, '#ffffff');
  // tượng tuyết: gấu trắng, thiên nga
  { const x = 30, y = G + 24; ell(c, x, y, 13, 7, '#f6faff'); ell(c, x + 2, y + 2, 11, 4, '#d8e4f4'); circ(c, x - 10, y - 6, 6, '#f6faff'); circ(c, x - 14, y - 11, 2, '#f6faff'); circ(c, x - 7, y - 11, 2, '#f6faff'); R(c, x - 13, y - 7, 1, 1, '#2a3a5a'); R(c, x - 9, y - 7, 1, 1, '#2a3a5a'); }
  { const x = 292, y = G + 26; ell(c, x, y, 10, 5, '#f6faff'); c.strokeStyle = '#f6faff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 6, y - 2); c.bezierCurveTo(x - 12, y - 12, x - 2, y - 18, x - 8, y - 18); c.stroke(); poly(c, [x + 2, y - 3, x + 14, y - 10, x + 10, y - 1], '#e8f0fc'); }
  // đèn lồng băng dọc lối đi
  for (let k = 0; k < 8; k++) { const x = 52 + k * 31, y = G + 32 + (k % 2) * 4, col = hueAt(tt, k); glow(c, x, y - 4, 11, col, 0.55); R(c, x - 2.5, y - 8, 5, 8, mix(col, '#ffffff', 0.55)); R(c, x - 2.5, y - 8, 5, 0.6, '#ffffff'); R(c, x - 0.5, y - 6, 1, 4, '#fff6c0'); }
  // máng trượt băng dài từ tháp phải xuống — người trượt nhỏ xíu nhìn từ xa
  const sl = (u: number): [number, number] => [300 - u * 120, G - 70 + u * 64 + Math.sin(u * 7) * 3 - Math.sin(u * Math.PI) * 6];
  // cột đỡ băng
  for (let k = 1; k < 10; k++) { const [x, y] = sl(k / 10); R(c, x - 0.6, y + 2, 1.2, G - y - 2, '#bfe0f4a0'); R(c, x - 0.6, y + 2, 0.4, G - y - 2, '#ffffff'); }
  // lòng máng băng: thành ngoài, lòng trong, thành trong, viền đèn neon
  const path = (dy: number) => { c.beginPath(); for (let k = 0; k <= 40; k++) { const [x, y] = sl(k / 40); if (k) c.lineTo(x, y + dy); else c.moveTo(x, y + dy); } };
  c.lineCap = 'round'; c.lineJoin = 'round';
  path(1.6); c.strokeStyle = '#8ac8f0a0'; c.lineWidth = 3.6; c.stroke();
  path(0.6); c.strokeStyle = '#e8faffd0'; c.lineWidth = 2.6; c.stroke();
  path(0); c.strokeStyle = '#ffffff'; c.lineWidth = 0.5; c.stroke();
  path(2.6); c.strokeStyle = hueAt(tt, 1); c.lineWidth = 0.6; c.stroke();
  c.save(); c.globalCompositeOperation = 'lighter'; path(2.6); c.strokeStyle = hueAt(tt, 1) + '60'; c.lineWidth = 3; c.stroke(); c.restore();
  c.lineCap = 'butt'; c.lineJoin = 'miter';
  for (let k = 0; k <= 16; k++) { const [x, y] = sl(k / 16), on = Math.floor(t * 6 - k) % 4 === 0; glow(c, x, y + 2.6, on ? 6 : 3, hueAt(tt, k), on ? 0.9 : 0.5); }
  // bục xuất phát trên đỉnh tháp + bậc thang
  { const [x, y] = sl(0); R(c, x - 5, y - 1, 10, 2, '#f0faff'); for (let k = 0; k < 9; k++) R(c, x + 6, y + 2 + k * 7, 4, 1, '#e8f6ff'); }
  for (let k = 0; k < 3; k++) { const u = ((t * 0.18 + k / 3) % 1), [x, y] = sl(u); R(c, x - 1, y - 3, 2, 2.5, ['#e8443a', '#3a6ad8', '#f6c445'][k]); circ(c, x, y - 4, 0.9, '#f4d0b0'); }
  // người dạo lễ hội (bóng nhỏ)
  for (let k = 0; k < 10; k++) { const x = ((k * 37 + t * (2 + k % 3)) % (W + 20)) - 10, y = G + 16 + (k % 4) * 5; R(c, x - 1, y - 5, 2, 4.5, ['#c8303a', '#3a5a8a', '#f6c445', '#8a4a8a', '#2a2a3a'][k % 5]); circ(c, x, y - 6, 1, '#f4d0b0'); R(c, x - 1.1, y - 7.4, 2.2, 1, '#ffffff'); }
  // hai đứa: đứng ngắm (nhỏ, nhìn từ xa) hoặc trượt máng băng
  const slideAt = f.taps.filter(x => x.id === 'slide').pop(), sq = slideAt ? (f.now - slideAt.at) / 5000 : 2;
  f.seats.forEach((p, i) => { if (!p) return;
    if (sq < 1) { const u = ease3(clamp(sq * 1.12 - i * 0.08)), [x, y] = sl(u), im = p.img('sit', 0, 'side');
      // ngồi trên xe trượt nhỏ, mặt quay theo hướng trượt (xuống bên trái)
      f.put(im, x - im.width * 0.165, y - im.height * 0.33 + 0.4, 0.33, true); R(c, x - 3.4, y + 0.2, 7, 1.2, '#e8443a'); R(c, x - 3.8, y + 1.2, 7.8, 0.4, '#c8c8d8'); R(c, x - 4.2, y + 0.4, 0.6, 1, '#c8c8d8');
      if (u > 0.04 && u < 0.99) for (let k = 0; k < 6; k++) { c.globalAlpha = 1 - k / 6; R(c, x + 4 + k * 2.2, y + 0.6 - k * 0.5, 0.7, 0.7, '#ffffff'); } c.globalAlpha = 1; return; }
    const x = 150 + i * 18, im = el > IFW ? p.img('idle', 0, 'back') : p.img('idle'); f.put(im, x - im.width * 0.25, H - 6 - im.height * 0.5, 0.5); });
  // tuyết lất phất + hơi lạnh mờ
  for (let k = 0; k < 70; k++) { const sp = 5 + rr(k, 1) * 7, x = (rr(k, 2) * W + Math.sin(t * 0.7 + k) * 6) % W, y = (rr(k, 3) * H + t * sp) % H; circ(c, x, y, 0.35 + rr(k, 4) * 0.5, '#ffffff'); }
  if (el < 1500) { c.globalAlpha = 1 - el / 1500; c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  void star;
}
export const icecastle: DuoCfg = {
  title: 'Lâu đài băng Cáp Nhĩ Tân', ms: IMS, join: 12000, price: 25, gift: { item: 'hb_ice_lantern' },
  ask: '🏰 Đi lễ hội băng tuyết Cáp Nhĩ Tân ngắm lâu đài băng', joinAsk: '🏰 Đi lễ hội băng cùng người ấy', invite: '🏰 Người ấy rủ đi ngắm lâu đài băng Cáp Nhĩ Tân', yes: 'Đi cùng!', late: 'Lần sau đi cùng nha',
  buttons: [{ id: 'slide', label: '🛷 Trượt máng băng', from: 2000, to: IMS }, { id: 'color', label: '🌈 Đổi màu đèn', from: 2000, to: IMS }, { id: 'photo', label: '📸 Chụp', from: 2000, to: IMS }],
  caption: el => el < 4000 ? '❄️ Lễ hội băng tuyết Cáp Nhĩ Tân — âm 20 độ mà lung linh quá!' : el < 22000 ? '🏰 Cung điện xây từ nghìn khối băng, đèn chiếu từ bên trong' : el < IFW ? '🛷 Thử máng trượt băng dài nhất lễ hội đi!' : el < IMS ? '🎆 Pháo hoa nổ trên lâu đài băng!' : '❄️ Đêm băng tuyết thần tiên',
  draw: drawIce, snap: [IFW + 8000], endTitle: '🏰 Đêm lâu đài băng Cáp Nhĩ Tân', endNote: 'Một chiếc đèn lồng băng nhỏ đã vào túi đồ — tối lên đổi màu lung linh',
};
