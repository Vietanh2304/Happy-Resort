// Vẽ góc nhìn nghiêng (isometric) kiểu phòng búp bê: mỗi ô sàn là hình thoi 20×10.
// gx tăng → đi xuống bên phải, gy tăng → đi xuống bên trái, z là độ cao (pixel).
import { makeSprite, mix, type Pen, type Sprite } from './pixel';

export const HW = 10; // nửa bề ngang một ô
export const HH = 5;  // nửa bề cao một ô

export type P = [number, number];

/** Tô đa giác không khử răng cưa (pixel nét căng) */
export function fillPoly(p: Pen, pts: P[], color: string) {
  const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
  const x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs));
  const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (inside(pts, x + 0.5, y + 0.5)) p.px(x, y, color);
    }
  }
}

function inside(pts: P[], x: number, y: number) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Hình elip đặc (dùng cho thảm tròn, lá cây, tai gấu...) */
export function ellipse(p: Pen, cx: number, cy: number, rx: number, ry: number, color: string) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) p.px(x, y, color);
    }
  }
}

export interface Shade { top: string; left: string; right: string }
/** Ba mặt sáng/tối từ một màu gốc (ánh sáng chiếu từ trên, hơi lệch trái) */
export const shade = (base: string, k = 1): Shade => ({
  top: mix(base, '#ffffff', 0.2 * k),
  left: base,
  right: mix(base, '#3b2416', 0.16 * k),
});

export interface IsoPen extends Pen {
  pt(gx: number, gy: number, z?: number): P;
  /** Khối hộp: góc sau (gx, gy), nâng z, rộng bw theo gx, sâu bd theo gy, cao bh */
  box(gx: number, gy: number, z: number, bw: number, bd: number, bh: number, c: Shade): void;
  /** Mặt phẳng nằm (thảm, khăn...) */
  flat(gx: number, gy: number, z: number, bw: number, bd: number, color: string): void;
  poly(pts: P[], color: string): void;
  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void;
}

/** Bút vẽ isometric với gốc (ox, oy) = đỉnh sau của ô (0, 0) trên mặt sàn */
export function isoPen(pen: Pen, ox: number, oy: number): IsoPen {
  const pt = (gx: number, gy: number, z = 0): P => [ox + (gx - gy) * HW, oy + (gx + gy) * HH - z];
  return {
    ...pen,
    pt,
    poly: (pts, color) => fillPoly(pen, pts, color),
    ellipse: (cx, cy, rx, ry, color) => ellipse(pen, cx, cy, rx, ry, color),
    flat: (gx, gy, z, bw, bd, color) => fillPoly(pen, [pt(gx, gy, z), pt(gx + bw, gy, z), pt(gx + bw, gy + bd, z), pt(gx, gy + bd, z)], color),
    box: (gx, gy, z, bw, bd, bh, c) => {
      const L = pt(gx, gy + bd, z), F = pt(gx + bw, gy + bd, z), R = pt(gx + bw, gy, z);
      const up = ([x, y]: P): P => [x, y - bh];
      fillPoly(pen, [L, F, up(F), up(L)], c.left);
      fillPoly(pen, [F, R, up(R), up(F)], c.right);
      fillPoly(pen, [pt(gx, gy, z + bh), up(R), up(F), up(L)], c.top);
    },
  };
}

/** Sprite nội thất isometric chiếm w×d ô, cao tối đa hmax. Neo ở đỉnh dưới cùng của chân đế. */
export function isoSprite(key: string, w: number, d: number, hmax: number, draw: (q: IsoPen) => void, outline = '#5a3a2e'): Sprite {
  const sprite = makeSprite(`iso:${key}`, (w + d) * HW, (w + d) * HH + hmax, pen => draw(isoPen(pen, d * HW, hmax)), outline);
  return { ...sprite, ax: w * HW + 1 };
}
