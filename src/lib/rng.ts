// RNG có seed: cùng seed (vd. user_id + ngày) luôn cho cùng kết quả, nên tải lại trang không đổi.

export function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  // mulberry32
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T extends { w: number }>(rand: () => number, list: T[]): T | undefined {
  const total = list.reduce((s, x) => s + Math.max(0, x.w), 0);
  if (total <= 0) return undefined;
  let r = rand() * total;
  for (const x of list) {
    r -= Math.max(0, x.w);
    if (r < 0) return x;
  }
  return list[list.length - 1];
}

export function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length)];
}
