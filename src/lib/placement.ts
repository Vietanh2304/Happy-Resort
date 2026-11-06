// Luật đặt đồ trang trí: sàn/tường trong phòng, ô vườn ngoài làng, đồ to chiếm nhiều ô.
import type { Decor } from './api';
import { placeOf, sizeOf } from './furniture';
import { FARM, GARDEN, RESERVED, ROOM, WALL_L, WALL_R } from './world';

export const OUTDOOR_ISLANDS = ['garden', 'farm'];
export const ROOM_ISLANDS = ['house', 'bedroom', 'bathroom'];
export const isWallCell = (island: string, y: number) => ROOM_ISLANDS.includes(island) && (y === WALL_L || y === WALL_R);

/** Kích thước sau khi xoay: xoay thì đổi chiều rộng/sâu */
export const rotSize = (itemId: string, rot = 0): [number, number] => { const [w, d] = sizeOf(itemId); return rot ? [d, w] : [w, d]; };

/** Các ô một món chiếm khi neo ở (x, y) — ô neo là ô gần người xem nhất */
export function cellsOf(island: string, itemId: string, x: number, y: number, rot = 0): [number, number][] {
  if (isWallCell(island, y)) return [[x, y]];
  const [w, d] = rotSize(itemId, rot);
  const out: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([x - i, y - j]);
  return out;
}

function inBounds(island: string, x: number, y: number) {
  if (island === 'garden') return x >= 0 && y >= 0 && x < GARDEN.cols && y < GARDEN.rows;
  if (island === 'farm') return x >= 0 && y >= 0 && x < FARM.cols && y < FARM.rows;
  if (isWallCell(island, y)) return x >= 0 && x < ROOM.n;
  return x >= 0 && y >= 0 && x < ROOM.n && y < ROOM.n;
}

/** Món đồ đang chiếm ô (x, y), nếu có */
export function occupant(island: string, decor: Decor[], x: number, y: number): Decor | undefined {
  return decor.find(d => d.island === island && cellsOf(island, d.item_id, d.x, d.y, d.rot ?? 0).some(([cx, cy]) => cx === x && cy === y));
}

/** null = đặt được; còn lại là lý do không đặt được */
export function whyNot(island: string, itemId: string, x: number, y: number, decor: Decor[], ignoreId?: string, blocked?: (x: number, y: number) => boolean, rot = 0): string | null {
  const place = placeOf(itemId);
  const wall = isWallCell(island, y);
  if (island === 'garden' || island === 'farm') {
    if (place === 'floor' || place === 'wall') return 'Món này để trong nhà thôi';
  } else {
    if (place === 'garden') return 'Món này để ngoài vườn nhé';
    if (place === 'wall' && !wall) return 'Món này treo lên tường nhé';
    if (place !== 'wall' && wall) return 'Món này đặt trên sàn nhé';
  }
  for (const [cx, cy] of cellsOf(island, itemId, x, y, rot)) {
    if (!inBounds(island, cx, cy)) return 'Món này to quá, chọn chỗ rộng hơn nhé';
    if (RESERVED[island]?.(cx, cy)) return 'Chỗ này đã có đồ cố định rồi';
    if (blocked?.(cx, cy)) return 'Ô này đang trồng cây rồi';
    const o = occupant(island, decor, cx, cy);
    if (o && o.id !== ignoreId) return 'Chỗ này vướng đồ khác rồi';
  }
  return null;
}
