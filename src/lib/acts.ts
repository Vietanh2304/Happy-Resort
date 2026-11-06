// Chuỗi động tác (khung hình trong ACTS của chibi.ts), mỗi khung ~FRAME_MS.
export const ANIM = {
  throw: [0, 0, 1, 1, 1],
  splash: [3, 12, 3, 12, 3, 12, 3, 12],
  row: [4, 4, 5, 5],
  swing: [6, 7, 7],
  golf: [8, 8, 8, 9, 9, 9],
  flick: [10, 10, 10, 10],
  ouch: [11, 11, 11, 11, 11, 11],
  cheer: [12, 3, 12, 3, 12],
  chop: [13, 14],
  wash: [4, 5],
  rummage: [4, 5, 4, 5],
} as const;
export type AnimName = keyof typeof ANIM;
export const FRAME_MS = 140;
export interface Act { n: AnimName; at: number }

/** Khung động tác đang diễn (null nếu đã xong) */
export function actFrame(a: Act | null | undefined, now: number): number | null {
  if (!a) return null;
  const seq = ANIM[a.n];
  const i = Math.floor((now - a.at) / FRAME_MS);
  return i >= 0 && i < seq.length ? seq[i] : null;
}
export const actMs = (n: AnimName) => ANIM[n].length * FRAME_MS;
