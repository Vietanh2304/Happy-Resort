// Tiệm hoa, tiệm bánh, sổ bướm & chim
import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { BAKES, bakeOf, bakeOrders, flowerOrders, OVEN_SLOTS, ovenSlots, VISITORS } from '../lib/shops';
import { toast, toastError } from '../lib/toast';
import type { Live } from '../lib/useLive';
import { Sheet } from './Sheet';

const have = (inv: api.InvRow[], id: string) => inv.find(r => r.item_id === id)?.qty ?? 0;
const label = (id: string, n: number) => `${item(id).icon} ${item(id).name} ×${n}`;

/** Tiệm hoa: 3 khách mỗi ngày, mỗi người muốn một bó theo dịp — đủ hoa thì cắm & giao */
export function FlowerShopSheet({ date, inventory, claimed, live, onClose }: { date: string; inventory: api.InvRow[]; claimed: string[]; live: Live; onClose: () => void }) {
  const orders = flowerOrders(date);
  const [busy, setBusy] = useState(false);
  const deliver = async (i: number) => {
    const o = orders[i];
    setBusy(true);
    try {
      await api.craft(o.want.map(([id, n]) => ({ id, n })));
      if (await api.grantCoins(`flower:${date}:${i}`, o.reward)) {
        live.say(`💐 ${o.who}: “${o.line}”`);
        toast(`💐 Giao bó hoa ${o.occasion} cho ${o.who} · +${o.reward} xu`);
      }
      notify('inventory', 'profiles', 'claims');
    } catch (e) { toastError(e); }
    setBusy(false);
  };
  return (
    <Sheet title="🌸 Tiệm hoa của Hy" onClose={onClose}>
      <p className="muted">Hoa tự trồng ở nông trại đem cắm thành bó theo ý khách. Mỗi ngày 3 khách mới, trả gấp 3 tiền hoa.</p>
      <ul className="task-list">
        {orders.map((o, i) => {
          const done = claimed.includes(`flower:${date}:${i}`);
          const ok = o.want.every(([id, n]) => have(inventory, id) >= n);
          return (
            <li key={i} className={done ? 'done' : ''}>
              <b>{o.icon} {o.who} · {o.occasion}</b>
              <small className="muted">Muốn: {o.want.map(([id, n]) => `${label(id, n)} (có ${have(inventory, id)})`).join(' + ')}</small>
              {done ? <span>✅ Đã giao — khách cảm ơn rối rít 💕</span>
                : <button className="btn small" disabled={busy || !ok} onClick={() => deliver(i)}>{ok ? `💐 Cắm & giao · +${o.reward} xu` : '🌱 Chưa đủ hoa'}</button>}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/** Tiệm bánh: lò nướng 2 ngăn chạy theo giờ thật; bánh chín thì lấy ra, giao cho khách đặt */
export function BakerySheet({ me, date, inventory, claimed, live, onClose }: { me: api.Profile; date: string; inventory: api.InvRow[]; claimed: string[]; live: Live; onClose: () => void }) {
  const [keys, setKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const reload = () => api.loadOven(me.id).then(setKeys, console.error);
  useEffect(() => { reload(); const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const slots = ovenSlots(keys);
  const orders = bakeOrders(date);
  const run = async (f: () => Promise<unknown>) => { setBusy(true); try { await f(); notify('inventory', 'profiles', 'claims'); await reload(); } catch (e) { toastError(e); } setBusy(false); };
  const bake = (id: string) => run(async () => {
    const b = bakeOf(id);
    await api.craft(b.take.map(([i, n]) => ({ id: i, n })));
    await api.claim(`oven:${Date.now()}:${id}`);
    toast(`🔥 Cho ${item(id).name} vào lò — ${b.hours} tiếng nữa chín`);
  });
  const takeOut = (start: number, id: string) => run(async () => {
    if (await api.claim(`ovenout:${start}`, [{ id, n: bakeOf(id).n }])) { live.say(`${item(id).icon} Thơm phức!`); toast(`🧁 Lấy ${bakeOf(id).n} ${item(id).name} ra khỏi lò`); }
  });
  const sell = (i: number) => run(async () => {
    const o = orders[i];
    await api.craft([{ id: o.want, n: o.n }]);
    if (await api.grantCoins(`bakery:${date}:${i}`, o.reward)) { live.say(`🍰 ${o.who}: “${o.line}”`); toast(`🍰 Bán cho ${o.who} · +${o.reward} xu`); }
  });
  return (
    <Sheet title="🍰 Tiệm bánh nhỏ" onClose={onClose}>
      <h4 className="group-title">🔥 Lò nướng ({slots.length}/{OVEN_SLOTS})</h4>
      {slots.length === 0 && <p className="muted small-note">Lò đang trống — chọn bánh bên dưới để nướng.</p>}
      <ul className="task-list">
        {slots.map(sl => {
          const b = bakeOf(sl.id), ready = now >= sl.start + b.hours * 3.6e6, left = Math.max(0, sl.start + b.hours * 3.6e6 - now) / 6e4;
          return <li key={sl.key}><b>{item(sl.id).icon} {item(sl.id).name}</b>
            {ready ? <button className="btn small" disabled={busy} onClick={() => takeOut(sl.start, sl.id)}>🧤 Lấy bánh ra ({b.n})</button>
              : <span className="muted">⏳ còn {left >= 60 ? `${Math.ceil(left / 60)} tiếng` : `${Math.ceil(left)} phút`}</span>}</li>;
        })}
      </ul>
      <h4 className="group-title">📖 Công thức (nguyên liệu từ trang trại)</h4>
      <ul className="recipe-list">
        {BAKES.map(b => {
          const ok = b.take.every(([i, n]) => have(inventory, i) >= n);
          return <li key={b.id} className="row wrap"><b>{item(b.id).icon} {item(b.id).name} ×{b.n}</b>
            <small className="muted">{b.take.map(([i, n]) => label(i, n)).join(' + ')} · {b.hours} tiếng</small>
            <button className="btn small" disabled={busy || !ok || slots.length >= OVEN_SLOTS} onClick={() => bake(b.id)}>Nướng</button></li>;
        })}
      </ul>
      <h4 className="group-title">🛎️ Khách đặt bánh hôm nay</h4>
      <ul className="task-list">
        {orders.map((o, i) => {
          const done = claimed.includes(`bakery:${date}:${i}`), ok = have(inventory, o.want) >= o.n;
          return <li key={i} className={done ? 'done' : ''}><b>{o.who}</b><small className="muted">Muốn {label(o.want, o.n)} (có {have(inventory, o.want)})</small>
            {done ? <span>✅ Đã bán</span> : <button className="btn small" disabled={busy || !ok} onClick={() => sell(i)}>{ok ? `Giao · +${o.reward} xu` : 'Chưa có bánh'}</button>}</li>;
        })}
      </ul>
    </Sheet>
  );
}

/** Sổ bướm & chim: chụp đủ bộ thì nhận quà */
export function BugBookSheet({ me, onClose }: { me: api.Profile; onClose: () => void }) {
  const [got, setGot] = useState<Set<string>>(new Set());
  useEffect(() => { api.loadCollection(me.id).then(setGot, console.error); }, [me.id]);
  const n = VISITORS.filter(v => got.has(`bug:${v.id}`)).length;
  const claimSet = async () => {
    try { if (await api.grantCoins('bugset:all', 800)) { toast('🏆 Đủ bộ bướm & chim! +800 xu'); notify('profiles'); } else toast('Đã nhận quà đủ bộ rồi 💕'); } catch (e) { toastError(e); }
  };
  return (
    <Sheet title="🦋 Sổ bướm & chim" onClose={onClose}>
      <p className="muted">Trồng hoa ở nông trại để bướm, chim ghé — bấm vào để chụp ảnh. Hoa hồng, tulip, oải hương, cúc, hướng dương, anh đào mỗi loại hút một khách; trồng ≥ 3 loài hoa thì đôi khi có bướm hiếm.</p>
      <p><b>{n}/{VISITORS.length}</b> loài đã chụp</p>
      <ul className="task-list">
        {VISITORS.map(v => <li key={v.id} className={got.has(`bug:${v.id}`) ? 'done' : ''}>{got.has(`bug:${v.id}`) ? `📸 ${v.bird ? '🐦' : '🦋'} ${v.name}` : `❔ ??? — thích ${v.rare ? 'vườn nhiều loài hoa' : item(v.flower).name}`}</li>)}
      </ul>
      <button className="btn" disabled={n < VISITORS.length} onClick={claimSet}>🏆 Nhận quà đủ bộ (+800 xu)</button>
    </Sheet>
  );
}
