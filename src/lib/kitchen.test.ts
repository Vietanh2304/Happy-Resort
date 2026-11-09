import { describe, expect, it } from 'vitest';
import { act, CHAIRS, CHOP_N, COLS, dishOf, HEAT, LAYOUT, MEAL_MS, newRoom, ROWS, stageOf, tick, walkable, WASH_N, type Room } from './kitchen';

const A = 'a', B = 'b';
const find = (c: string) => { for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (LAYOUT[y][x] === c) return [x, y] as const; throw c; };
const F = find('F'), BOARD = find('B'), STOVE = find('S'), P = find('P'), K = find('K'), D = find('D');
const COUNTER = [4, 3] as const; // quầy giữa phòng
const doAll = (r: Room, steps: [string, readonly [number, number], number, object?][]) => {
  const used: string[] = [];
  for (const [who, [x, y], t, o] of steps) { const res = act(r, who, x, y, t, o); r = res.r; used.push(...(res.used ?? [])); }
  return { r, used };
};

describe('phòng bếp', () => {
  it('mọi chỗ trong bếp đều đi tới được', () => {
    const seen = new Set<string>(['2,1']);
    const q = [[2, 1]];
    while (q.length) {
      const [x, y] = q.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = [x + dx, y + dy];
        if (walkable(n[0], n[1]) && !seen.has(n.join())) { seen.add(n.join()); q.push(n); }
      }
    }
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (LAYOUT[y][x] === '.' || LAYOUT[y][x] === 'C') continue;
      const ok = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has(`${x + dx},${y + dy}`));
      expect(ok, `${LAYOUT[y][x]} ở ${x},${y}`).toBe(true);
    }
  });

  it('lấy đồ, thái, bày đĩa → salad; tủ chỉ bị trừ khi bắt đầu dùng', () => {
    let r = newRoom(A);
    let res = act(r, A, ...F, 0, { pick: 'tomato' });
    expect(res.used).toEqual([]);
    res = act(res.r, A, ...F, 0);                 // cất lại tủ: không mất gì
    expect(res.r.hands[A]).toBeNull();
    const out = doAll(res.r, [
      [A, F, 0, { pick: 'tomato' }], [A, BOARD, 0],
      ...Array.from({ length: CHOP_N }, () => [A, BOARD, 0] as [string, readonly [number, number], number]),
      [A, BOARD, 0],                                // nhấc cà chua đã thái
      [B, P, 0], [B, COUNTER, 0],                   // B lấy đĩa đặt lên quầy
      [A, COUNTER, 0],                              // A bỏ cà chua vào đĩa
      [B, F, 0, { pick: 'carrot' }], [B, BOARD, 0],
      ...Array.from({ length: CHOP_N + 1 }, () => [B, BOARD, 0] as [string, readonly [number, number], number]),
      [B, COUNTER, 0],
    ]);
    r = out.r;
    expect(out.used.sort()).toEqual(['carrot', 'tomato']);
    const plate = r.cells[`${COUNTER[0]},${COUNTER[1]}`];
    expect(plate?.k === 'plate' && dishOf(plate)?.id).toBe('salad');
  });

  it('nấu: múc lúc chín được 3 sao, để quá thì khét', () => {
    let r = newRoom(A);
    r = doAll(r, [[A, F, 0, { pick: 'corn' }], [A, STOVE, 0]]).r;   // ngô không cần thái
    r = doAll(r, [[A, F, 0, { pick: 'potato' }], [A, BOARD, 0], ...Array.from({ length: CHOP_N + 1 }, () => [A, BOARD, 0] as [string, readonly [number, number], number]), [A, STOVE, 1000]]).r;
    const pot = r.cells[`${STOVE[0]},${STOVE[1]}`]!;
    expect(pot.k === 'pot' && stageOf(pot, 1000 + 1000)).toBe('raw');
    const okAt = 1000 + (HEAT.S.raw + 1) * 1000;
    expect(pot.k === 'pot' && stageOf(pot, okAt)).toBe('ok');
    expect(pot.k === 'pot' && stageOf(pot, 1000 + (HEAT.S.over + 5) * 1000)).toBe('burnt');
    // B cầm đĩa tới múc
    const out = doAll(r, [[B, P, okAt], [B, STOVE, okAt]]);
    const pl = out.r.hands[B]!;
    expect(pl.k === 'plate' && dishOf(pl)?.id).toBe('corn_soup');
    expect(pl.k === 'plate' && pl.q).toBe(3);
    // Múc khi khét thì không được
    const burnt = act(r, B, ...P, 0).r;
    const dump = act(burnt, B, ...STOVE, 1000 + (HEAT.S.over + 5) * 1000);
    expect(dump.say).toMatch(/khét/i);
    const after = dump.r.cells[`${STOVE[0]},${STOVE[1]}`]!;
    expect(after.k === 'pot' && after.parts.length).toBe(0);              // đổ phần khét ngay tại bếp
  });

  it('máy xay xay quá lâu bị khét: bấm vào là đổ đi được (không bị kẹt)', () => {
    const L = find('L');
    let r = newRoom(A);
    r = doAll(r, [[A, F, 0, { pick: 'strawberry' }], [A, BOARD, 0], ...Array.from({ length: CHOP_N + 1 }, () => [A, BOARD, 0] as [string, readonly [number, number], number]), [A, L, 1000]]).r;
    const at = 1000 + (HEAT.L.over + 5) * 1000;
    const cup = r.cells[`${L[0]},${L[1]}`]!;
    expect(cup.k === 'pot' && stageOf(cup, at)).toBe('burnt');
    const res = act(r, A, ...L, at);
    const after = res.r.cells[`${L[0]},${L[1]}`]!;
    expect(after.k === 'pot' && after.parts.length).toBe(0);
  });

  it('bưng nồi ra khỏi bếp thì ngừng đun, đặt lại thì đun tiếp', () => {
    let r = doAll(newRoom(A), [[A, F, 1000, { pick: 'corn' }], [A, STOVE, 1000]]).r;
    r = act(r, A, ...STOVE, 4000).r;              // nhấc nồi
    const held = r.hands[A]!;
    expect(held.k === 'pot' && held.on).toBe(0);
    expect(held.k === 'pot' && stageOf(held, 99999)).toBe('raw');
    r = act(r, A, ...STOVE, 50000).r;             // đặt lại
    const pot = r.cells[`${STOVE[0]},${STOVE[1]}`]!;
    expect(pot.k === 'pot' && stageOf(pot, 50000 + 6000)).toBe('ok');
  });

  it('bày lên bàn, cùng ngồi ăn → đĩa bẩn → rửa → về kệ', () => {
    let r = newRoom(A);
    r = doAll(r, [
      [A, F, 0, { pick: 'tomato' }], [A, BOARD, 0], ...Array.from({ length: CHOP_N + 1 }, () => [A, BOARD, 0] as [string, readonly [number, number], number]),
      [B, P, 0], [B, D, 0], [A, D, 0],
    ]).r;
    // salad cần cả cà rốt; thêm cà rốt
    r = doAll(r, [[A, F, 0, { pick: 'carrot' }], [A, BOARD, 0], ...Array.from({ length: CHOP_N + 1 }, () => [A, BOARD, 0] as [string, readonly [number, number], number]), [A, D, 0]]).r;
    expect(act(r, A, 0, 0, 0, { eat: true }).say).toMatch(/Ngồi/);
    r = doAll(r, [[A, CHAIRS[0], 0], [B, CHAIRS[1], 0], [A, [0, 0], 0, { eat: true }]]).r;
    expect(r.meal?.both).toBe(true);
    expect(tick(r, 100)).toBeNull();
    r = tick(r, MEAL_MS + 1)!;
    expect(r.last?.dishes).toEqual(['salad']);
    expect(r.last?.coins).toBeGreaterThan(0);
    const clean0 = r.clean;
    r = doAll(r, [[A, [0, 0], 0, { stand: true }], [A, D, 0], [A, K, 0], ...Array.from({ length: WASH_N }, () => [A, K, 0] as [string, readonly [number, number], number])]).r;
    expect(r.sink.n).toBe(0);
    expect(r.clean).toBe(clean0 + 1);
  });
});
