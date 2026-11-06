// Tìm đường đi vòng qua đồ vật (A* trên lưới): trong phòng theo ô sàn isometric, ngoài trời theo lưới 4 pixel.
import type { Decor } from './api';
import { ART } from './furniture';
import { cellsOf, isWallCell } from './placement';
import { BEACH, BUILDINGS, FARM, GARDEN, RESERVED, WALK_THROUGH, ROOM, roomGrid, roomPt, SCENES, TOWN, type Pt, type SceneId } from './world';

interface Grid { cols: number; rows: number; blocked: Uint8Array; toCell: (p: Pt) => [number, number]; toPt: (c: number, r: number) => Pt }

// ───────── Phòng ─────────
const SUB = 2; // chia mỗi ô sàn thành 2×2 để đi mềm hơn
function roomGridFor(scene: SceneId, decor: Decor[]): Grid {
  const n = ROOM.n * SUB;
  const blocked = new Uint8Array(n * n);
  const block = (cx: number, cy: number) => { for (let i = 0; i < SUB; i++) for (let j = 0; j < SUB; j++) blocked[(cy * SUB + j) * n + cx * SUB + i] = 1; };
  // Ô cố định (bếp, bồn tắm...) — trừ thảm cửa ra vào của nhà gỗ
  for (let y = 0; y < ROOM.n; y++) for (let x = 0; x < ROOM.n; x++) if (RESERVED[scene]?.(x, y) && !WALK_THROUGH(scene, x, y)) block(x, y);
  for (const d of decor) {
    if (d.island !== scene || isWallCell(scene, d.y) || ART[d.item_id]?.flat) continue;
    for (const [cx, cy] of cellsOf(scene, d.item_id, d.x, d.y, d.rot ?? 0)) if (cx >= 0 && cy >= 0 && cx < ROOM.n && cy < ROOM.n) block(cx, cy);
  }
  return {
    cols: n, rows: n, blocked,
    toCell: p => { const g = roomGrid(p); return [clamp(Math.floor(g.gx * SUB), 0, n - 1), clamp(Math.floor(g.gy * SUB), 0, n - 1)]; },
    toPt: (c, r) => roomPt((c + 0.5) / SUB, (r + 0.5) / SUB),
  };
}

// ───────── Ngoài trời ─────────
const STEP = 4;
type Shape = { r: [number, number, number, number] } | { e: [number, number, number, number] };
function outdoorShapes(scene: SceneId, decor: Decor[]): Shape[] {
  const out: Shape[] = [];
  const rect = (x0: number, y0: number, x1: number, y1: number) => out.push({ r: [x0, y0, x1, y1] });
  const ell = (cx: number, cy: number, rx: number, ry: number) => out.push({ e: [cx, cy, rx, ry] });
  const trunk = (x: number, y: number) => rect(x - 6, y - 7, x + 6, y);
  const grid = (g: typeof GARDEN, island: string) => {
    for (const d of decor) {
      if (d.island !== island || ART[d.item_id]?.flat) continue;
      for (const [cx, cy] of cellsOf(island, d.item_id, d.x, d.y, d.rot ?? 0)) rect(g.x + cx * g.cw + 2, g.y + cy * g.ch + 4, g.x + (cx + 1) * g.cw - 2, g.y + (cy + 1) * g.ch);
    }
  };
  if (scene === 'town') {
    for (const b of BUILDINGS) rect(b.x - 31, 40, b.x + 31, b.y - 2);
    rect(TOWN.cafe.x - 29, TOWN.cafe.y - 46, TOWN.cafe.x + 29, TOWN.cafe.y - 3);
    for (const [, x, y] of TOWN.trees) trunk(x, y);
    for (const [x, y] of TOWN.bushes) rect(x - 7, y - 6, x + 7, y);
    for (const [x, y] of TOWN.lamps) rect(x - 2, y - 4, x + 2, y);
    for (const [x, y] of TOWN.benches) rect(x - 10, y - 6, x + 10, y);
    ell(TOWN.fountain.x, TOWN.fountain.y + 4, 24, 10);
    ell(330, 240, 46, 28);
    rect(TOWN.mailbox.x - 3, TOWN.mailbox.y - 6, TOWN.mailbox.x + 3, TOWN.mailbox.y - 1);
    rect(TOWN.toArcade.x - 21, TOWN.toArcade.y - 30, TOWN.toArcade.x + 21, TOWN.toArcade.y - 6);
    rect(TOWN.twin.x - 6, TOWN.twin.y - 6, TOWN.twin.x + 6, TOWN.twin.y);
    // Hàng rào cây quanh vườn hoa (chừa lối vào phía trên)
    const g = GARDEN, gx1 = g.x + g.cols * g.cw, gy1 = g.y + g.rows * g.ch;
    rect(g.x - 10, g.y - 10, g.x + 72, g.y - 3); rect(114, g.y - 10, gx1 + 10, g.y - 3);
    rect(g.x - 10, gy1 + 4, gx1 + 10, gy1 + 11);
    rect(g.x - 10, g.y - 10, g.x - 4, gy1 + 10); rect(gx1 + 4, g.y - 10, gx1 + 10, gy1 + 10);
    grid(GARDEN, 'garden');
  }
  if (scene === 'beach') {
    rect(BEACH.wheel.x - 26, BEACH.wheel.y - 22, BEACH.wheel.x + 26, BEACH.wheel.y - 2);
    trunk(180, 62); trunk(134, 64);
  }
  if (scene === 'farm') {
    trunk(236, 88); trunk(16, 96); trunk(244, 150);
    grid(FARM, 'farm');
  }
  return out;
}
function outdoorGrid(scene: SceneId, decor: Decor[]): Grid {
  const def = SCENES[scene];
  const cols = Math.ceil(def.w / STEP), rows = Math.ceil(def.h / STEP);
  const blocked = new Uint8Array(cols * rows);
  const shapes = outdoorShapes(scene, decor);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = c * STEP + STEP / 2, y = r * STEP + STEP / 2;
    if (shapes.some(s => ('r' in s ? x >= s.r[0] && x <= s.r[2] && y >= s.r[1] && y <= s.r[3] : ((x - s.e[0]) / s.e[2]) ** 2 + ((y - s.e[1]) / s.e[3]) ** 2 <= 1))) blocked[r * cols + c] = 1;
  }
  return {
    cols, rows, blocked,
    toCell: p => [clamp(Math.floor(p.x / STEP), 0, cols - 1), clamp(Math.floor(p.y / STEP), 0, rows - 1)],
    toPt: (c, r) => ({ x: c * STEP + STEP / 2, y: r * STEP + STEP / 2 }),
  };
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const cache = new Map<string, Grid>();
function gridFor(scene: SceneId, decor: Decor[]): Grid | null {
  const walk = SCENES[scene].walk;
  if (!walk) return null;
  if (walk !== 'room' && !['town', 'beach', 'farm'].includes(scene)) return null;
  const key = scene + ':' + decor.filter(d => d.island === scene || d.island === 'garden' || d.island === 'farm').map(d => `${d.id}${d.x},${d.y},${d.rot ?? 0}`).join('|');
  let g = cache.get(key);
  if (!g) {
    g = walk === 'room' ? roomGridFor(scene, decor) : outdoorGrid(scene, decor);
    if (cache.size > 20) cache.clear();
    cache.set(key, g);
  }
  return g;
}

/** Chỗ này có vướng đồ không (để chạm vào đồ thì đi tới cạnh nó) */
export function isBlocked(scene: SceneId, decor: Decor[], p: Pt) {
  const g = gridFor(scene, decor);
  if (!g) return false;
  const [c, r] = g.toCell(p);
  return !!g.blocked[r * g.cols + c];
}

/** Đường đi từ `from` tới `to` (danh sách điểm dừng, điểm cuối là đích). Không tìm được thì đi thẳng. */
export function findPath(scene: SceneId, decor: Decor[], from: Pt, to: Pt): Pt[] {
  const g = gridFor(scene, decor);
  if (!g) return [to];
  const { cols, rows, blocked } = g;
  const idx = (c: number, r: number) => r * cols + c;
  const free = (c: number, r: number) => c >= 0 && r >= 0 && c < cols && r < rows && !blocked[idx(c, r)];
  const [sc, sr] = g.toCell(from);
  let [tc, tr] = g.toCell(to);
  let goal = to;
  if (!free(tc, tr)) {
    // Chạm vào đồ vật: đi tới ô trống gần nhất (gần phía mình đang đứng)
    let best: [number, number] | null = null, bd = Infinity;
    for (let rad = 1; rad < 12 && !best; rad++) {
      for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad || !free(tc + dc, tr + dr)) continue;
        const d = Math.hypot(dc, dr) + Math.hypot(tc + dc - sc, tr + dr - sr) * 0.05;
        if (d < bd) { bd = d; best = [tc + dc, tr + dr]; }
      }
    }
    if (!best) return [to];
    [tc, tr] = best;
    goal = g.toPt(tc, tr);
  }
  if (sc === tc && sr === tr) return [goal];
  // A* 8 hướng, không cắt góc
  const N = cols * rows;
  const gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const open: number[] = [];
  const h = (c: number, r: number) => { const dx = Math.abs(c - tc), dy = Math.abs(r - tr); return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy); };
  const fs = new Float32Array(N).fill(Infinity);
  const start = idx(sc, sr), target = idx(tc, tr);
  gs[start] = 0; fs[start] = h(sc, sr); open.push(start);
  let found = false;
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (fs[open[i]] < fs[open[bi]]) bi = i;
    const cur = open[bi];
    open[bi] = open[open.length - 1]; open.pop();
    if (cur === target) { found = true; break; }
    if (closed[cur]) continue;
    closed[cur] = 1;
    const c = cur % cols, r = (cur - c) / cols;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nc = c + dc, nr = r + dr;
      if (!free(nc, nr)) continue;
      if (dc && dr && (!free(c + dc, r) || !free(c, r + dr))) continue;
      const ni = idx(nc, nr);
      const ng = gs[cur] + (dc && dr ? Math.SQRT2 : 1);
      if (ng < gs[ni]) { gs[ni] = ng; came[ni] = cur; fs[ni] = ng + h(nc, nr); open.push(ni); }
    }
  }
  if (!found) return [goal];
  const cells: number[] = [];
  for (let i = target; i !== -1 && i !== start; i = came[i]) cells.push(i);
  cells.reverse();
  const pts = cells.map(i => g.toPt(i % cols, Math.floor(i / cols)));
  pts[pts.length - 1] = goal;
  // Rút gọn: bỏ điểm giữa nếu nhìn thẳng thấy điểm sau
  const sight = (a: Pt, b: Pt) => {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 1.5);
    for (let i = 1; i < n; i++) { const [c, r] = g.toCell({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n }); if (!free(c, r)) return false; }
    return true;
  };
  const out: Pt[] = [];
  let from0 = from;
  let i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !sight(from0, pts[j])) j--;
    out.push(pts[j]);
    from0 = pts[j];
    i = j + 1;
  }
  return out;
}
