import * as api from '../lib/api';
import { content, item } from '../lib/content';
import { canCook } from '../lib/game';
import { emojiSprite } from '../lib/pixel';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

/** Bếp trong villa: cá + rau + đồ nhặt được → món ăn (mang đi hẹn hò hoặc tặng nhau) */
export function KitchenSheet({ inventory, onClose, onCookTogether }: { inventory: api.InvRow[]; onClose: () => void; onCookTogether: () => void }) {
  const have = (id: string) => inventory.find(r => r.item_id === id)?.qty ?? 0;

  async function cook(recipeId: string, needs: { id: string; n: number }[]) {
    try {
      await api.craft(needs, [{ id: recipeId, n: 1 }]);
      toast(`🍳 Nấu xong ${item(recipeId).icon} ${item(recipeId).name}!`);
      notify('inventory', 'collection');
    } catch (e) {
      toastError(e);
    }
  }

  return (
    <Sheet title="🍳 Bếp nhỏ trong villa" onClose={onClose}>
      <button className="btn" onClick={onCookTogether}>👩‍🍳 Nấu ăn cùng nhau (mini game hai người)</button>
      <p className="muted">Món nấu xong có thể mang tới Nhà hàng hẹn hò, hoặc gửi tặng người ấy.</p>
      <ul className="recipes">
        {content.recipes.map(r => {
          const ok = canCook(r.needs, inventory);
          const dish = item(r.id);
          return (
            <li key={r.id} className={ok ? 'ready' : ''}>
              <img src={emojiSprite(dish.icon).url} className="px-img dish" alt="" />
              <div>
                <b>{dish.name}</b>
                <span className="needs">
                  {r.needs.map(n => (
                    <span key={n.id} className={have(n.id) >= n.n ? 'ok' : 'missing'} title={item(n.id).name}>
                      {item(n.id).icon}{n.n > 1 && `×${n.n}`} <small>{have(n.id)}/{n.n}</small>
                    </span>
                  ))}
                </span>
              </div>
              <button className="btn small" disabled={!ok} onClick={() => cook(r.id, r.needs)}>Nấu</button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
