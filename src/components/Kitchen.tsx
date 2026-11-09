// Phòng bếp chung: hai người đi lại trong bếp, lấy đồ trong tủ lạnh chung, thái, nấu, bưng nồi, bày đĩa,
// bày lên bàn ăn rồi cùng ngồi ăn; ăn xong rửa bát. Một máy giữ trạng thái bếp ("chủ bếp"), máy kia gửi thao tác.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { useSynced } from '../lib/hooks';
import {
  act, CHAIRS, kitchenVariant, setKitchenVariant, COLS, dishOf, freshCount, HEAT, heatOf, INGREDIENTS, KRECIPES, LAYOUT, MEAL_MS, METHOD_LABEL, needsCut, newRoom,
  ROWS, stageOf, STAGE_LABEL, tick, tileAt, walkable, CHOP_N, WASH_N, type Opt, type Room, type Thing,
} from '../lib/kitchen';
import { emojiSprite, makeSprite, type Pen } from '../lib/pixel';
import { foodProp } from '../lib/props';
import { notify } from '../lib/realtime';
import { characterSprite, type View } from '../lib/sprites';
import { toast, toastError } from '../lib/toast';
import { reward, useGameChannel, type Msg } from './gameKit';
import { bakeOrders, orderBlock } from '../lib/shops';
import { useGlide } from './play/kit';
import { actFrame, type Act } from '../lib/acts';

const T = 16;              // cỡ ô (pixel logic)
const SPEED = 4.2;         // ô mỗi giây
const R = 0.3;             // bán kính thân người (ô)
type Dir = 'u' | 'd' | 'l' | 'r';
const DV: Record<Dir, [number, number]> = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const KEYS: Record<string, Dir> = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', w: 'u', s: 'd', a: 'l', d: 'r', W: 'u', S: 'd', A: 'l', D: 'r' };
interface Pos { x: number; y: number; f: Dir; mv: boolean }

export function KitchenRoom({ me, partner, inventory, date, onLeave, variant = 'home' }: {
  variant?: 'home' | 'bakery';
  me: api.Profile; partner: api.Profile | null; inventory: api.InvRow[]; date: string; onLeave: () => void;
}) {
  setKitchenVariant(variant);
  const them = partner?.id ?? '';
  const [fridge] = useSynced('fridge', api.loadFridge, [] as api.InvRow[]);
  const [room, setRoom] = useState<Room>(() => newRoom(me.id));
  const roomRef = useRef(room);
  roomRef.current = room;
  const off = useRef(0);                   // giờ máy chủ bếp − giờ máy mình
  const lastHost = useRef(Date.now());
  const ready = useRef(false);             // đã nhận trạng thái bếp (để không phát lại thưởng/thông báo cũ)
  const [theirPos, setTheirPos] = useState<Pos | null>(null);
  const theirShown = useGlide(theirPos, SPEED, true);
  const start: Pos = me.id < them ? { x: 2.5, y: 1.5, f: 'd', mv: false } : { x: 6.5, y: 6.5, f: 'd', mv: false };
  const [pos, setPos] = useState<Pos>(start);
  const posRef = useRef(pos);
  const [panel, setPanel] = useState<null | 'fridge' | 'book'>(null);
  const [atFridge, setAtFridge] = useState<[number, number] | null>(null);
  const [now, setNow] = useState(Date.now());
  const [bubble, setBubble] = useState<{ text: string; at: number } | null>(null);
  const [acts, setActs] = useState<{ me?: Act; them?: Act }>({});

  const commit = (r: Room) => { roomRef.current = r; setRoom(r); send('st', { r, now: Date.now() }); };
  const hostAct = (by: string, m: Msg) => {
    const res = act(roomRef.current, by, m.x, m.y, Date.now(), m.o ?? {});
    commit(res.r);
    if (res.used?.length) {
      const n: Record<string, number> = {};
      res.used.forEach(id => { n[id] = (n[id] ?? 0) + 1; });
      api.fridgeUse(Object.entries(n).map(([id, k]) => ({ id, n: k }))).then(() => notify('fridge'), e => console.error('fridge', e));
    }
  };
  const send = useGameChannel((variant === 'bakery' ? 'bake' : 'cook') as 'cook', me.id, m => {
    const mine = m.by === me.id;
    if (m.t === 'act' && roomRef.current.host === me.id) { hostAct(m.by, m); return; }
    if (mine) return;
    if (m.t === 'hello') {
      if (roomRef.current.host === me.id) send('st', { r: roomRef.current, now: Date.now() });
      send('pos', posRef.current);
    }
    if (m.t === 'pos') setTheirPos({ x: m.x, y: m.y, f: m.f, mv: m.mv });
    if (m.t === 'anim') setActs(a => ({ ...a, them: { n: m.n, at: Date.now() } }));
    if (m.t === 'bye') {
      setTheirPos(null);
      const r = roomRef.current;
      const seats = { ...r.seats }; delete seats[m.by];
      if (r.host === m.by || r.host === me.id) commit({ ...r, host: me.id, seats, v: r.v + 1 });
    }
    if (m.t === 'st') {
      const r: Room = m.r;
      const cur = roomRef.current;
      // Hai máy cùng tưởng mình là chủ bếp: bếp nào có nhiều thao tác hơn thì giữ (hoà thì id nhỏ hơn)
      if (cur.host === me.id && r.host !== me.id && (cur.v > r.v || (cur.v === r.v && me.id < r.host))) { send('st', { r: cur, now: Date.now() }); return; }
      if (r.host === me.id) return;
      off.current = m.now - Date.now();
      lastHost.current = Date.now();
      roomRef.current = r;
      setRoom(r);
    }
  });

  // Vào bếp: chào máy kia; nghỉ một nhịp rồi mới tính thông báo/thưởng mới
  useEffect(() => {
    send('hello');
    send('pos', posRef.current);
    const t = setTimeout(() => { ready.current = true; }, 900);
    return () => { clearTimeout(t); send('bye'); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Đồng hồ: vẽ lại thanh lửa; chủ bếp tính bữa ăn xong và gửi nhịp; máy kia mất chủ bếp lâu thì nhận làm chủ
  useEffect(() => {
    let beat = 0;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const r = roomRef.current;
      if (r.host === me.id) {
        const done = tick(r, n);
        if (done) {
          commit(done);
          if (done.last && done.last.coins > 0) api.grantCoins(`coins:k${done.last.id}`, done.last.coins).then(ok => ok && notify('profiles'), console.error);
        } else if (++beat % 15 === 0) send('st', { r, now: n });
      } else if (n - lastHost.current > 7000) {
        commit({ ...r, host: me.id, v: r.v + 1 });
      }
    }, 120);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const hostNow = now + (room.host === me.id ? 0 : off.current);

  // Lời nhắc, món cất vào túi, bữa ăn xong
  const seen = useRef({ note: 0, give: '', last: '' });
  useEffect(() => {
    const s = seen.current;
    if (room.note && room.note.to === me.id && room.note.at !== s.note) { s.note = room.note.at; setBubble({ text: room.note.text, at: Date.now() }); }
    if (room.give && room.give.key !== s.give) {
      s.give = room.give.key;
      if (room.give.to === me.id) {
        const g = room.give;
        api.claim(g.key, [{ id: g.id, n: 1 }]).then(ok => { if (ok) { toast(`📦 ${item(g.id).icon} ${item(g.id).name} đã vào túi`); notify('inventory', 'collection'); } }, toastError);
      }
    }
    if (room.last && room.last.id !== s.last) {
      s.last = room.last.id;
      if (ready.current) {
        const l = room.last;
        toast(`${l.q === 3 ? '😋 Ngon tuyệt!' : l.q === 2 ? '🙂 Cũng ngon nè' : '😅 Hơi sống…'} Ăn xong ${l.dishes.map(d => item(d).icon).join('')}${l.both ? ' cùng nhau 💞' : ''}${l.coins ? ` · +${l.coins} xu` : ''}`);
        reward('cook', date);
      }
    }
  }, [room, me.id, date]);
  useEffect(() => { if (!bubble) return; const t = setTimeout(() => setBubble(null), 2600); return () => clearTimeout(t); }, [bubble]);

  const mySeat = room.seats[me.id];
  const theirSeat = them ? room.seats[them] : undefined;
  const hand = room.hands[me.id] ?? null;

  // ───── Di chuyển ─────
  const keys = useRef<Dir[]>([]);
  const path = useRef<[number, number][] | null>(null);
  const goal = useRef<[number, number] | null>(null);
  const doActRef = useRef<(x: number, y: number) => void>(() => {});
  const sentAt = useRef(0);
  useEffect(() => {
    let raf = 0, last = performance.now();
    const free = (x: number, y: number) => [[x - R, y - R], [x + R, y - R], [x - R, y + R * 0.6], [x + R, y + R * 0.6]].every(([a, b]) => walkable(Math.floor(a), Math.floor(b)));
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const p = { ...posRef.current };
      let mv = false;
      if (roomRef.current.seats[me.id] === undefined) {
        const k = keys.current[keys.current.length - 1];
        if (k) {
          path.current = null; goal.current = null;
          const [dx, dy] = DV[k];
          p.f = k;
          if (free(p.x + dx * SPEED * dt, p.y)) p.x += dx * SPEED * dt;
          if (free(p.x, p.y + dy * SPEED * dt)) p.y += dy * SPEED * dt;
          mv = true;
        } else if (path.current) {
          const nx = path.current[0];
          if (!nx) {
            path.current = null;
            if (goal.current) { const [gx, gy] = goal.current; goal.current = null; p.f = faceTo(p, gx, gy); posRef.current = p; doActRef.current(gx, gy); }
          } else {
            const tx = nx[0] + 0.5, ty = nx[1] + 0.5, d = Math.hypot(tx - p.x, ty - p.y), st = SPEED * dt;
            if (d <= st) { p.x = tx; p.y = ty; path.current.shift(); } else { p.x += ((tx - p.x) / d) * st; p.y += ((ty - p.y) / d) * st; }
            p.f = Math.abs(tx - p.x) > Math.abs(ty - p.y) ? (tx > p.x ? 'r' : 'l') : ty > p.y ? 'd' : 'u';
            mv = true;
          }
        }
      }
      p.mv = mv;
      const o = posRef.current;
      if (p.x !== o.x || p.y !== o.y || p.f !== o.f || p.mv !== o.mv) {
        posRef.current = p; setPos(p);
        if (t - sentAt.current > 140 || !mv) { sentAt.current = t; send('pos', p); }
      } else if (t - sentAt.current > 1500) { sentAt.current = t; send('pos', p); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Đi tới cạnh ô (x, y) rồi dùng nó */
  function goUse(x: number, y: number) {
    if (roomRef.current.seats[me.id] !== undefined) return;
    const p = posRef.current;
    if (walkable(x, y)) { path.current = bfs([Math.floor(p.x), Math.floor(p.y)], ([a, b]) => a === x && b === y); goal.current = null; return; }
    const near = ([a, b]: [number, number]) => Math.abs(a - x) + Math.abs(b - y) === 1;
    const here: [number, number] = [Math.floor(p.x), Math.floor(p.y)];
    if (near(here)) { const f = faceTo(p, x, y); posRef.current = { ...p, f }; setPos(posRef.current); doAct(x, y); return; }
    const route = bfs(here, near);
    if (!route) { setBubble({ text: 'Không tới được chỗ đó', at: Date.now() }); return; }
    path.current = route; goal.current = [x, y];
  }
  /** Ô trước mặt (hoặc ô đồ vật kề bên gần nhất) */
  function ahead(): [number, number] {
    const p = posRef.current, cx = Math.floor(p.x), cy = Math.floor(p.y);
    const order: Dir[] = [p.f, ...(['u', 'd', 'l', 'r'] as Dir[]).filter(d => d !== p.f)];
    for (const d of order) { const [dx, dy] = DV[d]; if (tileAt(cx + dx, cy + dy) && !walkable(cx + dx, cy + dy)) return [cx + dx, cy + dy]; }
    return [cx + DV[p.f][0], cy + DV[p.f][1]];
  }
  function doAct(x: number, y: number, o: Opt = {}) {
    const t = tileAt(x, y);
    const h = roomRef.current.hands[me.id];
    if (t === 'F' && !o.pick && !(h?.k === 'ing')) { setAtFridge([x, y]); setPanel('fridge'); return; }
    // Thái trên thớt / rửa bát: nhân vật làm động tác thật (máy kia cũng thấy)
    const cell = roomRef.current.cells[`${x},${y}`];
    const n = !h && t === 'B' && cell?.k === 'ing' && !cell.cut ? 'chop' : !h && t === 'K' && roomRef.current.sink.n > 0 ? 'wash' : null;
    if (n) { setActs(a => ({ ...a, me: { n, at: Date.now() } })); send('anim', { n }); }
    send('act', { x, y, o });
  }
  doActRef.current = doAct;
  const sendO = (o: Opt) => send('act', { x: 0, y: 0, o });
  function stand() {
    const s = roomRef.current.seats[me.id];
    if (s === undefined) return;
    const [cx, cy] = CHAIRS[s];
    const spot = ([[cx - 1, cy], [cx + 1, cy], [cx, cy + 1], [cx, cy - 1]] as [number, number][]).find(([a, b]) => walkable(a, b))!;
    posRef.current = { x: spot[0] + 0.5, y: spot[1] + 0.5, f: 'd', mv: false }; setPos(posRef.current);
    sendO({ stand: true });
  }
  const standRef = useRef(stand); standRef.current = stand;

  // Bàn phím
  useEffect(() => {
    const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    const down = (e: KeyboardEvent) => {
      if (typing(e)) return;
      const d = KEYS[e.key];
      if (d) {
        e.preventDefault();
        if (roomRef.current.seats[me.id] !== undefined) { standRef.current(); return; }
        if (!keys.current.includes(d)) keys.current.push(d);
      } else if (e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === 'j') {
        e.preventDefault();
        if (e.repeat && e.key !== ' ') return;
        const [x, y] = ahead();
        doActRef.current(x, y);
      } else if (e.key === 'Escape') setPanel(null);
    };
    const up = (e: KeyboardEvent) => { const d = KEYS[e.key]; if (d) keys.current = keys.current.filter(k => k !== d); };
    const blur = () => { keys.current = []; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ───── Kích thước ─────
  const [vw, setVw] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => { const f = () => setVw({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  // Màn rộng: thấy cả bếp. Điện thoại dọc: phóng to và camera đi theo nhân vật mình
  const availW = vw.w - 16, availH = vw.h - 190;
  const fit = Math.min(5, availW / (COLS * T), availH / (ROWS * T));
  const small = fit < 2.4;
  const [wide, setWide] = useState(false);
  const s = !small || wide ? fit : Math.max(fit, Math.min(2.8, availH / (ROWS * T)));
  const bw = COLS * T * s, bh = ROWS * T * s, viewW = Math.min(bw, availW), viewH = Math.min(bh, availH);
  const cam = (p: number, view: number, full: number) => Math.max(0, Math.min(full - view, p - view / 2));
  const mySpot = mySeat !== undefined ? { x: CHAIRS[mySeat][0] + 0.5, y: CHAIRS[mySeat][1] + 0.5 } : pos;
  const camX = cam(mySpot.x * T * s, viewW, bw), camY = cam(mySpot.y * T * s, viewH, bh);
  const bg = useMemo(roomSprite, []);

  const eating = !!room.meal;
  const phase = Math.floor(now / 450) % 2 as 0 | 1;
  const avatar = (who: 'me' | 'them', look: api.Profile['avatar'], p: Pos, seat: number | undefined, held: Thing | null, name?: string) => {
    let x = p.x, y = p.y, view: View = p.f === 'u' ? 'back' : p.f === 'd' ? 'front' : 'side', flip = p.f === 'l';
    let sp;
    if (seat !== undefined) {
      const [cx, cy] = CHAIRS[seat];
      x = cx + 0.5; y = cy + 0.75; flip = cx > COLS / 2 + 3; view = 'front';
      const dish = room.meal?.dishes[seat] ?? room.meal?.dishes[0];
      sp = characterSprite(look, 'sit', eating && dish ? { spec: foodProp(item(dish).name).utensil, mode: 'eat', phase } : undefined, 'front');
    } else {
      const af = p.mv ? null : actFrame(acts[who], now);
      sp = af !== null ? characterSprite(look, 'act', undefined, 'front', af) : characterSprite(look, p.mv ? 'walk' : 'idle', undefined, view, p.mv ? Math.floor(now / 130) % 4 : 0);
      if (af !== null) flip = false;
    }
    const ax = sp.ax ?? sp.w / 2;
    const z = Math.round(y * 10) + 5;
    return (
      <div key={who} className={`k-avatar ${who}`} style={{ left: x * T * s, top: y * T * s, zIndex: z }}>
        <img src={sp.url} alt="" draggable={false} style={{ width: sp.w * s, height: sp.h * s, marginLeft: -ax * s, marginTop: -sp.h * s, transform: flip ? 'scaleX(-1)' : undefined }} />
        {held && <div className="k-held" style={{ top: -sp.h * s * 0.62, left: (p.f === 'l' ? -5 : p.f === 'r' ? 5 : 0) * s }}><ThingView t={held} s={s} now={hostNow} /></div>}
        {name && <span className="k-name">{name}</span>}
        {who === 'me' && bubble && <span className="speech k-bubble" style={{ bottom: sp.h * s + 4 }}>{bubble.text}</span>}
      </div>
    );
  };

  const tap = (e: React.MouseEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - b.left) / (T * s)), y = Math.floor((e.clientY - b.top) / (T * s));
    if (tileAt(x, y)) goUse(x, y);
  };
  const stock = (id: string) => (fridge.find(r => r.item_id === id)?.qty ?? 0) - freshCount(room, id);
  const holdingDish = hand?.k === 'plate' && !!dishOf(hand);

  return createPortal(
    <div className="kitchen-full" role="dialog" aria-label="Phòng bếp">
      <div className="k-top">
        <b>{variant === 'bakery' ? '🍰 Bếp tiệm bánh' : '👩‍🍳 Phòng bếp'}</b>
        <span className="k-who">{them && theirPos ? `🟢 ${partner?.display_name} đang trong bếp` : `💤 ${partner?.display_name ?? 'Người ấy'} chưa vào bếp`}</span>
        <span className="row">
          {small && <button className="btn small ghost" onClick={() => setWide(v => !v)}>{wide ? '🔎 Phóng to' : '🔍 Xem cả bếp'}</button>}
          <button className={`btn small ${panel === 'book' ? '' : 'ghost'}`} onClick={() => setPanel(panel === 'book' ? null : 'book')}>📖 Công thức</button>
          <button className={`btn small ${panel === 'fridge' ? '' : 'ghost'}`} onClick={() => { setAtFridge(null); setPanel(panel === 'fridge' ? null : 'fridge'); }}>{variant === 'bakery' ? '🧊 Tủ nguyên liệu' : '🧊 Tủ lạnh'}</button>
          <button className="btn small ghost" onClick={onLeave}>{variant === 'bakery' ? '🚪 Ra phố' : '🚪 Ra khỏi bếp'}</button>
        </span>
      </div>
      <div className="k-view" style={{ width: viewW, height: viewH }}>
      <div className="k-board" style={{ width: bw, height: bh, transform: camX || camY ? `translate(${-camX}px, ${-camY}px)` : undefined }} onClick={tap}>
        <img className="k-bg" src={bg.url} alt="" draggable={false} style={{ width: COLS * T * s, height: ROWS * T * s }} />
        {Object.entries(room.cells).map(([k, t]) => {
          if (!t) return null;
          const [x, y] = k.split(',').map(Number);
          return <div key={k} className="k-thing" style={{ left: (x + 0.5) * T * s, top: (y + 0.5) * T * s, zIndex: y * 10 + 3 }}><ThingView t={t} s={s} now={hostNow} /></div>;
        })}
        {Object.entries(room.cells).map(([k, t]) => {
          if (t?.k !== 'pot' || !t.parts.length) return null;
          const [x, y] = k.split(',').map(Number);
          return <div key={`h${k}`} className="k-thing" style={{ left: (x + 0.5) * T * s, top: (y + 0.5) * T * s, zIndex: 300 }}><HeatBar pot={t} now={hostNow} s={s} /></div>;
        })}
        {room.clean > 0 && LAYOUT.flatMap((row, y) => [...row].map((c, x) => c === 'P' ? <span key={`p${x}`} className="k-count" style={{ left: (x + 0.85) * T * s, top: (y + 0.15) * T * s }}>{room.clean}</span> : null))}
        {room.sink.n > 0 && LAYOUT.flatMap((row, y) => [...row].map((c, x) => c === 'K' && y === 4 ? (
          <div key={`k${x}`} className="k-thing" style={{ left: (x + 0.5) * T * s, top: (y + 0.5) * T * s, zIndex: 50 }}>
            <ThingView t={{ k: 'dirty', n: room.sink.n }} s={s} now={hostNow} />
            {room.sink.wash > 0 && <Bar v={room.sink.wash / WASH_N} s={s} color="#7fd0f0" />}
          </div>
        ) : null))}
        {variant === 'bakery' && <BakeryCustomers date={date} last={room.last} s={s} />}
        {avatar('me', me.avatar, pos, mySeat, hand, undefined)}
        {theirShown && partner && avatar('them', partner.avatar, theirShown, theirSeat, room.hands[them] ?? null, partner.display_name)}
        {room.meal && <div className="k-meal" style={{ left: 10 * T * s, top: 4.2 * T * s }}>😋 {Math.ceil((room.meal.until - hostNow) / 1000)}s</div>}
      </div>
      </div>

      <div className="k-bottom">
        {mySeat !== undefined ? (
          <div className="row center wrap">
            {room.meal ? <span className="k-hint">😋 Đang ăn… {room.meal.both ? 'cùng nhau 💞' : ''} <Bar v={1 - (room.meal.until - hostNow) / MEAL_MS} s={3} color="#a5d470" inline /></span>
              : <button className="btn" onClick={() => sendO({ eat: true })}>🍽️ Ăn thôi!</button>}
            <button className="btn ghost" onClick={stand}>🧍 Đứng dậy</button>
          </div>
        ) : (
          <div className="row center wrap">
            <button className="btn k-use" onPointerDown={e => { e.preventDefault(); const [x, y] = ahead(); doAct(x, y); }}>✋ Dùng</button>
            <span className="k-hint">
              {hand ? <>Đang cầm: <b>{thingName(hand)}</b> · </> : null}
              Máy tính: <kbd>WASD</kbd>/<kbd>mũi tên</kbd> đi, <kbd>Space</kbd> dùng · Điện thoại: chạm vào đồ để đi tới và dùng (chạm liên tục để thái/rửa)
            </span>
          </div>
        )}
      </div>

      {panel === 'fridge' && (
        <div className="k-panel">
          <h4>🧊 Tủ lạnh chung <small className="muted">· đồ của cả hai, ai cũng lấy được</small></h4>
          {!atFridge && <p className="muted small-note">Muốn lấy đồ ra nấu thì đi tới tủ lạnh trong bếp rồi bấm vào tủ nhé.</p>}
          {holdingDish && atFridge && <button className="btn small" onClick={() => { doAct(atFridge[0], atFridge[1], { stash: true }); setPanel(null); }}>📦 Cất món đang cầm vào túi</button>}
          <div className="bag-grid">
            {fridge.filter(r => r.qty > 0).map(r => {
              const n = stock(r.item_id), it = item(r.item_id);
              return (
                <div key={r.item_id} className="k-fitem">
                  <button className="bag-item" disabled={!atFridge || !!hand || n < 1}
                    onClick={() => { if (atFridge) doAct(atFridge[0], atFridge[1], { pick: r.item_id }); setPanel(null); }}>
                    <img src={emojiSprite(it.icon).url} className="px-img" alt="" />
                    <small>{it.name} ×{n}</small>
                    <i>{atFridge ? (hand ? 'tay đang bận' : 'lấy ra nấu') : ''}</i>
                  </button>
                  <button className="chip" title="Lấy về túi" disabled={n < 1}
                    onClick={() => api.fridgeTake(r.item_id, 1).then(() => notify('fridge', 'inventory'), toastError)}>↩️ về túi</button>
                </div>
              );
            })}
          </div>
          {fridge.every(r => r.qty <= 0) && <p className="muted">Tủ đang trống. Trồng rau, câu cá hoặc mua ở 🐱 Cửa hàng (quầy 🥬 Nguyên liệu) rồi cất vào đây.</p>}
          <PutBox inventory={inventory} />
          <button className="btn small ghost" onClick={() => setPanel(null)}>Đóng</button>
        </div>
      )}
      {panel === 'book' && (
        <div className="k-panel">
          <h4>📖 Sổ công thức</h4>
          <p className="muted small-note">🔪 = phải thái trên thớt trước. Nấu trên bếp có thanh lửa: <span className="k-z raw">sống</span> <span className="k-z ok">chín</span> <span className="k-z over">quá lửa</span> <span className="k-z burnt">khét</span> — múc ra lúc thanh ở vùng xanh là ngon nhất. Bày món lên bàn ăn rồi cùng ngồi vào ghế để ăn, cả hai cùng ăn được gấp đôi xu 💞</p>
          <ul className="k-recipes">
            {KRECIPES.map(r => {
              const counts: Record<string, number> = {};
              r.needs.forEach(id => { counts[id] = (counts[id] ?? 0) + 1; });
              const can = Object.entries(counts).every(([id, n]) => stock(id) >= n);
              return (
                <li key={r.id} className={can ? 'ready' : ''}>
                  <span className="k-dish">{item(r.id).icon}</span>
                  <div>
                    <b>{item(r.id).name}</b>
                    <span className="needs">{r.needs.map((id, i) => <span key={i} className={stock(id) > 0 ? 'ok' : 'missing'}>{item(id).icon}{needsCut(id) ? '🔪' : ''}</span>)} → {METHOD_LABEL[r.m]}</span>
                  </div>
                  {can && <small className="k-can">đủ đồ</small>}
                </li>
              );
            })}
          </ul>
          <button className="btn small ghost" onClick={() => setPanel(null)}>Đóng</button>
        </div>
      )}
    </div>,
    document.body,
  );
}

/** Cất nguyên liệu trong túi mình vào tủ chung */
function PutBox({ inventory }: { inventory: api.InvRow[] }) {
  const rows = inventory.filter(r => INGREDIENTS.includes(r.item_id) && r.qty > 0);
  const [busy, setBusy] = useState(false);
  const put = (items: { id: string; n: number }[]) => {
    setBusy(true);
    api.fridgePut(items).then(() => { toast('🧊 Đã cất vào tủ lạnh chung'); notify('fridge', 'inventory'); }, toastError).finally(() => setBusy(false));
  };
  if (!rows.length) return <p className="muted small-note">Trong túi bạn chưa có nguyên liệu nào để cất.</p>;
  return (
    <div className="k-put">
      <p className="small-note">🎒 Nguyên liệu trong túi bạn — bấm để cất 1 món vào tủ:</p>
      <div className="row wrap">
        {rows.map(r => <button key={r.item_id} className="chip" disabled={busy} onClick={() => put([{ id: r.item_id, n: 1 }])}>{item(r.item_id).icon} ×{r.qty}</button>)}
      </div>
      <button className="btn small" disabled={busy} onClick={() => put(rows.map(r => ({ id: r.item_id, n: r.qty })))}>📥 Cất hết vào tủ</button>
    </div>
  );
}

function thingName(t: Thing) {
  if (t.k === 'ing') return `${item(t.id).icon} ${item(t.id).name}${t.cut ? ' (đã thái)' : ''}`;
  if (t.k === 'dirty') return `🍽️ ${t.n} đĩa bẩn`;
  if (t.k === 'pot') return `🍲 Nồi${t.parts.length ? ` (${t.parts.map(p => item(p.id).icon).join('')})` : ' trống'}`;
  const d = dishOf(t);
  return d ? `${item(d.id).icon} ${item(d.id).name}${t.cream ? ' 🍦' : ''}` : t.parts.length ? `Đĩa ${t.parts.map(p => item(p.id).icon).join('')}` : 'Đĩa sạch';
}

function Bar({ v, s, color, inline }: { v: number; s: number; color: string; inline?: boolean }) {
  return <span className={`k-bar ${inline ? 'inline' : ''}`} style={inline ? undefined : { width: 12 * s, height: Math.max(3, 1.6 * s), top: 6 * s }}><i style={{ width: `${Math.min(1, Math.max(0, v)) * 100}%`, background: color }} /></span>;
}

/** Thanh lửa: sống (xám) → chín (xanh) → quá lửa (vàng) → khét (đỏ) */
function HeatBar({ pot, now, s }: { pot: Extract<Thing, { k: 'pot' }>; now: number; s: number }) {
  const m = HEAT[pot.t], total = m.over + 3, h = heatOf(pot, now), st = stageOf(pot, now);
  const pc = (v: number) => `${(v / total) * 100}%`;
  return (
    <span className={`k-heat ${st}`} style={{ width: 15 * s, height: Math.max(4, 2.2 * s), top: 4 * s }}>
      <i className="raw" style={{ left: 0, width: pc(m.raw) }} />
      <i className="ok" style={{ left: pc(m.raw), width: pc(m.ok - m.raw) }} />
      <i className="over" style={{ left: pc(m.ok), width: pc(m.over - m.ok) }} />
      <i className="burnt" style={{ left: pc(m.over), width: pc(total - m.over) }} />
      <b style={{ left: pc(Math.min(h, total)) }} />
      <em>{st === 'burnt' ? '💨' : pot.on ? '🔥' : ''} {STAGE_LABEL[st]}</em>
    </span>
  );
}

function ThingView({ t, s }: { t: Thing; s: number; now?: number }) {
  const icon = (id: string, size: number, key?: number | string, cls = '') => <img key={key} src={emojiSprite(item(id).icon).url} className={`px-img ${cls}`} alt="" style={{ width: size * s, height: size * s }} />;
  if (t.k === 'ing') {
    return (
      <div className="k-t">
        {t.cut && needsCut(t.id) ? <span className="k-cut">{icon(t.id, 7, 1)}{icon(t.id, 7, 2)}</span> : icon(t.id, 11)}
        {!!t.chop && !t.cut && <Bar v={t.chop / CHOP_N} s={s} color="#f6c64e" />}
      </div>
    );
  }
  if (t.k === 'dirty') {
    const sp = plateSprite(true);
    return <div className="k-t"><img src={sp.url} alt="" className="px-img" style={{ width: sp.w * s, height: sp.h * s }} />{t.n > 1 && <span className="k-n">×{t.n}</span>}</div>;
  }
  if (t.k === 'plate') {
    const sp = plateSprite(false), d = dishOf(t);
    return (
      <div className="k-t">
        <img src={sp.url} alt="" className="px-img" style={{ width: sp.w * s, height: sp.h * s }} />
        <span className="k-on">{d ? icon(d.id, 11) : t.parts.map((p, i) => icon(p.id, 6, i))}</span>
        {d && t.q < 3 && <span className="k-q">{t.q === 1 ? '😬' : '🔥'}</span>}
      </div>
    );
  }
  const sp = t.t === 'S' ? potSprite() : null;
  return (
    <div className="k-t">
      {sp && <img src={sp.url} alt="" className="px-img" style={{ width: sp.w * s, height: sp.h * s }} />}
      <span className={`k-on ${t.t === 'L' ? 'jar' : ''}`}>{t.parts.map((p, i) => icon(p.id, 5.5, i))}</span>
    </div>
  );
}

// ───────── Đường đi ─────────
function bfs(from: [number, number], goalFn: (p: [number, number]) => boolean): [number, number][] | null {
  const seen = new Set([from.join()]);
  const q: { p: [number, number]; path: [number, number][] }[] = [{ p: from, path: [] }];
  while (q.length) {
    const { p, path } = q.shift()!;
    if (goalFn(p)) return path;
    for (const [dx, dy] of Object.values(DV)) {
      const n: [number, number] = [p[0] + dx, p[1] + dy];
      if (!walkable(n[0], n[1]) || seen.has(n.join())) continue;
      seen.add(n.join());
      q.push({ p: n, path: [...path, n] });
    }
  }
  return null;
}
const faceTo = (p: Pos, x: number, y: number): Dir => {
  const dx = x + 0.5 - p.x, dy = y + 0.5 - p.y;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u';
};

// ───────── Hình vẽ ─────────
function plateSprite(dirty: boolean) {
  return makeSprite(`kplate${dirty ? 'd' : ''}`, 14, 7, p => {
    p.rect(1, 0, 12, 7, '#fffaf0'); p.rect(0, 1, 14, 5, '#fffaf0');
    p.rect(3, 2, 8, 3, dirty ? '#e8e0d0' : '#f1ece2');
    if (dirty) { p.px(4, 2, '#a8865a'); p.px(8, 3, '#b8946a'); p.px(10, 2, '#a07a4a'); p.px(6, 4, '#c8a06a'); }
  });
}
function potSprite() {
  return makeSprite('kpot', 16, 9, p => {
    p.rect(0, 2, 2, 2, '#3a3c44'); p.rect(14, 2, 2, 2, '#3a3c44');
    p.rect(2, 0, 12, 9, '#6a6e7a'); p.rect(3, 1, 10, 3, '#2e3038'); p.rect(2, 7, 12, 2, '#555864');
  });
}

function roomSprite() {
  return makeSprite(`kitchen-room:${kitchenVariant()}`, COLS * T, ROWS * T, p => {
    LAYOUT.forEach((row, y) => [...row].forEach((c, x) => drawTile(p, c, x * T, y * T, x, y)));
  }, null);
}
const rug = (x: number, y: number) => kitchenVariant() === 'home' && x >= 7 && x <= 12 && y >= 4 && y <= 6;
function drawTile(p: Pen, c: string, X: number, Y: number, x: number, y: number) {
  const floor = () => {
    if (rug(x, y)) { p.rect(X, Y, T, T, '#f6c8d4'); if (y === 4) p.rect(X, Y, T, 1, '#e295ac'); if (y === 6) p.rect(X, Y + T - 1, T, 1, '#e295ac'); if (x === 7) p.rect(X, Y, 1, T, '#e295ac'); if (x === 12) p.rect(X + T - 1, Y, 1, T, '#e295ac'); return; }
    p.rect(X, Y, T, T, (x + y) % 2 ? '#f3e2c4' : '#e9d3ad');
    p.rect(X, Y + T - 1, T, 1, '#dcc29a');
  };
  const counter = (top = '#8fc6e0') => {
    p.rect(X, Y, T, T, top); p.rect(X, Y, T, 2, '#b5dcef'); p.rect(X, Y + T - 4, T, 4, '#5c8fb0'); p.rect(X, Y + T - 4, T, 1, '#4a7898');
  };
  switch (c) {
    case '.': floor(); break;
    case 'C': counter(); break;
    case 'F':
      p.rect(X, Y, T, T, '#eef4f9'); p.rect(X, Y, T, 3, '#d6e2ec'); p.rect(X, Y + 7, T, 1, '#c0ceda');
      p.rect(X + 12, Y + 4, 2, 2, '#7d8fa0'); p.rect(X + 12, Y + 9, 2, 4, '#7d8fa0'); p.rect(X + 3, Y + 10, 2, 2, '#f08aa6'); p.rect(X, Y + T - 2, T, 2, '#aab8c6');
      break;
    case 'B':
      counter(); p.rect(X + 2, Y + 2, 12, 9, '#f0cf8e'); p.rect(X + 2, Y + 10, 12, 1, '#d4a85e'); p.rect(X + 10, Y + 3, 3, 1, '#d8dee6'); p.rect(X + 13, Y + 3, 1, 1, '#6a4a32');
      break;
    case 'S':
      if (kitchenVariant() === 'bakery') {   // lò gạch nướng bánh
        p.rect(X, Y, T, T, '#b8583a'); for (let yy = 0; yy < T; yy += 4) for (let xx = (yy / 4) % 2 ? 0 : 3; xx < T; xx += 6) p.rect(X + xx, Y + yy, 5, 3, '#c8684a');
        p.rect(X + 3, Y + 5, 10, 8, '#3a2020'); p.rect(X + 4, Y + 9, 8, 3, '#f6a03a'); p.rect(X + 5, Y + 10, 6, 1, '#ffe08a'); p.rect(X, Y + T - 1, T, 1, '#7a3020');
        break;
      }
      p.rect(X, Y, T, T, '#4a4e5a'); p.rect(X, Y, T, 2, '#5e6270'); p.rect(X + 3, Y + 3, 10, 8, '#2a2c34'); p.rect(X + 5, Y + 5, 6, 4, '#4a2a2a');
      p.rect(X + 3, Y + 13, 2, 2, '#e8604a'); p.rect(X + 11, Y + 13, 2, 2, '#e8604a'); p.rect(X, Y + T - 1, T, 1, '#30323a');
      break;
    case 'L':
      if (kitchenVariant() === 'bakery') { counter(); p.rect(X + 4, Y + 2, 8, 9, '#f8f0f4'); p.rect(X + 5, Y + 3, 6, 3, '#f8b8cc'); p.rect(X + 7, Y + 11, 2, 3, '#c8c8d8'); p.rect(X + 3, Y + 12, 10, 1, '#e8b8c8'); break; }
      counter(); p.rect(X + 4, Y + 9, 8, 4, '#d0605f'); p.rect(X + 5, Y + 1, 6, 8, '#c8ecf6'); p.rect(X + 5, Y + 1, 6, 1, '#8a9aa8'); p.rect(X + 6, Y + 2, 1, 6, '#ffffff');
      break;
    case 'P':
      counter(); for (let i = 0; i < 3; i++) { p.rect(X + 3, Y + 8 - i * 2, 10, 2, '#fffaf0'); p.rect(X + 3, Y + 9 - i * 2, 10, 1, '#d8d0c0'); }
      break;
    case 'K':
      counter(); p.rect(X + 2, Y + 2, 12, 9, '#6fa4c4'); p.rect(X + 3, Y + 3, 10, 7, '#a9d4ea'); p.rect(X + 7, Y + 0, 2, 3, '#b0b8c0');
      break;
    case 'T':
      floor(); p.rect(X + 3, Y + 3, 10, 12, '#8a929c'); p.rect(X + 2, Y + 2, 12, 3, '#6a7280'); p.rect(X + 6, Y + 8, 4, 3, '#7cc86a');
      break;
    case 'o':   // vỉa hè ngoài quầy bán, khách đứng chờ
      p.rect(X, Y, T, T, (x % 2) ? '#d8d0c4' : '#cfc6b8'); p.rect(X, Y, T, 1, '#b8b0a8');
      break;
    case 'D':
      if (kitchenVariant() === 'bakery') {   // quầy kính bày bánh
        p.rect(X, Y, T, T, '#e8d4b0'); p.rect(X, Y + 2, T, 9, '#d8f0ff'); p.rect(X, Y + 6, T, 1, '#ffffff'); p.rect(X + 3, Y + 8, 4, 2, '#e8b070'); p.rect(X + 9, Y + 3, 4, 2, '#f59ab3'); p.rect(X, Y + T - 3, T, 3, '#a8703f');
        break;
      }
      floor(); p.rect(X, Y + 1, T, 13, '#c98d58'); p.rect(X, Y + 2, T, 10, '#fff4f0');
      for (let i = 0; i < T; i += 4) p.rect(X + i, Y + 2, 2, 10, '#f8d4d8');
      p.rect(X, Y + 12, T, 2, '#9a6038');
      break;
    case 'h':
      floor(); p.rect(X + 3, Y + 1, 10, 4, '#a86a3e'); p.rect(X + 3, Y + 6, 10, 6, '#c8844a'); p.rect(X + 4, Y + 7, 8, 4, '#f59ab3'); p.rect(X + 3, Y + 12, 2, 3, '#7a4a2a'); p.rect(X + 11, Y + 12, 2, 3, '#7a4a2a');
      break;
  }
}

/** Khách đứng ngoài quầy: bấm để xem muốn bánh gì; bán đúng bánh thì khách đó đi. Lượt khách mới mỗi 4 tiếng. */
const CUST = [{ gender: 'f' as const, hair: 5, hairColor: 2, skin: 1, shirt: 8, outfit: 1 }, { gender: 'm' as const, hair: 2, hairColor: 0, skin: 2, shirt: 10, outfit: 4 }, { gender: 'f' as const, hair: 1, hairColor: 3, skin: 0, shirt: 4, outfit: 14 }];
function BakeryCustomers({ date, last, s }: { date: string; last: { id: string; dishes: string[] } | null; s: number }) {
  const block = orderBlock(new Date().getHours()), key = `bk-gone:${date}:${block}`;
  const orders = bakeOrders(date, block);
  const [gone, setGone] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; } });
  const [ask, setAsk] = useState<number | null>(null);
  const seen = useRef(last?.id);
  useEffect(() => {
    if (!last || last.id === seen.current || !last.id.startsWith('sale:')) return;
    seen.current = last.id;
    const i = orders.findIndex((o, k) => !gone.includes(k) && o.want === last.dishes[0]);
    if (i < 0) return;
    const g = [...gone, i]; setGone(g); try { localStorage.setItem(key, JSON.stringify(g)); } catch { /* bỏ qua */ }
  }, [last?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{orders.map((o, i) => {
    if (gone.includes(i)) return null;
    const sp = characterSprite(CUST[i % 3], 'idle'), x = 2.5 + i * 4.2, k = s * 0.55;
    return <div key={i}>
      <img src={sp.url} alt="Khách" className="k-customer" onClick={() => setAsk(ask === i ? null : i)}
        style={{ left: x * T * s, top: (ROWS - 0.15) * T * s - sp.h * k, width: sp.w * k, height: sp.h * k, cursor: 'pointer', pointerEvents: 'auto', animationDelay: `${-i * 0.6}s` }} />
      {ask === i && <span className="k-ask" style={{ left: x * T * s, top: (ROWS - 0.15) * T * s - sp.h * k - 28 }}>{o.who}: cho mình {o.n} {item(o.want).icon} {item(o.want).name} nhé!</span>}
    </div>;
  })}</>;
}
