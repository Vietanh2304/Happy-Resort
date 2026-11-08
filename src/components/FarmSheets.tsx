import type { FarmRow } from '../lib/api';
import { content, item } from '../lib/content';
import { cropDays, cropHours, growth, needsWater, plotStage, ripeIn } from '../lib/game';
import { emojiSprite } from '../lib/pixel';
import { Sheet } from './Sheet';

/** Chọn hạt giống cho ô ruộng trống — rau củ và hoa (hạt giống miễn phí) */
export function SeedSheet({ onPick, onClose }: { onPick: (cropId: string) => void; onClose: () => void }) {
  const groups = [
    { title: '🥕 Rau củ & trái cây', crops: content.garden.crops.filter(c => !c.flower) },
    { title: '🌷 Hoa', crops: content.garden.crops.filter(c => c.flower) },
  ];
  return (
    <Sheet title="🌱 Gieo hạt" onClose={onClose}>
      <p className="muted">Mỗi ngày tưới một lần (ai trong hai bạn tưới cũng được), đủ số ngày là thu hoạch. Bón phân thì được gấp đôi. Trời thật mưa thì ruộng tự được tưới.</p>
      {groups.map(g => (
        <div key={g.title}>
          <h4 className="group-title">{g.title}</h4>
          <div className="bag-grid">
            {g.crops.map(c => (
              <button key={c.id} className="bag-item" onClick={() => onPick(c.id)}>
                <img src={emojiSprite(item(c.id).icon).url} className="px-img" alt="" />
                <small>{item(c.id).name}</small>
                <i>{c.days} ngày</i>
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
  const need = cropDays(row.crop_id);
  const ripe = plotStage(row) === 'ripe';
  const thirsty = needsWater(row, today);
  const g = growth(row);
  return (
    <Sheet title={`${it.icon} ${it.name}`} onClose={onClose}>
      <div className="grow-bar"><i style={{ width: `${Math.round(g * 100)}%` }} /></div>
      <p className="muted">
        {ripe ? '✨ Đã chín, thu hoạch thôi!' : row.water_days === 0 ? `Tưới nước để hạt nảy mầm (chín sau ${cropHours(row.crop_id)} tiếng).` : `Đã tưới ${row.water_days}/${need} lần · chín ${ripeIn(row)}.`}
        {row.fertilized ? ' 🧪 Đã bón phân — thu hoạch gấp đôi.' : ''}
        {!ripe && !thirsty && row.water_days < need ? ' Hôm nay tưới rồi, mai tưới thêm lần nữa nhé.' : ''}
      </p>
      <div className="row wrap">
        {ripe && <button className="btn" onClick={onHarvest}>🧺 Thu hoạch</button>}
        {!ripe && <button className="btn" disabled={!thirsty} onClick={onWater}>💧 Tưới nước</button>}
        {!ripe && !row.fertilized && (
          <button className="btn ghost" disabled={fertilizer < 1} onClick={onFertilize}>🧪 Bón phân ({fertilizer})</button>
        )}
        <button className="btn small ghost" onClick={onClear}>🗑️ Nhổ bỏ</button>
      </div>
      {!row.fertilized && fertilizer < 1 && !ripe && <p className="muted small-note">Phân bón mua ở cửa hàng (mục Vườn & trại).</p>}
    </Sheet>
  );
}
