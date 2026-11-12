// Bút vẽ canvas cho các màn toàn màn hình (thuyền cổ tích, xưởng gốm…): toạ độ logic, nét nửa điểm ảnh khi phóng ×2
// ───────── bút vẽ ─────────
export type Ctx = CanvasRenderingContext2D;
export const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2, Math.max(0.5, Math.round(w * 2) / 2), Math.max(0.5, Math.round(h * 2) / 2)); };
export const circ = (c: Ctx, x: number, y: number, r: number, col: string) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, Math.max(0.3, r), 0, Math.PI * 2); c.fill(); };
export const ell = (c: Ctx, x: number, y: number, rx: number, ry: number, col: string, rot = 0) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(0.3, rx), Math.max(0.3, ry), rot, 0, Math.PI * 2); c.fill(); };
export const half = (c: Ctx, x: number, y: number, r: number, col: string) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.fill(); };
export const poly = (c: Ctx, pts: number[], col: string) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); };
export const line = (c: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, col: string) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
export const glow = (c: Ctx, x: number, y: number, r: number, col: string, a = 1) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, /^#[0-9a-f]{6}$/i.test(col) ? col + '00' : 'transparent'); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.globalAlpha = 1; };
export const star = (c: Ctx, x: number, y: number, r: number, col: string, rot = 0) => { const p: number[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + rot + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } poly(c, p, col); };
export const heart = (c: Ctx, x: number, y: number, r: number, col: string) => { circ(c, x - r * 0.5, y, r * 0.56, col); circ(c, x + r * 0.5, y, r * 0.56, col); poly(c, [x - r * 1.04, y + r * 0.18, x, y + r * 1.25, x + r * 1.04, y + r * 0.18], col); };
export const twinkle = (c: Ctx, x: number, y: number, r: number, col: string) => { R(c, x - r, y - 0.25, r * 2, 0.5, col); R(c, x - 0.25, y - r, 0.5, r * 2, col); R(c, x - 0.5, y - 0.5, 1, 1, '#ffffff'); };
/** chóp nón nhọn của tháp (có sọc) */
export const cone = (c: Ctx, x: number, base: number, w: number, h: number, col: string, stripe: string) => { for (let y = 0; y < h; y++) { const ww = Math.max(0.5, ((y + 1) / h) * w); R(c, x - ww / 2, base - h + y, ww, 1, y % 4 === 3 ? stripe : col); R(c, x + ww / 2 - ww * 0.22, base - h + y, ww * 0.22, 1, stripe); } };
/** đám mây bông */
export const cloud = (c: Ctx, x: number, y: number, w: number, col: string, sh: string) => { const n = Math.max(3, Math.round(w / 9)); for (let k = 0; k < n; k++) circ(c, x + (k + 0.5) * (w / n), y + 1.5, w / n * 0.75, sh); for (let k = 0; k < n; k++) circ(c, x + (k + 0.5) * (w / n), y - Math.sin((k + 0.5) / n * Math.PI) * w * 0.12, w / n * 0.8, col); R(c, x + 2, y, w - 4, 3, col); };
/** cửa sổ vòm có song */
export const archWin = (c: Ctx, x: number, y: number, w: number, h: number, glass: string, frame = '#ffffff', lit = false) => {
  R(c, x - 1, y + w / 2 - 1, w + 2, h - w / 2 + 2, frame); half(c, x + w / 2, y + w / 2, w / 2 + 1, frame);
  R(c, x, y + w / 2, w, h - w / 2, glass); half(c, x + w / 2, y + w / 2, w / 2, glass);
  if (lit) glow(c, x + w / 2, y + h / 2, h * 0.8, '#ffe8a0', 0.35);
  R(c, x + w / 2 - 0.5, y + 1, 1, h - 1, frame); R(c, x, y + h * 0.55, w, 1, frame); R(c, x + 1, y + w / 2, 1, 2, '#ffffffa0');
};

// ───────── vẽ sẵn (lớp tĩnh nhiều chi tiết) ─────────
const cache = new Map<string, HTMLCanvasElement>();
export function bake(key: string, w: number, h: number, draw: (c: Ctx, rnd: () => number) => void, Z = 2) {
  const hit = cache.get(key); if (hit) return hit;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * Z); cv.height = h * Z;
  const c = cv.getContext('2d')!; c.setTransform(Z, 0, 0, Z, 0, 0); c.imageSmoothingEnabled = false;
  let s = 7; for (const ch of key) s = (s * 31 + ch.charCodeAt(0)) % 2147483647;
  const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  draw(c, rnd); cache.set(key, cv); return cv;
}

