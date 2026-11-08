// Xưởng may: tự thiết kế quần áo (kiểu, màu, họa tiết, tay áo, độ dài), xem trước trên nhân vật của mình,
// may bằng len hoặc lụa (từ cừu, tằm ở trang trại), cất vào tủ để mặc lúc nào cũng được, hoặc bán lấy xu.
import { useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { notify } from '../lib/realtime';
import { DEFAULT_DESIGN, designPrice, FABRIC_NEED, GARMENTS, PALETTE, PATTERNS, type Design } from '../lib/ranch';
import { characterSprite } from '../lib/sprites';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

function Preview({ look, design, size = 4 }: { look: api.Profile['avatar']; design: Design | null; size?: number }) {
  const views = ['front', 'side', 'back'] as const;
  return (
    <div className="tailor-preview">
      {views.map(v => { const sp = characterSprite({ ...look, design }, 'idle', undefined, v); return <img key={v} src={sp.url} alt="" style={{ width: sp.w * size, height: sp.h * size }} />; })}
    </div>
  );
}
function Swatches({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return <div className="swatches">{PALETTE.map(c => <button key={c} className={value === c ? 'on' : ''} style={{ background: c }} onClick={() => onPick(c)} aria-label={c} />)}</div>;
}

export function TailorSheet({ me, partnerName, inventory, outfits, wearing, onWear, onClose }: {
  me: api.Profile; partnerName: string; inventory: api.InvRow[]; outfits: api.OutfitRow[]; wearing: Design | null | undefined;
  onWear: (d: Design | null) => Promise<void>; onClose: () => void;
}) {
  const [tab, setTab] = useState<'design' | 'closet'>('design');
  const [d, setD] = useState<Design>(DEFAULT_DESIGN);
  const [name, setName] = useState('');
  const set = (patch: Partial<Design>) => setD(v => ({ ...v, ...patch }));
  const have = (id: string) => inventory.find(r => r.item_id === id)?.qty ?? 0;
  const can = have(d.fabric) >= FABRIC_NEED;
  const skirtish = d.type === 'dress' || d.type === 'skirt' || d.type === 'gown';
  const mine = outfits.filter(o => o.user_id === me.id), theirs = outfits.filter(o => o.user_id !== me.id);

  const sew = async () => {
    try {
      const title = name.trim() || `${GARMENTS.find(g => g.id === d.type)?.name} ${PATTERNS.find(p => p.id === d.pattern)?.name.toLowerCase()}`;
      await api.outfitMake(title, d, [{ id: d.fabric, n: FABRIC_NEED }]);
      notify('outfits', 'inventory');
      toast(`✂️ May xong "${title}" — đã cất vào tủ đồ`);
      setName(''); setTab('closet');
    } catch (e) { toastError(e); }
  };
  const sell = async (o: api.OutfitRow) => {
    const price = designPrice(o.spec);
    if (!confirm(`Bán "${o.name}" lấy ${price} xu?`)) return;
    try { await api.outfitSell(o.id, price); notify('outfits', 'profiles'); toast(`💰 Bán "${o.name}" +${price} xu`); } catch (e) { toastError(e); }
  };
  const same = (a: Design | null | undefined, b: Design) => !!a && JSON.stringify(a) === JSON.stringify(b);

  return (
    <Sheet title="🧵 Xưởng may" onClose={onClose}>
      <div className="tabs">
        <button className={tab === 'design' ? 'active' : ''} onClick={() => setTab('design')}>✏️ Thiết kế</button>
        <button className={tab === 'closet' ? 'active' : ''} onClick={() => setTab('closet')}>🚪 Tủ đồ ({outfits.length})</button>
      </div>
      {tab === 'design' ? (
        <div className="tailor">
          <Preview look={me.avatar} design={d} />
          <p className="tl-label">Kiểu</p>
          <div className="chips left">{GARMENTS.map(g => <button key={g.id} className={`chip ${d.type === g.id ? 'active' : ''}`} onClick={() => set({ type: g.id })}>{g.icon} {g.name}</button>)}</div>
          <p className="tl-label">Màu chính</p><Swatches value={d.c1} onPick={c => set({ c1: c })} />
          <p className="tl-label">{skirtish && d.type !== 'dress' ? 'Màu váy' : d.type === 'dress' ? 'Màu phụ' : 'Màu quần'}</p><Swatches value={d.c2} onPick={c => set({ c2: c })} />
          <p className="tl-label">Họa tiết</p>
          <div className="chips left">{PATTERNS.map(p => <button key={p.id} className={`chip ${d.pattern === p.id ? 'active' : ''}`} onClick={() => set({ pattern: p.id })}>{p.name}</button>)}</div>
          <p className="tl-label">Viền, nơ, họa tiết</p><Swatches value={d.trim} onPick={c => set({ trim: c })} />
          <p className="tl-label">Tay áo</p>
          <div className="chips left">{([['none', 'Sát nách'], ['short', 'Ngắn'], ['puff', 'Bồng'], ['long', 'Dài']] as const).map(([v, t]) => <button key={v} className={`chip ${d.sleeve === v ? 'active' : ''}`} onClick={() => set({ sleeve: v })}>{t}</button>)}</div>
          <p className="tl-label">{skirtish ? 'Độ dài váy' : 'Quần'}</p>
          <div className="chips left">{([['short', skirtish ? 'Ngắn' : 'Quần short'], ['long', skirtish ? 'Dài' : 'Quần dài']] as const).map(([v, t]) => <button key={v} className={`chip ${d.length === v ? 'active' : ''}`} onClick={() => set({ length: v })}>{t}</button>)}</div>
          <p className="tl-label">Giày</p><Swatches value={d.shoes} onPick={c => set({ shoes: c })} />
          <p className="tl-label">Chất liệu</p>
          <div className="chips left">
            {(['yarn', 'silk'] as const).map(f => <button key={f} className={`chip ${d.fabric === f ? 'active' : ''}`} onClick={() => set({ fabric: f })}>{item(f).icon} {item(f).name} (có {have(f)})</button>)}
          </div>
          <input value={name} maxLength={30} onChange={e => setName(e.target.value)} placeholder="Đặt tên bộ đồ… (vd: Váy hẹn hò)" />
          <button className="btn" disabled={!can} onClick={() => void sew()}>✂️ May bộ này ({FABRIC_NEED} {item(d.fabric).name.toLowerCase()})</button>
          {!can && <p className="muted small-note">Chưa đủ vải: cừu cho lông → kéo thành 🧶 cuộn len; tằm cho kén → dệt thành 🧵 tấm lụa (ở nhà chế biến).</p>}
        </div>
      ) : (
        <div className="closet">
          {wearing && <button className="btn small ghost" onClick={() => void onWear(null)}>↩️ Cởi đồ tự may (mặc lại đồ cũ)</button>}
          {!outfits.length && <p className="muted">Tủ đồ còn trống — qua tab Thiết kế để may bộ đầu tiên nhé!</p>}
          {[['Đồ của bạn', mine], [`Đồ ${partnerName} may`, theirs]].map(([title, list]) => (list as api.OutfitRow[]).length > 0 && (
            <div key={title as string}>
              <p className="tl-label">{title as string}</p>
              <div className="closet-grid">
                {(list as api.OutfitRow[]).map(o => (
                  <div key={o.id} className={`closet-item ${same(wearing, o.spec) ? 'on' : ''}`}>
                    <Preview look={me.avatar} design={o.spec} size={2} />
                    <b>{o.name}</b>
                    <div className="row">
                      <button className="btn small" onClick={() => void onWear(o.spec)}>{same(wearing, o.spec) ? '✓ Đang mặc' : '👕 Mặc'}</button>
                      {o.user_id === me.id && <button className="btn small ghost" onClick={() => void sell(o)}>💰 {designPrice(o.spec)}</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}
