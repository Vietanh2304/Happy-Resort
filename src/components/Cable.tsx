// Cáp treo Nhật Nguyệt Đàm (Đài Trung): hai người ngồi chung cabin kính, đi tuyến thật từ làng Ita Thao bên hồ
// lên làng văn hoá thổ dân: cất lên trên mặt hồ xanh ngọc (đảo Lalu, thuyền rẽ sóng, miếu Văn Võ) → vượt rừng thông
// → lên đỉnh thấy biển mây, núi Trung Ương trùng điệp, tháp Từ Ân → hạ xuống ga bên kia.
// Trong lúc đi: 📸 chụp ảnh (giữ tới 4 tấm), 👉 "Nhìn kìa!" chỉ cảnh cho người ấy (hai máy cùng thấy).
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterSprite, type AvatarLook } from '../lib/sprites';
import { bake, circ, cloud, ell, glow, line, poly, R, twinkle, type Ctx } from '../lib/canvasArt';
import { onEvent, sendEvent } from '../lib/realtime';

const W = 320, HH = 180, Z = 2, CX = 160, CY = 52, LEN = 1700;
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
/** cảnh để chỉ cho nhau xem: vị trí theo tiến độ, độ sâu (parallax), cao trên màn */
const SIGHTS = [
  { s: 0.17, name: '🏝️ Đảo Lalu giữa hồ — đảo thiêng của người Thao', par: 0.45, y: 150 },
  { s: 0.3, name: '⛩️ Miếu Văn Võ mái vàng bên hồ', par: 0.45, y: 136 },
  { s: 0.45, name: '🌲 Rừng thông bạt ngàn ngay dưới chân', par: 0.8, y: 168 },
  { s: 0.6, name: '☁️ Biển mây! Mình đang ở trên mây đó', par: 0.6, y: 130 },
  { s: 0.7, name: '🗼 Tháp Từ Ân trên đỉnh núi xa', par: 0.3, y: 96 },
  { s: 0.8, name: '⛰️ Dãy núi Trung Ương trùng điệp', par: 0.12, y: 80 },
  { s: 0.95, name: '🪶 Làng văn hoá thổ dân Cửu Tộc', par: 0.6, y: 146 },
];

// ───────── lớp cảnh vẽ sẵn (rộng 640, lặp) ─────────
const ridge = (c: Ctx, w: number, base: number, amp: number, col: string, rnd: () => number, f = 1) => { const ph = rnd() * 9; for (let x = 0; x < w; x += 1) { const h = amp * (0.55 + 0.25 * Math.sin((x / 47 + ph) * f) + 0.15 * Math.sin((x / 13 + ph * 2) * f) + 0.05 * Math.sin(x / 3.7)); R(c, x, base - h, 1, h + 60, col); } };
const farMts = () => bake('cable:far', 640, 120, (c, rnd) => { ridge(c, 640, 70, 58, '#8aa8c8', rnd, 0.8); ridge(c, 640, 78, 44, '#7a9ab8', rnd); for (let k = 0; k < 40; k++) R(c, rnd() * 640, 20 + rnd() * 40, 6 + rnd() * 12, 0.5, '#ffffff40'); });
const midMts = () => bake('cable:mid', 640, 130, (c, rnd) => { ridge(c, 640, 70, 50, '#5a8a7a', rnd, 1.2); ridge(c, 640, 84, 40, '#4a7a62', rnd, 1.4); for (let k = 0; k < 260; k++) { const x = rnd() * 640, y = 50 + rnd() * 70; R(c, x, y, 1, 1, rnd() < 0.5 ? '#3a6a52' : '#6a9a7a'); } });
const forest = () => bake('cable:forest', 640, 90, (c, rnd) => {
  R(c, 0, 30, 640, 60, '#2a5a3a');
  for (let k = 0; k < 120; k++) { const x = rnd() * 640, h = 14 + rnd() * 18, y = 34 + rnd() * 40; for (let j = 0; j < h; j++) { const w = (j / h) * 7 + 0.5; R(c, x - w, y - h + j, w * 2, 1, j % 3 ? '#2e6a42' : '#3a7a4e'); } R(c, x - 0.5, y, 1, 3, '#4a3a2a'); }
  for (let k = 0; k < 60; k++) { const x = rnd() * 640, y = 20 + rnd() * 50; circ(c, x, y, 3 + rnd() * 3, rnd() < 0.5 ? '#3a8a52' : '#4a9a5a'); }
});
const clouds = () => bake('cable:clouds', 640, 70, (c, rnd) => { for (let k = 0; k < 26; k++) cloud(c, rnd() * 640 - 20, 20 + rnd() * 30, 40 + rnd() * 50, '#ffffff', '#dfe8f4'); R(c, 0, 40, 640, 30, '#f4f8fc'); });

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
    const put = (im: HTMLImageElement, x: number, y: number) => { if (im.complete && im.height) ctx.drawImage(im, Math.round(x), Math.round(y), im.width, im.height); };
    snapRef.current = () => { const ph = document.createElement('canvas'); ph.width = 512; ph.height = 288; const pc = ph.getContext('2d')!; pc.imageSmoothingEnabled = false; pc.drawImage(c, 0, 0, W * Z, HH * Z, 0, 0, 512, 288); setPhotos(p => [...p.slice(-3), ph.toDataURL('image/jpeg', 0.85)]); };
    const frame = () => {
      const nowMs = Date.now(), el = nowMs - t0, t = el / 1000, s = progress(el), alt = altAt(s), wx = s * LEN;
      setNow(nowMs);
      ctx.setTransform(Z, 0, 0, Z, 0, 0); ctx.imageSmoothingEnabled = false;
      // trời: lên cao thì xanh thẫm hơn
      const sky = ctx.createLinearGradient(0, 0, 0, HH); sky.addColorStop(0, alt > 0.7 ? '#3a8ae0' : '#5aa8f0'); sky.addColorStop(0.7, '#cfe8ff'); sky.addColorStop(1, '#f4faff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HH);
      glow(ctx, 262, 30, 40, '#fff6d0', 0.7); circ(ctx, 262, 30, 10, '#fffbe8');
      // tia nắng chéo
      ctx.globalAlpha = 0.07; for (let k = 0; k < 5; k++) poly(ctx, [262, 30, 262 - 200 + k * 30, 180, 262 - 180 + k * 30, 180], '#fffbe0'); ctx.globalAlpha = 1;
      const tile = (cv2: HTMLCanvasElement, par: number, y: number, h: number) => { const off = ((wx * par) % 640 + 640) % 640; ctx.drawImage(cv2, -off, y, 640, h); ctx.drawImage(cv2, 640 - off, y, 640, h); };
      // mây xa trôi
      for (let k = 0; k < 6; k++) { const x = ((k * 97 - wx * 0.05 - t * 1.5) % (W + 80) + W + 80) % (W + 80) - 40; cloud(ctx, x, 18 + (k % 3) * 10, 30 + (k % 2) * 16, '#ffffff', '#e6eef8'); }
      // dãy núi xa → núi gần (càng lên cao càng thấy núi thấp xuống, mở ra toàn cảnh)
      tile(farMts(), 0.08, 38 + alt * 18, 120);
      tile(midMts(), 0.18, 70 + alt * 42, 130);
      // tháp Từ Ân trên đỉnh núi (xa)
      { const x = 0.7 * LEN * 0.3 - wx * 0.3 + 160, y = 86 + alt * 42; if (x > -20 && x < W + 20) { for (let k = 0; k < 9; k++) { const w = 7 - k * 0.5; R(ctx, x - w / 2, y - k * 3.2, w, 2.2, '#d8c8a8'); R(ctx, x - w / 2 - 1, y - k * 3.2 + 2, w + 2, 1, '#8a5a3a'); } R(ctx, x - 0.5, y - 32, 1, 4, '#c8a050'); } }
      // hồ Nhật Nguyệt xanh ngọc (chỉ đoạn đầu): đảo Lalu, thuyền rẽ sóng, miếu Văn Võ
      const lakeY = 118 + alt * 70, lx = -wx * 0.45;
      if (lx > -900) {
        const lg = ctx.createLinearGradient(0, lakeY, 0, lakeY + 60); lg.addColorStop(0, '#3ab8b0'); lg.addColorStop(1, '#1a8a98'); ctx.fillStyle = lg;
        ctx.beginPath(); ctx.moveTo(lx - 40, lakeY + 4); ctx.bezierCurveTo(lx + 200, lakeY - 6, lx + 520, lakeY + 2, lx + 760, lakeY + 10); ctx.lineTo(lx + 760, HH + 40); ctx.lineTo(lx - 40, HH + 40); ctx.fill();
        for (let k = 0; k < 50; k++) { const x = lx + (k * 37) % 760, y = lakeY + 8 + (k * 13) % 50; R(ctx, x, y, 4 + (k % 3) * 3, 0.5, '#ffffff60'); }
        const ix = lx + 0.17 * LEN * 0.45 + 160 - 50, iy = lakeY + 22; ell(ctx, ix, iy, 14, 4, '#5a9a5a'); ell(ctx, ix, iy - 1.5, 10, 3, '#6aaa62'); for (let k = 0; k < 5; k++) circ(ctx, ix - 8 + k * 4, iy - 3, 2, '#3a7a42'); R(ctx, ix - 2, iy - 8, 4, 4, '#f6f0e0'); poly(ctx, [ix - 4, iy - 8, ix, iy - 11, ix + 4, iy - 8], '#c83a2a');
        for (let k = 0; k < 3; k++) { const bx = lx + 120 + k * 150 + ((t * 6 + k * 40) % 120), by = lakeY + 14 + k * 9; R(ctx, bx - 5, by - 2, 10, 3, '#ffffff'); R(ctx, bx - 2, by - 4, 4, 2, '#4a8ae8'); for (let j = 1; j < 8; j++) { ctx.globalAlpha = 1 - j / 8; R(ctx, bx - 6 - j * 3, by + (j % 2 ? 1 : -1) * j * 0.4, 3, 0.5, '#ffffff'); } ctx.globalAlpha = 1; }
        const tx = lx + 0.3 * LEN * 0.45 + 160 - 60, ty = lakeY - 2; R(ctx, tx - 10, ty - 10, 20, 10, '#c83a2a'); poly(ctx, [tx - 14, ty - 10, tx, ty - 18, tx + 14, ty - 10], '#f6c445'); R(ctx, tx - 7, ty - 22, 14, 5, '#c83a2a'); poly(ctx, [tx - 10, ty - 22, tx, ty - 28, tx + 10, ty - 22], '#f6c445'); for (let k = -1; k <= 1; k++) R(ctx, tx + k * 6 - 1, ty - 8, 2, 8, '#8a1a1a');
        // làng Ita Thao bên hồ (ga đi)
        for (let k = 0; k < 6; k++) { const hx = lx + 20 + k * 22, hy = lakeY + 2; R(ctx, hx, hy - 10, 18, 10, ['#f4ecdc', '#e8d8c0', '#f8f0e8'][k % 3]); poly(ctx, [hx - 2, hy - 10, hx + 9, hy - 16, hx + 20, hy - 10], ['#c84a3a', '#5a6a8a', '#8a5a3a'][k % 3]); R(ctx, hx + 6, hy - 7, 4, 4, '#8ac8ff'); }
      }
      // rừng thông dưới chân (gần, trôi nhanh), lên cao thì tụt xuống khuất
      tile(forest(), 0.8, 126 + alt * 58, 90);
      // biển mây khi lên cao
      const cloudA = clamp((alt - 0.72) / 0.2);
      if (cloudA > 0) { ctx.globalAlpha = cloudA; tile(clouds(), 0.6, 122 + (1 - cloudA) * 40, 70); ctx.globalAlpha = 1; }
      // đại bàng lượn
      for (let k = 0; k < 2; k++) { const x = ((k * 170 + t * 14 - wx * 0.5) % (W + 60) + W + 60) % (W + 60) - 30, y = 70 + k * 30 + Math.sin(t * 0.8 + k) * 8, f = Math.sin(t * 3 + k) * 2; line(ctx, x - 7, y - f, x, y, 1, '#3a2a2a'); line(ctx, x, y, x + 7, y - f, 1, '#3a2a2a'); R(ctx, x - 1, y - 0.5, 2.5, 1.5, '#3a2a2a'); R(ctx, x + 1.5, y - 1, 1, 1, '#f6f0e0'); }
      // dây cáp + cột: dây đi qua móc treo cabin, độ dốc theo độ cao
      const slope = (altAt(Math.min(1, s + 0.01)) - altAt(Math.max(0, s - 0.01))) / 0.02;
      const hookY = CY - 20, cableY = (x: number) => hookY - (x - CX) * slope * 0.12;
      for (const dy of [0, 4]) line(ctx, 0, cableY(0) + dy, W, cableY(W) + dy, 0.8, '#3a3a4a');
      for (const ts of TOWERS) {
        const x = CX + (ts - s) * LEN; if (x < -30 || x > W + 30) continue;
        const top = cableY(x) - 4, foot = 190;
        for (let y = top; y < foot; y += 6) { const w = 3 + (y - top) * 0.06; line(ctx, x - w, y, x + w, y + 6, 0.6, '#8a8a9a'); line(ctx, x + w, y, x - w, y + 6, 0.6, '#8a8a9a'); }
        line(ctx, x - 3, top, x - 3 - (foot - top) * 0.06, foot, 1.4, '#6a6a7a'); line(ctx, x + 3, top, x + 3 + (foot - top) * 0.06, foot, 1.4, '#6a6a7a');
        R(ctx, x - 9, top - 2, 18, 3, '#5a5a6a'); circ(ctx, x - 6, top - 2, 1.6, '#3a3a4a'); circ(ctx, x + 6, top - 2, 1.6, '#3a3a4a'); circ(ctx, x, top - 6, 1, '#ff3a3a');
      }
      // ga đi / ga đến
      for (const [gs, name] of [[0, 'Ita Thao'], [1, 'Cửu Tộc']] as const) {
        const x = CX + (gs - s) * LEN; if (x < -120 || x > W + 120) continue;
        const y = cableY(x) + 6;
        // đồi đỡ nhà ga
        ctx.fillStyle = '#5a8a62'; ctx.beginPath(); ctx.moveTo(x - 110, HH); ctx.quadraticCurveTo(x - 70, y + 52, x, y + 56); ctx.quadraticCurveTo(x + 70, y + 52, x + 110, HH); ctx.fill(); R(ctx, x - 66, y + 58, 132, HH, '#4a7a52');
        R(ctx, x - 60, y, 120, 60, '#e8e0d0'); R(ctx, x - 64, y - 6, 128, 8, '#c84a3a'); for (let k = 0; k < 6; k++) R(ctx, x - 54 + k * 18, y + 12, 12, 16, '#8ac8e8'); R(ctx, x - 30, y + 2, 60, 7, '#2a4a6a');
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`🚡 ${name}`, x, y + 7.5); ctx.textAlign = 'start';
      }
      // ── cabin kính: lắc nhẹ, hai người ngồi nhìn ra cửa ──
      const sway = Math.sin(t * 1.3) * (el > BOARD && el < BOARD + RIDE ? 0.05 : 0.01) + slope * -0.02;
      ctx.save(); ctx.translate(CX, hookY); ctx.rotate(sway);
      R(ctx, -1, 0, 2, 18, '#4a4a5a'); R(ctx, -8, -2, 16, 4, '#3a3a4a'); circ(ctx, -5, 0, 2, '#2a2a3a'); circ(ctx, 5, 0, 2, '#2a2a3a');
      const bx = -40, by2 = 18, bw = 80, bh = 62;
      // khung cabin (sơn đỏ Đài Loan) + mái bo tròn
      // khung cabin là viền (ô kính giữa để trống: nhìn xuyên cabin thấy cảnh phía sau)
      ctx.fillStyle = '#c8303a'; ctx.beginPath(); ctx.roundRect(bx, by2, bw, bh, 10); ctx.roundRect(bx + 3, by2 + 8, bw - 6, bh - 22, 6); ctx.fill('evenodd');
      R(ctx, bx + 8, by2 + 2, bw - 16, 1, '#e8505a');
      ctx.restore();
      // người trong cabin (vẽ không xoay để nét pixel không vỡ)
      const nowLook = looking.current.filter(l => nowMs - l.at < 3500);
      seats.forEach((p, i) => { if (!p) return; const pointing = nowLook.some(l => l.by === p.key), cheer = el > BOARD + RIDE; put(pointing ? p.point : cheer && Math.floor(t * 2 + i) % 2 ? p.yay : p.sit, CX - 34 + i * 30, hookY + 20 + Math.round(Math.sin(t * 1.3) * 1)); });
      ctx.save(); ctx.translate(CX, hookY); ctx.rotate(sway);
      // kính phản chiếu + song cửa + thân dưới cabin
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#c8f0ff'; ctx.beginPath(); ctx.roundRect(bx + 3, by2 + 8, bw - 6, bh - 22, 6); ctx.fill(); ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.35; poly(ctx, [bx + 10, by2 + 8, bx + 18, by2 + 8, bx + 6, by2 + bh - 14, bx + 3, by2 + bh - 14], '#ffffff'); poly(ctx, [bx + 26, by2 + 8, bx + 30, by2 + 8, bx + 18, by2 + bh - 14, bx + 15, by2 + bh - 14], '#ffffff'); ctx.globalAlpha = 1;
      R(ctx, -1, by2 + 8, 2, bh - 22, '#a8202a');
      ctx.fillStyle = '#c8303a'; ctx.beginPath(); ctx.roundRect(bx, by2 + bh - 16, bw, 16, [0, 0, 10, 10]); ctx.fill(); R(ctx, bx + 6, by2 + bh - 10, bw - 12, 1.5, '#f6c445');
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('日月潭纜車', 0, by2 + bh - 3); ctx.textAlign = 'start';
      ctx.restore();
      // mũi tên chỉ cảnh
      for (const l of nowLook) {
        const sg = SIGHTS[l.k], x = CX + (sg.s - s) * LEN * sg.par, y = sg.y + alt * 30, q = (nowMs - l.at) / 3500;
        const tx = Math.max(16, Math.min(W - 16, x)), ty = Math.min(HH - 12, y);
        ctx.globalAlpha = 1 - q * 0.3; line(ctx, CX, hookY + 40, tx, ty - 8, 0.8, '#ffe040'); poly(ctx, [tx - 4, ty - 10, tx + 4, ty - 10, tx, ty - 4 + Math.sin(nowMs / 120) * 1.5], '#ffe040'); ctx.globalAlpha = 1;
        if (Math.floor(nowMs / 200) % 2) twinkle(ctx, tx + 6, ty - 12, 2.5, '#ffffff');
      }
      // ngọn thông sát mắt khi còn thấp
      if (alt < 0.35) for (let k = 0; k < 4; k++) { const x = ((k * 113 - wx * 1.4) % (W + 80) + W + 80) % (W + 80) - 40, h = 40 + (k % 2) * 16, base = HH + 10 + alt * 140; for (let j = 0; j < h; j++) { const w = (j / h) * 12 + 1; R(ctx, x - w, base - h + j, w * 2, 1, j % 3 ? '#1e4a2e' : '#2a5a3a'); } }
      const ln = el < BOARD ? `🚡 Cabin sắp rời ga Ita Thao… ${Math.ceil((BOARD - el) / 1000)}` : el < BOARD + RIDE * 0.16 ? '🚡 Cabin cất lên trên mặt hồ Nhật Nguyệt…' : el < BOARD + RIDE * 0.4 ? '🏞️ Toàn cảnh hồ xanh ngọc ngay dưới chân' : el < BOARD + RIDE * 0.55 ? '🌲 Vượt qua rừng thông…' : el < BOARD + RIDE * 0.75 ? '☁️ Lên tới biển mây — núi non trùng điệp!' : el < BOARD + RIDE ? '🚡 Hạ dần xuống làng văn hoá Cửu Tộc…' : '🎉 Tới ga rồi!';
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
