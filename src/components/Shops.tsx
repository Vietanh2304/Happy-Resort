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
export function Bouquet({ stems, paper, ribbon }: { stems: string[]; paper: string; ribbon: string }) {
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
  const [doneView, setDoneView] = useState(false);
  // chỗ cắm trong lẵng: hàng sau cao, hàng trước thấp, xòe hình vòm
  const SLOTS = [[50, 18], [34, 24], [66, 24], [20, 36], [80, 36], [42, 40], [58, 40], [50, 52]];
  if (o && sel !== null) return (
    <Sheet title={`💐 Cắm hoa · ${o.occasion}`} onClose={onClose}>
      <p className="muted small-note">{o.icon} {o.who} muốn: <b>{o.want.map(([id, n]) => `${item(id).icon} ${item(id).name} ×${n}`).join(' + ')}</b></p>
      {!doneView ? (
        <>
          <div className="fp-table">
            <div className="fp-basket" onClick={() => setStems(s => s.slice(0, -1))} title="Bấm vào lẵng để rút cành vừa cắm">
              {stems.map((id, i) => <span key={i} className="fp-flower" style={{ left: `${SLOTS[i][0]}%`, top: `${SLOTS[i][1]}%`, zIndex: 10 + i }}>{item(id).icon}</span>)}
              <i className="fp-weave" />
              {!stems.length && <em className="fp-hint">Lẵng trống — bấm hoa bên dưới để cắm vào</em>}
            </div>
          </div>
          <div className="fp-buckets">
            {flowers.map(id => { const h = have(inventory, id) - cnt(id); return (
              <button key={id} className="fp-bucket" disabled={h < 1 || stems.length >= SLOTS.length} onClick={() => setStems(s => [...s, id])}>
                <span>{item(id).icon}{item(id).icon}{item(id).icon}</span><i />
                <small>{item(id).name} · {h}</small>
              </button>
            ); })}
          </div>
          <div className="row wrap">
            <button className="btn" disabled={!match} onClick={() => setDoneView(true)}>{match ? '✨ Cắm xong, gói lại' : `🌷 Cắm đủ hoa khách muốn (${stems.length}/${o.want.reduce((s, [, n]) => s + n, 0)})`}</button>
            <button className="btn ghost" onClick={() => setStems([])}>↺ Cắm lại</button>
            <button className="btn ghost" onClick={() => { setSel(null); setStems([]); }}>← Đơn khác</button>
          </div>
        </>
      ) : (
        <>
          <div className="fp-final">
            <div className="fp-sparkle">✨</div>
            <div className="fp-bunch">
              {stems.map((id, i) => <span key={i} style={{ left: `${SLOTS[i][0]}%`, top: `${SLOTS[i][1] * 0.8}%` }}>{item(id).icon}</span>)}
              <i className="fp-wrap" style={{ borderTopColor: paper }} /><i className="fp-bow" style={{ background: ribbon }} />
            </div>
            <b>Bó hoa {o.occasion} cho {o.who}</b>
          </div>
          <div className="row wrap">
            {PAPERS.map(pp => <button key={pp.id} className={`chip ${paper === pp.c ? 'on' : ''}`} onClick={() => setPaper(pp.c)}><i className="swatch" style={{ background: pp.c }} /> {pp.name}</button>)}
            {RIBBONS.map(c => <button key={c} className={`chip ${ribbon === c ? 'on' : ''}`} onClick={() => setRibbon(c)}><i className="swatch" style={{ background: c }} /> Nơ</button>)}
          </div>
          <div className="row wrap">
            <button className="btn" disabled={busy} onClick={async () => { await deliver(); setDoneView(false); }}>💝 Giao cho khách · +{o.reward} xu</button>
            <button className="btn ghost" onClick={() => setDoneView(false)}>← Cắm lại</button>
          </div>
        </>
      )}
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

/** Đồ đang cầm trên tay ở tiệm bánh: nguyên liệu → bột → (lò) → bánh nướng → trang trí */
export type BakeHold = { s: 'ing' | 'dough' | 'baked'; id: string; start?: number } | null;
export type BakeStation = 'fridge' | 'prep' | 'oven' | 'deco' | 'case';
export const holdIcon = (h: BakeHold) => (!h ? null : h.s === 'ing' ? '🧺' : h.s === 'dough' ? '🥣' : item(h.id).icon);
const CREAMS = [{ id: 'vanilla', c: '#fff6e0', name: 'Kem tươi' }, { id: 'choco', c: '#7a4a2a', name: 'Sô-cô-la' }, { id: 'berry', c: '#f8b8cc', name: 'Kem dâu' }, { id: 'matcha', c: '#b8d890', name: 'Trà xanh' }];
const FRUITS = ['🍓', '🫐', '🍒', '🍑', '🍊', '🥝'];

/** Mỗi trạm trong tiệm bánh: tủ nguyên liệu → bàn nhào → lò nướng → bàn trang trí → tủ bánh (bán cho khách chờ ngoài cửa) */
export function BakeryStationSheet({ station, hold, setHold, me, date, hour, minute, inventory, claimed, live, onClose }: {
  station: BakeStation; hold: BakeHold; setHold: (h: BakeHold) => void; me: api.Profile; date: string; hour: number; minute: number; inventory: api.InvRow[]; claimed: string[]; live: Live; onClose: () => void;
}) {
  const block = orderBlock(hour);
  const [keys, setKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [mix, setMix] = useState(0);
  const [cream, setCream] = useState<string | null>(null);
  const [fruits, setFruits] = useState<string[]>([]);
  const reload = () => api.loadOven(me.id).then(setKeys, console.error);
  useEffect(() => { reload(); const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const slots = ovenSlots(keys);
  const orders = bakeOrders(date, block);
  const run = async (f: () => Promise<unknown>) => { setBusy(true); try { await f(); notify('inventory', 'profiles', 'claims'); await reload(); } catch (e) { toastError(e); } setBusy(false); };
  const MIX = 8;
  const title = { fridge: '🧊 Tủ nguyên liệu', prep: '🥣 Bàn nhào bột', oven: '🔥 Lò nướng', deco: '🍓 Bàn trang trí', case: '🧁 Tủ bánh · khách đặt' }[station];
  const holding = hold && <p className="hold-note">🤲 Đang cầm: <b>{hold.s === 'ing' ? `nguyên liệu ${item(hold.id).name}` : hold.s === 'dough' ? `bột ${item(hold.id).name}` : `${item(hold.id).icon} ${item(hold.id).name} vừa nướng`}</b></p>;
  let body: React.ReactNode = null;
  if (station === 'fridge') body = hold ? <p className="muted">Tay đang bận rồi — làm xong món đang cầm đã nhé.</p> : (
    <ul className="recipe-list">
      {BAKES.map(b => { const ok = b.take.every(([i, n]) => have(inventory, i) >= n); return (
        <li key={b.id} className="row wrap"><b>{item(b.id).icon} {item(b.id).name} ×{b.n}</b>
          <small className="muted">{b.take.map(([i, n]) => `${label(i, n)} (có ${have(inventory, i)})`).join(' + ')} · nướng {b.hours} tiếng</small>
          <button className="btn small" disabled={busy || !ok} onClick={() => run(async () => { await api.craft(b.take.map(([i, n]) => ({ id: i, n }))); setHold({ s: 'ing', id: b.id }); toast('🧺 Lấy nguyên liệu rồi — mang ra bàn nhào bột'); onClose(); })}>🧺 Lấy nguyên liệu</button></li>
      ); })}
    </ul>
  );
  if (station === 'prep') body = hold?.s !== 'ing' ? <p className="muted">Lấy nguyên liệu ở 🧊 tủ trước rồi mang ra đây nhào bột nhé.</p> : (
    <>
      <button className={`mix-bowl ${mix % 2 ? 'b' : 'a'}`} disabled={mix >= MIX} onClick={() => setMix(m => m + 1)}><span>🥣</span><b>{mix >= MIX ? '✨ Bột mịn rồi!' : `Nhào bột ${mix}/${MIX}`}</b></button>
      <div className="grow-bar"><i style={{ width: `${(mix / MIX) * 100}%` }} /></div>
      <button className="btn" disabled={mix < MIX} onClick={() => { setHold({ s: 'dough', id: hold.id }); toast('🥣 Bột xong — mang ra 🔥 lò nướng'); onClose(); }}>👐 Bưng bột ra lò</button>
    </>
  );
  if (station === 'oven') body = (
    <>
      {hold?.s === 'dough' && <button className="btn" disabled={busy || slots.length >= OVEN_SLOTS} onClick={() => run(async () => { await api.claim(`oven:${Date.now()}:${hold.id}`); setHold(null); toast(`🔥 Cho ${item(hold.id).name} vào lò — ${bakeOf(hold.id).hours} tiếng nữa chín`); })}>🔥 Cho bột vào lò ({bakeOf(hold.id).hours} tiếng)</button>}
      <ul className="task-list">
        {slots.map(sl => { const b = bakeOf(sl.id), ready = now >= sl.start + b.hours * 3.6e6, mins = Math.max(0, sl.start + b.hours * 3.6e6 - now) / 6e4; return (
          <li key={sl.key}><b>{item(sl.id).icon} {item(sl.id).name}</b>
            {ready ? <button className="btn small" disabled={busy || !!hold} onClick={() => { setHold({ s: 'baked', id: sl.id, start: sl.start }); live.say('🧤 Thơm phức!'); toast('🧤 Bánh chín rồi — mang ra 🍓 bàn trang trí'); onClose(); }}>🧤 Lấy ra</button>
              : <span className="muted">⏳ còn {mins >= 60 ? `${Math.ceil(mins / 60)} tiếng` : `${Math.ceil(mins)} phút`}</span>}</li>
        ); })}
        {!slots.length && hold?.s !== 'dough' && <li className="muted">Lò đang trống ({OVEN_SLOTS} ngăn).</li>}
      </ul>
    </>
  );
  if (station === 'deco') body = hold?.s !== 'baked' ? <p className="muted">Lấy bánh chín ở 🔥 lò rồi mang ra đây thêm kem, thêm quả nhé.</p> : (
    <>
      <div className="cake-stage">
        <span className="cake-base">{item(hold.id).icon}</span>
        {cream && <i className="cake-cream" style={{ background: CREAMS.find(c => c.id === cream)!.c }} />}
        {fruits.map((f, i) => <span key={i} className="cake-fruit" style={{ left: `${30 + (i % 4) * 13}%`, top: `${18 + Math.floor(i / 4) * 10}%` }}>{f}</span>)}
      </div>
      <div className="row wrap">{CREAMS.map(c => <button key={c.id} className={`chip ${cream === c.id ? 'on' : ''}`} onClick={() => setCream(c.id)}><i className="swatch" style={{ background: c.c }} /> {c.name}</button>)}</div>
      <div className="row wrap">{FRUITS.map(f => <button key={f} className="chip" disabled={fruits.length >= 8} onClick={() => setFruits(x => [...x, f])}>{f}</button>)}<button className="chip" onClick={() => setFruits([])}>↺</button></div>
      <button className="btn" disabled={busy || !cream} onClick={() => run(async () => {
        const b = bakeOf(hold.id);
        if (await api.claim(`ovenout:${hold.start}`, [{ id: hold.id, n: b.n }])) { live.say(`${item(hold.id).icon}✨ Xinh quá!`); toast(`🎂 Trang trí xong ${b.n} ${item(hold.id).name} — đã cất vào túi, ra 🧁 tủ bánh bán cho khách nhé`); }
        setHold(null); onClose();
      })}>{cream ? '✨ Xong, bày ra đĩa' : '🍦 Chọn kem trước đã'}</button>
    </>
  );
  if (station === 'case') body = (
    <>
      <p className="muted small-note">Khách mới mỗi 4 tiếng, đứng chờ ngoài cửa (lượt sau: {left(nextBlockIn(hour, minute))}).</p>
      <ul className="task-list">
        {orders.map((o, i) => { const k = `bakery:${date}:${block}:${i}`, done = claimed.includes(k), ok = have(inventory, o.want) >= o.n; return (
          <li key={i} className={done ? 'done' : ''}><b>{o.who}</b><small className="muted">Muốn {label(o.want, o.n)} (có {have(inventory, o.want)})</small>
            {done ? <span>✅ Đã bán</span> : <button className="btn small" disabled={busy || !ok} onClick={() => run(async () => { await api.craft([{ id: o.want, n: o.n }]); if (await api.grantCoins(k, o.reward)) { live.say(`🍰 ${o.who}: “${o.line}”`); toast(`🍰 Bán cho ${o.who} · +${o.reward} xu`); } })}>{ok ? `Giao · +${o.reward} xu` : 'Chưa có bánh'}</button>}</li>
        ); })}
      </ul>
    </>
  );
  return <Sheet title={title} onClose={onClose}>{holding}{body}</Sheet>;
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
