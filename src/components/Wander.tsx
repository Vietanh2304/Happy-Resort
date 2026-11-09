// Nhân vật nhỏ di chuyển: Follower (đi theo một điểm, có bước chân), Wanderer (thú đi lang thang quanh chỗ của nó)
import { useEffect, useRef, useState } from 'react';
import { critterSprite, FLIERS } from '../lib/critters';
import type { Sprite } from '../lib/pixel';
import type { Pt } from '../lib/world';
import { useScale } from './Stage';

/** Khách thú đi lang thang quanh chỗ của nó (bước chân / vỗ cánh), chạm để chào */
export function Wanderer({ id, home, r, name, onClick, badge, box, scale, className }: { id: string; home: Pt; r: number; name: string; onClick: (at: Pt) => void; badge?: string; box?: { x0: number; x1: number; y0: number; y1: number }; scale?: number; className?: string }) {
  const s = useScale();
  const [at, setAt] = useState(home);
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() >= 0.65) return;
      if (box) setAt({ x: box.x0 + 8 + Math.random() * (box.x1 - box.x0 - 16), y: box.y0 + 12 + Math.random() * (box.y1 - box.y0 - 16) });   // trong rào chuồng
      else setAt({ x: home.x + (Math.random() * 2 - 1) * r, y: home.y + (Math.random() * 2 - 1) * r * 0.45 });
    }, 2400 + Math.random() * 2200);
    return () => clearInterval(t);
  }, [home.x, home.y, r]);
  const fly = FLIERS.has(id);
  return <Follower sprite={critterSprite(id, 0)} walk={critterSprite(id, 1)} x={at.x} y={at.y - (fly ? 12 : 0)} title={name} onClick={() => onClick(at)} flap={fly} badge={badge} ps={scale ? s * scale : undefined} className={className} />;
}

/** ps: cỡ một pixel của sprite (mặc định = cỡ cảnh; người lớn dùng avatarPx để bằng nhân vật chính) */
export function Follower({ sprite, walk, x, y, title, onClick, flap, badge, ps, className, speed = 45 }: { sprite: Sprite; walk?: Sprite; x: number; y: number; title: string; onClick: () => void; flap?: boolean; badge?: string; ps?: number; className?: string; speed?: number }) {
  const s = useScale();
  const px = ps ?? s;
  const [shown, setShown] = useState({ x, y, ms: 0, left: false });
  const [moving, setMoving] = useState(false);
  const [step, setStep] = useState(false);
  const cur = useRef(shown);
  cur.current = shown;
  useEffect(() => {
    const c = cur.current, dist = Math.hypot(x - c.x, y - c.y);
    if (dist < 0.5) return;
    const ms = (dist / speed) * 1000;
    const t0 = setTimeout(() => { setShown({ x, y, ms, left: x < c.x }); setMoving(true); }, 300);
    const t1 = setTimeout(() => setMoving(false), ms + 310);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [x, y]);
  useEffect(() => {
    if (!moving && !flap) return;
    const t = setInterval(() => setStep(v => !v), flap ? 140 : 170);   // bay thì vỗ cánh liên tục
    return () => clearInterval(t);
  }, [moving, flap]);
  const sp = (moving || flap) && step && walk ? walk : sprite;
  const pos = {
    left: Math.round(shown.x * s - (sp.w / 2) * px), top: Math.round(shown.y * s - sp.h * px),
    transition: `left ${shown.ms}ms linear, top ${shown.ms}ms linear`,
  };
  return (
    <>
      <img src={sp.url} alt={title} title={title} draggable={false} className={`spr tappable ${className ?? ''}`}
        onClick={e => { e.stopPropagation(); onClick(); }}
        style={{ ...pos, width: sp.w * px, height: sp.h * px, zIndex: Math.round(shown.y) + 2, transform: shown.left ? 'scaleX(-1)' : undefined }} />
      {badge && <span className="crit-badge" style={{ ...pos, marginLeft: (sp.w / 2) * px, zIndex: 300 }}>{badge}</span>}
    </>
  );
}
