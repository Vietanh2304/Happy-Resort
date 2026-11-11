// Thêm cho các điểm du lịch: pháo hoa đêm (cùng xem thì hôn), khoá tình yêu treo lan can, trụ đóng dấu + sổ dấu,
// chợ lưu niệm (đồ trang trí mang về nhà). Tất cả vẽ pixel, nhân vật làm động tác thật.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { ART } from '../lib/furniture';
import { emojiSprite } from '../lib/pixel';
import { notify, onEvent, sendEvent } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { lockRailSprite, lockSprite, stampPostSprite, TRIP_SHOP } from '../lib/tripArt';
import { SPOTS, spotBackground, type SpotDef, type SpotScene } from '../lib/tripSpots';
import { tripOf, type TripId } from '../lib/trips';
import type { AnimName } from '../lib/acts';
import type { Live } from '../lib/useLive';
import type { Pt } from '../lib/world';
import { Sheet } from './Sheet';
import { Spr, Tag, useScale } from './Stage';

const v = (o: Record<string, string | number>) => o as CSSProperties;
const ALL_SPOTS = Object.keys(SPOTS) as SpotScene[];
/** Mỗi nơi một chỗ treo khoá (cầu, bờ hồ, bờ sông…) */
const LOCK_SPOT: Record<TripId, SpotScene> = {
  taichung: 'trip_taichung_sunmoon', gwangju: 'trip_gwangju_mudeung', hoian: 'trip_hoian_river', tokyo: 'trip_tokyo_ueno',
  paris: 'trip_paris_seine', venice: 'trip_venice_canal', swiss: 'trip_swiss_chalet', iceland: 'trip_iceland_aurora',
};

/** Chọn góc trống nhất trong vùng đi lại (xa các nhãn hoạt động) */
function freeCorners(spot: SpotDef): Pt[] {
  const w = spot.walk;
  const cands: Pt[] = [{ x: w.x0 + 22, y: w.y1 - 4 }, { x: w.x1 - 22, y: w.y1 - 4 }, { x: w.x0 + 22, y: w.y0 + 14 }, { x: w.x1 - 22, y: w.y0 + 14 }, { x: 128, y: w.y1 - 4 }, { x: 80, y: w.y1 - 4 }, { x: 176, y: w.y1 - 4 }];
  const score = (c: Pt) => Math.min(...spot.acts.flatMap(a => [Math.hypot(a.x - c.x, (a.y - c.y + 26) * 1.4), Math.hypot(a.x - c.x, a.y + 34 - c.y)]));
  return cands.sort((a, b) => score(b) - score(a));
}

/** Pháo hoa pixel: tên lửa vọt lên rồi nổ tung thành hạt vuông */
function Fireworks({ dense }: { dense: boolean }) {
  const s = useScale();
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; c: string[]; n: number }[]>([]);
  useEffect(() => {
    const C = [['#ff5a7a', '#ffd0dc'], ['#ffd84a', '#fff2b0'], ['#5ad8ff', '#d0f4ff'], ['#9a7aff', '#e0d4ff'], ['#7aff9a', '#e0ffe8'], ['#ff9a3a', '#ffe0b0']];
    const spawn = () => {
      const id = Date.now() + Math.random();
      setBursts(b => [...b.slice(-3), { id, x: 30 + Math.random() * 196, y: 18 + Math.random() * 40, c: C[Math.floor(Math.random() * C.length)], n: 14 + Math.floor(Math.random() * 6) }]);
      setTimeout(() => setBursts(b => b.filter(e => e.id !== id)), 2400);
    };
    spawn();
    const t = setInterval(spawn, dense ? 850 : 3600);
    return () => clearInterval(t);
  }, [dense]);
  return (
    <div className="fx" style={{ left: 0, top: 0, width: 256 * s, height: 192 * s, zIndex: 2 }}>
      {bursts.map(b => (
        <span key={b.id}>
          <i className="fw-rocket" style={v({ left: b.x * s, top: b.y * s, width: s, height: 3 * s, '--rise': `${(150 - b.y) * s}px` })} />
          {Array.from({ length: b.n }, (_, k) => {
            const a = (k / b.n) * Math.PI * 2, r = (16 + (k % 3) * 5) * s;
            return <i key={k} className="fw-p" style={v({ left: b.x * s, top: b.y * s, width: 1.5 * s, height: 1.5 * s, background: b.c[k % 2], '--dx': `${Math.cos(a) * r}px`, '--dy': `${Math.sin(a) * r}px` })} />;
          })}
        </span>
      ))}
    </div>
  );
}

/** Dấu mộc tròn: cảnh thu nhỏ của nơi đó trong vòng mực đỏ */
export function StampMark({ scene, size, got = true }: { scene: SpotScene; size: number; got?: boolean }) {
  const bg = useMemo(() => spotBackground(scene, 'day').url, [scene]);
  return (
    <span className={`stamp-mark ${got ? '' : 'empty'}`} style={{ width: size, height: size }}>
      <i style={{ backgroundImage: `url(${bg})` }} />
      <b>{SPOTS[scene].icon}</b>
    </span>
  );
}

const useKeys = (ids: string[], prefix: string) => {
  const [keys, setKeys] = useState<{ user_id: string; key: string }[]>([]);
  const load = () => { if (ids.length) api.loadClaimKeys(ids, prefix).then(setKeys, console.error); };
  useEffect(load, [ids.join(), prefix]); // eslint-disable-line react-hooks/exhaustive-deps
  return [keys, load] as const;
};

export function TripExtras({ scene, trip, spot, me, partner, live, partnerHere, go, onAnim, onKiss, night, today }: {
  scene: string; trip: TripId; spot?: SpotDef; me: api.Profile; partner: api.Profile | null; live: Live; partnerHere: boolean;
  go: (to: Pt, then?: () => void) => void; onAnim: (n: AnimName) => void; onKiss: () => void; night: boolean; today: string;
}) {
  const s = useScale();
  const L = useRef(live); L.current = live;
  const mine = live.mine, theirs = partnerHere ? live.theirs : null;
  const ids = useMemo(() => [me.id, partner?.id].filter((x): x is string => !!x), [me.id, partner?.id]);
  const [stamps, reloadStamps] = useKeys(ids, 'stamp:');
  const [locks, reloadLocks] = useKeys(ids, `lock:${trip}:`);
  const [mark, setMark] = useState(0);
  const [hanging, setHanging] = useState(0);
  const [pops, setPops] = useState<{ id: number; url: string; x: number; y: number }[]>([]);
  useEffect(() => onEvent('trip-lock', () => reloadLocks()), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => onEvent('couple-act', () => { if (L.current.mine.act === 'firework') L.current.update({ act: null }); }), []);
  // Mua đồ lưu niệm xong: món đồ bay lên trên đầu nhân vật
  useEffect(() => {
    const f = (e: Event) => {
      const d = (e as CustomEvent<{ url: string }>).detail, p = L.current.mine.pos, id = Date.now();
      setPops(x => [...x.filter(e2 => e2.id !== id), { id, url: d.url, x: p.x, y: p.y - 34 }]); setTimeout(() => setPops(x => x.filter(e2 => e2.id !== id)), 2600);
    };
    window.addEventListener('trip-pop', f); return () => window.removeEventListener('trip-pop', f);
  }, []);

  const corners = useMemo(() => (spot ? freeCorners(spot) : []), [spot]);
  const post = corners[0];
  const rail = spot && LOCK_SPOT[trip] === scene ? corners.find(c => post && Math.hypot(c.x - post.x, c.y - post.y) > 60) : undefined;
  const railX = rail ? Math.max(24, Math.min(232, rail.x)) : 0;

  // ── Pháo hoa: tối mới có; hai người cùng ngắm thì quay sang hôn nhau
  const watching = mine.act === 'firework' || theirs?.act === 'firework';
  const kissed = useRef(0);
  useEffect(() => {
    if (!theirs || mine.act !== 'firework' || theirs.act !== 'firework' || !partner) return;
    if (Math.abs(mine.pos.x - theirs.pos.x) > 40 || Date.now() - kissed.current < 30000 || me.id > partner.id) return;
    kissed.current = Date.now();
    const t = setTimeout(() => { L.current.update({ act: null }); L.current.say('🎆 Đẹp quá… 💋'); onKiss(); }, 2500);
    return () => clearTimeout(t);
  }, [mine.act, theirs?.act]); // eslint-disable-line react-hooks/exhaustive-deps
  const watchFw = () => go({ x: 104 + Math.round(Math.random() * 48), y: 128 }, () => {
    L.current.update({ act: 'firework', dish: null, drink: null }); L.current.say('🎆 Oaaa pháo hoa kìa!');
    setTimeout(() => onAnim('cheer'), 1200);
    setTimeout(() => { if (L.current.mine.act === 'firework') L.current.update({ act: null }); }, 22000);
  });

  // ── Đóng dấu
  const stamped = stamps.some(k => k.key === `stamp:${scene}`);
  const doStamp = () => post && go({ x: post.x + (post.x < 128 ? 12 : -12), y: post.y + 2 }, () => {
    onAnim('rummage'); setTimeout(() => onAnim('chop'), 700); setTimeout(() => onAnim('chop'), 1100);
    setTimeout(() => {
      setMark(Date.now());
      void (async () => {
        try {
          const fresh = await api.claim(`stamp:${scene}`);
          if (!fresh) { L.current.say('📒 Sổ có dấu chỗ này rồi nè'); return; }
          onAnim('cheer'); L.current.say(`📒 Cộp! Có dấu ${spot?.name ?? ''} rồi!`);
          const all = await api.loadClaimKeys(ids, 'stamp:');
          const got = new Set(all.map(k => k.key));
          reloadStamps();
          toast(`📒 Đóng dấu ${spot?.icon} ${spot?.name} · ${got.size}/${ALL_SPOTS.length} dấu`);
          if (ALL_SPOTS.every(sc => got.has(`stamp:${sc}`)) && await api.claim('stamp-all', [{ id: 'travel_globe', n: 1 }])) {
            await api.grantCoins('coins:stamp-all', 300); notify('inventory', 'profiles');
            toast('🌏 Đủ dấu khắp 8 nơi! Quà hiếm: Quả địa cầu du lịch + 300 xu');
          }
        } catch (e) { toastError(e); }
      })();
    }, 1700);
  });

  // ── Khoá tình yêu
  const hang = () => rail && go({ x: railX, y: rail.y + 6 }, () => {
    L.current.update({ act: 'wall', dish: null, drink: null }); L.current.say('🔒 Khoá tình mình lại nào…');
    for (let k = 0; k < 3; k++) setTimeout(() => onAnim('wash'), 400 + k * 700);
    setTimeout(() => {
      void (async () => {
        try {
          const fresh = await api.claim(`lock:${trip}:${today}`);
          L.current.update({ act: null });
          if (!fresh) { L.current.say('🔒 Hôm nay mình treo khoá ở đây rồi'); return; }
          setHanging(Date.now()); reloadLocks(); sendEvent('trip-lock');
          onAnim('throw'); L.current.say('🗝️ Ném chìa khoá xuống nước — không ai mở được nữa!');
        } catch (e) { toastError(e); }
      })();
    }, 2600);
  });
  const lockDays = [...new Set(locks.map(k => k.key.split(':')[2]))].sort();
  const names = (day: string) => locks.filter(k => k.key.endsWith(day)).map(k => (k.user_id === me.id ? me.display_name : partner?.display_name ?? '…')).join(' & ');

  const isMain = !spot;
  return (
    <>
      {night && (watching || isMain) && <Fireworks dense={watching} />}
      {isMain && night && <Tag x={128} y={74} className="label" onClick={watchFw}>🎆 Ngắm pháo hoa</Tag>}
      {post && (
        <>
          <Spr sprite={stampPostSprite()} x={post.x} y={post.y} />
          <Tag x={post.x} y={post.y - 30} className="label" onClick={doStamp}>{stamped ? '✅ Đã có dấu' : '📒 Đóng dấu'}</Tag>
          {mark > 0 && Date.now() - mark < 3000 && <span key={mark} className="stamp-pop" style={{ left: (post.x - 14) * s, top: (post.y - 62) * s, zIndex: 800 }}><StampMark scene={scene as SpotScene} size={28 * s} /></span>}
        </>
      )}
      {rail && (
        <>
          <Spr sprite={lockRailSprite()} x={railX} y={rail.y} z={Math.round(rail.y) - 2} onClick={() => toast(lockDays.length ? `🔒 Khoá của hai bạn ở đây:\n${lockDays.map(d => `${d.split('-').reverse().join('/')} · ${names(d)}`).join('\n')}` : '🔒 Chưa có khoá nào — treo một cái đi!')} />
          {lockDays.slice(-18).map((d, k) => <Spr key={d} sprite={lockSprite(k + d.length)} x={railX - 16 + (k % 9) * 4} y={rail.y - 7 + Math.floor(k / 9) * 5} z={Math.round(rail.y) - 1} className={hanging && k === Math.min(17, lockDays.length - 1) ? 'pop' : ''} />)}
          <Tag x={railX} y={rail.y - 28} className="label" onClick={hang}>🔒 Treo khoá tình yêu</Tag>
        </>
      )}
      {pops.map(p => <img key={p.id} src={p.url} alt="" className="spr fx-rise" style={{ left: (p.x - 8) * s, top: p.y * s, width: 16 * s, height: 16 * s, objectFit: 'contain', zIndex: 800 }} />)}
    </>
  );
}

/** Chợ lưu niệm: đồ trang trí đặc trưng mỗi nơi, mua mang về đặt trong nhà */
export function TripShopSheet({ trip, coins, onClose, onBought }: { trip: TripId; coins: number; onClose: () => void; onBought: (url: string, name: string) => void }) {
  const t = tripOf(trip);
  const [busy, setBusy] = useState(false);
  if (!t) return null;
  const list: [string, number][] = [...TRIP_SHOP[trip], [t.souvenir, 10]];
  const buy = (id: string, price: number) => {
    const it = item(id);
    if (!confirm(`Mua ${it.name} (${price} xu)?`)) return;
    setBusy(true);
    api.buyItem(id, price).then(() => { notify('inventory', 'profiles'); onBought(ART[id]?.sprite().url ?? emojiSprite(it.icon).url, it.name); onClose(); }, toastError).finally(() => setBusy(false));
  };
  return (
    <Sheet title={`🛍️ Chợ lưu niệm ${t.name}`} onClose={onClose}>
      <p className="muted small-note">Hũ xu: 🪙 {coins} · đồ trang trí mang về đặt trong nhà (Túi đồ → Trang trí)</p>
      <div className="bag-grid">
        {list.map(([id, price]) => {
          const it = item(id), url = ART[id]?.sprite().url ?? emojiSprite(it.icon).url;
          return (
            <button key={id} className="bag-item" disabled={busy || coins < price} onClick={() => buy(id, price)}>
              <img src={url} alt="" className="px-img" style={{ width: 40, height: 40, objectFit: 'contain' }} />
              <small>{it.name}</small><small>🪙 {price}</small>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

/** Sổ đóng dấu: 20 khu tham quan, đủ hết thì nhận quà hiếm */
export function StampBook({ me, partner }: { me: api.Profile; partner: api.Profile | null }) {
  const ids = useMemo(() => [me.id, partner?.id].filter((x): x is string => !!x), [me.id, partner?.id]);
  const [keys] = useKeys(ids, 'stamp:');
  const got = new Set(keys.map(k => k.key));
  const n = ALL_SPOTS.filter(sc => got.has(`stamp:${sc}`)).length;
  return (
    <>
      <h4>📒 Sổ đóng dấu ({n}/{ALL_SPOTS.length}) <small className="muted">· đủ hết được 🌏 quà hiếm</small></h4>
      <div className="stamp-book">
        {ALL_SPOTS.map(sc => (
          <div key={sc} className="stamp-cell"><StampMark scene={sc} size={52} got={got.has(`stamp:${sc}`)} /><small>{SPOTS[sc].name}</small></div>
        ))}
      </div>
    </>
  );
}
