// Tiệm hoa, tiệm bánh, sổ bướm & chim
import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { BAKES, bakeOf, bakeOrders, flowerOrders, nextBlockIn, orderBlock, OVEN_SLOTS, ovenSlots, VISITORS } from '../lib/shops';
import { toast, toastError } from '../lib/toast';
import type { Live } from '../lib/useLive';
import { Sheet } from './Sheet';

const have = (inv: api.InvRow[], id: string) => inv.find(r => r.item_id === id)?.qty ?? 0;
const label = (id: string, n: number) => `${item(id).icon} ${item(id).name} ×${n}`;

const PAPERS = [{ id: 'pink', c: '#f8c0d0', name: 'Giấy hồng' }, { id: 'cream', c: '#f6ead0', name: 'Giấy kem' }, { id: 'kraft', c: '#c8a070', name: 'Giấy kraft' }, { id: 'blue', c: '#c0d8f0', name: 'Giấy xanh' }];
const RIBBONS = ['#e8304a', '#f6c64e', '#ffffff', '#b07ae0'];
const left = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} tiếng ${min % 60} phút` : `${min} phút`);

/** Bó hoa đang cắm: hoa xòe hình quạt trên giấy gói, buộc nơ */
function Bouquet({ stems, paper, ribbon }: { stems: string[]; paper: string; ribbon: string }) {
  const n = stems.length;
  return (
    <div className="bouquet">
      {stems.map((id, i) => { const a = n > 1 ? -50 + (100 * i) / (n - 1) : 0, r = 44 - (i % 2) * 10; return (
        <span key={i} className="stem" style={{ transform: `rotate(${a}deg)`, height: r }}><b style={{ transform: `rotate(${-a}deg)` }}>{item(id).icon}</b></span>
      ); })}
      <i className="paper" style={{ borderTopColor: paper }} /><i className="ribbon" style={{ background: ribbon }} />
    </div>
  );
}

/** Tiệm hoa: khách mới mỗi 4 tiếng; chọn đơn → cắm hoa vào giỏ (bấm hoa để thêm, bấm cành để bớt) → chọn giấy gói, nơ → giao cho khách */
export function FlowerShopSheet({ date, hour, minute, inventory, claimed, live, onClose }: { date: string; hour: number; minute: number; inventory: api.InvRow[]; claimed: string[]; live: Live; onClose: () => void }) {
  const block = orderBlock(hour), orders = flowerOrders(date, block);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [stems, setStems] = useState<string[]>([]);
  const [paper, setPaper] = useState(PAPERS[0].c);
  const [ribbon, setRibbon] = useState(RIBBONS[0]);
  const flowers = ['rose_bloom', 'tulip_bloom', 'lavender', 'daisy_bloom', 'sunflower_bloom', 'sakura_bloom'];
  const cnt = (id: string) => stems.filter(x => x === id).length;
  const o = sel === null ? null : orders[sel];
  const match = !!o && o.want.every(([id, n]) => cnt(id) === n) && stems.length === o.want.reduce((s, [, n]) => s + n, 0);
  const keyOf = (i: number) => `flower:${date}:${block}:${i}`;
  const deliver = async () => {
    if (!o || sel === null) return;
    setBusy(true);
    try {
      await api.craft(o.want.map(([id, n]) => ({ id, n })));
      if (await api.grantCoins(keyOf(sel), o.reward)) { live.say(`💐 ${o.who}: “${o.line}”`); toast(`💝 Giao bó hoa ${o.occasion} cho ${o.who} · +${o.reward} xu`); }
      notify('inventory', 'profiles', 'claims'); setSel(null); setStems([]);
    } catch (e) { toastError(e); }
    setBusy(false);
  };
  if (o && sel !== null) return (
    <Sheet title={`💐 Cắm bó hoa · ${o.occasion}`} onClose={onClose}>
      <p className="muted">{o.icon} {o.who} muốn: <b>{o.want.map(([id, n]) => `${item(id).icon} ${item(id).name} ×${n}`).join(' + ')}</b> · bấm hoa để cắm vào giỏ, bấm cành trong giỏ để rút ra</p>
      <div className="arrange">
        <div className="basket" onClick={() => setStems(s => s.slice(0, -1))} title="Bấm để rút cành vừa cắm">
          <Bouquet stems={stems} paper={paper} ribbon={ribbon} />
          {!stems.length && <span className="muted small-note">Giỏ đang trống</span>}
        </div>
        <div className="row wrap">
          {flowers.map(id => { const h = have(inventory, id) - cnt(id); return (
            <button key={id} className="bag-item" disabled={h < 1 || stems.length >= 8} onClick={() => setStems(s => [...s, id])}>
              <span style={{ fontSize: 22 }}>{item(id).icon}</span><small>{item(id).name}</small><i>còn {h}</i>
            </button>
          ); })}
        </div>
        <div className="row wrap">
          {PAPERS.map(pp => <button key={pp.id} className={`chip ${paper === pp.c ? 'on' : ''}`} onClick={() => setPaper(pp.c)}><i className="swatch" style={{ background: pp.c }} /> {pp.name}</button>)}
          {RIBBONS.map(c => <button key={c} className={`chip ${ribbon === c ? 'on' : ''}`} onClick={() => setRibbon(c)}><i className="swatch" style={{ background: c }} /> Nơ</button>)}
        </div>
      </div>
      <div className="row wrap">
        <button className="btn" disabled={busy || !match} onClick={deliver}>{match ? `💝 Giao cho khách · +${o.reward} xu` : '🌷 Cắm đúng số hoa khách muốn đã nhé'}</button>
        <button className="btn ghost" onClick={() => { setSel(null); setStems([]); }}>← Đơn khác</button>
      </div>
    </Sheet>
  );
  return (
    <Sheet title="🌸 Tiệm hoa của Hy" onClose={onClose}>
      <p className="muted">Hoa tự trồng ở nông trại đem cắm thành bó. Cứ 4 tiếng lại có 3 khách mới (lượt sau: {left(nextBlockIn(hour, minute))}). Khách trả gấp 3 tiền hoa.</p>
      <ul className="task-list">
        {orders.map((ord, i) => {
          const done = claimed.includes(keyOf(i));
          const ok = ord.want.every(([id, n]) => have(inventory, id) >= n);
          return (
            <li key={i} className={done ? 'done' : ''}>
              <b>{ord.icon} {ord.who} · {ord.occasion}</b>
              <small className="muted">Muốn: {ord.want.map(([id, n]) => `${label(id, n)} (có ${have(inventory, id)})`).join(' + ')}</small>
              {done ? <span>✅ Đã giao — khách cảm ơn rối rít 💕</span>
                : <button className="btn small" disabled={!ok} onClick={() => { setSel(i); setStems([]); }}>{ok ? '💐 Ra bàn cắm hoa' : '🌱 Chưa đủ hoa'}</button>}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/** Tiệm bánh: lò nướng 2 ngăn chạy theo giờ thật; bánh chín thì lấy ra, giao cho khách đặt */
export function BakerySheet({ me, date, hour, minute, inventory, claimed, live, onClose }: { me: api.Profile; date: string; hour: number; minute: number; inventory: api.InvRow[]; claimed: string[]; live: Live; onClose: () => void }) {
  const block = orderBlock(hour);
  const [prep, setPrep] = useState<{ id: string; mix: number } | null>(null);
  const [keys, setKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const reload = () => api.loadOven(me.id).then(setKeys, console.error);
  useEffect(() => { reload(); const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const slots = ovenSlots(keys);
  const orders = bakeOrders(date, block);
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
    if (await api.grantCoins(`bakery:${date}:${block}:${i}`, o.reward)) { live.say(`🍰 ${o.who}: “${o.line}”`); toast(`🍰 Bán cho ${o.who} · +${o.reward} xu`); }
  });
  const MIX = 8;
  if (prep) return (
    <Sheet title={`🥣 Làm ${item(prep.id).name}`} onClose={onClose}>
      <p className="muted">Nguyên liệu: {bakeOf(prep.id).take.map(([i, n]) => label(i, n)).join(' + ')}. Bấm vào thau để nhào bột, đủ thì cho vào lò.</p>
      <button className={`mix-bowl ${prep.mix % 2 ? 'b' : 'a'}`} disabled={prep.mix >= MIX} onClick={() => setPrep(p => p && { ...p, mix: p.mix + 1 })}>
        <span>🥣</span><b>{prep.mix >= MIX ? '✨ Bột mịn rồi!' : `Nhào bột ${prep.mix}/${MIX}`}</b>
      </button>
      <div className="grow-bar"><i style={{ width: `${(prep.mix / MIX) * 100}%` }} /></div>
      <div className="row wrap">
        <button className="btn" disabled={busy || prep.mix < MIX || slots.length >= OVEN_SLOTS} onClick={async () => { await bake(prep.id); setPrep(null); }}>🔥 Cho vào lò ({bakeOf(prep.id).hours} tiếng)</button>
        <button className="btn ghost" onClick={() => setPrep(null)}>← Quay lại</button>
      </div>
    </Sheet>
  );
  return (
    <Sheet title="🍰 Tiệm bánh nhỏ" onClose={onClose}>
      <p className="muted small-note">Cứ 4 tiếng lại có khách mới đứng chờ ngoài cửa (lượt sau: {left(nextBlockIn(hour, minute))}).</p>
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
            <button className="btn small" disabled={busy || !ok || slots.length >= OVEN_SLOTS} onClick={() => setPrep({ id: b.id, mix: 0 })}>🥣 Làm</button></li>;
        })}
      </ul>
      <h4 className="group-title">🛎️ Khách đặt bánh hôm nay</h4>
      <ul className="task-list">
        {orders.map((o, i) => {
          const done = claimed.includes(`bakery:${date}:${block}:${i}`), ok = have(inventory, o.want) >= o.n;
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
