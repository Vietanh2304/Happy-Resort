// 🏸 Cầu lông nhìn ngang: sân dài 20, lưới ở giữa (x = 10). Quả cầu bay theo parabol cố định
// (tính được vị trí ở mọi thời điểm), nên chỉ cần gửi lúc đánh — hai máy vẽ ra cùng một đường bay.
export const COURT = 20, NET_X = 10, NET_H = 1.55, G = 6, REACH_X = 1.3, REACH_Y = 2.7;
export interface Shot { by: string; x0: number; y0: number; vx: number; vy: number }

/** Lên một cú đánh từ (x0, y0) sang phía `dir` (+1: sang phải). smash: cầu cao → đập nhanh. r: 0..1 chọn điểm rơi */
export function plan(by: string, x0: number, y0: number, dir: 1 | -1, smash: boolean, r: number): Shot {
  const tx = dir > 0 ? NET_X + 1.5 + r * 7.5 : NET_X - 1.5 - r * 7.5;
  // Cầu bay cao, lâu (≈2,2 giây) cho kịp chạy tới đỡ; đập thì nhanh hơn nhưng vẫn đỡ được
  let T = smash ? 1.1 : 2.2;
  for (;;) {
    const vx = (tx - x0) / T, vy = (-y0 + 0.5 * G * T * T) / T;
    const tn = (NET_X - x0) / vx, yn = y0 + vy * tn - 0.5 * G * tn * tn;
    if (yn > NET_H + 0.5 || T >= 3.5) return { by, x0, y0, vx, vy };
    T += 0.15;
  }
}
export const posAt = (s: Shot, t: number) => ({ x: s.x0 + s.vx * t, y: Math.max(0, s.y0 + s.vy * t - 0.5 * G * t * t) });
/** Thời điểm (giây) cầu chạm đất */
export const landT = (s: Shot) => (s.vy + Math.sqrt(s.vy * s.vy + 2 * G * s.y0)) / G;
export const landX = (s: Shot) => s.x0 + s.vx * landT(s);
/** Người đứng ở px có đỡ được cầu đang ở (x, y) không */
export const canHit = (px: number, c: { x: number; y: number }) => Math.abs(c.x - px) < REACH_X && c.y > 0.05 && c.y < REACH_Y;
