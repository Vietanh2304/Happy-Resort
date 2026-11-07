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
  toast('😿 ' + (e instanceof Error ? e.message : 'Có lỗi, thử lại nhé'));
}
