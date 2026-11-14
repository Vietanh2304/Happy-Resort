// Lễ hội băng tuyết Cáp Nhĩ Tân: cung điện xây từ nghìn khối băng trong suốt, đèn chiếu từ bên trong đổi màu,
// quầng sáng toả (bloom), đèn pha quét trời, chùa tháp mái cong, cụm tháp vòm củ hành, đu quay băng, máng trượt dài, pháo hoa.
import type { DuoCfg, F } from './Duo';
import { bake, circ, ell, glow, heart, line, poly, R, star, twinkle, type Ctx } from '../lib/canvasArt';
import { fireworks, mix, rr } from './duoSky';

const W = 320, H = 180, Z = 2, TAU = Math.PI * 2, G = 134;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease3 = (v: number) => v * v * (1.4 - 0.4 * v);
const FY = 152; // hàng chân nhân vật (trên thanh nút)
const IMS = 96000, IFW = 70000, SL0 = 4000, SL1 = 20000, CARVE = 25000, DANCE = 46000;
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
/** trái tim băng khắc tên: khung khối băng trong suốt, lòng tim đổi màu, chữ khắc phát sáng */
function iceHeart(f: F, tt: number) {
  const { c, t } = f, x = 262, y = G + 2, r = 17, col = hueAt(tt, 4);
  const path = (k: number) => { c.beginPath(); c.moveTo(x, y + r * 0.95 * k); c.bezierCurveTo(x - r * 1.5 * k, y - r * 0.1 * k, x - r * 0.95 * k, y - r * 1.25 * k, x, y - r * 0.55 * k); c.bezierCurveTo(x + r * 0.95 * k, y - r * 1.25 * k, x + r * 1.5 * k, y - r * 0.1 * k, x, y + r * 0.95 * k); };
  R(c, x - 12, y + r * 0.9, 24, 5, '#dceefc'); R(c, x - 12, y + r * 0.9, 24, 0.8, '#ffffff'); R(c, x - 9, y + r * 0.9 + 5, 18, 3, '#c8e0f4');
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x, y, r * 2.2, col, 0.35 + 0.1 * Math.sin(t * 2)); c.restore();
  path(1); c.fillStyle = mix(col, '#e8f8ff', 0.6) + 'b0'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#f0fbff'; c.stroke(); c.lineWidth = 0.6; c.strokeStyle = col; c.stroke();
  path(0.62); c.fillStyle = mix(col, '#ffffff', 0.3) + '90'; c.fill();
  for (let k = 0; k < 5; k++) { const a = t * 0.8 + k * 1.3; R(c, x - 10 + ((a * 7) % 20), y - 8 + k * 3, 1.2, 0.5, '#ffffff'); }
  const names = [f.text(0), f.text(1)].filter(Boolean), carve = f.last(0, 'carve') < 2500 || f.last(1, 'carve') < 2500;
  c.save(); c.font = 'bold 4px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const wrap = (n: string) => { const out: string[] = []; let cur = ''; for (const w of n.slice(0, 30).split(' ')) { if (cur && (cur + ' ' + w).length > 10) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } if (cur) out.push(cur); return out; };
  const lines = names.length ? [...new Set(names)].flatMap(wrap).slice(0, 4) : ['♥'];
  lines.forEach((n, i) => { const yy = y - 3 + (i - (lines.length - 1) / 2) * 4.6; c.shadowColor = col; c.shadowBlur = 4; c.fillStyle = '#ffffff'; c.fillText(n, x, yy, 24); });
  c.restore();
  if (carve) for (let k = 0; k < 10; k++) { const a = k * 0.63 + t * 3, d = 6 + (t * 20 + k * 3) % 14; twinkle(c, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 1.4, '#ffffff'); }
}
/** sân băng nhảy: mặt băng bóng loáng in đèn màu */
function rink(c: Ctx, t: number, tt: number, a: number) {
  if (a <= 0) return;
  c.globalAlpha = a; ell(c, 160, FY - 2, 76, 13, '#dceefc'); ell(c, 160, FY - 2, 72, 11, '#eef8ff');
  c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const x = 160 + Math.cos(t * 0.5 + k) * 50; ell(c, x, FY - 2 + Math.sin(k) * 4, 14, 3, hueAt(tt, k) + '40'); } c.restore();
  for (let k = 0; k < 12; k++) { const x = 100 + rr(k, 21) * 120; R(c, x, FY - 6 + rr(k, 22) * 8, 3 + rr(k, 23) * 6, 0.3, '#ffffff'); }
  c.globalAlpha = 1;
}
/** xe trượt tuần lộc: hai chú tuần lộc phi, chuông vàng lấp lánh, xe đỏ viền vàng */
function sleigh(f: F, x: number, y: number, run: boolean, ring: number) {
  const { c, t } = f, g = run ? Math.sin(t * 12) : 0;
  for (let d = 0; d < 2; d++) { const rx = x + 30 + d * 16, ry = y - 6 + (run ? Math.abs(Math.sin(t * 12 + d)) * -1.5 : 0);
    for (let l = 0; l < 4; l++) { const lx = rx - 4 + l * 2.6 + (l % 2 ? g : -g) * 1.2; line(c, lx, ry + 2, lx + (l % 2 ? g : -g) * 1.5, ry + 8, 0.9, '#6a4a2a'); }
    ell(c, rx, ry, 6, 3.2, '#9a6a3a'); ell(c, rx, ry + 1, 4.5, 1.8, '#c8a070'); R(c, rx + 3.5, ry - 6, 2.2, 5, '#9a6a3a'); ell(c, rx + 6.5, ry - 6.5, 3, 2, '#9a6a3a'); circ(c, rx + 9.2, ry - 6.5, 0.9, d ? '#2a1a1a' : '#ff3a3a');
    line(c, rx + 5, ry - 8, rx + 3, ry - 13, 0.6, '#e8d0a0'); line(c, rx + 4, ry - 11, rx + 1.5, ry - 12, 0.5, '#e8d0a0'); line(c, rx + 6, ry - 8, rx + 8, ry - 13, 0.6, '#e8d0a0'); line(c, rx + 7.3, ry - 11, rx + 9.5, ry - 12, 0.5, '#e8d0a0');
    R(c, rx - 4, ry - 2, 8, 1, '#c8303a'); for (let b = 0; b < 3; b++) { circ(c, rx - 3 + b * 3, ry - 0.8, 0.8, '#ffd24a'); if (ring) glow(c, rx - 3 + b * 3, ry - 0.8, 3, '#ffe08a', 0.8); } }
  line(c, x + 14, y - 5, x + 26, y - 6, 0.5, '#e8c070'); line(c, x + 14, y - 3, x + 42, y - 5, 0.5, '#e8c070');
  c.save(); c.globalCompositeOperation = 'lighter'; glow(c, x, y - 6, 22, '#ffd890', 0.35 + ring * 0.4); c.restore();
}
function sleighFront(c: Ctx, x: number, y: number) {
  // thân xe đỏ uốn cong + viền vàng + thanh trượt cuộn
  poly(c, [x - 16, y - 12, x - 13, y - 2, x + 10, y - 2, x + 15, y - 8, x + 13, y - 11, x + 8, y - 7, x - 10, y - 7], '#c8203a');
  R(c, x - 12, y - 7.5, 21, 0.8, '#ffd24a'); R(c, x - 13, y - 3, 23, 0.6, '#ffd24a'); circ(c, x + 13.5, y - 10.5, 1.4, '#ffd24a'); circ(c, x - 15.5, y - 11.5, 1.4, '#ffd24a');
  for (let k = 0; k < 4; k++) heart(c, x - 7 + k * 4.5, y - 5, 0.9, '#ffd24a');
  c.strokeStyle = '#e8d8a0'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 16, y + 1); c.lineTo(x + 14, y + 1); c.quadraticCurveTo(x + 19, y + 1, x + 18, y - 3); c.stroke();
  R(c, x - 10, y - 2, 0.8, 3, '#e8d8a0'); R(c, x + 8, y - 2, 0.8, 3, '#e8d8a0');
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
  { const x = 300, y = G + 40; ell(c, x, y, 10, 5, '#f6faff'); c.strokeStyle = '#f6faff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 6, y - 2); c.bezierCurveTo(x - 12, y - 12, x - 2, y - 18, x - 8, y - 18); c.stroke(); poly(c, [x + 2, y - 3, x + 14, y - 10, x + 10, y - 1], '#e8f0fc'); }
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
  iceHeart(f, tt);
  rink(c, t, tt, clamp((el - DANCE + 2000) / 2000));
  // hai đứa: ngồi xe tuần lộc → khắc tên / trượt máng → khiêu vũ trên sân băng → ôm hôn dưới pháo hoa
  const slideAt = f.taps.filter(x => x.id === 'slide').pop(), sq = slideAt ? (f.now - slideAt.at) / 5000 : 2;
  const ring = f.taps.filter(x => x.id === 'bell' && f.now - x.at < 1500).length ? 1 : 0;
  if (el < SL1 + 5000) {
    const u = clamp((el - SL0) / (SL1 - SL0)), sx = el < SL1 ? -70 + (1 - (1 - u) ** 2) * 220 : 150 + ((el - SL1) / 5000) ** 2 * 260, sy = FY, run = el < SL1 - 300 || el > SL1 + 400;
    sleigh(f, sx, sy, run, ring);
    if (el < SL1) f.seats.forEach((p, i) => { if (!p) return; const im = ring ? p.img('act', 12) : p.img('idle'); f.put(im, sx - 9 + i * 10 - im.width * 0.25, sy - 6 - im.height * 0.5 + 6, 0.5); });
    sleighFront(c, sx, sy);
    if (ring) for (let k = 0; k < 14; k++) { const a = k * 0.45 + t, d = 10 + (t * 25 + k * 4) % 24; twinkle(c, sx + 36 + Math.cos(a) * d, sy - 12 + Math.sin(a) * d * 0.5, 1.2, '#ffe08a'); }
    if (el < SL1 - 300) for (let k = 0; k < 8; k++) { c.globalAlpha = 1 - k / 8; R(c, sx - 18 - k * 4, sy + 0.5 - (k % 2), 2, 0.6, '#ffffff'); } c.globalAlpha = 1;
  }
  const dance = el >= DANCE && el < IFW, spin = f.taps.filter(x => x.id === 'dance' && f.now - x.at < 2500).length;
  const kissing = el >= IFW && (f.last(0, 'kiss') < 3500 || f.last(1, 'kiss') < 3500);
  f.seats.forEach((p, i) => { if (!p) return;
    if (el < SL1) return;
    if (sq < 1 && el < DANCE) { const u = ease3(clamp(sq * 1.12 - i * 0.08)), [x, y] = sl(u), im = p.img('sit', 0, 'side');
      // ngồi trên xe trượt nhỏ, mặt quay theo hướng trượt (xuống bên trái)
      f.put(im, x - im.width * 0.165, y - im.height * 0.33 + 0.4, 0.33, true); R(c, x - 3.4, y + 0.2, 7, 1.2, '#e8443a'); R(c, x - 3.8, y + 1.2, 7.8, 0.4, '#c8c8d8'); R(c, x - 4.2, y + 0.4, 0.6, 1, '#c8c8d8');
      if (u > 0.04 && u < 0.99) for (let k = 0; k < 6; k++) { c.globalAlpha = 1 - k / 6; R(c, x + 4 + k * 2.2, y + 0.6 - k * 0.5, 0.7, 0.7, '#ffffff'); } c.globalAlpha = 1; return; }
    if (dance) { const sway = Math.sin(t * 1.3) * 7, x = 160 + (i ? 8 : -8) + sway, y = FY + Math.sin(t * 2.6 + i) * 0.6, fr = Math.floor(t * 8 + i * 2) % 4, v = spin ? (['front', 'side', 'back', 'side'] as const)[fr] : 'side';
      const im = p.img('dance', Math.floor(t * 5) % 4, v); f.put(im, x - im.width * 0.25, y - im.height * 0.5, 0.5, v === 'side' && (spin ? fr === 3 : i === 1)); const a = t * 6 + i * 3;
      if (spin) for (let k = 0; k < 3; k++) { const b = a * 2 + k * 2.1; twinkle(c, x + Math.cos(b) * 6, y - 10 + Math.sin(b) * 4, 1.2, hueAt(tt, k)); }
      return; }
    if (el >= IFW) { const x = 154 + i * 12, im = kissing ? p.img('kiss', 0, 'side') : p.img('idle', 0, 'back'); f.put(im, x - im.width * 0.25, FY - im.height * 0.5, 0.5, kissing && i === 1); return; }
    const x = 150 + i * 18, im = p.img('idle'); f.put(im, x - im.width * 0.25, FY - im.height * 0.5, 0.5); });
  if (dance && spin) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = hueAt(tt, 2) + '80'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(160 + Math.sin(t * 1.3) * 7, FY, 20, 4, 0, 0, TAU); c.stroke(); c.restore(); }
  if (kissing) for (let k = 0; k < 6; k++) { const q = (t * 0.6 + k / 6) % 1; c.globalAlpha = 1 - q; heart(c, 160 + Math.sin(k * 2.3 + q * 5) * 8, FY - 24 - q * 34, 1.4 + (k % 2) * 0.8, k % 2 ? '#ff8ab0' : '#ff4a7a'); } c.globalAlpha = 1;
  // tuyết lất phất + hơi lạnh mờ
  for (let k = 0; k < 70; k++) { const sp = 5 + rr(k, 1) * 7, x = (rr(k, 2) * W + Math.sin(t * 0.7 + k) * 6) % W, y = (rr(k, 3) * H + t * sp) % H; circ(c, x, y, 0.35 + rr(k, 4) * 0.5, '#ffffff'); }
  if (el < 1500) { c.globalAlpha = 1 - el / 1500; c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  void star;
}
export const icecastle: DuoCfg = {
  title: 'Lâu đài băng Cáp Nhĩ Tân', ms: IMS, join: SL1, price: 25, gift: { item: 'hb_ice_lantern' },
  ask: '🏰 Đi lễ hội băng tuyết Cáp Nhĩ Tân: xe tuần lộc, khắc tên lên tim băng, khiêu vũ trên sân băng, pháo hoa', joinAsk: '🏰 Đi lễ hội băng cùng người ấy', invite: '🏰 Người ấy rủ đi lễ hội lâu đài băng Cáp Nhĩ Tân', yes: 'Lên xe tuần lộc!', late: 'Lần sau đi cùng nha',
  buttons: [
    { id: 'bell', label: '🔔 Rung chuông', from: SL0, to: SL1 },
    { id: 'carve', label: '✍️ Khắc lên tim băng', from: SL1 + 1500, to: DANCE, prompt: 'Khắc gì lên trái tim băng? (tên hai đứa, lời hẹn… ngắn thôi)' },
    { id: 'slide', label: '🛷 Trượt máng băng', from: SL1 + 1500, to: DANCE },
    { id: 'dance', label: '💃 Xoay vòng', from: DANCE, to: IFW },
    { id: 'kiss', label: '💋 Hôn', from: IFW, to: IMS },
    { id: 'color', label: '🌈 Đổi màu đèn', from: SL0, to: IMS },
    { id: 'photo', label: '📸 Chụp', from: SL0, to: IMS },
  ],
  caption: el => el < SL0 ? '❄️ Lễ hội băng tuyết Cáp Nhĩ Tân — âm 20 độ mà lung linh quá!' : el < SL1 ? '🦌 Xe tuần lộc chở hai đứa vào cổng lâu đài — rung chuông lên nào!' : el < CARVE ? '🏰 Xuống xe rồi! Cung điện xây từ nghìn khối băng, đèn chiếu từ bên trong' : el < DANCE ? '💎 Khắc tên lên trái tim băng, hoặc thử máng trượt dài nhất lễ hội' : el < IFW ? '💃 Nhạc valse vang lên — nắm tay khiêu vũ trên sân băng' : el < IMS ? '🎆 Pháo hoa nổ rực trên lâu đài băng!' : '❄️ Đêm băng tuyết thần tiên',
  draw: drawIce, snap: [12000, 36000, 56000, IFW + 10000], endTitle: '🏰 Đêm lâu đài băng Cáp Nhĩ Tân', endNote: 'Một chiếc đèn lồng băng nhỏ đã vào túi đồ — tối lên đổi màu lung linh',
};
