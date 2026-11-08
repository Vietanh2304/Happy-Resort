// Trang trại chăn nuôi: gà vịt (trứng), bò dê (sữa), cừu (len), tằm (kén → lụa), ong (mật).
// Cho ăn mỗi ngày, đủ giờ thì thu hoạch; mang vào nhà xưởng chế biến (sữa → phô mai, trứng → bánh, len → cuộn len…).
// Làm cùng nhau (người ấy đang ở trang trại) thì thành phẩm gấp đôi.
import { useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { sellPrice } from '../lib/game';
import { emojiSprite } from '../lib/pixel';
import { notify } from '../lib/realtime';
import { animalDef, animalState, ANIMALS, FEED_PRICE, GROUPS, homeIn, RANCH, RECIPES, waitText, type AnimalDef } from '../lib/ranch';
import { hiveSprite, ranchSignSprite, silkTraySprite } from '../lib/ranchArt';
import { toast, toastError } from '../lib/toast';
import type { Pt } from '../lib/world';
import { Sheet } from './Sheet';
import { Spr, Tag, useScale } from './Stage';
import { Wanderer } from './Wander';

const PEN_NAME: Record<AnimalDef['pen'], string> = { coop: '🐔 Chuồng gà vịt', barn: '🐄 Chuồng bò dê', meadow: '🐑 Đồng cỏ cừu', hut: '🐛 Nhà tằm', hive: '🐝 Tổ ong' };
const PEN_TAG: Record<AnimalDef['pen'], Pt> = { coop: { x: 52, y: 40 }, barn: { x: 202, y: 24 }, meadow: { x: 57, y: 128 }, hut: { x: 168, y: 122 }, hive: { x: 220, y: 142 } };

export function RanchContent({ animals, go, onAnimal, onShop, onWorkshop, onTailor }: {
  animals: api.Animal[]; go: (to: Pt, then?: () => void) => void; onAnimal: (id: string) => void; onShop: () => void; onWorkshop: () => void; onTailor: () => void;
}) {
  const byPen = (pen: AnimalDef['pen']) => animals.filter(a => animalDef(a.kind).pen === pen);
  const badge = (a: api.Animal) => { const st = animalState(a); return st.ready ? '✨' : st.hungry ? '🍽️' : undefined; };
  const w = RANCH.workshop;
  const s = useScale();
  const hotStyle = (x: number, y: number, ww: number, h: number) => ({ left: x * s, top: y * s, width: ww * s, height: h * s });
  return (
    <>
      {(Object.keys(PEN_TAG) as AnimalDef['pen'][]).map(pen => <Tag key={pen} x={PEN_TAG[pen].x} y={PEN_TAG[pen].y} className="label">{PEN_NAME[pen]}</Tag>)}
      <Tag x={w.x - 15} y={w.y - 44} className="label" onClick={() => go(w.door, onWorkshop)}>🧀 Chế biến</Tag>
      <Tag x={w.x + 15} y={w.y - 44} className="label" onClick={() => go(w.tailor, onTailor)}>🧵 Xưởng may</Tag>
      <button className="hot" title="Nhà chế biến" style={hotStyle(w.x - 30, w.y - 30, 30, 30)} onClick={e => { e.stopPropagation(); go(w.door, onWorkshop); }} />
      <button className="hot" title="Xưởng may" style={hotStyle(w.x, w.y - 30, 30, 30)} onClick={e => { e.stopPropagation(); go(w.tailor, onTailor); }} />
      <Spr sprite={ranchSignSprite()} x={RANCH.shop.x} y={RANCH.shop.y} title="🛒 Mua con giống, cám" onClick={() => go(RANCH.shop.stand, onShop)} />
      <Tag x={RANCH.shop.x} y={RANCH.shop.y - 20} className="label" onClick={() => go(RANCH.shop.stand, onShop)}>🛒 Mua con giống</Tag>

      {(['coop', 'barn', 'meadow'] as const).map(pen => byPen(pen).map((a, i) => {
        const home = homeIn(pen, i);
        return <Wanderer key={a.id} id={a.kind} home={home} r={10} box={RANCH.pens[pen]} name={`${animalDef(a.kind).icon} ${a.name || animalDef(a.kind).name}`} badge={badge(a)}
          onClick={at => go({ x: at.x, y: at.y + 8 }, () => onAnimal(a.id))} />;
      }))}
      {byPen('hut').map((a, i) => {
        const b = RANCH.pens.hut, x = b.x0 + 10 + (i % 2) * 16, y = b.y0 + 10 + Math.floor(i / 2) * 8;
        return <div key={a.id}><Spr sprite={silkTraySprite(3)} x={x} y={y} title="🐛 Nong tằm" onClick={() => go({ x, y: y + 8 }, () => onAnimal(a.id))} />{badge(a) && <Tag x={x} y={y - 12} className="hint">{badge(a)}</Tag>}</div>;
      })}
      {byPen('hive').map((a, i) => {
        const b = RANCH.pens.hive, x = b.x0 + 8 + (i % 3) * 16, y = b.y0 + 14 + Math.floor(i / 3) * 14;
        return <div key={a.id}><Spr sprite={hiveSprite()} x={x} y={y} title="🐝 Tổ ong" onClick={() => go({ x, y: y + 8 }, () => onAnimal(a.id))} />{badge(a) && <Tag x={x} y={y - 18} className="hint">{badge(a)}</Tag>}</div>;
      })}
    </>
  );
}

/** Chọn thức ăn có sẵn trong túi cho con vật */
function feedFrom(def: AnimalDef, inv: api.InvRow[]) {
  return def.eats.find(id => inv.some(r => r.item_id === id && r.qty > 0)) ?? null;
}

export function AnimalSheet({ animal, inventory, onClose }: { animal: api.Animal; inventory: api.InvRow[]; onClose: () => void }) {
  const st = animalState(animal);
  const def = st.def;
  const food = feedFrom(def, inventory);
  const run = async (f: () => Promise<unknown>) => { try { await f(); } catch (e) { toastError(e); } };
  const feed = () => run(async () => {
    if (!food) { await api.buyItem('feed', FEED_PRICE); notify('inventory', 'profiles'); toast(`🌾 Mua 1 bao cám (${FEED_PRICE} xu)`); }
    const use = food ?? 'feed';
    await api.craft([{ id: use, n: 1 }]);
    await api.ranchFeed(animal.id);
    notify('ranch', 'inventory');
    toast(`${def.icon} Măm măm… đã cho ăn ${item(use).icon} ${item(use).name}`);
  });
  const collect = () => run(async () => {
    const ok = await api.ranchCollect(animal.id, def.product, def.n, def.hours);
    if (!ok) return toast('Chưa thu được — cần cho ăn và đợi đủ giờ nhé');
    notify('ranch', 'inventory', 'collection');
    toast(`${item(def.product).icon} ${def.verb}: +${def.n} ${item(def.product).name}!`);
    onClose();
  });
  const sell = () => run(async () => {
    if (!confirm(`Bán ${def.name} này lấy ${Math.round(def.price * 0.6)} xu?`)) return;
    await api.ranchSell(animal.id, Math.round(def.price * 0.6));
    notify('ranch', 'profiles'); toast(`💰 Đã bán ${def.name}`); onClose();
  });
  const left = st.nextAt - Date.now();
  return (
    <Sheet title={`${def.icon} ${animal.name || def.name}`} onClose={onClose}>
      <p className="muted">
        {st.hungry ? '🍽️ Đang đói — cho ăn để có sản phẩm.' : '😊 No bụng rồi.'}{' '}
        {st.ready ? `✨ ${def.verb} được rồi!` : st.fed ? `Đợi ${waitText(left)} nữa để ${def.verb.toLowerCase()}.` : ''}
      </p>
      <p className="muted small-note">Mỗi {def.hours} tiếng cho {def.n} {item(def.product).icon} {item(def.product).name} · ăn: {def.eats.map(id => item(id).icon).join(' ')}</p>
      <div className="row wrap">
        <button className="btn" disabled={!st.hungry && st.fed} onClick={() => void feed()}>🍽️ Cho ăn{food ? ` (${item(food).icon})` : ` (mua cám ${FEED_PRICE} xu)`}</button>
        <button className="btn" disabled={!st.ready} onClick={() => void collect()}>✨ {def.verb}</button>
        <button className="btn small ghost" onClick={() => void sell()}>💰 Bán</button>
      </div>
    </Sheet>
  );
}

export function RanchShopSheet({ count, coins, onClose }: { count: number; coins: number; onClose: () => void }) {
  const buy = async (d: AnimalDef) => {
    try { await api.ranchBuy(d.kind, d.price); notify('ranch', 'profiles'); toast(`${d.icon} Chào mừng ${d.name} về trang trại!`); }
    catch (e) { toastError(e); }
  };
  const buyFeed = async () => {
    try { for (let i = 0; i < 5; i++) await api.buyItem('feed', FEED_PRICE); notify('inventory', 'profiles'); toast(`🌾 Mua 5 bao cám (${FEED_PRICE * 5} xu)`); }
    catch (e) { toastError(e); }
  };
  return (
    <Sheet title="🛒 Mua con giống" onClose={onClose}>
      <p className="muted small-note">Hũ xu: 🪙 {coins} · trang trại đang có {count}/24 con</p>
      <div className="bag-grid">
        {ANIMALS.map(d => (
          <button key={d.kind} className="bag-item" disabled={coins < d.price} onClick={() => void buy(d)}>
            <img src={emojiSprite(d.icon).url} className="px-img" alt="" /><small>{d.name}</small><small>🪙 {d.price}</small>
            <small className="muted">{item(d.product).icon} mỗi {d.hours}h</small>
          </button>
        ))}
      </div>
      <button className="btn small ghost" disabled={coins < FEED_PRICE * 5} onClick={() => void buyFeed()}>🌾 Mua 5 bao cám ({FEED_PRICE * 5} xu)</button>
    </Sheet>
  );
}

export function WorkshopSheet({ inventory, together, partnerName, onClose }: { inventory: api.InvRow[]; together: boolean; partnerName: string; onClose: () => void }) {
  const [g, setG] = useState(GROUPS[0].id);
  const have = (id: string) => inventory.find(r => r.item_id === id)?.qty ?? 0;
  const make = async (rid: string) => {
    const r = RECIPES.find(x => x.id === rid)!;
    const n = r.n * (together ? 2 : 1);
    try {
      await api.craft(r.take, [{ id: r.give, n }]);
      notify('inventory', 'collection');
      toast(`${item(r.give).icon} Làm xong ${n} ${item(r.give).name}${together ? ' — làm cùng nhau nên gấp đôi 💞' : ''}`);
    } catch (e) { toastError(e); }
  };
  return (
    <Sheet title="🧀 Nhà chế biến" onClose={onClose}>
      <p className="muted small-note">{together ? `💞 Đang làm cùng ${partnerName}: mọi món ra gấp đôi!` : `Rủ ${partnerName} ra trang trại làm cùng thì được gấp đôi thành phẩm.`}</p>
      <div className="tabs scroll">{GROUPS.map(x => <button key={x.id} className={g === x.id ? 'active' : ''} onClick={() => setG(x.id)}>{x.name}</button>)}</div>
      <ul className="recipe-list">
        {RECIPES.filter(r => r.group === g).map(r => {
          const ok = r.take.every(t => have(t.id) >= t.n);
          return (
            <li key={r.id}>
              <span className="r-out">{item(r.give).icon} <b>{item(r.give).name}</b> ×{r.n * (together ? 2 : 1)}</span>
              <span className="r-in">{r.take.map(t => <span key={t.id} className={have(t.id) >= t.n ? '' : 'lack'}>{item(t.id).icon}{have(t.id)}/{t.n}</span>)}</span>
              <span className="muted small-note">bán 🪙{sellPrice(r.give)}</span>
              <button className="btn small" disabled={!ok} onClick={() => void make(r.id)}>Làm</button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
