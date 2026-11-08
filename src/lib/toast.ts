type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

// Nhật ký thông báo (để đọc lại trong khung chat, tab 🔔). Lưu trong máy, giữ 80 cái gần nhất.
export interface Notice { at: number; msg: string }
const KEY = 'hy:notices';
let log: Notice[] = (() => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Notice[]; } catch { return []; } })();
const logFns = new Set<(l: Notice[]) => void>();
export const notices = () => log;
export function onNotices(fn: (l: Notice[]) => void) { logFns.add(fn); return () => { logFns.delete(fn); }; }

export function toast(msg: string) {
  listeners.forEach(fn => fn(msg));
  log = [...log.slice(-79), { at: Date.now(), msg }];
  try { localStorage.setItem(KEY, JSON.stringify(log)); } catch { /* chế độ ẩn danh */ }
  logFns.forEach(fn => fn(log));
}
export function onToast(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
/** Hiện lỗi thân thiện thay vì để văng */
export function toastError(e: unknown) {
  console.error(e);
  const msg = e instanceof Error ? e.message : String(e ?? '');
  // Chưa chạy SQL mới trên Supabase: báo rõ cần chạy file nào
  if (/ranch|outfit|jobs|kid_scores/i.test(msg) && /does not exist|schema cache|Could not find/i.test(msg)) {
    toast('🛠️ Tính năng mới cần chạy file SQL 013_life.sql trên Supabase (SQL Editor) trước nhé!');
    return;
  }
  toast('😿 ' + (msg || 'Có lỗi, thử lại nhé'));
}
