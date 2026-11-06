import { useEffect, useRef } from 'react';
import * as api from './api';
import { animal } from './content';
import { guestFarewell, guestWeights, rollGuest } from './game';
import { useSynced } from './hooks';
import { notify } from './realtime';
import type { LocalTime } from './time';
import { toast } from './toast';

/**
 * Khách thú của cả cặp. Máy của mỗi người lo khách của chính mình:
 * - khách ở quá stayHours → rời đi, để lại nhận xét + quà
 * - chưa có khách hôm nay → roll một vị khách theo đồ trang trí đang đặt
 */
export function useGuests(me: api.Profile, time: LocalTime, now: Date, decor: api.Decor[], decorLoaded: boolean, unlocked: string[]) {
  const [guests, , guestsLoaded] = useSynced('guests', api.loadGuests, [] as api.Guest[]);
  const busy = useRef(false);

  useEffect(() => {
    if (!guestsLoaded || !decorLoaded || busy.current) return;
    busy.current = true;

    (async () => {
      let changed = false;
      const mine = guests.filter(g => g.user_id === me.id);

      for (const g of mine.filter(g => !g.left_at)) {
        const a = animal(g.animal_id);
        if (!a || now.getTime() < Date.parse(g.arrived_at) + a.stayHours * 3600_000) continue;
        const petted = await api.hasClaim(me.id, `pet:${g.id}`);
        const { review, gift } = guestFarewell(g.id, a, time.month, petted);
        await api.farewellGuest(g.id, review.text, review.stars);
        await api.claim(`guest:${g.id}`, [{ id: gift, n: 1 }]);
        toast(`${a.icon} ${a.name} đã về, để lại quà và lời nhắn: “${review.text}”`);
        changed = true;
      }

      if (!mine.some(g => g.day === time.date)) {
        const home = decor.filter(d => d.island === 'house').map(d => d.item_id); // khách bị hấp dẫn bởi đồ trong nhà gỗ chung
        const islands: Record<string, string[]> = {};
        for (const d of decor) if (d.island !== 'home') (islands[d.island] ??= []).push(d.item_id);

        const a = rollGuest(me.id, time.date, guestWeights(home, islands, unlocked));
        await api.addGuest(me, time.date, a.id, a.island ?? 'home');
        await api.collect([`animal:${a.id}`]);
        toast(`${a.icon} ${a.name} vừa đến nghỉ dưỡng${a.island ? ' trên đảo' : ''}!`);
        changed = true;
      }

      if (changed) notify('guests', 'inventory', 'collection');
    })()
      .catch(e => console.error('guests', e))
      .finally(() => { busy.current = false; });
  }, [guests, guestsLoaded, decorLoaded, time.date, now]); // eslint-disable-line react-hooks/exhaustive-deps

  return guests;
}
