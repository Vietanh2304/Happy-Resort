import type { InvRow } from '../lib/api';
import { item } from '../lib/content';
import { ART, placeOf } from '../lib/furniture';
import type { DecorEditor } from '../lib/useDecorEditor';

interface Props {
  island: string;
  inventory: InvRow[];
  editor: DecorEditor;
  onDone: () => void;
}

/** Khay trang trí: chọn món → bóng xem trước (xanh đặt được / đỏ vướng) → xoay → đặt */
export function DecorTray({ island, inventory, editor, onDone }: Props) {
  const { selection, ghost } = editor;
  const fits = (id: string) => {
    const p = placeOf(id);
    return island === 'garden' || island === 'farm' ? p === 'garden' || p === 'any' || p === 'hang' : p !== 'garden';
  };
  const decorItems = inventory.filter(r => item(r.item_id).kind === 'decor' && r.qty > 0 && fits(r.item_id));
  const name = ghost ? item(ghost.itemId).name : selection?.kind === 'item' ? item(selection.itemId).name : '';

  const hint = !selection
    ? (island === 'farm' ? 'Chọn món để bày lên nông trại, hoặc chạm vào đồ đã bày để dời / xoay / cất.'
      : island === 'garden' ? 'Chọn món để trang trí vườn hoa, hoặc chạm vào đồ đã bày để dời / xoay / cất.'
        : 'Chọn món để bày (đồ treo thì đặt lên tường), hoặc chạm vào đồ đã bày để dời / xoay / cất.')
    : !ghost ? `Chạm vào chỗ muốn đặt ${name} (máy tính: rê chuột để xem trước).`
      : ghost.why ? `❌ ${ghost.why}` : `✅ Đặt được ở đây — bấm "Đặt" (hoặc chạm lại ô xanh). Kéo để dời.`;

  return (
    <div className="tray">
      <p className={`tray-hint ${ghost ? (ghost.why ? 'bad' : 'ok') : ''}`}>{hint}</p>
      {selection && (
        <div className="tray-actions">
          <b className="tray-name">{name}</b>
          <button className="btn small ghost" onClick={editor.rotate}>🔄 Xoay</button>
          <button className="btn small" disabled={!ghost || !!ghost.why} onClick={() => void editor.commit()}>✅ Đặt</button>
          {selection.kind === 'decor' && <button className="btn small ghost" onClick={() => void editor.store()}>📦 Cất vào túi</button>}
          <button className="btn small ghost" onClick={editor.cancel}>✖ Bỏ chọn</button>
        </div>
      )}
      <div className="tray-row">
        <div className="tray-items">
          {decorItems.length === 0 && <span className="muted">Chưa có món hợp chỗ này — ghé cửa hàng nhé.</span>}
          {decorItems.map(r => {
            const it = item(r.item_id);
            const active = selection?.kind === 'item' && selection.itemId === r.item_id;
            return (
              <button key={r.item_id} className={`tray-item ${active ? 'active' : ''}`} onClick={() => editor.selectItem(r.item_id)} title={it.name}>
                {ART[r.item_id] ? <img src={ART[r.item_id].sprite().url} className="px-img tray-art" alt="" /> : <span>{it.icon}</span>}<small>×{r.qty}</small>
              </button>
            );
          })}
        </div>
        <button className="btn small" onClick={onDone}>Xong</button>
      </div>
    </div>
  );
}
