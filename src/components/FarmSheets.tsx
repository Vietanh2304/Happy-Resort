import type { FarmRow, InvRow } from '../lib/api';
import { content, item } from '../lib/content';
import { cropHours, growth, LEVELS, needsFert, needsWater, plotLevel, plotStage, ripeIn, waterPerLevel } from '../lib/game';
import { emojiSprite } from '../lib/pixel';
import { Sheet } from './Sheet';

/** Chọn hạt giống cho ô ruộng trống — rau củ và hoa (hạt giống miễn phí) */
export function SeedSheet({ inventory, onPick, onClose }: { inventory: InvRow[]; onPick: (cropId: string) => void; onClose: () => void }) {
  const seeds = (id: string) => inventory.find(r => r.item_id === `seed_${id}`)?.qty ?? 0;
  const groups = [
    { title: '🥕 Rau củ & trái cây', crops: content.garden.crops.filter(c => !c.flower) },
    { title: '🌷 Hoa', crops: content.garden.crops.filter(c => c.flower) },
  ];
  return (
    <Sheet title="🌱 Gieo hạt" onClose={onClose}>
      <p className="muted">Gieo tốn 1 hạt giống (mua ở cửa hàng, mục 🌱 Hạt giống). Cây lớn qua 3 cấp — mỗi cấp cần tưới đủ nước (mỗi lần cách nhau 1 tiếng), bón 1 lần phân và đủ thời gian. Trời thật mưa thì ruộng tự được tưới.</p>
      {groups.map(g => (
        <div key={g.title}>
          <h4 className="group-title">{g.title}</h4>
          <div className="bag-grid">
            {g.crops.map(c => (
              <button key={c.id} className="bag-item" disabled={!seeds(c.id)} onClick={() => onPick(c.id)}>
                <img src={emojiSprite(item(c.id).icon).url} className="px-img" alt="" />
                <small>{item(c.id).name}</small>
                <i>🌱 {seeds(c.id)} hạt · {c.days * 6}h</i>
              </button>
            ))}
          </div>
        </div>
      ))}
    </Sheet>
  );
}

/** Chăm một ô đang trồng: tưới, bón phân, thu hoạch, nhổ bỏ */
export function PlotSheet({ row, today, fertilizer, onWater, onFertilize, onHarvest, onClear, onClose }: {
  row: FarmRow;
  today: string;
  fertilizer: number;
  onWater: () => void;
  onFertilize: () => void;
  onHarvest: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const it = item(row.crop_id);
  const lv = plotLevel(row), w = waterPerLevel(row.crop_id);
  const ripe = plotStage(row) === 'ripe';
  const thirsty = needsWater(row, today);
  const hungry = needsFert(row);
  const g = growth(row);
  const wNow = Math.min(w, row.water_days - lv * w), fNow = (row.fert_n ?? 0) > lv;
  return (
    <Sheet title={`${it.icon} ${it.name}`} onClose={onClose}>
      <div className="grow-bar"><i style={{ width: `${Math.round(g * 100)}%` }} /></div>
      <p className="muted">
        {ripe ? '✨ Đủ 3 cấp rồi, thu hoạch thôi!' : <>🌿 Cấp {lv}/{LEVELS} → lên cấp {lv + 1} cần: 💧 tưới {wNow}/{w} · 🧪 bón phân {fNow ? '✓' : '0/1'} · ⏳ {ripeIn(row)} (cả cây {cropHours(row.crop_id)} tiếng)</>}
        {!ripe && !thirsty && wNow < w ? ' · Vừa tưới xong, 1 tiếng nữa tưới tiếp nhé.' : ''}
      </p>
      <div className="row wrap">
        {ripe && <button className="btn" onClick={onHarvest}>🧺 Thu hoạch</button>}
        {!ripe && <button className="btn" disabled={!thirsty} onClick={onWater}>💧 Tưới nước</button>}
        {!ripe && <button className="btn ghost" disabled={!hungry || fertilizer < 1} onClick={onFertilize}>🧪 Bón phân ({fertilizer})</button>}
        <button className="btn small ghost" onClick={onClear}>🗑️ Nhổ bỏ</button>
      </div>
      {hungry && fertilizer < 1 && <p className="muted small-note">Phân bón mua ở cửa hàng (mục Vườn & trại).</p>}
    </Sheet>
  );
}
