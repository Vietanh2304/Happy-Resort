// Lớp vẽ động làm lộng lẫy & lãng mạn ba cảnh ở nhà: Đồi ngắm cảnh, Bãi cắm trại, Ghế dài ngắm biển.
// Mỗi cảnh có lớp sau (vẽ lại toàn cảnh: trời nhiều lớp, núi, biển/hồ, đồi cỏ, vòm hoa…) nằm dưới nhân vật
// và lớp trước (hoa tử đằng rủ, cánh hoa bay, đèn dây, đom đóm…) nằm trên — cả hai không chặn bấm.
import { useEffect, useRef } from 'react';
import type { Phase } from '../lib/content';
import type { HillSky } from '../lib/townSprites';
import { LOUNGE } from '../lib/seaView';
import { bake, circ, cloud, ell, glow, heart, line, poly, R, twinkle, type Ctx } from '../lib/canvasArt';
import { useScale } from './Stage';

const W = 192, H = 144, TAU = Math.PI * 2;
const hx = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (a: string, b: string, t: number) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const rr = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

/** canvas phủ cả cảnh, vẽ lại ~30 khung/giây; độ phân giải bám theo màn hình để nét không nhoè */
function Glam({ z, draw, fps = 30, box = [0, 0, W, H] }: { z: number; draw: (c: Ctx, t: number, K: number) => void; fps?: number; box?: [number, number, number, number] }) {
  const [bx, by, bw, bh] = box;
  const s = useScale();
  const K = Math.max(2, Math.min(6, Math.round(s * (window.devicePixelRatio || 1))));
  const ref = useRef<HTMLCanvasElement>(null);
  const dr = useRef(draw); dr.current = draw;
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!;
    let raf = 0, last = 0;
    const f = (now: number) => {
      raf = requestAnimationFrame(f);
      if (now - last < 1000 / fps) return; last = now;
      ctx.setTransform(K, 0, 0, K, 0, 0); ctx.clearRect(0, 0, bw, bh); ctx.imageSmoothingEnabled = false;
      dr.current(ctx, now / 1000, K);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [K, fps, bw, bh]);
  return <canvas ref={ref} width={bw * K} height={bh * K} className="glam-cv" style={{ left: bx * s, top: by * s, width: bw * s, height: bh * s, zIndex: z }} aria-hidden />;
}

// ───────── nét vẽ dùng chung ─────────
const grad = (c: Ctx, y0: number, y1: number, cols: string[]) => { const g = c.createLinearGradient(0, y0, 0, y1); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); };
/** dãy núi lặp mượt, đỉnh cao phủ tuyết */
const ridge = (c: Ctx, base: number, amp: number, col: string, shade: string, rnd: () => number, f: [number, number], snow?: string, cut?: (x: number) => number) => {
  const p = [rnd() * 9, rnd() * 9];
  const h = (x: number) => amp * (0.55 + 0.3 * Math.sin(x / f[0] + p[0]) + 0.15 * Math.sin(x / f[1] + p[1])) * (cut ? cut(x) : 1);
  for (let x = 0; x < W; x += 0.5) { const y = base - h(x), lit = h(x + 2) >= h(x - 2); R(c, x, y, 0.5, base - y + 1, lit ? col : shade); if (snow && h(x) > amp * 0.78) R(c, x, y, 0.5, (h(x) - amp * 0.78) * 0.8 + 0.5, snow); }
};
const pine = (c: Ctx, x: number, base: number, h: number, col: string, lit: string, snow?: string) => {
  for (let j = 0; j < h; j += 0.5) { const u = j / h, w = (u * 0.85 + 0.15) * h * 0.32 * (1 - ((j * 2) % 6) / 14); R(c, x - w, base - h + j, w * 2, 0.5, col); R(c, x - w, base - h + j, w * 0.7, 0.5, lit); if (snow && (j * 2) % 6 < 1) R(c, x - w, base - h + j, w * 2, 0.5, snow); }
  R(c, x - 0.5, base, 1, 2, '#4a3020');
};
/** dây đèn võng giữa hai điểm */
const bulbs = (c: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, n: number, t: number, lit: number, cols = ['#fff1a8', '#ffc6dc', '#c8f0ff', '#ffd27a']) => {
  const at = (u: number) => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + Math.sin(u * Math.PI) * sag] as const;
  c.strokeStyle = '#3a2a2a'; c.lineWidth = 0.35; c.beginPath(); for (let k = 0; k <= 24; k++) { const [x, y] = at(k / 24); if (k) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
  for (let k = 1; k < n; k++) { const [x, y] = at(k / n), col = cols[k % cols.length], tw = 0.7 + 0.3 * Math.sin(t * 3 + k * 1.7);
    if (lit > 0) glow(c, x, y + 1.2, 4.5, col, lit * 0.55 * tw); R(c, x - 0.25, y, 0.5, 0.6, '#3a2a2a'); ell(c, x, y + 1.3, 0.8, 1, lit > 0 ? col : mix(col, '#808080', 0.5)); }
};
const lantern = (c: Ctx, x: number, y: number, lit: number, t: number, k = 0) => {
  const fl = 0.8 + 0.2 * Math.sin(t * 9 + k * 3) * Math.sin(t * 5.3 + k);
  if (lit > 0) glow(c, x, y - 2.5, 10, '#ffc860', lit * 0.5 * fl);
  R(c, x - 2, y - 6, 4, 0.8, '#3a2a2a'); R(c, x - 1.6, y - 5.2, 3.2, 4.4, lit > 0 ? '#ffe7a8' : '#d8e4ec'); R(c, x - 2, y - 0.8, 4, 0.8, '#3a2a2a');
  R(c, x - 0.3, y - 7.5, 0.6, 1.5, '#3a2a2a'); if (lit > 0) { ell(c, x, y - 2.6, 0.7 * fl, 1.2 * fl, '#ff9a3a'); R(c, x - 0.2, y - 3.2, 0.4, 0.8, '#fff6c8'); }
  R(c, x - 1.6, y - 5.2, 0.5, 4.4, '#ffffff60');
};
const rose = (c: Ctx, x: number, y: number, r: number, col: string) => { circ(c, x, y, r, mix(col, '#000000', 0.25)); circ(c, x - r * 0.2, y - r * 0.2, r * 0.75, col); circ(c, x - r * 0.25, y - r * 0.3, r * 0.35, mix(col, '#ffffff', 0.35)); };
const petal = (c: Ctx, x: number, y: number, a: number, col: string) => ell(c, x, y, 1, 0.55, col, a);

// ═════════ ĐỒI NGẮM CẢNH ═════════
const HZ = 90;
const gTop = (x: number) => 104 + ((x - 96) / 96) ** 2 * 16;
type HP = { sky: string[]; far: string; mid: string; near: string; sea: string; seaD: string; grass: string; gL: string; gD: string; glow: string; dark: boolean; sun: [number, number] | null; moon: [number, number] | null };
const HPAL: Record<HillSky, HP> = {
  dawn: { sky: ['#3a3a9a', '#8a5ac0', '#e88ab8', '#ffb89a', '#ffe6b8'], far: '#a68ad0', mid: '#8268b4', near: '#5e4c96', sea: '#9a90dc', seaD: '#6a64b0', grass: '#86bc6c', gL: '#a8d88a', gD: '#62985a', glow: '#ffd0a0', dark: false, sun: [56, 86], moon: null },
  day: { sky: ['#2a78e0', '#48a0f2', '#8ad0ff', '#d6f2ff'], far: '#86b0dc', mid: '#5f92c8', near: '#4a7aaa', sea: '#2aa8e8', seaD: '#1a78c0', grass: '#9fd067', gL: '#c4ea8c', gD: '#76ae4e', glow: '#fff6c8', dark: false, sun: [150, 20], moon: null },
  sunset: { sky: ['#24196a', '#62289a', '#c43e7c', '#ff6a4a', '#ffa040', '#ffdc90'], far: '#8c4c9c', mid: '#6a3a88', near: '#4a2a6a', sea: '#c25a8a', seaD: '#7a3a7a', grass: '#6a9a4a', gL: '#a2c46a', gD: '#4a7a3a', glow: '#ffb060', dark: false, sun: [130, 84], moon: null },
  night: { sky: ['#040820', '#0a1240', '#18266a', '#2e3c84'], far: '#2c306c', mid: '#1e2456', near: '#141a42', sea: '#16245a', seaD: '#0c1640', grass: '#2a5a4a', gL: '#3a7058', gD: '#1a4038', glow: '#e8ecff', dark: true, sun: null, moon: [40, 22] },
  meteor: { sky: ['#02041a', '#0a0e3a', '#1a1a5a', '#3a2a7a'], far: '#2a2462', mid: '#1c1a4c', near: '#12123a', sea: '#141c50', seaD: '#0a1036', grass: '#244e44', gL: '#346a56', gD: '#163a32', glow: '#d8d0ff', dark: true, sun: null, moon: null },
  aurora: { sky: ['#010a18', '#04203a', '#0a3050', '#183a5a'], far: '#1a3048', mid: '#12263c', near: '#0c1a2e', sea: '#0c2a40', seaD: '#061a2a', grass: '#1e4a40', gL: '#2a6050', gD: '#123a30', glow: '#9affd0', dark: true, sun: null, moon: [150, 18] },
};
const ARCH = { x: 96, base: 119, top: 92, r: 18 };
const archPts = (() => { const p: [number, number][] = []; for (let y = ARCH.base; y > ARCH.top; y -= 2) p.push([ARCH.x - ARCH.r, y]); for (let a = 0; a <= 24; a++) { const q = Math.PI + (a / 24) * Math.PI; p.push([ARCH.x + Math.cos(q) * ARCH.r, ARCH.top + Math.sin(q) * ARCH.r]); } for (let y = ARCH.top; y < ARCH.base; y += 2) p.push([ARCH.x + ARCH.r, y]); return p; })();

const hillStatic = (m: HillSky, K: number) => bake(`glam:hill:${m}:${K}`, W, H, (c, rnd) => {
  const P = HPAL[m];
  grad(c, 0, HZ, P.sky);
  if (P.dark) {
    // dải Ngân Hà chéo trời
    for (let i = 0; i < (m === 'meteor' ? 900 : 500); i++) { const u = rnd(), x = u * W, y = 74 - u * 64 + (rnd() - 0.5) * (18 + rnd() * 14); R(c, x, y, 0.5, 0.5, ['#5a4f9a', '#7a6ab8', '#9a8ad0', '#c8b8ff'][Math.floor(rnd() * 4)]); }
    for (let i = 0; i < 60; i++) { const u = rnd(); glow(c, u * W, 74 - u * 64 + (rnd() - 0.5) * 10, 6, '#8a7ad0', 0.12); }
    for (let i = 0; i < 160; i++) R(c, rnd() * W, rnd() * (HZ - 10), 0.5, 0.5, rnd() < 0.3 ? '#ffe9a0' : '#ffffff');
  }
  // ba lớp núi xa → gần, chừa thung lũng chỗ mặt trời lặn/mọc
  const sunX = P.sun && P.sun[1] > 60 ? P.sun[0] : -999, cut = (x: number) => Math.min(1, Math.max(0.18, Math.abs(x - sunX) / 40));
  ridge(c, HZ, 26, P.far, mix(P.far, '#000000', 0.12), rnd, [21, 7], P.dark ? undefined : mix(P.far, '#ffffff', 0.7), cut);
  { const g = c.createLinearGradient(0, HZ - 16, 0, HZ); g.addColorStop(0, '#ffffff00'); g.addColorStop(1, mix(P.sky[P.sky.length - 1], '#ffffff', 0.2) + '90'); c.fillStyle = g; c.fillRect(0, HZ - 16, W, 16); }
  ridge(c, HZ, 15, P.mid, mix(P.mid, '#000000', 0.12), rnd, [13, 5], undefined, cut);
  ridge(c, HZ, 7, P.near, mix(P.near, '#000000', 0.15), rnd, [9, 3.3], undefined, cut);
  // mũi đất bên phải có ngọn hải đăng trắng sọc đỏ
  ctx2(c, P);
  // biển: đậm dần về gần, gợn sóng
  grad(c, HZ, 112, [mix(P.sea, '#ffffff', 0.18), P.sea, P.seaD]);
  for (let i = 0; i < 90; i++) { const u = rnd(), y = HZ + 1 + u * u * 20; R(c, rnd() * W, y, 1 + u * 4, 0.5, mix(P.sea, '#ffffff', 0.3 + rnd() * 0.2)); }
  // đồi cỏ: nền chuyển màu, mép sáng, cỏ lăn tăn, hoa dại khắp nơi
  for (let x = 0; x < W; x += 0.5) { const top = gTop(x); const g = c.createLinearGradient(0, top, 0, H); g.addColorStop(0, P.gL); g.addColorStop(0.12, P.grass); g.addColorStop(1, P.gD); c.fillStyle = g; c.fillRect(x, top, 0.5, H - top); R(c, x, top, 0.5, 0.6, mix(P.gL, '#ffffff', 0.25)); }
  for (let i = 0; i < 900; i++) { const x = rnd() * W, y = gTop(x) + 2 + rnd() * (H - gTop(x)); R(c, x, y, 0.5, 1 + rnd() * 1.5, rnd() < 0.5 ? P.gD : P.gL); }
  // lối đá nhỏ từ chân đồi (về làng) lên ghế
  for (let k = 0; k < 14; k++) { const u = k / 13, x = 8 + u * 66, y = 140 - u * 16 + Math.sin(u * 5) * 2; ell(c, x, y, 3.4 - u * 1.2, 1.4 - u * 0.4, P.dark ? '#5a6070' : '#d8d0c0'); ell(c, x - 0.6, y - 0.4, 2.2 - u * 0.8, 0.7, P.dark ? '#6a7080' : '#ece6da'); }
  const FL = P.dark ? ['#c8d0ff', '#a8b0f0', '#e0d8ff'] : ['#ff7aa8', '#ffd84a', '#ffffff', '#c890ff', '#ff9a5a', '#7ac8ff'];
  for (let i = 0; i < 160; i++) { const x = rnd() * W, y = gTop(x) + 4 + rnd() * (H - gTop(x) - 4); if (Math.abs(x - 96) < 30 && y > 108 && y < 128) continue; const col = FL[Math.floor(rnd() * FL.length)]; R(c, x, y + 0.6, 0.5, 1.2, P.gD); circ(c, x, y, 0.5 + rnd() * 0.4, col); }
  // hàng rào gỗ sơn trắng có hồng leo (bên phải)
  for (let x = 146; x < W; x += 5) { const y = gTop(x); R(c, x, y - 9, 1.6, 10, P.dark ? '#8a8ca8' : '#fbf6ee'); poly(c, [x, y - 9, x + 0.8, y - 10.5, x + 1.6, y - 9], P.dark ? '#8a8ca8' : '#fbf6ee'); }
  for (let x = 146; x < W; x += 0.5) { const y = gTop(x); R(c, x, y - 6.5, 0.5, 0.8, P.dark ? '#7a7c98' : '#e8e0d4'); R(c, x, y - 3, 0.5, 0.8, P.dark ? '#7a7c98' : '#e8e0d4'); }
  for (let k = 0; k < 22; k++) { const x = 146 + rnd() * 46, y = gTop(x) - 3 - rnd() * 7; circ(c, x, y + 1, 1.3, P.dark ? '#2a4a3a' : '#4a8a3a'); if (rnd() < 0.7) rose(c, x, y, 0.9, P.dark ? '#a070b0' : ['#ff4a7a', '#ff8ab0', '#ffffff'][k % 3]); }
  // vòm hoa hồng sau ghế: khung trắng phủ lá và hồng
  c.strokeStyle = P.dark ? '#9a9cb8' : '#fbf6ee'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ARCH.x - ARCH.r, ARCH.base); c.lineTo(ARCH.x - ARCH.r, ARCH.top); c.arc(ARCH.x, ARCH.top, ARCH.r, Math.PI, 0); c.lineTo(ARCH.x + ARCH.r, ARCH.base); c.stroke();
  c.lineWidth = 0.5; c.strokeStyle = P.dark ? '#7a7c98' : '#e0d6c8'; c.beginPath(); c.arc(ARCH.x, ARCH.top, ARCH.r - 2, Math.PI, 0); c.stroke();
  archPts.forEach(([x, y], i) => { for (let j = 0; j < 2; j++) circ(c, x + (rnd() - 0.5) * 4, y + (rnd() - 0.5) * 3, 1.2 + rnd() * 0.8, rnd() < 0.5 ? (P.dark ? '#244838' : '#3a7a3a') : (P.dark ? '#2e5a46' : '#5aa04a')); if (i % 2 === 0) rose(c, x + (rnd() - 0.5) * 3, y + (rnd() - 0.5) * 2, 0.9 + rnd() * 0.5, P.dark ? ['#b080c0', '#d8b0e0', '#f0e0ff'][i % 3] : ['#ff3a6a', '#ff8ab0', '#ffffff', '#ffb0c8'][i % 4]); });
  // cánh hoa hồng rắc trên cỏ quanh ghế
  for (let k = 0; k < 40; k++) { const a = rnd() * TAU, d = 10 + rnd() * 22; petal(c, 96 + Math.cos(a) * d * 1.4, 126 + Math.sin(a) * d * 0.35, rnd() * 3, P.dark ? '#c890d0' : rnd() < 0.5 ? '#ff5a8a' : '#ffb0c8'); }
}, K);
function ctx2(c: Ctx, P: HP) {
  const hx0 = 164; c.fillStyle = mix(P.near, '#000000', 0.1); c.beginPath(); c.moveTo(146, HZ + 0.5); c.quadraticCurveTo(160, HZ - 9, 176, HZ - 10); c.lineTo(W, HZ - 11); c.lineTo(W, HZ + 0.5); c.fill();
  for (let k = 0; k < 9; k++) { const y = HZ - 11 - k * 1.6, w = 2.6 - k * 0.12; R(c, hx0 + 12 - w / 2, y, w, 1.6, k % 3 === 1 ? '#e84a4a' : '#fbf6ee'); }
  R(c, hx0 + 10.4, HZ - 27, 3.2, 2, '#3a3a4a'); R(c, hx0 + 10.8, HZ - 26.6, 2.4, 1.2, '#ffe9a0'); poly(c, [hx0 + 10, HZ - 27, hx0 + 12, HZ - 29.5, hx0 + 14, HZ - 27], '#c83a3a');
}

function hillLive(c: Ctx, t: number, m: HillSky, K: number) {
  const P = HPAL[m];
  c.drawImage(hillStatic(m, K), 0, 0, W, H);
  // sao lấp lánh
  if (P.dark) for (let i = 0; i < 46; i++) { const a = 0.5 + 0.5 * Math.sin(t * (1 + rr(i, 3) * 2) + i); c.globalAlpha = a; const x = rr(i, 1) * W, y = rr(i, 2) * (HZ - 14); if (rr(i, 4) < 0.25) twinkle(c, x, y, 1.4 * a + 0.4, '#fff6d8'); else R(c, x, y, 0.5, 0.5, '#ffffff'); c.globalAlpha = 1; }
  // cực quang uốn lượn
  if (m === 'aurora') for (let band = 0; band < 3; band++) for (let x = 0; x < W; x += 1) {
    const y = 18 + band * 9 + Math.sin(x / 23 + t * 0.4 + band) * 7 + Math.sin(x / 9 - t * 0.7) * 2, h = 16 + Math.sin(x / 13 + t * 0.9 + band * 2) * 8;
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#00000000'); g.addColorStop(0.5, band === 1 ? '#a07affa0' : '#5affb070'); g.addColorStop(1, '#00000000');
    c.globalAlpha = 0.35 + 0.25 * Math.sin(x / 17 + t * 1.3 + band); c.fillStyle = g; c.fillRect(x, y, 1, h); c.globalAlpha = 1;
  }
  // mặt trời: quầng sáng nhiều lớp + tia nắng xoay chậm
  if (P.sun) {
    const [sx, sy] = P.sun;
    c.save(); c.beginPath(); c.rect(0, 0, W, HZ); c.clip();
    glow(c, sx, sy, 70, P.glow, 0.55); glow(c, sx, sy, 26, '#ffffff', 0.6);
    c.globalAlpha = 0.09; for (let k = 0; k < 12; k++) { const a = t * 0.05 + k * TAU / 12; poly(c, [sx, sy, sx + Math.cos(a) * 160, sy + Math.sin(a) * 160, sx + Math.cos(a + 0.12) * 160, sy + Math.sin(a + 0.12) * 160], '#fffbe0'); } c.globalAlpha = 1;
    circ(c, sx, sy, m === 'day' ? 7 : 10, m === 'day' ? '#fff6c0' : '#ffe6a0'); circ(c, sx - 1.5, sy - 1.5, m === 'day' ? 4 : 6, '#fffbe8');
    c.restore();
  }
  if (P.moon) { const [mx, my] = P.moon; glow(c, mx, my, 34, '#d8e0ff', 0.45); glow(c, mx, my, 12, '#ffffff', 0.5); circ(c, mx, my, 6, '#fff6d8'); circ(c, mx + 2.6, my - 1.6, 5.2, P.sky[0]); }
  // mây viền sáng trôi
  if (!P.dark) for (let k = 0; k < 6; k++) { const w = 22 + (k % 3) * 10, x = ((k * 47 + t * (1.2 + k * 0.3)) % (W + 60)) - 40, y = 10 + (k % 3) * 14 + (m === 'day' ? 0 : 20);
    const col = m === 'day' ? '#ffffff' : m === 'sunset' ? (k % 2 ? '#ffb0b8' : '#ffc890') : '#ffd0e0', sh = m === 'day' ? '#dceeff' : m === 'sunset' ? '#b8508a' : '#c890c8'; cloud(c, x, y, w, col, sh); }
  // ánh trăng / ánh nắng trải vệt lấp lánh trên biển
  const src = P.sun ?? P.moon;
  if (src) for (let k = 0; k < 18; k++) { const y = HZ + 1.5 + k * 1.15, w = (2 + k * 0.5) * (0.6 + 0.4 * Math.sin(t * 3 + k * 1.9)), x = src[0] + Math.sin(t * 1.7 + k * 2.3) * (1 + k * 0.35); c.globalAlpha = 0.55 + 0.4 * Math.sin(t * 4 + k); R(c, x - w / 2, y, w, 0.5, m === 'day' ? '#ffffff' : P.glow); c.globalAlpha = 1; }
  for (let k = 0; k < 26; k++) { const x = rr(k, 7) * W, y = HZ + 2 + rr(k, 8) ** 2 * 18, a = Math.sin(t * 2 + k * 2.1); if (a > 0.4) { c.globalAlpha = a - 0.4; R(c, x, y, 1.5, 0.5, '#ffffff'); c.globalAlpha = 1; } }
  // thuyền buồm trôi chậm ngoài khơi
  { const x = ((t * 1.6) % (W + 40)) - 20, y = HZ + 6; R(c, x - 4, y, 8, 1.2, P.dark ? '#6a6a8a' : '#8a5a3a'); poly(c, [x, y - 0.5, x, y - 9, x + 5, y - 1], P.dark ? '#a8acc8' : '#fffbf4'); poly(c, [x - 0.5, y - 0.5, x - 0.5, y - 7, x - 4, y - 1], P.dark ? '#9094b0' : '#ffe0e8'); R(c, x - 3, y + 1.5, 7, 0.5, '#ffffff50'); }
  // hải đăng: chớp sáng, đêm thì quét chùm sáng
  { const lx = 176, ly = HZ - 25.5, on = Math.sin(t * 2) > 0; if (P.dark) { const a = t * 0.9; c.globalAlpha = 0.18; poly(c, [lx, ly, lx + Math.cos(a) * 90, ly + Math.sin(a) * 14 - 4, lx + Math.cos(a) * 90, ly + Math.sin(a) * 14 + 4], '#fff6c0'); c.globalAlpha = 1; } if (on || P.dark) glow(c, lx, ly, 6, '#fff0a0', 0.8); }
  // chim hải âu bay (ngày), bóng bay trái tim xa xa
  if (!P.dark) for (let k = 0; k < 4; k++) { const x = ((k * 61 + t * (5 + k)) % (W + 20)) - 10, y = 30 + k * 7 + Math.sin(t + k) * 3, f = Math.sin(t * 6 + k) * 1.2; const col = m === 'day' ? '#4a4a5a' : '#3a1a3a'; line(c, x - 2.5, y - f, x, y, 0.5, col); line(c, x, y, x + 2.5, y - f, 0.5, col); }
  if (m === 'day' || m === 'dawn') { const x = 40 + Math.sin(t * 0.07) * 20, y = 40 + Math.sin(t * 0.3) * 3; heart(c, x, y, 3.2, '#ff5a8a'); circ(c, x - 1.5, y - 0.8, 0.8, '#ffb0c8'); line(c, x, y + 4, x, y + 8, 0.3, '#8a5a3a'); R(c, x - 1, y + 8, 2, 1.5, '#b07a4a'); }
  // sương mờ chân đồi
  c.globalAlpha = P.dark ? 0.12 : 0.18; for (let k = 0; k < 5; k++) { const x = ((k * 53 + t * 2) % (W + 60)) - 30; ell(c, x, 108 + (k % 2) * 3, 24, 2.5, P.dark ? '#8a9ac8' : '#ffffff'); } c.globalAlpha = 1;
  // đèn trên vòm hoa + chiếc đèn trái tim treo giữa vòm
  const lit = P.dark ? 1 : m === 'sunset' || m === 'dawn' ? 0.7 : 0;
  archPts.forEach(([x, y], i) => { if (i % 3) return; const col = ['#fff1a8', '#ffc6dc', '#ffe0a0'][i % 3], tw = 0.6 + 0.4 * Math.sin(t * 2.5 + i); if (lit) glow(c, x, y, 3.5, col, lit * 0.6 * tw); circ(c, x, y, 0.45, lit ? col : '#f0e8d8'); });
  { const sw = Math.sin(t * 1.2) * 0.6, x = ARCH.x + sw, y = ARCH.top - ARCH.r + 8; line(c, ARCH.x, ARCH.top - ARCH.r + 1, x, y - 2, 0.3, '#6a4a3a'); if (lit) glow(c, x, y, 9, '#ff8ab0', lit * 0.55); heart(c, x, y, 2, lit ? '#ff6a9a' : '#ff8ab0'); circ(c, x - 0.8, y - 0.4, 0.5, '#ffffff'); }
  // đèn lồng thuỷ tinh hai bên ghế + dọc lối đá
  for (const [x, y, k] of [[72, 125, 0], [120, 125, 1], [22, 136, 2], [46, 130, 3]] as const) lantern(c, x, y, lit, t, k);
  // bướm (ngày) quanh vòm hoa
  if (!P.dark) for (let k = 0; k < 4; k++) { const x = 96 + Math.sin(t * 0.7 + k * 2) * (30 + k * 8), y = 100 + Math.sin(t * 1.3 + k) * 8, f = Math.abs(Math.sin(t * 12 + k)); const col = ['#ff8ab0', '#ffd84a', '#ffffff', '#c890ff'][k]; ell(c, x - 0.9, y, 1.1 * f + 0.2, 1, col); ell(c, x + 0.9, y, 1.1 * f + 0.2, 1, col); R(c, x - 0.2, y - 0.7, 0.4, 1.4, '#3a2a2a'); }
  // tối nhẹ bốn góc cho ấm cúng
  vignette(c, P.dark ? 0.45 : 0.22);
}
function hillFront(c: Ctx, t: number, m: HillSky) {
  const P = HPAL[m];
  // hoa tử đằng rủ từ hai góc trên, đung đưa theo gió
  for (const side of [0, 1]) {
    const x0 = side ? W : 0, dir = side ? -1 : 1;
    c.strokeStyle = P.dark ? '#3a2e2a' : '#6a4a32'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(x0, 0); c.quadraticCurveTo(x0 + dir * 24, 6, x0 + dir * 52, 2); c.stroke();
    for (let k = 0; k < 13; k++) {
      const u = k / 12, bx = x0 + dir * (2 + u * 50), by = 1 + Math.sin(u * Math.PI) * 4.5, L = 9 + rr(k + side * 20, 5) * 16 * (1 - u * 0.5), sw = Math.sin(t * 1.1 + k * 0.7 + side) * 1.4;
      for (let j = 0; j < L; j += 0.7) { const q = j / L, x = bx + sw * q * q + Math.sin(j * 2.3 + k) * 0.9 * (1 - q), y = by + j, r = 2.3 * (1 - q * 0.6);
        circ(c, x, y, r, P.dark ? mix('#6a58a8', '#c8b8f0', q) : mix('#8a5ac8', '#e8d0ff', q)); circ(c, x - r * 0.35, y - r * 0.3, r * 0.5, P.dark ? mix('#9a88d8', '#e8e0ff', q) : mix('#b890f0', '#ffffff', q)); }
      for (let j = 0; j < 3; j++) ell(c, bx + (j - 1) * 2, by + 0.5, 1.4, 0.6, P.dark ? '#2a4a3a' : '#5aa04a', (j - 1) * 0.6);
    }
  }
  // cánh hoa anh đào bay chéo qua cảnh
  for (let k = 0; k < 22; k++) { const sp = 8 + rr(k, 1) * 8, x = (rr(k, 2) * W + t * sp) % (W + 20) - 10, y = (rr(k, 3) * H + t * sp * 0.45 + Math.sin(t + k) * 4) % H; petal(c, x, y, t * 2 + k, P.dark ? '#e0c8f0' : k % 3 ? '#ffb0c8' : '#ffffff'); }
  // đom đóm / hạt sáng lơ lửng lúc chạng vạng và đêm
  if (P.dark || m === 'sunset' || m === 'dawn') for (let k = 0; k < 14; k++) { const x = (rr(k, 9) * W + Math.sin(t * 0.3 + k) * 10 + W) % W, y = 60 + rr(k, 10) * 80 + Math.sin(t * 0.5 + k * 2) * 6, a = 0.5 + 0.5 * Math.sin(t * 2 + k * 1.3); glow(c, x, y, 3 + a * 2, P.dark ? '#fff7a8' : '#ffd8a0', a * 0.7); circ(c, x, y, 0.4, '#ffffff'); }
  // bụi hồng góc dưới phải
  for (let k = 0; k < 10; k++) { const x = 176 + (k % 5) * 4 + rr(k, 11) * 2, y = 136 + Math.floor(k / 5) * 4; circ(c, x, y, 2.6, P.dark ? '#1e3a30' : '#3a7a3a'); }
  for (let k = 0; k < 7; k++) rose(c, 177 + k * 2.6, 134 + (k % 3) * 2.5, 1.2, P.dark ? '#b080c0' : ['#ff3a6a', '#ffffff', '#ff8ab0'][k % 3]);
}

export function HillGlam({ mode }: { mode: HillSky }) {
  return <><Glam z={0} draw={(c, t, K) => hillLive(c, t, mode, K)} /><Glam z={140} draw={(c, t) => hillFront(c, t, mode)} /></>;
}

// ═════════ BÃI CẮM TRẠI ═════════
type CP = { sky: string[]; far: string; mid: string; lake: string; lakeD: string; pine: string; pineL: string; grass: string; gL: string; gD: string; dark: boolean; warm: number };
const CPAL: Record<Phase, CP> = {
  dawn: { sky: ['#4a5ac8', '#a08ad8', '#f0a8c0', '#ffd0a8'], far: '#9a8ad0', mid: '#7a6ab4', lake: '#a8a0e0', lakeD: '#7a74c0', pine: '#2e5a48', pineL: '#4a7a5a', grass: '#7aae5c', gL: '#9ac878', gD: '#5a8a48', dark: false, warm: 0.3 },
  day: { sky: ['#3a98ec', '#6abcf8', '#a8dcff', '#dcf4ff'], far: '#8ab0dc', mid: '#6a96c4', lake: '#5fb8e0', lakeD: '#3a90c0', pine: '#2e6a40', pineL: '#4e9a56', grass: '#8cc65c', gL: '#b0e07a', gD: '#64a044', dark: false, warm: 0 },
  sunset: { sky: ['#2e2478', '#7a3a9a', '#d0508a', '#ff8a5a', '#ffd08a'], far: '#8a4a8a', mid: '#663a7a', lake: '#d06a9a', lakeD: '#8a4a8a', pine: '#2a3a3a', pineL: '#3e5a4a', grass: '#6a8a48', gL: '#94b060', gD: '#4a6a38', dark: false, warm: 0.7 },
  night: { sky: ['#030620', '#0a1244', '#162264', '#24306e'], far: '#22285e', mid: '#181e4a', lake: '#121e52', lakeD: '#0a1238', pine: '#0e2420', pineL: '#173430', grass: '#1e3e34', gL: '#2a5244', gD: '#122a24', dark: true, warm: 1 },
};
const LK0 = 62, LK1 = 80;
const campStatic = (ph: Phase, K: number) => bake(`glam:camp:${ph}:${K}`, W, H, (c, rnd) => {
  const P = CPAL[ph];
  grad(c, 0, LK0, P.sky);
  if (P.dark) { for (let i = 0; i < 700; i++) { const u = rnd(); R(c, u * W, 6 + u * 40 + (rnd() - 0.5) * 16, 0.5, 0.5, ['#4a4a8a', '#6a6ab0', '#9a90d0'][Math.floor(rnd() * 3)]); } for (let i = 0; i < 120; i++) R(c, rnd() * W, rnd() * 52, 0.5, 0.5, rnd() < 0.3 ? '#ffe9a0' : '#ffffff'); }
  ridge(c, LK0, 30, P.far, mix(P.far, '#000000', 0.12), rnd, [19, 6], P.dark ? '#5a6098' : mix(P.far, '#ffffff', 0.75));
  { const g = c.createLinearGradient(0, LK0 - 14, 0, LK0); g.addColorStop(0, '#ffffff00'); g.addColorStop(1, mix(P.sky[P.sky.length - 1], '#ffffff', 0.15) + '80'); c.fillStyle = g; c.fillRect(0, LK0 - 14, W, 14); }
  ridge(c, LK0, 15, P.mid, mix(P.mid, '#000000', 0.12), rnd, [11, 4]);
  // rừng thông nhỏ bờ hồ phía xa
  for (let x = -2; x < W + 2; x += 2.2 + rnd() * 1.6) pine(c, x, LK0, 5 + rnd() * 5, mix(P.pine, P.mid, 0.4), mix(P.pineL, P.mid, 0.4));
  // hồ: soi bóng núi (lật ngược, mờ) + gợn sóng
  grad(c, LK0, LK1, [mix(P.lake, '#ffffff', 0.12), P.lake, P.lakeD]);
  c.save(); c.globalAlpha = 0.35; c.translate(0, LK0 * 2); c.scale(1, -1); ridge(c, LK0, 15, P.mid, P.mid, () => 0.4, [11, 4]); c.restore();
  for (let i = 0; i < 70; i++) R(c, rnd() * W, LK0 + 1 + rnd() * 17, 1 + rnd() * 3, 0.5, mix(P.lake, '#ffffff', 0.3));
  // bãi cỏ
  grad(c, LK1, H, [P.gL, P.grass, P.gD]);
  for (let i = 0; i < 900; i++) { const x = rnd() * W, y = LK1 + 1 + rnd() * (H - LK1); R(c, x, y, 0.5, 1 + rnd() * 1.5, rnd() < 0.5 ? P.gD : P.gL); }
  // khoảng đất quanh lửa trại viền đá
  ell(c, 96, 122, 44, 16, P.dark ? '#3e3028' : '#c8a070'); ell(c, 96, 122, 40, 13, P.dark ? '#4e3e30' : '#d8b080');
  for (let i = 0; i < 40; i++) { const a = rnd() * TAU; ell(c, 96 + Math.cos(a) * 43, 122 + Math.sin(a) * 15, 1.4, 0.8, P.dark ? '#5a5a62' : '#a8a0a0'); }
  // hai hàng thông lớn hai bên (khoảng giữa chừa nhìn ra hồ)
  for (let i = 0; i < 30; i++) { const left = i < 15, x = left ? -6 + (i % 15) * 4.6 + rnd() * 2 : 124 + (i % 15) * 5 + rnd() * 2; if (x > 58 && x < 126) continue; const base = 82 + (i % 3) * 2.5, h = 22 + rnd() * 16; pine(c, x, base, h, P.pine, P.pineL); }
  // võng giữa hai thân thông (bên trái) có gối và chăn
  R(c, 12, 70, 2, 22, '#4a3020'); R(c, 48, 70, 2, 22, '#4a3020');
  c.strokeStyle = '#8a5a3a'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(13, 80); c.quadraticCurveTo(31, 92, 49, 80); c.stroke();
  for (let k = 0; k < 6; k++) { c.strokeStyle = ['#ff8ab0', '#fff1d8', '#7ac8ff'][k % 3]; c.lineWidth = 0.9; c.beginPath(); c.moveTo(16 + k * 0.3, 81.5 + k * 0.9); c.quadraticCurveTo(31, 90 + k * 0.9, 46 - k * 0.3, 81.5 + k * 0.9); c.stroke(); }
  ell(c, 20, 84, 3, 1.6, '#fffbf0'); ell(c, 20, 83.6, 2.2, 1, '#ffe0e8');
  // chăn picnic caro trước lều + giỏ + gối tim
  for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) R(c, 140 + x * 2.6, 103 + y * 1.4, 2.6, 1.4, (x + y) % 2 ? '#e84a5a' : '#fff4ec');
  R(c, 142, 101.5, 6, 2.5, '#c88a4a'); R(c, 142, 101.5, 6, 0.6, '#e8b070'); c.strokeStyle = '#8a5a3a'; c.lineWidth = 0.4; c.beginPath(); c.arc(145, 101.5, 2.5, Math.PI, 0); c.stroke();
  heart(c, 166, 102.8, 1.6, '#ff6a9a'); heart(c, 170, 103.4, 1.4, '#ffb0c8');
  // biển gỗ khắc tim
  R(c, 54, 104, 1.2, 10, '#6a4a2a'); R(c, 48, 101, 13, 5, '#a8724a'); R(c, 48, 101, 13, 0.6, '#c98a52'); heart(c, 54.6, 103.1, 1.3, '#e84a5a');
  // hoa dại
  const FL = P.dark ? ['#c8d0ff', '#a8b0f0'] : ['#ff7aa8', '#ffd84a', '#ffffff', '#c890ff', '#7ac8ff'];
  for (let i = 0; i < 120; i++) { const x = rnd() * W, y = LK1 + 6 + rnd() * (H - LK1 - 6); if (Math.abs(x - 96) < 46 && y > 104 && y < 140) continue; circ(c, x, y, 0.5 + rnd() * 0.4, FL[Math.floor(rnd() * FL.length)]); }
}, K);
function campLive(c: Ctx, t: number, ph: Phase, K: number) {
  const P = CPAL[ph];
  c.drawImage(campStatic(ph, K), 0, 0, W, H);
  if (P.dark) {
    for (let i = 0; i < 40; i++) { const a = 0.5 + 0.5 * Math.sin(t * (1 + rr(i, 3) * 2) + i); c.globalAlpha = a; const x = rr(i, 1) * W, y = rr(i, 2) * 48; if (rr(i, 4) < 0.22) twinkle(c, x, y, 1.2 * a + 0.4, '#fff6d8'); else R(c, x, y, 0.5, 0.5, '#ffffff'); c.globalAlpha = 1; }
    // sao băng thỉnh thoảng
    const q = (t % 9) / 1.1; if (q < 1) { const x = 30 + ((Math.floor(t / 9) * 53) % 120) + q * 30, y = 6 + q * 12; c.globalAlpha = 1 - q; line(c, x - 10, y - 4, x, y, 0.5, '#fffbe8'); glow(c, x, y, 3, '#ffffff', 0.8); c.globalAlpha = 1; }
    // trăng và bóng trăng trên hồ
    glow(c, 156, 16, 30, '#d8e0ff', 0.45); circ(c, 156, 16, 6, '#fff6d8'); circ(c, 158.6, 14.4, 5.2, P.sky[0]);
  }
  const sun = ph === 'sunset' ? [60, 54] : ph === 'dawn' ? [130, 52] : ph === 'day' ? [40, 14] : null;
  if (sun) { c.save(); c.beginPath(); c.rect(0, 0, W, LK0); c.clip(); glow(c, sun[0], sun[1], 50, ph === 'day' ? '#fff6c8' : '#ffc080', 0.6); glow(c, sun[0], sun[1], 16, '#ffffff', 0.6); circ(c, sun[0], sun[1], ph === 'day' ? 6 : 9, ph === 'day' ? '#fff6c0' : '#ffe0a0');
    c.globalAlpha = 0.08; for (let k = 0; k < 10; k++) { const a = t * 0.05 + k * TAU / 10; poly(c, [sun[0], sun[1], sun[0] + Math.cos(a) * 140, sun[1] + Math.sin(a) * 140, sun[0] + Math.cos(a + 0.13) * 140, sun[1] + Math.sin(a + 0.13) * 140], '#fffbe0'); } c.globalAlpha = 1; c.restore(); }
  if (!P.dark) for (let k = 0; k < 5; k++) { const w = 20 + (k % 3) * 9, x = ((k * 51 + t * (1 + k * 0.3)) % (W + 60)) - 40, y = 8 + (k % 3) * 9; cloud(c, x, y, w, ph === 'day' ? '#ffffff' : ph === 'sunset' ? '#ffb8a8' : '#ffd8e8', ph === 'day' ? '#dceeff' : '#b8609a'); }
  // vệt sáng trên hồ dưới mặt trời/trăng
  const src = P.dark ? 156 : sun ? sun[0] : null;
  if (src !== null) for (let k = 0; k < 14; k++) { const y = LK0 + 1.5 + k * 1.2, w = (2 + k * 0.6) * (0.6 + 0.4 * Math.sin(t * 3 + k * 1.9)); c.globalAlpha = 0.5 + 0.4 * Math.sin(t * 4 + k); R(c, src + Math.sin(t * 1.5 + k * 2) * (1 + k * 0.3) - w / 2, y, w, 0.5, P.dark ? '#fff6d8' : '#fff0c0'); c.globalAlpha = 1; }
  // đôi thiên nga trắng lượn trên hồ — cổ cong thành hình trái tim
  { const x = 96 + Math.sin(t * 0.12) * 14, y = 72 + Math.sin(t * 0.2) * 1; for (const d of [-1, 1]) { const bx = x + d * 4.5; ell(c, bx, y, 3, 1.4, P.dark ? '#c8d0e8' : '#ffffff'); ell(c, bx + d * 1.6, y - 0.8, 1.6, 0.9, P.dark ? '#b0b8d8' : '#f0f0f8');
    c.strokeStyle = P.dark ? '#c8d0e8' : '#ffffff'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(bx - d * 1.6, y - 0.5); c.bezierCurveTo(bx - d * 2.8, y - 4, bx - d * 0.6, y - 7, bx - d * 3.4, y - 6.4); c.stroke(); R(c, bx - d * 3.4 - (d > 0 ? 1 : 0), y - 6.6, 1, 0.6, '#ff8a3a'); }
    R(c, x - 9, y + 1.3, 18, 0.4, '#ffffff60'); if (Math.sin(t * 0.8) > 0.6) heart(c, x, y - 11 - (t % 2), 1.2, '#ff8ab0'); }
  // sương lãng đãng trên mặt hồ
  c.globalAlpha = P.dark ? 0.14 : 0.2; for (let k = 0; k < 6; k++) { const x = ((k * 47 + t * 2.4) % (W + 60)) - 30; ell(c, x, LK0 + 3 + (k % 3) * 4, 26, 2, P.dark ? '#a0a8d8' : '#ffffff'); } c.globalAlpha = 1;
  // ánh lửa trại hắt lên mặt đất, chập chờn
  const fl = 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 6.7);
  glow(c, 96, 118, 70 * fl, '#ff9a40', 0.18 + P.warm * 0.32); glow(c, 96, 120, 26 * fl, '#ffd080', 0.2 + P.warm * 0.3);
  // khói bay lên
  for (let k = 0; k < 6; k++) { const q = (t * 0.18 + k / 6) % 1; c.globalAlpha = (1 - q) * 0.25; circ(c, 96 + Math.sin(q * 6 + k) * 4 + q * 10, 104 - q * 60, 2 + q * 7, P.dark ? '#8a8a9a' : '#e8e4e0'); c.globalAlpha = 1; }
  // dây đèn từ rặng thông sang lều, lều sang thông bên phải
  const lit = P.dark ? 1 : ph === 'sunset' ? 0.8 : ph === 'dawn' ? 0.4 : 0;
  bulbs(c, 26, 66, 150, 70, 9, 18, t, lit); bulbs(c, 158, 69, 190, 68, 4, 6, t, lit);
  // đèn lồng thuỷ tinh quanh khu lửa trại & chăn picnic
  for (const [x, y, k] of [[136, 108, 0], [178, 108, 1], [48, 122, 2], [144, 124, 3], [26, 94, 4]] as const) lantern(c, x, y, Math.max(lit, 0.3), t, k);
  // nai con ra uống nước (ngày / bình minh)
  if (!P.dark) { const x = 176, y = 82; ell(c, x, y - 3, 3.5, 1.8, '#b0703a'); R(c, x - 2.5, y - 1.5, 0.7, 3, '#8a5028'); R(c, x + 2, y - 1.5, 0.7, 3, '#8a5028'); const dip = Math.max(0, Math.sin(t * 0.6)) * 2; ell(c, x - 4, y - 4 + dip, 1.4, 1.1, '#b0703a'); R(c, x - 4.6, y - 6 + dip, 0.4, 1.4, '#8a5028'); for (let k = 0; k < 3; k++) R(c, x - 1.5 + k * 1.2, y - 3.6, 0.5, 0.5, '#fff1d8'); }
  // bướm ngày
  if (!P.dark) for (let k = 0; k < 3; k++) { const x = 96 + Math.sin(t * 0.6 + k * 2) * 60, y = 96 + Math.sin(t * 1.2 + k) * 10, f = Math.abs(Math.sin(t * 12 + k)); const col = ['#ff8ab0', '#ffd84a', '#c890ff'][k]; ell(c, x - 0.9, y, 1.1 * f + 0.2, 1, col); ell(c, x + 0.9, y, 1.1 * f + 0.2, 1, col); }
  vignette(c, P.dark ? 0.5 : 0.22);
}
function campFront(c: Ctx, t: number, ph: Phase) {
  const P = CPAL[ph];
  // dương xỉ & cỏ lau hai góc dưới, đung đưa
  for (const [bx, n] of [[0, 9], [W, 9]] as const) for (let k = 0; k < n; k++) { const x = bx + (bx ? -1 : 1) * (k * 2.6), h = 8 + rr(k + bx, 2) * 10, sw = Math.sin(t * 1.4 + k * 0.8) * 1.5;
    c.strokeStyle = P.dark ? '#16302a' : '#3e7a44'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + sw * 0.5, H - h * 0.6, x + sw + (bx ? -2 : 2), H - h); c.stroke(); if (k % 3 === 0) ell(c, x + sw + (bx ? -2 : 2), H - h - 1, 0.9, 2, P.dark ? '#5a5a3a' : '#d8c890'); }
  // đom đóm & hạt sáng
  if (P.dark || ph === 'sunset') for (let k = 0; k < 18; k++) { const x = (rr(k, 9) * W + Math.sin(t * 0.3 + k) * 12 + W) % W, y = 64 + rr(k, 10) * 76 + Math.sin(t * 0.5 + k * 2) * 6, a = 0.5 + 0.5 * Math.sin(t * 2 + k * 1.3); glow(c, x, y, 3 + a * 2, '#fff7a8', a * 0.7); circ(c, x, y, 0.4, '#ffffff'); }
  // tàn lửa bay lên từ đống lửa
  for (let k = 0; k < 10; k++) { const q = (t * 0.5 + rr(k, 4)) % 1; c.globalAlpha = 1 - q; R(c, 96 + Math.sin(q * 8 + k) * 6, 112 - q * 50, 0.6, 0.6, k % 2 ? '#ffd060' : '#ff8a3a'); c.globalAlpha = 1; }
}
export function CampGlam({ phase }: { phase: Phase }) {
  return <><Glam z={0} draw={(c, t, K) => campLive(c, t, phase, K)} /><Glam z={140} draw={(c, t) => campFront(c, t, phase)} /></>;
}

// ═════════ GHẾ DÀI NGẮM BIỂN — thêm nét lãng mạn ═════════
const { horizon: LH, shore: LS } = LOUNGE;
function loungeSand(c: Ctx, t: number, ph: Phase) {
  const dark = ph === 'night', lit = dark ? 1 : ph === 'sunset' || ph === 'dawn' ? 0.75 : 0;
  // trái tim xếp bằng cánh hồng trên cát giữa hai ghế + nến tealight viền quanh
  const cx = 96, cy = 106;
  for (let k = 0; k < 60; k++) { const a = (k / 60) * TAU, x = 16 * Math.sin(a) ** 3, y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); petal(c, cx + x * 0.5, cy + y * 0.32, a * 3, k % 3 ? '#e8204a' : '#ff6a8a'); }
  for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU, x = cx + 16 * Math.sin(a) ** 3 * 0.66, y = cy - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 0.42;
    const fl = 0.8 + 0.2 * Math.sin(t * 10 + k * 2); if (lit) glow(c, x, y - 1, 4, '#ffc860', lit * 0.55 * fl); R(c, x - 0.8, y - 0.6, 1.6, 1, '#f4f0e8'); if (lit) ell(c, x, y - 1.3, 0.35 * fl, 0.7 * fl, '#ffb040'); }
  // cánh hoa rải rác + hoa sứ trắng trên cát
  for (let k = 0; k < 26; k++) petal(c, 30 + rr(k, 1) * 132, LS + 4 + rr(k, 2) * 18, rr(k, 3) * 6, rr(k, 4) < 0.5 ? '#ff5a8a' : '#ffb0c8');
  for (const [x, y] of [[40, 108], [150, 110], [60, 114], [134, 104]] as const) { for (let j = 0; j < 5; j++) ell(c, x + Math.cos(j * 1.256) * 1.1, y + Math.sin(j * 1.256) * 0.7, 0.9, 0.5, '#fffbf0', j * 1.256); circ(c, x, y, 0.5, '#ffd84a'); }
  // đèn lồng cắm dọc mép sóng
  for (const [x, y, k] of [[34, 104, 0], [52, 101, 1], [142, 101, 2], [160, 104, 3]] as const) lantern(c, x, y, lit, t, k);
}
function loungeSky(c: Ctx, t: number, ph: Phase) {
  const dark = ph === 'night', lit = dark ? 1 : ph === 'sunset' || ph === 'dawn' ? 0.8 : 0.15;
  // dây đèn võng ngang trời (từ tàu dừa hai góc)
  bulbs(c, -4, 10, 98, 14, 8, 14, t, lit); bulbs(c, 94, 14, 196, 10, 8, 14, t, lit);
  // đèn trời (đêm / hoàng hôn) bay lên chầm chậm từ phía bãi xa
  if (dark || ph === 'sunset') for (let k = 0; k < 5; k++) { const q = ((t * 0.02 + rr(k, 1)) % 1), x = 20 + rr(k, 2) * 150 + Math.sin(t * 0.5 + k) * 4, y = LH + 4 - q * (LH + 10), sc = 1.4 - q * 0.8;
    c.globalAlpha = Math.min(1, (1 - q) * 2); glow(c, x, y, 7 * sc, '#ffb04a', 0.6); R(c, x - 1.4 * sc, y - 2 * sc, 2.8 * sc, 3.4 * sc, '#ffd27a'); R(c, x - 1.4 * sc, y + 1.2 * sc, 2.8 * sc, 0.4 * sc, '#ff8a3a'); c.globalAlpha = 1; }
  // hải âu chao liệng (ngày) / tim lấp lánh (đêm)
  if (!dark) for (let k = 0; k < 3; k++) { const x = ((k * 67 + t * (4 + k)) % (W + 20)) - 10, y = 22 + k * 6 + Math.sin(t + k) * 3, f = Math.sin(t * 6 + k) * 1.2; line(c, x - 2.5, y - f, x, y, 0.5, '#4a4a5a'); line(c, x, y, x + 2.5, y - f, 0.5, '#4a4a5a'); }
  else for (let k = 0; k < 6; k++) { const a = Math.sin(t * 1.3 + k * 1.7); if (a > 0.5) { c.globalAlpha = (a - 0.5) * 2; heart(c, 20 + rr(k, 6) * 150, 8 + rr(k, 7) * 30, 1, '#ffc6dc'); c.globalAlpha = 1; } }
}
export function LoungeLove({ phase }: { phase: Phase }) {
  return <><Glam z={100} draw={(c, t) => loungeSand(c, t, phase)} /><Glam z={140} draw={(c, t) => loungeSky(c, t, phase)} /></>;
}

function vignette(c: Ctx, a: number) {
  const g = c.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, H * 0.95); g.addColorStop(0, '#00000000'); g.addColorStop(1, `rgba(20,8,30,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
}

// ═════════ VƯỜN NHÀ THEO MÙA THẬT (xuân anh đào · hạ đom đóm, dưa hấu · thu lá phong, nướng khoai · đông tuyết, người tuyết) ═════════
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export const seasonOf = (month: number): Season => (month >= 3 && month <= 5 ? 'spring' : month >= 6 && month <= 8 ? 'summer' : month >= 9 && month <= 11 ? 'autumn' : 'winter');
/** box: vùng vườn trong bản đồ làng (toạ độ cảnh) */
export function GardenSeason({ month, dark, box }: { month: number; dark: boolean; box: [number, number, number, number] }) {
  const se = seasonOf(month), [, , bw, bh] = box;
  const ground = (c: Ctx) => {
    if (se === 'winter') { c.globalAlpha = 0.55; for (let k = 0; k < 90; k++) ell(c, rr(k, 1) * bw, 14 + rr(k, 2) * (bh - 16), 6 + rr(k, 3) * 10, 2 + rr(k, 4) * 2, '#f4f8ff'); c.globalAlpha = 1; }
    if (se === 'autumn') for (let k = 0; k < 70; k++) ell(c, rr(k, 5) * bw, 14 + rr(k, 6) * (bh - 16), 1.2, 0.7, ['#e8603a', '#f6a83a', '#c83a2a', '#d88a3a'][k % 4], rr(k, 7) * 3);
    if (se === 'spring') for (let k = 0; k < 60; k++) petal(c, rr(k, 8) * bw, 14 + rr(k, 9) * (bh - 16), rr(k, 10) * 3, k % 3 ? '#ffb0c8' : '#ffffff');
  };
  const front = (c: Ctx, t: number) => {
    const R0 = bw - 14, B0 = 14;
    if (se === 'spring') {
      c.strokeStyle = '#6a4a3a'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(bw * 0.4, 12, bw * 0.75, 4); c.stroke();
      for (let k = 0; k < 40; k++) { const u = k / 39, x = u * bw * 0.75, y = 2 + Math.sin(u * Math.PI) * 7 + (rr(k, 1) - 0.5) * 6; circ(c, x, y, 1.6 + rr(k, 2), k % 4 ? '#ffc0d4' : '#ffffff'); circ(c, x - 0.4, y - 0.4, 0.5, '#ff8ab0'); }
      for (let k = 0; k < 24; k++) { const sp = 6 + rr(k, 3) * 6, x = (rr(k, 4) * bw + t * sp) % bw, y = (rr(k, 5) * bh + t * sp * 0.5 + Math.sin(t + k) * 3) % bh; petal(c, x, y, t * 2 + k, k % 3 ? '#ffb0c8' : '#ffffff'); }
      for (let k = 0; k < 3; k++) { const x = bw * 0.5 + Math.sin(t * 0.6 + k * 2) * bw * 0.4, y = bh * 0.5 + Math.sin(t * 1.1 + k) * bh * 0.3, f = Math.abs(Math.sin(t * 12 + k)); const col = ['#ffd84a', '#ff8ab0', '#ffffff'][k]; ell(c, x - 0.9, y, 1.1 * f + 0.2, 1, col); ell(c, x + 0.9, y, 1.1 * f + 0.2, 1, col); }
    } else if (se === 'summer') {
      ell(c, R0, B0, 8, 2.4, '#ffffff'); for (let k = 0; k < 3; k++) { const x = R0 - 5 + k * 5; poly(c, [x - 2.4, B0 - 0.5, x + 2.4, B0 - 0.5, x, B0 - 5], '#3a9a3a'); poly(c, [x - 2, B0 - 1, x + 2, B0 - 1, x, B0 - 4.6], '#ff4a5a'); R(c, x - 0.2, B0 - 2.6, 0.4, 0.4, '#1a1a1a'); }
      if (dark) for (let k = 0; k < 22; k++) { const x = (rr(k, 9) * bw + Math.sin(t * 0.3 + k) * 10 + bw) % bw, y = rr(k, 10) * bh + Math.sin(t * 0.5 + k * 2) * 5, a = 0.5 + 0.5 * Math.sin(t * 2 + k * 1.3); glow(c, x, y, 3 + a * 2, '#fff7a8', a * 0.8); circ(c, x, y, 0.4, '#ffffff'); }
      else for (let k = 0; k < 3; k++) { const x = bw * 0.5 + Math.sin(t * 0.4 + k * 2.4) * bw * 0.42, y = 20 + Math.sin(t * 0.9 + k) * 14; R(c, x - 2.5, y, 5, 0.6, '#3a8ae8'); ell(c, x - 1, y - 0.8, 1.6, 0.6, '#d8f0ff'); ell(c, x + 1, y - 0.8, 1.6, 0.6, '#d8f0ff'); }
    } else if (se === 'autumn') {
      for (let k = 0; k < 26; k++) { const sp = 7 + rr(k, 3) * 6, x = (rr(k, 4) * bw + t * sp * 0.6) % bw, y = (rr(k, 5) * bh + t * sp) % bh; ell(c, x, y, 1.4, 0.8, ['#e8603a', '#f6a83a', '#c83a2a'][k % 3], t * 2 + k); }
      for (let k = 0; k < 14; k++) ell(c, R0 - 8 + (k % 5) * 3, B0 + 2 - Math.floor(k / 5) * 1.6, 1.8, 1, ['#e8603a', '#f6a83a', '#c83a2a', '#d88a3a'][k % 4]);
      const fl = 0.8 + 0.2 * Math.sin(t * 11); glow(c, R0 + 4, B0 - 1, 10, '#ff9a3a', 0.5); for (let k = 0; k < 4; k++) poly(c, [R0 + 1 + k * 2, B0, R0 + 2 + k * 2, B0 - (3 + (k % 2) * 2) * fl, R0 + 3 + k * 2, B0], k % 2 ? '#ffb030' : '#ff5a1a');
      ell(c, R0 + 1, B0 + 1, 1.8, 1, '#8a3a5a'); ell(c, R0 + 6, B0 + 1, 1.8, 1, '#8a3a5a');
      for (let k = 0; k < 3; k++) { const q = (t * 0.3 + k / 3) % 1; c.globalAlpha = (1 - q) * 0.3; circ(c, R0 + 4 + Math.sin(q * 6) * 2, B0 - 6 - q * 18, 1.5 + q * 3, '#d8d0c8'); c.globalAlpha = 1; }
    } else {
      const x = R0, y = B0; circ(c, x, y - 2, 4.6, '#f8fbff'); circ(c, x, y - 8.6, 3.2, '#ffffff'); R(c, x - 2.6, y - 13.6, 5.2, 1, '#2a2a3a'); R(c, x - 1.8, y - 16.4, 3.6, 2.8, '#2a2a3a'); R(c, x - 3.2, y - 6.2, 6.4, 1.2, '#e8303a'); R(c, x + 1.6, y - 6.2, 1.2, 3, '#e8303a');
      R(c, x - 1.2, y - 9.4, 0.6, 0.6, '#1a1a1a'); R(c, x + 0.6, y - 9.4, 0.6, 0.6, '#1a1a1a'); poly(c, [x, y - 8.4, x + 2.6, y - 8, x, y - 7.6], '#ff8a3a'); for (let k = 0; k < 3; k++) R(c, x - 0.3, y - 4 + k * 1.6, 0.6, 0.6, '#2a2a3a');
      line(c, x - 4, y - 4, x - 7, y - 7, 0.4, '#6a4a3a'); line(c, x + 4, y - 4, x + 7, y - 7, 0.4, '#6a4a3a');
      line(c, 0, 3, bw, 3, 0.3, '#3a3a3a');
      for (let k = 1; k < 16; k++) { const u = k / 16, xx = u * bw, yy = 3 + Math.sin(u * Math.PI) * 5, col = ['#fff1a8', '#ff8a9a', '#a8e0ff', '#a8ffb0'][k % 4], tw = 0.6 + 0.4 * Math.sin(t * 2.5 + k); if (dark) glow(c, xx, yy, 4, col, 0.6 * tw); circ(c, xx, yy, 0.6, col); }
      for (let k = 0; k < 50; k++) { const sp = 5 + rr(k, 1) * 7, xx = (rr(k, 2) * bw + Math.sin(t * 0.7 + k) * 5) % bw, yy = (rr(k, 3) * bh + t * sp) % bh; circ(c, xx, yy, 0.4 + rr(k, 4) * 0.5, '#ffffff'); }
    }
  };
  return <><Glam z={2} box={box} fps={4} draw={c => ground(c)} /><Glam z={300} box={box} draw={front} /></>;
}

// ═════════ BỒN TẮM: nến lung linh quanh thành bồn, cánh hồng & bọt nổi, hơi nước, ánh hồng ═════════
export function BathLove({ pts, water, on }: { pts: [number, number][]; water: [number, number, number, number]; on: boolean }) {
  const [wx, wy, ww, wh] = water;
  const draw = (c: Ctx, t: number) => {
    glow(c, wx + ww / 2, wy + wh / 2, 70, '#ff8ab0', 0.12);
    if (on) {
      c.save(); c.beginPath(); c.ellipse(wx + ww / 2, wy + wh / 2, ww / 2, wh / 2, 0, 0, TAU); c.clip();
      for (let k = 0; k < 26; k++) { const x = wx + rr(k, 1) * ww + Math.sin(t * 0.4 + k) * 2, y = wy + rr(k, 2) * wh + Math.cos(t * 0.3 + k) * 1; petal(c, x, y, t * 0.3 + k, k % 3 ? '#e8204a' : '#ff6a8a'); }
      for (let k = 0; k < 18; k++) { const x = wx + rr(k, 3) * ww, y = wy + rr(k, 4) * wh, r = 0.8 + rr(k, 5) * 1.4; c.strokeStyle = '#ffffffb0'; c.lineWidth = 0.3; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); R(c, x - r * 0.4, y - r * 0.5, 0.5, 0.5, '#ffffff'); }
      c.restore();
      for (let k = 0; k < 6; k++) { const q = (t * 0.2 + k / 6) % 1; c.globalAlpha = (1 - q) * 0.25; circ(c, wx + ww * (0.2 + (k % 3) * 0.3) + Math.sin(q * 5 + k) * 4, wy - q * 26, 3 + q * 6, '#ffffff'); c.globalAlpha = 1; }
      for (let k = 0; k < 4; k++) { const a = Math.sin(t * 1.2 + k * 1.6); if (a > 0.4) { c.globalAlpha = a - 0.4; heart(c, wx + ww * (0.2 + k * 0.2), wy - 10 - (t * 6 + k * 7) % 20, 1.2, '#ff8ab0'); c.globalAlpha = 1; } }
    }
    pts.forEach(([x, y], k) => { const fl = 0.8 + 0.2 * Math.sin(t * 10 + k * 2) * Math.sin(t * 6.3 + k); glow(c, x, y - 4, 12, '#ffc860', 0.45 * fl); R(c, x - 1.1, y - 3.4, 2.2, 3.4, '#fff4ec'); R(c, x - 1.1, y - 3.4, 2.2, 0.5, '#ffffff'); ell(c, x, y - 4.6, 0.6 * fl, 1.2 * fl, '#ffb040'); R(c, x - 0.2, y - 4.8, 0.4, 0.6, '#fff6c0'); });
  };
  return <Glam z={135} draw={draw} />;
}
