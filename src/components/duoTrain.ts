// Tàu đỏ xuyên dãy Alps: ga núi → đồng cỏ hồ ngọc + làng chalet → cầu cạn đá cong vắt qua hẻm vực
// → đường hầm → sông băng và đỉnh núi tuyết rực hồng lúc hoàng hôn → ga đỉnh núi. Hai đứa ngồi sau ô kính toa toàn cảnh.
import type { DuoCfg, F } from './Duo';
import { bake, circ, cloud, ell, glow, heart, line, poly, R, twinkle, type Ctx } from '../lib/canvasArt';
import { mix, rr } from './duoSky';

const W = 320, H = 180, RY = 152, K = 0.6;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const TB = 6000, TR = 66000, TMS = TB + TR + 5000;
// mốc trên quãng đường (0..1)
const Z_BRIDGE = [0.3, 0.52], Z_TUN = [0.55, 0.62], Z_ICE = 0.62;
const band = (s: number, a: number, b: number, f = 0.03) => clamp(Math.min((s - a) / f + 1, (b - s) / f + 1));
const grad = (c: Ctx, y0: number, y1: number, cols: string[], a = 1) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); c.globalAlpha = a; c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); c.globalAlpha = 1; };
const scroll = (c: Ctx, im: HTMLCanvasElement, off: number, y: number, a = 1) => { const w = im.width / 2, o = ((off % w) + w) % w; c.globalAlpha = a; c.drawImage(im, -o, y, w, im.height / 2); c.drawImage(im, w - o, y, w, im.height / 2); c.globalAlpha = 1; };

/** dãy núi tuyết: đỉnh nhọn hùng vĩ, sườn sáng / sườn tối, lưỡi sông băng; glow = ánh hồng hoàng hôn */
const peaks = (glow2: boolean, far: boolean) => bake(`train:peaks:${glow2}:${far}`, 640, 100, (c, rnd) => {
  const rock = far ? (glow2 ? '#8a6a9a' : '#7a8aa8') : (glow2 ? '#6a4a6a' : '#5a6a80'), dark = mix(rock, '#101830', 0.35);
  const snow = glow2 ? '#ffd0d8' : '#ffffff', snowS = glow2 ? '#c890b8' : '#c8d8ee';
  const tops = far ? [[40, 30], [130, 18], [215, 34], [300, 8], [400, 26], [480, 14], [575, 30]] : [[0, 46], [90, 30], [180, 46], [260, 4], [350, 40], [450, 24], [540, 44], [640, 46]];
  for (const [x, y] of tops) {
    const w = far ? 70 : 90 + rnd() * 30;
    poly(c, [x - w, 100, x - 4, y + 2, x, y, x + 3, y + 3, x + w, 100], rock);
    poly(c, [x, y, x + 3, y + 3, x + w, 100, x + w * 0.2, 100], dark);
    const sl = (100 - y) * (far ? 0.55 : 0.42);
    poly(c, [x - sl * 0.7, y + sl, x - 4, y + 2, x, y, x + 3, y + 3, x + sl * 0.75, y + sl * 0.9, x + sl * 0.35, y + sl * 0.75, x + sl * 0.1, y + sl * 1.05, x - sl * 0.25, y + sl * 0.8], snow);
    poly(c, [x, y, x + 3, y + 3, x + sl * 0.75, y + sl * 0.9, x + sl * 0.35, y + sl * 0.75], snowS);
    for (let k = 0; k < 4; k++) { const gx = x - sl * 0.5 + rnd() * sl, gy = y + sl * 0.9; poly(c, [gx - 2, gy, gx + 2, gy, gx + 1, gy + 8 + rnd() * 10, gx - 0.5, gy + 6], snow); }
  }
  if (!far) for (let k = 0; k < 60; k++) { const x = rnd() * 640, y = 60 + rnd() * 40; R(c, x, y, 2 + rnd() * 4, 0.6, mix(rock, '#ffffff', 0.25)); }
});
/** đồng cỏ + hồ ngọc + làng chalet + rừng thông (dải gần đường ray) */
const meadow = (glow2: boolean) => bake(`train:meadow:${glow2}`, 640, 80, (c, rnd) => {
  const tint = (col: string) => (glow2 ? mix(col, '#ff9a7a', 0.18) : col);
  R(c, 0, 0, 640, 14, tint('#3ac8c0')); for (let k = 0; k < 140; k++) R(c, rnd() * 640, 1 + rnd() * 12, 3 + rnd() * 8, 0.4, tint('#bff4ee'));
  R(c, 0, 14, 640, 40, tint('#7ac04a')); for (let k = 0; k < 700; k++) R(c, rnd() * 640, 14 + rnd() * 40, 1, 0.5, tint(rnd() < 0.5 ? '#5aa03a' : '#a8dc6a'));
  for (let k = 0; k < 220; k++) R(c, rnd() * 640, 22 + rnd() * 32, 0.8, 0.8, ['#ffffff', '#ffd84a', '#ff8ab0', '#b88aff', '#ff5a5a'][k % 5]);
  for (let k = 0; k < 12; k++) { // chalet gỗ ban công hoa đỏ
    const x = 20 + k * 52 + rnd() * 14, y = 24, w = 14 + rnd() * 6;
    R(c, x, y - 9, w, 9, tint('#a8683a')); R(c, x, y - 9, w, 1.5, tint('#ffffff')); for (let j = 0; j < 3; j++) R(c, x + 1, y - 7 + j * 2.5, w - 2, 0.4, tint('#7a4a2a'));
    poly(c, [x - 3, y - 9, x + w / 2, y - 16, x + w + 3, y - 9], tint('#5a3a2a')); poly(c, [x - 2, y - 9.5, x + w / 2, y - 15.5, x + w + 2, y - 9.5, x + w / 2, y - 13], '#ffffff');
    R(c, x + 2, y - 6, 3, 2.5, glow2 ? '#ffd890' : '#cfe8ff'); R(c, x + w - 5, y - 6, 3, 2.5, glow2 ? '#ffd890' : '#cfe8ff');
    R(c, x + 1, y - 3.6, w - 2, 1.2, tint('#e83a3a')); R(c, x + w / 2 - 1.5, y - 4, 3, 4, tint('#5a3a2a'));
  }
  { const x = 300; R(c, x - 6, 8, 12, 16, tint('#f4ece0')); poly(c, [x - 7, 8, x, -4, x + 7, 8], tint('#6a3a2a')); R(c, x - 1.5, 2, 3, 3, '#ffd24a'); circ(c, x, 12, 2, '#ffffff'); line(c, x, 12, x, 10.8, 0.4, '#2a2a2a'); }
  for (let k = 0; k < 40; k++) { const x = rnd() * 640, y = 18 + rnd() * 6, h = 8 + rnd() * 8; poly(c, [x - h * 0.35, y, x, y - h, x + h * 0.35, y], tint(rnd() < 0.5 ? '#2a5a3a' : '#3a6a3a')); }
  for (let k = 0; k < 8; k++) { const x = rnd() * 640, y = 30 + rnd() * 6; ell(c, x, y, 3.5, 2, '#ffffff'); R(c, x - 1, y - 0.5, 2, 1.5, '#5a3a2a'); ell(c, x + 3.5, y - 1, 1.5, 1.2, '#ffffff'); R(c, x - 2.5, y + 1.5, 0.6, 1.5, '#5a5a5a'); R(c, x + 1.8, y + 1.5, 0.6, 1.5, '#5a5a5a'); R(c, x + 2.6, y + 0.4, 0.8, 0.8, '#ffd24a'); }
});
/** hẻm vực sâu: vách đá hai bên, sông dưới đáy, thác nước */
const gorge = () => bake('train:gorge', 640, 90, (c, rnd) => {
  for (let x = 0; x < 640; x += 2) { const h = 30 + Math.sin(x * 0.03) * 12 + rnd() * 4; R(c, x, 90 - h - 40, 2, h + 40, x % 160 < 80 ? '#7a6a5a' : '#6a5a4a'); }
  R(c, 0, 72, 640, 18, '#2a8ab0'); for (let k = 0; k < 120; k++) R(c, rnd() * 640, 73 + rnd() * 16, 2 + rnd() * 6, 0.5, '#d8f4ff');
  for (let k = 0; k < 5; k++) { const x = 60 + k * 130; R(c, x, 20, 4, 54, '#d8f0ff'); for (let j = 0; j < 12; j++) R(c, x + rnd() * 4, 20 + rnd() * 54, 0.6, 4, '#ffffff'); ell(c, x + 2, 74, 7, 2.5, '#ffffff'); }
  for (let k = 0; k < 70; k++) { const x = rnd() * 640, y = 10 + rnd() * 40, h = 6 + rnd() * 8; poly(c, [x - h * 0.35, y, x, y - h, x + h * 0.35, y], rnd() < 0.5 ? '#2a5a3a' : '#3a6a40'); }
});
/** sông băng + sườn tuyết + thông phủ tuyết */
const glacier = () => bake('train:glacier', 640, 80, (c, rnd) => {
  R(c, 0, 0, 640, 80, '#f4f0f8'); R(c, 0, 0, 640, 6, '#dce8f4');
  for (let k = 0; k < 6; k++) { const x = k * 110 + rnd() * 20; poly(c, [x, 0, x + 60, 0, x + 80, 40, x + 30, 44], '#bfe4f4'); for (let j = 0; j < 6; j++) line(c, x + 20 + j * 8, 6 + j * 4, x + 30 + j * 8, 10 + j * 4, 0.6, '#7ab8d8'); }
  for (let k = 0; k < 60; k++) { const x = rnd() * 640, y = 30 + rnd() * 30, h = 8 + rnd() * 9; poly(c, [x - h * 0.35, y, x, y - h, x + h * 0.35, y], '#2a4a3a'); poly(c, [x - h * 0.25, y - h * 0.4, x, y - h, x + h * 0.25, y - h * 0.4], '#ffffff'); R(c, x - h * 0.3, y - 1, h * 0.6, 1, '#ffffff'); }
});

/** cầu cạn đá cong nhiều vòm (cuộn cùng đường ray) */
function viaduct(c: Ctx, wx: number, a: number, L: number, Rr: number) {
  if (a <= 0) return; c.globalAlpha = a;
  const span = Math.ceil((Rr - L) / 34 + 2) * 34;
  for (let k = 0; k < span / 34; k++) { const x = L + ((k * 34 - wx) % span + span) % span - 34;
    R(c, x, RY + 4, 34, 5, '#a89070'); R(c, x, RY + 4, 34, 1, '#c8b090');
    R(c, x + 2, RY + 9, 7, 60, '#988060'); R(c, x + 3, RY + 9, 2, 60, '#b8a080');
    c.fillStyle = '#988060'; c.beginPath(); c.moveTo(x + 9, RY + 9); c.lineTo(x + 34, RY + 9); c.lineTo(x + 34, RY + 22); c.arc(x + 21.5, RY + 22, 12.5, 0, Math.PI, true); c.fill();
    for (let j = 0; j < 8; j++) R(c, x + 2, RY + 12 + j * 7, 7, 0.4, '#7a6448'); }
  c.globalAlpha = 1;
}
/** cột điện treo dây phía trên tàu (cuộn nhanh nhất → cảm giác tốc độ) */
function catenary(c: Ctx, wx: number, dark: number, L: number, Rr: number) {
  const col = dark > 0.5 ? '#3a3a4a' : '#4a4a5a';
  line(c, L, RY - 33, Rr, RY - 33, 0.4, col);
  for (let k = 0; k < 7; k++) { const x = L + ((k * 90 - wx) % 630 + 630) % 630 - 60; R(c, x, RY - 40, 1.6, 44, col); R(c, x - 6, RY - 38, 14, 1, col); line(c, x - 4, RY - 37, x + 6, RY - 33, 0.4, col); }
}
/** đoàn tàu đỏ toa toàn cảnh: đầu máy + 2 toa, cửa kính cong lên mái; hai đứa ngồi ở toa giữa */
function train(f: F, inside: number, lean: number, choco: number) {
  const { c, t } = f, bob = Math.sin(t * 9) * 0.25, y = RY - 25 + bob;
  const car = (x: number, w: number, loco: boolean) => {
    R(c, x, y, w, 23, '#c8102e'); R(c, x, y + 19, w, 4, '#8a0a20'); R(c, x, y + 1, w, 1, '#e8445a');
    if (loco) { poly(c, [x + w, y, x + w + 7, y + 6, x + w + 7, y + 23, x + w, y + 23], '#c8102e'); R(c, x + w + 1, y + 7, 5, 6, '#2a3a4a'); circ(c, x + w + 5, y + 18, 1.2, '#fff6c0'); glow(c, x + w + 6, y + 18, 6, '#fff6c0', 0.5); R(c, x + 6, y - 6, 2, 6, '#3a3a4a'); line(c, x + 7, y - 6, x + 14, y - 8, 0.6, '#3a3a4a'); }
    if (!loco) { R(c, x + 2, y - 2, w - 4, 2, '#c8102e'); R(c, x + 3, y - 1.5, w - 6, 1, '#bfe4ff'); }
    R(c, x + 2, y + 15, w - 4, 1.2, '#ffffff'); R(c, x + 2, y + 16.6, w - 4, 0.6, '#ffd24a');
    for (let k = 0; k < 2; k++) { const wx2 = x + 6 + k * (w - 18); circ(c, wx2, y + 24, 2.8, '#2a2a32'); circ(c, wx2, y + 24, 1.2, '#7a7a8a'); const a = t * 14; line(c, wx2, y + 24, wx2 + Math.cos(a) * 2.4, y + 24 + Math.sin(a) * 2.4, 0.5, '#9a9aa8'); circ(c, wx2 + 6, y + 24, 2.8, '#2a2a32'); circ(c, wx2 + 6, y + 24, 1.2, '#7a7a8a'); }
  };
  car(8, 70, false);
  car(84, 92, false);
  car(182, 64, true);
  // cửa kính toàn cảnh toa giữa (to, cong lên mái) — hai đứa ngồi sau kính
  const gx = 88, gy = y + 1, gw = 84, gh = 15;
  R(c, gx, gy, gw, gh, inside > 0.5 ? '#ffe0a0' : '#cfe8ff');
  c.save(); c.beginPath(); c.rect(gx, gy, gw, gh); c.clip();
  f.seats.forEach((p, i) => { if (!p) return; const near = lean > 0 && i === 0 ? 3 : 0, im = lean ? p.img('act', 12) : choco ? p.img('act', 4) : p.img('idle'); f.put(im, gx + 22 + i * 26 + near - im.width * 0.25, gy - 1, 0.5, i === 1); });
  c.restore();
  if (choco) for (let i = 0; i < 2; i++) { const x = gx + 30 + i * 22; R(c, x, gy + 9, 3, 3, '#ffffff'); R(c, x + 0.5, gy + 9.3, 2, 1, '#6a3a1a'); for (let k = 0; k < 3; k++) { c.globalAlpha = 0.6; circ(c, x + 1.5 + Math.sin(t * 3 + k) * 1, gy + 7 - k * 2 - ((t * 4) % 2), 0.6, '#ffffff'); } c.globalAlpha = 1; }
  for (let k = 1; k < 4; k++) R(c, gx + k * 21, gy, 0.8, gh, '#8a0a20');
  c.globalAlpha = 0.25; poly(c, [gx + 6, gy, gx + 14, gy, gx + 4, gy + gh, gx - 4, gy + gh], '#ffffff'); c.globalAlpha = 1;
  // cửa sổ toa trước/sau + đầu máy
  for (const [x0, n] of [[12, 3], [186, 2]] as const) for (let k = 0; k < n; k++) R(c, x0 + 3 + k * 20, y + 3, 15, 10, inside > 0.5 ? '#ffd890' : '#bfe0f8');
  if (inside > 0.5) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 7; k++) glow(c, 22 + k * 32, y + 8, 14, '#ffc870', 0.4); c.restore(); }
  if (lean) for (let k = 0; k < 5; k++) { const q = (t * 0.7 + k / 5) % 1; c.globalAlpha = 1 - q; heart(c, gx + 40 + Math.sin(k * 2 + q * 4) * 6, gy - q * 22, 1.3, k % 2 ? '#ff8ab0' : '#ff4a7a'); } c.globalAlpha = 1;
}

function drawTrain(f: F) {
  const { c, el, t } = f, s = clamp((el - TB) / TR);
  // tốc độ: tăng dần lúc rời ga, giảm dần lúc vào ga đỉnh núi
  const wx = (s < 0.05 ? (s / 0.05) ** 2 * 0.05 * 0.5 : s > 0.95 ? 0.925 + (1 - ((1 - s) / 0.05) ** 2) * 0.05 * 0.5 + 0.025 : s - 0.025) * 3600;
  const g = ease(clamp((s - 0.6) / 0.3)), bridge = band(s, Z_BRIDGE[0], Z_BRIDGE[1]), tun = band(s, Z_TUN[0], Z_TUN[1], 0.012), ice = clamp((s - Z_ICE) / 0.02), mead = 1 - Math.max(bridge, ice);
  // trời: xanh trong → hoàng hôn hồng tím
  grad(c, 0, 90, ['#2a6ad8', '#5aa0ee', '#a8d4ff', '#e8f4ff']);
  if (g > 0) grad(c, 0, 90, ['#2a2a6a', '#7a3a8a', '#e8608a', '#ffa868', '#ffe0b0'], g);
  { const sx = 250 - g * 30, sy = 20 + g * 50; c.save(); c.globalCompositeOperation = 'lighter'; glow(c, sx, sy, 60, g > 0.3 ? '#ffb070' : '#fff6c8', 0.55); c.restore(); circ(c, sx, sy, 7 + g * 3, g > 0.3 ? '#ffe0a0' : '#fffbe0'); }
  for (let k = 0; k < 6; k++) { const x = ((k * 71 - t * 1.2 - wx * 0.02) % (W + 80) + W + 80) % (W + 80) - 40; cloud(c, x, 10 + (k % 3) * 9, 24 + (k % 2) * 12, g > 0.4 ? '#ffc8c8' : '#ffffff', g > 0.4 ? '#c8709a' : '#dceeff'); }
  if (g > 0.6) for (let k = 0; k < 30; k++) { c.globalAlpha = (g - 0.6) * 2.5 * (0.4 + 0.6 * Math.abs(Math.sin(t + k))); R(c, rr(k, 1) * W, rr(k, 2) * 40, 0.5, 0.5, '#ffffff'); } c.globalAlpha = 1;
  // núi xa / núi gần (bản ngày + bản hoàng hôn chồng mờ dần) — chiếm gần hết khung cho hùng vĩ
  scroll(c, peaks(false, true), wx * 0.02, 18); if (g > 0) scroll(c, peaks(true, true), wx * 0.02, 18, g);
  scroll(c, peaks(false, false), wx * 0.05, 30); if (g > 0) scroll(c, peaks(true, false), wx * 0.05, 30, g);
  // sương mỏng chân núi
  grad(c, 96, 112, [g > 0.3 ? '#ffd8e000' : '#ffffff00', g > 0.3 ? '#ffd8e0' : '#ffffff'], 0.45);
  // dải cảnh giữa: đồng cỏ hồ (bóng núi in dưới hồ), hẻm vực (khi lên cầu), sông băng
  if (mead > 0) { scroll(c, meadow(false), wx * 0.25, 104, mead); if (g > 0) scroll(c, meadow(true), wx * 0.25, 104, mead * g);
    c.save(); c.beginPath(); c.rect(0, 104.5, W, 13); c.clip(); c.translate(0, 104.5 * 2 + 30); c.scale(1, -1); scroll(c, peaks(g > 0.5, false), wx * 0.05, 30, mead * 0.28); c.restore();
    c.globalAlpha = mead; for (let k = 0; k < 24; k++) { const a = Math.sin(t * 2 + k * 1.7); if (a > 0.3) R(c, rr(k, 31) * W, 105 + rr(k, 32) * 12, 3, 0.4, '#ffffff'); } c.globalAlpha = 1; }
  if (bridge > 0) scroll(c, gorge(), wx * 0.3, 82, bridge);
  if (ice > 0) { scroll(c, glacier(), wx * 0.25, 102, ice); if (g > 0) { c.save(); c.globalAlpha = g * 0.3 * ice; c.fillStyle = '#ff8aa8'; c.fillRect(0, 102, W, 60); c.restore(); } }
  // bờ ray phía trước (lướt nhanh nhất): cỏ hoa / tuyết; trên cầu thì là vực
  const ground = mix('#5a9a3a', '#e8eef8', ice);
  if (bridge < 1) { c.globalAlpha = 1 - bridge; R(c, 0, RY + 3, W, H - RY - 3, g > 0 ? mix(ground, '#a87a9a', g * 0.3) : ground);
    for (let k = 0; k < 50; k++) { const x = ((rr(k, 5) * 400 - wx * 1.4) % 400 + 400) % 400 - 40, y = RY + 6 + rr(k, 6) * 24; R(c, x, y, 2 + rr(k, 7) * 4, 1, ice > 0.5 ? '#ffffff' : '#4a8a2a'); if (ice < 0.5) circ(c, x + 1, y - 0.5, 0.8, ['#ffd84a', '#ff8ab0', '#ffffff', '#b88aff'][k % 4]); } c.globalAlpha = 1; }
  // nhóm gần ray (thu nhỏ K cho tàu nhỏ giữa cảnh núi hùng vĩ)
  const lx = wx / K;
  c.save(); c.translate(W / 2, RY); c.scale(K, K); c.translate(-W / 2, -RY);
  const L = -W / 2 / K + W / 2, Rr = W / 2 / K + W / 2;
  viaduct(c, lx, bridge, L, Rr);
  R(c, L, RY + 1, Rr - L, 3, '#8a7a6a'); for (let k = 0; k < 80; k++) { const x = L + ((k * 8 - lx) % 640 + 640) % 640 - 16; R(c, x, RY + 1.5, 4, 2, '#5a3a2a'); } R(c, L, RY + 1, Rr - L, 0.7, '#c8c8d0');
  catenary(c, lx, tun, L, Rr);
  const station = (x: number, name: string, snow: boolean) => { if (x < L - 120 || x > Rr + 20) return;
    R(c, x, RY - 2, 110, 3, '#c8c0b0'); R(c, x + 10, RY - 46, 90, 44, snow ? '#e8e0d8' : '#f0e4d0'); poly(c, [x + 4, RY - 46, x + 55, RY - 64, x + 106, RY - 46], snow ? '#ffffff' : '#8a3a2a'); R(c, x + 4, RY - 47, 102, 2, '#ffffff');
    for (let k = 0; k < 4; k++) R(c, x + 18 + k * 20, RY - 36, 10, 14, '#ffd890'); R(c, x + 40, RY - 60, 30, 8, '#ffffff'); c.save(); c.font = 'bold 5px sans-serif'; c.fillStyle = '#c8102e'; c.textAlign = 'center'; c.fillText(name, x + 55, RY - 54); c.restore();
    circ(c, x + 55, RY - 42, 3, '#ffffff'); line(c, x + 55, RY - 42, x + 55, RY - 44, 0.5, '#2a2a2a'); line(c, x + 55, RY - 42, x + 56.5, RY - 42, 0.5, '#2a2a2a');
    for (let k = 0; k < 6; k++) { R(c, x + 12 + k * 16, RY - 22, 6, 1.4, '#e83a3a'); } };
  station(20 - lx, 'ZERMATT', false);
  station(20 + (3600 / K - lx), 'GORNERGRAT', true);
  const lean = f.taps.filter(x => x.id === 'lean' && f.now - x.at < 3500).length, choco = f.taps.filter(x => x.id === 'choco' && f.now - x.at < 5000).length;
  train(f, Math.max(tun, g), lean, choco);
  c.restore();
  // đường hầm: tối sầm, đèn hầm vụt qua
  if (tun > 0) { c.globalAlpha = tun * 0.88; c.fillStyle = '#0a0a14'; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const x = ((k * 110 - wx * 1.6) % 440 + 440) % 440 - 40; glow(c, x, RY - 26, 12, '#ffb048', tun * 0.8); } glow(c, 160, RY - 10, 50, '#ffc870', tun * 0.35); c.restore(); }
  // tuyết rơi ở vùng sông băng + phía trước có hoa (lướt nhanh)
  if (ice > 0) for (let k = 0; k < 70; k++) { const sp = 6 + rr(k, 1) * 8, x = ((rr(k, 2) * W - wx * 0.8 * rr(k, 3)) % W + W) % W, y = (rr(k, 4) * H + t * sp) % H; c.globalAlpha = ice; circ(c, x, y, 0.4 + rr(k, 5) * 0.5, '#ffffff'); } c.globalAlpha = 1;
  if (g > 0.4 && tun < 0.1) { c.save(); c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 10; k++) twinkle(c, rr(k, 9) * W, 34 + rr(k, 10) * 30, 1 + Math.abs(Math.sin(t * 2 + k)), '#ffd8e8'); c.restore(); }
  if (el < 1500) { c.globalAlpha = 1 - el / 1500; c.fillStyle = '#000000'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  void ell; void line;
}

export const glacier_train: DuoCfg = {
  title: 'Tàu đỏ xuyên dãy Alps', ms: TMS, join: TB, price: 0,
  ask: '🚂 Lên tàu đỏ toa kính toàn cảnh, ngắm núi tuyết Thuỵ Sĩ', joinAsk: '🚂 Lên tàu ngồi cạnh người ấy', invite: '🚂 Người ấy rủ đi tàu đỏ ngắm dãy Alps', yes: 'Lên tàu!', late: 'Tàu chạy mất rồi — lần sau nha',
  buttons: [{ id: 'lean', label: '💞 Tựa vai', from: TB, to: TB + TR }, { id: 'choco', label: '☕ Sô-cô-la nóng', from: TB, to: TB + TR }, { id: 'photo', label: '📸 Chụp', from: TB, to: TB + TR }],
  caption: el => { const s = (el - TB) / TR; return el < TB ? `🚉 Ga Zermatt — tàu sắp chạy… ${Math.ceil((TB - el) / 1000)}` : s < Z_BRIDGE[0] ? '🏞️ Đồng cỏ hoa dại, hồ xanh ngọc, làng nhà gỗ ban công hoa đỏ' : s < Z_BRIDGE[1] ? '🌉 Tàu chạy trên cầu đá cong vắt qua hẻm vực — nhìn xuống kìa!' : s < Z_TUN[1] ? '🌑 Vào hầm xuyên núi…' : s < 0.95 ? '🏔️ Sông băng và đỉnh núi tuyết ửng hồng lúc hoàng hôn' : s < 1 ? '🚉 Tới ga đỉnh núi Gornergrat' : '💞 Chuyến tàu đẹp nhất thế giới'; },
  draw: drawTrain, snap: [TB + TR * 0.2, TB + TR * 0.42, TB + TR * 0.8], endTitle: '🚂 Chuyến tàu đỏ xuyên dãy Alps', endNote: 'Hai đứa vừa ngắm trọn núi tuyết Thuỵ Sĩ qua ô kính 💞',
};
