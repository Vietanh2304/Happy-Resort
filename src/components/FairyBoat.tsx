// Thuyền cổ tích: hai người ngồi thuyền trôi trên dòng suối, qua cổng tháp đồng hồ vào 6 hầm cổ tích
// (Kẹo Ngọt, Đáy đại dương, Rừng phép thuật, Bầu trời sao, Vũ hội lâu đài, Cổng cầu vồng) — búp bê nhảy múa, đèn lấp lánh.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterSprite, type AvatarLook } from '../lib/sprites';

export const BOAT_WAIT = 4000;
const SPEED = 30, LEN = 1520, W = 320, HH = 180, Z = 2, BX = 120;
export const BOAT_MS = BOAT_WAIT + (LEN / SPEED) * 1000;
const ROOMS = [
  { x0: 0, x1: 150, k: 'gate', name: '🕰️ Cổng tháp đồng hồ — lên thuyền nào!' },
  { x0: 150, x1: 380, k: 'candy', name: '🍭 Vương quốc Kẹo Ngọt' },
  { x0: 380, x1: 610, k: 'sea', name: '🐠 Đáy đại dương' },
  { x0: 610, x1: 840, k: 'forest', name: '🍄 Rừng phép thuật' },
  { x0: 840, x1: 1070, k: 'sky', name: '🌙 Bầu trời sao' },
  { x0: 1070, x1: 1300, k: 'ball', name: '💃 Vũ hội lâu đài' },
  { x0: 1300, x1: 1520, k: 'rainbow', name: '🌈 Cổng cầu vồng — hạnh phúc mãi mãi 💖' },
] as const;
type RoomK = (typeof ROOMS)[number]['k'];
const BG: Record<RoomK, [string, string]> = {
  gate: ['#8ac8f8', '#ffe8f4'], candy: ['#ffb8d8', '#ffe8f4'], sea: ['#0a3a7a', '#1a8ac8'], forest: ['#0a2a2a', '#1a5a4a'],
  sky: ['#0a0a3a', '#2a2a7a'], ball: ['#7a3a6a', '#f0b8d8'], rainbow: ['#a8d8ff', '#fff0f8'],
};
const roomAt = (x: number) => ROOMS.find(r => x >= r.x0 && x < r.x1) ?? ROOMS[ROOMS.length - 1];
const img = (url: string) => { const i = new Image(); i.src = url; return i; };

type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
const circ = (c: Ctx, x: number, y: number, r: number, col: string) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
/** Búp bê nhảy múa nhỏ (kiểu: váy / đuôi tiên cá / tiên có cánh / đôi khiêu vũ) */
function doll(c: Ctx, x: number, y: number, k: number, t: number, kind: 'dress' | 'mermaid' | 'elf' | 'angel' | 'candy' | 'waltz') {
  const SK = ['#fde3d0', '#f6cfae', '#e0aa80', '#a8714f'][k % 4], HAIR = ['#4a3430', '#c98b4b', '#f3d58f', '#2e2a3a', '#f2a7c3'][k % 5];
  const DR = ['#ff5a9a', '#5ad8ff', '#ffd84a', '#9a7aff', '#5aff8a', '#ff8a3a'][k % 6];
  const bob = Math.round(Math.sin(t * 6 + k) * 1.2), arm = Math.sin(t * 6 + k) > 0;
  y += bob;
  if (kind === 'angel') { R(c, x - 6, y - 10, 4, 3, '#ffffff'); R(c, x + 2, y - 10, 4, 3, '#ffffff'); R(c, x - 2, y - 16, 4, 1, '#ffe06a'); }
  if (kind === 'mermaid') { for (let i = 0; i < 6; i++) R(c, x - 2 + Math.round(Math.sin(t * 5 + i) * 0.6), y - 6 + i, 4 - i * 0.4, 1, '#3ac8a8'); R(c, x - 3, y, 6, 1, '#3ac8a8'); }
  else if (kind === 'waltz') { for (let i = 0; i < 5; i++) R(c, x - 2 - i * 0.6, y - 6 + i, 4 + i * 1.2, 1, DR); }
  else { for (let i = 0; i < 5; i++) R(c, x - 1.5 - i * 0.5, y - 6 + i, 3 + i, 1, kind === 'elf' ? '#3aa84a' : kind === 'candy' ? (i % 2 ? '#ffffff' : DR) : DR); R(c, x - 1, y - 1, 1, 2, SK); R(c, x + 1, y - 1, 1, 2, SK); }
  R(c, x - 1.5, y - 9, 3, 3, kind === 'elf' ? '#3aa84a' : DR);
  R(c, x - 3, y - 9 + (arm ? -2 : 1), 1, 3, SK); R(c, x + 2, y - 9 + (arm ? 1 : -2), 1, 3, SK);
  circ(c, x, y - 12, 2.4, SK); R(c, x - 2.5, y - 15, 5, 2, HAIR);
  if (kind === 'elf') { R(c, x - 2, y - 17, 4, 2, '#3aa84a'); R(c, x - 1, y - 19, 2, 2, '#3aa84a'); R(c, x, y - 20, 1, 1, '#ffd84a'); }
  if (kind === 'candy') { R(c, x - 3, y - 16, 6, 1, '#ff5a9a'); R(c, x - 1, y - 18, 2, 2, '#ffffff'); }
  c.fillStyle = '#2a1a2a'; c.fillRect(Math.round(x - 1), Math.round(y - 12), 1, 1); c.fillRect(Math.round(x + 1), Math.round(y - 12), 1, 1);
}
const glow = (c: Ctx, x: number, y: number, r: number, col: string, a = 1) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'transparent'); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; };

/** Vẽ một phòng (tọa độ thế giới → màn hình bằng SX) */
function room(c: Ctx, r: (typeof ROOMS)[number], SX: (x: number) => number, t: number) {
  const x0 = SX(r.x0), x1 = SX(r.x1); if (x1 < -40 || x0 > W + 40) return;
  const [a, b] = BG[r.k]; const g = c.createLinearGradient(0, 0, 0, 140); g.addColorStop(0, a); g.addColorStop(1, b);
  c.fillStyle = g; c.fillRect(Math.max(-2, x0), 0, Math.min(W + 2, x1) - Math.max(-2, x0), 140);
  const along = (step: number, f: (x: number, i: number) => void) => { for (let wx = r.x0 + step / 2, i = 0; wx < r.x1; wx += step, i++) { const x = SX(wx); if (x > -40 && x < W + 40) f(x, i); } };
  const bank = 128;
  if (r.k === 'gate') {
    // mặt tiền tháp đồng hồ: tường trắng viền vàng, các tháp chóp pastel, mặt đồng hồ quay
    const cx = SX(110);
    R(c, cx - 70, 40, 140, 90, '#fff8f0'); for (let i = 0; i < 7; i++) { const tx = cx - 66 + i * 22, th = 26 + (i % 3) * 14; R(c, tx, 40 - th, 12, th, ['#ffd0e4', '#d0e8ff', '#fff0b8'][i % 3]); for (let y = 0; y < 16; y++) R(c, tx + 6 - (16 - y) * 0.4, 40 - th - 16 + y, (16 - y) * 0.8 + 1, 1, '#f6c445'); }
    R(c, cx - 16, 4, 32, 40, '#ffffff'); for (let y = 0; y < 22; y++) R(c, cx - y * 0.8, -18 + y, y * 1.6, 1, '#ff8ac8');
    circ(c, cx, 22, 12, '#f6c445'); circ(c, cx, 22, 10, '#ffffff'); const h = t * 0.6, m = t * 3;
    c.strokeStyle = '#3a2a3a'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, 22); c.lineTo(cx + Math.sin(h) * 6, 22 - Math.cos(h) * 6); c.moveTo(cx, 22); c.lineTo(cx + Math.sin(m) * 8, 22 - Math.cos(m) * 8); c.stroke();
    for (let i = 0; i < 12; i++) R(c, cx + Math.sin(i / 12 * Math.PI * 2) * 9 - 0.5, 22 - Math.cos(i / 12 * Math.PI * 2) * 9 - 0.5, 1, 1, '#c8902a');
    R(c, cx - 70, 52, 140, 2, '#f6c445'); R(c, cx - 70, 80, 140, 2, '#f6c445');
    for (let i = 0; i < 12; i++) { const fx = cx - 66 + i * 12; R(c, fx, 86, 8, 3, '#7a4e2c'); for (let k = 0; k < 4; k++) R(c, fx + k * 2, 84, 1, 2, ['#ff5a9a', '#ffd84a', '#ffffff', '#9a7aff'][k]); }
    c.fillStyle = '#1a1030'; c.beginPath(); c.moveTo(cx + 30, 130); c.lineTo(cx + 30, 100); c.arc(cx + 50, 100, 20, Math.PI, 0); c.lineTo(cx + 70, 130); c.fill();
    for (let i = 0; i < 14; i++) { const an = Math.PI + (i / 13) * Math.PI; circ(c, cx + 50 + Math.cos(an) * 22, 100 + Math.sin(an) * 22, 1.2, ['#ffd84a', '#ff5a9a', '#5ad8ff'][i % 3]); }
  }
  if (r.k === 'candy') {
    along(46, (x, i) => { for (let y = 40; y < bank; y += 4) R(c, x, y, 4, 4, (y / 4 + i) % 2 ? '#ffffff' : '#ff3a5a'); for (let k = 0; k < 8; k++) R(c, x + 2 + Math.cos(k / 2.5) * 5, 40 - Math.sin(k / 2.5) * 5, 3, 3, k % 2 ? '#ffffff' : '#ff3a5a'); });
    along(70, (x, i) => { const lx = x + 22; R(c, lx, 70, 2, bank - 70, '#ffffff'); circ(c, lx + 1, 64, 10, ['#ff8ad8', '#8ad8ff', '#ffe06a'][i % 3]); for (let k = 0; k < 3; k++) { c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.beginPath(); c.arc(lx + 1, 64, 3 + k * 3, t + k, t + k + 3); c.stroke(); } });
    const hx = SX(r.x0 + 120); R(c, hx - 24, 76, 48, 52, '#b8743a'); for (let y = 0; y < 22; y++) R(c, hx - 30 + y * 1.36, 76 - y, 60 - y * 2.7, 1, '#8a4a2a'); for (let x = -30; x < 30; x += 4) circ(c, hx + x + 2, 77, 2, '#ffffff');
    R(c, hx - 6, 104, 12, 24, '#ff5a9a'); for (const dx of [-18, 10]) { R(c, hx + dx, 88, 8, 8, '#fff0b8'); R(c, hx + dx, 88, 8, 1, '#ffffff'); }
    for (let k = 0; k < 6; k++) circ(c, hx - 20 + k * 8, 100, 2, ['#ff3a5a', '#5ac85a', '#ffd84a'][k % 3]);
    for (let k = 0; k < 5; k++) { const cx2 = x0 + 30 + k * 50, cy = 18 + (k % 2) * 8; for (let j = 0; j < 4; j++) circ(c, cx2 + j * 7, cy + (j % 2) * 2, 6, '#ffd0ec'); }
    along(26, (x, i) => doll(c, x, bank, i, t, 'candy'));
  }
  if (r.k === 'sea') {
    for (let k = 0; k < 6; k++) { c.globalAlpha = 0.12; c.fillStyle = '#c8f0ff'; c.beginPath(); const rx = x0 + 20 + k * 40 + Math.sin(t + k) * 6; c.moveTo(rx, 0); c.lineTo(rx + 14, 0); c.lineTo(rx + 34, 140); c.lineTo(rx + 10, 140); c.fill(); c.globalAlpha = 1; }
    along(38, (x, i) => { const col = ['#ff6a8a', '#ff9a3a', '#ff8ad8'][i % 3]; R(c, x, 100, 3, 28, col); R(c, x - 6, 106, 6, 2, col); R(c, x - 6, 98, 2, 9, col); R(c, x + 3, 110, 6, 2, col); R(c, x + 7, 102, 2, 9, col);
      for (let y = 0; y < 30; y++) R(c, x + 18 + Math.sin(y / 4 + t * 2 + i) * 2, bank - y, 2, 1, '#2ac86a'); });
    for (let k = 0; k < 8; k++) { const fx = ((k * 83 + t * (14 + k * 3)) % (r.x1 - r.x0)) + r.x0, x = SX(fx), y = 40 + (k * 29) % 70; R(c, x, y, 6, 3, ['#ffd84a', '#ff8a3a', '#5ad8ff', '#ff5a9a'][k % 4]); R(c, x - 2, y - 1, 2, 5, ['#ffd84a', '#ff8a3a', '#5ad8ff', '#ff5a9a'][k % 4]); R(c, x + 4, y, 1, 1, '#1a1a2a'); }
    for (let k = 0; k < 4; k++) { const x = SX(r.x0 + 40 + k * 55), y = 30 + Math.sin(t * 1.4 + k) * 6 + (k % 2) * 16; glow(c, x, y, 12, '#ff8ad8', 0.5); circ(c, x, y, 5, '#ffb8e8'); for (let j = 0; j < 4; j++) R(c, x - 4 + j * 2.5, y + 2, 1, 8 + Math.sin(t * 3 + j) * 2, '#ffb8e8'); }
    for (let k = 0; k < 24; k++) { const x = SX(r.x0 + (k * 41) % (r.x1 - r.x0)), y = 140 - ((t * 18 + k * 23) % 140); c.strokeStyle = '#ffffffa0'; c.lineWidth = 0.6; c.beginPath(); c.arc(x, y, 1 + (k % 3), 0, Math.PI * 2); c.stroke(); }
    const ch = SX(r.x0 + 150); R(c, ch - 8, 118, 16, 10, '#8a5a2a'); R(c, ch - 8, 116, 16, 3, '#f6c445'); glow(c, ch, 116, 10, '#ffe06a', 0.6);
    along(30, (x, i) => doll(c, x, bank, i, t, 'mermaid'));
  }
  if (r.k === 'forest') {
    along(34, (x, i) => { R(c, x, 20, 8, bank - 20, '#0a1a14'); circ(c, x + 4, 24, 18 + (i % 2) * 4, '#0e2a1e'); });
    along(30, (x, i) => { const mx = x + 15, my = bank - 6 - (i % 3) * 3; glow(c, mx, my - 4, 12, i % 2 ? '#ff5a8a' : '#5affd8', 0.55); R(c, mx - 1, my - 4, 2, 6, '#fff0d8'); c.fillStyle = i % 2 ? '#ff3a5a' : '#3ad8c8'; c.beginPath(); c.arc(mx, my - 4, 5, Math.PI, 0); c.fill(); R(c, mx - 2, my - 7, 1, 1, '#ffffff'); R(c, mx + 2, my - 6, 1, 1, '#ffffff'); });
    for (let k = 0; k < 40; k++) { const x = SX(r.x0 + (k * 37) % (r.x1 - r.x0)) + Math.sin(t + k) * 4, y = 20 + (k * 53) % 100 + Math.cos(t * 1.3 + k) * 3; if ((Math.floor(t * 4) + k) % 3) { glow(c, x, y, 4, '#ffe86a', 0.7); R(c, x, y, 1, 1, '#ffffa0'); } }
    for (let k = 0; k < 3; k++) { const x = SX(r.x0 + 60 + k * 70); R(c, x, 60, 2, bank - 60, '#3a8a3a'); for (let j = 0; j < 6; j++) circ(c, x + 1 + Math.cos(j / 6 * Math.PI * 2 + t * 0.3) * 6, 56 + Math.sin(j / 6 * Math.PI * 2 + t * 0.3) * 6, 4, ['#ff8ad8', '#b08aff'][k % 2]); circ(c, x + 1, 56, 3, '#ffe06a'); }
    for (let k = 0; k < 2; k++) { const x = SX(r.x0 + 100 + k * 90); R(c, x - 3, 30, 3, 3, '#ffe06a'); R(c, x + 2, 30, 3, 3, '#ffe06a'); }
    along(28, (x, i) => doll(c, x, bank, i, t, 'elf'));
  }
  if (r.k === 'sky') {
    for (let k = 0; k < 70; k++) { const x = SX(r.x0 + (k * 29) % (r.x1 - r.x0)), y = (k * 47) % 120; if ((Math.floor(t * 3) + k) % 4) { R(c, x, y, 1, 1, '#ffffff'); if (k % 7 === 0) { R(c, x - 2, y, 5, 1, '#fff6c0'); R(c, x, y - 2, 1, 5, '#fff6c0'); } } }
    const mx = SX(r.x0 + 110); glow(c, mx, 40, 34, '#fff6c0', 0.5); circ(c, mx, 40, 18, '#fff6c0'); circ(c, mx + 8, 34, 16, BG.sky[0]);
    const sw = Math.sin(t * 1.6) * 0.3; c.strokeStyle = '#fff6c0'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(mx - 6, 50); c.lineTo(mx - 6 + Math.sin(sw) * 26, 50 + Math.cos(sw) * 26); c.stroke(); doll(c, mx - 6 + Math.sin(sw) * 26, 50 + Math.cos(sw) * 26 + 6, 3, t, 'angel');
    for (let k = 0; k < 2; k++) { const px = SX(r.x0 + 40 + k * 140), py = 30 + k * 30; circ(c, px, py, 8, k ? '#ff9a5a' : '#8ab8ff'); c.strokeStyle = '#ffe0a0'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(px, py, 14, 4, -0.3, 0, Math.PI * 2); c.stroke(); }
    const sx = SX(r.x0 + ((t * 80) % (r.x1 - r.x0))), sy = 20 + ((t * 30) % 60); for (let j = 0; j < 12; j++) R(c, sx - j * 2, sy - j, 1.5, 1, j ? '#fff6c080' : '#ffffff');
    along(30, (x, i) => doll(c, x, bank, i, t, 'angel'));
  }
  if (r.k === 'ball') {
    along(40, (x, i) => { R(c, x - 2, 10, 4, bank - 10, '#f6c445'); c.strokeStyle = '#f6c445'; c.lineWidth = 2; c.beginPath(); c.arc(x + 20, 40, 18, Math.PI, 0); c.stroke(); R(c, x + 6, 40, 28, bank - 40, i % 2 ? '#ffd8ec' : '#f8c0dc'); });
    along(60, (x, i) => { const cy = 22 + (i % 2) * 6; R(c, x, 0, 1, cy, '#f6c445'); glow(c, x, cy + 4, 18, '#fff0a0', 0.6); for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI; R(c, x + Math.cos(a) * 10, cy + Math.sin(a) * 4, 1, 3, '#f6c445'); R(c, x + Math.cos(a) * 10, cy + Math.sin(a) * 4 - 2, 1, 1, '#fffbe0'); } R(c, x - 3, cy + 4, 7, 2, '#f6c445'); for (let k = 0; k < 4; k++) R(c, x - 2 + k * 1.5, cy + 6, 1, 3, '#c8f4ff'); });
    for (let k = 0; k < 30; k++) { const x = SX(r.x0 + (k * 31) % (r.x1 - r.x0)) + Math.sin(t * 2 + k) * 3, y = (t * 20 + k * 19) % 140; R(c, x, y, 1.5, 1.5, ['#ff5a9a', '#ffd84a', '#5ad8ff', '#ffffff'][k % 4]); }
    along(26, (x, i) => { const spin = Math.floor(t * 3 + i) % 2; doll(c, x + (spin ? -3 : 3), bank, i, t, 'waltz'); doll(c, x + (spin ? 4 : -4), bank, i + 2, t, 'dress'); });
  }
  if (r.k === 'rainbow') {
    const cx = SX(r.x0 + 110); const RB = ['#ff4a4a', '#ff9a3a', '#ffe04a', '#5ad85a', '#4aa8ff', '#9a6aff'];
    RB.forEach((col, k) => { c.strokeStyle = col; c.lineWidth = 6; c.beginPath(); c.arc(cx, 140, 96 - k * 6, Math.PI, 0); c.stroke(); });
    for (let k = 0; k < 6; k++) circ(c, cx - 100 + k * 40, 30 + (k % 2) * 10, 10, '#ffffff');
    for (let k = 0; k < 40; k++) { const x = SX(r.x0 + (k * 23) % (r.x1 - r.x0)), y = 100 + (k * 13) % 28; circ(c, x, y, 2, RB[k % 6]); }
    along(24, (x, i) => doll(c, x, bank, i, t, i % 2 ? 'dress' : 'candy'));
  }
}

export function BoatRide({ at: t0, me, them, onExit }: { at: number; me: AvatarLook; them: AvatarLook | null; onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [line, setLine] = useState('');
  const [photo, setPhoto] = useState('');
  const [done, setDone] = useState(false);
  const pics = useMemo(() => [me, ...(them ? [them] : [])].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)).map(l => ({ sit: img(characterSprite(l, 'sit').url), up: img(characterSprite(l, 'actsit', undefined, 'front', 12).url) })),
    [JSON.stringify(me), JSON.stringify(them)]); // eslint-disable-line react-hooks/exhaustive-deps
  const exitRef = useRef(onExit); exitRef.current = onExit;
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!;
    let raf = 0, last = '', snapped = false, ended = false;
    const frame = () => {
      const ms = Date.now() - t0, t = ms / 1000, mv = Math.max(0, ms - BOAT_WAIT) / 1000;
      const bx = Math.min(LEN - 20, 10 + mv * SPEED), camX = bx - BX, SX = (x: number) => x - camX;
      ctx.setTransform(Z, 0, 0, Z, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#1a1030'; ctx.fillRect(0, 0, W, HH);
      for (const r of ROOMS) room(ctx, r, SX, t);
      // vòm cửa giữa các hầm: vòm vàng có bóng đèn
      for (const r of ROOMS.slice(1)) {
        const x = SX(r.x0); if (x < -40 || x > W + 40) continue;
        R(ctx, x - 6, 0, 12, 140, '#2a1838'); R(ctx, x - 7, 0, 2, 140, '#f6c445'); R(ctx, x + 5, 0, 2, 140, '#f6c445');
        for (let y = 6; y < 136; y += 7) { const on = (Math.floor(t * 4) + y / 7) % 2; circ(ctx, x - 6, y, 1.3, on ? '#fff6c0' : '#ffb84a'); circ(ctx, x + 6, y, 1.3, on ? '#ffb84a' : '#fff6c0'); if (on) glow(ctx, x - 6, y, 4, '#fff0a0', 0.5); }
      }
      // trần hầm: dây đèn võng
      for (let k = -1; k < 6; k++) { const ax = ((k * 70 - camX * 1) % 420 + 420) % 420 - 50; for (let j = 0; j <= 10; j++) { const x = ax + j * 7, y = 6 + Math.sin((j / 10) * Math.PI) * 8; circ(ctx, x, y, 1.2, ['#ff5a9a', '#ffd84a', '#5ad8ff', '#9a7aff', '#5aff8a'][(j + k + 5) % 5]); } }
      // mặt nước có bóng đèn phản chiếu
      const rm = roomAt(bx), wc = rm.k === 'sea' ? ['#1a6ac8', '#0a3a8a'] : rm.k === 'forest' ? ['#1a5a5a', '#0a2a3a'] : rm.k === 'sky' ? ['#2a2a7a', '#0a0a3a'] : rm.k === 'candy' ? ['#ff9ac8', '#c85a9a'] : ['#5ab0e8', '#2a6ab8'];
      const wg = ctx.createLinearGradient(0, 132, 0, HH); wg.addColorStop(0, wc[0]); wg.addColorStop(1, wc[1]); ctx.fillStyle = wg; ctx.fillRect(0, 132, W, HH - 132);
      for (let k = 0; k < 40; k++) { const x = ((k * 53 - camX * 1.0 + Math.sin(t + k) * 3) % (W + 20) + W + 20) % (W + 20) - 10, y = 136 + (k * 17) % 40; R(ctx, x, y, 4 + (k % 4) * 2, 1, '#ffffff60'); }
      for (let k = 0; k < 16; k++) { const x = ((k * 47 - camX) % W + W) % W; ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 3 + k); R(ctx, x, 140 + (k % 5) * 6, 1, 3, ['#ffd84a', '#ff5a9a', '#5ad8ff'][k % 3]); ctx.globalAlpha = 1; }
      // thuyền + hai người ngồi
      const by = 146 + Math.sin(t * 1.8) * 1.2, wave = Math.floor(t / 5) % 3 === 0 && (t % 5) < 1.6;
      pics.forEach((pc, k) => { const im = wave && k === 0 ? pc.up : pc.sit; if (!im.complete || !im.height) return; const h = im.height / Z, w = im.width / Z; ctx.drawImage(im, BX + (k ? -10 : 8) - w / 2, by - 6 - h, w, h); });
      R(ctx, BX - 26, by - 8, 52, 9, '#5ab0e8'); R(ctx, BX - 26, by - 8, 52, 2, '#f6c445'); R(ctx, BX - 24, by, 48, 3, '#3a80c0');
      for (let k = 0; k < 2; k++) { const s2 = k ? 1 : -1; for (let i = 0; i < 6; i++) R(ctx, BX + s2 * (26 + i * 0.8) - (s2 < 0 ? 2 : 0), by - 8 - i * 1.6, 2, 2, '#f6c445'); }
      for (let x = -22; x < 22; x += 6) { circ(ctx, BX + x, by - 5, 1.6, ['#ff5a9a', '#ffffff', '#ffd84a'][((x + 22) / 6) % 3]); }
      R(ctx, BX - 30, by + 2, 60, 1, '#ffffff80');
      // tên phòng
      const ln = ms < BOAT_WAIT ? `🛶 Ngồi vững nhé… ${Math.ceil((BOAT_WAIT - ms) / 1000)}` : rm.name;
      if (ln !== last) { last = ln; setLine(ln); }
      if (!snapped && rm.k === 'ball' && bx > rm.x0 + 110) {
        snapped = true; const ph = document.createElement('canvas'); ph.width = 512; ph.height = 288; const pc2 = ph.getContext('2d')!; pc2.imageSmoothingEnabled = false;
        pc2.drawImage(c, (BX - 64) * Z, 80 * Z, 128 * Z, 72 * Z, 0, 0, 512, 288); setPhoto(ph.toDataURL('image/png'));
      }
      if (!ended && ms > BOAT_MS + 600) { ended = true; setDone(true); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [t0, pics]);
  useEffect(() => { if (!done) return; const t = setTimeout(() => exitRef.current(), 15000); return () => clearTimeout(t); }, [done]);
  return createPortal(
    <div className="coaster">
      <canvas ref={cv} width={W * Z} height={HH * Z} />
      {!done && line && <b className="coaster-line">{line}</b>}
      {done && (
        <div className="coaster-end">
          <h3>🛶 Ảnh trên thuyền cổ tích</h3>
          {photo && <img src={photo} alt="Ảnh thuyền cổ tích" />}
          <div className="row">
            {photo && <a className="btn small ghost" href={photo} download="thuyen-co-tich.png">💾 Lưu ảnh</a>}
            <button className="btn small" onClick={() => exitRef.current()}>🚶 Lên bờ</button>
          </div>
        </div>
      )}
      {!done && <button className="coaster-x btn small ghost" onClick={() => { if (confirm('Lên bờ giữa chừng?')) exitRef.current(); }}>✖</button>}
    </div>,
    document.body,
  );
}
