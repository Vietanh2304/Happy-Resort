import { describe, expect, it } from 'vitest';
import type { Decor } from './api';
import { floorDepth, whyNot } from './placement';
import { WALL_L } from './world';

const D = (id: string, item_id: string, x: number, y: number): Decor => ({ id, item_id, x, y, rot: 0, island: 'bedroom' } as Decor);
// zIndex mặc định giống trong game: y màn hình của góc trước (x + y càng lớn càng gần người xem)
const base = (d: Decor) => (d.x + d.y) * 10;

describe('thứ tự vẽ đồ trong phòng', () => {
  it('đèn đứng phía trước giường to thì không bị giường che', () => {
    const bed = D('bed', 'bed', 2, 3);           // chiếm x 1..2, y 1..3
    const lamp = D('lamp', 'floor_lamp', 3, 1);  // ngay bên phải phía trước giường
    const z = floorDepth('bedroom', [bed, lamp], base);
    expect(z.get('lamp')!).toBeGreaterThan(z.get('bed')!);
  });
  it('đèn đứng trước tủ thì vẽ đè lên tủ', () => {
    const wardrobe = D('w', 'wardrobe', 4, 0);   // x 3..4, y 0
    const lamp = D('lamp', 'floor_lamp', 3, 1);
    const z = floorDepth('bedroom', [wardrobe, lamp], base);
    expect(z.get('lamp')!).toBeGreaterThan(z.get('w')!);
  });
  it('món ở sau giường thì vẫn bị giường che', () => {
    const bed = D('bed', 'bed', 2, 3);
    const stand = D('n', 'nightstand', 1, 0);    // sau đầu giường
    const z = floorDepth('bedroom', [bed, stand], base);
    expect(z.get('bed')!).toBeGreaterThan(z.get('n')!);
  });
});

describe('đồ treo được', () => {
  it('đèn lồng, khung ảnh treo lên tường hoặc đặt dưới sàn đều được', () => {
    for (const id of ['lantern', 'photo_frame', 'guitar', 'chime']) {
      expect(whyNot('bedroom', id, 3, WALL_L, [])).toBeNull();
      expect(whyNot('bedroom', id, 3, 4, [])).toBeNull();
    }
  });
  it('ấm trà thì không treo lên tường', () => {
    expect(whyNot('bedroom', 'teapot', 3, WALL_L, [])).toMatch(/sàn/);
  });
});
