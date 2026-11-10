// Bản đồ du lịch: điểm tham quan bấm vào được, quán đặc sản (vào nhà hàng), quầy lưu niệm, chụp bưu thiếp, người đi dạo.
import { useEffect, useMemo, useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { seeded } from '../lib/rng';
import { characterSprite } from '../lib/sprites';
import { toast, toastError } from '../lib/toast';
import { TRIP_WALK, tripCtx, type Trip } from '../lib/trips';
import type { Pt, SceneId } from '../lib/world';
import { spotsOf } from '../lib/tripSpots';
import { avatarPx } from './Avatar';
import { Tag, useScale } from './Stage';
import { Follower } from './Wander';

const OUTFITS = [0, 1, 2, 6, 7, 8, 9, 14, 16, 3, 10];
const TOURIST = ['Đẹp quá trời!', '📸 Chụp giùm mình tấm ảnh nha', 'Đi đâu ăn ngon ta?', 'Lần đầu tới đây luôn 😍', 'Hai bạn dễ thương ghê 💕', 'Mỏi chân quá…'];

export function Stroller({ seed, i, box = TRIP_WALK, lines = TOURIST }: { seed: string; i: number; box?: { x0: number; x1: number; y0: number; y1: number }; lines?: string[] }) {
  const ps = avatarPx(useScale());
  const r = useMemo(() => seeded(`stroll:${seed}:${i}`), [seed, i]);
  const look = useMemo(() => ({ gender: (r() < 0.5 ? 'm' : 'f') as 'm' | 'f', hair: Math.floor(r() * 8), hairColor: Math.floor(r() * 6), skin: Math.floor(r() * 4), shirt: Math.floor(r() * 12), outfit: OUTFITS[Math.floor(r() * OUTFITS.length)] }), [r]);
  const [at, setAt] = useState<Pt>({ x: box.x0 + 12 + Math.floor(r() * (box.x1 - box.x0 - 24)), y: box.y0 + 4 + Math.floor(r() * (box.y1 - box.y0 - 8)) });
  const [say, setSay] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const step = () => {
      if (!alive) return;
      setAt(a => ({ x: Math.max(box.x0 + 4, Math.min(box.x1 - 4, a.x + (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 60))), y: Math.max(box.y0 + 4, Math.min(box.y1 - 4, a.y + (Math.random() - 0.5) * 30)) }));
      setTimeout(step, 2500 + Math.random() * 3500);
    };
    const t = setTimeout(step, 300 + i * 400);
    return () => { alive = false; clearTimeout(t); };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  const talk = () => { setSay(lines[(i + Math.floor(Date.now() / 4000)) % lines.length]); setTimeout(() => setSay(null), 2600); };
  return (
    <>
      <Follower sprite={characterSprite(look, 'idle', undefined, 'side')} walk={characterSprite(look, 'walk', undefined, 'side', 1)} x={at.x} y={at.y} title="Du khách" ps={ps} onClick={talk} />
      {say && <Tag x={at.x} y={at.y - 30} className="bed-bubble">{say}</Tag>}
    </>
  );
}

export function TripContent({ trip, me, today, go, enter }: { trip: Trip; me: api.Profile; today: string; go: (to: Pt, then?: () => void) => void; enter: (s: SceneId, at?: Pt) => void }) {
  const run = async (f: () => Promise<unknown>) => { try { await f(); } catch (e) { toastError(e); } };
  const souvenir = () => run(async () => {
    const it = item(trip.souvenir), price = 30;
    if (!confirm(`Mua quà lưu niệm ${it.icon} ${it.name} (${price} xu)?`)) return;
    await api.buyItem(trip.souvenir, price); notify('inventory', 'profiles'); toast(`🛍️ Mua ${it.icon} ${it.name} làm kỷ niệm`);
  });
  const photo = () => run(async () => {
    const ok = await api.claim(`postcard:${trip.id}:${today}:${me.id}`);
    if (!ok) return toast('📸 Hôm nay chụp ở đây rồi — bưu thiếp đã trong ✈️ Du lịch');
    await api.addMemory(me, 'postcard', { trip: trip.id }, today); notify('memories', 'claims');
    toast(`📸 Tách! Bưu thiếp ${trip.name} đã dán vào sổ du lịch`);
  });
  return (
    <>
      {spotsOf(trip.id).map((s, k) => (
        <Tag key={s.scene} x={s.at} y={92 + (k % 2) * 8} className="label" onClick={() => go({ x: s.at, y: TRIP_WALK.y0 + 6 }, () => enter(s.scene))}>{s.icon} {s.name} ➜</Tag>
      ))}
      <Tag x={44} y={150} className="label" onClick={() => go({ x: 44, y: 160 }, () => { tripCtx.at = trip.id; enter('restaurant'); })}>🍽️ Quán {trip.food.icon} {trip.food.name}</Tag>
      <Tag x={128} y={150} className="label" onClick={() => go({ x: 128, y: 160 }, () => void photo())}>📸 Chụp bưu thiếp</Tag>
      <Tag x={212} y={150} className="label" onClick={() => go({ x: 212, y: 160 }, () => void souvenir())}>🛍️ Quà lưu niệm {item(trip.souvenir).icon}</Tag>
      {[0, 1, 2, 3, 4].map(i => <Stroller key={i} seed={trip.id} i={i} />)}
    </>
  );
}

/** Máy bay cất cánh → bay qua mây → hạ cánh (2.6 giây), xong mới tới nơi */
export function FlightOverlay({ to, onDone }: { to: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flight">
      {[0, 1, 2, 3, 4].map(i => <i key={i} className="cloud" style={{ top: `${15 + i * 16}%`, animationDelay: `${-i * 0.4}s` }} />)}
      <span className="plane">✈️</span>
      <b>Đang bay tới {to}…</b>
    </div>
  );
}
