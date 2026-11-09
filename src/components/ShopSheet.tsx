import { useState } from 'react';
import * as api from '../lib/api';
import { content, item } from '../lib/content';
import { ART } from '../lib/furniture';
import { sellPrice } from '../lib/game';
import { emojiSprite } from '../lib/pixel';
import { HOLIDAY_SEASONS, HOLIDAY_SHOP, seasonOpen } from '../lib/holiday';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

const CATS = [
  { id: 'furniture', label: '🛋️ Nội thất' },
  { id: 'seed', label: '🌱 Hạt giống' },
  { id: 'appliance', label: '📺 Gia dụng' },
  { id: 'decor', label: '🎀 Trang trí' },
  { id: 'garden', label: '🌷 Vườn & trại' },
  { id: 'pet', label: '🐾 Thú cưng' },
  { id: 'holiday', label: '🎊 Đồ lễ theo mùa' },
] as const;
const WHERE: Record<string, string> = { seed: 'ra nông trại gieo hạt nhé', furniture: 'vào nhà gỗ để bày nhé', appliance: 'vào nhà gỗ để lắp nhé', decor: 'bấm Trang trí để bày nhé', garden: 'ra vườn hoặc nông trại để đặt nhé', pet: 'bé cưng sẽ mừng lắm đó', holiday: 'bấm Trang trí để bày cho ngày lễ nhé' };

const art = (id: string) => (ART[id] ? ART[id].sprite().url : emojiSprite(item(id).icon).url);

/** Cửa hàng của mèo: mua nội thất, đồ gia dụng, đồ trang trí, đồ vườn bằng hũ xu chung; bán đồ lấy xu */
export function ShopSheet({ coins, inventory, onClose }: { coins: number; inventory: api.InvRow[]; onClose: () => void }) {
  const [tab, setTab] = useState<string>('seed');
  const [n, setN] = useState(1);
  const [busy, setBusy] = useState(false);
  const sellable = inventory.filter(r => item(r.item_id).kind !== 'decor' && r.qty > 0);

  async function act(f: () => Promise<unknown>, msg: string) {
    setBusy(true);
    try {
      await f();
      toast(msg);
      notify('inventory', 'collection', 'profiles');
    } catch (e) {
      toastError(e);
    }
    setBusy(false);
  }

  return (
    <Sheet title="🐱 Cửa hàng Mèo" onClose={onClose}>
      <p className="coins-big">🪙 {coins} xu <small className="muted">· hũ chung của hai bạn</small></p>
      <div className="row qty-row">
        <span>Số lượng:</span>
        <button className="btn small ghost" onClick={() => setN(v => Math.max(1, v - 1))}>−</button>
        <b>{n}</b>
        <button className="btn small ghost" onClick={() => setN(v => Math.min(99, v + 1))}>+</button>
        {[1, 5, 10].map(k => <button key={k} className={`chip ${n === k ? 'on' : ''}`} onClick={() => setN(k)}>×{k}</button>)}
      </div>
      <div className="tabs scroll">
        {CATS.map(c => <button key={c.id} className={tab === c.id ? 'active' : ''} onClick={() => setTab(c.id)}>{c.label}</button>)}
        <button className={tab === 'sell' ? 'active' : ''} onClick={() => setTab('sell')}>🧺 Bán đồ</button>
      </div>

      {tab === 'holiday' ? (
        <HolidayShop coins={coins} busy={busy} inventory={inventory} onBuy={(id, price) => act(() => api.buyItems(id, price, n), `🛍️ Đã mua ${item(id).icon} ${item(id).name} — ${WHERE.holiday}`)} />
      ) : tab !== 'sell' ? (
        <div className="bag-grid shop-grid">
          {content.shop.filter(x => (x.cat ?? 'decor') === tab).map(x => {
            const it = item(x.id);
            const have = inventory.find(r => r.item_id === x.id)?.qty ?? 0;
            return (
              <button key={x.id} className="bag-item" disabled={busy || coins < x.price * n}
                onClick={() => act(() => api.buyItems(x.id, x.price, n), `🛍️ Đã mua ${n} ${it.icon} ${it.name} (−${x.price * n} xu) — ${WHERE[tab]}`)}>
                <img src={art(x.id)} className="px-img shop-art" alt="" />
                <small>{it.name}</small>
                <i>🪙 {x.price}{n > 1 ? ` ×${n}` : ''}{have ? ` · có ${have}` : ''}</i>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          {sellable.length === 0 && <p className="muted">Chưa có gì để bán. Đi câu cá, trồng trọt, chơi trò chơi hay nhặt đồ ở bãi biển nhé!</p>}
          <div className="bag-grid">
            {sellable.map(r => {
              const it = item(r.item_id);
              const price = sellPrice(r.item_id), k = Math.min(n, r.qty);
              return (
                <button key={r.item_id} className="bag-item" disabled={busy}
                  onClick={() => act(() => api.sellItem(r.item_id, k, price), `🪙 +${price * k} xu từ ${k} ${it.icon} ${it.name}`)}>
                  <img src={emojiSprite(it.icon).url} className="px-img" alt="" />
                  <small>{it.name} ×{r.qty}</small>
                  <i>bán {k > 1 ? `${k} × ` : ''}🪙 {price}</i>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}

/** Đồ lễ: mỗi mùa một quầy, chỉ mở bán quanh ngày lễ (mùa đang mở hiện lên đầu) */
function HolidayShop({ coins, busy, inventory, onBuy }: { coins: number; busy: boolean; inventory: api.InvRow[]; onBuy: (id: string, price: number) => void }) {
  const now = new Date(), m = now.getMonth() + 1, d = now.getDate();
  const seasons = [...HOLIDAY_SEASONS].sort((a, b) => Number(seasonOpen(b.id, m, d)) - Number(seasonOpen(a.id, m, d)));
  return (
    <>
      {seasons.map(se => {
        const open = seasonOpen(se.id, m, d);
        return (
          <div key={se.id} className={`holiday-stall ${open ? 'open' : 'closed'}`}>
            <h4>{se.name} <small>{open ? '· đang mở bán' : `· mở bán từ ${se.from[1]}/${se.from[0]}`}</small></h4>
            <div className="bag-grid shop-grid">
              {HOLIDAY_SHOP.filter(x => x.season === se.id).map(x => {
                const have = inventory.find(r => r.item_id === x.id)?.qty ?? 0;
                return (
                  <button key={x.id} className="bag-item" disabled={!open || busy || coins < x.price} onClick={() => onBuy(x.id, x.price)}>
                    <img src={art(x.id)} className="px-img shop-art" alt="" />
                    <small>{x.name}</small>
                    <i>{open ? `🪙 ${x.price}` : '🔒'}{have ? ` · có ${have}` : ''}</i>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
