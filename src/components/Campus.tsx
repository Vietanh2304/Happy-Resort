// Khuôn viên trường (bản đồ riêng như thành phố): sân trường có các bạn học (NPC) sinh hoạt theo giờ thật —
// chào cờ, ra chơi, ăn trưa ở nhà ăn, giờ thể dục, tan học có phụ huynh đón; 2 xe hàng rong trước cổng.
import { useEffect, useState, type CSSProperties } from 'react';
import * as api from '../lib/api';
import { CAMPUS, cartSprite, flagSprite, GYM, lunchTableSprite, matSprite, trayFood } from '../lib/campusArt';
import { item } from '../lib/content';
import { kidLook, kidSprite } from '../lib/kids';
import { notify } from '../lib/realtime';
import { atSchool, CLASSMATE_NPC, MATE_CHATTER, owlSprite, PERIOD, peIndoor, peOf, periodOf, SCHEDULE, STALLS, type Period, type StallId } from '../lib/school';
import { characterSprite } from '../lib/sprites';
import { toast, toastError } from '../lib/toast';
import type { Live } from '../lib/useLive';
import type { Pt } from '../lib/world';
import { avatarPx } from './Avatar';
import { Chat, status } from './Places';
import { Sheet } from './Sheet';
import { Spr, Tag, useScale } from './Stage';
import { Follower } from './Wander';

interface When { date: string; hour: number; minute: number }
const v = (o: Record<string, string | number>) => o as CSSProperties;

/** Một đứa trẻ trên sân: vị trí đích theo giờ + kiểu nhún nhảy */
interface Spot { at: Pt; cls?: string; food?: string }

/** Vị trí của học sinh thứ i (trong n bạn) theo tiết hiện tại; tick đổi mỗi vài giây để các bé chạy nhảy */
function spotOf(period: Period, pe: string, i: number, n: number, tick: number): Spot | null {
  const Y = CAMPUS.yard, F = CAMPUS.field;
  const rnd = (k: number) => { const x = Math.sin((i + 1) * 9301 + k * 49297) * 233280; return x - Math.floor(x); };
  const roam = (box: { x0: number; x1: number; y0: number; y1: number }) => ({ x: box.x0 + 6 + rnd(tick) * (box.x1 - box.x0 - 12), y: box.y0 + 8 + rnd(tick + 0.5) * (box.y1 - box.y0 - 10) });
  if (period === 'flag' || (period === 'pe' && pe === 'aerobic')) {
    // xếp hàng ngay ngắn trước cột cờ (thể dục buổi sáng thì nhún theo nhịp)
    const col = i % 6, row = Math.floor(i / 6);
    return { at: { x: 128 + col * 14, y: 122 + row * 12 }, cls: period === 'pe' || tick % 2 ? 'hop' : undefined };
  }
  if (period === 'recess') return { at: roam(Y), cls: i % 4 === 0 ? 'hop' : undefined };
  if (period === 'lunch') {
    const t = CAMPUS.tables[i % 4], k = Math.floor(i / 4);
    if (k > 2) return null;
    return { at: { x: t.x - 15 + k * 10, y: t.y - 2 }, food: i % 3 === 0 ? trayFood[(i + k) % trayFood.length] : undefined };
  }
  if (period === 'pe') {
    if (pe === 'ball' || pe === 'run') {
      if (pe === 'run') { const lane = i % 3; return { at: { x: (tick + i) % 2 ? F.x0 + 8 + (i % 4) * 4 : F.x1 - 8 - (i % 4) * 4, y: F.y0 + 8 + lane * 11 } }; }
      return { at: roam(F) };
    }
    if (pe === 'tug') { const side = i % 2, k = Math.floor(i / 2); return { at: { x: side ? 192 + k * 9 : 164 - k * 9, y: 132 }, cls: side ? 'tug-r' : 'tug-l' }; }
    if (pe === 'rope') { const a = (i / n) * Math.PI * 2; return { at: { x: 184 + Math.cos(a) * 34, y: 130 + Math.sin(a) * 12 }, cls: 'hop' }; }
    if (pe === 'hoop') return { at: { x: 200 + (i % 5) * 7, y: 120 + Math.floor(i / 5) * 9 + rnd(tick) * 4 }, cls: i % 3 === 0 ? 'hop' : undefined };
  }
  if (period === 'dismiss') {
    // ùa ra cổng: bé nào đã được đón thì đi ra vỉa hè
    const out = rnd(7) < Math.min(0.9, tick * 0.08);
    return out ? { at: { x: 30 + rnd(3) * 196, y: 162 + rnd(4) * 14 } } : { at: { x: 112 + rnd(tick) * 34, y: 134 + rnd(tick + 1) * 10 } };
  }
  return null;
}

/** Chỗ ngồi của ba mẹ ở bàn ăn ngoài sân (đầu bàn bên phải, các bé ngồi phía trái) */
export const tableSeat = (i: number): Pt => ({ x: CAMPUS.tables[i].x + 15, y: CAMPUS.tables[i].y - 2 });
/** Toạ độ sân trường → sàn nhà thể chất (giờ thể dục trong nhà) */
const toGym = (p: Pt): Pt => ({ x: Math.round(GYM.court.x0 + 8 + ((p.x - 120) / 120) * (GYM.court.x1 - GYM.court.x0 - 16)), y: Math.round(GYM.court.y0 + 8 + ((p.y - 108) / 40) * (GYM.court.y1 - GYM.court.y0 - 10)) });

export function CampusContent({ gym, kids, me, partner, when, weather, walking, night, go, onKid, onClass, onGym, onSit, onStall, onHome }: {
  gym?: boolean; kids: api.Kid[]; me: api.Profile; partner: api.Profile | null; when: When; weather?: string | null; walking: (string | null | undefined)[]; night: boolean;
  go: (to: Pt, then?: () => void) => void; onKid: (id: string) => void; onClass: () => void; onGym: () => void; onSit: (seat: Pt) => void; onStall: (id: StallId) => void; onHome: () => void;
}) {
  const s = useScale();
  const ps = avatarPx(s);
  const period = periodOf(when.date, when.hour, when.minute);
  const pe = peOf(when.date);
  const indoor = period === 'pe' && peIndoor(pe.id, weather);
  const [tick, setTick] = useState(0);
  const [said, setSaid] = useState<{ i: number; text: string } | null>(null);
  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 2800); return () => clearInterval(t); }, []);
  useEffect(() => { if (!said) return; const t = setTimeout(() => setSaid(null), 2600); return () => clearTimeout(t); }, [said]);
  const weekendPlay = !gym && period === 'closed' && !night && when.hour >= 8 && when.hour < 18;   // cuối tuần / chiều tối vẫn có vài bạn ra sân chơi
  const showPupils = gym ? indoor : !indoor;
  const mine = kids.filter(k => k.name && atSchool(k, when.date, when.hour, when.minute) && !walking.includes(k.id));
  const pupils = !showPupils ? [] : [
    ...mine.map(k => ({ id: k.id, name: k.name, girl: k.gender === 'f', look: kidLook(k, me, partner), mine: true })),
    ...CLASSMATE_NPC.slice(0, weekendPlay ? 3 : CLASSMATE_NPC.length).map(m => ({ id: m.name, name: m.name, girl: m.girl, look: m.look, mine: false })),
  ];
  const adult = (look: api.Profile['avatar'], at: Pt, title: string, pose: 'idle' | 'sit' = 'idle', z?: number) => {
    const sp = characterSprite(look, pose);
    return <img src={sp.url} alt={title} title={title} className="spr" style={{ left: at.x * s - (sp.w * ps) / 2, top: at.y * s - sp.h * ps, width: sp.w * ps, height: sp.h * ps, zIndex: z ?? Math.round(at.y) }} />;
  };
  const vendors = when.hour >= 6 && when.hour < 19;
  const info = PERIOD[period];
  const peHere = period === 'pe' && showPupils;
  const P = (x: number, y: number) => (gym ? toGym({ x, y }) : { x, y });
  return (
    <>
      {gym ? (
        <>
          <Tag x={96} y={2} className="label">🏀 Nhà thể chất · {indoor ? `${pe.icon} Lớp đang học ${pe.name}` : period === 'pe' ? `Hôm nay lớp học ${pe.name} ngoài sân` : 'Đang trống — vào chơi tự do nhé'}</Tag>
          <Spr sprite={matSprite()} x={GYM.mats.x - 40} y={GYM.mats.y + 8} z={GYM.mats.y - 20} />
          <Spr sprite={matSprite()} x={GYM.mats.x + 40} y={GYM.mats.y + 8} z={GYM.mats.y - 20} />
        </>
      ) : (
        <>
          <Tag x={128} y={2} className="label">🌻 Trường Tiểu học Hướng Dương · {info.icon} {period === 'pe' ? `Thể dục: ${pe.icon} ${pe.name}${indoor ? ' (trong nhà thể chất)' : ''}` : weekendPlay ? 'Giờ chơi tự do' : info.label}</Tag>
          <Tag x={CAMPUS.door.x} y={66} className="label" onClick={() => go(CAMPUS.door, onClass)}>✏️ Vào lớp</Tag>
          <button className="hot" title="Vào lớp học" style={{ left: 116 * s, top: 72 * s, width: 24 * s, height: 24 * s }} onClick={e => { e.stopPropagation(); go(CAMPUS.door, onClass); }} />
          <Tag x={CAMPUS.canteen.x} y={40} className="label" onClick={() => go(CAMPUS.canteen.door, () => onStall('canteen'))}>🍱 Nhà ăn</Tag>
          <button className="hot" title="Nhà ăn" style={{ left: 22 * s, top: 72 * s, width: 16 * s, height: 24 * s }} onClick={e => { e.stopPropagation(); go(CAMPUS.canteen.door, () => onStall('canteen')); }} />
          <Tag x={CAMPUS.gym.x} y={28} className="label" onClick={() => go(CAMPUS.gym.door, onGym)}>🏀 Nhà thể chất{indoor ? ' · đang học' : ''}</Tag>
          <button className="hot" title="Nhà thể chất" style={{ left: 217 * s, top: 72 * s, width: 20 * s, height: 24 * s }} onClick={e => { e.stopPropagation(); go(CAMPUS.gym.door, onGym); }} />
          <Spr sprite={flagSprite()} x={CAMPUS.flag.x} y={CAMPUS.flag.y} z={CAMPUS.flag.y} className="flag-wave" title="Cột cờ" />
          {CAMPUS.tables.map((t, i) => <Spr key={i} sprite={lunchTableSprite()} x={t.x} y={t.y + 4} z={t.y + 4} title="🪑 Ngồi vào bàn" onClick={() => onSit(tableSeat(i))} />)}
          {/* 2 xe hàng rong trước cổng trường */}
          {(['bread', 'sweet'] as const).map(id => {
            const c = CAMPUS.carts[id], st = STALLS[id];
            const open = () => go({ x: c.x, y: c.y + 6 }, () => onStall(id));
            return (
              <div key={id}>
                {vendors && adult(id === 'bread' ? { gender: 'f', hair: 3, hairColor: 0, skin: 1, shirt: 9, outfit: 14 } : { gender: 'm', hair: 2, hairColor: 0, skin: 2, shirt: 3, outfit: 6 }, { x: c.x + 8, y: c.y - 6 }, st.vendor, 'idle', c.y - 6)}
                <Spr sprite={cartSprite(id)} x={c.x} y={c.y} z={c.y} title={`${st.icon} ${st.name}`} onClick={open} />
                <Tag x={c.x} y={c.y - 34} className="label" onClick={open}>{st.icon} {id === 'bread' ? 'Bánh mì · xôi' : 'Kem · bánh tráng'}</Tag>
              </div>
            );
          })}
          <Tag x={CAMPUS.toTown.x + 8} y={150} className="label" onClick={() => go(CAMPUS.toTown, onHome)}>🏘️ Về làng</Tag>
          {adult({ gender: 'm', hair: 0, hairColor: 6, skin: 2, shirt: 7, outfit: 6, glasses: 1 }, CAMPUS.guard, 'Bác bảo vệ')}
          {period === 'dismiss' && [0, 1, 2, 3].map(i => <div key={i}>{adult(
            [{ gender: 'f' as const, hair: 3, hairColor: 1, skin: 0, shirt: 4, outfit: 14 }, { gender: 'm' as const, hair: 2, hairColor: 0, skin: 2, shirt: 10, outfit: 4 }, { gender: 'f' as const, hair: 5, hairColor: 2, skin: 1, shirt: 8, outfit: 1 }, { gender: 'm' as const, hair: 6, hairColor: 6, skin: 3, shirt: 2, outfit: 7 }][i],
            { x: [92, 166, 210, 40][i], y: 172 }, 'Phụ huynh')}</div>)}
          {period === 'class' || period === 'nap' ? <Tag x={128} y={110} className="label dim">{period === 'nap' ? '😴 Các bé đang ngủ trưa trong lớp' : '✏️ Các bé đang học trong lớp'}</Tag> : null}
          {indoor && <Tag x={128} y={110} className="label dim">🏀 Cả lớp đang học {pe.name} trong nhà thể chất</Tag>}
          {period === 'closed' && !weekendPlay && <Tag x={128} y={110} className="label dim">🌙 Trường nghỉ · {SCHEDULE.split(' · ')[0]}</Tag>}
        </>
      )}
      {/* cô giáo trông các bé */}
      {(gym ? indoor : ['flag', 'recess', 'lunch', 'dismiss'].includes(period) || peHere) && (() => {
        const t = gym ? { x: 30, y: 134 } : { x: period === 'lunch' ? 60 : period === 'dismiss' ? 104 : 116, y: period === 'flag' ? 116 : 140 };
        return (
          <>
            <Spr sprite={owlSprite()} x={t.x} y={t.y} className="bob" title="Cô giáo cú mèo" />
            {peHere && tick % 3 === 0 && <Tag x={t.x} y={t.y - 30} className="bed-bubble">📢 Tuýt tuýt! Cố lên các con!</Tag>}
            {!gym && period === 'flag' && <Tag x={152} y={100} className="bed-bubble">{new Date(`${when.date}T12:00:00`).getDay() === 1 ? '🚩 Nghiêm! Chào cờ!' : '🤸 Một, hai, ba, bốn!'}</Tag>}
          </>
        );
      })()}
      {peHere && pe.id === 'tug' && (() => { const a = P(120, 125), b = P(248, 125); return <div className="tug-rope" style={{ left: a.x * s, top: a.y * s, width: (b.x - a.x) * s, height: Math.max(2, s) }} />; })()}
      {peHere && pe.id === 'ball' && (() => { const a = P(150, 128); return <span className="campus-ball ball" style={v({ left: a.x * s, top: a.y * s, fontSize: Math.max(10, 5 * s), '--d': `${(gym ? 90 : 66) * s}px` })}>⚽</span>; })()}
      {peHere && pe.id === 'hoop' && (() => { const a = gym ? { x: GYM.hoops[1].x - 4, y: 42 } : { x: 222, y: 96 }; return <span className="campus-ball hoop" style={v({ left: a.x * s, top: a.y * s, fontSize: Math.max(10, 5 * s) })}>🏀</span>; })()}
      {peHere && pe.id === 'rope' && (() => { const a = P(166, 112); return <div className="jump-rope" style={{ left: a.x * s, top: a.y * s, width: 36 * s, height: 22 * s }} />; })()}
      {/* các bé */}
      {pupils.map((k, i) => {
        const raw = weekendPlay ? { at: spotOf('recess', pe.id, i, pupils.length, tick)!.at } : spotOf(period, pe.id, i, pupils.length, tick);
        if (!raw) return null;
        const sp = gym ? { ...raw, at: pe.id === 'hoop' ? { x: 130 + (i % 5) * 9, y: 96 + Math.floor(i / 5) * 12 } : toGym(raw.at) } : raw;
        const at = k.mine && period === 'dismiss' ? { x: 128, y: 138 } : sp.at;
        return (
          <div key={k.id}>
            <Follower sprite={kidSprite('student', k.look, 'idle', k.girl)} walk={kidSprite('student', k.look, 'walk', k.girl)} x={at.x} y={at.y} className={sp.cls} ps={ps * CAMPUS.kidScale}
              title={k.mine ? `🎒 ${k.name}` : `Bạn ${k.name}`} onClick={() => (k.mine ? onKid(k.id) : setSaid({ i, text: MATE_CHATTER[(i + tick) % MATE_CHATTER.length] }))} />
            {k.mine && <Tag x={at.x} y={at.y - 22} className="label">🎒 {k.name}</Tag>}
            {sp.food && <Tag x={at.x + 4} y={at.y - 22} className="food-bubble">{sp.food}</Tag>}
            {said?.i === i && <Tag x={at.x} y={at.y - 28} className="bed-bubble">{k.name}: {said.text}</Tag>}
          </div>
        );
      })}
      {night && <div className="city-night" />}
    </>
  );
}

export function CampusPanel({ live, kids, when, partnerHere, partnerName, onClass, onStall, onPickup, onLeave }: {
  live: Live; kids: api.Kid[]; when: When; partnerHere: boolean; partnerName: string;
  onClass: () => void; onStall: (id: StallId) => void; onPickup: (k: api.Kid) => void; onLeave: () => void;
}) {
  const period = periodOf(when.date, when.hour, when.minute), pe = peOf(when.date);
  const here = kids.filter(k => k.name && atSchool(k, when.date, when.hour, when.minute));
  const cheer = (k: api.Kid) => {
    live.say(period === 'pe' ? `📣 ${k.name} cố lên! ${pe.icon}` : `👋 ${k.name} ơi, ba mẹ ghé thăm con nè!`);
  };
  const lunchWith = (k: api.Kid) => {
    api.careKid(k.id, 'feed', 2).then(() => { notify('kids'); toast(`🍱 Ăn trưa cùng ${k.name} ở nhà ăn — bé vui lắm (+2 💗)`); live.say(`🍱 Ăn ngoan nào ${k.name}!`); }, toastError);
  };
  return (
    <div className="room-bar">
      <div className="room-panel">
        {status(partnerHere, partnerName, `Rủ ${partnerName} cùng ghé trường thăm con nhé 🏫`)}
        <p className="muted small-note">{PERIOD[period].icon} {period === 'pe' ? `Giờ thể dục hôm nay: ${pe.icon} ${pe.name}` : PERIOD[period].label} · 🕘 {SCHEDULE}</p>
        <div className="row wrap">
          <button className="btn small" onClick={onClass}>✏️ Vào lớp</button>
          <button className="btn small ghost" onClick={() => onStall('canteen')}>🍱 Nhà ăn</button>
          <button className="btn small ghost" onClick={() => onStall('bread')}>🥖 Xe bánh mì</button>
          <button className="btn small ghost" onClick={() => onStall('sweet')}>🍦 Xe kem</button>
        </div>
        {here.map(k => (
          <div key={k.id} className="row wrap school-kid">
            <b>{k.gender === 'm' ? '👦' : '👧'} {k.name}</b>
            {period === 'lunch' && <button className="btn small" onClick={() => lunchWith(k)}>🍱 Ăn trưa cùng con</button>}
            {period !== 'class' && period !== 'nap' && <button className="btn small ghost" onClick={() => cheer(k)}>{period === 'pe' ? '📣 Cổ vũ con' : '👋 Vẫy con'}</button>}
            <button className="btn small ghost" onClick={() => onPickup(k)}>🎒 Đón con về</button>
          </div>
        ))}
        <Chat live={live} placeholder="Nói gì đó ở trường…" />
      </div>
      <button className="btn small ghost leave" onClick={onLeave}>🏘️ Về làng</button>
    </div>
  );
}

/** Mua đồ ăn ở nhà ăn / xe hàng: món vào túi đồ (ăn, tặng, hoặc bán lại nửa giá) */
export function StallSheet({ id, coins, onClose }: { id: StallId; coins: number; onClose: () => void }) {
  const st = STALLS[id];
  const [busy, setBusy] = useState(false);
  const buy = async (itemId: string, price: number) => {
    if (coins < price) { toast('🪙 Không đủ xu rồi'); return; }
    setBusy(true);
    try { await api.buyItem(itemId, price); notify('inventory', 'profiles'); const it = item(itemId); toast(`${it.icon} Mua ${it.name} (${price} xu) — cất trong túi đồ`); }
    catch (e) { toastError(e); } finally { setBusy(false); }
  };
  return (
    <Sheet title={`${st.icon} ${st.name}`} onClose={onClose}>
      <p className="muted">💬 {st.vendor}: “{st.hello}” · 🪙 {coins} xu</p>
      <ul className="recipe-list">
        {st.menu.map(m => {
          const it = item(m.id);
          return (
            <li key={m.id} className="row">
              <span style={{ fontSize: 22 }}>{it.icon}</span>
              <b style={{ flex: 1 }}>{it.name}</b>
              <button className="btn small" disabled={busy || coins < m.price} onClick={() => buy(m.id, m.price)}>Mua · {m.price} xu</button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
