import { describe, expect, it } from 'vitest';
import { villageWeather } from './villageWeather';

describe('trời chung trong làng', () => {
  const t = Date.UTC(2026, 10, 6, 5);
  it('hai người cùng cặp thấy cùng trời', () => expect(villageWeather('c1', t, 11)).toEqual(villageWeather('c1', t + 60_000, 11)));
  it('tuyết chỉ có vào mùa đông; mùa đông thỉnh thoảng mới mưa, tuyết nhiều hơn mưa', () => {
    let rain = 0, snow = 0;
    for (let i = 0; i < 400; i++) {
      const at = t + i * 3 * 3600_000;
      expect(villageWeather('c1', at, 7).type).not.toBe('snow');
      const w = villageWeather('c1', at, 1);
      if (w.type === 'rain') rain++;
      if (w.type === 'snow') { snow++; expect(w.temp).toBeLessThanOrEqual(1); }
    }
    expect(rain).toBeLessThan(400 * 0.15);
    expect(snow).toBeGreaterThan(rain);
  });
  it('trời có đổi theo thời gian', () => {
    const types = new Set(Array.from({ length: 40 }, (_, i) => villageWeather('c1', t + i * 3 * 3600_000, 6).type));
    expect(types.size).toBeGreaterThan(1);
  });
});
