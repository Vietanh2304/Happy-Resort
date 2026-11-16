// Chế độ tiết kiệm pin: điện thoại tự bật (giảm hiệu ứng lấp lánh trang trí, vẽ động thưa hơn) để máy đỡ nóng, đỡ giật.
// Người chơi bật/tắt trong ⚙️ Cài đặt; lựa chọn lưu trên máy này.
const KEY = 'lite-mode';
const touch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
export function liteOn(): boolean {
  try { const v = localStorage.getItem(KEY); if (v === '1') return true; if (v === '0') return false; } catch { /* */ }
  return touch();
}
export function setLite(on: boolean) {
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* */ }
  applyLite();
}
export function applyLite() { document.documentElement.classList.toggle('lite', liteOn()); }
