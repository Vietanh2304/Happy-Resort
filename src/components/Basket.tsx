// Thuyền thúng rừng dừa Bảy Mẫu (Cẩm Thanh, Hội An): hai người ngồi thúng, chú lái đội nón lá chèo len rừng dừa nước.
// Trên đường: câu cua (giật cần đúng lúc phao chìm) · múa quay thúng theo nhạc loa (bấm cho thúng quay nhanh)
// · xem quăng chài · đan cào cào lá dừa mang về. Đồng bộ theo mốc `at` chung, mỗi lần bấm gửi cho người kia thấy.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { characterSprite, type AvatarLook } from '../lib/sprites';
import { bake, circ, ell, glow, heart, line, poly, R, twinkle, type Ctx } from '../lib/canvasArt';
import { onEvent, sendEvent } from '../lib/realtime';

const W = 320, HH = 180, Z = 2, BX = 150, WL = 146, SPEED = 24;
// các chặng (ms tính từ lúc lên thúng)
const BOARD = 8000, P1 = BOARD + 8000, CRAB = P1 + 18000, P2 = CRAB + 6000, SPIN = P2 + 14000, NET = SPIN + 8000, WEAVE = NET + 10000, P3 = WEAVE + 6000;
export const BASKET_MS = P3;
/** vào thúng ngồi cùng người ấy được trong lúc thúng còn đậu ở bến */
export const BASKET_JOIN = BOARD;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const img = (url: string) => { const i = new Image(); i.src = url; return i; };
/** quãng đường thúng đã đi (chỉ chèo ở các chặng đi) */
const dist = (el: number) => (clamp((el - BOARD) / (P1 - BOARD)) * (P1 - BOARD) + clamp((el - CRAB) / (P2 - CRAB)) * (P2 - CRAB) + clamp((el - WEAVE) / (P3 - WEAVE)) * (P3 - WEAVE)) / 1000 * SPEED;
const paddling = (el: number) => (el > BOARD && el < P1) || (el > CRAB && el < P2) || (el > WEAVE && el < P3);
/** lịch cua cắn câu của từng ghế: [lúc cắn] (cửa sổ giật cần 1 giây) */
const BITE_WIN = 1000;
const bites = (seat: number) => Array.from({ length: 6 }, (_, k) => P1 + 1800 + k * 2700 + seat * 1250 + ((k * 7 + seat * 3) % 5) * 120);
const WEAVE_N = 8;
const NPC: AvatarLook = { gender: 'm', hair: 0, hairColor: 0, skin: 2, shirt: 4, outfit: 0 };

// ───────── cây dừa nước: tàu lá dài cong, lá chét rủ xuống ─────────
function nipa(c: Ctx, x: number, y: number, h: number, rnd: () => number, dark = 0) {
  const cols = dark ? ['#1e5a3a', '#256a42', '#1a4a32'] : ['#3a9a4a', '#4ab05a', '#2a8a3e', '#5ac06a'];
  const n = 6 + Math.floor(rnd() * 3);
  for (let f = 0; f < n; f++) {
    const side = f < n / 2 ? -1 : 1, a = -Math.PI / 2 + (f - (n - 1) / 2) * 0.3 + (rnd() - 0.5) * 0.15, len = h * (0.7 + rnd() * 0.4);
    for (let t = 0; t <= 1; t += 0.025) {
      const bend = t * t * 0.7 * side, px = x + Math.cos(a + bend) * len * t, py = y + Math.sin(a + bend) * len * t;
      R(c, px, py, 0.8, 0.8, dark ? '#2a4a2a' : '#6a7a3a');
      if (t > 0.12) { const ll = (1 - t) * 7 + 2; for (const sd of [-1, 1]) line(c, px, py, px + sd * ll * 0.75, py + ll * 0.75, 0.6, cols[(f + Math.floor(t * 30)) % cols.length]); }
    }
  }
}
/** thúng tròn đan tre nhìn ngang: lòng thúng hình bát, nan đan chéo, vành tre */
function thung(c: Ctx, x: number, y: number, w: number, h: number, rot = 0) {
  for (let dy = 0; dy < h; dy += 0.5) {
    const u = dy / h, hw = Math.sqrt(Math.max(0, 1 - u * u)) * w / 2;
    R(c, x - hw, y + dy, hw * 2, 0.5, dy < 1 ? '#5a3a1e' : u > 0.8 ? '#4a2e16' : '#7a5230');
    for (let k = -8; k <= 8; k++) { const xx = x + ((k * 6 + rot * 12 + dy * 1.2) % (w + 8)) * 0.5 * (k % 2 ? 1 : 1); if (Math.abs(xx - x) < hw - 0.5 && Math.round(dy * 2) % 2 === 0) R(c, xx, y + dy, 0.5, 0.5, '#9a7244'); }
  }
  // vành tre và lớp dầu rái bóng ở đáy
  ell(c, x, y + 0.5, w / 2 + 1, 1.6, '#b08a54'); ell(c, x, y + 0.2, w / 2 - 1, 0.9, '#5a3a1e');
  R(c, x - w * 0.35, y + h * 0.55, w * 0.25, 0.6, '#ffffff30');
}
/** cua đồng: mai cam, hai càng giơ lên, chân khua */
function crab(c: Ctx, x: number, y: number, t: number) {
  const k = Math.sin(t * 14) > 0 ? 1 : 0;
  for (const s of [-1, 1]) { for (let j = 0; j < 3; j++) line(c, x + s * 2, y + j * 0.8, x + s * (5 + k), y + 1 + j * 1.3, 0.5, '#b8482a'); circ(c, x + s * 4.5, y - 3 - k, 1.6, '#d8603a'); R(c, x + s * 4.5 - 0.5, y - 5 - k, 1, 1.2, '#d8603a'); }
  ell(c, x, y, 3.6, 2.6, '#e0703a'); R(c, x - 2, y - 1.5, 4, 0.6, '#f0905a'); R(c, x - 1.4, y - 2.8, 0.8, 0.8, '#1a1a1a'); R(c, x + 0.6, y - 2.8, 0.8, 0.8, '#1a1a1a');
}
/** cào cào lá dừa (hiện dần theo tiến độ đan p 0..1) */
function grasshopper(c: Ctx, x: number, y: number, p: number) {
  const G = '#5ab84a', D = '#3a8a3a';
  if (p > 0) for (let k = 0; k < Math.ceil(p * 6); k++) R(c, x - 6 + k * 1.6, y - 1 + (k % 2) * 0.5, 1.6, 2.4, k % 2 ? G : D);
  if (p > 0.5) { poly(c, [x - 3, y - 1, x + 4, y - 5, x + 5, y - 4, x - 1, y], G); }
  if (p > 0.7) { circ(c, x + 4.5, y - 0.5, 1.6, G); R(c, x + 5, y - 1.2, 0.6, 0.6, '#1a1a1a'); line(c, x + 5, y - 2, x + 8, y - 6, 0.4, D); line(c, x + 4, y - 2, x + 6, y - 7, 0.4, D); }
  if (p >= 1) { line(c, x - 2, y + 1, x - 4, y + 4, 0.6, D); line(c, x + 1, y + 1, x + 3, y + 4, 0.6, D); }
}

// ───────── lớp cảnh lặp vô tận (vẽ sẵn một ô rộng 320) ─────────
const far = () => bake('basket:far', W, 120, (c, rnd) => {
  for (let x = 0; x < W; x += 2) { const h = 14 + Math.sin(x / 23) * 4 + Math.sin(x / 7) * 2; R(c, x, 100 - h, 2, h, '#4a8a6a'); }
  for (let k = 0; k < 12; k++) nipa(c, (k * 29 + rnd() * 10) % W, 100, 26 + rnd() * 10, rnd, 1);
  for (let x = 0; x < W; x += 2) { const h = 6 + Math.sin(x / 13 + 1) * 3; R(c, x, 100 - h, 2, h + 1, '#2e6a4a'); }
});
const mid = () => bake('basket:mid', W, 120, (c, rnd) => {
  for (let k = 0; k < 9; k++) { const x = k * 36 + rnd() * 12; for (let j = 0; j < 3; j++) nipa(c, x + j * 7 - 7, 108 + j, 38 + rnd() * 16, rnd); }
  for (let x = 0; x < W; x += 2) R(c, x, 106 + Math.sin(x / 9) * 1.5, 2, 4, '#5a6a3a');
});
const near = () => bake('basket:near', W, HH, (c, rnd) => {
  for (const x of [20, 150, 270]) { for (let j = 0; j < 2; j++) nipa(c, x + j * 10, 192, 60 + rnd() * 20, rnd); }
});

export function BasketRide({ at: t0, me, mate, them, onExit }: { at: number; me: AvatarLook; mate: AvatarLook; them: AvatarLook | null; onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [lineTxt, setLine] = useState('');
  const [photo, setPhoto] = useState('');
  const [done, setDone] = useState(false);
  const [now, setNow] = useState(Date.now());
  const meKey = JSON.stringify(me);
  // ghế xếp theo cả hai ngay từ đầu (người ấy lên sau ngồi ghế trống, mình không bị nhảy chỗ)
  const looks = useMemo(() => [me, mate].sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1)), [meKey, JSON.stringify(mate)]); // eslint-disable-line react-hooks/exhaustive-deps
  const seats = useMemo(() => looks.map(l => (l !== me && !them) ? null : ({
    key: JSON.stringify(l), sit: img(characterSprite(l, 'sit').url), back: img(characterSprite(l, 'sit', undefined, 'back').url),
    pull: img(characterSprite(l, 'actsit', undefined, 'front', 3).url), yay: img(characterSprite(l, 'actsit', undefined, 'front', 12).url), work: img(characterSprite(l, 'actsit', undefined, 'front', 4).url),
  })), [looks, !!them]); // eslint-disable-line react-hooks/exhaustive-deps
  const mySeat = looks.findIndex(l => l === me);
  const npc = useMemo(() => ({ idle: img(characterSprite(NPC, 'idle').url), row: img(characterSprite(NPC, 'act', undefined, 'front', 4).url), throw: img(characterSprite(NPC, 'act', undefined, 'front', 1).url), yay: img(characterSprite(NPC, 'act', undefined, 'front', 12).url) }), []);
  // kết quả từng người: cua bắt được (số thứ tự lần cắn), lần quay thúng, nhịp đan
  const caught = useRef<Record<string, Set<number>>>({}), catchAt = useRef<Record<string, number>>({});
  const spins = useRef<number[]>([]), weave = useRef<Record<string, number>>({}), weaveAt = useRef<Record<string, number>>({});
  const apply = (by: string, kind: string, k: number) => {
    if (kind === 'crab') { (caught.current[by] ??= new Set()).add(k); catchAt.current[by] = Date.now(); }
    if (kind === 'spin') spins.current.push(Date.now());
    if (kind === 'weave') { weave.current[by] = Math.min(WEAVE_N, (weave.current[by] ?? 0) + 1); weaveAt.current[by] = Date.now(); }
  };
  useEffect(() => onEvent('bb-hit', (d: { at: number; by: string; kind: string; k: number }) => { if (d.at === t0 && d.by !== meKey) apply(d.by, d.kind, d.k); }), [t0, meKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const tap = () => {
    const el = Date.now() - t0; let kind = '', k = 0, ok = false;
    if (el > P1 && el < CRAB) { kind = 'crab'; k = bites(mySeat).findIndex((b, i) => el >= b && el <= b + BITE_WIN && !caught.current[meKey]?.has(i)); ok = k >= 0; }
    else if (el > P2 && el < SPIN) { kind = 'spin'; ok = true; }
    else if (el > NET + 1000 && el < WEAVE) { kind = 'weave'; ok = (weave.current[meKey] ?? 0) < WEAVE_N; }
    if (!kind) return;
    setFlash(ok ? 'hit' : 'miss'); setTimeout(() => setFlash(null), 160);
    if (ok) { apply(meKey, kind, k); sendEvent('bb-hit', { at: t0, by: meKey, kind, k }); }
  };
  const tapRef = useRef(tap); tapRef.current = tap;
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tapRef.current(); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
  const exitRef = useRef(onExit); exitRef.current = onExit;

  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!;
    let raf = 0, last = '', snapped = false, ended = false, spinA = 0, lastT = Date.now();
    const put = (im: HTMLImageElement, x: number, y: number) => { if (im.complete && im.height) ctx.drawImage(im, Math.round(x), Math.round(y), im.width, im.height); };
    const frame = () => {
      const nowMs = Date.now(), el = nowMs - t0, t = el / 1000, dt = Math.min(0.1, (nowMs - lastT) / 1000); lastT = nowMs;
      setNow(nowMs);
      const camX = dist(el), rowing = paddling(el);
      ctx.setTransform(Z, 0, 0, Z, 0, 0); ctx.imageSmoothingEnabled = false;
      // trời + mây trôi
      const sky = ctx.createLinearGradient(0, 0, 0, 100); sky.addColorStop(0, '#6ac0f0'); sky.addColorStop(1, '#d8f2ff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 100);
      glow(ctx, 270, 24, 26, '#fff6c0', 0.6); circ(ctx, 270, 24, 9, '#fffbe0');
      for (let k = 0; k < 5; k++) { const x = ((k * 83 - camX * 0.1 - t * 2) % (W + 60) + W + 60) % (W + 60) - 30, y = 14 + (k % 3) * 9; for (let j = 0; j < 4; j++) circ(ctx, x + j * 6, y - Math.sin(j / 3 * Math.PI) * 3, 5, '#ffffff'); }
      // rừng dừa xa / gần trôi theo chiều sâu
      const tile = (cv2: HTMLCanvasElement, par: number, y: number, h: number) => { const off = ((camX * par) % W + W) % W; ctx.drawImage(cv2, -off, y, W, h); ctx.drawImage(cv2, W - off, y, W, h); };
      tile(far(), 0.3, 6, 120);
      // mặt nước sông
      const wg = ctx.createLinearGradient(0, 104, 0, HH); wg.addColorStop(0, '#6aa88a'); wg.addColorStop(1, '#3a7a6a'); ctx.fillStyle = wg; ctx.fillRect(0, 104, W, HH - 104);
      tile(mid(), 0.65, 2, 120);
      for (let k = 0; k < 40; k++) { const x = ((k * 53 - camX + Math.sin(t + k) * 3) % (W + 20) + W + 20) % (W + 20) - 10, y = 112 + (k * 17) % 66; R(ctx, x, y, 3 + (k % 4) * 2, 0.5, '#ffffff50'); }
      // thúng khác trên sông: du khách + chú lái nhảy theo nhạc
      for (let k = -1; k < 4; k++) {
        const wx = Math.floor(camX / 150) * 150 + k * 150 + 70, x = wx - camX * 0.85 + 40; if (x < -40 || x > W + 40 || (el > P2 && el < SPIN + 3000 && Math.abs(x - BX) < 50)) continue;
        const y = 118 + (Math.abs(wx) % 3) * 4, sp = el > P2 && el < SPIN ? t * 6 + k : 0;
        R(ctx, x - 2, y - 14, 4, 8, ['#e84a6a', '#4a8ae8', '#f6c445'][Math.abs(k) % 3]); circ(ctx, x, y - 16, 2.2, '#f6cfae'); poly(ctx, [x - 6, y - 17, x, y - 22, x + 6, y - 17], '#e8d8a0');
        R(ctx, x + 6, y - 10 + Math.sin(t * 8 + k) * 2, 3, 5, '#f6cfae');
        thung(ctx, x, y - 6, 22, 7, sp);
        if (Math.abs(wx) % 450 === 220) { R(ctx, x + 4, y - 12, 6, 6, '#2a2a2a'); circ(ctx, x + 7, y - 9, 2, '#5a5a5a'); for (let j = 0; j < 3; j++) { const q = (t * 0.8 + j / 3) % 1; ctx.globalAlpha = 1 - q; ctx.fillStyle = '#ff5a8a'; ctx.font = '7px sans-serif'; ctx.fillText('♪', x + 10 + q * 10, y - 14 - q * 14); ctx.globalAlpha = 1; } }
      }
      // bến tre lúc lên thúng
      { const x = 40 - camX; if (x > -120) { R(ctx, x - 80, 126, 110, 4, '#9a6a3a'); for (let k = 0; k < 8; k++) R(ctx, x - 78 + k * 14, 128, 2, 22, '#6a4a2a'); R(ctx, x - 80, 125, 110, 1, '#c8945a'); } }
      // ── thúng của mình ──
      const spinning = el > P2 && el < SPIN;
      const energy = spins.current.filter(s => nowMs - s < 1500).length;
      if (spinning) spinA += dt * (2.2 + energy * 0.9); else spinA += (0 - Math.sin(spinA) * 0) * dt;
      const bob = Math.sin(t * 1.6) * 1.2, by = WL + bob;
      // gợn sóng quanh thúng (quay thì xoáy tròn)
      for (let r = 0; r < 4; r++) { ctx.strokeStyle = `rgba(255,255,255,${0.35 - r * 0.07})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(BX, by + 6, 40 + r * 8 + (spinning ? Math.sin(t * 6 + r) * 3 : 0), 4 + r * 1.5, 0, 0, Math.PI * 2); ctx.stroke(); }
      const shaking = spinning ? Math.sin(t * 20) * 0.6 : 0;
      // người trong thúng: lúc quay thì đi vòng tròn (trước/sau đổi chỗ)
      type Who = { im: HTMLImageElement; x: number; y: number; z: number };
      const people: Who[] = [];
      const rowStroke = rowing ? Math.sin(t * 3.4) : 0;
      const npcIm = el > NET && el < NET + 3500 ? npc.throw : el > NET + 3500 && el < NET + 6000 ? npc.yay : rowing ? npc.row : npc.idle;
      if (spinning) {
        const R0 = 20;
        [0, 1, 2].forEach(i => { const a = spinA + i * (Math.PI * 2 / 3), x = BX + Math.cos(a) * R0, z = Math.sin(a);
          if (i === 2) people.push({ im: npcIm, x: x - npcIm.width / 2, y: by - npcIm.height + 6, z });
          else { const p = seats[i]; if (p) people.push({ im: z > 0 ? (Math.floor(t * 3 + i) % 2 ? p.yay : p.sit) : p.back, x: x - p.sit.width / 2, y: by - 44 + shaking + z * 2, z }); } });
      } else {
        people.push({ im: npcIm, x: BX + 26 - npcIm.width / 2, y: by - npcIm.height + 6, z: -1 });
        seats.forEach((p, i) => { if (!p) return;
          const key = p.key, pulled = nowMs - (catchAt.current[key] ?? 0) < 700, weaving = el > NET + 1000 && el < WEAVE && nowMs - (weaveAt.current[key] ?? 0) < 400;
          const cheer = (el > NET + 3500 && el < NET + 6500) || (el > WEAVE - 2500 && el < WEAVE) || (el > P3 - 3000);
          const im = pulled ? p.pull : weaving ? p.work : cheer ? (Math.floor(t * 2 + i) % 2 ? p.yay : p.sit) : p.sit;
          people.push({ im, x: (BX - 20 + i * 24) - p.sit.width / 2, y: by - 44, z: 1 }); });
      }
      people.sort((a, b) => a.z - b.z);
      // mọi người ngồi trong lòng thúng: vẽ người (sau → trước) rồi vẽ thân thúng che phần dưới
      people.forEach(p => put(p.im, p.x, p.y));
      // nón lá của chú lái
      { const np = people.find(p => p.im === npcIm); if (np) { const hx = np.x + npcIm.width / 2, hy = np.y + 6; poly(ctx, [hx - 12, hy + 2, hx, hy - 8, hx + 12, hy + 2], '#ead8a0'); R(ctx, hx - 12, hy + 1.5, 24, 1, '#c8b070'); line(ctx, hx - 5, hy - 2, hx + 5, hy - 2, 0.3, '#c8b070'); } }
      thung(ctx, BX, by - 12, 92, 20, spinning ? spinA : 0);
      // mái chèo của chú lái
      if (rowing) { const np = people.find(p => p.im === npcIm)!, hx = np.x + 8, hy = np.y + 34; line(ctx, hx, hy, hx - 14 + rowStroke * 10, by + 14, 1.4, '#8a5a2a'); ell(ctx, hx - 14 + rowStroke * 10, by + 15, 3, 1.4, '#7a4a22'); }
      // ── câu cua: cần câu tre, phao đỏ trắng, cua cắn thì phao chìm ──
      if (el > P1 && el < CRAB + 800) seats.forEach((p, i) => { if (!p) return;
        const dir = i ? 1 : -1, hx = (BX - 20 + i * 24) + dir * 6, hy = by - 18, tipX = hx + dir * 30, tipY = hy - 20, fx = tipX + dir * 4;
        line(ctx, hx, hy, tipX, tipY, 1, '#c8a050');
        const bl = bites(i), live = bl.findIndex((b, k) => el >= b && el <= b + BITE_WIN && !caught.current[p.key]?.has(k));
        const got = nowMs - (catchAt.current[p.key] ?? 0) < 900;
        const fy = got ? WL + 2 - (nowMs - catchAt.current[p.key]) / 900 * 26 : WL + 4 + (live >= 0 ? 3 + Math.sin(t * 30) : Math.sin(t * 3));
        line(ctx, tipX, tipY, fx, fy, 0.4, '#ffffffc0');
        if (got) crab(ctx, fx, fy + 4, t); else { R(ctx, fx - 1, fy - 2, 2, 2, '#e8443a'); R(ctx, fx - 1, fy, 2, 1.5, '#ffffff'); }
        if (live >= 0 && !got) { ctx.strokeStyle = '#ffffffa0'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(fx, WL + 6, 5 + Math.sin(t * 20) * 1.5, 1.6, 0, 0, Math.PI * 2); ctx.stroke(); if (i === mySeat) { R(ctx, fx - 0.75, fy - 12, 1.5, 5, '#ffe040'); R(ctx, fx - 0.75, fy - 6, 1.5, 1.5, '#ffe040'); } }
        // giỏ cua trong thúng
        const n = caught.current[p.key]?.size ?? 0; for (let k = 0; k < n; k++) crab(ctx, (BX - 20 + i * 24) + (k % 3) * 5 - 5, by - 12 - Math.floor(k / 3) * 3, t + k);
      });
      // ── quăng chài: lưới tròn bung ra trên không rồi rơi xuống, kéo lên đầy cá ──
      if (el > NET && el < WEAVE) {
        const q = (el - NET) / 1000, cx = BX + 70;
        if (q > 0.6 && q < 2.6) { const o = clamp((q - 0.6) / 1.2), rr = 4 + o * 22, y = by - 40 + o * 26 + Math.max(0, q - 1.8) * 30; ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 0.5; for (let j = 0; j < 12; j++) { const a = j / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx - 40 + o * 40, y - rr * 0.4); ctx.lineTo(cx + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.35); ctx.stroke(); } ctx.beginPath(); ctx.ellipse(cx, y, rr, rr * 0.35, 0, 0, Math.PI * 2); ctx.stroke(); for (let j = 0; j < 12; j++) circ(ctx, cx + Math.cos(j / 12 * Math.PI * 2) * rr, y + Math.sin(j / 12 * Math.PI * 2) * rr * 0.35, 0.7, '#8a8a8a'); }
        if (q > 2.6 && q < 3.6) { ctx.strokeStyle = '#ffffffa0'; for (let r = 0; r < 3; r++) { ctx.beginPath(); ctx.ellipse(cx, WL + 4, 10 + r * 6 + (q - 2.6) * 10, 2 + r, 0, 0, Math.PI * 2); ctx.stroke(); } }
        if (q > 3.6 && q < 7.5) { const up = clamp((q - 3.6) / 1.2), y = WL - up * 26; line(ctx, BX + 26, by - 20, cx, y - 8, 0.5, '#e8e0c8'); for (let j = 0; j < 9; j++) { const fx = cx - 9 + (j % 5) * 4.5, fy = y - 4 + Math.floor(j / 5) * 4 + Math.sin(t * 16 + j) * 1.2; ell(ctx, fx, fy, 2.4, 1, '#c8d8e0', Math.sin(t * 12 + j) * 0.6); R(ctx, fx + 1.2, fy - 0.4, 0.5, 0.5, '#1a1a1a'); } ctx.strokeStyle = '#e8e0c8'; ctx.beginPath(); ctx.ellipse(cx, y, 12, 6, 0, 0, Math.PI * 2); ctx.stroke(); for (let j = 0; j < 6; j++) if ((Math.floor(t * 8) + j) % 3 === 0) { R(ctx, cx - 10 + j * 4, y - 10 - (j % 2) * 3, 0.8, 0.8, '#bfe6ff'); } }
      }
      // ── đan cào cào lá dừa: chú lái phát lá, mỗi lần bấm đan thêm một nếp ──
      if (el > NET + 1000 && el < P3) seats.forEach((p, i) => { if (!p) return;
        const n = weave.current[p.key] ?? 0, gx = (BX - 20 + i * 24), gy = by - 18;
        grasshopper(ctx, gx, gy - (n >= WEAVE_N ? 8 + Math.sin(t * 3) * 2 : 0), n / WEAVE_N);
        if (n < WEAVE_N) for (let j = 0; j < 3; j++) line(ctx, gx - 6, gy + 2 + j, gx + 6 + Math.sin(t * 4 + j) * 2, gy - 2 + j, 0.6, '#6ac05a');
        if (n >= WEAVE_N && Math.floor(t * 3 + i) % 2) twinkle(ctx, gx + 6, gy - 14, 2, '#ffffff');
      });
      // tim bay khi hai người cùng quay / cùng bắt được cua
      if (spinning && energy >= 4) for (let k = 0; k < 3; k++) { const q = ((t * 0.9 + k / 3) % 1); ctx.globalAlpha = 1 - q; heart(ctx, BX - 10 + k * 10, by - 50 - q * 20, 2.5, '#ff5a8a'); ctx.globalAlpha = 1; }
      // lá dừa nước sát mắt (trôi nhanh nhất)
      { const off = ((camX * 1.35) % W + W) % W; ctx.drawImage(near(), -off, 0, W, HH); ctx.drawImage(near(), W - off, 0, W, HH); }
      const ln = el < BOARD ? `🧺 Lên thúng ngồi vững nha… ${Math.ceil((BOARD - el) / 1000)}` : el < P1 ? '🌴 Chú chèo thúng len qua rừng dừa nước…' : el < CRAB ? '🦀 Câu cua! Phao chìm thì bấm “Giật cần”' : el < P2 ? '🌴 Đi tiếp ra chỗ múa thúng…' : el < SPIN ? '🌀 Múa thúng! Bấm thật nhiều cho thúng quay tít' : el < NET ? '🎣 Xem chú quăng chài bắt cá' : el < WEAVE ? '🍃 Đan cào cào lá dừa — bấm “Đan” từng nếp' : '🌴 Chèo về bến thôi…';
      if (ln !== last) { last = ln; setLine(ln); }
      if (!snapped && el > P2 + 7000) { snapped = true; const ph = document.createElement('canvas'); ph.width = 512; ph.height = 288; const pc = ph.getContext('2d')!; pc.imageSmoothingEnabled = false; pc.drawImage(c, (BX - 88) * Z, 70 * Z, 176 * Z, 99 * Z, 0, 0, 512, 288); setPhoto(ph.toDataURL('image/png')); }
      if (!ended && el > BASKET_MS + 500) { ended = true; setDone(true); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [t0, seats, npc, mySeat]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!done) return; const t = setTimeout(() => exitRef.current(), 15000); return () => clearTimeout(t); }, [done]);

  const el = now - t0;
  const other = seats.find(p => p && p.key !== meKey);
  const crabs = (k?: string) => (k ? caught.current[k]?.size ?? 0 : 0);
  const btn = el > P1 && el < CRAB ? '🎣 Giật cần!' : el > P2 && el < SPIN ? '🌀 Quay nhanh nữa!' : el > NET + 1000 && el < WEAVE ? `🍃 Đan (${weave.current[meKey] ?? 0}/${WEAVE_N})` : null;
  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  return createPortal(
    <div className="coaster" onClick={stop} onPointerDown={stop} onMouseDown={stop} onTouchStart={stop}>
      <canvas ref={cv} width={W * Z} height={HH * Z} />
      {!done && lineTxt && <b className="coaster-line">{lineTxt}</b>}
      {!done && btn && (
        <div className={`dance-bar pot-bar bb-bar ${flash ?? ''}`}>
          <div className="dance-head"><span>🦀 Bạn {crabs(meKey)}{other ? ` · người ấy ${crabs(other.key)}` : ''}</span></div>
          <button className="btn bb-tap" onPointerDown={e => { e.preventDefault(); tap(); }}>{btn}</button>
        </div>
      )}
      {done && (
        <div className="coaster-end">
          <h3>🧺 Thuyền thúng rừng dừa Bảy Mẫu</h3>
          <p>🦀 Bạn câu {crabs(meKey)} con cua{other ? ` · người ấy ${crabs(other.key)} con` : ''} · 🦗 Cào cào lá dừa đã vào túi đồ!</p>
          {photo && <img src={photo} alt="Ảnh múa thúng" />}
          <div className="row">
            {photo && <a className="btn small ghost" href={photo} download="thuyen-thung-bay-mau.png">💾 Lưu ảnh</a>}
            <button className="btn small" onClick={() => exitRef.current()}>🚶 Lên bờ</button>
          </div>
        </div>
      )}
      {!done && <button className="coaster-x btn small ghost" onClick={() => { if (confirm('Lên bờ giữa chừng?')) exitRef.current(); }}>✖</button>}
    </div>,
    document.body,
  );
}
