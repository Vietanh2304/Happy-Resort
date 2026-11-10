// Trang trại chăn nuôi: gà vịt (trứng), bò dê (sữa), cừu (len), tằm (kén → lụa), ong (mật).
// Cho ăn mỗi ngày, đủ giờ thì thu hoạch; mang vào nhà xưởng chế biến (sữa → phô mai, trứng → bánh, len → cuộn len…).
// Làm cùng nhau (người ấy đang ở trang trại) thì thành phẩm gấp đôi.
import { useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { sellPrice } from '../lib/game';
import { emojiSprite } from '../lib/pixel';
import { notify } from '../lib/realtime';
import { animalDef, animalResale, animalState, ANIMALS, FEED_PRICE, fishInfo, FISH_GROWN, FISH_SPAWN, GROUPS, isFish, MAX_KIND, homeIn, RANCH, RECIPES, waitText, type AnimalDef } from '../lib/ranch';
import { hiveSprite, ranchSignSprite, silkTraySprite } from '../lib/ranchArt';
import { toast, toastError } from '../lib/toast';
import type { Pt } from '../lib/world';
import { Sheet } from './Sheet';
import { Spr, Tag, useScale } from './Stage';
import { Wanderer } from './Wander';

const PEN_NAME: Record<AnimalDef['pen'], string> = { coop: '🐔 Chuồng gà vịt', barn: '🐄 Chuồng bò dê', meadow: '🐑 Đồng cỏ cừu', hut: '🐛 Nhà tằm', hive: '🐝 Tổ ong', stable: '🐴 Chuồng ngựa', pond: '🐟 Ao cá' };
const PEN_TAG: Partial<Record<AnimalDef['pen'], Pt>> = { coop: { x: 52, y: 40 }, barn: { x: 202, y: 24 }, meadow: { x: 57, y: 128 }, hut: { x: 168, y: 122 }, hive: { x: 220, y: 142 } };

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
      {(Object.keys(PEN_TAG) as AnimalDef['pen'][]).map(pen => <Tag key={pen} x={PEN_TAG[pen]!.x} y={PEN_TAG[pen]!.y} className="label">{PEN_NAME[pen]}</Tag>)}
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
        const b = RANCH.pens.hut, x = b.x0 + 9 + (i % 2) * 19, y = b.y0 + 10 + Math.floor(i / 2) * 12;
        return <div key={a.id}><Spr sprite={silkTraySprite(3)} x={x} y={y} title="🐛 Nong tằm" onClick={() => go({ x, y: y + 8 }, () => onAnimal(a.id))} />{badge(a) && <Tag x={x} y={y - 12} className="hint">{badge(a)}</Tag>}</div>;
      })}
      {byPen('hive').map((a, i) => {
        const b = RANCH.pens.hive, x = b.x0 + 12 + (i % 2) * 24, y = b.y0 + 14 + Math.floor(i / 2) * 14;
        return <div key={a.id}><Spr sprite={hiveSprite()} x={x} y={y} title="🐝 Tổ ong" onClick={() => go({ x, y: y + 8 }, () => onAnimal(a.id))} />{badge(a) && <Tag x={x} y={y - 18} className="hint">{badge(a)}</Tag>}</div>;
      })}
    </>
  );
}

/** Chọn thức ăn có sẵn trong túi cho con vật */
function feedFrom(def: AnimalDef, inv: api.InvRow[]) {
  return def.eats.find(id => inv.some(r => r.item_id === id && r.qty > 0)) ?? null;
}

export function AnimalSheet({ animal, inventory, onClose, onRide, riding, onDismount }: { animal: api.Animal; inventory: api.InvRow[]; onClose: () => void; onRide?: () => void; riding?: boolean; onDismount?: () => void }) {
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
    const pay = animalResale(animal);
    if (!confirm(`Bán ${def.name} này lấy ${pay} xu?${pay > def.price ? ' (nuôi lớn rồi nên được giá hơn lúc mua)' : ' (mới mua chưa đủ 1 ngày: hoàn lại đúng giá mua)'}`)) return;
    await api.ranchSell(animal.id, pay);
    notify('ranch', 'profiles'); toast(`💰 Đã bán ${def.name}`); onClose();
  });
  const left = st.nextAt - Date.now();
  if (isFish(def.kind)) {
    const f = fishInfo(animal);
    const spawn = () => run(async () => { await api.ranchSpawn(animal.id); notify('ranch'); toast(`🐣 Cá đẻ lứa mới — thêm 1 con giống trong ao!`); });
    const sellFish = () => run(async () => {
      if (!confirm(f.grown ? `Bán con cá đã lớn này lấy ${f.price} xu?` : `Cá chưa lớn (mới ăn ${f.feeds}/${FISH_GROWN} lần) — bán chỉ được ${f.price} xu. Vẫn bán?`)) return;
      await api.ranchSell(animal.id, f.price); notify('ranch', 'profiles'); toast(`💰 Bán cá được ${f.price} xu`); onClose();
    });
    return (
      <Sheet title={`${def.icon} ${animal.name || def.name.replace(' giống', '')}`} onClose={onClose}>
        <p className="muted">{f.grown ? '🐟 Cá đã lớn — đem bán được giá gấp 3!' : `🍽️ Đã ăn ${f.feeds}/${FISH_GROWN} lần — ăn đủ ${FISH_GROWN} lần là lớn.`} {st.hungry ? 'Đang đói.' : 'Vừa ăn xong, khoảng 20 tiếng sau cho ăn tiếp.'}</p>
        <p className="muted small-note">Cứ {FISH_SPAWN} lần cho ăn cá đẻ 1 lứa cá con · mỗi lần cho ăn cách nhau ~20 tiếng</p>
        <div className="row wrap">
          <button className="btn" disabled={!st.hungry} onClick={() => void feed()}>🍽️ Cho ăn{food ? ` (${item(food).icon})` : ` (mua cám ${FEED_PRICE} xu)`}</button>
          {f.canSpawn && <button className="btn" onClick={() => void spawn()}>🐣 Vớt cá con</button>}
          <button className={`btn ${f.grown ? '' : 'small ghost'}`} onClick={() => void sellFish()}>💰 Bán cá ({f.price} xu)</button>
        </div>
      </Sheet>
    );
  }
  return (
    <Sheet title={`${def.icon} ${animal.name || def.name}`} onClose={onClose}>
      {def.kind.startsWith('horse') && (riding ? <button className="btn" onClick={onDismount}>🏠 Xuống ngựa, đưa về chuồng</button> : onRide && <button className="btn" onClick={onRide}>🐎 Cưỡi ngựa dạo làng</button>)}
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

export function RanchShopSheet({ count, coins, onClose, kinds = {} }: { count: number; coins: number; onClose: () => void; kinds?: Record<string, number> }) {
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
          <button key={d.kind} className="bag-item" disabled={coins < d.price || (kinds[d.kind] ?? 0) >= (MAX_KIND[d.kind] ?? 99)} onClick={() => void buy(d)}>
            <img src={emojiSprite(d.icon).url} className="px-img" alt="" /><small>{d.name}</small><small>🪙 {d.price}</small>
            <small className="muted">{isFish(d.kind) ? `ăn ${FISH_GROWN} lần → bán ×3` : MAX_KIND[d.kind] ? `tối đa ${MAX_KIND[d.kind]} · đang có ${kinds[d.kind] ?? 0}` : `${item(d.product).icon} mỗi 5 phút`}</small>
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

/** Chuồng ngựa (bãi tập) + ao cá ở phần dưới trang trại; ngựa đang được cưỡi thì không có trong chuồng */
export function StableAndPond({ animals, riding, go, onAnimal, onPen }: { animals: api.Animal[]; riding: (string | null | undefined)[]; go: (to: Pt, then?: () => void) => void; onAnimal: (id: string) => void; onPen: (pen: 'stable' | 'pond') => void }) {
  const s = useScale();
  const badge = (a: api.Animal) => { const st = animalState(a); return st.ready ? '✨' : st.hungry ? '🍽️' : undefined; };
  const horses = animals.filter(a => animalDef(a.kind).pen === 'stable' && !riding.includes(a.id)), fish = animals.filter(a => animalDef(a.kind).pen === 'pond');
  const S = RANCH.pens.stable, P = RANCH.pens.pond;
  return (
    <>
      <Tag x={30} y={170} className="label" onClick={() => go({ x: 30, y: 230 }, () => onPen('stable'))}>🐴 Chuồng ngựa{horses.length ? ` · ${horses.length}` : ''}</Tag>
      <button className="hot" title="🐴 Chuồng ngựa" style={{ left: 8 * s, top: 178 * s, width: 40 * s, height: 42 * s }} onClick={e => { e.stopPropagation(); go({ x: 30, y: 230 }, () => onPen('stable')); }} />
      <Tag x={(P.x0 + P.x1) / 2} y={P.y0 - 22} className="label" onClick={() => go({ x: (P.x0 + P.x1) / 2, y: P.y1 + 12 }, () => onPen('pond'))}>🐟 Ao cá{fish.length ? ` · ${fish.length}` : ''}</Tag>
      {horses.map((a, i) => <Wanderer key={a.id} id={a.kind} home={{ x: S.x0 + 16 + (i % 3) * 16, y: S.y0 + 20 + Math.floor(i / 3) * 10 }} r={12} box={S} name={`${animalDef(a.kind).icon} ${a.name || animalDef(a.kind).name}`} badge={badge(a)} scale={0.62}
        onClick={at => go({ x: at.x, y: Math.min(256, at.y + 10) }, () => onAnimal(a.id))} />)}
      {fish.map((a, i) => <Wanderer key={a.id} id="fish" home={{ x: P.x0 + 12 + (i % 5) * 12, y: P.y0 + 10 + Math.floor(i / 5) * 6 }} r={8} box={P} scale={0.45} name={`${animalDef(a.kind).icon} ${animalDef(a.kind).name.replace(' giống', '')}`} badge={badge(a)}
        onClick={() => go({ x: (P.x0 + P.x1) / 2, y: P.y1 + 12 }, () => onAnimal(a.id))} />)}
    </>
  );
}

/** Bảng chăm cả chuồng ngựa / cả ao cá: xem từng con, cho ăn hết, thu hết */
export function PenSheet({ pen, animals, inventory, onAnimal, onShop, onClose }: { pen: 'stable' | 'pond'; animals: api.Animal[]; inventory: api.InvRow[]; onAnimal: (id: string) => void; onShop: () => void; onClose: () => void }) {
  const list = animals.filter(a => animalDef(a.kind).pen === pen);
  const [busy, setBusy] = useState(false);
  const run = async (f: () => Promise<unknown>) => { setBusy(true); try { await f(); } catch (e) { toastError(e); } setBusy(false); };
  const feedAll = () => run(async () => {
    let n = 0, inv = inventory.map(r => ({ ...r }));
    for (const a of list.filter(x => animalState(x).hungry)) {
      const def = animalDef(a.kind);
      let use = feedFrom(def, inv);
      if (!use) { await api.buyItem('feed', FEED_PRICE); use = 'feed'; inv.push({ ...inv[0], item_id: 'feed', qty: 1 }); }
      await api.craft([{ id: use, n: 1 }]);
      const r = inv.find(x => x.item_id === use); if (r) r.qty--;
      await api.ranchFeed(a.id); n++;
    }
    notify('ranch', 'inventory', 'profiles');
    toast(n ? `🍽️ Đã cho ${n} con ăn` : 'Con nào cũng no rồi 😊');
  });
  const collectAll = () => run(async () => {
    let n = 0;
    if (pen === 'pond') {
      for (const a of list) if (fishInfo(a).canSpawn) { await api.ranchSpawn(a.id).catch(() => {}); n++; }
      let sold = 0;
      for (const a of list) { const f = fishInfo(a); if (f.grown) { await api.ranchSell(a.id, f.price); sold += f.price; } }
      notify('ranch', 'profiles');
      return toast(n || sold ? `${n ? `🐣 Vớt ${n} lứa cá con. ` : ''}${sold ? `💰 Bán cá lớn được ${sold} xu` : ''}` : 'Chưa có cá lớn hay lứa mới — cho ăn đủ lần nhé');
    }
    for (const a of list.filter(x => animalState(x).ready)) { const d = animalDef(a.kind); if (await api.ranchCollect(a.id, d.product, d.n, d.hours)) n += d.n; }
    notify('ranch', 'inventory', 'collection');
    toast(n ? `✨ Thu được ${n} món` : 'Chưa có con nào thu được — cho ăn rồi đợi đủ giờ nhé');
  });
  return (
    <Sheet title={pen === 'stable' ? '🐴 Chuồng ngựa' : '🐟 Ao cá nước ngọt'} onClose={onClose}>
      {!list.length ? (
        <><p className="muted">{pen === 'stable' ? 'Chuồng chưa có ngựa.' : 'Ao chưa thả cá.'} Mua ở trang trại chăn nuôi, mục 🛒 Mua con giống.</p>
          <button className="btn" onClick={onShop}>🛒 Mua {pen === 'stable' ? 'ngựa' : 'cá giống'}</button></>
      ) : (
        <>
          <div className="row wrap">
            <button className="btn" disabled={busy} onClick={feedAll}>🍽️ Cho tất cả ăn</button>
            <button className="btn ghost" disabled={busy} onClick={collectAll}>✨ {pen === 'stable' ? 'Chải lông hết' : 'Vớt cá con + bán cá lớn'}</button>
          </div>
          <ul className="task-list">
            {list.map(a => { const st = animalState(a), d = st.def; return (
              <li key={a.id}><b>{d.icon} {a.name || d.name.replace(' giống', '')}</b>
                <small className="muted">{isFish(a.kind) ? `${fishInfo(a).grown ? '🐟 Lớn rồi' : `ăn ${fishInfo(a).feeds}/${FISH_GROWN}`}${fishInfo(a).canSpawn ? ' · 🐣 có lứa mới' : ''}${st.hungry ? ' · 🍽️ đói' : ''}` : st.ready ? `✨ ${d.verb} được rồi` : st.hungry ? '🍽️ Đang đói' : `⏳ ${waitText(st.nextAt - Date.now())} nữa`}</small>
                <button className="btn small ghost" onClick={() => onAnimal(a.id)}>Xem</button></li>
            ); })}
          </ul>
        </>
      )}
    </Sheet>
  );
}
