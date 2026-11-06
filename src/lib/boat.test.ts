import { describe, expect, it } from 'vitest';
import { seaMap, startBoat, step, stroke, type Boat } from './boat';

const run = (b: Boat, secs: number) => { for (let i = 0; i < secs * 60; i++) b = step(b, 1 / 60, []); return b; };

describe('chèo thuyền đôi', () => {
  it('hai người chèo cùng nhịp thì đi thẳng và nhanh hơn', () => {
    let b = startBoat();
    for (let k = 0; k < 4; k++) { b = stroke(b, 'L', k * 1000); b = stroke(b, 'R', k * 1000 + 100); b = run(b, 1); }
    expect(Math.abs(b.a)).toBeLessThan(0.5);
    expect(startBoat().y - b.y).toBeGreaterThan(5);
  });
  it('chỉ chèo một bên thì thuyền quay vòng', () => {
    let b = startBoat();
    for (let k = 0; k < 4; k++) { b = stroke(b, 'L', k * 1000); b = run(b, 1); }
    expect(b.a).toBeGreaterThan(1.5);
    let c = startBoat();
    for (let k = 0; k < 4; k++) { c = stroke(c, 'R', k * 1000); c = run(c, 1); }
    expect(c.a).toBeLessThan(-1.5);
  });
  it('bản đồ biển giống nhau trên hai máy, đồ trôi không nằm trên đảo', () => {
    const m = seaMap('abc');
    expect(seaMap('abc')).toEqual(m);
    expect(m.loot).toHaveLength(10);
    for (const l of m.loot) for (const r of m.rocks) expect(Math.hypot(l.x - r.x, l.y - r.y)).toBeGreaterThan(r.r);
  });
});
