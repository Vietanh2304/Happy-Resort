import { useState } from 'react';
import type { Profile, Wish } from '../lib/api';
import { content, itemSeason } from '../lib/content';
import { emojiSprite } from '../lib/pixel';
import { Sheet } from './Sheet';

type Tab = 'items' | 'fish' | 'food' | 'animals' | 'combos';
interface Entry { key: string; icon: string; name: string; note?: string }

const ENTRIES: Record<Tab, Entry[]> = {
  items: content.items.filter(i => i.kind === 'decor' || i.kind === 'trinket').map(i => ({
    key: `item:${i.id}`, icon: i.icon, name: i.name,
    note: i.rarity === 'rare' ? 'hiếm' : itemSeason(i.id) ? `${itemSeason(i.id)!.icon} theo mùa` : undefined,
  })),
  fish: content.items.filter(i => i.kind === 'fish').map(i => ({ key: `item:${i.id}`, icon: i.icon, name: i.name })),
  food: content.items.filter(i => i.kind === 'crop' || i.kind === 'dish').map(i => ({
    key: `item:${i.id}`, icon: i.icon, name: i.name, note: i.kind === 'dish' ? 'món ăn' : 'nông sản',
  })),
  animals: content.animals.map(a => ({
    key: `animal:${a.id}`, icon: a.icon, name: a.name,
    note: a.island ? content.islands.find(i => i.id === a.island)?.name : undefined,
  })),
  combos: content.combos.map(c => ({ key: `combo:${c.id}`, icon: c.icon, name: c.name, note: c.desc })),
};
const TABS: [Tab, string][] = [['items', 'Đồ vật'], ['fish', 'Cá'], ['food', 'Bếp & vườn'], ['animals', 'Khách'], ['combos', 'Hiện tượng']];
const TOTAL = Object.values(ENTRIES).reduce((s, l) => s + l.length, 0);

interface Props {
  me: Profile;
  partner: Profile | null;
  owned: Set<string>;
  wishes: Wish[];
  onClose: () => void;
}

export function CollectionSheet({ me, partner, owned, wishes, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('items');
  const percent = Math.round((Object.values(ENTRIES).flat().filter(e => owned.has(e.key)).length / TOTAL) * 100);

  return (
    <Sheet title="📖 Sổ tay sưu tập" onClose={onClose}>
      <div className="progress"><div style={{ width: `${percent}%` }} /><span>{percent}% hoàn thành</span></div>
      <div className="tabs">
        {TABS.map(([id, label]) => {
          const n = ENTRIES[id].filter(e => owned.has(e.key)).length;
          return (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label} <small>{n}/{ENTRIES[id].length}</small>
            </button>
          );
        })}
      </div>
      <ul className="collection">
        {ENTRIES[tab].map(e => {
          const has = owned.has(e.key);
          return (
            <li key={e.key} className={has ? '' : 'missing'} title={has ? e.note : undefined}>
              <img className="entry-icon px-img" src={emojiSprite(e.icon).url} alt="" />
              <b>{has ? e.name : '???'}</b>
              {has && e.note && <small>{e.note}</small>}
            </li>
          );
        })}
      </ul>
      {tab === 'combos' && (
        <>
          <h3 className="section-title">🌠 Những điều ước</h3>
          {wishes.length === 0 && <p className="muted">Khi cả hai cùng chạm sao băng, hãy ước một điều.</p>}
          <ul className="wishes">
            {wishes.map(w => (
              <li key={w.id}>
                “{w.body}” <small>— {w.user_id === me.id ? 'bạn' : partner?.display_name || 'người ấy'}, {new Date(w.created_at).toLocaleDateString('vi-VN')}</small>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}
