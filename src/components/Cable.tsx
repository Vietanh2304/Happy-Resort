// Cáp treo Nhật Nguyệt Đàm (Đài Trung): hai người ngồi chung cabin kính, đi tuyến thật từ làng Ita Thao bên hồ
// lên làng văn hoá thổ dân: cất lên trên mặt hồ xanh ngọc (đảo Lalu, thuyền rẽ sóng, miếu Văn Võ) → vượt rừng thông
// → lên đỉnh thấy biển mây, núi Trung Ương phủ tuyết trùng điệp, tháp Từ Ân → hạ xuống ga bên kia.
// Góc nhìn xa: cabin nhỏ giữa trời đất bao la, nhiều lớp núi mờ dần trong sương, cabin khác nối đuôi trên dây.
// Trong lúc đi: 📸 chụp ảnh (giữ tới 4 tấm), 👉 "Nhìn kìa!" chỉ cảnh cho người ấy (hai máy cùng thấy).
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterSprite, type AvatarLook } from '../lib/sprites';
import { bake, circ, cloud, ell, glow, line, poly, R, twinkle, type Ctx } from '../lib/canvasArt';
import { onEvent, sendEvent } from '../lib/realtime';

const W = 320, HH = 180, Z = 3, CX = 150, HOOK = 56, CS = 0.68, LEN = 1700, TAU = Math.PI * 2;
const BOARD = 7000, RIDE = 62000, ARRIVE = 4000;
export const CABLE_MS = BOARD + RIDE + ARRIVE;
/** lên cabin cùng người ấy được trong lúc cabin còn ở ga */
export const CABLE_JOIN = BOARD;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const img = (url: string) => { const i = new Image(); i.src = url; return i; };
/** độ cao cabin theo tiến độ s (0 ga Ita Thao → 1 ga làng thổ dân) */
const ALT: [number, number][] = [[0, 0], [0.16, 0.45], [0.36, 0.68], [0.55, 1], [0.72, 0.96], [0.9, 0.42], [1, 0.14]];
const altAt = (s: number) => { for (let i = 1; i < ALT.length; i++) if (s <= ALT[i][0]) { const [s0, a0] = ALT[i - 1], [s1, a1] = ALT[i]; return a0 + (a1 - a0) * ease((s - s0) / (s1 - s0)); } return ALT[ALT.length - 1][1]; };
const progress = (el: number) => clamp((el - BOARD) / RIDE);
const TOWERS = [0.1, 0.3, 0.5, 0.68, 0.86];
const CAB_COLS = ['#f6c445', '#4a8ae8', '#3aa86a', '#e86a9a', '#8a5ad8', '#f08a3a'];
/** cảnh để chỉ cho nhau xem (s: lúc cảnh ở gần cabin nhất) */
const SIGHTS = [
  { s: 0.13, name: '🏝️ Đảo Lalu giữa hồ — đảo thiêng của người Thao' },
  { s: 0.3, name: '⛩️ Miếu Văn Võ mái vàng bên hồ' },
  { s: 0.88, name: '🌲 Rừng thông bạt ngàn ngay dưới chân' },
  { s: 0.6, name: '☁️ Biển mây! Mình đang ở trên mây đó' },
  { s: 0.7, name: '🗼 Tháp Từ Ân trên đỉnh núi nhô khỏi mây' },
  { s: 0.8, name: '🏔️ Dãy núi Trung Ương phủ tuyết trùng điệp' },
  { s: 0.95, name: '🪶 Làng văn hoá thổ dân Cửu Tộc' },
];

// ───────── lớp núi vẽ sẵn (rộng 640, lặp liền mạch) ─────────
/** dãy núi: sườn đón nắng sáng, sườn khuất tối, đỉnh cao phủ tuyết */
const range = (c: Ctx, base: number, amp: number, col: string, shade: string, rnd: () => number, f: [number, number, number], snow?: string) => {
  const p = [rnd() * 9, rnd() * 9, rnd() * 9];
  const h = (x: number) => amp * (0.55 + 0.27 * Math.sin(TAU * f[0] * x / 640 + p[0]) + 0.13 * Math.sin(TAU * f[1] * x / 640 + p[1]) + 0.05 * Math.sin(TAU * f[2] * x / 640 + p[2]));
  for (let x = 0; x < 640; x++) {
    const y = base - h(x), lit = h(x + 4) >= h(x - 4);
    R(c, x, y, 1, 400, lit ? col : shade);
    if (snow && h(x) > amp * 0.7) R(c, x, y, 1, (h(x) - amp * 0.7) * 0.9 + 1, lit ? snow : '#d0d8ee');
  }
};
const farMts = () => bake('cable:far2', 640, 150, (c, rnd) => { range(c, 140, 112, '#b4c2de', '#9eadcc', rnd, [2, 7, 29], '#f6f9ff'); }, 3);
const bMts = () => bake('cable:b2', 640, 130, (c, rnd) => { range(c, 72, 56, '#8aa4c6', '#7894b8', rnd, [3, 9, 31]); for (let k = 0; k < 120; k++) R(c, rnd() * 640, 40 + rnd() * 80, 1, 1, '#7088ac'); }, 3);
const cMts = () => bake('cable:c2', 640, 130, (c, rnd) => { range(c, 62, 44, '#5f8c88', '#507c78', rnd, [4, 13, 41]); for (let k = 0; k < 420; k++) R(c, rnd() * 640, 30 + rnd() * 100, 1, 1, rnd() < 0.5 ? '#46726c' : '#6c9a92'); }, 3);
const forest = () => bake('cable:d2', 640, 120, (c, rnd) => {
  range(c, 42, 22, '#2f6a44', '#285c3a', rnd, [5, 17, 43]);
  for (let k = 0; k < 380; k++) { const x = rnd() * 640, h = 5 + rnd() * 6, y = 30 + rnd() * 90; for (let j = 0; j < h; j++) { const w = (j / h) * 2.6 + 0.3; R(c, x - w, y - h + j, w * 2, 1, j % 3 ? '#245a36' : '#3a7a4e'); } }
  for (let k = 0; k < 80; k++) circ(c, rnd() * 640, 34 + rnd() * 80, 1.5 + rnd() * 1.5, rnd() < 0.5 ? '#3a8a52' : '#4a9a5a');
}, 3);
const seaOfClouds = () => bake('cable:sea2', 640, 80, (c, rnd) => { R(c, 0, 26, 640, 54, '#f4f8fd'); for (let k = 0; k < 40; k++) { const x = rnd() * 640, y = 16 + rnd() * 22, w = 26 + rnd() * 52; for (const o of [0, -640]) cloud(c, x + o, y, w, '#ffffff', '#e0e8f4'); } for (let k = 0; k < 30; k++) R(c, rnd() * 600, 40 + rnd() * 36, 14 + rnd() * 30, 0.5, '#dfe7f2'); }, 3);

export function CableRide({ at: t0, me, mate, them, onExit }: { at: number; me: AvatarLook; mate: AvatarLook; them: AvatarLook | null; onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [lineTxt, setLine] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [say, setSay] = useState<{ text: string; until: number } | null>(null);
  const meKey = JSON.stringify(me);
  const looks = useMemo(() => [me, mate].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)), [meKey, JSON.stringify(mate)]); // eslint-disable-line react-hooks/exhaustive-deps
  const seats = useMemo(() => looks.map(l => (l !== me && !them) ? null : ({
    key: JSON.stringify(l), sit: img(characterSprite(l, 'sit').url), point: img(characterSprite(l, 'actsit', undefined, 'front', 1).url), yay: img(characterSprite(l, 'actsit', undefined, 'front', 12).url),
  })), [looks, !!them]); // eslint-disable-line react-hooks/exhaustive-deps
  const looking = useRef<{ by: string; k: number; at: number }[]>([]);
  const lookAt = (by: string, k: number) => { looking.current = [...looking.current.filter(l => l.by !== by), { by, k, at: Date.now() }]; setSay({ text: SIGHTS[k].name, until: Date.now() + 3500 }); };
  useEffect(() => onEvent('cb-look', (d: { at: number; by: string; k: number }) => { if (d.at === t0 && d.by !== meKey) lookAt(d.by, d.k); }), [t0, meKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const exitRef = useRef(onExit); exitRef.current = onExit;
  const snapRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!;
    let raf = 0, last = '', ended = false, autoSnap = false;
    // nhân vật vẽ nửa cỡ (mỗi điểm ảnh sprite = 1 điểm ảnh thật) cho cabin nhỏ giữa cảnh bao la
    const put = (im: HTMLImageElement, x: number, y: number) => { if (im.complete && im.height) ctx.drawImage(im, Math.round(x * Z) / Z, Math.round(y * Z) / Z, im.width / Z, im.height / Z); };
    snapRef.current = () => { const ph = document.createElement('canvas'); ph.width = 960; ph.height = 540; const pc = ph.getContext('2d')!; pc.imageSmoothingEnabled = false; pc.drawImage(c, 0, 0, W * Z, HH * Z, 0, 0, 960, 540); setPhotos(p => [...p.slice(-3), ph.toDataURL('image/jpeg', 0.88)]); };
    /** cabin: khung sơn màu, ô kính giữa (glass = màu kính, '' = trong suốt) */
    const cab = (x: number, y: number, sc: number, col: string, rot: number, glass: string) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc);
      R(ctx, -0.5, 0, 1, 9, '#4a4a5a'); R(ctx, -5, -1.5, 10, 3, '#3a3a4a'); circ(ctx, -3, 0, 1.2, '#2a2a3a'); circ(ctx, 3, 0, 1.2, '#2a2a3a');
      if (glass) { ctx.fillStyle = glass; ctx.beginPath(); ctx.roundRect(-18, 14, 36, 19, 4); ctx.fill(); R(ctx, -11, 22, 5, 11, '#00000030'); R(ctx, 3, 21, 5, 12, '#00000030'); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-20, 9, 40, 32, 6); ctx.roundRect(-18, 14, 36, 19, 4); ctx.fill('evenodd');
      R(ctx, -15, 10.5, 30, 0.5, '#ffffff50'); R(ctx, -15, 37, 30, 0.8, '#ffffff70');
      ctx.restore();
    };
    const frame = () => {
      const nowMs = Date.now(), el = nowMs - t0, t = el / 1000, s = progress(el), alt = altAt(s), wx = s * LEN;
      const pos: ({ x: number; y: number } | null)[] = SIGHTS.map(() => null);
      setNow(nowMs);
      ctx.setTransform(Z, 0, 0, Z, 0, 0); ctx.imageSmoothingEnabled = false;
      // trời: lên cao thì xanh thẫm hơn
      const sky = ctx.createLinearGradient(0, 0, 0, HH); sky.addColorStop(0, alt > 0.7 ? '#2f7ad8' : '#4a9aec'); sky.addColorStop(0.55, '#bfe0ff'); sky.addColorStop(1, '#f4faff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HH);
      const SX = 270, SY = 24;
      glow(ctx, SX, SY, 60, '#fff6d0', 0.6); glow(ctx, SX, SY, 22, '#ffffff', 0.8); circ(ctx, SX, SY, 7, '#fffbe8');
      // tia nắng xiên qua thung lũng
      ctx.globalAlpha = 0.06 + Math.sin(t * 0.4) * 0.015; for (let k = 0; k < 7; k++) poly(ctx, [SX, SY, SX - 260 + k * 34, HH, SX - 244 + k * 34, HH], '#fffbe0'); ctx.globalAlpha = 1;
      const tile = (cv2: HTMLCanvasElement, par: number, y: number, h: number) => { const off = ((wx * par) % 640 + 640) % 640; ctx.drawImage(cv2, -off, y, 640, h); ctx.drawImage(cv2, 640 - off, y, 640, h); };
      // mây ti trên cao + mây trôi
      for (let k = 0; k < 7; k++) { const x = ((k * 83 - wx * 0.03 - t * 1.2) % (W + 80) + W + 80) % (W + 80) - 40; cloud(ctx, x, 12 + (k % 3) * 9, 22 + (k % 2) * 14, '#ffffff', '#e6eef8'); }
      // ① dãy núi Trung Ương phủ tuyết (rất xa, rất cao)
      tile(farMts(), 0.025, -24 + alt * 8, 150);
      { const g = ctx.createLinearGradient(0, 50, 0, 120 + alt * 8); g.addColorStop(0, '#ffffff00'); g.addColorStop(1, '#eef5ffa8'); ctx.fillStyle = g; ctx.fillRect(0, 50, W, 80 + alt * 8); }
      pos[5] = { x: CX + 90, y: 34 + alt * 8 };
      // ② dãy núi xanh lam
      tile(bMts(), 0.06, 44 + alt * 16, 130);
      { const g = ctx.createLinearGradient(0, 90, 0, 132 + alt * 16); g.addColorStop(0, '#ffffff00'); g.addColorStop(1, '#e8f2fcb0'); ctx.fillStyle = g; ctx.fillRect(0, 90, W, 50 + alt * 16); }
      // ③ dãy núi xanh lục gần hơn
      tile(cMts(), 0.14, 66 + alt * 28, 130);
      // ④ rừng thông dưới chân
      const fy = 122 + alt * 28;
      tile(forest(), 0.6, fy, 120);
      pos[2] = { x: CX + 46, y: Math.min(HH - 10, fy + 40) };
      // hồ Nhật Nguyệt xanh ngọc nằm trong thung lũng: đảo Lalu, thuyền rẽ sóng, miếu Văn Võ, làng Ita Thao
      const lakeTop = 116 + alt * 30, lx = CX - wx * 0.5 - 60, lend = lx + 520;
      if (lend > -60 && lx - 60 < W) {
        const lg = ctx.createLinearGradient(0, lakeTop, 0, HH); lg.addColorStop(0, '#5ad0c4'); lg.addColorStop(0.4, '#2ab0aa'); lg.addColorStop(1, '#168498'); ctx.fillStyle = lg;
        ctx.beginPath(); ctx.moveTo(lx - 70, HH + 4); ctx.quadraticCurveTo(lx - 64, lakeTop + 10, lx - 30, lakeTop + 5); ctx.bezierCurveTo(lx + 120, lakeTop - 1, lx + 380, lakeTop - 2, lend - 30, lakeTop + 4); ctx.quadraticCurveTo(lend + 20, lakeTop + 16, lend + 60, HH + 4); ctx.fill();
        // bóng núi in mặt hồ + gợn sóng
        ctx.globalAlpha = 0.25; R(ctx, lx - 30, lakeTop + 3, 560, 4, '#3a7a70'); ctx.globalAlpha = 1;
        for (let k = 0; k < 70; k++) { const x = lx - 40 + (k * 53) % 560, y = lakeTop + 8 + (k * 17) % Math.max(8, HH - lakeTop - 8); R(ctx, x + Math.sin(t + k) * 1.5, y, 2 + (k % 4) * 2, 0.5, '#ffffff55'); }
        // nắng lấp lánh trên mặt hồ
        for (let k = 0; k < 16; k++) { const y = lakeTop + 5 + k * 3.2, x = SX - 30 + Math.sin(t * 2.2 + k * 1.7) * (3 + k * 0.6); if (x > lx - 30 && x < lend - 20 && y < HH) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 5 + k); R(ctx, x - 2 - k * 0.4, y, 4 + k * 0.8, 0.6, '#fffbe0'); ctx.globalAlpha = 1; } }
        // đảo Lalu
        const ix = lx + 170, iy = lakeTop + 10 + (HH - lakeTop) * 0.12;
        ell(ctx, ix, iy + 1, 13, 2, '#2a8a8a'); ell(ctx, ix, iy, 10, 2.5, '#5a9a5a'); for (let k = 0; k < 6; k++) circ(ctx, ix - 7 + k * 2.8, iy - 2, 1.6, k % 2 ? '#3a7a42' : '#4a8a4a'); R(ctx, ix - 1.5, iy - 5.5, 3, 2.5, '#f6f0e0'); poly(ctx, [ix - 2.5, iy - 5.5, ix, iy - 7.5, ix + 2.5, iy - 5.5], '#c83a2a');
        pos[0] = { x: ix, y: iy - 4 };
        // thuyền rẽ sóng
        for (let k = 0; k < 4; k++) { const bx = lx + 60 + k * 110 + ((t * 5 + k * 40) % 90), by = lakeTop + 9 + k * 6; if (bx > lend - 30) continue; R(ctx, bx - 3, by - 1, 6, 1.5, '#ffffff'); R(ctx, bx - 1, by - 2.5, 2, 1.5, k % 2 ? '#e84a3a' : '#4a8ae8'); for (let j = 1; j < 9; j++) { ctx.globalAlpha = 0.8 - j / 11; R(ctx, bx - 4 - j * 2, by + (j % 2 ? 0.5 : -0.5) * j * 0.3, 2, 0.5, '#ffffff'); } ctx.globalAlpha = 1; }
        // miếu Văn Võ trên sườn bờ xa
        const tx = lx + 330, ty = lakeTop - 1;
        ctx.fillStyle = '#4f7c68'; ctx.beginPath(); ctx.moveTo(tx - 30, ty + 3); ctx.quadraticCurveTo(tx, ty - 10, tx + 30, ty + 3); ctx.fill();
        R(ctx, tx - 6, ty - 6, 12, 5, '#c83a2a'); poly(ctx, [tx - 8.5, ty - 6, tx, ty - 10, tx + 8.5, ty - 6], '#f6c445'); R(ctx, tx - 4, ty - 13, 8, 3, '#c83a2a'); poly(ctx, [tx - 6, ty - 13, tx, ty - 16.5, tx + 6, ty - 13], '#f6c445'); for (let k = -1; k <= 1; k++) R(ctx, tx + k * 3.5 - 0.5, ty - 5, 1, 4, '#8a1a1a');
        pos[1] = { x: tx, y: ty - 12 };
        // làng Ita Thao ven hồ
        for (let k = 0; k < 7; k++) { const hx = lx - 44 + k * 11, hy = lakeTop + 4 + (k % 2); R(ctx, hx, hy - 5, 9, 5, ['#f4ecdc', '#e8d8c0', '#f8f0e8'][k % 3]); poly(ctx, [hx - 1, hy - 5, hx + 4.5, hy - 8, hx + 10, hy - 5], ['#c84a3a', '#5a6a8a', '#8a5a3a'][k % 3]); R(ctx, hx + 3, hy - 3.5, 2, 2, '#8ac8ff'); }
      }
      // biển mây khi lên cao: dãy núi gần chìm trong mây, chỉ còn đỉnh nhô lên
      const cloudA = clamp((alt - 0.7) / 0.2);
      if (cloudA > 0) { ctx.globalAlpha = cloudA; tile(seaOfClouds(), 0.3, 108 + (1 - cloudA) * 34, 80); ctx.globalAlpha = 1; pos[3] = { x: CX + 60, y: 128 }; }
      // tháp Từ Ân trên đỉnh núi nhô khỏi mây
      { const x = CX + (0.72 - s) * LEN * 0.2, y = 92 + alt * 28;
        if (x > -40 && x < W + 40) {
          ctx.fillStyle = '#577f7a'; ctx.beginPath(); ctx.moveTo(x - 40, y + 34); ctx.quadraticCurveTo(x - 10, y + 2, x, y); ctx.quadraticCurveTo(x + 10, y + 2, x + 40, y + 34); ctx.fill();
          ctx.fillStyle = '#4c726e'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y + 2, x + 40, y + 34); ctx.lineTo(x + 8, y + 34); ctx.fill();
          for (let k = 0; k < 9; k++) { const w = 5 - k * 0.38; R(ctx, x - w / 2, y - 2 - k * 2.4, w, 1.7, '#e8dcc0'); R(ctx, x - w / 2 - 0.8, y - 2 - k * 2.4 + 1.5, w + 1.6, 0.7, '#8a5a3a'); } R(ctx, x - 0.25, y - 26, 0.5, 3, '#c8a050');
          if (cloudA > 0) { ctx.globalAlpha = cloudA * 0.9; cloud(ctx, x - 44 + Math.sin(t * 0.3) * 4, y + 22, 50, '#ffffff', '#e6eef8'); cloud(ctx, x + 6 - Math.sin(t * 0.3) * 4, y + 26, 44, '#ffffff', '#e6eef8'); ctx.globalAlpha = 1; }
          pos[4] = { x, y: y - 18 };
        } }
      // đại bàng lượn
      for (let k = 0; k < 3; k++) { const x = ((k * 130 + t * 12 - wx * 0.4) % (W + 60) + W + 60) % (W + 60) - 30, y = 80 + k * 18 + Math.sin(t * 0.8 + k) * 6, f = Math.sin(t * 3 + k) * 1.5; line(ctx, x - 4, y - f, x, y, 0.7, '#3a2a2a'); line(ctx, x, y, x + 4, y - f, 0.7, '#3a2a2a'); R(ctx, x - 0.5, y - 0.5, 1.5, 1, '#3a2a2a'); }
      // dây cáp: dây mình đi qua móc treo cabin, dây chiều về thấp hơn chút phía sau
      const slope = (altAt(Math.min(1, s + 0.01)) - altAt(Math.max(0, s - 0.01))) / 0.02;
      const cableY = (x: number) => HOOK - (x - CX) * slope * 0.12;
      // ga đi / ga đến
      for (const [gs, name] of [[0, 'Ita Thao'], [1, 'Cửu Tộc']] as const) {
        const x = CX + (gs - s) * LEN; if (x < -110 || x > W + 110) continue;
        const cy = cableY(x);
        ctx.fillStyle = '#4f7f58'; ctx.beginPath(); ctx.moveTo(x - 110, HH + 2); ctx.quadraticCurveTo(x - 60, cy + 40, x, cy + 44); ctx.quadraticCurveTo(x + 60, cy + 40, x + 110, HH + 2); ctx.fill();
        for (let k = 0; k < 14; k++) { const px = x - 70 + k * 11, py = cy + 52 + (k % 3) * 5; for (let j = 0; j < 7; j++) { const w = (j / 7) * 2.4 + 0.3; R(ctx, px - w, py - 7 + j, w * 2, 1, '#2f6a44'); } }
        R(ctx, x - 36, cy - 8, 72, 50, '#e8e0d0'); R(ctx, x - 33, cy - 5, 66, 30, '#cfc6b4');
        for (let k = 0; k < 5; k++) R(ctx, x - 31 + k * 13, cy + 29, 10, 10, '#8ac8e8');
        poly(ctx, [x - 42, cy - 8, x - 30, cy - 18, x + 30, cy - 18, x + 42, cy - 8], '#c84a3a'); R(ctx, x - 42, cy - 9, 84, 2, '#a83a2a');
        R(ctx, x - 19, cy - 16, 38, 6, '#2a4a6a'); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 4px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`🚡 ${name}`, x, cy - 11.6); ctx.textAlign = 'start';
        if (gs === 1) { // cột totem + nhà mái tranh của làng thổ dân
          for (let k = 0; k < 3; k++) { const px = x + 50 + k * 12, py = cy + 44 + k * 3; R(ctx, px, py - 16, 3, 16, '#8a5a3a'); for (let j = 0; j < 4; j++) R(ctx, px - 0.5, py - 15 + j * 4, 4, 1.2, ['#e84a3a', '#f6c445', '#2a2a2a', '#ffffff'][j]); }
          for (let k = 0; k < 2; k++) { const hx = x - 80 + k * 22, hy = cy + 52; R(ctx, hx, hy - 6, 14, 6, '#a8784a'); poly(ctx, [hx - 3, hy - 6, hx + 7, hy - 13, hx + 17, hy - 6], '#d8b86a'); }
          pos[6] = { x: x + 60, y: cy + 30 };
        }
      }
      // cột cáp: khung thép cao vút từ thung lũng lên
      for (const ts of TOWERS) {
        const x = CX + (ts - s) * LEN; if (x < -30 || x > W + 30) continue;
        const top = cableY(x) - 3;
        for (let y = top + 3; y < HH; y += 5) { const w = 1.5 + (y - top) * 0.035, w2 = 1.5 + (y + 5 - top) * 0.035; line(ctx, x - w, y, x + w2, y + 5, 0.5, '#8a8a9a'); line(ctx, x + w, y, x - w2, y + 5, 0.5, '#8a8a9a'); }
        line(ctx, x - 1.5, top, x - 1.5 - (HH - top) * 0.035, HH, 1, '#6a6a7a'); line(ctx, x + 1.5, top, x + 1.5 + (HH - top) * 0.035, HH, 1, '#6a6a7a');
        R(ctx, x - 8, top - 1.5, 16, 2, '#5a5a6a'); R(ctx, x - 7, top + 5, 14, 1.5, '#5a5a6a'); circ(ctx, x - 5, top - 1.5, 1, '#3a3a4a'); circ(ctx, x + 5, top - 1.5, 1, '#3a3a4a');
        if (Math.floor(t * 1.5) % 2) circ(ctx, x, top - 4, 0.8, '#ff3a3a');
      }
      // dây chiều về + cabin chiều về lướt ngược lại (nhỏ hơn chút vì ở phía sau)
      for (const dy of [7, 8.5]) line(ctx, 0, cableY(0) + dy, W, cableY(W) + dy, 0.5, '#5a5a6a');
      for (let k = 0; k < 3; k++) { const sp = W + 120, x = ((k * 150 + 60 - wx * 2) % sp + sp) % sp - 60; if (s > 0.02 && s < 0.98) cab(x, cableY(x) + 7.5, CS * 0.75, CAB_COLS[(k + 3) % CAB_COLS.length], Math.sin(t * 1.1 + k) * 0.03, '#8ab8d8'); }
      // dây mình đi + cabin nối đuôi phía trước/sau (cùng dây nên giữ nguyên khoảng cách)
      for (const dy of [0, 1.5]) line(ctx, 0, cableY(0) + dy, W, cableY(W) + dy, 0.7, '#3a3a4a');
      const sway = Math.sin(t * 1.3) * (el > BOARD && el < BOARD + RIDE ? 0.05 : 0.01) + slope * -0.02;
      for (const k of [-2, -1, 1, 2]) { const x = CX + k * 150; if (x < -30 || x > W + 30) continue; cab(x, cableY(x), CS, CAB_COLS[(k + 2) % CAB_COLS.length], sway * 0.8, '#9ac8e4'); }
      // ── cabin kính của hai đứa: lắc nhẹ, ngồi nhìn ra cửa ──
      cab(CX, HOOK, CS, '#c8303a', sway, '');
      const nowLook = looking.current.filter(l => nowMs - l.at < 3500);
      seats.forEach((p, i) => { if (!p) return; const pointing = nowLook.some(l => l.by === p.key), cheer = el > BOARD + RIDE; put(pointing ? p.point : cheer && Math.floor(t * 2 + i) % 2 ? p.yay : p.sit, CX - 11.5 + i * 10.5 + sway * 7, HOOK + 8.5 + Math.round(Math.sin(t * 1.3)) / Z); });
      ctx.save(); ctx.translate(CX, HOOK); ctx.rotate(sway); ctx.scale(CS, CS);
      ctx.globalAlpha = 0.16; ctx.fillStyle = '#c8f0ff'; ctx.beginPath(); ctx.roundRect(-18, 14, 36, 19, 4); ctx.fill(); ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.3; poly(ctx, [-14, 14, -10, 14, -16, 33, -18, 33], '#ffffff'); poly(ctx, [-6, 14, -4, 14, -10, 33, -11.5, 33], '#ffffff'); ctx.globalAlpha = 1;
      R(ctx, -0.5, 14, 1, 19, '#a8202a');
      ctx.fillStyle = '#c8303a'; ctx.beginPath(); ctx.roundRect(-20, 32, 40, 9, [0, 0, 6, 6]); ctx.fill(); R(ctx, -16, 35, 32, 0.8, '#f6c445'); R(ctx, -15, 10.5, 30, 0.5, '#e8505a');
      ctx.restore();
      // mũi tên chỉ cảnh
      for (const l of nowLook) {
        const q = (nowMs - l.at) / 3500, p = pos[l.k] ?? { x: CX + 70, y: 120 };
        const tx = Math.max(10, Math.min(W - 10, p.x)), ty = Math.max(12, Math.min(HH - 8, p.y));
        ctx.globalAlpha = 1 - q * 0.3; line(ctx, CX, HOOK + 17, tx, ty - 6, 0.6, '#ffe040'); poly(ctx, [tx - 3, ty - 8, tx + 3, ty - 8, tx, ty - 3 + Math.sin(nowMs / 120)], '#ffe040'); ctx.globalAlpha = 1;
        if (Math.floor(nowMs / 200) % 2) twinkle(ctx, tx + 5, ty - 10, 2, '#ffffff');
      }
      // ngọn thông sát mắt khi còn thấp
      if (alt < 0.3) for (let k = 0; k < 5; k++) { const x = ((k * 97 - wx * 1.2) % (W + 80) + W + 80) % (W + 80) - 40, h = 24 + (k % 2) * 10, base = HH + 6 + alt * 130; for (let j = 0; j < h; j++) { const w = (j / h) * 7 + 0.5; R(ctx, x - w, base - h + j, w * 2, 1, j % 3 ? '#1e4a2e' : '#2a5a3a'); } }
      const ln = el < BOARD ? `🚡 Cabin sắp rời ga Ita Thao… ${Math.ceil((BOARD - el) / 1000)}` : el < BOARD + RIDE * 0.16 ? '🚡 Cabin cất lên trên mặt hồ Nhật Nguyệt…' : el < BOARD + RIDE * 0.4 ? '🏞️ Toàn cảnh hồ xanh ngọc giữa núi non' : el < BOARD + RIDE * 0.55 ? '☁️ Cabin xuyên lên trên mây…' : el < BOARD + RIDE * 0.75 ? '🏔️ Biển mây — núi tuyết trùng điệp!' : el < BOARD + RIDE * 0.86 ? '🚡 Hạ dần qua rừng thông bạt ngàn…' : el < BOARD + RIDE ? '🪶 Sắp tới làng văn hoá Cửu Tộc…' : '🎉 Tới ga rồi!';
      if (ln !== last) { last = ln; setLine(ln); }
      if (!autoSnap && el > BOARD + RIDE * 0.62) { autoSnap = true; snapRef.current(); }
      if (!ended && el > CABLE_MS) { ended = true; setDone(true); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [t0, seats]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!done) return; const t = setTimeout(() => exitRef.current(), 20000); return () => clearTimeout(t); }, [done]);

  const el = now - t0, s = progress(el), riding = el > BOARD && el < BOARD + RIDE;
  // cảnh gần nhất phía trước để chỉ
  const near = SIGHTS.reduce((b, sg, k) => (Math.abs(sg.s - s) < Math.abs(SIGHTS[b].s - s) ? k : b), 0);
  const point = () => { lookAt(meKey, near); sendEvent('cb-look', { at: t0, by: meKey, k: near }); };
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return createPortal(
    <div className="coaster" onClick={stop} onPointerDown={stop} onMouseDown={stop} onTouchStart={stop}>
      <canvas ref={cv} width={W * Z} height={HH * Z} />
      {!done && lineTxt && <b className="coaster-line">{lineTxt}</b>}
      {!done && say && now < say.until && <b className="coaster-line cb-say">{say.text}</b>}
      {!done && riding && (
        <div className="dance-bar pot-bar bb-bar cb-bar">
          <div className="row center">
            <button className="btn bb-tap" onClick={point}>👉 Nhìn kìa!</button>
            <button className="btn bb-tap ghost" onClick={() => snapRef.current()}>📸 Chụp ({photos.length}/4)</button>
          </div>
        </div>
      )}
      {done && (
        <div className="coaster-end">
          <h3>🚡 Cáp treo Nhật Nguyệt Đàm</h3>
          <p>🎁 Móc khoá cabin cáp treo đã vào túi đồ!</p>
          <div className="cb-photos">{photos.map((p, i) => <a key={i} href={p} download={`cap-treo-${i + 1}.jpg`}><img src={p} alt={`Ảnh ${i + 1}`} /></a>)}</div>
          <p className="muted small-note">Bấm vào ảnh để lưu về máy</p>
          <div className="row"><button className="btn small" onClick={() => exitRef.current()}>🚶 Ra khỏi ga</button></div>
        </div>
      )}
      {!done && <button className="coaster-x btn small ghost" onClick={() => { if (confirm('Rời cabin giữa chừng?')) exitRef.current(); }}>✖</button>}
    </div>,
    document.body,
  );
}
