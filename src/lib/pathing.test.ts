import { describe, expect, it } from 'vitest';
import type { Decor } from './api';
import { findPath, isBlocked } from './pathing';
import { roomPt, TOWN, type Pt, type SceneId } from './world';

/** Đi theo đường tìm được, lấy mẫu dày: không điểm nào được nằm trong đồ vật */
function clear(scene: SceneId, decor: Decor[], from: Pt, path: Pt[]) {
  let a = from;
  for (const b of path) {
    for (let i = 1; i <= 20; i++) {
      const p = { x: a.x + ((b.x - a.x) * i) / 20, y: a.y + ((b.y - a.y) * i) / 20 };
      if (isBlocked(scene, decor, p)) return false;
    }
    a = b;
  }
  return true;
}

describe('tìm đường', () => {
  const bed: Decor = { id: 'b', owner_id: 'x', island: 'bedroom', item_id: 'bed', x: 4, y: 5 };
  it('trong phòng: đi vòng qua giường', () => {
    const from = roomPt(4.5, 1.2), to = roomPt(3.5, 7.2);
    const path = findPath('bedroom', [bed], from, to);
    expect(path.length).toBeGreaterThan(1);
    expect(clear('bedroom', [bed], from, path)).toBe(true);
    expect(path[path.length - 1]).toEqual(to);
  });
  it('chạm vào đồ vật thì dừng ở chỗ trống cạnh nó', () => {
    const path = findPath('bedroom', [bed], roomPt(1, 1), roomPt(3.5, 4.5));
    expect(isBlocked('bedroom', [bed], path[path.length - 1])).toBe(false);
  });
  it('ngoài làng: không đi xuyên đài phun nước', () => {
    const from = { x: TOWN.fountain.x, y: 130 }, to = { x: TOWN.fountain.x, y: 196 };
    const path = findPath('town', [], from, to);
    expect(path.length).toBeGreaterThan(1);
    expect(clear('town', [], from, path)).toBe(true);
  });
});
