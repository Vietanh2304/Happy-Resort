import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Sprite } from '../lib/pixel';

/** Tỉ lệ phóng to hiện tại của cảnh (1 pixel logic = s pixel màn hình) */
const ScaleCtx = createContext(1);
export const useScale = () => useContext(ScaleCtx);

interface StageProps {
  w: number;
  h: number;
  bg?: Sprite;
  className?: string;
  onTap?: (x: number, y: number) => void;
  /** Cảnh rộng: phóng to vừa mắt và cho camera đi theo điểm này (tọa độ logic) */
  follow?: { x: number; y: number };
  children?: ReactNode;
}

const VIEW = 145;  // cạnh ngắn của màn hình luôn thấy khoảng bấy nhiêu pixel logic
const SPEED = 45; // khớp tốc độ đi của nhân vật để camera lướt theo

/** Khung cảnh pixel: tự co giãn vừa chỗ trống, giữ đúng tỉ lệ, trả tọa độ chạm theo pixel logic */
export function Stage({ w, h, bg, className = '', onTap, follow, children }: StageProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ cw: 0, ch: 0 });

  useLayoutEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(() => setBox({ cw: el.clientWidth, ch: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Vừa khít; riêng màn dọc thì phóng to theo chiều cao và trượt ngang theo nhân vật
  const { cw, ch } = box;
  const fit = Math.min(cw / w, ch / h);
  const raw = follow === undefined ? fit : Math.max(fit, Math.min(cw, ch) / VIEW);
  // Làm tròn để 1 pixel game = số nguyên pixel thật của màn hình (tránh nhòe khi Windows phóng 125%/150%)
  const dpr = window.devicePixelRatio || 1;
  const s = raw * dpr >= 2 ? Math.floor(raw * dpr) / dpr : raw;
  const px = (v: number) => Math.round(v * dpr) / dpr;
  const axis = (c: number, size: number, f: number) => (size * s <= c ? (c - size * s) / 2 : Math.max(c - size * s, Math.min(0, c / 2 - f * s)));
  const left = px(axis(cw, w, follow?.x ?? w / 2));
  const top = px(axis(ch, h, follow?.y ?? h / 2));

  // Camera lướt cùng tốc độ với bước chân
  const last = useRef(follow);
  const glide = useRef(0);
  const dist = follow && last.current ? Math.hypot(follow.x - last.current.x, follow.y - last.current.y) : 0;
  if (dist > 0) glide.current = Math.min(4000, (dist / SPEED) * 1000);
  last.current = follow;
  const ms = glide.current;

  return (
    <div ref={wrap} className={`stage-wrap ${className}`}>
      {s > 0 && (
        <div
          className="stage"
          style={{
            left, top, width: w * s, height: h * s, backgroundImage: bg ? `url(${bg.url})` : undefined,
            transition: ms ? `left ${ms}ms linear, top ${ms}ms linear` : undefined,
          }}
          onClick={e => {
            if (!onTap) return;
            const r = e.currentTarget.getBoundingClientRect();
            onTap((e.clientX - r.left) / s, (e.clientY - r.top) / s);
          }}
        >
          <ScaleCtx.Provider value={s}>{children}</ScaleCtx.Provider>
        </div>
      )}
    </div>
  );
}

interface SprProps {
  sprite: Sprite;
  x: number;              // tâm theo chiều ngang
  y: number;              // đáy (chân) của sprite
  z?: number;
  flip?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
  onClick?: () => void;
  /** Bấm đúp (máy tính) hoặc nhấn giữ (điện thoại) */
  onHold?: () => void;
}

/** Một sprite đặt trong cảnh, neo ở chân; tự xếp lớp theo y (vật ở dưới che vật ở trên) */
export function Spr({ sprite, x, y, z, flip, className = '', style, title, onClick, onHold }: SprProps) {
  const s = useScale();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const clear = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  return (
    <img
      src={sprite.url} alt={title ?? ''} title={title} draggable={false}
      className={`spr ${onClick || onHold ? 'tappable' : ''} ${sprite.smooth ? 'smooth' : ''} ${className}`}
      style={{
        left: Math.round((x - (flip && sprite.ax !== undefined ? sprite.w - sprite.ax : sprite.ax ?? sprite.w / 2)) * s), top: Math.round((y - sprite.h) * s), width: sprite.w * s, height: sprite.h * s,
        zIndex: z ?? Math.round(y), transform: flip ? 'scaleX(-1)' : undefined, ...style,
      }}
      onClick={(onClick || onHold) && (e => { e.stopPropagation(); if (held.current) { held.current = false; return; } onClick?.(); })}
      onDoubleClick={onHold && (e => { e.stopPropagation(); onHold(); })}
      onPointerDown={onHold && (e => {
        if (e.pointerType === 'mouse') return;
        held.current = false;
        clear();
        timer.current = setTimeout(() => { held.current = true; navigator.vibrate?.(30); onHold(); }, 450);
      })}
      onPointerUp={onHold && clear}
      onPointerLeave={onHold && clear}
      onContextMenu={onHold && (e => e.preventDefault())}
    />
  );
}

/** Nhãn/bong bóng chữ đặt theo tọa độ cảnh (không bị phóng to chữ) */
export function Tag({ x, y, className = '', children, onClick }: { x: number; y: number; className?: string; children: ReactNode; onClick?: () => void }) {
  const s = useScale();
  return (
    <div className={`tag ${className}`} style={{ left: x * s, top: y * s, zIndex: 500, ...(onClick ? { pointerEvents: 'auto', cursor: 'pointer' } : {}) }}
      onClick={onClick && (e => { e.stopPropagation(); onClick(); })}>
      {children}
    </div>
  );
}
