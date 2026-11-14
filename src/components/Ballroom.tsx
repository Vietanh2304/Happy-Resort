// Cặp đôi khiêu vũ thật sự "chạm" vào nhau: hai nhân vật dựng bằng khung xương (đầu lấy từ nhân vật thật, thân/tay/chân/váy vẽ theo tư thế),
// tự nhảy theo thể loại nhạc đang phát (waltz, lãng mạn, tango, swing, cha-cha, disco); mỗi nhịp bấm trúng là một động tác phô diễn
// (nhấc bổng, xoay dưới tay, ngả người, lướt ra…). Mọi thứ tính từ đồng hồ chung nên hai máy thấy giống nhau.
import { useEffect, useRef } from 'react';
import { dancerKit, inkOutline, type DancerKit } from '../lib/chibi';
import type { AvatarLook } from '../lib/sprites';
import { mix } from '../lib/pixel';
import { danceStage } from '../lib/danceStage';
import { arrowMs, TUNES, type DanceMood } from '../lib/tunes';
import { useScale } from './Stage';
import { avatarPx } from './Avatar';

const TAU = Math.PI * 2, HIP = 13.5, TORSO = 12, ARM = 6, LEG = 6;
const OW = 216, OH = 156, OX = 108, OY = 142, B = 1.5;   // B: thân/tay/chân kéo dài gấp rưỡi (đầu giữ nguyên) cho dáng khiêu vũ thanh thoát       // khổ canvas phụ (đơn vị = nửa pixel nhân vật), gốc = điểm giữa hai người trên sàn
type V2 = [number, number];
type Arm = V2 | 'J' | 'J2' | 'pBack' | 'pWaist' | 'pShoulder' | 'pNeck' | 'down' | 'hip' | 'out' | 'outUp' | 'up' | 'skirt';
/** tư thế một người: x = vị trí hông, y = độ cao hông; lean = nghiêng thân (+ = chúi về phía đang nhìn); turn = góc xoay người (0 nghiêng, π/2 quay ra, π quay lưng lại bạn nhảy, 3π/2 quay vào) */
interface D { x: number; y: number; dir: 1 | -1; lean: number; head: number; turn: number; shut?: boolean; a1: Arm; a2: Arm; late1?: boolean; late2?: boolean; f1: V2; f2: V2; sway: number; flare?: number }
interface Pair { L: D; F: D; front: 'L' | 'F'; J: V2; J2?: V2; fx?: 'hearts' | 'spark' }
/** tư thế đã giải xong (toạ độ tuyệt đối) — trộn được giữa hai tư thế */
interface R { hip: V2; lean: number; head: number; turn: number; dir: 1 | -1; shut: boolean; h1: V2; h2: V2; late1: boolean; late2: boolean; f1: V2; f2: V2; sway: number; flare: number }

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
const bell = (q: number, a = 0.22, b = 0.78) => ease(q / a) * (1 - ease((q - b) / (1 - b)));
const lerp = (a: number, b: number, w: number) => a + (b - a) * w;
const lv = (a: V2, b: V2, w: number): V2 => [lerp(a[0], b[0], w), lerp(a[1], b[1], w)];

// ───────── tư thế cơ bản ─────────
const stand = (x: number, dir: 1 | -1): D => ({ x, y: HIP, dir, lean: 0, head: 0, turn: 0, a1: 'down', a2: 'down', f1: [x + dir * 1.5, 0], f2: [x - dir * 1.5, 0], sway: 0 });
/** bước chân: hai bàn chân đổi chỗ trước sau, bàn nào đang đưa thì nhấc nhẹ */
const walk = (d: D, ph: number, stride: number) => { const s = Math.sin(TAU * ph), c = Math.cos(TAU * ph); d.f1 = [d.x + d.dir * 1.5 + stride * s, Math.max(0, c) * 1.4]; d.f2 = [d.x - d.dir * 1.5 - stride * s, Math.max(0, -c) * 1.4]; };
/** ôm kiểu khiêu vũ cổ điển: tay xa nắm nhau đưa ra ngoài, tay gần của nam đỡ lưng nữ, tay gần của nữ đặt lên vai nam */
function hold(o: { sep?: number; bob?: number; sw?: number; ph?: number; stride?: number; lL?: number; lF?: number; hL?: number; hF?: number; jx?: number; jy?: number } = {}): Pair {
  const sep = o.sep ?? 15, sw = o.sw ?? 0, y = HIP + (o.bob ?? 0);
  const L = stand(-sep / 2 + sw, 1), F = stand(sep / 2 + sw, -1);
  L.y = F.y = y; L.lean = o.lL ?? -0.13; F.lean = o.lF ?? -0.24; L.head = o.hL ?? 0.04; F.head = o.hF ?? 0.02;
  L.a2 = 'J'; F.a2 = 'J'; L.a1 = 'pBack'; L.late1 = true; F.a1 = 'pShoulder';
  if (o.ph !== undefined) { walk(L, o.ph, o.stride ?? 3); walk(F, o.ph, o.stride ?? 3); }
  return { L, F, front: 'F', J: [F.x + 10 + (o.jx ?? 0), y + TORSO - 2 + (o.jy ?? 0)] };
}
/** cả cặp xoay quanh nhau góc th (0 = nam bên trái): ép ngang theo cos, qua nửa vòng thì đổi bên; lúc xoay ngang thì người phía trước quay lưng, người sau quay mặt ra */
function rot(p: Pair, th: number, cx = 0): Pair {
  const c = Math.cos(th), s = Math.sin(th), k = Math.abs(c) < 0.12 ? (c < 0 ? -0.12 : 0.12) : c;
  const X = (x: number) => cx + (x - cx) * k;
  const fix = (d: D, near: boolean): D => ({ ...d, x: X(d.x), dir: (k < 0 ? -d.dir : d.dir) as 1 | -1, f1: [X(d.f1[0]), d.f1[1]], f2: [X(d.f2[0]), d.f2[1]], a1: typeof d.a1 === 'string' ? d.a1 : [X(d.a1[0]), d.a1[1]], a2: typeof d.a2 === 'string' ? d.a2 : [X(d.a2[0]), d.a2[1]], turn: Math.abs(c) < 0.3 ? (near ? 1.5 : 0.5) * Math.PI : d.turn });
  const frontIsF = (p.front === 'F') === (s >= 0 || Math.abs(c) > 0.45);
  return { ...p, L: fix(p.L, !frontIsF), F: fix(p.F, frontIsF), front: frontIsF ? 'F' : 'L', J: [X(p.J[0]), p.J[1]], J2: p.J2 ? [X(p.J2[0]), p.J2[1]] : undefined };
}
/** lật cả cặp trái ↔ phải */
const mirror = (p: Pair): Pair => rot(p, Math.PI);

// ───────── các thế nhảy (q = 0..1 trong một đơn vị nhạc) ─────────
const FIG: Record<string, (q: number, k: number) => Pair> = {
  // chờ nhạc: ôm nhau khẽ đung đưa
  idle: q => hold({ bob: 0.25 * Math.sin(TAU * q), sw: 0.8 * Math.sin(TAU * q) }),
  // waltz: xuống ở phách 1, nhón lên ở phách 2–3, lướt sang ngang
  waltz: (q, k) => hold({ bob: 1.3 * Math.sin(Math.PI * q) - 0.5, sw: (k % 2 ? -3 : 3) * Math.sin(Math.PI * q) * (q < 0.5 ? 1 : 1), ph: q, stride: 3.2, lF: -0.27, jy: 1 }),
  // xoay nửa vòng theo chiều kim đồng hồ
  turn: q => rot(hold({ bob: 1.1 * Math.abs(Math.sin(TAU * q)) - 0.4, ph: q * 2, stride: 2.4, lF: -0.3 }), TAU * (q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q))),
  // nữ xoay một vòng dưới tay nam, váy xoè
  twirl: q => { const p = hold({ sep: 16 }), t = ease(q); p.F.turn = TAU * t; p.F.y += 0.8 * Math.sin(Math.PI * q); p.F.lean = 0; p.F.a1 = 'out'; p.F.flare = Math.sin(Math.PI * q) * 1.6; p.F.f1 = [p.F.x - 1, 0.6]; p.F.f2 = [p.F.x + 1, 0]; p.L.a1 = 'hip'; p.L.late1 = false; p.L.lean = 0; p.J = [p.F.x - 1, p.F.y + TORSO + 15.5]; p.fx = 'spark'; return p; },
  // ngả người sâu: nam khuỵu gối đỡ lưng, nữ ngả ra sau, một chân duỗi cao
  dip: q => { const t = bell(q), p = hold();
    p.L.x = -6; p.L.y = HIP - 2.2 * t; p.L.lean = 0.5 * t - 0.1 * (1 - t); p.L.head = 0.18 * t; p.L.f1 = [p.L.x + 2 + 7 * t, 0]; p.L.f2 = [p.L.x - 2 - 4 * t, 0]; p.L.a2 = 'pBack';
    p.F.x = 6 + 3 * t; p.F.y = HIP - 4.5 * t; p.F.lean = -0.22 - 0.95 * t; p.F.head = -0.25 * t; p.F.shut = t > 0.4; p.F.f2 = [p.F.x - 2 - 6 * t, 0]; p.F.f1 = [p.F.x - 3 - 8 * t, 10 * t]; p.F.a2 = 'pNeck'; p.F.a1 = t > 0.3 ? 'out' : 'pShoulder'; p.F.flare = 0.5 * t;
    return p; },
  // ngả kiểu tango (corte): nữ ngả nhẹ trên chân sau duỗi thẳng, nam chồm tới
  corte: q => { const t = bell(q), p = hold({ jy: 2 * t, jx: 2 * t });
    p.L.y = HIP - 1.6 * t; p.L.lean = -0.1 + 0.42 * t; p.L.f1 = [p.L.x + 2 + 5 * t, 0]; p.L.f2 = [p.L.x - 2 - 3 * t, 0];
    p.F.y = HIP - 1.2 * t; p.F.lean = -0.22 - 0.42 * t; p.F.head = -0.2 * t; p.F.f1 = [p.F.x + 2 + 9 * t, 0]; p.F.f2 = [p.F.x - 2 - 2 * t, 0]; p.F.flare = 0.4 * t;
    return p; },
  // nhấc bổng: nam ôm eo nâng nữ lên cao, nữ dang tay
  lift: q => { const t = bell(q, 0.3, 0.7), dipk = Math.sin(Math.PI * clamp(q / 0.3)) * (q < 0.3 ? 1 : 0), p = hold({ sep: 13 });
    p.L.y = HIP - 1.6 * dipk; p.L.lean = -0.1 - 0.12 * t; p.L.head = -0.32 * t; p.L.a1 = 'pWaist'; p.L.a2 = 'pWaist'; p.L.late1 = true; p.L.late2 = true; p.L.f1 = [p.L.x + 3, 0]; p.L.f2 = [p.L.x - 3, 0];
    p.F.y = HIP + 15 * t; p.F.x = 6.5 - 3 * t; p.F.lean = -0.22 + 0.1 * t; p.F.head = 0.1 * t; p.F.a1 = t > 0.25 ? 'outUp' : 'pShoulder'; p.F.a2 = t > 0.25 ? 'up' : 'J'; p.F.f1 = [p.F.x - 1 - 2 * t, 15 * t + 0.01]; p.F.f2 = [p.F.x + 2 + 5 * t, 15 * t + 5 * t]; p.F.flare = 0.8 * t;
    p.J = [p.F.x + 9, p.F.y + TORSO]; p.fx = 'spark'; return p; },
  // tango đi dạo (promenade): cả hai cùng quay mặt về một hướng, tay nắm chĩa thẳng phía trước, bước dứt khoát
  prom: (q, k) => { const y = HIP - 0.7 * Math.abs(Math.sin(TAU * q)), L = stand(-5, 1), F = stand(4, 1);
    L.y = F.y = y; L.lean = F.lean = 0.12; L.head = -0.05; F.head = -0.05; walk(L, q, 4.4); walk(F, q + 0.5, 4.4);
    L.a2 = 'J'; L.a1 = 'pBack'; F.a1 = 'J'; F.late1 = true; F.a2 = 'down';
    const p: Pair = { L, F, front: 'F', J: [F.x + 12, y + TORSO - 3] }; return k % 2 ? mirror(p) : p; },
  // swing: ôm sát, nhún nhảy theo nhịp
  bounce: (q, k) => hold({ bob: -1.1 * Math.abs(Math.sin(TAU * q)), sw: (k % 2 ? -2 : 2) * Math.sin(TAU * q), ph: q * 2, stride: 2.6, lL: -0.05, lF: -0.15, jy: 2 * Math.sin(TAU * q * 2) }),
  // swing-out: bung ra hết tầm tay rồi kéo vào, đá chân kiểu Charleston
  swingout: q => { const t = bell(q, 0.3, 0.7), sep = 15 + 17 * t, y = HIP - 0.9 * Math.abs(Math.sin(TAU * q * 2)), k = Math.max(0, Math.sin(TAU * q * 2));
    const L = stand(-sep / 2, 1), F = stand(sep / 2, -1); L.y = F.y = y; L.lean = F.lean = -0.2 * t;
    L.a1 = 'J'; F.a1 = 'J'; L.late1 = F.late1 = true; L.a2 = t > 0.3 ? 'outUp' : 'pBack'; F.a2 = t > 0.3 ? 'outUp' : 'pShoulder';
    L.f1 = [L.x + 2 + 5 * k * t, 4.5 * k * t]; F.f1 = [F.x - 2 - 5 * k * t, 4.5 * k * t]; F.flare = 0.7 * t;
    return { L, F, front: 'F', J: [0, y + 6 - 2 * t] }; },
  // cha-cha: hai tay nắm nhau, lắc hông, bước chùm "cha-cha-cha"
  cha: (q, k) => { const tri = q > 0.5 ? 1.3 * Math.sin(TAU * 3 * (q - 0.5) * 2) : 0, sw = (k % 2 ? -1 : 1) * (4 * Math.sin(Math.PI * q) + tri), y = HIP - 0.5 * Math.abs(Math.sin(TAU * q * 2));
    const L = stand(-9.5 + sw, 1), F = stand(9.5 + sw, -1); L.y = F.y = y; L.lean = 0.12 * Math.sin(TAU * q * 2); F.lean = 0.12 * Math.sin(TAU * q * 2 + Math.PI); L.sway = F.sway = Math.sin(TAU * q * 2);
    walk(L, q * 2, 2.2); walk(F, q * 2, 2.2); L.a1 = 'J'; F.a1 = 'J'; L.a2 = 'J2'; F.a2 = 'J2'; L.late1 = F.late1 = true;
    return { L, F, front: 'F', J: [sw, y + 5 + Math.sin(TAU * q * 2)], J2: [sw + 0.5, y + 8 - Math.sin(TAU * q * 2)] }; },
  // New Yorker: cùng mở người ra phía khán giả, tay ngoài vung cao
  newyork: q => { const t = bell(q), y = HIP - 0.5 * t, L = stand(-7.5, 1), F = stand(7.5, -1);
    L.y = F.y = y; L.turn = F.turn = t > 0.35 ? Math.PI / 2 : 0; L.a1 = 'J'; F.a1 = 'J'; L.late1 = F.late1 = true;
    L.a2 = t > 0.3 ? [L.x - 10, y + TORSO + 4 + 4 * t] : 'J2'; F.a2 = t > 0.3 ? [F.x + 10, y + TORSO + 4 + 4 * t] : 'J2';
    L.f1 = [L.x + 3.5 * t, 0]; L.f2 = [L.x - 2.5, 0]; F.f1 = [F.x - 3.5 * t, 0]; F.f2 = [F.x + 2.5, 0]; F.flare = 0.5 * t;
    return { L, F, front: 'F', J: [0, y + 6], J2: [0.5, y + 9] }; },
  // disco: đứng cạnh nhau quay ra, tay chỉ trời rồi chỉ chéo xuống
  point: (q, k) => { const u = 0.5 - 0.5 * Math.cos(TAU * q), s = k % 2 ? -1 : 1, y = HIP - 0.9 * Math.abs(Math.sin(TAU * q * 2));
    const mk = (x: number, dir: 1 | -1): D => { const d = stand(x, dir); d.y = y; d.turn = Math.PI / 2; d.lean = 0; d.sway = Math.sin(TAU * q * 2) * s; d.f1 = [x + 3.2, 0]; d.f2 = [x - 3.2, 0];
      d.a1 = lv([x + 9 * s, y + TORSO + 11], [x - 6 * s, y + 3], u); d.a2 = 'hip'; d.late1 = true; return d; };
    return { L: mk(-8.5, 1), F: mk(8.5, -1), front: 'F', J: [0, y + 6] }; },
  // disco: chạm hông nhau, hai tay giơ cao lắc lư
  bump: q => { const b = Math.abs(Math.sin(TAU * q * 2)), y = HIP - 0.6 * b;
    const mk = (x: number, dir: 1 | -1, s: number): D => { const d = stand(x - s * 2.6 * b, dir); d.y = y; d.turn = Math.PI / 2; d.lean = 0; d.sway = -s * 2 * b; d.f1 = [d.x + 3, 0]; d.f2 = [d.x - 3, 0];
      d.a1 = [d.x + 5 + 2 * Math.sin(TAU * q * 2), y + TORSO + 12]; d.a2 = [d.x - 5 + 2 * Math.sin(TAU * q * 2), y + TORSO + 12]; d.late1 = d.late2 = true; return d; };
    return { L: mk(-8, 1, -1), F: mk(8, -1, 1), front: 'F', J: [0, y + 6] }; },
  // khiêu vũ lãng mạn: nữ vòng tay qua cổ nam, nam ôm eo, trán kề trán, khẽ đung đưa
  slow: (q, k) => { const sw = (k % 2 ? -1 : 1) * 2.2 * Math.sin(Math.PI * q) * (q < 0.5 ? 1 : 1), y = HIP + 0.25 * Math.sin(TAU * q);
    const L = stand(-6 + sw, 1), F = stand(6 + sw, -1); L.y = F.y = y; L.lean = 0.07; F.lean = 0.1; L.head = 0.1; F.head = 0.14; L.shut = F.shut = true;
    L.a1 = 'pWaist'; L.late1 = true; L.a2 = 'pBack'; F.a1 = 'pNeck'; F.late1 = true; F.a2 = 'pNeck';
    const c = Math.cos(TAU * q); L.f1 = [L.x + 1.5, Math.max(0, c) * 0.7]; L.f2 = [L.x - 1.5, Math.max(0, -c) * 0.7]; F.f1 = [F.x - 1.5, Math.max(0, -c) * 0.7]; F.f2 = [F.x + 1.5, Math.max(0, c) * 0.7];
    return { L, F, front: 'F', J: [0, y + 8] }; },
  // ôm nhau xoay thật chậm
  slowturn: q => rot(FIG.slow((q * 2) % 1, 0), TAU * ease(q)),
  // nữ tựa đầu vào ngực nam, nam hôn lên trán
  nestle: q => { const t = bell(q), p = FIG.slow(q, 0); p.F.lean = 0.1 + 0.22 * t; p.F.head = 0.14 + 0.2 * t; p.L.head = 0.1 + 0.25 * t; p.fx = 'hearts'; return p; },
  // chào kết: nam cúi mình, nữ nhún gối xoè váy
  bow: q => { const t = bell(q, 0.3, 0.75), L = stand(-10, 1), F = stand(10, -1);
    L.lean = 0.75 * t; L.head = 0.1 * t; L.a1 = lv([L.x + 2, HIP + 2], [L.x + 5, HIP + 5], t); L.a2 = 'out';
    F.y = HIP - 3 * t; F.lean = 0.12 * t; F.head = 0.15 * t; F.a1 = 'skirt'; F.a2 = 'skirt'; F.flare = 1.4 * t; F.f1 = [F.x - 2, 0]; F.f2 = [F.x + 4 * t + 1, 0];
    return { L, F, front: 'F', J: [0, HIP] }; },
};
/** chuỗi động tác tự nhảy của từng thể loại: [thế, số đơn vị nhạc], lặp lại */
const SEQ: Record<DanceMood, [string, number][]> = {
  waltz: [['waltz', 2], ['turn', 2], ['waltz', 2], ['twirl', 2], ['waltz', 1], ['turn', 2], ['waltz', 1], ['corte', 2], ['turn', 2]],
  slow: [['slow', 4], ['slowturn', 2], ['slow', 2], ['nestle', 2], ['slowturn', 2], ['slow', 2], ['twirl', 2]],
  tango: [['prom', 2], ['corte', 1], ['prom', 2], ['corte', 1], ['turn', 2], ['dip', 1], ['prom', 2], ['corte', 1]],
  jazz: [['bounce', 2], ['swingout', 2], ['bounce', 1], ['twirl', 1], ['swingout', 2], ['turn', 2], ['bounce', 1], ['lift', 1]],
  latin: [['cha', 2], ['newyork', 1], ['cha', 2], ['twirl', 1], ['cha', 1], ['newyork', 1], ['turn', 2], ['cha', 1]],
  disco: [['point', 2], ['bump', 1], ['point', 2], ['twirl', 1], ['bump', 1], ['turn', 2], ['swingout', 1], ['lift', 1]],
};
/** độ dài một đơn vị nhạc (ms) của từng thể loại — khớp phách của bài */
const unitMs = (m: DanceMood) => { const B = 60000 / TUNES[m].bpm; return m === 'waltz' ? B * 3 : m === 'jazz' ? B * 4 : m === 'slow' ? B * 2 : m === 'tango' ? B * 2 : B * 4; };
/** động tác phô diễn khi bấm trúng mũi tên: ⬅️ lướt ra / dạo bước · ⬆️ nhấc bổng / xoay dưới tay · ⬇️ ngả người / corte · ➡️ xoay cả cặp / swing-out */
const FLOURISH = ['swingout', 'prom', 'lift', 'twirl', 'dip', 'corte', 'turn', 'swingout'];
const SLOW_FLOURISH = ['slowturn', 'nestle', 'lift', 'twirl', 'dip', 'nestle', 'slowturn', 'corte'];

// ───────── giải tư thế → toạ độ ─────────
const neckOf = (d: { x: number; y: number; lean: number; dir: number }, k = 1): V2 => [d.x + Math.sin(d.lean) * d.dir * TORSO * k, d.y + Math.cos(d.lean) * TORSO * k];
function resolve(p: Pair): { L: R; F: R } {
  const hand = (d: D, o: D, a: Arm, near: boolean): V2 => {
    if (typeof a !== 'string') return a;
    const sh = neckOf(d, 0.86);
    switch (a) {
      case 'J': return p.J;
      case 'J2': return p.J2 ?? p.J;
      case 'pBack': { const m = neckOf(o, 0.55); return [m[0] - o.dir * 4.6, m[1]]; }
      case 'pWaist': { const m = neckOf(o, 0.18); return [m[0] - o.dir * (near ? 1.5 : 4.6), m[1]]; }
      case 'pShoulder': { const m = neckOf(o, 0.84); return [m[0] + o.dir * 1.5, m[1] + 1]; }
      case 'pNeck': { const m = neckOf(o, 0.98); return [m[0] - o.dir * 3.4, m[1] + (near ? 0 : 1)]; }
      case 'hip': return [d.x + d.dir * 4.4, d.y + 1.5];
      case 'out': return [sh[0] - d.dir * 10, sh[1] - 2];
      case 'outUp': return [sh[0] - d.dir * 8.5, sh[1] + 7];
      case 'up': return [sh[0] + d.dir * 3, sh[1] + 11];
      case 'skirt': return [d.x - d.dir * (near ? 8 : -8), d.y - 3];
      default: return [sh[0] + d.dir * 1.5, sh[1] - 10];
    }
  };
  const one = (d: D, o: D): R => ({ hip: [d.x, d.y], lean: d.lean, head: d.head, turn: d.turn, dir: d.dir, shut: !!d.shut, h1: hand(d, o, d.a1, true), h2: hand(d, o, d.a2, false), late1: !!d.late1, late2: !!d.late2, f1: d.f1, f2: d.f2, sway: d.sway, flare: d.flare ?? 0 });
  return { L: one(p.L, p.F), F: one(p.F, p.L) };
}
const mixR = (a: R, b: R, w: number): R => ({ hip: lv(a.hip, b.hip, w), lean: lerp(a.lean * a.dir, b.lean * b.dir, w) * (w < 0.5 ? a.dir : b.dir), head: lerp(a.head, b.head, w), turn: w < 0.5 ? a.turn : b.turn, dir: w < 0.5 ? a.dir : b.dir, shut: w < 0.5 ? a.shut : b.shut,
  h1: lv(a.h1, b.h1, w), h2: lv(a.h2, b.h2, w), late1: w < 0.5 ? a.late1 : b.late1, late2: w < 0.5 ? a.late2 : b.late2, f1: lv(a.f1, b.f1, w), f2: lv(a.f2, b.f2, w), sway: lerp(a.sway, b.sway, w), flare: lerp(a.flare, b.flare, w) });

// ───────── vẽ một người ─────────
type Cx = CanvasRenderingContext2D;
const PX = (x: number) => Math.round(OX + x * B), PY = (y: number) => Math.round(OY - y * B);
/** nét pixel: đường dày w vẽ bằng các ô vuông (không khử răng cưa → đúng chất pixel-art) */
function pline(c: Cx, a: V2, b: V2, w: number, col: string) {
  const x0 = OX + a[0] * B, y0 = OY - a[1] * B, x1 = OX + b[0] * B, y1 = OY - b[1] * B, n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  c.fillStyle = col;
  for (let i = 0; i <= n; i++) c.fillRect(Math.round(x0 + ((x1 - x0) * i) / n - w / 2), Math.round(y0 + ((y1 - y0) * i) / n - w / 2), w, w);
}
/** khớp giữa của chi hai đốt (khuỷu / gối); xa quá tầm thì duỗi thẳng */
function joint(a: V2, b: V2, len: number, bend: number): V2 {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 0.001, h = d >= len * 2 ? 0 : Math.sqrt(len * len - (d / 2) ** 2);
  return [a[0] + dx / 2 - (dy / d) * h * bend, a[1] + dy / 2 + (dx / d) * h * bend];
}
function drawDancer(c: Cx, r: R, kit: DancerKit, part: 'main' | 'late') {
  const { hip, dir } = r, neck = neckOf({ x: hip[0], y: hip[1], lean: r.lean, dir }), a = ((r.turn % TAU) + TAU) % TAU;
  const view = a < Math.PI / 4 || a > TAU - Math.PI / 4 ? 'side' : a < (3 * Math.PI) / 4 ? 'front' : a < (5 * Math.PI) / 4 ? 'side' : 'back';
  const face = (view === 'side' && a > Math.PI / 2 && a < 1.5 * Math.PI ? -dir : dir) as 1 | -1, open = view === 'side' ? 0 : 1;      // open: đang quay ra/vào → vai & chân dang ngang
  const sh = neckOf({ x: hip[0], y: hip[1], lean: r.lean, dir }, 0.86), sh1: V2 = [sh[0] + open * 5 * dir, sh[1]], sh2: V2 = [sh[0] - open * 5 * dir, sh[1]];
  const far = (col: string) => mix(col, '#2a2030', 0.2);
  const arm = (s: V2, h: V2, isFar: boolean) => {
    const e = joint(s, h, ARM, h[0] - s[0] >= 0 ? -1 : 1), up = isFar ? far(kit.armUp) : kit.armUp, low = isFar ? far(kit.armLow) : kit.armLow;
    pline(c, s, e, 4, up); pline(c, e, h, 4, low);
    if (kit.puff) { c.fillStyle = mix(kit.top, '#ffffff', 0.3); c.fillRect(PX(s[0]) - 3, PY(s[1]) - 3, 7, 6); }
    c.fillStyle = isFar ? kit.skinD : kit.skin; c.fillRect(PX(h[0]) - 2, PY(h[1]) - 2, 5, 5);
  };
  if (part === 'late') { if (r.late2) arm(sh2, r.h2, true); if (r.late1) arm(sh1, r.h1, false); return; }
  const headAt = (im: HTMLCanvasElement) => { c.save(); c.translate(PX(neck[0]), PY(neck[1]) + 1); c.rotate((r.lean * 0.55 + r.head) * dir); c.scale(view === 'side' ? face : 1, 1); c.drawImage(im, -17, -25); c.restore(); };
  // tóc dài sau lưng
  const tail = kit.tail[view]; if (tail) headAt(tail);
  if (!r.late2) arm(sh2, r.h2, true);
  // chân: xa trước, gần sau; gối gập về phía đang nhìn
  const leg = (h: V2, f: V2, isFar: boolean) => {
    const ank: V2 = [f[0], f[1] + 2.2], k = joint(h, ank, LEG + 0.6, face), col = isFar ? kit.legD : kit.leg;
    pline(c, h, k, 5, col); pline(c, k, ank, 5, col);
    const tip = f[1] > 3 ? face : open ? 0 : face;                              // giày: mũi hướng theo mặt
    c.fillStyle = kit.shoes; c.fillRect(PX(f[0]) - 4 + (tip > 0 ? 2 : tip < 0 ? -2 : 0), PY(f[1]) - 4, 8, 4);
    c.fillStyle = mix(kit.shoes, '#2a1a1a', 0.35); c.fillRect(PX(f[0]) - 4 + (tip > 0 ? 2 : tip < 0 ? -2 : 0), PY(f[1]) - 1, 8, 1);
  };
  const hw = open ? 2.6 : 1.2;
  leg([hip[0] - hw * dir, hip[1]], r.f2, true); leg([hip[0] + hw * dir, hip[1]], r.f1, false);
  // thân: áo + bóng sau lưng + hông
  const t0: V2 = [lerp(hip[0], neck[0], 0.3), lerp(hip[1], neck[1], 0.3)], t1: V2 = [lerp(hip[0], neck[0], 0.8), lerp(hip[1], neck[1], 0.8)];
  if (kit.bottom === 'pants' || kit.bottom === 'shorts') { c.fillStyle = kit.bot; c.fillRect(PX(hip[0]) - 6, PY(hip[1]) - 5, 12, kit.bottom === 'shorts' ? 10 : 8); }
  pline(c, t0, t1, 11, kit.top);
  pline(c, [t0[0] - face * 3, t0[1]], [t1[0] - face * 3, t1[1]], 2, kit.topD);
  c.fillStyle = kit.skinD; c.fillRect(PX(neck[0]) - 2, PY(neck[1]) - 2, 5, 5);
  // váy / đầm: xoè theo đà xoay, đung đưa theo bước, kéo theo chân đang duỗi
  if (kit.bottom === 'skirt' || kit.bottom === 'gown') {
    const gown = kit.bottom === 'gown', rows = Math.round(Math.min(gown ? 13.2 : 7, hip[1] - 0.4) * B), pull = ((r.f1[0] + r.f2[0]) / 2 - hip[0]) * 0.6 + r.sway * 1.2 - Math.sin(r.lean) * dir * 2.4;
    for (let i = 0; i <= rows; i++) { const u = i / Math.max(1, rows), w = 12 + 2 * Math.floor(i / (gown ? 4 : 3)) + r.flare * i * (gown ? 0.7 : 1), x = OX + (hip[0] + pull * u * u) * B, y = PY(hip[1]) - 4 + i;
      c.fillStyle = i >= rows - 1 ? kit.botD : kit.bot; c.fillRect(Math.round(x - w / 2), y, Math.round(w), 1);
      if (gown && i % 5 === 3) { c.fillStyle = mix(kit.bot, '#ffffff', 0.25); c.fillRect(Math.round(x - w / 2) + 1, y, 3, 1); c.fillStyle = kit.botD; c.fillRect(Math.round(x + w / 2) - 2, y, 2, 1); } }
  }
  headAt(view === 'side' && r.shut ? kit.headShut : kit.head[view]);
  if (!r.late1) arm(sh1, r.h1, false);
}

// ───────── chọn tư thế theo thời gian ─────────
function poseAt(now: number): { r: { L: R; F: R }; front: 'L' | 'F'; fx?: 'hearts' | 'spark'; both: boolean; el: number; mood: DanceMood; running: boolean } {
  const { at, end, mood, hits } = danceStage, U = unitMs(mood), el = now - at, running = at > 0 && el >= 0 && now < end;
  let p: Pair;
  if (running) {
    const seq = SEQ[mood], total = seq.reduce((s, x) => s + x[1], 0), u = el / U, loop = Math.floor(u / total); let rem = u - loop * total, n = loop * 7;
    let f = seq[0];
    for (const s of seq) { if (rem < s[1]) { f = s; break; } rem -= s[1]; n += s[1]; }
    const multi = f[0] === 'twirl' || f[0] === 'corte' || f[0] === 'dip' || f[0] === 'lift' || f[0] === 'swingout' || f[0] === 'nestle' || f[0] === 'newyork' || f[0] === 'turn' || f[0] === 'slowturn';   // thế kéo dài trọn số đơn vị
    p = multi ? FIG[f[0]](rem / f[1], n) : FIG[f[0]](rem % 1, n + Math.floor(rem));
  } else if (at > 0 && now >= end && now < end + 4200) p = FIG.bow((now - end) / 4200, 0);
  else p = FIG.idle((now / 3200) % 1, 0);
  let r = resolve(p), front = p.front, fx = p.fx, both = false;
  // động tác phô diễn khi vừa bấm trúng
  const last = hits[hits.length - 1], dur = Math.min(1500, arrowMs(mood) * 0.96);
  if (last && running) {
    const cl = hits.filter(h => h.at > last.at - 520), start = cl[0].at, q = (now - start) / dur;
    if (q >= 0 && q < 1) {
      both = cl.some(h => h.both);
      const name = (mood === 'slow' ? SLOW_FLOURISH : FLOURISH)[cl[0].m % 8], fp = FIG[name](q, cl[0].m), w = ease(q / 0.16) * (1 - ease((q - 0.84) / 0.16)), fr = resolve(fp);
      r = { L: mixR(r.L, fr.L, w), F: mixR(r.F, fr.F, w) }; if (w > 0.5) { front = fp.front; fx = both ? 'hearts' : fp.fx ?? 'spark'; }
    }
  }
  return { r, front, fx, both, el, mood, running };
}
/** cặp đôi trôi trên sàn: waltz lượn vòng rộng, tango đi ngang sàn, còn lại đung đưa quanh giữa sàn */
function centerAt(mood: DanceMood, el: number, running: boolean): V2 {
  if (!running) return [96.5, 122];
  const t = el / 1000;
  if (mood === 'waltz') return [96.5 + 38 * Math.sin(t * 0.33), 121 + 7 * Math.cos(t * 0.33)];
  if (mood === 'tango') return [96.5 + 36 * Math.sin(t * 0.3), 122 + 3 * Math.sin(t * 0.6)];
  if (mood === 'slow') return [96.5 + 10 * Math.sin(t * 0.12), 122];
  return [96.5 + 18 * Math.sin(t * 0.25), 122 + 4 * Math.cos(t * 0.5)];
}

/** Lớp vẽ cặp đôi khiêu vũ (phủ cả phòng, không chặn bấm). leader = người dẫn (nhân vật nam, không thì người vào trước). */
export function Ballroom({ leader, follower }: { leader: AvatarLook; follower: AvatarLook }) {
  const s = useScale(), ref = useRef<HTMLCanvasElement>(null);
  const kL = JSON.stringify(leader), kF = JSON.stringify(follower);
  useEffect(() => {
    const cv = ref.current!, ctx = cv.getContext('2d')!, dpr = window.devicePixelRatio || 1;
    const kits = { L: dancerKit(leader), F: dancerKit(follower) };
    const layer = () => { const o = document.createElement('canvas'); o.width = OW; o.height = OH; return o; };
    const off = { Lm: layer(), Fm: layer(), Ll: layer(), Fl: layer() };
    let raf = 0, prev = 0;
    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      if (ts - prev < 30) return; prev = ts;
      const now = Date.now(), { r, front, fx, both, el, mood, running } = poseAt(now), [cx, cy] = centerAt(mood, el, running);
      const U = Math.max(1, Math.round(avatarPx(s * 1.25) * dpr * 0.6)), S = s * dpr;   // cặp đôi vẽ to gấp rưỡi nhân vật thường cho rõ động tác; U nguyên để pixel đều                    // điểm ảnh thật cho mỗi đơn vị khung xương / mỗi pixel cảnh
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.imageSmoothingEnabled = false;
      for (const [k, part] of [['L', 'main'], ['F', 'main'], ['L', 'late'], ['F', 'late']] as const) {
        const o = off[`${k}${part === 'main' ? 'm' : 'l'}` as keyof typeof off], oc = o.getContext('2d', { willReadFrequently: true })!;
        oc.clearRect(0, 0, OW, OH); oc.imageSmoothingEnabled = false;
        drawDancer(oc, r[k], kits[k], part); inkOutline(oc, OW, OH);
      }
      const X = cx * S, Y = cy * S, t = now / 1000;
      // quầng đèn sân khấu rọi theo + bóng dưới chân
      const g = ctx.createRadialGradient(X, Y - 6 * S, 0, X, Y - 6 * S, 46 * S); g.addColorStop(0, mood === 'disco' ? '#ff9ad830' : '#fff2c838'); g.addColorStop(1, '#fff2c800'); ctx.fillStyle = g; ctx.fillRect(X - 50 * S, Y - 56 * S, 100 * S, 70 * S);
      ctx.fillStyle = '#2a183030'; ctx.beginPath(); ctx.ellipse(X, Y + 0.5 * S, 22 * U, 4.5 * U, 0, 0, TAU); ctx.fill();
      const order = front === 'F' ? [off.Lm, off.Fm, off.Ll, off.Fl] : [off.Fm, off.Lm, off.Fl, off.Ll];
      // bóng phản chiếu trên sàn gỗ bóng
      ctx.save(); ctx.globalAlpha = 0.09; ctx.translate(X, Y + 1 * S); ctx.scale(1, -0.4); for (const o of order) ctx.drawImage(o, -OX * U, -OY * U, OW * U, OH * U); ctx.restore();
      for (const o of order) ctx.drawImage(o, Math.round(X - OX * U), Math.round(Y - OY * U), Math.round(OW * U), Math.round(OH * U));
      // hiệu ứng: tim bay (cùng trúng nhịp / thế lãng mạn), lấp lánh (xoay, nhấc bổng), cánh hoa rơi (waltz, tango, lãng mạn)
      const heartAt = (x: number, y: number, sz: number, col: string) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - sz * 0.5, y, sz * 0.56, 0, TAU); ctx.arc(x + sz * 0.5, y, sz * 0.56, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - sz * 1.04, y + sz * 0.18); ctx.lineTo(x, y + sz * 1.25); ctx.lineTo(x + sz * 1.04, y + sz * 0.18); ctx.fill(); };
      if (fx === 'hearts') for (let k = 0; k < (both ? 9 : 5); k++) { const q = (t * 0.7 + k / 9) % 1; ctx.globalAlpha = 1 - q; heartAt(X + Math.sin(k * 2.3 + q * 5) * 16 * U, Y - (62 + q * 36) * U, (2 + (k % 3) * 0.9) * U, ['#ff4a7a', '#ff8ab0', '#ffd0e0'][k % 3]); }
      if (fx === 'spark') for (let k = 0; k < 10; k++) { const a = t * 3 + (k * TAU) / 10, d = (30 + 6 * Math.sin(t * 5 + k)) * U, x = X + Math.cos(a) * d, y = Y - 36 * U + Math.sin(a) * d * 0.45; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 9 + k); ctx.fillStyle = k % 2 ? '#ffe08a' : '#ffffff'; ctx.fillRect(x - S * 0.4, y - S * 1.2, S * 0.8, S * 2.4); ctx.fillRect(x - S * 1.2, y - S * 0.4, S * 2.4, S * 0.8); }
      ctx.globalAlpha = 1;
      if (running && (mood === 'waltz' || mood === 'tango' || mood === 'slow')) for (let k = 0; k < 16; k++) { const rk = (i: number) => ((Math.sin(k * 12.9898 + i * 78.233) * 43758.5453) % 1 + 1) % 1, x = ((rk(1) * 192 + Math.sin(t * 0.7 + k) * 8) % 192) * S, y = ((rk(2) * 144 + t * (7 + rk(3) * 6)) % 144) * S;
        ctx.fillStyle = mood === 'tango' ? '#e8203a' : k % 2 ? '#ffb0c8' : '#ffe0ea'; ctx.beginPath(); ctx.ellipse(x, y, 1.3 * S, 0.8 * S, Math.sin(t * 2 + k), 0, TAU); ctx.fill(); }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [s, kL, kF]); // eslint-disable-line react-hooks/exhaustive-deps
  const dpr = window.devicePixelRatio || 1;
  return <canvas ref={ref} width={Math.round(192 * s * dpr)} height={Math.round(144 * s * dpr)} className="glam-cv" style={{ left: 0, top: 0, width: 192 * s, height: 144 * s, zIndex: 130, imageRendering: 'pixelated' }} aria-hidden />;
}
