// Map tham quan: hiệu ứng động (nước gợn, đèn lồng, lá rơi, cực quang…), du khách đi dạo, hoạt động bấm được.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { AnimName } from '../lib/acts';
import { characterSprite, type AvatarLook } from '../lib/sprites';
import type { Live } from '../lib/useLive';
import { avatarPx } from './Avatar';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { seeded } from '../lib/rng';
import { toastError } from '../lib/toast';
import { FORTUNES, MINI, vehicleSprite, cowbellSprite, flySprite, lidSprite, knotSprite, pigeonSprite, popSprite, lotusSprite, wallFlowerSprite, miniSprite, type Act, type Fx, type SpotDef, type SpotScene } from '../lib/tripSpots';
import type { Pt } from '../lib/world';
import { Spr, Tag, useScale } from './Stage';
import { onEvent, sendEvent } from '../lib/realtime';
import { Follower } from './Wander';

const v = (o: Record<string, string | number>) => o as CSSProperties;

/** Chim / bướm pixel vỗ cánh, bay lượn */
function Flier({ icon, x, y, delay }: { icon: string; x: number; y: number; delay: number }) {
  const s = useScale();
  const [f, setF] = useState<0 | 1>(0);
  useEffect(() => { const t = setInterval(() => setF(v => (v ? 0 : 1)), icon === '🦅' ? 420 : 180); return () => clearInterval(t); }, [icon]);
  const sp = flySprite(icon, f), k = icon === '🦅' ? 1.4 : 1;
  return <img src={sp.url} alt="" className="fx-bird spr" style={{ left: x * s, top: y * s, width: sp.w * s * k, height: sp.h * s * k, animationDelay: `${delay}s`, zIndex: 600 }} />;
}

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
    case 'move': { const sp = vehicleSprite(fx.spr); return <Spr sprite={sp} x={fx.x} y={fx.y} z={fx.y < 100 ? 3 : Math.round(fx.y)} className={fx.loop ? 'fx-move' : 'fx-move2'} style={v({ '--dx': `${fx.dx * s}px`, animationDuration: `${fx.loop ? fx.dur : fx.dur * 2}s`, animationIterationCount: 'infinite' })} />; }
    case 'bird': return <>{Array.from({ length: fx.n }, (_, i) => <Flier key={i} icon={fx.icon} x={fx.x + r() * 60} y={fx.y + r() * 30} delay={-r() * 6} />)}</>;
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
const DRINKS = ['tra_sua', 'honey_tea', 'ca_phe_sua', 'peach_tea'];
const KEEP = ['clock', 'books', 'lantern', 'rose_bloom', 'chocolate', 'cheese'];

/** Ngồi trên thuyền / cáp treo / tàu: xe chạy ngang map mang theo nhân vật */
function Rider({ spot, who, look, look2 }: { spot: SpotDef; who: { act: string | null; trip?: { i: number; at: number } | null }; look: AvatarLook; look2?: AvatarLook }) {
  const s = useScale();
  const a = who.trip ? spot.acts[who.trip.i] : undefined;
  const delay = useMemo(() => (who.trip ? -(Date.now() - who.trip.at) : 0), [who.trip?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  if (who.act !== 'ride' || !a || a.k !== 'ride') return null;
  // người ngồi TRONG thuyền/xe: vẽ thân xe → người → mạn xe phía trước che chân
  const m = MINI[a.spr], raw = miniSprite(a.spr), veh = vehicleSprite(a.spr), vw = veh.w * s, vh = veh.h * s, row = vh / raw.h;
  const ch = characterSprite(look, 'sit', undefined, 'side');
  const head = m.head ?? 0, bottom = m.bottom ?? raw.h;
  const chh = (bottom - head) * row / 0.92, cw = chh * ch.w / ch.h;                  // người co theo cỡ thuyền
  const hullFrac = m.hull / raw.h, sink = vh - bottom * row - chh * 0.08;
  const H = Math.max(vh, vh - head * row);
  const ltr = a.x < 128, x0 = ltr ? 6 : 250 - veh.w, dx = (ltr ? 1 : -1) * (244 - veh.w) * s;
  return (
    <div className="fx-rider" style={v({ left: x0 * s, top: a.ry * s - H, width: vw, height: H, zIndex: Math.round(a.ry) + 2, '--dx': `${dx}px`, animationDuration: `${RIDE_MS}ms`, animationDelay: `${delay}ms` })}>
      <div style={{ position: 'absolute', inset: 0, transform: ltr ? undefined : 'scaleX(-1)' }}>
        <img src={veh.url} alt="" style={{ position: 'absolute', left: 0, bottom: 0, width: vw, height: vh }} />
        <img src={ch.url} alt="" style={{ position: 'absolute', left: vw * m.seat - cw / 2 + (look2 ? cw * 0.3 : 0), bottom: sink, width: cw, height: chh }} />
        {look2 && (() => { const c2 = characterSprite(look2, 'sit', undefined, 'side'); return <img src={c2.url} alt="" style={{ position: 'absolute', left: vw * m.seat - cw / 2 - cw * 0.35, bottom: sink, width: cw, height: chh }} />; })()}
        <img src={veh.url} alt="" style={{ position: 'absolute', left: 0, bottom: 0, width: vw, height: vh, clipPath: `inset(${hullFrac * 100}% 0 0 0)` }} />
      </div>
    </div>
  );
}

export function SpotContent({ spot, scene, me, today, night, go, live, partnerHere, looks, onAnim, onKiss, onCamera }: {
  spot: SpotDef; scene: SpotScene; me: api.Profile; today: string; night: boolean; go: (to: Pt, then?: () => void) => void;
  live: Live; partnerHere: boolean; looks: { me: AvatarLook; them: AvatarLook }; onAnim: (n: AnimName) => void; onKiss: () => void; onCamera: () => void;
}) {
  const s = useScale();
  const [floats, setFloats] = useState<{ x: number; y: number; n: number }[]>([]);
  const [flash, setFlash] = useState(0);
  const [fx, setFx] = useState<{ x: number; y: number; icon: string; n: number }[]>([]);
  const [art, setArt] = useState<{ x: number; y: number } | null>(null);
  const [made, setMade] = useState<{ icon: string; x: number; y: number }[]>([]);
  const [flowers, setFlowers] = useState<{ x: number; y: number }[]>([]);
  const [invite, setInvite] = useState<{ i: number; at: number } | null>(null);
  const [lid, setLid] = useState(false);
  const [bell, setBell] = useState(0);
  const [paintN, setPaintN] = useState(0);
  const [knots, setKnots] = useState<{ x: number; y: number }[]>([]);
  const [doves, setDoves] = useState<{ x: number; y: number; n: number; dx: number }[]>([]);
  const L = useRef(live); L.current = live;
  const mine = live.mine, theirs = partnerHere ? live.theirs : null;
  const run = async (f: () => Promise<unknown>) => { try { await f(); } catch (e) { toastError(e); } };
  // đứng lùi xuống dưới nhãn một khoảng để nhãn không che người và đồ (bồ câu, hoa đăng…)
  const near = (a: Act): Pt => ({ x: Math.max(spot.walk.x0, Math.min(spot.walk.x1, a.x)), y: Math.max(spot.walk.y0 + 2, Math.min(spot.walk.y1, a.y + 34)) });
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
  const doAct = (a: Act, i: number) => go((a.k === 'do' || a.k === 'park') && a.at ? a.at : near(a), () => {
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
    if (a.k === 'photo') return onCamera();
    if (a.k === 'park') return void window.dispatchEvent(new CustomEvent('fairy-act', { detail: { ride: a.ride, i } }));
    if (a.k === 'fortune') {
      live.update({ act: 'shake' }); live.say('🎋 Lắc lắc… lắc lắc…');
      setTimeout(() => { if (L.current.mine.act !== 'shake') return; L.current.update({ act: 'omikuji' }); L.current.say(`📜 ${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}`); }, 2400);
      setTimeout(() => { if (L.current.mine.act !== 'omikuji') return; L.current.update({ act: null }); go({ x: 244, y: 172 }, () => { L.current.update({ act: 'wall' }); setTimeout(() => { L.current.update({ act: null }); setKnots(k => [...k.slice(-8), { x: 239 + Math.round(Math.random() * 12), y: 148 + Math.floor(Math.random() * 3) * 7 }]); L.current.say('🎋 Buộc quẻ lên giá để giữ may mắn!'); }, 1600); }); }, 8000);
      return;
    }
    if (a.k === 'ride') {
      const t0 = Date.now();
      live.update({ act: 'ride', trip: { i, at: t0 }, dish: null, drink: null }); live.say(a.say);
      if (theirs) sendEvent('trip-ride', { scene, i, at: t0 });
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
      case 'pick': hold({ act: 'sit' }, 1800); setTimeout(() => { hold({ act: 'pick' }, 8000); pop(at.x, at.y - 30, '✨', 2); }, 1800); break;
      case 'cheer': anim('cheer', 2); pop(at.x, at.y - 34, '✨', 3); break;
      case 'watch': hold({ act: 'watch' }, 9000); setPaintN(Date.now()); setTimeout(() => { setFlowers(f => [...f.slice(-11), { x: 200 + Math.round(Math.random() * 30), y: 96 + Math.round(Math.random() * 12) }]); anim('cheer'); live.say('👏 Ông vẽ đẹp quá!'); }, 7000); break;
      case 'gaze': hold({ act: 'gaze' }, 8000); setTimeout(() => live.say('🛶 Gondola đi qua dưới cầu kìa…'), 3000); break;
      case 'jar': hold({ act: 'jar' }, 6000); setTimeout(() => { setLid(true); pop(214, 160, '✨', 2); }, 1500); setTimeout(() => setLid(false), 6500); break;
      case 'cow': hold({ act: 'cow' }, 6000); for (let k = 0; k < 5; k++) setTimeout(() => onAnim('wash'), k * 800); setBell(Date.now()); setTimeout(() => live.say('🔔 Leng keng~ leng keng~'), 1200); break;
      case 'sing': hold({ act: 'sing' }, 9000); for (let k = 0; k < 6; k++) setTimeout(() => pop(at.x, at.y - 34, k % 2 ? '🎵' : '🎶'), k * 1400); setTimeout(() => pop(at.x, at.y - 10, '👏', 4), 8000); break;
      case 'pray': hold({ act: 'pray' }, 6000); for (let k = 0; k < 3; k++) setTimeout(() => pop(at.x, at.y - 34, scene === 'trip_iceland_aurora' ? '🌠' : '🙏'), k * 1500); break;
      case 'feed': hold({ act: 'feed' }, 9000); for (let k = 0; k < 7; k++) setTimeout(() => setDoves(d => [...d.slice(-9), { x: at.x + (k % 2 ? 1 : -1) * (8 + (k * 5) % 16), y: at.y + 2 + (k % 3) * 3, n: Date.now() + k, dx: (k % 2 ? 1 : -1) * 60 }]), 500 + k * 600); setTimeout(() => setDoves([]), 16000); break;
      case 'paint': hold({ act: 'paint' }, 9000); setArt(null); setTimeout(() => { setArt({ x: a.x, y: a.y }); pop(a.x, a.y - 20, '✨', 2); }, 8000); break;
      case 'cross': go({ x: spot.walk.x0 + 14, y: 148 }, () => go({ x: spot.walk.x1 - 14, y: 180 }, () => { anim('cheer'); pop(L.current.mine.pos.x, L.current.mine.pos.y - 34, '🎉', 2); })); break;
      case 'love': if (theirs) { onKiss(); pop(at.x, at.y - 36, '💕', 3); } else { hold({ act: 'gaze' }, 3500); setTimeout(() => { hold({ act: 'selfie' }, 3500); live.say('🤳 Chụp tự sướng với tháp gửi người ấy nè'); setTimeout(() => setFlash(Date.now()), 1800); }, 3500); } break;
      case 'tent': live.update({ act: 'tent', pos: { x: 66, y: 176 }, dish: null, drink: null }); break;
      case 'soak': case 'mask': live.update({ act: a.do, pos: { x: a.x, y: a.y - 6 }, dish: null, drink: null }); break;
    }
  });
  // Người ấy rủ đi thuyền / đạp vịt / cáp treo → đồng ý thì lên ngồi chung
  useEffect(() => onEvent('trip-ride', (d: { scene: string; i: number; at: number }) => {
    const a = spot.acts[d.i];
    if (d.scene !== scene || !a || a.k !== 'ride' || L.current.mine.act === 'ride') return;
    setInvite({ i: d.i, at: d.at });
    setTimeout(() => setInvite(v => (v && v.at === d.at ? null : v)), 6000);
  }), [scene]);
  const joinRide = () => {
    const d = invite; setInvite(null); if (!d) return;
    const a = spot.acts[d.i]; if (!a || a.k !== 'ride' || Date.now() - d.at > RIDE_MS - 1500) return;
    L.current.update({ act: 'ride', trip: { i: d.i, at: d.at }, dish: null, drink: null });
    const end = { x: a.x < 128 ? spot.walk.x1 - 18 : spot.walk.x0 + 18, y: spot.walk.y0 + 6 };
    setTimeout(() => { if (L.current.mine.act === 'ride') L.current.update({ act: null, trip: null, pos: end }); }, RIDE_MS - (Date.now() - d.at));
  }; // eslint-disable-line react-hooks/exhaustive-deps
  const lbl = (a: Act) => a.k === 'photo' ? '📸 Chụp kỉ niệm' : a.label;
  const tented = [mine, theirs].filter(w => w?.act === 'tent').length;
  const tent = spot.acts.find(a => a.k === 'do' && a.do === 'tent');
  const soaking = mine.act === 'soak' || mine.act === 'mask';
  return (
    <>
      <FxList fx={spot.fx} scene={scene} night={night} />
      {floats.map(f => <Spr key={f.n} sprite={lotusSprite()} x={f.x} y={f.y} z={Math.round(f.y)} className="fx-lotus" />)}
      {scene === 'trip_taichung_rainbow' && <Grandpa painting={Date.now() - paintN < 9000} />}
      {scene === 'trip_gwangju_penguin' && lid && <Spr sprite={lidSprite()} x={214} y={164} z={190} className="fx-rise" />}
      {scene === 'trip_swiss_station' && <Spr key={bell} sprite={cowbellSprite()} x={176} y={176} z={185} className={Date.now() - bell < 6000 ? 'fx-ring' : ''} />}
      {knots.map((k, i) => <Spr key={`k${i}`} sprite={knotSprite()} x={k.x} y={k.y + 5} z={6} className="pop" />)}
      {doves.map(d => <Spr key={d.n} sprite={pigeonSprite(0)} x={d.x} y={d.y} z={Math.round(d.y)} className="fx-dove" style={v({ '--dx': `${d.dx * s}px` })} />)}
      {flowers.map((f, k) => <Spr key={k} sprite={wallFlowerSprite(k)} x={f.x} y={f.y} z={5} className="pop" />)}
      {fx.map(e => { const sp = popSprite(e.icon); return sp ? <Spr key={e.n} sprite={sp} x={e.x} y={e.y} z={700} className="fx-rise" /> : <span key={e.n} className="fx-pop" style={{ left: e.x * s, top: e.y * s }}>{e.icon}</span>; })}
      {flash > 0 && <div key={flash} className="trip-flash" />}
      {made.map(e => { const sp = popSprite(e.icon); return sp ? <Spr key={e.icon + e.x} sprite={sp} x={e.x} y={e.y} z={Math.round(e.y)} className="pop" /> : <span key={e.icon + e.x} className="fx-art" style={{ left: e.x * s, top: e.y * s }}>{e.icon}</span>; })}
      {art && <Spr sprite={popSprite('🖼️')!} x={art.x + 1} y={art.y - 16} z={Math.round(art.y) + 1} className="pop" />}
      {(() => {
        const both = !!theirs && mine.act === 'ride' && theirs.act === 'ride' && mine.trip && theirs.trip && mine.trip.i === theirs.trip.i && Math.abs(mine.trip.at - theirs.trip.at) < 4000;
        if (both) return <Rider spot={spot} who={mine.trip!.at <= theirs!.trip!.at ? mine : theirs!} look={looks.me} look2={looks.them} />;
        return <><Rider spot={spot} who={mine} look={looks.me} />{theirs && <Rider spot={spot} who={theirs} look={looks.them} />}</>;
      })()}
      {[mine, theirs].map((w, k) => (w?.act === 'soak' || w?.act === 'mask') && <i key={k} className="fx-soak" style={{ left: (w.pos.x - 11) * s, top: (w.pos.y - 10) * s, width: 22 * s, height: 11 * s, zIndex: Math.round(w.pos.y) + 2 }} />)}
      {soaking && <Tag x={mine.pos.x} y={mine.pos.y + 4} className="label" onClick={() => live.update({ act: null, pos: { x: mine.pos.x, y: spot.walk.y0 + 4 } })}>🚶 Lên bờ</Tag>}
      {tent && tented > 0 && <Tag x={tent.x + 6} y={tent.y - 6} className="bed-bubble" onClick={() => mine.act === 'tent' && live.update({ act: null, pos: near(tent) })}>{tented > 1 ? '💑 Hai đứa trong lều' : '⛺ Có người trong lều'}{mine.act === 'tent' ? ' · bấm để ra' : ''}</Tag>}
      {invite && (() => { const a = spot.acts[invite.i]; return a ? <Tag x={a.x} y={Math.max(20, a.y - 30)} className="label invite-chip" onClick={joinRide}>💑 Người ấy rủ {lbl(a).replace(/^\S+\s/, '')} — lên cùng!</Tag> : null; })()}
      {spot.acts.map((a, i) => <Tag key={i} x={a.x} y={a.y} className={`label ${a.k !== 'park' && Math.abs(mine.pos.x - a.x) < 26 && mine.pos.y - a.y > -8 && mine.pos.y - a.y < 52 ? 'dim' : ''}`} onClick={() => doAct(a, i)}>{lbl(a)}</Tag>)}
    </>
  );
}

/** Ông Cầu Vồng: ông cụ tóc bạc cầm cọ vẽ tường ở góc làng */
const GRANDPA = { gender: 'm' as const, hair: 0, hairColor: 6, skin: 1, shirt: 6, outfit: 0 };
function Grandpa({ painting }: { painting: boolean }) {
  const [f, setF] = useState<0 | 1>(0);
  useEffect(() => { const t = setInterval(() => setF(v => (v ? 0 : 1)), painting ? 350 : 1200); return () => clearInterval(t); }, [painting]);
  const sp = characterSprite(GRANDPA, 'idle', { spec: { kind: 'brush', color: ['#e8443a', '#4a9ae8', '#f6c445'][f] }, mode: 'pour', phase: f }, 'back');
  return <Follower sprite={sp} x={228} y={126} title="Ông Cầu Vồng" ps={avatarPx(useScale())} onClick={() => undefined} />;
}
