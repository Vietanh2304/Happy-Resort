import { useState } from 'react';
import * as api from '../lib/api';
import { item, type Item } from '../lib/content';
import { emojiSprite } from '../lib/pixel';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

const GROUPS: [Item['kind'], string][] = [
  ['decor', 'Đồ trang trí'], ['fish', 'Cá'], ['crop', 'Nông sản'], ['dish', 'Món ăn'], ['trinket', 'Đồ sưu tầm'],
];

/** Túi đồ: xem mọi thứ đang có, chọn một món để tặng người ấy */
export function BagSheet({ inventory, partner, onClose }: { inventory: api.InvRow[]; partner: api.Profile | null; onClose: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function give() {
    if (!picked) return;
    setBusy(true);
    try {
      await api.sendGift(picked, note);
      toast(`🎁 Đã gửi ${item(picked).icon} ${item(picked).name} qua cầu cho ${partner?.display_name || 'người ấy'}`);
      notify('inventory', 'notes');
      setPicked(null);
      setNote('');
    } catch (e) {
      toastError(e);
    }
    setBusy(false);
  }

  return (
    <Sheet title="🎒 Túi đồ" onClose={onClose}>
      {inventory.length === 0 && <p className="muted">Túi trống. Đi dạo nhặt đồ, câu cá hay trồng rau nhé!</p>}
      {GROUPS.map(([kind, label]) => {
        const rows = inventory.filter(r => item(r.item_id).kind === kind);
        if (!rows.length) return null;
        return (
          <div key={kind} className="bag-group">
            <h3 className="section-title">{label}</h3>
            <div className="bag-grid">
              {rows.map(r => {
                const it = item(r.item_id);
                return (
                  <button key={r.item_id} className={`bag-item ${picked === r.item_id ? 'active' : ''}`} onClick={() => setPicked(p => p === r.item_id ? null : r.item_id)} title={it.name}>
                    <img src={emojiSprite(it.icon).url} className="px-img" alt="" />
                    <small>{it.name}</small>
                    <i>×{r.qty}</i>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {picked && (
        <div className="gift-box stack">
          <b>Tặng {item(picked).icon} {item(picked).name} cho {partner?.display_name || 'người ấy'}?</b>
          <input value={note} maxLength={120} onChange={e => setNote(e.target.value)} placeholder="Kèm lời nhắn (không bắt buộc)" />
          <button className="btn" disabled={busy || !partner} onClick={give}>{partner ? 'Gửi qua cầu 🎁' : 'Người ấy chưa vào resort'}</button>
        </div>
      )}
    </Sheet>
  );
}
