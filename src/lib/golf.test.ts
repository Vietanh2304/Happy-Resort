import { describe, expect, it } from 'vitest';
import { find, HOLES, MAX_POWER, shoot, simulate, startGolf, type Golf } from './golf';

const SHOTS: [number, number][] = [];
for (let a = 0; a < 72; a++) for (const p of [0.25, 0.4, 0.55, 0.7, 0.85, 1]) SHOTS.push([Math.cos((a / 72) * Math.PI * 2) * p * MAX_POWER, Math.sin((a / 72) * Math.PI * 2) * p * MAX_POWER]);

/** Ít gậy nhất để vào lỗ (dò mọi hướng/lực, gộp các điểm gần nhau) */
function bestStrokes(h: number, maxDepth: number) {
  let front = [find(HOLES[h], 'T')];
  for (let d = 1; d <= maxDepth; d++) {
    const next = new Map<string, { x: number; y: number }>();
    for (const p of front) for (const [vx, vy] of SHOTS) {
      const r = simulate(HOLES[h], p.x, p.y, vx, vy);
      if (r.holed) return d;
      if (!r.water) next.set(`${Math.round(r.x * 2)},${Math.round(r.y * 2)}`, { x: r.x, y: r.y });
    }
    front = [...next.values()];
  }
  return Infinity;
}

describe('golf mini', () => {
  it('lỗ nào cũng đánh vào được trong vài gậy', () => {
    HOLES.forEach((h, i) => expect(bestStrokes(i, 3), h.name).toBeLessThanOrEqual(h.par + 1));
  }, 60000);
  it('mô phỏng tất định', () => {
    const a = simulate(HOLES[1], 1.5, 1.5, 9, 4), b = simulate(HOLES[1], 1.5, 1.5, 9, 4);
    expect(a).toEqual(b);
  });
  it('rơi xuống nước: phạt 1 gậy, về chỗ cũ', () => {
    const h = HOLES[3], t = find(h, 'T');
    const g0 = startGolf('a', 'b', 'a');
    const g = shoot({ ...g0, hole: 3, balls: { a: { ...t, strokes: 0, done: false }, b: { ...t, strokes: 0, done: false } } }, 'a', 0, MAX_POWER);
    expect(g.balls.a).toMatchObject({ x: t.x, y: t.y, strokes: 2 });
    expect(h).toBeTruthy();
  });
  it('cả hai xong thì sang lỗ mới, cộng tổng gậy', () => {
    let g: Golf = startGolf('a', 'b', 'a');
    for (let i = 0; i < 20 && g.hole === 0; i++) g = shoot(g, g.turn, 0.5, 0);
    expect(g.hole).toBe(1);
    expect(g.total.a).toBe(8);
    expect(g.total.b).toBe(8);
  });
});
