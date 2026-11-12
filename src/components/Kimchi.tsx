// Lớp muối kim chi (Kimjang) ở làng Penguin, Gwangju — thủ phủ kim chi Hàn Quốc.
// Sân nhà hanok mùa thu: mái ngói cong, cửa giấy hanji, chum tương onggi, dây ớt phơi, cây hồng chín đỏ, bà cụ mặc hanbok hướng dẫn.
// Bốn công đoạn như ngoài đời: xát muối cải thảo → trộn sốt ớt (ớt bột, tỏi, gừng, củ cải, hành, mắm) → đeo găng phết sốt
// từng lá → cuộn bắp cải xếp vào chum. Cuối cùng theo phong tục, hai người đút cho nhau miếng kim chi cuộn thịt luộc (bossam).
// Bấm mũi tên đúng nhịp như sàn nhảy; hai máy đồng bộ theo mốc `at`.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterSprite, type AvatarLook } from '../lib/sprites';
import { makeSprite } from '../lib/pixel';
import { bake, circ, ell, glow, heart, line, poly, R, star, twinkle, type Ctx } from '../lib/canvasArt';
import { onEvent, sendEvent } from '../lib/realtime';

export const KIM_WAIT = 6000;
const SALT = KIM_WAIT, MIX = SALT + 13500, SPREAD = MIX + 12000, PACK = SPREAD + 15000, FEED = PACK + 7500;
export const KIM_MS = FEED + 9500;
/** vào ngồi cùng được tới trước lúc trộn sốt */
export const KIM_JOIN = MIX;
const W = 320, HH = 180, Z = 2, TABLE = 136, SEATS = [120, 208], BASIN = 164;
const img = (url: string) => { const i = new Image(); i.src = url; return i; };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);

// ── Nhịp mũi tên: xát muối → trộn sốt → phết sốt → xếp chum
const BEAT = 1500, HIT_WIN = 450, AHEAD = 6500;
const DIRS = [{ k: 'ArrowLeft', icon: '⬅️' }, { k: 'ArrowUp', icon: '⬆️' }, { k: 'ArrowDown', icon: '⬇️' }, { k: 'ArrowRight', icon: '➡️' }];
type Ph = 'salt' | 'mix' | 'spread' | 'pack';
const BEATS: { t: number; ph: Ph }[] = [];
for (let t = SALT + 1600; t < MIX - 300; t += BEAT) BEATS.push({ t, ph: 'salt' });
for (let t = MIX + 1000; t < SPREAD - 300; t += BEAT) BEATS.push({ t, ph: 'mix' });
for (let t = SPREAD + 1000; t < PACK - 300; t += BEAT) BEATS.push({ t, ph: 'spread' });
for (let t = PACK + 900; t < PACK + 5400; t += BEAT) BEATS.push({ t, ph: 'pack' });
const N_OF = (ph: Ph) => BEATS.filter(b => b.ph === ph).length;
const stars = (n: number) => (n >= 0.8 ? 3 : n >= 0.5 ? 2 : 1);

/** Nửa cây cải thảo nằm ngang: gốc trắng → lá xanh mép xoăn. salt: hạt muối, wilt: héo mềm, red: phủ sốt (patch: chỗ sót), roll: cuộn tròn */
function cabbage(c: Ctx, x0: number, y0: number, o: { salt: number; wilt: number; red: number; patch: number; roll: number; t: number }) {
  c.save(); c.translate(x0, y0); c.scale(1.5, 1.5); cabbage1(c, 0, 0, o); c.restore();
}
function cabbage1(c: Ctx, x: number, y: number, o: { salt: number; wilt: number; red: number; patch: number; roll: number; t: number }) {
  if (o.roll > 0.98) { ell(c, x, y - 3.5, 7.5, 4, '#b8301e'); ell(c, x - 1, y - 4.5, 6, 2.8, '#d8402a'); for (let k = 0; k < 7; k++) R(c, x - 5 + k * 1.6, y - 5 + (k % 2), 0.7, 0.5, k % 2 ? '#f6e0a0' : '#3a8a3a'); R(c, x - 6, y - 3, 3, 1.5, '#f4e8c8'); return; }
  const L = 26 * (1 - o.roll * 0.6);
  for (let i = 0; i <= L * 2; i++) {
    const u = i / (L * 2), px = x - L / 2 + u * L;
    const th = (5 + 4 * Math.sin(u * Math.PI * 0.92)) * (1 - o.wilt * 0.28) * (1 + o.roll * 0.6), top = y - th + (u > 0.55 ? Math.sin(u * 40) * 0.6 : 0);
    const col = u < 0.42 ? '#f6f2dc' : u < 0.6 ? '#e4f0b0' : u < 0.8 ? '#b4dc7a' : '#7ac04a';
    R(c, px, top, 0.5, th, col); R(c, px, y - 1, 0.5, 1, u < 0.5 ? '#e0d8b8' : '#5a9a3a');
    // gân lá + lớp lá xếp chồng
    for (let k = 1; k < 4; k++) if (((i + k * 3) % 9) === 0) R(c, px, top + th * k / 4, 0.5, 0.5, u < 0.5 ? '#e8e0c0' : '#9ad06a');
    // phủ sốt ớt đỏ (chỗ trượt nhịp thì còn sót trắng)
    if (o.red > 0) { const miss = ((i * 37) % 10) / 10 < o.patch; if (!miss) { c.globalAlpha = Math.min(1, o.red) * 0.9; R(c, px, top + 0.3, 0.5, th - 0.6, u < 0.5 ? '#d8482a' : '#b8401e'); c.globalAlpha = 1; } }
  }
  if (o.red > 0.3) for (let k = 0; k < Math.floor(o.red * 14); k++) R(c, x - L / 2 + ((k * 7.3) % L), y - 1.5 - ((k * 3.1) % 5), 0.6, 0.5, ['#f6e0a0', '#3a8a3a', '#ffffff'][k % 3]);
  if (o.salt > 0) for (let k = 0; k < Math.floor(o.salt * 26); k++) R(c, x - L / 2 + 2 + ((k * 5.7) % (L - 3)), y - 2 - ((k * 2.3) % 5.5), 0.5, 0.5, '#ffffff');
  if (o.wilt > 0.5 && o.red < 0.1) for (let k = 0; k < 3; k++) { const q = (o.t * 0.6 + k / 3) % 1; c.globalAlpha = (1 - q) * 0.5; R(c, x - 6 + k * 6, y + 0.5 + q * 1.5, 1, 0.5, '#bfe4ff'); c.globalAlpha = 1; }
}
/** chum đất onggi nâu bóng */
function onggi(c: Ctx, x: number, base: number, h: number, open: boolean, glossT = 0) {
  for (let k = 0; k < h; k += 0.5) { const u = k / h, r = h * 0.42 * (u < 0.55 ? 0.7 + Math.sin(u / 0.55 * Math.PI / 2) * 0.3 : 0.55 + 0.45 * Math.cos((u - 0.55) / 0.45 * Math.PI / 2)); R(c, x - r, base - k - 0.5, r * 2, 0.5, '#6a3a1e'); R(c, x + r * 0.35, base - k - 0.5, r * 0.65, 0.5, '#4a2410'); R(c, x - r * 0.65, base - k - 0.5, r * 0.18, 0.5, '#a8683a'); }
  R(c, x - h * 0.28, base - h - 1, h * 0.56, 1.5, '#5a2e14');
  if (!open) { ell(c, x, base - h - 1.5, h * 0.33, 1.6, '#7a4422'); ell(c, x, base - h - 2.4, h * 0.12, 0.8, '#8a5430'); }
  else { ell(c, x, base - h - 0.6, h * 0.26, 1, '#2a1208'); }
  if (glossT && Math.floor(glossT * 3) % 5 === 0) twinkle(c, x - h * 0.2, base - h * 0.55, 1.4, '#ffffff');
}

/** Sân hanok: trời thu, mái ngói, tường trắng khung gỗ, cửa giấy hanji, chum tương, cây hồng, sàn gỗ maru, bàn thấp */
const yard = () => bake('kimchi:yard', W, HH, (c, rnd) => {
  const sky = c.createLinearGradient(0, 0, 0, 40); sky.addColorStop(0, '#6ab0f0'); sky.addColorStop(1, '#cfe8ff'); c.fillStyle = sky; c.fillRect(0, 0, W, 40);
  for (let k = 0; k < 4; k++) { const x = 40 + k * 80, y = 8 + (k % 2) * 6; ell(c, x, y, 16, 3.5, '#ffffff'); ell(c, x + 8, y - 2, 9, 3, '#ffffff'); }
  // núi Mudeung xa xa phủ lá đỏ
  for (let x = 0; x < W; x += 0.5) { const h = 10 + Math.sin(x / 31) * 5 + Math.sin(x / 9) * 1.5; R(c, x, 40 - h, 0.5, h, '#c86a4a'); if (rnd() < 0.2) R(c, x, 40 - h + rnd() * h, 0.5, 0.5, '#e8a040'); }
  // tường trắng + khung gỗ đen
  R(c, 0, 40, W, 74, '#f4ecdc'); for (let k = 0; k < 400; k++) R(c, rnd() * W, 44 + rnd() * 66, 1 + rnd() * 2, 0.5, '#e8dcc4');
  for (const x of [0, 70, 160, 250, 316]) R(c, x, 40, 4, 74, '#4a2e1e');
  R(c, 0, 40, W, 4, '#4a2e1e'); R(c, 0, 76, W, 2, '#5a3a24'); R(c, 0, 110, W, 4, '#4a2e1e');
  // cửa giấy hanji ô lưới (hai bộ)
  for (const dx of [78, 168]) { R(c, dx, 46, 76, 62, '#5a3a24'); R(c, dx + 2, 48, 72, 58, '#fbf4e4'); for (let x = dx + 2; x < dx + 74; x += 6) R(c, x, 48, 0.5, 58, '#8a6040'); for (let y = 48; y < 106; y += 6) R(c, dx + 2, y, 72, 0.5, '#8a6040'); R(c, dx + 37, 46, 2, 62, '#5a3a24');
    for (let k = 0; k < 5; k++) { const fx = dx + 8 + k * 14, fy = 56 + (k % 2) * 30; ell(c, fx, fy, 2, 1.2, '#f0a8b8'); R(c, fx - 0.25, fy + 1, 0.5, 3, '#8a6040'); } }
  // mái ngói cong trên cùng (giwa) + đầu ngói tròn
  c.fillStyle = '#3a4250'; c.beginPath(); c.moveTo(-10, 46); c.quadraticCurveTo(W / 2, 30, W + 10, 46); c.lineTo(W + 10, 20); c.quadraticCurveTo(W / 2, 12, -10, 20); c.fill();
  for (let x = -6; x < W + 6; x += 4) { const y = 44 - Math.sin((x + 10) / (W + 20) * Math.PI) * 8; R(c, x, 20 - Math.sin((x + 10) / (W + 20) * Math.PI) * 4, 2, y - 20 + Math.sin((x + 10) / (W + 20) * Math.PI) * 4, '#4a5262'); circ(c, x + 1, y, 1.6, '#2a303a'); circ(c, x + 1, y, 0.8, '#5a6272'); }
  poly(c, [-10, 20, 0, 12, 12, 18], '#3a4250'); poly(c, [W + 10, 20, W, 12, W - 12, 18], '#3a4250');
  R(c, 0, 46, W, 2, '#8a3a2a'); for (let x = 0; x < W; x += 8) R(c, x, 48, 4, 1.5, x % 16 ? '#3a8a6a' : '#e8c040');
  // bệ chum tương (jangdokdae) bên phải phía sau
  R(c, 250, 104, 70, 10, '#a89a88'); R(c, 250, 104, 70, 1, '#c8bca8'); for (let x = 250; x < W; x += 10) R(c, x, 105, 0.5, 9, '#8a7c6a');
  for (const [x, h] of [[262, 18], [280, 24], [298, 20], [312, 15], [271, 12], [290, 13]] as const) onggi(c, x, 104 + (h < 14 ? 2 : 0), h, false);
  // bện tỏi treo tường + giỏ ớt khô
  for (let k = 0; k < 7; k++) { circ(c, 60 + (k % 2), 54 + k * 3.4, 2.1, '#f4ecd8'); R(c, 59.5 + (k % 2), 52 + k * 3.4, 1, 1, '#c8b890'); } R(c, 59.5, 48, 1, 6, '#c8a060');
  // sàn gỗ maru
  R(c, 0, 114, W, HH - 114, '#c8905a'); for (let y = 114; y < HH; y += 5) { R(c, 0, y, W, 0.5, '#a8703a'); } for (let k = 0; k < 40; k++) R(c, rnd() * W, 115 + rnd() * 64, 10 + rnd() * 20, 0.5, '#d8a06a');
  // đống cải thảo trên chiếu rơm (góc trái)
  R(c, 4, 146, 54, 22, '#d8c078'); for (let x = 4; x < 58; x += 3) R(c, x, 146, 0.5, 22, '#c0a860');
  for (const [x, y] of [[16, 158], [32, 160], [46, 157], [24, 151], [40, 151]] as const) { ell(c, x, y, 7, 3.6, '#7ac04a'); ell(c, x - 2, y, 4.5, 3, '#e8f0c0'); ell(c, x + 3, y - 1, 3, 2.4, '#5aa03a'); }
  // bàn gỗ thấp dài + đệm ngồi
  R(c, 84, TABLE, 160, 3.5, '#8a5030'); R(c, 84, TABLE, 160, 1, '#b07040'); R(c, 84, TABLE + 3.5, 160, 9, '#6a3a20');
  for (const x of [88, 236]) R(c, x, TABLE + 12, 4, 8, '#5a2e18');
}, Z);

const GRANNY: AvatarLook = { gender: 'f', hair: 1, hairColor: 6, skin: 1, shirt: 4, outfit: 13 };

export function KimchiRoom({ at: t0, me, mate, them, onExit }: { at: number; me: AvatarLook; mate: AvatarLook; them: AvatarLook | null; onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [lineTxt, setLine] = useState('');
  const [photo, setPhoto] = useState('');
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const meKey = JSON.stringify(me);
  const looks = useMemo(() => [me, mate].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)), [meKey, JSON.stringify(mate)]); // eslint-disable-line react-hooks/exhaustive-deps
  const seats = useMemo(() => looks.map(l => (l !== me && !them) ? null : ({
    key: JSON.stringify(l), sit: img(characterSprite(l, 'sit').url), work: img(characterSprite(l, 'actsit', undefined, 'front', 4).url), push: img(characterSprite(l, 'actsit', undefined, 'front', 5).url),
    yay: img(characterSprite(l, 'actsit', undefined, 'front', 12).url), feed: img(characterSprite(l, 'actsit', undefined, 'front', 1).url),
  })), [looks, !!them]); // eslint-disable-line react-hooks/exhaustive-deps
  const filled = seats.filter((p): p is NonNullable<typeof p> => !!p);
  const npc = useMemo(() => ({ idle: img(characterSprite(GRANNY, 'idle').url), wave: img(characterSprite(GRANNY, 'act', undefined, 'front', 12).url) }), []);
  const seq = useMemo(() => { let x = (t0 * 7) % 2147483647 || 11; return BEATS.map(() => { x = (x * 16807) % 2147483647; return x % 4; }); }, [t0]);
  const hits = useRef<Record<string, Set<number>>>({}), lastHit = useRef<Record<string, number>>({});
  const mark = (who: string, k: number) => { (hits.current[who] ??= new Set()).add(k); lastHit.current[who] = Date.now(); };
  useEffect(() => onEvent('kim-hit', (d: { at: number; by: string; k: number }) => { if (d.at === t0 && d.by !== meKey) mark(d.by, d.k); }), [t0, meKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const press = (d: number) => {
    const el = Date.now() - t0, mine = hits.current[meKey];
    const k = BEATS.findIndex((b, i) => Math.abs(el - b.t) <= HIT_WIN && seq[i] === d && !mine?.has(i));
    setFlash(k >= 0 ? 'hit' : 'miss'); setTimeout(() => setFlash(null), 180);
    if (k >= 0) { mark(meKey, k); sendEvent('kim-hit', { at: t0, by: meKey, k }); }
  };
  const pressRef = useRef(press); pressRef.current = press;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { const d = DIRS.findIndex(x => x.k === e.key); if (d >= 0) { e.preventDefault(); pressRef.current(d); } };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);
  const score = (who: string, ph: Ph) => { const h = hits.current[who]; if (!h) return 0; let n = 0; h.forEach(i => { if (BEATS[i].ph === ph) n++; }); return n / N_OF(ph); };
  const exitRef = useRef(onExit); exitRef.current = onExit;

  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!;
    let raf = 0, last = '', snapped = false, ended = false;
    const put = (im: HTMLImageElement, x: number, y: number) => { if (im.complete && im.height) ctx.drawImage(im, Math.round(x), Math.round(y), im.width, im.height); };
    const frame = () => {
      const nowMs = Date.now(), el = nowMs - t0, t = el / 1000;
      setNow(nowMs);
      ctx.setTransform(Z, 0, 0, Z, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(yard(), 0, 0, W, HH);
      // cây hồng chín đỏ góc trái trên, cành đung đưa, lá phong rơi
      { const sw = Math.sin(t * 0.8) * 0.8; line(ctx, 0, 30, 46 + sw, 22, 2, '#4a2e1e'); line(ctx, 20, 26, 34 + sw, 12, 1.2, '#4a2e1e'); line(ctx, 36, 24, 58 + sw, 30, 1, '#4a2e1e');
        for (const [x, y] of [[14, 24], [30, 14], [44, 20], [52, 30], [26, 30], [38, 10]] as const) { circ(ctx, x + sw, y, 3.2, '#e8603a'); circ(ctx, x + sw - 1, y - 1, 1.2, '#ffa060'); R(ctx, x + sw - 1, y - 3.4, 2, 1, '#3a6a2a'); }
        for (let k = 0; k < 8; k++) ell(ctx, 8 + k * 7 + sw, 18 + (k % 3) * 6, 2.4, 1.2, ['#c84a2a', '#e8a040', '#d86a2a'][k % 3], k); }
      // dây ớt đỏ phơi dưới mái, đung đưa
      for (let s = 0; s < 4; s++) { const ax = 150 + s * 26, sw = Math.sin(t * 1.1 + s) * 1.2; for (let k = 0; k < 9; k++) { const q = k / 8, x = ax + sw * q, y = 50 + k * 3.2; ell(ctx, x + (k % 2 ? 1 : -1), y, 1, 1.8, k % 3 ? '#d82a1a' : '#b81a10', k % 2 ? 0.4 : -0.4); } R(ctx, ax - 0.25, 48, 0.5, 30, '#c8a060'); }
      for (let k = 0; k < 10; k++) { const sp = 6 + (k % 4) * 2, x = (k * 41 + t * sp) % (W + 20) - 10, y = (k * 29 + t * sp * 0.7) % 120; ell(ctx, x, y, 1.6, 0.8, ['#e8603a', '#f6a83a', '#c83a2a'][k % 3], t * 2 + k); }
      // nồi luộc thịt (bossam) trên bếp than bên phải, bốc hơi
      { const bx = 290, by = 160; R(ctx, bx - 12, by - 2, 24, 14, '#4a4a52'); for (let k = 0; k < 5; k++) circ(ctx, bx - 8 + k * 4, by - 2, 1.4, k % 2 ? '#ff6a2a' : '#ffb040'); glow(ctx, bx, by - 2, 14, '#ff8a3a', 0.35 + 0.1 * Math.sin(t * 8));
        R(ctx, bx - 10, by - 14, 20, 12, '#8a8a92'); R(ctx, bx - 11, by - 15, 22, 2, '#a8a8b0'); R(ctx, bx - 13, by - 11, 3, 1.5, '#6a6a72'); R(ctx, bx + 10, by - 11, 3, 1.5, '#6a6a72');
        for (let k = 0; k < 4; k++) { const q = (t * 0.4 + k / 4) % 1; ctx.globalAlpha = (1 - q) * 0.45; circ(ctx, bx - 4 + k * 3 + Math.sin(q * 6 + k) * 3, by - 18 - q * 26, 2 + q * 4, '#ffffff'); ctx.globalAlpha = 1; } }
      // bà cụ mặc hanbok đứng hướng dẫn
      { const wave = Math.floor(t / 4) % 3 === 0 && t % 4 < 1.4, im = wave ? npc.wave : npc.idle; put(im, 70 - im.width / 2, TABLE + 4 - im.height); }
      const salting = el > SALT && el < MIX, mixing = el >= MIX && el < SPREAD, spreading = el >= SPREAD && el < PACK, packing = el >= PACK && el < FEED, feeding = el >= FEED;
      // chậu sốt ớt chung giữa bàn: nguyên liệu cho dần vào rồi trộn thành sốt đỏ sệt
      const mixAll = filled.length ? Math.max(...filled.map(p => score(p.key, 'mix'))) : 0;
      const stir = Math.max(0, ...filled.map(p => 1 - (nowMs - (lastHit.current[p.key] ?? 0)) / 500)) * (mixing ? 1 : 0);
      { const x = BASIN, y = TABLE - 1; ell(ctx, x, y + 0.5, 19, 5, '#a8201a'); ell(ctx, x, y - 4, 18, 4.2, '#d8302a'); ell(ctx, x, y - 4, 15.5, 3.2, '#7a1410');
        const filledIn = el > MIX ? clamp((el - MIX) / 3000) : el > SALT ? 0.15 : 0;
        if (filledIn > 0) { const red = el >= SPREAD ? 1 : mixAll; ell(ctx, x, y - 4, 15 * filledIn + 2, 2.8, red > 0.4 ? '#c8301e' : '#e8603a');
          for (let k = 0; k < 18; k++) { const a = k * 2.4 + (mixing ? t * 3 * (0.3 + stir) : 0), d = (k % 5) * 2.6 + 1, cx = x + Math.cos(a) * d * 1.2, cy = y - 4 + Math.sin(a) * d * 0.22; if (red < 0.95 || k % 3 === 0) R(ctx, cx, cy, k % 3 ? 1.2 : 0.8, 0.6, ['#ffffff', '#3a9a3a', '#f6e0a0', '#e8402a', '#fffbe8', '#8a3a1a'][k % 6]); } }
        // mái chèo gỗ khuấy
        if (mixing || salting) { const a = mixing ? t * (2 + stir * 6) : 0.6, ex = x + Math.cos(a) * 9, ey = y - 4 + Math.sin(a) * 2; line(ctx, ex, ey, ex + 6, ey - 14, 1.4, '#c8905a'); ell(ctx, ex, ey, 2.4, 1, '#b07a4a'); }
        if (stir > 0.3) for (let k = 0; k < 5; k++) R(ctx, x - 8 + k * 4 + Math.sin(t * 9 + k) * 2, y - 8 - stir * 5 - (k % 2) * 2, 0.8, 0.8, '#e8402a'); }
      SEATS.forEach((sx0, k) => {
        const p = seats[k];
        // tới lúc đút nhau ăn thì hai người xích lại gần
        const slide = feeding && filled.length > 1 ? ease(clamp((el - FEED) / 1500)) * 26 * (k ? -1 : 1) : 0, sx = sx0 + slide;
        if (!p) { R(ctx, sx0 - 10, TABLE + 13, 20, 4, '#b84a5a'); R(ctx, sx0 - 10, TABLE + 13, 20, 1, '#d86a7a'); return; }
        const act = nowMs - (lastHit.current[p.key] ?? 0) < 450;
        const sl = score(p.key, 'salt'), sp = score(p.key, 'spread'), pk = score(p.key, 'pack');
        const im = feeding ? (Math.floor(t * 1.2 + k) % 2 ? p.feed : p.yay) : (salting || mixing || spreading || packing) ? (act ? p.push : p.work) : p.sit;
        // đệm ngồi
        R(ctx, sx - 10, TABLE + 13, 20, 4, '#b84a5a'); R(ctx, sx - 10, TABLE + 13, 20, 1, '#d86a7a');
        const y0 = TABLE - 2.6 - 8 - 34 + (act && !feeding ? 1 : 0), x0 = sx - im.width / 2;
        put(im, x0, y0);
        // găng tay cao su đỏ (từ lúc trộn sốt)
        if (el >= MIX && !feeding) { R(ctx, x0 + 11, y0 + 33, 3, 3, '#e8303a'); R(ctx, x0 + 19, y0 + 33, 3, 3, '#e8303a'); R(ctx, x0 + 11, y0 + 33, 3, 0.6, '#ff7a7a'); R(ctx, x0 + 19, y0 + 33, 3, 0.6, '#ff7a7a'); }
        // mặt bàn phía trước che chân
        R(ctx, sx - 22, TABLE, 44, 3.5, '#8a5030'); R(ctx, sx - 22, TABLE, 44, 1, '#b07040'); R(ctx, sx - 22, TABLE + 3.5, 44, 9, '#6a3a20');
        // khay + bắp cải của mỗi người
        if (!feeding || el < FEED + 800) {
          const rollQ = packing ? clamp(pk * 1.2) : el >= FEED ? 1 : 0, fly = clamp((el - (PACK + 5600)) / 1400);
          const jx = k ? 252 : 76, jb = TABLE + 30;
          R(ctx, sx - 22, TABLE - 1.5, 44, 1.5, '#d8d0c0'); R(ctx, sx - 22, TABLE - 1.5, 44, 0.5, '#f0ece0');
          if (fly <= 0) cabbage(ctx, sx, TABLE - 1.5, { salt: salting ? sl : el >= MIX ? Math.max(0.3, sl) * 0.5 : 0, wilt: el >= MIX ? 0.4 + sl * 0.6 : sl * 0.6, red: el >= SPREAD ? Math.max(0.08, sp) : 0, patch: el >= SPREAD ? (1 - sp) * clamp((el - SPREAD) / 13000) * 0.7 : 0, roll: rollQ, t });
          else if (fly < 1) cabbage(ctx, sx + (jx - sx) * fly, TABLE - 1.5 + (jb - 14 - TABLE) * fly - Math.sin(fly * Math.PI) * 26, { salt: 0, wilt: 1, red: 1, patch: 0, roll: 1, t });
          // chum riêng của mỗi người dưới sàn
          onggi(ctx, jx, jb, 18, el < PACK + 7000, el > PACK + 7000 ? t : 0);
        } else onggi(ctx, k ? 252 : 76, TABLE + 30, 18, false, t);
        // hiệu ứng khi trúng nhịp
        if (act && salting) for (let j = 0; j < 8; j++) { const q = (nowMs - lastHit.current[p.key]) / 450; R(ctx, sx - 6 + j * 1.8, TABLE - 16 + q * 12 + (j % 3), 0.6, 0.6, '#ffffff'); }
        if (act && spreading) { glow(ctx, sx + 4, TABLE - 5, 8, '#ff8a6a', 0.5); for (let j = 0; j < 4; j++) R(ctx, sx - 8 + j * 5, TABLE - 7 - (j % 2) * 2, 1, 1, '#e8402a'); }
        if (act && packing) star(ctx, sx + 9, TABLE - 12, 1.6, '#ffe880');
        if (act && filled.length > 1 && filled.every(q => nowMs - (lastHit.current[q.key] ?? 0) < 450)) { const q = (nowMs - lastHit.current[p.key]) / 450; heart(ctx, (SEATS[0] + SEATS[1]) / 2, 92 - q * 14, 3, '#ff5a8a'); }
      });
      // đút cho nhau miếng kim chi cuộn thịt luộc (lá cải bọc thịt + kim chi đỏ)
      if (feeding) {
        const L = SEATS[0] + (filled.length > 1 ? 26 : 0), Rr = SEATS[1] - (filled.length > 1 ? 26 : 0), mouthY = TABLE - 32;
        const ph = ((el - FEED - 1500) / 2400) % 2, q = clamp((ph % 1) * 1.4);
        if (el > FEED + 1500) {
          let fx: number, fy: number;
          if (filled.length > 1) { const from = ph < 1 ? L + 6 : Rr - 6, to = ph < 1 ? Rr : L; fx = from + (to - from) * ease(q); fy = mouthY + 6 - Math.sin(q * Math.PI) * 8; }
          else { const to = filled[0] && seats[0] ? SEATS[0] : SEATS[1]; fx = 74 + (to - 74) * ease(q); fy = TABLE - 22 - Math.sin(q * Math.PI) * 10 + (mouthY - TABLE + 22) * q; }
          if (q < 0.98) { ell(ctx, fx, fy, 3.2, 2.2, '#8ac860'); ell(ctx, fx, fy - 0.6, 2.2, 1.4, '#c8301e'); R(ctx, fx - 1, fy - 1.6, 2, 0.8, '#f4d8c0'); }
          else for (let j = 0; j < 3; j++) heart(ctx, fx + (j - 1) * 6, fy - 8 - j * 2 - (t % 1) * 4, 2, '#ff5a8a');
        }
        for (let k = 0; k < 40; k++) { const x = (k * 37 + Math.sin(t * 2 + k) * 6) % W, y = ((t - FEED / 1000) * 26 + k * 23) % 140; R(ctx, x, y, 1.6 * Math.abs(Math.sin(t * 4 + k)) + 0.3, 1.2, ['#e8443a', '#f6c445', '#5ab8ff', '#ff8ab0', '#ffffff'][k % 5]); }
      }
      const ln = el < KIM_WAIT ? `🥬 Lớp muối kim chi làng Penguin — ngồi vào bàn nào… ${Math.ceil((KIM_WAIT - el) / 1000)}` : el < MIX ? '🧂 Bấm đúng nhịp để xát muối vào từng lớp lá cải thảo' : el < SPREAD ? '🌶️ Bấm đúng nhịp trộn sốt: ớt bột, tỏi, gừng, củ cải, hành, mắm' : el < PACK ? '🧤 Đeo găng — bấm đúng nhịp phết sốt đỏ vào từng lá' : el < FEED ? '🏺 Cuộn bắp cải lại, xếp vào chum onggi!' : '💕 Đút cho nhau miếng kim chi cuộn thịt luộc — ngon quá!';
      if (ln !== last) { last = ln; setLine(ln); }
      if (!snapped && el > FEED + 4200) {
        snapped = true; const ph = document.createElement('canvas'); ph.width = 512; ph.height = 288; const pc = ph.getContext('2d')!; pc.imageSmoothingEnabled = false;
        pc.drawImage(c, 62 * Z, 68 * Z, 192 * Z, 108 * Z, 0, 0, 512, 288); setPhoto(ph.toDataURL('image/png'));
      }
      if (!ended && el > KIM_MS) { ended = true; setDone(true); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [t0, seats, npc]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!done) return; const t = setTimeout(() => exitRef.current(), 15000); return () => clearTimeout(t); }, [done]);
  const el = now - t0, live = el > SALT && el < PACK + 5500;
  const total = (who: string) => (hits.current[who]?.size ?? 0) / BEATS.length;
  const other = filled.find(p => p.key !== meKey);
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return createPortal(
    <div className="coaster" onClick={stop} onPointerDown={stop} onMouseDown={stop} onTouchStart={stop}>
      <canvas ref={cv} width={W * Z} height={HH * Z} />
      {!done && lineTxt && <b className="coaster-line">{lineTxt}</b>}
      {!done && el > SALT - 2000 && el < PACK + 6000 && (
        <div className="dance-bar pot-bar">
          <div className="dance-head"><span>🎯 Trúng {hits.current[meKey]?.size ?? 0}/{BEATS.length}{other ? ` · người ấy ${hits.current[other.key]?.size ?? 0}` : ''}</span></div>
          <div className={`dance-lane ${flash ?? ''}`}>
            <div className="dance-target" />
            {BEATS.map((b, k) => {
              const dt = b.t - el; if (dt < -400 || dt > AHEAD) return null;
              return <span key={k} className={`dance-arrow ${hits.current[meKey]?.has(k) ? 'hit' : ''}`} style={{ left: `calc(10% + ${(dt / AHEAD) * 86}%)` }}>{DIRS[seq[k]].icon}</span>;
            })}
          </div>
          <div className="dance-keys">{DIRS.map((d, i) => <button key={d.k} className="btn" disabled={!live} onPointerDown={e => { e.preventDefault(); press(i); }}>{d.icon}</button>)}</div>
        </div>
      )}
      {done && (
        <div className="coaster-end">
          <h3>🥬 3 hũ kim chi tự muối đã vào túi đồ!</h3>
          <p>Cất vào tủ lạnh bếp nhà để làm Cơm chiên kim chi, Đĩa kim chi nha 🍳</p>
          <p>Bạn {'⭐'.repeat(stars(total(meKey)))}{other ? ` · Người ấy ${'⭐'.repeat(stars(total(other.key)))}` : ''}</p>
          {photo && <img src={photo} alt="Ảnh muối kim chi" />}
          <div className="row">
            {photo && <a className="btn small ghost" href={photo} download="muoi-kim-chi-gwangju.png">💾 Lưu ảnh</a>}
            <button className="btn small" onClick={() => exitRef.current()}>🚶 Ra về</button>
          </div>
        </div>
      )}
      {!done && <button className="coaster-x btn small ghost" onClick={() => { if (confirm('Rời lớp muối kim chi giữa chừng?')) exitRef.current(); }}>✖</button>}
    </div>,
    document.body,
  );
}

/** Quầy muối kim chi trên bản đồ làng Penguin: mái ngói nhỏ, chum onggi, rổ cải thảo, chậu sốt đỏ */
export const kimchiStallSprite = () => makeSprite('gwangju:kimchi-stall', 44, 32, p => {
  p.rect(0, 3, 44, 3, '#3a4250'); p.rect(2, 1, 40, 2, '#4a5262'); p.px(0, 2, '#3a4250'); p.px(43, 2, '#3a4250');
  p.rect(2, 6, 40, 1, '#8a3a2a'); p.rect(4, 7, 2, 23, '#4a2e1e'); p.rect(38, 7, 2, 23, '#4a2e1e');
  p.rect(12, 8, 20, 6, '#f4ecdc'); p.rect(14, 10, 3, 2, '#d82a1a'); p.rect(19, 10, 3, 2, '#3a8a3a'); p.rect(24, 10, 3, 2, '#d82a1a'); p.rect(29, 10, 1, 2, '#d82a1a');
  for (const [x, y, h] of [[10, 30, 9], [33, 30, 11]] as const) for (let k = 0; k < h; k++) { const u = k / h, r = Math.max(1, Math.round(h * 0.42 * (u < 0.55 ? 0.75 + u * 0.4 : 1 - (u - 0.55)))); p.rect(x - r, y - k, r * 2, 1, k % 4 === 1 ? '#8a5430' : '#6a3a1e'); }
  p.rect(16, 22, 12, 2, '#d8302a'); p.rect(17, 21, 10, 1, '#b8201a'); p.rect(18, 20, 8, 1, '#c8301e');
  for (const [x, y] of [[16, 28], [22, 29], [28, 28]] as const) { p.rect(x - 2, y - 2, 5, 3, '#7ac04a'); p.rect(x - 2, y - 1, 2, 2, '#e8f0c0'); }
}, '#1a1408');
