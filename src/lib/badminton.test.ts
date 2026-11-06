import { describe, expect, it } from 'vitest';
import { landT, landX, NET_H, NET_X, plan, posAt } from './badminton';

describe('cầu lông', () => {
  it('mọi cú đánh đều qua lưới và rơi trong sân bên kia', () => {
    for (const x0 of [1, 4, 8.5, 9.6]) for (const y0 of [0.6, 1.2, 2.4]) for (const r of [0, 0.5, 1]) for (const smash of [false, true]) {
      const s = plan('a', x0, y0, 1, smash, r);
      const tn = (NET_X - x0) / s.vx;
      expect(posAt(s, tn).y, `${x0} ${y0} ${r} ${smash}`).toBeGreaterThan(NET_H);
      expect(landX(s)).toBeGreaterThan(NET_X + 1);
      expect(landX(s)).toBeLessThan(20);
      const m = plan('b', 20 - x0, y0, -1, smash, r);
      expect(landX(m)).toBeLessThan(NET_X - 1);
      expect(landX(m)).toBeGreaterThan(0);
    }
  });
  it('đập cầu nhanh hơn đánh cao', () => {
    expect(landT(plan('a', 5, 2.4, 1, true, 0.5))).toBeLessThan(landT(plan('a', 5, 2.4, 1, false, 0.5)));
  });
});
