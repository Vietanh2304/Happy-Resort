// Disneyland: tàu lượn siêu tốc (toàn màn hình, lên dốc → lao xuống → lộn vòng → hầm sao), ngựa gỗ, tách trà xoay,
// đoàn xe hoa diễu hành, show chiếu sáng + pháo hoa trên lâu đài, rút gươm trong đá, hoá trang hoàng gia.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { AnimName } from '../lib/acts';
import type { Phase } from '../lib/content';
import {
  carouselPoleSprite, carouselTopSprite, MASCOTS, mascotSprite, type FloatId, castleMaskAt, castleSprite, cupBackSprite, cupSprite, floatSprite, horseSprite, RIDES, swordSprite, teapotSprite,
} from '../lib/fairyArt';
import { onEvent, sendEvent } from '../lib/realtime';
import { SKY } from '../lib/sky';
import { characterSprite, heartSprite, type AvatarLook } from '../lib/sprites';
import type { ParkAct } from '../lib/tripSpots';
import type { Live } from '../lib/useLive';
import type { Pt } from '../lib/world';
import { avatarPx } from './Avatar';
import { useTicker } from './Skydive';
import { Spr, Tag, useScale } from './Stage';
import { Fireworks } from './TripExtras';
import { FxList } from './TripSpot';

const v = (o: Record<string, string | number>) => o as CSSProperties;
/** Sắp xếp người ngồi theo ngoại hình để hai máy thấy cùng một chỗ ngồi */
const seatOrder = <T extends { look: AvatarLook }>(a: T[]) => [...a].sort((p, q) => (JSON.stringify(p.look) < JSON.stringify(q.look) ? -1 : 1));
type RideKind = 'coaster' | 'carousel' | 'cups';
const RIDE_I: Record<RideKind, number> = { carousel: 0, cups: 1, coaster: 2 };
const RIDE_NAME: Record<RideKind, string> = { coaster: 'tàu lượn siêu tốc', carousel: 'King Arthur Carrousel', cups: 'Mad Tea Party' };
const SPIN_MS = 16000, STATION_MS = 5000, SHOW_MS = 30000, PARADE_MS = 56000, PARADE_EVERY = 20 * 60_000;

interface Props { scene: string; live: Live; partnerHere: boolean; looks: { me: AvatarLook; them: AvatarLook }; go: (to: Pt, then?: () => void) => void; onAnim: (n: AnimName) => void; night: boolean; phase: Phase }

export function FairyContent({ scene, live, partnerHere, looks, go, onAnim, night, phase }: Props) {
  const L = useRef(live); L.current = live;
  const mine = live.mine, theirs = partnerHere ? live.theirs : null;
  const now = useTicker(true, 66);
  const [invite, setInvite] = useState<{ kind: RideKind; at: number } | null>(null);
  const [showAt, setShowAt] = useState(0);
  const [paradeAt, setParadeAt] = useState(0);
  const [sword, setSword] = useState<{ who: 'me' | 'them'; until: number } | null>(null);
  const tries = useRef(0);

  // ── lên trò chơi (đồng bộ thời điểm bắt đầu để hai người ngồi chung)
  const board = (kind: RideKind, at: number) => {
    const act = kind === 'coaster' ? 'coaster' : 'spin';
    L.current.update({ act, trip: { i: RIDE_I[kind], at }, dish: null, drink: null });
    if (kind !== 'coaster') {
      const exit = kind === 'carousel' ? { x: RIDES.carousel.x - 30, y: 132 } : { x: RIDES.cups.x + 30, y: 136 };
      setTimeout(() => { const m = L.current.mine; if (m.act === 'spin' && m.trip?.at === at) L.current.update({ act: null, trip: null, pos: exit }); }, SPIN_MS - (Date.now() - at));
    }
  };
  const ride = (kind: RideKind) => {
    const at = Date.now();
    board(kind, at);
    L.current.say(kind === 'coaster' ? '🎢 Lên tàu lượn nào!' : kind === 'carousel' ? '🎠 Chọn con ngựa trắng nè' : '☕ Xoay thật nhanh luôn!');
    if (theirs) sendEvent('fairy-ride', { kind, at });
  };
  useEffect(() => onEvent('fairy-ride', (d: { kind: RideKind; at: number }) => {
    if (L.current.mine.act === 'coaster' || L.current.mine.act === 'spin') return;
    setInvite(d); setTimeout(() => setInvite(x => (x?.at === d.at ? null : x)), d.kind === 'coaster' ? STATION_MS - 600 : 7000);
  }), []);
  const join = () => {
    const d = invite; setInvite(null); if (!d) return;
    const left = (d.kind === 'coaster' ? STATION_MS : SPIN_MS - 3000) - (Date.now() - d.at);
    if (left < 300) return L.current.say('😢 Lỡ chuyến mất rồi…');
    go(d.kind === 'coaster' ? { x: 40, y: 128 } : d.kind === 'carousel' ? { x: RIDES.carousel.x, y: 134 } : { x: RIDES.cups.x, y: 138 }, () => {
      const still = (d.kind === 'coaster' ? STATION_MS : SPIN_MS - 3000) - (Date.now() - d.at);
      if (still < 200) return L.current.say('😢 Tàu chạy mất rồi… đợi chuyến sau nha');
      board(d.kind, d.at);
    });
  };

  // ── show lâu đài & diễu hành (ai bấm thì cả hai cùng xem)
  useEffect(() => onEvent('fairy-show', (d: { at: number }) => setShowAt(d.at)), []);
  useEffect(() => onEvent('fairy-parade', (d: { at: number }) => setParadeAt(d.at)), []);
  useEffect(() => onEvent('fairy-sword', (d: { until: number }) => setSword({ who: 'them', until: d.until })), []);
  const autoParade = Math.floor(now / PARADE_EVERY) * PARADE_EVERY;
  const parade = now - paradeAt < PARADE_MS ? paradeAt : now - autoParade < PARADE_MS ? autoParade : 0;
  const showing = now - showAt < SHOW_MS;

  useEffect(() => {
    const f = (e: Event) => {
      const { ride: k } = (e as CustomEvent<{ ride: ParkAct }>).detail;
      if (k === 'coaster' || k === 'carousel' || k === 'cups') return ride(k);
      if (k === 'show') {
        L.current.update({ act: 'firework', dish: null, drink: null }); L.current.say('✨ Show lâu đài bắt đầu rồi!');
        if (Date.now() - showAt > SHOW_MS) { const at = Date.now(); setShowAt(at); sendEvent('fairy-show', { at }); }
        setTimeout(() => onAnim('cheer'), 9000);
        setTimeout(() => { if (L.current.mine.act === 'firework') L.current.update({ act: null }); }, SHOW_MS);
        return;
      }
      if (k === 'parade') {
        if (!parade) { const at = Date.now(); setParadeAt(at); sendEvent('fairy-parade', { at }); L.current.say('🎪 Đoàn diễu hành tới rồi kìa!'); }
        else L.current.say('👋 Vẫy tay chào xe hoa nào!');
        for (let k2 = 0; k2 < 4; k2++) setTimeout(() => onAnim('cheer'), 2500 + k2 * 6000);
        return;
      }
      if (k === 'sword') {
        L.current.say('💪 Hự… hự…'); onAnim('rummage'); setTimeout(() => onAnim('rummage'), 700);
        setTimeout(() => {
          tries.current++;
          if (tries.current >= 3 || Math.random() < 0.3) {
            tries.current = 0; const until = Date.now() + 5600;
            onAnim('lift'); setSword({ who: 'me', until }); sendEvent('fairy-sword', { until });
            L.current.say(looks.me.gender === 'f' ? '⚔️ Rút được gươm thần! Ta là nữ hoàng 👑' : '⚔️ Rút được gươm thần! Ta là nhà vua 👑');
          } else { onAnim('ouch'); L.current.say('😵 Nặng quá… thử lần nữa'); }
        }, 1500);
        return;
      }
      if (k === 'royal') {
        onAnim('rummage'); setTimeout(() => onAnim('rummage'), 700);
        setTimeout(() => {
          const o = looks.me.gender === 'f' ? 17 : 4, on = L.current.mine.outfit !== o;
          L.current.update({ outfit: on ? o : null }); onAnim('cheer');
          L.current.say(on ? (o === 17 ? '👑 Công chúa xuất hiện!' : '🤴 Hoàng tử đây!') : '👕 Thay lại đồ thường');
        }, 1500);
      }
    };
    window.addEventListener('fairy-act', f); return () => window.removeEventListener('fairy-act', f);
  }); // đọc state mới nhất mỗi lần render

  const swordOn = sword && now < sword.until ? (sword.who === 'me' ? mine.pos : theirs?.pos) : null;
  const riders = (kind: RideKind) => [{ w: mine, look: looks.me }, ...(theirs ? [{ w: theirs, look: looks.them }] : [])]
    .filter(r => r.w.act === (kind === 'coaster' ? 'coaster' : 'spin') && r.w.trip?.i === RIDE_I[kind]).map(r => ({ look: r.look, at: r.w.trip!.at }));
  const ridersSorted = (kind: RideKind) => seatOrder(riders(kind));
  const myCoaster = mine.act === 'coaster' && mine.trip?.i === 2 ? mine.trip.at : 0;
  return (
    <>
      {scene === 'trip_fairy_castle' && (
        <>
          {showing && <CastleShow at={showAt} now={now} night={night} />}
          {!swordOn && <Spr sprite={swordSprite()} x={219} y={167} z={166} />}
          {swordOn && <Spr sprite={swordSprite()} x={swordOn.x} y={swordOn.y - 21} z={Math.round(swordOn.y) + 2} className="fa-glint" />}
        </>
      )}
      {scene === 'trip_fairy_parade' && parade > 0 && <Parade at={parade} now={now} night={night} />}
      {MASCOT_AT[scene] && <Mascots scene={scene} now={now} go={go} live={live} onAnim={onAnim} />}
      {scene === 'trip_fairy_rides' && (
        <>
          <Carousel now={now} riders={ridersSorted('carousel')} />
          <Teacups now={now} riders={ridersSorted('cups')} />
          {(mine.act === 'coaster' || theirs?.act === 'coaster') && <Tag x={36} y={64} className="bed-bubble">🎢 Tàu đang chạy…</Tag>}
        </>
      )}
      {invite && <Tag x={128} y={40} className="label invite-chip" onClick={join}>💑 Người ấy rủ đi {RIDE_NAME[invite.kind]} — lên cùng!</Tag>}
      {myCoaster > 0 && <CoasterRide at={myCoaster} phase={phase} me={looks.me} them={theirs?.act === 'coaster' && theirs.trip?.at === myCoaster ? looks.them : null}
        onExit={() => L.current.update({ act: null, trip: null, pos: { x: 40, y: 130 } })} />}
    </>
  );
}

// ───────── Ngựa gỗ ─────────
function Carousel({ now, riders }: { now: number; riders: { look: AvatarLook; at: number }[] }) {
  const s = useScale(), ps = avatarPx(s);
  const { x: cx, y: cy } = RIDES.carousel, t = now / 1000, N = 6;
  const top = carouselTopSprite(), pole = carouselPoleSprite();
  return (
    <>
      <Spr sprite={pole} x={cx} y={cy - 4} z={cy - 6} />
      <Spr sprite={top} x={cx} y={cy - 58} z={cy + 30} />
      {Array.from({ length: N }, (_, i) => {
        const th = t * 0.9 + (i / N) * Math.PI * 2, x = cx + Math.cos(th) * 34, base = cy + Math.sin(th) * 7, bob = Math.sin(t * 3 + i * 1.7) * 3;
        const left = Math.sin(th) > 0, z = Math.round(base) + 4, hy = base - 2 - bob;
        const r = riders[i === 0 ? 0 : i === 1 ? 1 : 9];
        const ch = r ? characterSprite(r.look, 'sit', undefined, 'side') : null;
        return (
          <span key={i}>
            <Spr sprite={horseSprite(i)} x={x} y={hy} z={z} flip={left} />
            {ch && <img src={ch.url} alt="" className="spr" style={{ left: x * s - (ch.w * ps) / 2, top: (hy - 9) * s - ch.h * ps, width: ch.w * ps, height: ch.h * ps, zIndex: z + 1, transform: left ? 'scaleX(-1)' : undefined }} />}
          </span>
        );
      })}
    </>
  );
}

// ───────── Tách trà xoay ─────────
const VIEWS = ['front', 'side', 'back', 'side'] as const;
function Teacups({ now, riders }: { now: number; riders: { look: AvatarLook; at: number }[] }) {
  const s = useScale(), ps = avatarPx(s);
  const { x: cx, y: cy } = RIDES.cups, t = now / 1000, fast = riders.length > 0;
  return (
    <>
      <Spr sprite={teapotSprite()} x={cx} y={cy - 2} z={cy - 2} />
      {[0, 1, 2].map(i => {
        const th = t * (fast ? 1.1 : 0.5) + (i / 3) * Math.PI * 2, x = cx + Math.cos(th) * 26, base = cy + 2 + Math.sin(th) * 7, z = Math.round(base) + 2;
        const here = i === 0 ? riders : [];
        const turn = Math.floor(now / (fast ? 220 : 600) + i) % 4;
        return (
          <span key={i}>
            <Spr sprite={cupBackSprite(i)} x={x} y={base - 12} z={z} />
            {here.map((r, k) => {
              const ch = characterSprite(r.look, 'sit', undefined, VIEWS[(turn + k * 2) % 4]);
              return <img key={k} src={ch.url} alt="" className="spr" style={{ left: (x + (k ? 6 : here.length > 1 ? -6 : 0)) * s - (ch.w * ps) / 2, top: (base - 10) * s - ch.h * ps, width: ch.w * ps, height: ch.h * ps, zIndex: z + 1, transform: (turn + k * 2) % 4 === 3 ? 'scaleX(-1)' : undefined }} />;
            })}
            <Spr sprite={cupSprite(i)} x={x} y={base + 4} z={z + 2} className={fast && i === 0 ? 'fa-wobble' : ''} />
          </span>
        );
      })}
    </>
  );
}

// ───────── Diễu hành: xe hoa phủ đèn + nhân vật Disney đi bộ vẫy tay, pháo giấy rơi ─────────
const DANCER = [
  { gender: 'f' as const, hair: 4, hairColor: 4, skin: 0, shirt: 0, outfit: 17 }, { gender: 'm' as const, hair: 8, hairColor: 2, skin: 1, shirt: 3, outfit: 4 },
];
const LINEUP: ({ float: FloatId; on: number[] } | { walk: number[] })[] = [
  { walk: [8] }, { float: 'castle', on: [0, 1] }, { walk: [2, 4] }, { float: 'pumpkin', on: [6, 7] }, { walk: [9, 10, 11] },
  { float: 'teaparty', on: [3] }, { walk: [5, 12] }, { float: 'dragon', on: [] }, { walk: [-1, -2] },
];
const GAP = 76, TK = 0.55;
/** Nhân vật Disney (thu nhỏ cho cân với nhân vật người chơi) */
function Toon({ i, f, x, y, z, onClick }: { i: number; f: 0 | 1 | 2 | 3; x: number; y: number; z?: number; onClick?: () => void }) {
  const s = useScale(), sp = mascotSprite(i, f);
  return <img src={sp.url} alt="" title={MASCOTS[i].name} draggable={false} className={`spr ${onClick ? 'tappable' : ''}`}
    style={{ left: (x - (sp.w * TK) / 2) * s, top: (y - sp.h * TK) * s, width: sp.w * TK * s, height: sp.h * TK * s, zIndex: z ?? Math.round(y) }}
    onClick={onClick && (e => { e.stopPropagation(); onClick(); })} />;
}
function Parade({ at, now, night }: { at: number; now: number; night: boolean }) {
  const s = useScale(), ps = avatarPx(s);
  const k = (now - at) / PARADE_MS, lead = -90 + k * (256 + 110 + LINEUP.length * GAP);
  const wave = (j: number): 0 | 1 | 2 => (Math.floor(now / 320 + j) % 3 === 0 ? 2 : (Math.floor(now / 260 + j) % 2 as 0 | 1));
  return (
    <>
      <FxList fx={[{ k: 'fall', n: 28, c: ['#ff5a9a', '#ffd84a', '#5ad8ff', '#9a7aff', '#7aff9a', '#ffffff'], size: 2 }]} scene="parade" night={night} />
      {LINEUP.map((u, idx) => {
        const x = lead - idx * GAP;
        if (x < -90 || x > 350) return null;
        if ('walk' in u) return u.walk.map((who, j) => {
          const wx = x + (j - (u.walk.length - 1) / 2) * 17, wy = 178 + (j % 2) * 8;
          if (who < 0) { const ch = characterSprite(DANCER[-who - 1], 'dance', undefined, 'front', (Math.floor(now / 320) + j * 3) % 8); return <img key={`${idx}${j}`} src={ch.url} alt="" className="spr" style={{ left: wx * s - (ch.w * ps) / 2, top: wy * s - ch.h * ps, width: ch.w * ps, height: ch.h * ps, zIndex: wy }} />; }
          return <Toon key={`${idx}${j}`} i={who} f={wave(j + idx)} x={wx} y={wy} />;
        });
        const bob = Math.sin(now / 300 + idx) * 1.2;
        return (
          <span key={idx}>
            <Spr sprite={floatSprite(u.float, night)} x={x} y={188 + bob} z={188} className={night ? 'fa-lit' : ''} />
            {u.on.map((who, j) => <Toon key={j} i={who} f={wave(j)} x={x - 8 + (j - (u.on.length - 1) / 2) * 16} y={152 + bob} z={189} />)}
          </span>
        );
      })}
      {night && <i className="fx-glow" style={{ left: (lead - 420) * s, top: 140 * s, width: 460 * s, height: 60 * s, background: 'radial-gradient(#ff8ad855, transparent 70%)', zIndex: 2 }} />}
    </>
  );
}

// ───────── Show lâu đài: chiếu màu lên lâu đài, pháo hoa, tiên nhỏ bay, lời kết ─────────
const PROJ = ['#ff5a9a', '#5ad8ff', '#ffd84a', '#9a7aff', '#5aff9a', '#ff9a5a'];
function CastleShow({ at, now, night }: { at: number; now: number; night: boolean }) {
  const s = useScale(), el = now - at;
  const c = PROJ[Math.floor(el / 2500) % PROJ.length], m = castleMaskAt(c);
  return (
    <>
      {!night && <div className="fa-veil" style={{ width: 256 * s, height: 192 * s, opacity: el < 1500 ? el / 1500 : el > SHOW_MS - 2000 ? Math.max(0, (SHOW_MS - el) / 2000) : 1 }} />}
      {el > 1500 && <Spr key={c} sprite={m.sprite} x={m.x} y={m.y} z={3} className="fa-proj" />}
      {el > 3000 && <Fireworks dense />}
      {el > 4000 && el < 12000 && <i className="fa-fairy" style={v({ '--s': `${s}px`, left: 128 * s, top: 18 * s })} />}
      {el > SHOW_MS - 7000 && <Tag x={128} y={8} className="bed-bubble">✨ …và họ sống hạnh phúc mãi mãi ✨</Tag>}
    </>
  );
}

// ───────── Tàu lượn Sao Băng ─────────
interface Track { x: Float32Array; h: Float32Array; t: Float32Array; v: Float32Array; n: number; total: number; lift: number; crest: number; drop: number; loop: [number, number]; loop2: [number, number]; brake: number; stop: number }
const TUNNEL: [number, number] = [860, 1165];
let TRACK: Track | null = null;
function track(): Track {
  if (TRACK) return TRACK;
  const X = [0], H = [20];
  const seg = (x1: number, h1: number, lin = false) => {
    const x0 = X[X.length - 1], h0 = H[H.length - 1], n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, h1 - h0) / 2));
    for (let i = 1; i <= n; i++) { const t = i / n, e = lin ? t : (1 - Math.cos(t * Math.PI)) / 2; X.push(x0 + (x1 - x0) * t); H.push(h0 + (h1 - h0) * e); }
  };
  seg(110, 20, true); const lift = X.length - 1;
  seg(330, 150, true); seg(372, 156); const crest = X.length - 1;
  seg(470, 12); const drop = X.length - 1;
  seg(560, 10, true); const la = X.length;
  for (let k = 1; k <= 100; k++) { const th = -Math.PI / 2 + (k / 100) * Math.PI * 2; X.push(560 + 40 * Math.cos(th) + (k / 100) * 26); H.push(50 + 40 * Math.sin(th)); }
  const lb = X.length - 1;
  seg(640, 10, true); seg(720, 96); seg(800, 14); seg(850, 30);
  seg(920, 46); seg(980, 18); seg(1040, 52); seg(1100, 20); seg(1160, 32);
  seg(1220, 72); seg(1290, 12); seg(1340, 40); seg(1390, 14); seg(1440, 34); seg(1490, 20);
  seg(1560, 64); seg(1620, 12); seg(1700, 50); seg(1750, 26); seg(1830, 82); seg(1920, 10); seg(1960, 10, true);
  const l2a = X.length;
  for (let k = 1; k <= 90; k++) { const th = -Math.PI / 2 + (k / 90) * Math.PI * 2; X.push(1960 + 34 * Math.cos(th) + (k / 90) * 22); H.push(44 + 34 * Math.sin(th)); }
  const l2b = X.length - 1;
  seg(2040, 10, true); seg(2100, 42); seg(2160, 16); seg(2220, 34); seg(2280, 14); seg(2330, 24); seg(2370, 20); const brake = X.length - 1;
  seg(2470, 20, true); const stop = X.length - 1;
  seg(2700, 20, true);
  const n = X.length, v = new Float32Array(n), t = new Float32Array(n), g = 180, fr = 0.028;
  let E = 0, dist = 0, d0 = 0;
  for (let i = 0; i < n; i++) {
    if (i) dist += Math.hypot(X[i] - X[i - 1], H[i] - H[i - 1]);
    if (i <= lift) v[i] = 30;
    else if (i <= crest) { v[i] = 40; E = H[i] + (40 * 40) / (2 * g); d0 = dist; }
    else if (i <= brake) v[i] = Math.max(26, Math.sqrt(2 * g * Math.max(0, E - fr * (dist - d0) - H[i])));
    else if (i <= stop) { const k = (i - brake) / (stop - brake); v[i] = v[brake] * (1 - k) ** 2 + 6 * k; }
    else v[i] = 6;
    if (i) t[i] = t[i - 1] + (Math.hypot(X[i] - X[i - 1], H[i] - H[i - 1]) / ((v[i] + v[i - 1]) / 2)) * 1000;
  }
  TRACK = { x: Float32Array.from(X), h: Float32Array.from(H), t, v, n, total: t[stop], lift, crest, drop, loop: [la, lb], loop2: [l2a, l2b], brake, stop };
  return TRACK;
}
/** Vị trí trên ray tại thời điểm (ms kể từ lúc rời ga) */
function at(T: Track, ms: number) {
  if (ms <= 0) return { i: 0, x: T.x[0], h: T.h[0], a: 0, v: 0 };
  let lo = 0, hi = T.stop;
  if (ms >= T.t[hi]) return { i: hi, x: T.x[hi], h: T.h[hi], a: 0, v: 0 };
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T.t[m] <= ms) lo = m; else hi = m; }
  const f = (ms - T.t[lo]) / (T.t[hi] - T.t[lo]), p = Math.max(0, lo - 1), q = Math.min(T.n - 1, hi + 1);
  return { i: lo, x: T.x[lo] + (T.x[hi] - T.x[lo]) * f, h: T.h[lo] + (T.h[hi] - T.h[lo]) * f, a: Math.atan2(T.h[q] - T.h[p], T.x[q] - T.x[p]), v: T.v[lo] };
}
const W = 320, HH = 180, Z = 2;   // khung logic 320×180, vẽ nét ×2 để nhân vật giữ đúng độ nét như trong game
const img = (url: string) => { const i = new Image(); i.src = url; return i; };
function lineFor(T: Track, p: ReturnType<typeof at>, ms: number) {
  if (ms < 0) return `🔒 Thắt dây an toàn… ${Math.ceil(-ms / 1000)}`;
  if (p.i < T.lift) return '🚀 Xuất phát!';
  if (p.i < T.crest) return '😰 Lạch cạch… lạch cạch… cao quáaa';
  if (p.i < T.drop + 12) return '😱 AAAAAAAAA!!!';
  if (p.i <= T.loop[1]) return '🌀 Lộn vòng!!!';
  if (p.x < TUNNEL[0]) return '🤸 Bay khỏi ghế luôn!';
  if (p.x < TUNNEL[1]) return '🚀 Hầm Space Mountain ✨';
  if (p.i >= T.loop2[0] && p.i <= T.loop2[1]) return '🌀 Lộn vòng lần nữaaa!!!';
  if (p.i < T.brake) return '🎉 Yeeeeee!';
  return '😆 Phù… vui quá trời!';
}

function CoasterRide({ at: t0, phase, me, them, onExit }: { at: number; phase: Phase; me: AvatarLook; them: AvatarLook | null; onExit: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const [line, setLine] = useState('');
  const [photo, setPhoto] = useState('');
  const [flash, setFlash] = useState(false);
  const [done, setDone] = useState(false);
  const T = useMemo(track, []);
  const pics = useMemo(() => {
    const mk = (l: AvatarLook) => ({ sit: img(characterSprite(l, 'sit').url), up: img(characterSprite(l, 'actsit', undefined, 'front', 12).url) });
    return { seats: seatOrder([{ look: me }, ...(them ? [{ look: them }] : [])]).map(r => mk(r.look)), castle: img(castleSprite(0.5).url) };
  }, [JSON.stringify(me), JSON.stringify(them)]); // eslint-disable-line react-hooks/exhaustive-deps
  const exitRef = useRef(onExit); exitRef.current = onExit;
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    let raf = 0, camH = 0, snapped = false, ended = false, lastLine = '';
    const sky = SKY[phase] ?? SKY.day, night = phase === 'night';
    const stars = Array.from({ length: 70 }, (_, i) => [(i * 97) % W, (i * 53) % 120, i % 3]);
    const frame = () => {
      const ms = Date.now() - t0 - STATION_MS, p = at(T, ms);
      camH += (Math.max(0, p.h - 70) - camH) * 0.08;
      const camX = p.x - 120, SX = (x: number) => x - camX, SY = (h: number) => 150 - (h - camH), gy = SY(0);
      const shake = p.i > T.drop - 8 && p.i < T.drop + 10 ? (Math.random() - 0.5) * 4 : 0;
      ctx.setTransform(Z, 0, 0, Z, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.save(); ctx.translate(Math.round(shake), Math.round(shake * 0.6));
      // trời
      const gr = ctx.createLinearGradient(0, 0, 0, HH); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]); ctx.fillStyle = gr; ctx.fillRect(-4, -4, W + 8, HH + 8);
      if (night) { ctx.fillStyle = '#ffffff'; for (const [x, y, k] of stars) ctx.fillRect(x, y, k ? 1 : 2, 1); }
      ctx.fillStyle = night ? '#2a3068' : '#ffffffd0';
      for (let k = 0; k < 5; k++) { const x = ((k * 90 - camX * 0.08) % 400 + 400) % 400 - 40, y = 20 + k * 9; ctx.fillRect(x, y, 30, 5); ctx.fillRect(x + 6, y - 3, 16, 4); }
      // lâu đài xa + đồi
      const ci = pics.castle; if (ci.complete) ctx.drawImage(ci, Math.round(250 - camX * 0.12 - ci.width / 2), Math.round(150 + camH * 0.25 - ci.height + 6));
      const hb = 150 + camH * 0.45;
      ctx.fillStyle = night ? '#2a4a4a' : '#7ab868';
      for (let x = 0; x < W; x += 2) { const wx = x + camX * 0.35, hh = 26 + Math.sin(wx / 40) * 10 + Math.sin(wx / 13) * 4; ctx.fillRect(x, hb - hh, 2, HH - hb + hh + 4); }
      // mặt đất + cây
      ctx.fillStyle = night ? '#1a3a2a' : '#5aa850'; ctx.fillRect(-4, gy, W + 8, HH);
      for (let wx = Math.floor(camX / 37) * 37; wx < camX + W + 20; wx += 37) {
        if (wx < 130 || wx > 2360 || (wx > TUNNEL[0] - 20 && wx < TUNNEL[1] + 20)) continue;
        const x = SX(wx + ((wx * 7) % 13)); ctx.fillStyle = '#6a4a32'; ctx.fillRect(x, gy - 8, 2, 8);
        ctx.fillStyle = night ? '#1a4a3a' : '#3a8a4a'; ctx.fillRect(x - 5, gy - 18, 12, 11); ctx.fillRect(x - 3, gy - 22, 8, 4);
      }
      // ga
      for (const wx of [-50, 2390]) {
        if (SX(wx) > W + 10 || SX(wx) < -190) continue;
        const x0 = SX(wx), y0 = SY(20);
        ctx.fillStyle = '#f4cfe2'; ctx.fillRect(x0, y0 - 46, 170, 46); ctx.fillStyle = '#c8b0c0'; ctx.fillRect(x0, y0, 170, gy - y0);
        for (let k = 0; k < 18; k++) { ctx.fillStyle = k % 2 ? '#e8443a' : '#ffffff'; ctx.fillRect(x0 - 6 + k * 10, y0 - 56, 10, 10); }
        ctx.fillStyle = '#2a2a4a'; ctx.fillRect(x0 + 40, y0 - 40, 70, 12); ctx.fillStyle = '#ff8ac8'; ctx.font = 'bold 8px monospace'; ctx.fillText('★ DISNEYLAND ★', x0 + 41, y0 - 31);
      }
      // trụ đỡ
      const [la, lb] = T.loop;
      ctx.fillStyle = night ? '#8a90b0' : '#f0e8f4';
      for (let i = 0; i < T.n; i += 6) {
        const x = SX(T.x[i]); if (x < -10 || x > W + 10 || (i > la && i < lb) || (i > T.loop2[0] && i < T.loop2[1]) || T.h[i] < 3) continue;
        if (T.x[i] > TUNNEL[0] && T.x[i] < TUNNEL[1]) continue;
        const y = SY(T.h[i]) + 3; ctx.fillRect(Math.round(x), y, 1, gy - y); if (i % 12 === 0) for (let yy = y + 8; yy < gy; yy += 12) ctx.fillRect(Math.round(x) - 6, yy, 7, 1);
      }
      if (SX(560) > -60 && SX(560) < W + 60) { ctx.fillRect(Math.round(SX(573)), SY(10) + 3, 2, gy - SY(10)); }
      // ray
      const rails = (c1: string, c2: string, inTunnel: boolean) => {
        ctx.lineWidth = 3; ctx.strokeStyle = c1; ctx.beginPath(); let on = false;
        for (let i = 0; i < T.n; i++) { const x = SX(T.x[i]); const tun = T.x[i] > TUNNEL[0] && T.x[i] < TUNNEL[1]; if (x < -20 || x > W + 20 || tun !== inTunnel) { on = false; continue; } const y = SY(T.h[i]) + 1; if (on) ctx.lineTo(x, y); else { ctx.moveTo(x, y); on = true; } }
        ctx.stroke(); ctx.lineWidth = 1; ctx.strokeStyle = c2; ctx.stroke();
      };
      rails('#7a1a2a', '#ff5a5a', false);
      const cart = () => {
        ctx.save(); ctx.translate(Math.round(SX(p.x)), Math.round(SY(p.h))); ctx.rotate(-p.a);
        const up = p.v > 125 && p.i > T.crest, seats = pics.seats.map((pic, k) => ({ x: k ? -7 : 7, pic }));
        for (const st of seats) { const im = up ? st.pic.up : st.pic.sit; if (!im.complete || !im.height) continue; const h = im.height / Z, w = im.width / Z; ctx.drawImage(im, Math.round((st.x - w / 2) * Z) / Z, -h - 1, w, h); }
        ctx.fillStyle = '#e8443a'; ctx.fillRect(-15, -9, 30, 8); ctx.fillStyle = '#b02a3a'; ctx.fillRect(-15, -3, 30, 2);
        ctx.fillStyle = '#f6c445'; ctx.fillRect(-15, -9, 30, 1); ctx.fillRect(13, -9, 4, 7); ctx.fillRect(-2, -7, 3, 3);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(14, -7, 2, 2);
        ctx.fillStyle = '#2a2a3a'; ctx.fillRect(-12, -1, 5, 3); ctx.fillRect(7, -1, 5, 3);
        ctx.restore();
      };
      cart();
      // núi Sao Băng (tàu chui vào hầm)
      const mx = SX((TUNNEL[0] + TUNNEL[1]) / 2), mw = (TUNNEL[1] - TUNNEL[0]) / 2 + 14;
      if (mx > -mw && mx < W + mw) {
        for (let dx = -mw; dx <= mw; dx += 2) { const hh = Math.sqrt(1 - (dx / mw) ** 2) * 130; const x = mx + dx; ctx.fillStyle = dx < 0 ? '#7a5ab8' : '#5a4498'; ctx.fillRect(Math.round(x), Math.round(gy - hh), 2, Math.round(hh)); }
        ctx.fillStyle = '#ffe8a0'; for (let k = 0; k < 14; k++) ctx.fillRect(Math.round(mx - mw + 20 + ((k * 37) % (mw * 2 - 40))), Math.round(gy - 30 - ((k * 23) % 80)), 1, 1);
        for (const ex of [TUNNEL[0] + 4, TUNNEL[1] - 4]) { ctx.fillStyle = '#140c2a'; const y = SY(ex < 900 ? 34 : 32); ctx.fillRect(Math.round(SX(ex)) - 6, y - 28, 12, 32); }
      }
      // trong hầm: tối om, sao vụt qua, vòng neon
      const tin = Math.min(1, (p.x - TUNNEL[0]) / 25, (TUNNEL[1] - p.x) / 25);
      if (tin > 0) {
        ctx.globalAlpha = tin; ctx.fillStyle = '#0a0620'; ctx.fillRect(-4, -4, W + 8, HH + 8);
        for (const [x, y, k] of stars) { const sx = ((x - camX * (1.2 + k * 0.4)) % W + W) % W; ctx.fillStyle = k === 2 ? '#8ad0ff' : '#ffffff'; ctx.fillRect(sx, (y * 1.5) % HH, k ? 3 + k * 2 : 1, 1); }
        const RC = ['#ff5a9a', '#5ad8ff', '#ffd84a', '#9a7aff'];
        for (let wx = Math.ceil(TUNNEL[0] / 40) * 40; wx < TUNNEL[1]; wx += 40) {
          const x = SX(wx); if (x < -20 || x > W + 20) continue;
          let j = 0; while (j < T.n - 1 && T.x[j] < wx) j++;
          ctx.strokeStyle = RC[(wx / 40) % 4]; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, SY(T.h[j]) - 8, 6, 22, 0, 0, Math.PI * 2); ctx.stroke();
        }
        rails('#1a3a6a', '#5ad8ff', true);
        cart(); ctx.globalAlpha = 1;
      }
      // vệt tốc độ
      if (p.v > 150) { ctx.fillStyle = '#ffffff90'; for (let k = 0; k < 8; k++) { const y = (k * 41 + Math.floor(Date.now() / 30) * 17) % HH; ctx.fillRect((k * 73 + Date.now() / 2) % W, y, 18 + (k % 3) * 8, 1); } }
      ctx.restore();
      const ln = lineFor(T, p, ms); if (ln !== lastLine) { lastLine = ln; setLine(ln); }
      if (!snapped && p.i >= T.drop - 6) {
        snapped = true;
        // ảnh chụp cận toa tàu (như máy chụp ở dốc lao)
        const ph = document.createElement('canvas'); ph.width = 512; ph.height = 288; const pc = ph.getContext('2d')!; pc.imageSmoothingEnabled = false;
        pc.drawImage(c, Math.round(Math.max(0, Math.min(W - 128, SX(p.x) - 64)) * Z), Math.round(Math.max(0, Math.min(HH - 72, SY(p.h) - 50)) * Z), 128 * Z, 72 * Z, 0, 0, 512, 288);
        setPhoto(ph.toDataURL('image/png')); setFlash(true); setTimeout(() => setFlash(false), 220); }
      if (!ended && ms > T.total + 800) { ended = true; setDone(true); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [t0, phase, T, pics]);
  // hết chuyến: hiện ảnh 15 giây rồi tự xuống tàu
  useEffect(() => { if (!done) return; const t = setTimeout(() => exitRef.current(), 15000); return () => clearTimeout(t); }, [done]);
  return createPortal(
    <div className="coaster">
      <canvas ref={cv} width={W * Z} height={HH * Z} />
      {!done && line && <b className="coaster-line">{line}</b>}
      {flash && <i className="coaster-flash" />}
      {done && (
        <div className="coaster-end">
          <h3>📸 Ảnh trên tàu lượn</h3>
          {photo && <img src={photo} alt="Ảnh tàu lượn" />}
          <div className="row">
            {photo && <a className="btn small ghost" href={photo} download="tau-luon-sao-bang.png">💾 Lưu ảnh</a>}
            <button className="btn small" onClick={() => exitRef.current()}>🚶 Xuống tàu</button>
          </div>
        </div>
      )}
      {!done && <button className="coaster-x btn small ghost" onClick={() => { if (confirm('Xuống tàu giữa chừng?')) exitRef.current(); }}>✖</button>}
    </div>,
    document.body,
  );
}

// ───────── Linh vật đi dạo: bấm vào thì chạy tới ôm / vẫy tay chụp ảnh (người kia cũng thấy) ─────────
const MASCOT_AT: Record<string, { ids: number[]; box: { x0: number; x1: number; y0: number; y1: number } }> = {
  trip_fairy: { ids: [0, 1, 3], box: { x0: 24, x1: 232, y0: 130, y1: 184 } },
  trip_fairy_castle: { ids: [2, 4, 5], box: { x0: 24, x1: 190, y0: 152, y1: 186 } },
  trip_fairy_parade: { ids: [6, 7], box: { x0: 24, x1: 232, y0: 112, y1: 144 } },
};
const HUG_MS = 5000;
/** Vị trí theo đồng hồ chung (hai máy thấy linh vật ở cùng chỗ); `off` = thời gian đã đứng lại */
function mascotPos(i: number, t: number, box: { x0: number; x1: number; y0: number; y1: number }) {
  const u = t / 1000, a = u / (14 + i * 4) + i * 1.9, b = u / (9 + i * 3) + i;
  return { x: box.x0 + (box.x1 - box.x0) * (0.5 + 0.46 * Math.sin(a)), y: box.y0 + (box.y1 - box.y0) * (0.5 + 0.45 * Math.sin(b)), moving: Math.abs(Math.cos(a)) > 0.08 };
}
function Mascots({ scene, now, go, live, onAnim }: { scene: string; now: number; go: Props['go']; live: Live; onAnim: Props['onAnim'] }) {
  const cfg = MASCOT_AT[scene];
  const [hold, setHold] = useState<Record<number, { x: number; y: number; until: number; hug: boolean; off: number }>>({});
  const off = useRef<Record<number, number>>({});
  const L = useRef(live); L.current = live;
  const start = (d: { i: number; x: number; y: number; until: number; hug: boolean }) => setHold(h => ({ ...h, [d.i]: { ...d, off: 0 } }));
  useEffect(() => onEvent('fairy-mascot', (d: { i: number; x: number; y: number; until: number; hug: boolean; scene: string }) => { if (d.scene === scene) start(d); }), [scene]);
  // hết giờ đứng lại thì đi tiếp từ đúng chỗ đó (cộng thời gian đã dừng)
  useEffect(() => {
    for (const [k, h] of Object.entries(hold)) if (now > h.until) { off.current[+k] = (off.current[+k] ?? 0) + HUG_MS; setHold(x => { const y = { ...x }; delete y[+k]; return y; }); }
  }, [now, hold]);
  const meet = (i: number, at: { x: number; y: number }) => {
    const side = at.x > 128 ? -12 : 12;
    go({ x: at.x + side, y: at.y + 1 }, () => {
      const hug = Math.random() < 0.6, d = { i, x: at.x, y: at.y, until: Date.now() + HUG_MS, hug, scene };
      start(d); sendEvent('fairy-mascot', d);
      L.current.say(hug ? `🤗 Ôm ${MASCOTS[i].name} một cái!` : `📸 Tạo dáng với ${MASCOTS[i].name} nè!`);
      if (hug) { onAnim('cheer'); setTimeout(() => onAnim('heartR'), 900); } else onAnim('point');
    });
  };
  return (
    <>
      {cfg.ids.map(i => {
        const h = hold[i], p = h ?? mascotPos(i, now - (off.current[i] ?? 0), cfg.box);
        const moving = !h && (p as { moving?: boolean }).moving;
        const f: 0 | 1 | 2 | 3 = h ? (h.hug ? 3 : Math.floor(now / 400) % 2 ? 2 : 0) : moving ? (Math.floor(now / 280) % 2 as 0 | 1) : 0;
        return (
          <span key={i}>
            <Toon i={i} f={f} x={p.x} y={p.y} onClick={() => !h && meet(i, { x: p.x, y: p.y })} />
            {h && <Tag x={p.x} y={p.y - 30} className="bed-bubble">{MASCOTS[i].name}: {MASCOTS[i].hi}</Tag>}
            {h && [0, 1, 2].map(k => <Spr key={k} sprite={heartSprite()} x={p.x - 8 + k * 8} y={p.y - 24 - ((now / 40 + k * 9) % 14)} z={800} />)}
          </span>
        );
      })}
    </>
  );
}
