// Map tham quan: hiệu ứng động (nước gợn, đèn lồng, lá rơi, cực quang…), du khách đi dạo, hoạt động bấm được.
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import type { AnimName } from '../lib/acts';
import { characterSprite, type AvatarLook } from '../lib/sprites';
import type { Live } from '../lib/useLive';
import { avatarPx } from './Avatar';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { seeded } from '../lib/rng';
import { toast, toastError } from '../lib/toast';
import { FORTUNES, lotusSprite, wallFlowerSprite, miniSprite, type Act, type Fx, type SpotDef, type SpotScene } from '../lib/tripSpots';
import type { Pt } from '../lib/world';
import { Spr, Tag, useScale } from './Stage';
import { Stroller } from './Trip';

const v = (o: Record<string, string | number>) => o as CSSProperties;

function FxLayer({ fx, scene, night }: { fx: Fx; scene: string; night: boolean }) {
  const s = useScale();
  const r = useMemo(() => seeded(`fx:${scene}:${JSON.stringify(fx)}`), [scene, fx]);
  const box = (x: number, y: number, w: number, h: number, z = 2): CSSProperties => ({ left: x * s, top: y * s, width: w * s, height: h * s, zIndex: z });
  switch (fx.k) {
    case 'shim': return <div className="fx" style={box(fx.x, fx.y, fx.w, fx.h)}>{Array.from({ length: fx.n }, (_, i) => <i key={i} className="fx-shim" style={v({ left: r() * fx.w * s, top: r() * fx.h * s, width: (3 + r() * 6) * s, height: s, background: fx.c ?? '#ffffffb0', animationDelay: `${-r() * 3}s`, animationDuration: `${2 + r() * 2}s`, '--m': `${(r() < .5 ? -1 : 1) * 3 * s}px` })} />)}</div>;
    case 'fall': return <div className="fx" style={box(0, 0, 256, 192, 900)}>{Array.from({ length: fx.n }, (_, i) => <i key={i} className="fx-fall" style={v({ left: r() * 256 * s, top: -4 * s, width: (fx.size ?? 2) * s, height: (fx.size ?? 2) * s, background: fx.c[i % fx.c.length], animationDuration: `${(fx.slow ? 9 : 6) + r() * 6}s`, animationDelay: `${-r() * 12}s`, '--dx': `${(r() * 60 - 20) * s}px`, '--dy': `${200 * s}px` })} />)}</div>;
    case 'sway': { const z = fx.big ? 2 : 1; return <i className={`fx-sway ${night ? 'lit' : ''}`} style={v({ left: fx.x * s, top: fx.y * s, width: 4 * z * s, height: 6 * z * s, background: fx.c, zIndex: 3, '--g': fx.c, animationDuration: `${1.6 + r()}s` })} />; }
    case 'steam': return <>{Array.from({ length: fx.n ?? 2 }, (_, i) => <i key={i} className="fx-steam" style={{ left: (fx.x + i * 4 - 4) * s, top: fx.y * s, width: 5 * s, height: 5 * s, animationDelay: `${-i * 0.9 - r()}s`, zIndex: 400 }} />)}</>;
    case 'glow': return fx.night && !night ? null : <i className="fx-glow" style={{ left: (fx.x - fx.r) * s, top: (fx.y - fx.r / 2) * s, width: fx.r * 2 * s, height: fx.r * s, background: `radial-gradient(${fx.c}55, transparent 70%)`, zIndex: 2 }} />;
    case 'move': { const sp = miniSprite(fx.spr); return <Spr sprite={sp} x={fx.x} y={fx.y} z={fx.y < 100 ? 3 : Math.round(fx.y)} className="fx-move" style={v({ '--dx': `${fx.dx * s}px`, animationDuration: `${fx.dur}s`, animationDirection: fx.loop ? 'normal' : 'alternate', animationIterationCount: 'infinite' })} />; }
    case 'bird': return <>{Array.from({ length: fx.n }, (_, i) => <span key={i} className="fx-bird" style={{ left: (fx.x + r() * 60) * s, top: (fx.y + r() * 30) * s, fontSize: 7 * s, animationDelay: `${-r() * 6}s`, zIndex: 600 }}>{fx.icon}</span>)}</>;
    case 'aurora': return <div className="fx" style={box(0, fx.y, 256, 70, 1)}><i className="fx-aurora" /><i className="fx-aurora b" /></div>;
    case 'sparkle': return fx.night && !night ? null : <div className="fx" style={box(fx.x, fx.y, fx.w, fx.h, 3)}>{Array.from({ length: fx.n }, (_, i) => <i key={i} className="fx-spark" style={{ left: r() * fx.w * s, top: r() * fx.h * s, width: s, height: s, animationDelay: `${-r() * 2}s`, animationDuration: `${0.8 + r() * 1.6}s` }} />)}</div>;
    case 'screen': return <i className="fx-screen" style={box(fx.x, fx.y, fx.w, fx.h, 3)} />;
  }
}

/** Danh sách hiệu ứng động của một cảnh */
export function FxList({ fx, scene, night }: { fx: Fx[]; scene: string; night: boolean }) {
  return <>{fx.map((f, i) => <FxLayer key={i} fx={f} scene={scene} night={night} />)}</>;
}

const RIDE_MS = 9000;
const RIDE_ZOOM: Record<string, number> = { cable: 2, swan: 2, boat: 1.6, sampan: 1.4, gondola: 1.1, bateau: 1, train: 1 };
const DRINKS = ['tra_sua', 'honey_tea', 'ca_phe_sua', 'peach_tea', 'yogurt'];
const KEEP = ['clock', 'books', 'lantern', 'rose_bloom', 'chocolate', 'cheese'];

/** Ngồi trên thuyền / cáp treo / tàu: xe chạy ngang map mang theo nhân vật */
function Rider({ spot, who, look }: { spot: SpotDef; who: { act: string | null; trip?: { i: number; at: number } | null }; look: AvatarLook }) {
  const s = useScale(), ps = avatarPx(s);
  const a = who.trip ? spot.acts[who.trip.i] : undefined;
  if (who.act !== 'ride' || !a || a.k !== 'ride') return null;
  const veh = miniSprite(a.spr), z = RIDE_ZOOM[a.spr] ?? 1, vw = veh.w * ps * z, vh = veh.h * ps * z;
  const ch = characterSprite(look, 'sit', undefined, 'side');
  const wl = vw / s, ltr = a.x < 128, x0 = ltr ? 6 : 250 - wl, dx = (ltr ? 1 : -1) * (244 - wl) * s;
  return (
    <div className="fx-rider" style={v({ left: x0 * s, top: a.ry * s - vh - ch.h * ps * 0.55, width: vw, height: vh + ch.h * ps * 0.55, zIndex: Math.round(a.ry) + 2, '--dx': `${dx}px`, animationDuration: `${RIDE_MS}ms`, animationDelay: `${-(Date.now() - who.trip!.at)}ms` })}>
      <div style={{ position: 'absolute', inset: 0, transform: ltr ? undefined : 'scaleX(-1)' }}>
        <img src={ch.url} alt="" style={{ position: 'absolute', left: vw / 2 - (ch.w * ps) / 2, bottom: vh * 0.45, width: ch.w * ps, height: ch.h * ps }} />
        <img src={veh.url} alt="" style={{ position: 'absolute', left: 0, bottom: 0, width: vw, height: vh }} />
      </div>
    </div>
  );
}

export function SpotContent({ spot, scene, me, today, night, go, live, partnerHere, looks, onAnim, onKiss }: {
  spot: SpotDef; scene: SpotScene; me: api.Profile; today: string; night: boolean; go: (to: Pt, then?: () => void) => void;
  live: Live; partnerHere: boolean; looks: { me: AvatarLook; them: AvatarLook }; onAnim: (n: AnimName) => void; onKiss: () => void;
}) {
  const s = useScale();
  const [floats, setFloats] = useState<{ x: number; y: number; n: number }[]>([]);
  const [flash, setFlash] = useState(0);
  const [fx, setFx] = useState<{ x: number; y: number; icon: string; n: number }[]>([]);
  const [art, setArt] = useState<{ x: number; y: number } | null>(null);
  const [made, setMade] = useState<{ icon: string; x: number; y: number }[]>([]);
  const [flowers, setFlowers] = useState<{ x: number; y: number }[]>([]);
  const L = useRef(live); L.current = live;
  const mine = live.mine, theirs = partnerHere ? live.theirs : null;
  const run = async (f: () => Promise<unknown>) => { try { await f(); } catch (e) { toastError(e); } };
  const near = (a: Act): Pt => ({ x: Math.max(spot.walk.x0, Math.min(spot.walk.x1, a.x)), y: Math.max(spot.walk.y0 + 2, Math.min(spot.walk.y1, a.y + 8)) });
  type Patch = Parameters<Live['update']>[0];
  /** đặt trạng thái; hết giờ thì tự thôi (nếu vẫn đang làm việc đó) */
  const hold = (patch: Patch, ms: number, end: Patch = { act: null }) => {
    live.update(patch);
    const tag = patch.act ?? null, dish = patch.dish ?? null, drink = patch.drink ?? null;
    setTimeout(() => { const m = L.current.mine; if ((tag && m.act === tag) || (dish && m.dish === dish) || (drink && m.drink === drink)) L.current.update(end); }, ms);
  };
  const pop = (x: number, y: number, icon: string, n = 1) => {
    const t = Date.now() + Math.random();
    setFx(f => [...f.slice(-14), ...Array.from({ length: n }, (_, k) => ({ x: x + (k - (n - 1) / 2) * 7, y, icon, n: t + k / 10 }))]);
    setTimeout(() => setFx(f => f.filter(e => e.n < t || e.n >= t + 1)), 2600);
  };
  const anim = (n: AnimName, times = 1) => { for (let k = 0; k < times; k++) setTimeout(() => onAnim(n), k * 800); };
  const doAct = (a: Act, i: number) => go(a.k === 'do' && a.at ? a.at : near(a), () => {
    const at = L.current.mine.pos;
    if (a.k === 'buy') return void run(async () => {
      const it = item(a.item);
      if (!confirm(`Mua ${it.icon} ${it.name} (${a.price} xu)?`)) return;
      await api.buyItem(a.item, a.price); notify('inventory', 'profiles');
      const name = a.label.replace(/^\S+\s/, '');
      if (KEEP.includes(a.item)) { anim('cheer'); live.say(`${it.icon} Mua được ${name} rồi!`); return; }
      if (DRINKS.includes(a.item)) hold({ drink: name, dish: null }, 14000, { drink: null });
      else hold({ dish: name, drink: null }, 14000, { dish: null });
      live.say(`${it.icon} Ngon quá!`);
    });
    if (a.k === 'photo') return void run(async () => {
      live.say(theirs ? '📸 Cười lên nào… 1, 2, 3!' : '📸 Cheese!'); anim('cheer');
      setTimeout(() => setFlash(Date.now()), 700);
      const ok = await api.claim(`postcard:${spot.trip}:${spot.id}:${today}:${me.id}`);
      if (!ok) return;
      await api.addMemory(me, 'postcard', { trip: spot.trip, spot: spot.id }, today); notify('memories', 'claims');
      toast(`📸 Bưu thiếp ${spot.name} đã dán vào sổ du lịch`);
    });
    if (a.k === 'fortune') { anim('rummage'); setTimeout(() => { hold({ act: 'omikuji' }, 6000); live.say(`🎋 ${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}`); }, 700); return; }
    if (a.k === 'ride') {
      live.update({ act: 'ride', trip: { i, at: Date.now() }, dish: null, drink: null }); live.say(a.say);
      const end = { x: a.x < 128 ? spot.walk.x1 - 10 : spot.walk.x0 + 10, y: spot.walk.y0 + 4 };
      setTimeout(() => { if (L.current.mine.act === 'ride') L.current.update({ act: null, trip: null, pos: end }); }, RIDE_MS);
      return;
    }
    if (a.k === 'float') { hold({ act: 'sit' }, 2600); setTimeout(() => { setFloats(f => [...f.slice(-7), { x: at.x, y: a.ry, n: Date.now() }]); live.say('🪷 Ước gì mình mãi bên nhau…'); }, 1200); return; }
    if (a.k !== 'do') return;
    live.say(a.say);
    switch (a.do) {
      case 'sit': hold({ act: 'sit' }, 20000); break;
      case 'wall': hold({ act: 'wall' }, 5000); for (let k = 0; k < 4; k++) setTimeout(() => onAnim('wash'), k * 900); setTimeout(() => { setFlowers(f => [...f.slice(-11), { x: at.x - 5 + Math.round(Math.random() * 10), y: 92 + Math.round(Math.random() * 14) }]); pop(at.x, at.y - 40, '✨', 2); }, 4200); break;
      case 'craft': anim('rummage', 3); setTimeout(() => { pop(at.x, at.y - 34, '✨', 2); const r = a.res; if (r) setMade(m => [...m.filter(e => e.icon !== r.icon || e.x !== r.x), r]); }, 2200); break;
      case 'dress': anim('rummage', 2); setTimeout(() => { setFlash(Date.now()); live.update({ outfit: L.current.mine.outfit === a.outfit ? null : a.outfit ?? null }); anim('cheer'); pop(at.x, at.y - 34, '✨', 3); }, 1600); break;
      case 'pick': anim('rummage', 2); setTimeout(() => pop(at.x, at.y - 30, '🍁', 3), 1200); break;
      case 'cheer': anim('cheer', 2); pop(at.x, at.y - 34, '✨', 3); break;
      case 'sing': hold({ act: 'sing' }, 9000); for (let k = 0; k < 6; k++) setTimeout(() => pop(at.x, at.y - 34, k % 2 ? '🎵' : '🎶'), k * 1400); setTimeout(() => pop(at.x, at.y - 10, '👏', 4), 8000); break;
      case 'pray': hold({ act: 'pray' }, 6000); for (let k = 0; k < 3; k++) setTimeout(() => pop(at.x, at.y - 34, scene === 'trip_iceland_aurora' ? '🌠' : '🙏'), k * 1500); break;
      case 'feed': hold({ act: 'feed' }, 7000); for (let k = 0; k < 4; k++) setTimeout(() => pop(at.x + (k % 2 ? 14 : -14), at.y - 4, '🕊️', 2), 600 + k * 900); break;
      case 'paint': hold({ act: 'paint' }, 9000); setArt(null); setTimeout(() => { setArt({ x: a.x, y: a.y }); pop(a.x, a.y - 20, '✨', 2); }, 8000); break;
      case 'cross': go({ x: spot.walk.x0 + 14, y: 148 }, () => go({ x: spot.walk.x1 - 14, y: 180 }, () => { anim('cheer'); pop(L.current.mine.pos.x, L.current.mine.pos.y - 34, '🎉', 2); })); break;
      case 'love': if (theirs) onKiss(); else live.say('💭 Ước gì người ấy ở đây…'); pop(at.x, at.y - 36, '💕', 3); break;
      case 'tent': live.update({ act: 'tent', pos: { x: 66, y: 176 }, dish: null, drink: null }); break;
      case 'soak': case 'mask': live.update({ act: a.do, pos: { x: a.x, y: a.y - 6 }, dish: null, drink: null }); break;
    }
  });
  const lbl = (a: Act) => a.k === 'photo' ? '📸 Chụp bưu thiếp' : a.label;
  const tented = [mine, theirs].filter(w => w?.act === 'tent').length;
  const tent = spot.acts.find(a => a.k === 'do' && a.do === 'tent');
  const soaking = mine.act === 'soak' || mine.act === 'mask';
  return (
    <>
      <FxList fx={spot.fx} scene={scene} night={night} />
      {floats.map(f => <Spr key={f.n} sprite={lotusSprite()} x={f.x} y={f.y} z={Math.round(f.y)} className="fx-lotus" />)}
      {flowers.map((f, k) => <Spr key={k} sprite={wallFlowerSprite(k)} x={f.x} y={f.y} z={5} className="pop" />)}
      {fx.map(e => <span key={e.n} className="fx-pop" style={{ left: e.x * s, top: e.y * s }}>{e.icon}</span>)}
      {flash > 0 && <div key={flash} className="trip-flash" />}
      {made.map(e => <span key={e.icon + e.x} className="fx-art" style={{ left: e.x * s, top: e.y * s }}>{e.icon}</span>)}
      {art && <span className="fx-art" style={{ left: art.x * s - 10, top: (art.y - 30) * s }}>🖼️</span>}
      <Rider spot={spot} who={mine} look={looks.me} />
      {theirs && <Rider spot={spot} who={theirs} look={looks.them} />}
      {[mine, theirs].map((w, k) => (w?.act === 'soak' || w?.act === 'mask') && <i key={k} className="fx-soak" style={{ left: (w.pos.x - 11) * s, top: (w.pos.y - 10) * s, width: 22 * s, height: 11 * s, zIndex: Math.round(w.pos.y) + 2 }} />)}
      {soaking && <Tag x={mine.pos.x} y={mine.pos.y + 4} className="label" onClick={() => live.update({ act: null, pos: { x: mine.pos.x, y: spot.walk.y0 + 4 } })}>🚶 Lên bờ</Tag>}
      {tent && tented > 0 && <Tag x={tent.x + 6} y={tent.y - 6} className="bed-bubble" onClick={() => mine.act === 'tent' && live.update({ act: null, pos: near(tent) })}>{tented > 1 ? '💑 Hai đứa trong lều' : '⛺ Có người trong lều'}{mine.act === 'tent' ? ' · bấm để ra' : ''}</Tag>}
      {spot.acts.map((a, i) => <Tag key={i} x={a.x} y={a.y} className="label" onClick={() => doAct(a, i)}>{lbl(a)}</Tag>)}
      {[0, 1, 2, 3, 4, 5, 6].map(i => <Stroller key={i} seed={scene} i={i} box={spot.walk} lines={spot.lines} />)}
    </>
  );
}
