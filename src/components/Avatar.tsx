import { useEffect, useRef, useState } from 'react';
import type { Hold } from '../lib/props';
import { characterSprite, type AvatarLook, type View } from '../lib/sprites';
import { umbrellaSprite } from '../lib/places';
import { useScale } from './Stage';

const SPEED = 45; // pixel logic mỗi giây

/** Cỡ một pixel của nhân vật trên màn hình: ~80% cảnh, làm tròn theo pixel thật để không nhòe */
export function avatarPx(s: number) {
  const dpr = window.devicePixelRatio || 1;
  return Math.max(1, Math.round(s * dpr * 0.8)) / dpr;
}

interface Props {
  look: AvatarLook;
  x: number;
  y: number;
  sitting?: boolean;
  faceLeft?: boolean;
  name?: string;
  bubble?: string;
  onArrive?: () => void;
  onClick?: () => void;
  /** Đang cầm đồ và làm động tác (nhấp cà phê, gắp ăn, nướng kẹo, đọc sách) */
  hold?: Hold;
  /** Trạng thái "đang làm gì" hiện trên đầu */
  status?: string | null;
  /** Trời mưa: che ô */
  umbrella?: boolean;
  /** Độ sâu theo vị trí (trong phòng: đứng trước đồ thì vẽ đè lên đồ) */
  zAt?: (x: number, y: number) => number;
  /** Đang nhảy: động tác (0..7), lúc bắt đầu, cả hai cùng trúng nhịp */
  dance?: { m: number; at: number; both?: boolean } | null;
}

/** Nhân vật pixel: đổi (x, y) là tự đi tới đó, có bước chân và nhún nhảy */
export function Avatar({ look, x, y, sitting, faceLeft, name, bubble, onArrive, onClick, hold, status, umbrella, zAt, dance }: Props) {
  const phase = useHoldPhase(hold?.mode);
  const s = useScale();
  const [shown, setShown] = useState({ x, y, ms: 0, left: !!faceLeft });
  const [step, setStep] = useState(0);
  const [moving, setMoving] = useState(false);
  const [view, setView] = useState<View>('front');
  const arrive = useRef(onArrive);
  arrive.current = onArrive;
  const shownRef = useRef(shown);
  shownRef.current = shown;

  // Mục tiêu mới → tính thời gian đi theo quãng đường
  useEffect(() => {
    const cur = shownRef.current;
    const dist = Math.hypot(x - cur.x, y - cur.y);
    if (dist < 0.5) { arrive.current?.(); return; }
    const dx = x - cur.x, dy = y - cur.y;
    setShown({ x, y, ms: (dist / SPEED) * 1000, left: dx < -0.5 ? true : dx > 0.5 ? false : cur.left });
    // Hướng nhìn theo hướng đi: ngang → nghiêng, lên → quay lưng, xuống → mặt trước
    setView(Math.abs(dx) > Math.abs(dy) * 1.2 ? 'side' : dy < 0 ? 'back' : 'front');
    setMoving(true);
    const t = setTimeout(() => { setMoving(false); arrive.current?.(); }, (dist / SPEED) * 1000);
    return () => clearTimeout(t);
  }, [x, y]);

  useEffect(() => {
    if (!moving) return;
    const t = setInterval(() => setStep(v => (v + 1) % 4), 130);
    return () => { clearInterval(t); setStep(0); };
  }, [moving]);
  // Đứng yên một lúc thì quay mặt ra phía trước
  useEffect(() => {
    if (moving || view === 'front') return;
    const t = setTimeout(() => setView('front'), 1500);
    return () => clearTimeout(t);
  }, [moving, view]);

  useEffect(() => { if (faceLeft !== undefined && !moving) setShown(v => ({ ...v, left: faceLeft })); }, [faceLeft, moving]);

  const dancing = !!dance && !moving && !sitting;
  const sprite = dancing ? characterSprite(look, 'dance', undefined, 'front', dance!.m) : characterSprite(look, sitting ? 'sit' : moving ? 'walk' : 'idle', hold && !moving ? { ...hold, phase } : undefined, sitting ? 'front' : view, step);
  const ax = sprite.ax ?? sprite.w / 2;
  const ps = avatarPx(s);
  return (
    <div
      className={`avatar ${onClick ? 'tappable' : ''}`}
      style={{
        left: shown.x * s, top: shown.y * s, zIndex: zAt ? zAt(shown.x, shown.y) : Math.round(shown.y) + 1,
        transition: `left ${shown.ms}ms linear, top ${shown.ms}ms linear`,
      }}
      onClick={onClick && (e => { e.stopPropagation(); onClick(); })}
    >
      {dancing && dance!.both && <span key={`h${dance!.at}`} className="dance-hearts">💞</span>}
      <img
        key={dancing ? `d${dance!.at}` : 'still'} className={dancing ? `dancing dm-${dance!.m}` : undefined}
        src={sprite.url} alt={name ?? ''} draggable={false}
        style={{
          width: sprite.w * ps, height: sprite.h * ps,
          marginLeft: -Math.round(ax * ps), transformOrigin: `${Math.round(ax * ps)}px 50%`, marginTop: -Math.round(sprite.h * ps),
          transform: shown.left ? 'scaleX(-1)' : undefined,
        }}
      />
      {umbrella && !hold && (() => {
        const u = umbrellaSprite(look.gender === 'm' ? '#8db8ef' : '#f08aa6');
        const handX = shown.left ? -4 : 4, grip = shown.left ? 20 - 1 - 15 : 15;
        return <img src={u.url} alt="" draggable={false} className="umbrella"
          style={{ width: u.w * ps, height: u.h * ps, marginLeft: Math.round((handX - grip - 1) * ps), marginTop: Math.round(-(sitting ? 35 : 37) * ps), transform: shown.left ? 'scaleX(-1)' : undefined }} />;
      })()}
      {name && <span className="avatar-name" style={{ top: 2 * s }}>{name}</span>}
      {status && !bubble && <span className="avatar-status" style={{ bottom: sprite.h * ps + 3 }}>{status}</span>}
      {bubble && <span className="speech" style={{ bottom: sprite.h * ps + 4 }}>{bubble}</span>}
    </div>
  );
}

/** Nhịp động tác: nhấp một ngụm mỗi vài giây, gắp ăn đều đều, xoay que nướng, thỉnh thoảng lật trang */
function useHoldPhase(mode?: Hold['mode']): 0 | 1 {
  const [phase, setPhase] = useState<0 | 1>(0);
  useEffect(() => {
    if (!mode) { setPhase(0); return; }
    const [every, dur] = mode === 'sip' ? [4800, 1300] : mode === 'eat' ? [2600, 900] : mode === 'roast' ? [800, 400] : mode === 'fish' ? [2200, 500] : mode === 'pour' ? [600, 300] : mode === 'carry' ? [1800, 700] : [5200, 700];
    let off: ReturnType<typeof setTimeout>;
    const start = setTimeout(function tick() {
      setPhase(1);
      off = setTimeout(() => setPhase(0), dur);
      start2 = setTimeout(tick, every);
    }, Math.random() * every);
    let start2: ReturnType<typeof setTimeout>;
    return () => { clearTimeout(start); clearTimeout(start2); clearTimeout(off); };
  }, [mode]);
  return phase;
}
