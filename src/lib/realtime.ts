// Một kênh Realtime cho mỗi cặp đôi:
// - presence: ai đang online (đèn villa)
// - broadcast 'sync': "dữ liệu X vừa đổi, tải lại đi" (đơn giản, không cần cấu hình publication)
// - broadcast 'event': sự kiện tức thời như chạm sao băng
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Topic =
  | 'profiles' | 'decor' | 'inventory' | 'notes' | 'checkins'
  | 'claims' | 'guests' | 'answers' | 'meetup' | 'collection' | 'wishes' | 'garden' | 'farm' | 'photos' | 'capsules' | 'pets' | 'days' | 'festdecor' | 'kids';
const ALL: Topic[] = ['profiles', 'decor', 'inventory', 'notes', 'checkins', 'claims', 'guests', 'answers', 'meetup', 'collection', 'wishes', 'garden', 'farm', 'photos', 'capsules', 'pets', 'days', 'festdecor', 'kids'];

type Fn = (payload?: any) => void;
const syncFns = new Map<string, Set<Fn>>();
const eventFns = new Map<string, Set<Fn>>();
let channel: RealtimeChannel | null = null;

function listen(map: Map<string, Set<Fn>>, key: string, fn: Fn) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(fn);
  return () => { map.get(key)!.delete(fn); };
}
function emit(map: Map<string, Set<Fn>>, key: string, payload?: unknown) {
  map.get(key)?.forEach(fn => fn(payload));
}

export const onSync = (topic: Topic, fn: () => void) => listen(syncFns, topic, fn);
export const onEvent = (name: string, fn: Fn) => listen(eventFns, name, fn);

/** Báo dữ liệu đã đổi: tải lại ở máy mình và nhắn máy người ấy tải lại. */
export function notify(...topics: Topic[]) {
  for (const topic of topics) {
    emit(syncFns, topic);
    channel?.send({ type: 'broadcast', event: 'sync', payload: { topic } });
  }
}

export function sendEvent(name: string, data: unknown = {}) {
  channel?.send({ type: 'broadcast', event: 'event', payload: { name, data } });
}

export function joinCouple(coupleId: string, userId: string, onOnline: (ids: string[]) => void) {
  const ch = supabase.channel(`couple:${coupleId}`, { config: { presence: { key: userId } } });
  ch.on('broadcast', { event: 'sync' }, ({ payload }) => emit(syncFns, payload.topic))
    .on('broadcast', { event: 'event' }, ({ payload }) => emit(eventFns, payload.name, payload.data))
    .on('presence', { event: 'sync' }, () => onOnline(Object.keys(ch.presenceState())))
    .subscribe(status => {
      if (status === 'SUBSCRIBED') ch.track({ at: Date.now() });
    });
  channel = ch;

  // Quay lại tab sau một lúc: tải lại mọi thứ phòng khi lỡ tin nhắn
  const onVisible = () => {
    if (document.visibilityState === 'visible') ALL.forEach(t => emit(syncFns, t));
  };
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    channel = null;
    supabase.removeChannel(ch);
  };
}
