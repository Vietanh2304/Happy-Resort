// Map tham quan: hiệu ứng động (nước gợn, đèn lồng, lá rơi, cực quang…), du khách đi dạo, hoạt động bấm được.
import { useMemo, useState, type CSSProperties } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { seeded } from '../lib/rng';
import { toast, toastError } from '../lib/toast';
import { FORTUNES, miniSprite, type Act, type Fx, type SpotDef, type SpotScene } from '../lib/tripSpots';
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

export function SpotContent({ spot, scene, me, today, night, go }: { spot: SpotDef; scene: SpotScene; me: api.Profile; today: string; night: boolean; go: (to: Pt, then?: () => void) => void }) {
  const s = useScale();
  const [ride, setRide] = useState<{ act: Extract<Act, { k: 'ride' }>; n: number } | null>(null);
  const [floats, setFloats] = useState<{ x: number; y: number; n: number }[]>([]);
  const run = async (f: () => Promise<unknown>) => { try { await f(); } catch (e) { toastError(e); } };
  const near = (a: Act): Pt => ({ x: Math.max(spot.walk.x0, Math.min(spot.walk.x1, a.x)), y: Math.max(spot.walk.y0 + 2, Math.min(spot.walk.y1, a.y + 8)) });
  const doAct = (a: Act) => go(near(a), () => {
    if (a.k === 'say') toast(`${a.label}: ${a.say}`);
    if (a.k === 'fortune') toast(`🎋 Quẻ của bạn: ${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}`);
    if (a.k === 'ride') { setRide({ act: a, n: Date.now() }); toast(a.say); setTimeout(() => setRide(null), 7000); }
    if (a.k === 'float') { setFloats(f => [...f.slice(-7), { x: a.x - 20 + Math.random() * 40, y: a.ry - Math.random() * 30, n: Date.now() }]); toast('🪷 Hoa đăng trôi đi mang theo điều ước của hai bạn…'); }
    if (a.k === 'buy') void run(async () => {
      const it = item(a.item);
      if (!confirm(`Mua ${it.icon} ${it.name} (${a.price} xu)?`)) return;
      await api.buyItem(a.item, a.price); notify('inventory', 'profiles'); toast(`🛍️ Đã mua ${it.icon} ${it.name} ở ${spot.name}`);
    });
    if (a.k === 'photo') void run(async () => {
      const ok = await api.claim(`postcard:${spot.trip}:${spot.id}:${today}:${me.id}`);
      if (!ok) return toast('📸 Hôm nay chụp ở đây rồi');
      await api.addMemory(me, 'postcard', { trip: spot.trip, spot: spot.id }, today); notify('memories', 'claims');
      toast(`📸 Tách! Bưu thiếp ${spot.name} đã dán vào sổ du lịch`);
    });
  });
  const lbl = (a: Act) => a.k === 'photo' ? '📸 Chụp bưu thiếp' : a.label;
  return (
    <>
      {spot.fx.map((f, i) => <FxLayer key={i} fx={f} scene={scene} night={night} />)}
      {floats.map(f => <span key={f.n} className="fx-lotus" style={{ left: `${(f.x / 256) * 100}%`, top: `${(f.y / 192) * 100}%` }}>🪷</span>)}
      {ride && <Spr key={ride.n} sprite={miniSprite(ride.act.spr)} x={20} y={ride.act.ry} z={Math.round(ride.act.ry) + 1} className="fx-move ride" style={v({ '--dx': `${220 * s}px`, animationDuration: '7s', animationIterationCount: 1 })} />}
      {spot.acts.map((a, i) => <Tag key={i} x={a.x} y={a.y} className="label" onClick={() => doAct(a)}>{lbl(a)}</Tag>)}
      {[0, 1, 2, 3, 4].map(i => <Stroller key={i} seed={`${scene}`} i={i} box={spot.walk} lines={spot.lines} />)}
    </>
  );
}
