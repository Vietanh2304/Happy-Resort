// Bản đồ du lịch: điểm tham quan bấm vào được, quán đặc sản (vào nhà hàng), quầy lưu niệm, chụp bưu thiếp, người đi dạo.
import { useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { seeded } from '../lib/rng';
import { characterSprite, type Held } from '../lib/sprites';
import { toast, toastError } from '../lib/toast';
import { TRIP_WALK, tripCtx, type Trip } from '../lib/trips';
import type { Pt, SceneId } from '../lib/world';
import { spotsOf } from '../lib/tripSpots';
import { drinkProp, snackProp } from '../lib/props';
import type { AnimName } from '../lib/acts';
import type { Live } from '../lib/useLive';
import { mainOf } from '../lib/tripMain';
import { makeSprite } from '../lib/pixel';
import { avatarPx } from './Avatar';
import { Tag, useScale } from './Stage';
import { Follower } from './Wander';

const OUTFITS = [0, 1, 2, 6, 7, 8, 9, 14, 16, 3, 10];
const TOURIST = ['Đẹp quá trời!', '📸 Chụp giùm mình tấm ảnh nha', 'Đi đâu ăn ngon ta?', 'Lần đầu tới đây luôn 😍', 'Hai bạn dễ thương ghê 💕', 'Mỏi chân quá…'];

/** Việc NPC tự làm ở điểm du lịch: ngồi, ăn, uống, khấn, ngâm suối… */
export interface NpcJob { x: number; y: number; frame: 'sit' | 'idle'; view?: 'front' | 'side' | 'back'; hold?: Omit<Held, 'phase'>; swim?: boolean; mask?: boolean; say?: string }

export function Stroller({ seed, i, box = TRIP_WALK, lines = TOURIST, jobs, call }: { seed: string; i: number; box?: { x0: number; x1: number; y0: number; y1: number }; lines?: string[]; jobs?: NpcJob[]; call?: { job: NpcJob; n: number } | null }) {
  const s = useScale(), ps = avatarPx(s);
  const r = useMemo(() => seeded(`stroll:${seed}:${i}`), [seed, i]);
  const look = useMemo(() => ({ gender: (r() < 0.5 ? 'm' : 'f') as 'm' | 'f', hair: Math.floor(r() * 8), hairColor: Math.floor(r() * 6), skin: Math.floor(r() * 4), shirt: Math.floor(r() * 12), outfit: OUTFITS[Math.floor(r() * OUTFITS.length)] }), [r]);
  const [at, setAt] = useState<Pt>({ x: box.x0 + 12 + Math.floor(r() * (box.x1 - box.x0 - 24)), y: box.y0 + 4 + Math.floor(r() * (box.y1 - box.y0 - 8)) });
  const [say, setSay] = useState<string | null>(null);
  const [doing, setDoing] = useState<NpcJob | null>(null);
  const [tick, setTick] = useState(0);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (f: () => void, ms: number) => { timers.current.push(setTimeout(f, ms)); };
  /** đi tới chỗ làm việc, tới nơi thì làm một lúc rồi đi tiếp */
  const work = (j: NpcJob, dx = 0) => {
    busy.current = true; setDoing(null);
    const to = { x: j.x + dx, y: j.y + (dx ? 2 : 0) };
    setAt(to);
    later(() => { setDoing({ ...j, x: to.x, y: to.y }); if (j.say && Math.random() < 0.6) { setSay(j.say); later(() => setSay(null), 2600); } }, 3200);
    later(() => { setDoing(null); busy.current = false; setAt(a => ({ x: Math.max(box.x0 + 4, Math.min(box.x1 - 4, a.x)), y: Math.max(box.y0 + 4, Math.min(box.y1 - 4, a.y)) })); }, 3200 + 7000 + Math.random() * 6000);
  };
  useEffect(() => {
    let alive = true;
    const step = () => {
      if (!alive) return;
      if (!busy.current) {
        if (jobs?.length && Math.random() < 0.4) work(jobs[Math.floor(Math.random() * jobs.length)], Math.round((Math.random() - 0.5) * 16));
        else setAt(a => ({ x: Math.max(box.x0 + 4, Math.min(box.x1 - 4, a.x + (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 60))), y: Math.max(box.y0 + 4, Math.min(box.y1 - 4, a.y + (Math.random() - 0.5) * 30)) }));
      }
      later(step, 2500 + Math.random() * 3500);
    };
    later(step, 300 + i * 400);
    return () => { alive = false; timers.current.forEach(clearTimeout); timers.current = []; };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  // Người chơi làm gì thì vài du khách gần đó làm cùng
  useEffect(() => { if (call) work(call.job, (i % 2 ? 1 : -1) * (14 + i * 4)); }, [call?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!doing?.hold) return; const t = setInterval(() => setTick(v => v + 1), 900); return () => clearInterval(t); }, [doing]);
  const talk = () => { setSay(lines[(i + Math.floor(Date.now() / 4000)) % lines.length]); setTimeout(() => setSay(null), 2600); };
  const dl = doing?.swim ? { ...look, outfit: 18, acc: 0, glasses: doing.mask ? 5 : 0 } : look;
  const still = doing ? characterSprite(dl, doing.frame, doing.hold ? { ...doing.hold, phase: (tick % 2) as 0 | 1 } : undefined, doing.view ?? 'front') : characterSprite(look, 'idle', undefined, 'side');
  return (
    <>
      <Follower sprite={still} walk={doing ? undefined : characterSprite(look, 'walk', undefined, 'side', 1)} x={at.x} y={at.y} title="Du khách" ps={ps} onClick={talk} />
      {doing?.swim && <i className="fx-soak" style={{ left: (at.x - 11) * s, top: (at.y - 10) * s, width: 22 * s, height: 11 * s, zIndex: Math.round(at.y) + 3 }} />}
      {say && <Tag x={at.x} y={at.y - 30} className="bed-bubble">{say}</Tag>}
    </>
  );
}

export function TripContent({ trip, me, today, go, enter, live, onAnim }: { trip: Trip; me: api.Profile; today: string; go: (to: Pt, then?: () => void) => void; enter: (s: SceneId, at?: Pt) => void; live: Live; onAnim: (n: AnimName) => void }) {
  const [flash, setFlash] = useState(0);
  const mainJobs = useMemo<NpcJob[]>(() => [{ x: 128, y: 166, frame: 'idle', view: 'front', say: '📸 Chụp giùm tấm nha' }, { x: 212, y: 166, frame: 'idle', view: 'front', say: 'Mua quà về cho mẹ' }, { x: 56, y: 166, frame: 'idle', hold: { spec: snackProp(trip.food.name) ?? drinkProp(trip.food.name), mode: snackProp(trip.food.name) ? 'eat' : 'sip' }, say: 'Đặc sản ngon ghê!' }], [trip]);
  const run = async (f: () => Promise<unknown>) => { try { await f(); } catch (e) { toastError(e); } };
  const souvenir = () => run(async () => {
    const it = item(trip.souvenir), price = 10;
    if (!confirm(`Mua quà lưu niệm ${it.icon} ${it.name} (${price} xu)?`)) return;
    await api.buyItem(trip.souvenir, price); notify('inventory', 'profiles'); onAnim('cheer'); live.say(`${it.icon} Quà ${trip.name} nè!`); toast(`🛍️ Mua ${it.icon} ${it.name} làm kỷ niệm`);
  });
  const photo = () => run(async () => {
    live.say(live.theirs ? '📸 Cười lên nào… 1, 2, 3!' : '📸 Cheese!'); onAnim('cheer'); setTimeout(() => setFlash(Date.now()), 700);
    const ok = await api.claim(`postcard:${trip.id}:${today}:${me.id}`);
    if (!ok) return toast('📸 Hôm nay chụp ở đây rồi — bưu thiếp đã trong ✈️ Du lịch');
    await api.addMemory(me, 'postcard', { trip: trip.id }, today); notify('memories', 'claims');
    toast(`📸 Tách! Bưu thiếp ${trip.name} đã dán vào sổ du lịch`);
  });
  return (
    <>
      {flash > 0 && <div key={flash} className="trip-flash" />}
      {spotsOf(trip.id).map((s, k) => (
        <Tag key={s.scene} x={s.at} y={92 + (k % 2) * 8} className="label" onClick={() => go({ x: s.at, y: TRIP_WALK.y0 + 6 }, () => enter(s.scene))}>{s.icon} {s.name} ➜</Tag>
      ))}
      <Tag x={44} y={150} className="label" onClick={() => go({ x: 44, y: 160 }, () => { tripCtx.at = trip.id; enter('restaurant'); })}>🍽️ Quán {trip.food.icon} {trip.food.name}</Tag>
      <Tag x={128} y={150} className="label" onClick={() => go({ x: 128, y: 160 }, () => void photo())}>📸 Chụp bưu thiếp</Tag>
      <Tag x={212} y={150} className="label" onClick={() => go({ x: 212, y: 160 }, () => void souvenir())}>🛍️ Quà lưu niệm {item(trip.souvenir).icon}</Tag>
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <Stroller key={i} seed={trip.id} i={i} lines={mainOf(trip.id).lines} jobs={mainJobs} />)}
    </>
  );
}

/** Máy bay chở khách (cửa đóng kín) */
export const airliner = () => makeSprite('airliner:v1', 132, 40, p => {
  const W = '#f6f6fa', S = '#d0d0dc', B = '#3a6ad0', P = '#f0507a';
  for (let x = 10; x < 122; x++) { const t = x < 22 ? (x - 10) / 12 : 1; const h = Math.round(4 + t * 5); p.rect(x, 22 - h, 1, h * 2, W); p.px(x, 21 + h, S); }
  for (let x = 122; x < 131; x++) { const h = Math.max(1, Math.round(9 - (x - 122) * 1.0)); p.rect(x, 22 - h + Math.round((x - 122) * 0.3), 1, h * 2, W); }
  p.rect(14, 24, 112, 2, B); p.rect(14, 26, 110, 1, P);
  for (let x = 30; x < 116; x += 5) { p.rect(x, 17, 3, 3, '#5a8ac8'); p.px(x, 17, '#a8d0f0'); }
  p.rect(121, 16, 3, 3, '#2a3a5a'); p.rect(125, 16, 3, 3, '#2a3a5a'); p.px(125, 16, '#8ab0e0');
  for (const dx of [24, 110]) { p.rect(dx, 15, 5, 9, S); p.rect(dx + 1, 16, 3, 7, W); p.px(dx + 3, 20, '#8a8a9a'); }
  for (let y = 0; y < 14; y++) p.rect(8 + Math.round(y * 0.7), 2 + y, 10 - Math.round(y * 0.45), 1, y < 4 ? B : W);
  p.rect(8, 6, 6, 5, P); p.px(9, 6, W); p.px(12, 6, W); p.rect(10, 10, 2, 1, P);
  p.rect(2, 19, 18, 3, W); p.rect(2, 19, 18, 1, B);
  for (let x = 54; x < 90; x++) p.rect(x, 27 + Math.round((x - 54) * 0.28), 1, 3, x % 7 ? '#e0e0ea' : S);
  for (const ex of [62, 78]) { p.rect(ex, 33, 12, 5, '#c8c8d4'); p.rect(ex + 10, 33, 2, 5, '#5a5a6a'); p.rect(ex, 33, 12, 1, W); }
}, '#3a3a50');

/** Máy bay cất cánh → bay qua mây → hạ cánh (2.6 giây), xong mới tới nơi */
export function FlightOverlay({ to, onDone }: { to: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flight">
      {[0, 1, 2, 3, 4, 5, 6].map(i => <i key={i} className="cloud" style={{ top: `${8 + i * 13}%`, animationDelay: `${-i * 0.35}s`, animationDuration: `${0.9 + (i % 3) * 0.3}s` }} />)}
      <img className="plane px-img" src={airliner().url} alt="" draggable={false} style={{ width: airliner().w * 3, height: airliner().h * 3 }} />
      <b>Đang bay tới {to}…</b>
    </div>
  );
}
