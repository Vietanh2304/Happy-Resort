// Bộ khung cho các trò chơi toàn màn hình (ném tuyết, trốn tìm, chèo thuyền, golf, cầu lông):
// màn chơi, kênh đồng bộ có "người ấy đang ở đây không", di chuyển bằng phím/chạm, vẽ nhân vật.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type * as api from '../../lib/api';
import { characterSprite, type Held, type View } from '../../lib/sprites';
import { actFrame, type Act } from '../../lib/acts';
import { useGameChannel, type Msg } from '../gameKit';
import type { GameId } from '../../lib/world';

export interface PlayProps { me: api.Profile; partner: api.Profile | null; date: string; onLeave: () => void; theme?: 'snow' | 'water' }

/** Khung màn chơi: thanh trên (tên trò, người ấy có ở đây không, nút thoát), giữa là sân, dưới là nút bấm */
export function PlayScreen({ title, here, partnerName, top, bottom, children, onLeave }: {
  title: string; here: boolean; partnerName: string; top?: ReactNode; bottom?: ReactNode; children: ReactNode; onLeave: () => void;
}) {
  return createPortal(
    <div className="kitchen-full play-full" role="dialog" aria-label={title}>
      <div className="k-top">
        <b>{title}</b>
        <span className="k-who">{here ? `🟢 ${partnerName} đang chơi cùng` : `💤 ${partnerName} chưa vào — gửi lời mời rồi chờ chút nhé`}</span>
        <span className="row">{top}<button className="btn small ghost" onClick={onLeave}>🚪 Thoát</button></span>
      </div>
      {children}
      {bottom && <div className="k-bottom">{bottom}</div>}
    </div>,
    document.body,
  );
}

/**
 * Kênh trò chơi có hiện diện: gửi 'hello' khi vào, 'bye' khi ra; biết người ấy có đang ở trong trò không.
 * onMsg nhận mọi tin (kể cả của mình). Trả về send và `here`.
 */
export function usePeer(g: GameId, me: string, onMsg: (m: Msg, mine: boolean) => void, onJoin?: () => void) {
  const [here, setHere] = useState(false);
  const seen = useRef(0);
  const join = useRef(onJoin); join.current = onJoin;
  const send = useGameChannel(g, me, m => {
    const mine = m.by === me;
    if (!mine) {
      seen.current = Date.now();
      if (m.t === 'hello') { setHere(true); send('here'); join.current?.(); }
      else if (m.t === 'bye') setHere(false);
      else setHere(true);
    }
    onMsg(m, mine);
  });
  useEffect(() => {
    send('hello');
    const t = setInterval(() => { send('here'); if (Date.now() - seen.current > 8000) setHere(false); }, 3000);
    return () => { clearInterval(t); send('bye'); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return { send, here };
}

/** Đồng hồ khung hình (vẽ lại liên tục) */
export function useFrame(on = true) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!on) return;
    let raf = 0;
    const loop = () => { setNow(Date.now()); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return now;
}

/** Cỡ màn hình */
export function useViewport() {
  const [vw, setVw] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => { const f = () => setVw({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  return vw;
}

export type Dir = 'u' | 'd' | 'l' | 'r';
export const DV: Record<Dir, [number, number]> = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const KEYS: Record<string, Dir> = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', w: 'u', s: 'd', a: 'l', d: 'r', W: 'u', S: 'd', A: 'l', D: 'r' };
export interface Pos { x: number; y: number; f: Dir; mv: boolean }
export const typing = (e: KeyboardEvent) => e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

/**
 * Đi lại trên bản đồ ô: phím WASD/mũi tên, hoặc walkTo(x, y) để tự tìm đường (chạm màn hình).
 * Gửi vị trí qua onMove (đã giới hạn ~7 lần/giây).
 */
export function useWalker(start: Pos, free: (x: number, y: number) => boolean, opts: { speed?: number; enabled?: () => boolean; onMove?: (p: Pos) => void; onArrive?: () => void } = {}) {
  const [pos, setPos] = useState(start);
  const ref = useRef(start);
  const keys = useRef<Dir[]>([]);
  const path = useRef<[number, number][] | null>(null);
  const o = useRef(opts); o.current = opts;
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (typing(e)) return; const d = KEYS[e.key]; if (d) { e.preventDefault(); if (!keys.current.includes(d)) keys.current.push(d); } };
    const up = (e: KeyboardEvent) => { const d = KEYS[e.key]; if (d) keys.current = keys.current.filter(k => k !== d); };
    const blur = () => { keys.current = []; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);
  useEffect(() => {
    let raf = 0, last = performance.now(), sent = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const p = { ...ref.current };
      const sp = (o.current.speed ?? 4) * dt;
      let mv = false;
      if (o.current.enabled?.() ?? true) {
        const k = keys.current[keys.current.length - 1];
        if (k) {
          path.current = null;
          const [dx, dy] = DV[k];
          p.f = k;
          if (free(p.x + dx * sp, p.y)) p.x += dx * sp;
          if (free(p.x, p.y + dy * sp)) p.y += dy * sp;
          mv = true;
        } else if (path.current) {
          const nx = path.current[0];
          if (!nx) { path.current = null; o.current.onArrive?.(); }
          else {
            const tx = nx[0] + 0.5, ty = nx[1] + 0.5, d = Math.hypot(tx - p.x, ty - p.y);
            if (d <= sp) { p.x = tx; p.y = ty; path.current.shift(); } else { p.x += ((tx - p.x) / d) * sp; p.y += ((ty - p.y) / d) * sp; }
            p.f = Math.abs(tx - p.x) > Math.abs(ty - p.y) ? (tx > p.x ? 'r' : 'l') : ty > p.y ? 'd' : 'u';
            mv = true;
          }
        }
      }
      p.mv = mv;
      const c = ref.current;
      if (p.x !== c.x || p.y !== c.y || p.f !== c.f || p.mv !== c.mv) {
        ref.current = p; setPos(p);
        if (t - sent > 140 || !mv) { sent = t; o.current.onMove?.(p); }
      } else if (t - sent > 1500) { sent = t; o.current.onMove?.(p); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /** Tìm đường tới ô (x, y) (hoặc ô trống gần nhất cạnh nó) */
  const walkTo = (x: number, y: number, cols: number, rows: number) => {
    const p = ref.current, from: [number, number] = [Math.floor(p.x), Math.floor(p.y)];
    const ok = (a: number, b: number) => a >= 0 && b >= 0 && a < cols && b < rows && free(a + 0.5, b + 0.5);
    const goal = ([a, b]: [number, number]) => (a === x && b === y) || (!ok(x, y) && Math.abs(a - x) + Math.abs(b - y) === 1);
    const seen = new Set([from.join()]);
    const q: { p: [number, number]; path: [number, number][] }[] = [{ p: from, path: [] }];
    while (q.length) {
      const { p: c, path: pa } = q.shift()!;
      if (goal(c)) { path.current = pa; return true; }
      for (const [dx, dy] of Object.values(DV)) {
        const n: [number, number] = [c[0] + dx, c[1] + dy];
        if (!ok(n[0], n[1]) || seen.has(n.join())) continue;
        seen.add(n.join()); q.push({ p: n, path: [...pa, n] });
      }
    }
    return false;
  };
  const teleport = (p: Pos) => { ref.current = p; setPos(p); path.current = null; };
  /** Nút bấm trên màn hình (điện thoại): giữ để đi */
  const hold = (d: Dir, on: boolean) => { keys.current = keys.current.filter(k => k !== d); if (on) keys.current.push(d); };
  return { pos, ref, walkTo, teleport, hold };
}

/** Nhân vật chibi đặt ở toạ độ ô (x, y = chân) với cỡ ô `tile` px */
export function Chibi({ look, p, tile, s, name, held, hold, bubble, className, pose, tint, act, frame }: {
  look: api.Profile['avatar']; p: Pos; tile: number; s: number; name?: string; held?: ReactNode; hold?: Held; bubble?: string | null; className?: string; pose?: 'sit'; tint?: string;
  /** Động tác đang làm; frame: giữ nguyên một khung động tác */
  act?: Act | null; frame?: number;
}) {
  const view: View = p.f === 'u' ? 'back' : p.f === 'd' ? 'front' : 'side';
  const step = p.mv ? Math.floor(Date.now() / 130) % 4 : 0;
  const af = frame ?? actFrame(act, Date.now());
  const sp = af !== null && af !== undefined ? characterSprite(look, pose === 'sit' ? 'actsit' : 'act', undefined, 'front', af)
    : pose === 'sit' ? characterSprite(look, 'sit', hold, 'front') : characterSprite(look, p.mv ? 'walk' : 'idle', hold, view, step);
  const ax = sp.ax ?? sp.w / 2;
  return (
    <div className={`k-avatar ${className ?? ''}`} style={{ left: p.x * tile, top: p.y * tile, zIndex: Math.round(p.y * 10) + 5 }}>
      <img src={sp.url} alt="" draggable={false} style={{ width: sp.w * s, height: sp.h * s, marginLeft: -ax * s, marginTop: -sp.h * s, transform: p.f === 'l' && af == null ? 'scaleX(-1)' : undefined, filter: tint }} />
      {held && <div className="k-held" style={{ top: -sp.h * s * 0.62 }}>{held}</div>}
      {name && <span className="k-name">{name}</span>}
      {bubble && <span className="speech k-bubble" style={{ bottom: sp.h * s + 4 }}>{bubble}</span>}
    </div>
  );
}

/** Phím hướng trên màn hình cho điện thoại */
export function DPad({ hold }: { hold: (d: Dir, on: boolean) => void }) {
  const b = (d: Dir, icon: string) => (
    <button className={`dpad-${d}`} onPointerDown={e => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture?.(e.pointerId); hold(d, true); }}
      onPointerUp={() => hold(d, false)} onPointerCancel={() => hold(d, false)} onContextMenu={e => e.preventDefault()}>{icon}</button>
  );
  return <div className="dpad">{b('u', '▲')}{b('l', '◀')}{b('r', '▶')}{b('d', '▼')}</div>;
}
