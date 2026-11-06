// Đồ dùng chung cho các trò hai người: kênh sự kiện realtime, phần thưởng, tên người chơi.
import { useEffect, useRef } from 'react';
import * as api from '../lib/api';
import { content, item } from '../lib/content';
import { notify, onEvent, sendEvent } from '../lib/realtime';
import { toast } from '../lib/toast';
import type { GameId } from '../lib/world';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Msg = { g: GameId; t: string; by: string; [k: string]: any };

/** Gửi một nước đi cho cả hai máy (máy mình cũng nhận ngay) */
export function useGameChannel(g: GameId, me: string, onMsg: (m: Msg) => void) {
  const ref = useRef(onMsg);
  ref.current = onMsg;
  useEffect(() => onEvent('game', (m: Msg) => m.g === g && ref.current(m)), [g]);
  return (t: string, data: object = {}) => {
    const m = { g, t, by: me, ...data } as Msg;
    sendEvent('game', m);
    ref.current(m);
  };
}

/** Hoàn thành một ván: mỗi ngày mỗi trò được 1 vé vui chơi và một ít xu */
export function reward(g: GameId, date: string) {
  api.claim(`game:${date}:${g}`, [{ id: 'ticket', n: 1 }]).then(ok => {
    if (ok) { toast(`🎟️ Nhận 1 ${item('ticket').name} — đổi xu ở cửa hàng nhé`); notify('inventory', 'collection'); }
  }, console.error);
  api.grantCoins(`coins:game:${date}:${g}`, content.economy.game).then(ok => {
    if (ok) { toast(`🪙 Chơi vui quá: +${content.economy.game} xu vào hũ chung`); notify('profiles'); }
  }, console.error);
}

export interface Props { game: GameId; me: api.Profile; partner: api.Profile | null; partnerOnline: boolean; date: string; onClose: () => void }
export type GP = Props & { them: string };
export const nameOf = (p: GP, id: string | null) => (id === p.me.id ? 'Bạn' : p.partner?.display_name ?? 'Người ấy');
