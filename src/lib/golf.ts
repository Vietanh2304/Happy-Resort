// Golf mini quanh làng: 6 lỗ, vật lý tất định (hai máy mô phỏng cùng một cú đánh ra cùng kết quả).
// Ký tự sân: # tường · . cỏ · T chỗ phát bóng · O lỗ · s cát (chậm) · w nước (phạt, về chỗ cũ)
// > < ^ v dốc (đẩy bóng) · chữ hoa khác = vật cản trang trí (⛲ 🌴 🪨 🌾 🌸 ⛱️)

export interface Hole { name: string; par: number; map: string[] }
export const HOLES: Hole[] = [
  { name: '⛲ Quảng trường làng', par: 2, map: [
    '################',
    '#..............#',
    '#..............#',
    '#.T....FF....O.#',
    '#......FF......#',
    '#..............#',
    '################'] },
  { name: '🏖️ Bãi biển', par: 3, map: [
    '################',
    '#T....ssss.....#',
    '#.....ssss..U..#',
    '#..wwwww.......#',
    '#..wwwww....P..#',
    '#..........ss.O#',
    '################'] },
  { name: '🌾 Nông trại', par: 3, map: [
    '################',
    '#T....#........#',
    '#.....#...H....#',
    '#.....#....#...#',
    '#.....H....#...#',
    '#..........#..O#',
    '################'] },
  { name: '⚓ Cầu tàu', par: 3, map: [
    '################',
    '#..............#',
    '#T...vvvvvv...O#',
    '#....vvvvvv....#',
    '#wwwwwwwwwwwwww#',
    '################'] },
  { name: '🌸 Vườn hoa', par: 3, map: [
    '################',
    '#T..B.....B....#',
    '#...B..B..B..B.#',
    '#...B..B.....B.#',
    '#......B..B..BO#',
    '#..B...B..B....#',
    '################'] },
  { name: '🔭 Đồi thiên văn', par: 4, map: [
    '################',
    '#.......R......#',
    '#..O....R..^^^.#',
    '#.......R..^^^.#',
    '#RRRRR..R..^^^.#',
    '#T.........^^^.#',
    '################'] },
];
export const DECO: Record<string, string> = { F: '⛲', P: '🌴', R: '🪨', H: '🌾', B: '🌸', U: '⛱️' };

export const BALL_R = 0.18, MAX_POWER = 14, MAX_STROKES = 8;
const DT = 1 / 60, SLOPE = 5;

export function find(h: Hole, ch: string) {
  for (let y = 0; y < h.map.length; y++) { const x = h.map[y].indexOf(ch); if (x >= 0) return { x: x + 0.5, y: y + 0.5 }; }
  throw new Error(ch);
}
const at = (h: Hole, x: number, y: number) => h.map[Math.floor(y)]?.[Math.floor(x)] ?? '#';
const solid = (ch: string) => ch === '#' || (ch >= 'A' && ch <= 'Z' && ch !== 'T' && ch !== 'O');
const hits = (h: Hole, x: number, y: number) =>
  [[x - BALL_R, y - BALL_R], [x + BALL_R, y - BALL_R], [x - BALL_R, y + BALL_R], [x + BALL_R, y + BALL_R]].some(([a, b]) => solid(at(h, a, b)));

export interface ShotResult { path: { x: number; y: number }[]; x: number; y: number; holed: boolean; water: boolean }
/** Mô phỏng một cú đánh từ (x, y) với vận tốc (vx, vy) ô/giây. path: vị trí mỗi khung (60 khung/giây) */
export function simulate(h: Hole, x0: number, y0: number, vx: number, vy: number): ShotResult {
  const hole = find(h, 'O');
  let x = x0, y = y0;
  const path = [{ x, y }];
  for (let i = 0; i < 60 * 20; i++) {
    const ch = at(h, x, y);
    if (ch === '>') vx += SLOPE * DT; else if (ch === '<') vx -= SLOPE * DT; else if (ch === 'v') vy += SLOPE * DT; else if (ch === '^') vy -= SLOPE * DT;
    const f = ch === 's' ? 0.93 : 0.985;
    vx *= f; vy *= f;
    const nx = x + vx * DT;
    if (hits(h, nx, y)) vx = -vx * 0.75; else x = nx;
    const ny = y + vy * DT;
    if (hits(h, x, ny)) vy = -vy * 0.75; else y = ny;
    path.push({ x, y });
    const speed = Math.sqrt(vx * vx + vy * vy);
    const dx = x - hole.x, dy = y - hole.y;
    if (dx * dx + dy * dy < 0.3 * 0.3 && speed < 7) return { path, x: hole.x, y: hole.y, holed: true, water: false };
    if (at(h, x, y) === 'w') return { path, x: x0, y: y0, holed: false, water: true };
    const slope = '<>^v'.includes(at(h, x, y));
    if (speed < 0.08 && !slope) break;
  }
  return { path, x, y, holed: false, water: false };
}

// ───────── Ván golf hai người ─────────
export interface Ball { x: number; y: number; strokes: number; done: boolean }
export interface Golf { hole: number; balls: Record<string, Ball>; turn: string; total: Record<string, number>; over: boolean; last: { by: string; hole: number; vx: number; vy: number; from: { x: number; y: number }; water: boolean; holed: boolean } | null }

export function startGolf(a: string, b: string, first: string): Golf {
  const t = find(HOLES[0], 'T');
  return { hole: 0, balls: { [a]: { ...t, strokes: 0, done: false }, [b]: { ...t, strokes: 0, done: false } }, turn: first, total: { [a]: 0, [b]: 0 }, over: false, last: null };
}

/** Một cú đánh của `who`; tự chuyển lượt, sang lỗ mới khi cả hai xong */
export function shoot(g: Golf, who: string, vx: number, vy: number): Golf {
  if (g.over || g.turn !== who) return g;
  const h = HOLES[g.hole];
  const b = g.balls[who];
  const sp = Math.sqrt(vx * vx + vy * vy);
  if (sp > MAX_POWER) { vx = (vx / sp) * MAX_POWER; vy = (vy / sp) * MAX_POWER; }
  const r = simulate(h, b.x, b.y, vx, vy);
  const strokes = b.strokes + 1 + (r.water ? 1 : 0);
  const done = r.holed || strokes >= MAX_STROKES;
  const balls = { ...g.balls, [who]: { x: r.x, y: r.y, strokes: done && !r.holed ? MAX_STROKES : strokes, done } };
  const ids = Object.keys(balls);
  const other = ids.find(u => u !== who)!;
  const last = { by: who, hole: g.hole, vx, vy, from: { x: b.x, y: b.y }, water: r.water, holed: r.holed };
  if (ids.every(u => balls[u].done)) {
    const total = Object.fromEntries(ids.map(u => [u, g.total[u] + balls[u].strokes]));
    const next = g.hole + 1;
    if (next >= HOLES.length) return { ...g, balls, total, over: true, last };
    const t = find(HOLES[next], 'T');
    // Lỗ sau: ai ít gậy hơn ở lỗ vừa rồi đánh trước
    const first = balls[who].strokes <= balls[other].strokes ? who : other;
    return { hole: next, balls: Object.fromEntries(ids.map(u => [u, { ...t, strokes: 0, done: false }])), turn: first, total, over: false, last };
  }
  return { ...g, balls, turn: balls[other].done ? who : other, last };
}
