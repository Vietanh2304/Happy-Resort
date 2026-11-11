// Show pháo hoa nhiều màn (vẽ canvas, vật lý có lực cản + trọng lực, vệt đuôi, ánh sáng cộng màu).
// Toàn bộ tính theo thời gian kể từ lúc show bắt đầu → hai máy cùng `at` thấy y hệt nhau.
import { useEffect, useRef, useState } from 'react';
import { seeded } from '../lib/rng';
import { Tag, useScale } from './Stage';

type Kind = 'peony' | 'chrys' | 'willow' | 'heart' | 'ring' | 'saturn' | 'crackle' | 'palm' | 'double' | 'strobe';
interface Burst { t: number; x: number; y: number; kind: Kind; c: [string, string]; R: number; tilt?: number }
interface Fall { t0: number; t1: number; y: number; x0: number; x1: number }
const COLORS: [string, string][] = [['#ff4a7a', '#ffc0d4'], ['#ffd84a', '#fff4c0'], ['#4ad8ff', '#c8f4ff'], ['#a87aff', '#e4d8ff'], ['#5aff8a', '#d8ffe4'], ['#ff8a3a', '#ffe0b8'], ['#ff6ad8', '#ffffff'], ['#ffffff', '#a8e0ff']];
export const ACTS = [
  { t: 0, name: '🎆 Mở màn' }, { t: 6.5, name: '✨ Mưa vàng' }, { t: 13, name: '💖 Trái tim' }, { t: 19.5, name: '🪐 Vòng xoay' },
  { t: 26, name: '🌼 Hoa cúc lấp lánh' }, { t: 32, name: '🌠 Thác nước' }, { t: 37.5, name: '💥 Đại kết' },
];
export const FW_SHOW_MS = 47000;

function script(): { bursts: Burst[]; falls: Fall[] } {
  const r = seeded('fw-show-v1'), C = (i: number) => COLORS[i % COLORS.length], B: Burst[] = [];
  const add = (t: number, x: number, y: number, kind: Kind, ci: number, R = 30, tilt?: number) => B.push({ t, x, y, kind, c: C(ci), R, tilt });
  // 1 · Mở màn: mẫu đơn nổ lần lượt trái → phải, rồi hoa kép giữa trời
  [56, 92, 128, 164, 200].forEach((x, k) => add(1 + k * 0.45, x, 44 - (k % 2) * 8, 'peony', k, 26));
  add(3.8, 128, 26, 'double', 6, 38); add(4.6, 70, 34, 'peony', 2, 28); add(4.6, 186, 34, 'peony', 3, 28); add(5.6, 128, 40, 'strobe', 7, 30);
  // 2 · Mưa vàng: liễu vàng rủ xuống
  for (const [t, x, y] of [[7, 72, 28], [7.7, 184, 28], [8.5, 128, 20], [9.6, 46, 36], [9.6, 210, 36], [11, 100, 26], [11, 156, 26], [11.8, 128, 18]] as const) add(t, x, y, 'willow', 1, 34);
  // 3 · Trái tim
  add(13.4, 86, 40, 'heart', 0, 26); add(14.1, 170, 40, 'heart', 6, 26); add(15.2, 128, 30, 'heart', 0, 38);
  for (let k = 0; k < 6; k++) add(16.4 + k * 0.35, 40 + k * 35, 46 - (k % 2) * 10, 'heart', k % 2 ? 6 : 0, 16);
  // 4 · Vòng xoay: vòng nghiêng nhiều góc + sao Thổ
  for (let k = 0; k < 5; k++) add(20 + k * 0.6, 60 + k * 34, 36 + (k % 2) * 8, 'ring', k + 2, 30, -0.9 + k * 0.45);
  add(23.4, 128, 30, 'saturn', 3, 36, 0.35); add(24.4, 72, 40, 'saturn', 4, 26, -0.4); add(24.4, 184, 40, 'saturn', 2, 26, 0.4);
  // 5 · Hoa cúc đổi màu + nổ lách tách
  for (let k = 0; k < 7; k++) add(26.4 + k * 0.7, 40 + r() * 176, 22 + r() * 28, k % 2 ? 'crackle' : 'chrys', k, 30 + r() * 8);
  // 6 · Thác nước + cây cọ
  const falls: Fall[] = [{ t0: 32.2, t1: 37.4, y: 30, x0: 24, x1: 232 }];
  add(33, 64, 22, 'palm', 1, 34); add(34.2, 192, 22, 'palm', 5, 34); add(35.6, 128, 16, 'palm', 6, 40);
  // 7 · Đại kết: bắn dồn dập rồi 3 quả cực lớn
  const kinds: Kind[] = ['peony', 'chrys', 'crackle', 'ring', 'double', 'strobe', 'heart', 'willow'];
  for (let k = 0; k < 34; k++) add(37.8 + k * 0.17 + r() * 0.1, 24 + r() * 208, 16 + r() * 40, kinds[k % kinds.length], Math.floor(r() * 8), 22 + r() * 16, r() - 0.5);
  add(44, 70, 26, 'double', 1, 44); add(44, 186, 26, 'double', 6, 44); add(44.3, 128, 18, 'chrys', 7, 52);
  return { bursts: B.sort((a, b) => a.t - b.t), falls };
}
const SCRIPT = script();
const RISE = 0.9;

/** Vận tốc ban đầu các hạt của một quả (cố định theo chỉ số) */
const cache = new Map<number, { vx: Float32Array; vy: Float32Array; alt: Uint8Array }>();
function particles(i: number, b: Burst) {
  const hit = cache.get(i); if (hit) return hit;
  const r = seeded(`fwp:${i}`), vx: number[] = [], vy: number[] = [], alt: number[] = [];
  const v0 = b.R * (b.kind === 'willow' ? 2.8 : 1.7);
  const push = (x: number, y: number, a = 0) => { vx.push(x * v0); vy.push(y * v0); alt.push(a); };
  const n = b.kind === 'palm' ? 9 : b.kind === 'heart' ? 46 : b.kind === 'ring' ? 44 : 64;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    if (b.kind === 'heart') { const x = 16 * Math.sin(a) ** 3, y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); push(x / 17, y / 17, k % 5 === 0 ? 1 : 0); }
    else if (b.kind === 'ring' || b.kind === 'saturn') { const t = b.tilt ?? 0, x = Math.cos(a), y = Math.sin(a) * 0.35; push(x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t), 0); }
    else if (b.kind === 'palm') push(Math.cos(a) * 0.9, Math.sin(a) * 0.9 - 0.15, 0);
    else { const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), m = 0.75 + r() * 0.25; push(s * Math.cos(th) * m, (u * 0.9) * m, b.kind === 'double' && k % 2 ? 1 : 0); }
  }
  if (b.kind === 'saturn' || b.kind === 'double') for (let k = 0; k < 30; k++) { const u = r() * 2 - 1, th = r() * Math.PI * 2, s = Math.sqrt(1 - u * u); push(s * Math.cos(th) * 0.45, u * 0.45, 1); }
  const out = { vx: Float32Array.from(vx), vy: Float32Array.from(vy), alt: Uint8Array.from(alt) };
  cache.set(i, out); return out;
}
const LIFE: Record<Kind, number> = { peony: 1.9, chrys: 2.6, willow: 4, heart: 2.2, ring: 2, saturn: 2.3, crackle: 2.6, palm: 2.6, double: 2.3, strobe: 2.4 };
const DRAG: Record<Kind, number> = { peony: 1.7, chrys: 1.6, willow: 2.6, heart: 1.9, ring: 1.8, saturn: 1.8, crackle: 1.7, palm: 1.3, double: 1.7, strobe: 1.7 };
const G = 24;
/** Vị trí hạt sau τ giây (lực cản tuyến tính + trọng lực) */
const pos = (v: number, tau: number, k: number) => (v * (1 - Math.exp(-k * tau))) / k;
const fallY = (tau: number, k: number, g: number) => g * (tau / k - (1 - Math.exp(-k * tau)) / (k * k));

export function FireworkShow({ at, onAct }: { at: number; onAct?: (name: string) => void }) {
  const s = useScale();
  const cv = useRef<HTMLCanvasElement>(null);
  const [act, setAct] = useState('');
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!, Z = 2;
    let raf = 0, last = '';
    const frame = () => {
      const T = (Date.now() - at) / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.setTransform(Z, 0, 0, Z, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      const dot = (x: number, y: number, col: string, a: number, big = false) => {
        if (a <= 0.02) return;
        ctx.globalAlpha = a * 0.22; ctx.fillStyle = col; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        ctx.globalAlpha = a; ctx.fillRect(x - (big ? 0.75 : 0.5), y - (big ? 0.75 : 0.5), big ? 1.5 : 1, big ? 1.5 : 1);
      };
      SCRIPT.bursts.forEach((b, i) => {
        const tau = T - b.t, life = LIFE[b.kind];
        if (tau < -RISE || tau > life + 0.2) return;
        if (tau < 0) { // tên lửa vọt lên
          const f = 1 - (-tau / RISE), e = 1 - (1 - f) ** 2, y = 160 + (b.y - 160) * e;
          for (let j = 0; j < 5; j++) dot(b.x + Math.sin(j * 7 + T * 20) * 0.4, y + j * 2.2, '#ffe8b0', 0.9 - j * 0.17);
          return;
        }
        if (tau < 0.3) { const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.R * 1.3); g.addColorStop(0, b.c[1]); g.addColorStop(1, 'transparent'); ctx.globalAlpha = (0.3 - tau) * 1.2; ctx.fillStyle = g; ctx.fillRect(b.x - b.R * 1.3, b.y - b.R * 1.3, b.R * 2.6, b.R * 2.6); }
        const P = particles(i, b), k = DRAG[b.kind], g = b.kind === 'willow' ? 14 : G, trail = b.kind === 'willow' || b.kind === 'palm' ? 7 : b.kind === 'chrys' ? 5 : 3;
        for (let n = 0; n < P.vx.length; n++) {
          const fade = Math.max(0, 1 - (tau / life) ** 2.2);
          let col = P.alt[n] ? b.c[1] : b.c[0];
          if (b.kind === 'chrys' && tau > life * 0.5) col = b.c[1];
          if (b.kind === 'willow') col = tau > life * 0.4 ? '#ffb84a' : '#fff0a0';
          let a = fade;
          if (b.kind === 'strobe' && tau > 0.5) a *= ((Math.floor(T * 14 + n * 3.7) % 3) === 0 ? 1 : 0.1);
          for (let j = 0; j < trail; j++) {
            const tt = Math.max(0, tau - j * 0.045);
            dot(b.x + pos(P.vx[n], tt, k), b.y + pos(P.vy[n], tt, k) + fallY(tt, k, g), col, a * (1 - j / trail), j === 0 && b.kind === 'palm');
          }
          if (b.kind === 'crackle' && tau > life * 0.6 && (Math.floor(T * 30 + n * 5) % 4 === 0)) {
            const x = b.x + pos(P.vx[n], tau, k), y = b.y + pos(P.vy[n], tau, k) + fallY(tau, k, g);
            for (let q = 0; q < 3; q++) dot(x + Math.cos(n + q * 2) * 2.5, y + Math.sin(n + q * 2) * 2.5, '#ffffff', fade);
          }
        }
      });
      // thác nước: dải tia lửa vàng đổ xuống
      for (const f of SCRIPT.falls) {
        if (T < f.t0 || T > f.t1 + 2.4) continue;
        for (let x = f.x0; x <= f.x1; x += 7) for (let e = Math.max(f.t0, T - 2.4); e < Math.min(T, f.t1); e += 0.09) {
          const tau = T - e, jitter = Math.sin(x * 13.1 + e * 7.3) * 0.8;
          dot(x + jitter, f.y + 6 * tau + 9 * tau * tau, tau < 0.5 ? '#ffffff' : '#ffc84a', Math.max(0, 1 - tau / 2.4));
        }
        if (T < f.t1) for (let x = f.x0; x <= f.x1; x += 7) dot(x, f.y, '#ffffff', 1, true);
      }
      // trận kết: chớp trắng cả trời
      if (T > 44.3 && T < 45.1) { ctx.globalAlpha = (45.1 - T) * 0.5; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 192); }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      let name = ''; for (const a of ACTS) if (T >= a.t) name = a.name;
      if (T > FW_SHOW_MS / 1000 - 1.5) name = '';
      if (name !== last) { last = name; setAct(name); onAct?.(name); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [at]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <canvas ref={cv} width={512} height={384} className="fw-show" style={{ width: 256 * s, height: 192 * s }} />
      {act && <Tag key={act} x={128} y={182} className="bed-bubble fw-act">{act}</Tag>}
    </>
  );
}
