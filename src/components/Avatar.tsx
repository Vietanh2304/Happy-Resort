import { useEffect, useRef, useState } from 'react';
import type { Hold } from '../lib/props';
import { characterSprite, type AvatarLook, type View } from '../lib/sprites';
import { umbrellaSprite } from '../lib/places';
import { makeSprite } from '../lib/pixel';

/** Bình dưỡng khí vàng đeo sau lưng khi lặn */
const tankSprite = () => makeSprite('dive-tank', 4, 10, p => { p.rect(0, 1, 4, 9, '#f6c64e'); p.rect(1, 0, 2, 1, '#8a8098'); p.rect(0, 3, 4, 1, '#c8a020'); p.rect(1, 2, 1, 7, '#ffe08a'); });
import { useScale } from './Stage';
import { actFrame, actMs, type Act } from '../lib/acts';

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
  /** Đang làm động tác (té nước, búng tai…) */
  act?: Act | null;
  /** Khiêu vũ đôi: đứng bên trái/phải của cặp; together = người ấy cũng đang ở sàn */
  duo?: { side: 'L' | 'R'; together: boolean };
  /** Đang lặn: nằm ngang bơi, đeo bình dưỡng khí, thở ra bong bóng */
  swim?: boolean;
  /** Lặn đêm: rọi đèn pin về phía trước */
  torch?: boolean;
}

/** Nhân vật pixel: đổi (x, y) là tự đi tới đó, có bước chân và nhún nhảy */
export function Avatar({ look, x, y, sitting, faceLeft, name, bubble, onArrive, onClick, hold, status, umbrella, zAt, dance, act, duo, swim, torch }: Props) {
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
    if (!moving && !swim) return;
    const t = setInterval(() => setStep(v => (v + 1) % 4), moving ? 130 : 320);   // lặn: đứng yên vẫn đạp chân nhẹ
    return () => { clearInterval(t); setStep(0); };
  }, [moving, swim]);
  // Đứng yên một lúc thì quay mặt ra phía trước
  useEffect(() => {
    if (moving || view === 'front') return;
    const t = setTimeout(() => setView('front'), 1500);
    return () => clearTimeout(t);
  }, [moving, view]);

  useEffect(() => { if (faceLeft !== undefined && !moving) setShown(v => ({ ...v, left: faceLeft })); }, [faceLeft, moving]);

  const dancing = !!dance && !moving && !sitting;
  // Động tác: vẽ lại theo nhịp khung cho tới khi xong
  const [, tickAct] = useState(0);
  useEffect(() => {
    if (!act) return;
    const t = setInterval(() => tickAct(v => v + 1), 70);
    const end = setTimeout(() => clearInterval(t), actMs(act.n) + 100);
    return () => { clearInterval(t); clearTimeout(end); };
  }, [act]);
  const af = moving ? null : actFrame(act, Date.now());
  // Khiêu vũ đôi: mỗi động tác là một nửa của điệu nhảy hai người (nắm tay, xoay, waltz, ngả người…)
  const pair = duo && !moving && !sitting ? duoPose(duo, dancing ? dance!.m : null) : null;
  const sprite = af !== null ? characterSprite(look, sitting ? 'actsit' : 'act', undefined, 'front', af)
    : pair ? (pair.f === 'side' ? characterSprite(look, 'idle', undefined, 'side') : characterSprite(look, 'act', undefined, 'front', pair.f))
    : dancing ? characterSprite(look, 'dance', undefined, 'front', dance!.m) : characterSprite(look, sitting ? 'sit' : moving ? 'walk' : 'idle', hold && !moving ? { ...hold, phase } : undefined, sitting ? 'front' : view, step);
  const ax = sprite.ax ?? sprite.w / 2;
  const ps = avatarPx(s);
  if (swim) {
    // Bơi: thân nằm ngang (xoay 75°), bình dưỡng khí trên lưng, bong bóng thở nổi lên từ đầu
    const sw = characterSprite(look, 'walk', undefined, 'side', step), tank = tankSprite();
    const W = sw.w * ps, H = sw.h * ps, rot = `${shown.left ? 'scaleX(-1) ' : ''}rotate(75deg)`;
    return (
      <div className={`avatar ${onClick ? 'tappable' : ''}`}
        style={{ left: shown.x * s, top: shown.y * s, zIndex: Math.round(shown.y) + 1, transition: `left ${shown.ms}ms linear, top ${shown.ms}ms linear` }}
        onClick={onClick && (e => { e.stopPropagation(); onClick(); })}>
        <span className="diver" style={{ width: W, height: H, left: -W / 2, top: -H * 0.75, transform: rot }}>
          <img src={tank.url} alt="" draggable={false} style={{ width: tank.w * ps, height: tank.h * ps, left: 1 * ps, top: 9 * ps }} />
          <img src={sw.url} alt={name ?? ''} draggable={false} style={{ width: W, height: H }} />
        </span>
        {torch && <i className={`dive-torch ${shown.left ? 'left' : ''}`} style={{ left: shown.left ? -H * 0.4 : H * 0.4, top: -H * 0.25 }} />}
        <span className="dive-breath" style={{ left: (shown.left ? -H * 0.55 : H * 0.45), top: -H * 0.25 - 40 }}><i /><i /><i /></span>
        {name && <span className="avatar-name" style={{ top: 2 * s }}>{name}</span>}
        {bubble && <span className="speech" style={{ bottom: H * 0.5 + 6 }}>{bubble}</span>}
      </div>
    );
  }
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
        key={dancing ? `d${dance!.at}` : 'still'} className={pair ? `duo duo-${pair.cls} duo-${duo!.side}` : dancing ? `dancing dm-${dance!.m}` : undefined}
        src={sprite.url} alt={name ?? ''} draggable={false}
        style={{
          width: sprite.w * ps, height: sprite.h * ps,
          marginLeft: -Math.round(ax * ps), transformOrigin: `${Math.round(ax * ps)}px 50%`, marginTop: -Math.round(sprite.h * ps),
          transform: pair ? undefined : shown.left ? 'scaleX(-1)' : undefined,
          scale: pair?.f === 'side' && duo!.side === 'R' ? '-1 1' : undefined,
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

/** Điệu nhảy đôi: động tác m (0..7) → khung động tác của người bên trái/phải ('side' = quay mặt vào nhau) */
const DUO: { L: number | 'side'; R: number | 'side'; cls: string }[] = [
  { L: 15, R: 16, cls: 'sway' },      // nắm tay đung đưa
  { L: 17, R: 18, cls: 'twirl' },     // giơ tay cho người kia xoay một vòng
  { L: 'side', R: 'side', cls: 'waltz' }, // waltz: quay mặt vào nhau, lướt nhẹ
  { L: 15, R: 16, cls: 'dip' },       // ngả người
  { L: 12, R: 12, cls: 'hop' },       // cùng giơ tay nhún nhảy
  { L: 15, R: 16, cls: 'slide' },     // nắm tay lướt sang
  { L: 19, R: 20, cls: 'clap' },      // đập tay nhau
  { L: 'side', R: 'side', cls: 'hug' }, // ôm nhau
];
function duoPose(duo: { side: 'L' | 'R'; together: boolean }, m: number | null): { f: number | 'side'; cls: string } | null {
  if (m === null) return duo.together ? { f: duo.side === 'L' ? 15 : 16, cls: 'hold' } : null;   // đứng nắm tay chờ nhạc
  const d = DUO[m % DUO.length];
  return { f: d[duo.side], cls: d.cls };
}
