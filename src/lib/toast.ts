type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

export function toast(msg: string) {
  listeners.forEach(fn => fn(msg));
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
