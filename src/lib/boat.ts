// 🛶 Chèo thuyền đôi: mỗi người một mái chèo. Chèo trái → thuyền quẹo phải, chèo phải → quẹo trái;
// hai người chèo cùng nhịp (cách nhau dưới SYNC_MS) thì lực xoay triệt tiêu và được thêm đà → lao thẳng.
import { seeded } from './rng';

export const SEA_W = 30, SEA_H = 20, SYNC_MS = 450, ROUND_MS = 90000;
export interface Boat { x: number; y: number; a: number; v: number; w: number; lastL: number; lastR: number }
export interface Rock { x: number; y: number; r: number; isle?: boolean }
export interface Loot { x: number; y: number; id: string }

export const startBoat = (): Boat => ({ x: SEA_W / 2, y: SEA_H - 2.5, a: 0, v: 0, w: 0, lastL: -1e12, lastR: -1e12 });

/** Một nhát chèo bên `side` lúc `t` (ms) */
export function stroke(b: Boat, side: 'L' | 'R', t: number): Boat & { sync: boolean } {
  const other = side === 'L' ? b.lastR : b.lastL;
  const sync = t - other < SYNC_MS;
  const turn = side === 'L' ? 1.4 : -1.4;
  return {
    ...b,
    v: Math.min(5, b.v + 1.2 + (sync ? 0.8 : 0)),
    // Cùng nhịp: nhát này gỡ lại phần xoay của nhát bên kia
    w: sync ? b.w * 0.2 : b.w + turn,
    lastL: side === 'L' ? t : b.lastL,
    lastR: side === 'R' ? t : b.lastR,
    sync,
  };
}

/** Tiến thời gian dt giây: trôi theo hướng mũi thuyền, nước cản dần; đâm đá thì dội lại */
export function step(b: Boat, dt: number, rocks: Rock[]): Boat {
  let x = b.x + Math.sin(b.a) * b.v * dt, y = b.y - Math.cos(b.a) * b.v * dt;
  let v = b.v * Math.exp(-0.6 * dt);
  const a = b.a + b.w * dt, w = b.w * Math.exp(-2.2 * dt);
  for (const r of rocks) {
    const dx = x - r.x, dy = y - r.y, d = Math.hypot(dx, dy), min = r.r + 0.7;
    if (d < min) { x = r.x + (dx / (d || 1)) * min; y = r.y + (dy / (d || 1)) * min; v = -Math.abs(v) * 0.3; }
  }
  if (x < 0.8 || x > SEA_W - 0.8 || y < 0.8 || y > SEA_H - 0.8) { x = Math.max(0.8, Math.min(SEA_W - 0.8, x)); y = Math.max(0.8, Math.min(SEA_H - 0.8, y)); v *= -0.3; }
  return { ...b, x, y, v, a, w };
}

const LOOT = ['shell', 'starfish', 'bottle', 'seaglass', 'coconut', 'driftwood', 'pebble'];
/** Bản đồ biển theo hạt giống: đảo, đá ngầm và đồ trôi */
export function seaMap(seed: string): { rocks: Rock[]; loot: Loot[] } {
  const r = seeded(`sea:${seed}`);
  const rocks: Rock[] = [{ x: 6, y: 5, r: 2.2, isle: true }, { x: 24, y: 7, r: 2.6, isle: true }, { x: 14, y: 10, r: 1.6, isle: true }];
  for (let i = 0; i < 6; i++) rocks.push({ x: 2 + r() * (SEA_W - 4), y: 2 + r() * (SEA_H - 7), r: 0.6 });
  const loot: Loot[] = [];
  while (loot.length < 10) {
    const x = 1.5 + r() * (SEA_W - 3), y = 1.5 + r() * (SEA_H - 5);
    if (rocks.some(k => Math.hypot(k.x - x, k.y - y) < k.r + 1.4) || loot.some(l => Math.hypot(l.x - x, l.y - y) < 2)) continue;
    loot.push({ x, y, id: LOOT[Math.floor(r() * LOOT.length)] });
  }
  return { rocks, loot };
}
export const grabbed = (b: Boat, l: Loot) => Math.hypot(b.x - l.x, b.y - l.y) < 1.3;
