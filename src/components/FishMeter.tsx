// Thanh căn chuẩn khi kéo cá: mũi tên chạy qua lại, bấm đúng lúc.
// Xanh = cá to/ngon · Vàng = đồ dởm · Xám = hụt (kéo sớm/trễ, cá chạy) · Đỏ = kéo quá tay, đứt dây.
import { useEffect, useMemo, useRef, useState } from 'react';

export type Zone = 'green' | 'yellow' | 'gray' | 'red';
interface Seg { from: number; to: number; zone: Zone }

/** Chia thanh 0..100: đỏ hai đầu, xám, vàng ôm sát đoạn xanh (vị trí xanh đổi mỗi lần) */
function layout(seed: number, greenW: number): Seg[] {
  const c = 30 + ((seed * 9301 + 49297) % 233280) / 233280 * 40;   // tâm đoạn xanh 30..70
  const g0 = c - greenW / 2, g1 = c + greenW / 2;
  return [
    { from: 0, to: 7, zone: 'red' },
    { from: 7, to: g0 - 9, zone: 'gray' },
    { from: g0 - 9, to: g0, zone: 'yellow' },
    { from: g0, to: g1, zone: 'green' },
    { from: g1, to: g1 + 9, zone: 'yellow' },
    { from: g1 + 9, to: 93, zone: 'gray' },
    { from: 93, to: 100, zone: 'red' },
  ];
}
export const ZONE_TEXT: Record<Zone, string> = {
  green: '🎯 Chuẩn! Cá to dính câu',
  yellow: '😅 Hơi lệch, kéo được đồ hơi dởm',
  gray: '💨 Hụt rồi, cá chạy mất',
  red: '💥 Kéo mạnh quá, đứt dây!',
};

/** `speed`: số lượt chạy hết thanh mỗi giây; `greenW`: độ rộng đoạn xanh (%) */
export function FishMeter({ onResult, speed = 0.9, greenW = 12, timeoutMs = 6000 }: { onResult: (z: Zone) => void; speed?: number; greenW?: number; timeoutMs?: number }) {
  const segs = useMemo(() => layout(Date.now() % 100000, greenW), [greenW]);
  const [pos, setPos] = useState(0);
  const [done, setDone] = useState<Zone | null>(null);
  const posRef = useRef(0);
  const doneRef = useRef(false);
  const cb = useRef(onResult);
  cb.current = onResult;

  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      if (doneRef.current) return;
      const ph = ((t - t0) / 1000) * speed;                 // chạy qua lại (ping-pong)
      const p = (ph % 2 < 1 ? ph % 1 : 1 - (ph % 1)) * 100;
      posRef.current = p; setPos(p);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const late = setTimeout(() => finish('gray'), timeoutMs); // chần chừ lâu quá thì cá chạy
    return () => { cancelAnimationFrame(raf); clearTimeout(late); };
  }, [speed, timeoutMs]); // eslint-disable-line react-hooks/exhaustive-deps

  function finish(z: Zone) {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(z);
    setTimeout(() => cb.current(z), 650);
  }
  const press = () => {
    const p = posRef.current;
    finish(segs.find(s => p >= s.from && p <= s.to)?.zone ?? 'gray');
  };
  const pressRef = useRef(press); pressRef.current = press;
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); pressRef.current(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  return (
    <div className="fish-meter" onPointerDown={e => { e.preventDefault(); press(); }}>
      <div className="fm-bar">
        {segs.map((s, i) => <i key={i} className={`fm-${s.zone}`} style={{ left: `${s.from}%`, width: `${Math.max(0, s.to - s.from)}%` }} />)}
        <b className="fm-arrow" style={{ left: `${pos}%` }}>▼</b>
      </div>
      <p className={`fm-msg ${done ?? ''}`}>{done ? ZONE_TEXT[done] : '❗ Cá cắn câu! Bấm khi mũi tên ở đoạn XANH (hoặc phím cách)'}</p>
    </div>
  );
}
