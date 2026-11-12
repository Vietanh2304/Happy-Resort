// Xưởng gốm Thanh Hà (Hội An): hai người ngồi bàn xoay — vuốt đất thành dáng bình, vẽ hoa văn, cho vào lò nung, ra lò bình men bóng.
// Đồng bộ theo mốc thời gian `at` chung nên hai máy thấy cùng một cảnh.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterSprite, type AvatarLook } from '../lib/sprites';
import { makeSprite } from '../lib/pixel';
import { bake, circ, ell, glow, half, heart, line, poly, R, star, twinkle, type Ctx } from '../lib/canvasArt';
import { onEvent, sendEvent } from '../lib/realtime';

export const POT_WAIT = 6000;
const SHAPE = POT_WAIT, PAINT = SHAPE + 17000, KILN = PAINT + 11000, OUT = KILN + 8000;
export const POT_MS = OUT + 7000;
/** vào xưởng ngồi cạnh người ấy được tới trước lúc vẽ hoa văn */
export const POT_JOIN = PAINT;
const W = 320, HH = 180, Z = 2, TABLE = 132, SEATS = [124, 204];
const img = (url: string) => { const i = new Image(); i.src = url; return i; };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const hash = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
/** men + màu hoa văn của từng chiếc bình */
const GLAZE = [
  { body: '#f4ecdc', glaze: '#eef2f8', ink: '#2a5ab8' },   // men trắng vẽ lam
  { body: '#c87a4a', glaze: '#b8603a', ink: '#f6e0b0' },   // đất nung đỏ vẽ kem
  { body: '#a8d0c0', glaze: '#6ab8a8', ink: '#ffffff' },   // men ngọc
  { body: '#6a8ac8', glaze: '#2a4a9a', ink: '#f6c445' },   // men lam vẽ vàng
];

/** bán kính bình theo độ cao u (0 = đáy, 1 = miệng): cục đất tròn → dáng bình bụng phình cổ thon */
const lump = (u: number) => Math.sqrt(Math.max(0, 1 - u * u)) * 1.05;
const vase = (u: number) => u < 0.42 ? 0.62 + Math.sin(u / 0.42 * Math.PI / 2) * 0.38 : u < 0.82 ? 0.4 + 0.6 * Math.cos((u - 0.42) / 0.4 * Math.PI / 2) : 0.4 + (u - 0.82) / 0.18 * 0.22;

/** wob: độ méo (0 = tròn đều, 1 = méo xệch vì trượt nhịp nhiều) */
function drawVase(c: Ctx, cx0: number, base: number, s: number, spin: number, g: (typeof GLAZE)[number], paint: number, glazed: boolean, t: number, wob = 0) {
  const H = 7 + s * 13, RW = 6.4 - s * 0.6;
  const wet = '#a8643c', wetD = '#7a4426', wetL = '#c8845a';
  const at = (u: number) => ({ cx: cx0 + Math.sin(u * 5.5 + 1) * wob * 2.2 * u, r: RW * (lump(u) * (1 - s) + vase(u) * s) * (1 + Math.sin(u * 9 + 2) * wob * 0.2) });
  for (let y = 0; y < H; y += 0.5) {
    const u = y / H, { cx, r } = at(u), yy = base - y;
    const col = glazed ? g.glaze : paint > 0 ? g.body : wet, dk = glazed ? '#00000030' : paint > 0 ? '#00000020' : wetD;
    R(c, cx - r, yy - 0.5, r * 2, 0.5, col); R(c, cx + r * 0.45, yy - 0.5, r * 0.55, 0.5, dk);
    R(c, cx - r * 0.7, yy - 0.5, r * 0.25, 0.5, glazed ? '#ffffffa0' : paint > 0 ? '#ffffff40' : wetL);
    // vệt xoay khi đang nặn trên bàn xoay
    if (!paint && !glazed) for (let k = 0; k < 3; k++) { const a = spin + k * 2.1, x = Math.sin(a) * r; if (Math.cos(a) > 0 && Math.round(y * 2) % 3 === 0) R(c, cx + x - 0.25, yy - 0.5, 0.5, 0.5, wetD); }
    // hoa văn: viền đáy → viền miệng → viền cổ
    if (paint > 0) {
      if ((Math.abs(u - 0.1) < 0.04 && paint > 0.1) || (Math.abs(u - 0.9) < 0.04 && paint > 0.25) || (Math.abs(u - 0.62) < 0.02 && paint > 0.9)) R(c, cx - r, yy - 0.5, r * 2, 0.5, g.ink);
    }
  }
  if (paint > 0) {
    const n = Math.floor(clamp((paint - 0.3) / 0.55) * 5);
    for (let k = 0; k < n; k++) { const a = -1.1 + k * 0.55, u = 0.36 + (k % 2) * 0.08, { cx, r } = at(u), x = cx + Math.sin(a) * r * 0.85, y = base - u * H;
      for (let j = 0; j < 5; j++) circ(c, x + Math.cos(j * 1.26) * 0.8, y + Math.sin(j * 1.26) * 0.8, 0.45, g.ink); circ(c, x, y, 0.35, glazed ? '#ffd84a' : g.body); }
  }
  // miệng bình
  const top = at(1);
  ell(c, top.cx, base - H, Math.max(0.6, top.r), 0.7, glazed ? '#00000040' : wetD);
  if (glazed && Math.floor(t * 3 + cx0) % 4 === 0) twinkle(c, cx0 - RW * 0.4, base - H * 0.55, 1.8, '#ffffff');
}

/** Cảnh nền xưởng: tường vàng Hội An, xà gỗ, cửa sổ nhìn ra sông Hoài, kệ gốm, lò nung, bàn gỗ */
const room = () => bake('pottery:room', W, HH, (c, rnd) => {
  R(c, 0, 0, W, HH, '#f2c45a'); for (let k = 0; k < 600; k++) R(c, rnd() * W, rnd() * 130, 1 + rnd() * 2, 0.5, rnd() < 0.5 ? '#e8b448' : '#f8d478');
  for (let y = 40; y < 130; y += 30) R(c, 0, y, W, 0.5, '#e0a840');
  // xà gỗ trần + ngói
  R(c, 0, 0, W, 10, '#6a3a22'); for (let x = 0; x < W; x += 6) R(c, x, 0, 3, 10, '#7a4a2a'); R(c, 0, 10, W, 3, '#4a2614');
  for (const x of [0, 104, 214, 312]) R(c, x, 13, 8, 4, '#4a2614');
  // cửa sổ gỗ nhìn ra sông Hoài lúc chiều tà, đèn lồng soi nước
  const wx = 136, wy = 26, ww = 64, wh = 46;
  R(c, wx - 4, wy - 4, ww + 8, wh + 8, '#5a2e18'); const sky = c.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#ff9a6a'); sky.addColorStop(0.6, '#ffd8a0'); sky.addColorStop(1, '#5a8ab8'); c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
  circ(c, wx + 46, wy + 16, 5, '#fff0c0'); for (let x = wx; x < wx + ww; x += 4) R(c, x, wy + 26, 4, 6 + (x % 3), '#c87a4a');
  for (let x = wx; x < wx + ww; x += 9) { R(c, x + 1, wy + 22, 6, 5, '#f6c445'); poly(c, [x, wy + 22, x + 4, wy + 18, x + 8, wy + 22], '#8a3a2a'); }
  R(c, wx, wy + 32, ww, wh - 32, '#4a7ab0'); for (let k = 0; k < 12; k++) { const x = wx + rnd() * ww, y = wy + 34 + rnd() * 10; R(c, x, y, 2, 0.5, rnd() < 0.5 ? '#ffd860' : '#ff6a4a'); }
  for (let k = 0; k < 6; k++) { const x = wx + 6 + k * 10; circ(c, x, wy + 30, 1.4, k % 2 ? '#e8443a' : '#f6c445'); }
  for (let x = wx + ww / 3; x < wx + ww; x += ww / 3) R(c, x - 0.75, wy, 1.5, wh, '#5a2e18'); R(c, wx, wy + wh / 2 - 0.75, ww, 1.5, '#5a2e18');
  R(c, wx - 6, wy + wh + 3, ww + 12, 3, '#7a4a2a');
  for (let k = 0; k < 7; k++) circ(c, wx - 2 + k * 11, wy + wh + 1.5, 2.2, ['#e8443a', '#ff8ab0', '#ffffff'][k % 3]);
  // kệ gốm bên trái
  for (const y of [44, 72, 100]) { R(c, 46, y, 64, 3, '#7a4a2a'); R(c, 46, y + 3, 64, 1, '#4a2614'); }
  R(c, 46, 30, 2, 82, '#5a2e18'); R(c, 108, 30, 2, 82, '#5a2e18');
  const POTS = ['#c87a4a', '#2a5ab8', '#6ab8a8', '#e8dcc8', '#b8603a', '#f6c445'];
  for (const y of [44, 72, 100]) for (let x = 50; x < 104;) {
    const h = 8 + rnd() * 12, rr = 2.5 + rnd() * 3, col = POTS[Math.floor(rnd() * POTS.length)];
    for (let k = 0; k < h; k += 0.5) { const u = k / h, r = rr * vase(u); R(c, x + rr - r, y - k - 0.5, r * 2, 0.5, col); R(c, x + rr + r * 0.4, y - k - 0.5, r * 0.6, 0.5, '#00000024'); }
    if (rnd() < 0.6) R(c, x + rr * 0.2, y - h * 0.4, rr * 1.6, 0.6, rnd() < 0.5 ? '#ffffff' : '#2a5ab8'); x += rr * 2 + 2;
  }
  // chum lớn dưới sàn + bàn xoay phơi
  for (const [x, h, col] of [[14, 30, '#b8603a'], [30, 22, '#c87a4a'], [292, 18, '#2a5ab8']] as const) for (let k = 0; k < h; k += 0.5) { const u = k / h, r = (h / 3.2) * vase(u); R(c, x - r, TABLE + 10 - k, r * 2, 0.5, col); R(c, x + r * 0.4, TABLE + 10 - k, r * 0.6, 0.5, '#00000028'); }
  // lò nung gạch bên phải
  const kx = 262; half(c, kx, 100, 30, '#a84a2a'); R(c, kx - 30, 100, 60, 32, '#a84a2a');
  for (let y = 72; y < 132; y += 4) for (let x = kx - 30; x < kx + 30; x += 8) { const dx = x + ((y / 4) % 2) * 4; if (Math.hypot(dx - kx, Math.min(0, y - 100)) < 30) R(c, dx, y, 7.5, 0.5, '#7a3418'); }
  R(c, kx + 12, 50, 8, 26, '#8a3a1e'); R(c, kx + 11, 48, 10, 3, '#6a2a12');
  half(c, kx, 120, 12, '#2a0a04'); R(c, kx - 12, 120, 24, 12, '#2a0a04'); R(c, kx - 14, 130, 28, 2, '#5a2a14');
  // bàn gỗ dài + chân bàn
  R(c, 0, TABLE, W, 4, '#9a5a32'); R(c, 0, TABLE, W, 1, '#c88050'); R(c, 0, TABLE + 4, W, 16, '#7a4224');
  for (let x = 0; x < W; x += 40) { R(c, x + 2, TABLE + 6, 36, 12, '#8a4a2a'); R(c, x + 2, TABLE + 6, 36, 0.5, '#a8603a'); }
  // sàn gạch đất nung
  for (let y = TABLE + 20; y < HH; y += 6) for (let x = ((y / 6) % 2) * 8; x < W; x += 16) { R(c, x, y, 15.5, 5.5, '#c8784a'); R(c, x, y, 15.5, 0.5, '#d8905a'); }
  // tranh chữ thư pháp
  R(c, 222, 22, 18, 36, '#f8f0dc'); R(c, 221, 21, 20, 2, '#5a2e18'); R(c, 221, 57, 20, 2, '#5a2e18'); for (let k = 0; k < 4; k++) { R(c, 229, 27 + k * 8, 4, 1, '#2a1a1a'); R(c, 230, 25 + k * 8, 1, 5, '#2a1a1a'); }
  R(c, 230, 54, 2, 2, '#e8443a');
});

const NPC: AvatarLook = { gender: 'm', hair: 0, hairColor: 6, skin: 1, shirt: 6, outfit: 6 };

// ── Nhịp mũi tên (giống sàn nhảy): nặn → vẽ → quạt lửa. Trúng nhịp = nhân vật làm động tác, bình tiến thêm một bước
const BEAT = 1500, HIT_WIN = 450, AHEAD = 6500;   // thong thả cho dễ bấm (điện thoại cũng kịp)
const DIRS = [{ k: 'ArrowLeft', icon: '⬅️' }, { k: 'ArrowUp', icon: '⬆️' }, { k: 'ArrowDown', icon: '⬇️' }, { k: 'ArrowRight', icon: '➡️' }];
type Ph = 'shape' | 'paint' | 'kiln';
const BEATS: { t: number; ph: Ph }[] = [];
for (let t = SHAPE + 1600; t < PAINT - 300; t += BEAT) BEATS.push({ t, ph: 'shape' });
for (let t = PAINT + 1000; t < KILN - 200; t += BEAT) BEATS.push({ t, ph: 'paint' });
for (let t = KILN + 900; t < KILN + 5700; t += BEAT) BEATS.push({ t, ph: 'kiln' });
const N_OF = (ph: Ph) => BEATS.filter(b => b.ph === ph).length;
const stars = (n: number) => (n >= 0.8 ? 3 : n >= 0.5 ? 2 : 1);

export function PotteryRoom({ at: t0, me, mate, them, onExit }: { at: number; me: AvatarLook; mate: AvatarLook; them: AvatarLook | null; onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [lineTxt, setLine] = useState('');
  const [photo, setPhoto] = useState('');
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const meKey = JSON.stringify(me);
  // ghế xếp theo cả hai người ngay từ đầu; người ấy vào sau thì ngồi ghế trống bên cạnh (bình mình không nhảy chỗ)
  const looks = useMemo(() => [me, mate].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)), [meKey, JSON.stringify(mate)]); // eslint-disable-line react-hooks/exhaustive-deps
  const seats = useMemo(() => looks.map(l => (l !== me && !them) ? null : ({
    key: JSON.stringify(l), sit: img(characterSprite(l, 'sit').url), work: img(characterSprite(l, 'actsit', undefined, 'front', 4).url), push: img(characterSprite(l, 'actsit', undefined, 'front', 5).url),
    yay: img(characterSprite(l, 'actsit', undefined, 'front', 12).url), g: GLAZE[hash(JSON.stringify(l)) % GLAZE.length],
  })), [looks, !!them]); // eslint-disable-line react-hooks/exhaustive-deps
  const filled = seats.filter((p): p is NonNullable<typeof p> => !!p);
  const npc = useMemo(() => ({ idle: img(characterSprite(NPC, 'idle').url), wave: img(characterSprite(NPC, 'act', undefined, 'front', 12).url) }), []);
  const seq = useMemo(() => { let x = t0 % 2147483647 || 7; return BEATS.map(() => { x = (x * 16807) % 2147483647; return x % 4; }); }, [t0]);
  // nhịp đã trúng của từng người (theo look), và lúc trúng gần nhất để nhân vật làm động tác
  const hits = useRef<Record<string, Set<number>>>({}), lastHit = useRef<Record<string, number>>({});
  const mark = (who: string, k: number) => { (hits.current[who] ??= new Set()).add(k); lastHit.current[who] = Date.now(); };
  useEffect(() => onEvent('pot-hit', (d: { at: number; by: string; k: number }) => { if (d.at === t0 && d.by !== meKey) mark(d.by, d.k); }), [t0, meKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const press = (d: number) => {
    const el = Date.now() - t0, mine = hits.current[meKey];
    const k = BEATS.findIndex((b, i) => Math.abs(el - b.t) <= HIT_WIN && seq[i] === d && !mine?.has(i));
    setFlash(k >= 0 ? 'hit' : 'miss'); setTimeout(() => setFlash(null), 180);
    if (k >= 0) { mark(meKey, k); sendEvent('pot-hit', { at: t0, by: meKey, k }); }
  };
  const pressRef = useRef(press); pressRef.current = press;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { const d = DIRS.findIndex(x => x.k === e.key); if (d >= 0) { e.preventDefault(); pressRef.current(d); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  /** tỉ lệ trúng nhịp của một người trong một công đoạn (0..1) */
  const score = (who: string, ph: Ph) => { const h = hits.current[who]; if (!h) return 0; let n = 0; h.forEach(i => { if (BEATS[i].ph === ph) n++; }); return n / N_OF(ph); };
  const exitRef = useRef(onExit); exitRef.current = onExit;
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!;
    let raf = 0, last = '', snapped = false, ended = false;
    const put = (im: HTMLImageElement, x: number, y: number) => { if (im.complete && im.height) ctx.drawImage(im, Math.round(x), Math.round(y), im.width, im.height); };
    const frame = () => {
      const el = Date.now() - t0, t = el / 1000;
      setNow(Date.now());
      ctx.setTransform(Z, 0, 0, Z, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(room(), 0, 0, W, HH);
      // đèn lồng treo xà đung đưa
      for (let k = 0; k < 6; k++) { const ax = 20 + k * 56, sw = Math.sin(t * 1.3 + k) * 0.12, L = 10 + (k % 2) * 6, x = ax + Math.sin(sw) * L, y = 13 + Math.cos(sw) * L, col = ['#e8443a', '#f6c445', '#ff7ab0'][k % 3];
        line(ctx, ax, 13, x, y, 0.4, '#3a1a0a'); glow(ctx, x, y + 5, 12, '#ffc860', 0.4); ell(ctx, x, y + 5, 4, 5, col); for (let j = -2; j <= 2; j++) R(ctx, x + j * 1.4 - 0.25, y + 0.5, 0.5, 9, '#00000018'); R(ctx, x - 2.5, y, 5, 1, '#6a3a12'); R(ctx, x - 2.5, y + 9.5, 5, 1, '#6a3a12'); R(ctx, x - 0.25, y + 10.5, 0.5, 3, col); }
      // lò nung: lửa cháy to khi đang nung, bùng thêm mỗi lần quạt trúng nhịp
      const kx = 262, fan = Math.max(0, ...filled.map(p => 1 - (Date.now() - (lastHit.current[p.key] ?? 0)) / 600)) * (el > KILN && el < KILN + 6000 ? 1 : 0);
      const fire = (el > KILN && el < OUT ? 1 : 0.35) + fan * 0.8, fl = 0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 7);
      glow(ctx, kx, 124, 18 + fire * 16, '#ff8a2a', Math.min(1, 0.5 * fire * fl + 0.2));
      for (let k = 0; k < 9; k++) { const x = kx - 9 + k * 2.2, h = (4 + Math.abs(Math.sin(t * 9 + k * 1.7)) * 7) * (0.5 + fire * 0.6); poly(ctx, [x - 1.4, 132, x, 132 - h, x + 1.4, 132], k % 2 ? '#ffb030' : '#ff5a1a'); R(ctx, x - 0.25, 131 - h * 0.5, 0.5, h * 0.4, '#ffe880'); }
      for (let k = 0; k < 5; k++) { const p = (t * (0.3 + fire * 0.3) + k / 5) % 1; ctx.globalAlpha = Math.min(1, (1 - p) * (0.3 + fire * 0.4)); circ(ctx, kx + 16 + Math.sin(p * 5 + k) * 3, 46 - p * 40, 2 + p * 5, '#d8d0c8'); ctx.globalAlpha = 1; }
      // ông thợ gốm đứng hướng dẫn
      const nw = Math.floor(t / 4) % 3 === 0 && t % 4 < 1.4; { const im = nw ? npc.wave : npc.idle; put(im, 70 - im.width / 2, TABLE + 6 - im.height); }
      const glazed = el > KILN + 6000, flyOut = clamp((el - KILN) / 2000), flyBack = clamp((el - KILN - 6000) / 2000), away = el > KILN && el < KILN + 8000;
      const shaping = el > SHAPE && el < PAINT, painting = el >= PAINT && el < KILN, firing = el >= KILN && el < KILN + 6000, cheering = el > KILN + 7000;
      SEATS.forEach((sx, k) => {
        const p = seats[k];
        if (!p) { R(ctx, sx - 7, TABLE - 8, 14, 3, '#8a4a2a'); R(ctx, sx - 6, TABLE - 5, 2, 5, '#6a3a1a'); R(ctx, sx + 4, TABLE - 5, 2, 5, '#6a3a1a'); return; }
        const act = Date.now() - (lastHit.current[p.key] ?? 0) < 450;
        // tiến độ bình theo số nhịp trúng: nặn tới đâu thành dáng tới đó, trượt nhiều thì bình méo
        const sh = score(p.key, 'shape'), pt = score(p.key, 'paint');
        const s = 0.25 + 0.75 * sh, wob = el > SHAPE + 2000 ? (1 - sh) * clamp((el - SHAPE) / 17000) : 0, paint = el >= PAINT ? Math.max(0.05, pt) : 0;
        const im = shaping ? (act ? p.push : p.work) : painting ? p.work : firing ? (act ? p.push : p.sit) : cheering ? (Math.floor(t * 2 + k) % 2 ? p.yay : p.sit) : p.sit;
        // tay nhân vật (ảnh gốc: tay ở toạ độ 12/20, 34) ôm hai bên bụng bình
        put(im, sx - im.width / 2, TABLE - 2.6 - 8 - 34 + (act && shaping ? 1 : 0));
        R(ctx, sx - 18, TABLE, 36, 20, '#7a4224'); R(ctx, sx - 18, TABLE, 36, 4, '#9a5a32'); R(ctx, sx - 18, TABLE, 36, 1, '#c88050'); R(ctx, sx - 16, TABLE + 6, 32, 12, '#8a4a2a');
        // bàn xoay
        const spin = shaping ? t * 14 : 0;
        ell(ctx, sx, TABLE - 1, 9, 2.2, '#5a3a2a'); ell(ctx, sx, TABLE - 1.6, 8, 1.8, '#8a6a5a'); for (let j = 0; j < 4; j++) { const a = spin + j * Math.PI / 2; R(ctx, sx + Math.cos(a) * 7 - 0.25, TABLE - 1.6 + Math.sin(a) * 1.5 - 0.25, 0.5, 0.5, '#c8a898'); }
        R(ctx, sx - 1, TABLE, 2, 4, '#3a2a1a');
        const base = TABLE - 2.6;
        if (!away && el > POT_WAIT - 1500) drawVase(ctx, sx, base, s, spin, p.g, paint, glazed, t, wob);
        if (el > KILN && el < KILN + 2000) { const x = sx + (kx - sx) * flyOut, y = base - Math.sin(flyOut * Math.PI) * 30 + (124 - base) * flyOut; drawVase(ctx, x, y, s, 0, p.g, paint, false, t, wob); }
        if (el > KILN + 6000 && el < KILN + 8000) { const x = kx + (sx - kx) * flyBack, y = 124 - Math.sin(flyBack * Math.PI) * 30 + (base - 124) * flyBack; drawVase(ctx, x, y, s, 0, p.g, paint, true, t, wob); }
        // trúng nhịp lúc nặn: nước bắn tung toé; lúc vẽ: cọ chấm màu
        if (shaping && act) for (let j = 0; j < 6; j++) { const q = (Date.now() - lastHit.current[p.key]) / 450; R(ctx, sx + (j - 2.5) * 3 * q * 2, base - 8 - Math.sin(q * Math.PI) * 8 - (j % 2) * 2, 0.7, 0.7, '#c8e0f0'); }
        if (painting) { const a = act ? 0.9 : Math.sin(t * 2 + k) * 0.3, tipX = sx + 2.5 + Math.sin(a) * 2.5, tipY = base - 10 + (act ? -2 : 0); line(ctx, sx + 4, base - 8, tipX + 1, tipY, 0.8, '#c88a4a'); R(ctx, tipX, tipY - 0.5, 1, 1, p.g.ink); if (act) glow(ctx, tipX, tipY, 4, '#ffffff', 0.6); R(ctx, sx + 9, TABLE - 3, 4, 3, '#f8f0e0'); R(ctx, sx + 9.5, TABLE - 2.5, 3, 1, p.g.ink); }
        if (glazed) { glow(ctx, sx, base - 8, 14, '#fff6c0', 0.35 + 0.15 * Math.sin(t * 3)); for (let j = 0; j < 4; j++) if ((Math.floor(t * 3) + j + k) % 3 === 0) star(ctx, sx - 9 + j * 6, base - 18 - (j % 2) * 6, 1.4, '#ffe880'); }
        // tim bay lên khi cả hai cùng trúng một nhịp
        if (act && filled.length > 1 && filled.every(q => Date.now() - (lastHit.current[q.key] ?? 0) < 450)) { const q = (Date.now() - lastHit.current[p.key]) / 450; heart(ctx, (SEATS[0] + SEATS[1]) / 2, 90 - q * 14, 3, '#ff5a8a'); }
      });
      // pháo giấy khi ra lò
      if (el > KILN + 7000) for (let k = 0; k < 40; k++) { const x = (k * 37 + Math.sin(t * 2 + k) * 6) % W, y = ((t - KILN / 1000 - 7) * 30 + k * 23) % 140; R(ctx, x, y, 1.6 * Math.abs(Math.sin(t * 4 + k)) + 0.3, 1.2, ['#e8443a', '#f6c445', '#5ab8ff', '#ff8ab0', '#ffffff'][k % 5]); }
      const ln = el < POT_WAIT ? `🏺 Xưởng gốm Thanh Hà — ngồi vào bàn xoay nào… ${Math.ceil((POT_WAIT - el) / 1000)}` : el < PAINT ? '🌀 Bấm mũi tên đúng nhịp để vuốt đất thành dáng bình' : el < KILN ? '🖌️ Bấm đúng nhịp để vẽ hoa văn' : el < KILN + 6000 ? '🔥 Bấm đúng nhịp để quạt lửa lò nung!' : '✨ Ra lò rồi! Bình gốm của hai bạn';
      if (ln !== last) { last = ln; setLine(ln); }
      if (!snapped && el > KILN + 9000) {
        snapped = true; const ph = document.createElement('canvas'); ph.width = 512; ph.height = 288; const pc = ph.getContext('2d')!; pc.imageSmoothingEnabled = false;
        pc.drawImage(c, 68 * Z, 62 * Z, 192 * Z, 108 * Z, 0, 0, 512, 288); setPhoto(ph.toDataURL('image/png'));
      }
      if (!ended && el > POT_MS) { ended = true; setDone(true); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [t0, seats, npc]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!done) return; const t = setTimeout(() => exitRef.current(), 15000); return () => clearTimeout(t); }, [done]);
  const el = now - t0, live = el > SHAPE && el < KILN + 6000;
  const total = (who: string) => (hits.current[who]?.size ?? 0) / BEATS.length;
  const other = filled.find(p => p.key !== meKey);
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return createPortal(
    <div className="coaster" onClick={stop} onPointerDown={stop} onMouseDown={stop} onTouchStart={stop}>
      <canvas ref={cv} width={W * Z} height={HH * Z} />
      {!done && lineTxt && <b className="coaster-line">{lineTxt}</b>}
      {!done && el > SHAPE - 2000 && el < KILN + 6500 && (
        <div className="dance-bar pot-bar">
          <div className="dance-head"><span>🎯 Trúng {hits.current[meKey]?.size ?? 0}/{BEATS.length}{other ? ` · người ấy ${hits.current[other.key]?.size ?? 0}` : ''}</span></div>
          <div className={`dance-lane ${flash ?? ''}`}>
            <div className="dance-target" />
            {BEATS.map((b, k) => {
              const dt = b.t - el; if (dt < -400 || dt > AHEAD) return null;
              const hit = hits.current[meKey]?.has(k);
              return <span key={k} className={`dance-arrow ${hit ? 'hit' : ''}`} style={{ left: `calc(10% + ${(dt / AHEAD) * 86}%)` }}>{DIRS[seq[k]].icon}</span>;
            })}
          </div>
          <div className="dance-keys">{DIRS.map((d, i) => <button key={d.k} className="btn" disabled={!live} onPointerDown={e => { e.preventDefault(); press(i); }}>{d.icon}</button>)}</div>
        </div>
      )}
      {done && (
        <div className="coaster-end">
          <h3>🏺 Bình gốm tự tay nặn đã vào túi đồ!</h3>
          <p>Bạn {'⭐'.repeat(stars(total(meKey)))}{other ? ` · Người ấy ${'⭐'.repeat(stars(total(other.key)))}` : ''}</p>
          {photo && <img src={photo} alt="Ảnh xưởng gốm" />}
          <div className="row">
            {photo && <a className="btn small ghost" href={photo} download="xuong-gom-thanh-ha.png">💾 Lưu ảnh</a>}
            <button className="btn small" onClick={() => exitRef.current()}>🚶 Ra về</button>
          </div>
        </div>
      )}
      {!done && <button className="coaster-x btn small ghost" onClick={() => { if (confirm('Rời xưởng giữa chừng?')) exitRef.current(); }}>✖</button>}
    </div>,
    document.body,
  );
}

/** Quầy gốm trên bản đồ phố cổ: kệ gỗ bày bình lọ, mái che, bàn xoay */
export const potteryStallSprite = () => makeSprite('hoian:pottery-stall', 40, 30, p => {
  p.rect(2, 4, 36, 4, '#8a3a2a'); for (let x = 2; x < 38; x += 4) p.rect(x, 8, 2, 2, x % 8 ? '#f6c445' : '#8a3a2a');
  p.rect(4, 8, 2, 20, '#5a2e18'); p.rect(34, 8, 2, 20, '#5a2e18');
  p.rect(4, 18, 32, 2, '#7a4a2a'); p.rect(4, 27, 32, 2, '#7a4a2a');
  const pot = (x: number, y: number, h: number, w: number, c: string) => { for (let k = 0; k < h; k++) { const r = Math.max(1, Math.round(w * vase(k / h))); p.rect(x - r, y - k, r * 2, 1, c); } };
  pot(9, 17, 7, 3, '#c87a4a'); pot(16, 17, 5, 2, '#2a5ab8'); pot(23, 17, 8, 3, '#6ab8a8'); pot(30, 17, 6, 2, '#f4ecdc');
  pot(11, 26, 6, 3, '#f4ecdc'); pot(20, 26, 7, 3, '#b8603a'); pot(28, 26, 5, 2, '#2a5ab8');
  p.px(23, 13, '#ffffff'); p.px(11, 23, '#2a5ab8'); p.px(30, 14, '#2a5ab8');
}, '#2a1408');
