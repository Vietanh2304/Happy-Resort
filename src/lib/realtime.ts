// Một kênh Realtime cho mỗi cặp đôi:
// - presence: ai đang online (đèn villa)
// - broadcast 'sync': "dữ liệu X vừa đổi, tải lại đi" (đơn giản, không cần cấu hình publication)
// - broadcast 'event': sự kiện tức thời như chạm sao băng
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Topic =
  | 'profiles' | 'decor' | 'inventory' | 'notes' | 'checkins'
  | 'claims' | 'guests' | 'answers' | 'meetup' | 'collection' | 'wishes' | 'garden' | 'farm' | 'photos' | 'capsules' | 'pets' | 'days' | 'festdecor' | 'kids' | 'fridge';
const ALL: Topic[] = ['profiles', 'decor', 'inventory', 'notes', 'checkins', 'claims', 'guests', 'answers', 'meetup', 'collection', 'wishes', 'garden', 'farm', 'photos', 'capsules', 'pets', 'days', 'festdecor', 'kids', 'fridge'];

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

/** Trạng thái kênh đồng bộ: 'ok' | 'connecting' | 'down' (để hiện cảnh báo khi mất kết nối) */
export type LinkState = 'ok' | 'connecting' | 'down';
const linkFns = new Set<(s: LinkState) => void>();
let link: LinkState = 'connecting';
const setLink = (s: LinkState) => { if (s !== link) { link = s; linkFns.forEach(f => f(s)); } };
export function onLink(fn: (s: LinkState) => void) { linkFns.add(fn); fn(link); return () => { linkFns.delete(fn); }; }
export const onEvent = (name: string, fn: Fn) => listen(eventFns, name, fn);

// ───── Hàng đợi gửi: Supabase Realtime chặn kênh khi gửi quá dày (→ rớt kết nối, nhân vật chập chờn).
// Gửi trung bình RATE tin/giây (dồn tối đa BURST tin một lúc); tin có `key` (vị trí, trạng thái ván…) chỉ giữ bản mới nhất khi đang xếp hàng.
const RATE = 10, BURST = 8;
let tokens = BURST;
let myId = '';
const outbox: { key?: string; event: string; payload: Record<string, unknown> }[] = [];
let pumping: ReturnType<typeof setInterval> | undefined;
function pump() {
  while (tokens > 0 && outbox.length && channel) {
    const m = outbox.shift()!;
    tokens--;
    void channel.send({ type: 'broadcast', event: m.event, payload: m.payload });
  }
  if (!pumping && (outbox.length || tokens < BURST)) {
    pumping = setInterval(() => {
      tokens = Math.min(BURST, tokens + 1);
      if (outbox.length) pump();
      else if (tokens >= BURST) { clearInterval(pumping); pumping = undefined; }
    }, 1000 / RATE);
  }
}
function enqueue(event: string, payload: Record<string, unknown>, key?: string) {
  payload = { ...payload, from: myId };
  if (key) {
    const q = outbox.find(m => m.key === key);
    if (q) { q.payload = payload; return; }
  }
  if (outbox.length > 120) outbox.splice(0, outbox.length - 120);   // rớt mạng lâu: bỏ bớt tin quá cũ
  outbox.push({ key, event, payload });
  pump();
}

/** Báo dữ liệu đã đổi: tải lại ở máy mình và nhắn máy người ấy tải lại. */
export function notify(...topics: Topic[]) {
  for (const topic of topics) {
    emit(syncFns, topic);
    enqueue('sync', { topic }, `sync:${topic}`);
  }
}

/** key: tin cùng key đang chờ gửi thì chỉ giữ bản mới nhất (dùng cho vị trí, trạng thái) */
export function sendEvent(name: string, data: unknown = {}, key?: string) {
  enqueue('event', { name, data }, key);
}

const ALIVE_MS = 15000;      // mất tín hiệu quá lâu chừng này mới coi là người ấy offline
const RELOAD_GAP = 20000;   // nối lại / quay lại tab: tải lại toàn bộ dữ liệu tối đa mỗi 20 giây

export function joinCouple(coupleId: string, userId: string, onOnline: (ids: string[]) => void) {
  let closed = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let ch: RealtimeChannel;
  let fails = 0;
  myId = userId;

  // Ai đang online = có trong presence, hoặc vừa gửi tin gì đó trong ALIVE_MS gần đây.
  // Presence hay chập chờn (mạng yếu, nối lại kênh) nên không ẩn người ấy ngay lập tức.
  const alive = new Map<string, number>();
  let present: string[] = [];
  let last = '';
  const publish = () => {
    const now = Date.now();
    for (const id of present) alive.set(id, now);
    const ids = [...alive].filter(([, t]) => now - t < ALIVE_MS).map(([id]) => id).sort();
    const k = ids.join();
    if (k !== last) { last = k; onOnline(ids); }
  };
  const heard = (from: unknown) => {
    if (typeof from !== 'string' || from === userId) return;
    const fresh = !alive.has(from) || Date.now() - alive.get(from)! >= ALIVE_MS;
    alive.set(from, Date.now());
    if (fresh) publish();
  };
  const ticker = setInterval(publish, 2000);

  let reloadedAt = 0;
  const reloadAll = (force = false) => {
    if (!force && Date.now() - reloadedAt < RELOAD_GAP) return;
    reloadedAt = Date.now();
    ALL.forEach(t => emit(syncFns, t));
  };

  // Vào kênh; rớt kết nối (mạng chập chờn, máy ngủ, khóa sai...) thì tự vào lại sau vài giây
  const connect = async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (token) supabase.realtime.setAuth(token);
    if (closed) return;
    setLink('connecting');
    ch = supabase.channel(`couple:${coupleId}`, { config: { presence: { key: userId } } });
    ch.on('broadcast', { event: 'sync' }, ({ payload }) => { heard(payload.from); emit(syncFns, payload.topic); })
      .on('broadcast', { event: 'event' }, ({ payload }) => { heard(payload.from); emit(eventFns, payload.name, payload.data); })
      .on('presence', { event: 'sync' }, () => { present = Object.keys(ch.presenceState()); publish(); })
      .subscribe(status => {
        if (closed) return;
        if (status === 'SUBSCRIBED') {
          const first = !reloadedAt;
          fails = 0;
          setLink('ok');
          channel = ch;
          void ch.track({ at: Date.now() });
          reloadAll(first);                              // vừa nối lại: tải lại mọi thứ phòng khi lỡ tin
          emit(eventFns, 'link-up');
          pump();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          fails++;
          setLink(fails >= 3 ? 'down' : 'connecting');
          present = [];
          if (channel === ch) channel = null;
          clearTimeout(retry);
          retry = setTimeout(() => { if (closed) return; supabase.removeChannel(ch); void connect(); }, Math.min(15000, 1500 * fails));
        }
      });
  };
  void connect();

  // Quay lại tab sau một lúc: tải lại mọi thứ phòng khi lỡ tin nhắn
  const onVisible = () => {
    if (document.visibilityState === 'visible') reloadAll();
  };
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    closed = true;
    clearTimeout(retry);
    clearInterval(ticker);
    document.removeEventListener('visibilitychange', onVisible);
    channel = null;
    outbox.length = 0;
    if (ch) supabase.removeChannel(ch);
  };
}
