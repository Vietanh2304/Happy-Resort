// Thông báo của trình duyệt khi game đang chạy nền (tab khác, hoặc app đã cài ra màn hình chính nhưng đang ẩn).
const KEY = 'resort-notify';

export const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const notifyOn = () => notifySupported() && Notification.permission === 'granted' && localStorage.getItem(KEY) !== 'off';

export async function enableNotify(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* bỏ qua */ }
  if (!on || !notifySupported()) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

/** Hiện thông báo — chỉ khi người chơi không nhìn vào game */
export async function ping(title: string, body: string, tag = title) {
  if (!notifyOn() || document.visibilityState === 'visible') return;
  const opts: NotificationOptions = { body, tag, icon: `${import.meta.env.BASE_URL}icon-192.png`, badge: `${import.meta.env.BASE_URL}icon-192.png` };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, opts);
    else new Notification(title, opts);
  } catch { /* trình duyệt không cho: bỏ qua */ }
}

export function registerSW() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}

// Cài game ra màn hình chính (Android/Chrome/Edge). iPhone: Safari → Chia sẻ → Thêm vào MH chính.
let installEvent: (Event & { prompt: () => Promise<void> }) | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvent = e as typeof installEvent; });
}
export const canInstall = () => !!installEvent;
export async function installApp() {
  if (!installEvent) return false;
  await installEvent.prompt();
  installEvent = null;
  return true;
}
