import { useRef, useState } from 'react';
import * as api from './api';
import { cellsOf, occupant, whyNot } from './placement';
import { notify } from './realtime';
import { toast, toastError } from './toast';

export type Selection = { kind: 'item'; itemId: string } | { kind: 'decor'; id: string } | null;

/** Bóng xem trước: món đang cầm, chỗ định đặt, các ô nó chiếm, đặt được hay không */
export interface Ghost { itemId: string; x: number; y: number; rot: number; cells: [number, number][]; why: string | null; movingId?: string }

export interface EditCtx { island: string | null; decor: api.Decor[]; blocked?: (x: number, y: number) => boolean }

/**
 * Trang trí kiểu "cầm – xem trước – đặt":
 * - chọn món trong túi (hoặc chạm/nhấn giữ món đã bày) → bóng mờ hiện theo chuột / chỗ chạm;
 * - ô xanh = đặt được, ô đỏ = vướng; kéo thả bằng chuột hay ngón tay đều được;
 * - nút 🔄 xoay, ✅ đặt; chạm lại đúng chỗ bóng đang đứng (ô xanh) cũng là đặt.
 */
export function useDecorEditor(inventory: api.InvRow[], ctx: EditCtx) {
  const [selection, setSelection] = useState<Selection>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [rot, setRot] = useState(0);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean; at?: { x: number; y: number } } | null>(null);
  const busy = useRef(false);

  const { island, decor, blocked } = ctx;
  const moving = selection?.kind === 'decor' ? decor.find(d => d.id === selection.id) : undefined;
  const itemId = selection?.kind === 'item' ? selection.itemId : moving?.item_id;
  const ghost: Ghost | null = island && itemId && pos ? {
    itemId, x: pos.x, y: pos.y, rot,
    cells: cellsOf(island, itemId, pos.x, pos.y, rot),
    why: whyNot(island, itemId, pos.x, pos.y, decor, moving?.id, blocked, rot),
    movingId: moving?.id,
  } : null;

  function selectItem(id: string) {
    if (selection?.kind === 'item' && selection.itemId === id) return cancel();
    setSelection({ kind: 'item', itemId: id });
    setPos(null);
    setRot(0);
  }
  function selectDecor(d: api.Decor) {
    setSelection({ kind: 'decor', id: d.id });
    setPos({ x: d.x, y: d.y });
    setRot(d.rot ?? 0);
  }
  function cancel() {
    setSelection(null);
    setPos(null);
    drag.current = null;
  }

  async function commit(at?: { x: number; y: number }) {
    const p = at ?? pos;
    if (!p || !island || !itemId || busy.current) return;
    const why = whyNot(island, itemId, p.x, p.y, decor, moving?.id, blocked, rot);
    if (why) { setPos(p); return toast(why); }
    busy.current = true;
    try {
      if (selection?.kind === 'item') {
        await api.placeDecor(itemId, island, p.x, p.y, rot);
        const left = inventory.find(r => r.item_id === itemId)?.qty ?? 0;
        if (left <= 1) cancel(); else setPos(null);
      } else if (moving) {
        await api.moveDecor(moving.id, p.x, p.y, rot);
        cancel();
      }
      notify('decor', 'inventory');
    } catch (e) {
      toastError(e);
    }
    busy.current = false;
  }

  // ── Thao tác trên ô (chuột & cảm ứng) ──
  function down(x: number, y: number, e?: React.PointerEvent) {
    if (!island) return;
    (e?.target as Element | undefined)?.releasePointerCapture?.(e!.pointerId);   // để ngón tay kéo sang ô khác vẫn nhận
    const o = occupant(island, decor, x, y);
    if (o && !(selection?.kind === 'item')) {
      if (selection?.kind !== 'decor' || selection.id !== o.id) selectDecor(o);
      drag.current = { id: o.id, dx: o.x - x, dy: o.y - y, moved: false };
    }
  }
  function enter(x: number, y: number, e?: React.PointerEvent) {
    if (!selection) return;
    const d = drag.current;
    if (d) { d.moved = true; d.at = { x: x + d.dx, y: y + d.dy }; setPos(d.at); }
    else if (e?.pointerType === 'mouse') setPos({ x, y });           // máy tính: bóng chạy theo chuột, bấm là đặt
  }
  function up(x: number, y: number, e?: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (d) {
      if (d.moved && d.at) void commit(d.at);
      return;
    }
    if (!selection) return;
    // Máy tính: bấm là đặt. Điện thoại: chạm lần đầu để xem trước, chạm lại ô xanh để đặt.
    if (e?.pointerType === 'mouse' || (pos && pos.x === x && pos.y === y)) void commit({ x, y });
    else setPos({ x, y });
  }

  async function store() {
    if (selection?.kind !== 'decor') return;
    try {
      await api.removeDecor(selection.id);
      cancel();
      notify('decor', 'inventory');
    } catch (e) {
      toastError(e);
    }
  }

  return {
    selection, ghost, rot, selectItem, selectDecor, cancel, commit, store,
    rotate: () => setRot(r => r ^ 1),
    cell: { down, enter, up },
    setSelection: (s: Selection) => { if (!s) cancel(); else setSelection(s); },
  };
}
export type DecorEditor = ReturnType<typeof useDecorEditor>;
