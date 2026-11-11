// Bộ vẽ pixel art: vẽ lên canvas nhỏ, thêm viền tối 1px, xuất ra data URL (có cache).
// Hiển thị bằng <img> phóng to với `image-rendering: pixelated`.

export interface Sprite { url: string; w: number; h: number; ax?: number; smooth?: boolean } // ax: điểm neo ngang (mặc định giữa)
export interface Pen {
  ctx: CanvasRenderingContext2D;
  rect(x: number, y: number, w: number, h: number, color: string): void;
  px(x: number, y: number, color: string): void;
  /** Vẽ từ bản đồ ký tự: mỗi ký tự là một màu trong `pal`, '.' là trong suốt */
  map(rows: string[], pal: Record<string, string>, ox?: number, oy?: number): void;
}

export const OUTLINE = '#3b2d3f';
const cache = new Map<string, Sprite>();

export function makeSprite(key: string, w: number, h: number, draw: (p: Pen) => void, outline: string | null = OUTLINE): Sprite {
  const hit = cache.get(key);
  if (hit) return hit;
  const m = outline ? 1 : 0;
  const canvas = document.createElement('canvas');
  canvas.width = w + 2 * m;
  canvas.height = h + 2 * m;
  const ctx = canvas.getContext('2d')!;
  const pen: Pen = {
    ctx,
    rect: (x, y, rw, rh, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) + m, Math.round(y) + m, Math.round(rw), Math.round(rh)); },
    px: (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) + m, Math.round(y) + m, 1, 1); },
    map: (rows, pal, ox = 0, oy = 0) => rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (pal[ch]) { ctx.fillStyle = pal[ch]; ctx.fillRect(ox + x + m, oy + y + m, 1, 1); }
    })),
  };
  draw(pen);
  if (outline) { autoShade(ctx, canvas.width, canvas.height); addOutline(ctx, canvas.width, canvas.height, outline); }
  else if (w * h >= 160 * 120) groundTexture(ctx, canvas.width, canvas.height);
  const sprite = { url: canvas.toDataURL(), w: canvas.width, h: canvas.height };
  cache.set(key, sprite);
  return sprite;
}

function autoShade(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data, src = new Uint8ClampedArray(d);
  const a = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!a(x, y)) continue;
    const i = (y * w + x) * 4;
    let k = 0;
    if (!a(x, y - 1)) k += 0.22; else if (!a(x, y - 2)) k += 0.08;
    if (!a(x - 1, y)) k += 0.08;
    if (!a(x, y + 1)) k -= 0.2; else if (!a(x, y + 2)) k -= 0.06;
    if (!a(x + 1, y)) k -= 0.1;
    if (!k) continue;
    for (let c = 0; c < 3; c++) d[i + c] = k > 0 ? src[i + c] + (255 - src[i + c]) * k : src[i + c] * (1 + k);
  }
  ctx.putImageData(img, 0, 0);
}

/** Vân nền: bụi cỏ trên vùng cỏ phẳng, hạt cát/đất trên vùng cát (không đụng trời, nước) */
function groundTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data, src = new Uint8ClampedArray(d);
  const at = (x: number, y: number) => (y * w + x) * 4;
  const same = (i: number, j: number) => Math.abs(src[i] - src[j]) + Math.abs(src[i + 1] - src[j + 1]) + Math.abs(src[i + 2] - src[j + 2]) < 10;
  const set = (x: number, y: number, k: number) => { if (x < 0 || y < 0 || x >= w || y >= h) return; const i = at(x, y); for (let c = 0; c < 3; c++) d[i + c] = k > 0 ? src[i + c] + (255 - src[i + c]) * k : src[i + c] * (1 + k); };
  for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
    const i = at(x, y);
    if (src[i + 3] < 255 || !same(i, at(x - 2, y)) || !same(i, at(x + 2, y)) || !same(i, at(x, y - 2)) || !same(i, at(x, y + 2))) continue;
    const r = src[i], g = src[i + 1], b = src[i + 2], hsh = ((x * 73856093) ^ (y * 19349663)) >>> 0;
    const grass = g > r + 12 && g > b + 12, sand = r > b + 30 && g > b + 15 && r >= g - 10;
    if (grass && hsh % 23 === 0) { set(x, y, -0.14); set(x, y - 1, -0.1); set(x - 1, y, -0.08); set(x + 1, y - 1, 0.1); }
    else if (grass && hsh % 37 === 0) set(x, y, 0.1);
    else if (sand && hsh % 29 === 0) { set(x, y, -0.1); }
    else if (sand && hsh % 41 === 0) set(x, y, 0.12);
  }
  ctx.putImageData(img, 0, 0);
}

function addOutline(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const img = ctx.getImageData(0, 0, w, h);
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && img.data[(y * w + x) * 4 + 3] > 0;
  ctx.fillStyle = color;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) ctx.fillRect(x, y, 1, 1);
    }
  }
}

/**
 * Emoji → hình đồ vật: vẽ ở độ phân giải cao (8×) để hiển thị nét căng, không bị vỡ khi phóng to.
 * Kích thước logic vẫn là size×size (+viền) để xếp chung với các sprite pixel.
 */
const emojiCache = new Map<string, Sprite>();
export function emojiSprite(emoji: string, size = 16): Sprite {
  const key = `${emoji}:${size}`;
  const hit = emojiCache.get(key);
  if (hit) return hit;
  const k = 8, n = (size + 2) * k;
  const canvas = document.createElement('canvas');
  canvas.width = n; canvas.height = n;
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${Math.round(size * 0.9 * k)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // viền trắng mềm cho nổi trên nền
  ctx.shadowColor = 'rgba(255,255,255,.9)';
  ctx.shadowBlur = k * 1.2;
  ctx.fillText(emoji, n / 2, n / 2 + k * 0.6);
  ctx.shadowColor = 'rgba(60,30,40,.35)';
  ctx.shadowBlur = 0; ctx.shadowOffsetY = k * 0.6;
  ctx.fillText(emoji, n / 2, n / 2 + k * 0.6);
  const sprite = { url: canvas.toDataURL(), w: size + 2, h: size + 2, smooth: true };
  emojiCache.set(key, sprite);
  return sprite;
}

/** Trộn hai màu hex, t = 0..1 */
export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}
