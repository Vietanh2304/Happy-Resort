// Làm cảnh ngắm biển lộng lẫy: tia nắng + lóe sáng ống kính, mây ráng hoàng hôn, dải Ngân Hà + quầng trăng,
// sương phát sáng chân trời, mặt biển lấp lánh khắp nơi, cá nhảy, du thuyền, tàu lá dừa khung góc đung đưa,
// bóng lá lay trên cát, dâm bụt, ván lướt sóng, lâu đài cát, dấu chân, chỉnh màu theo giờ + tối góc.
import type { CSSProperties } from 'react';
import type { Phase } from '../lib/content';
import { frondCornerSprite } from '../lib/seaGlam';
import { LOUNGE } from '../lib/seaView';
import { useScale } from './Stage';

const v = (o: Record<string, string | number>) => o as CSSProperties;
const rnd = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

export function SeaGlam({ phase, sky }: { phase: Phase; sky: { kind: 'sun' | 'moon'; x: number; y: number } | null }) {
  const s = useScale();
  const { horizon, shore } = LOUNGE;
  const night = phase === 'night', dusk = phase === 'sunset' || phase === 'dawn';
  const frond = frondCornerSprite();
  const up = sky && sky.y < horizon;
  const sunUp = up && sky!.kind === 'sun', moonUp = up && sky!.kind === 'moon';
  return (
    <>
      {/* ── Trời ── */}
      {night && <div className="milkyway" style={{ height: horizon * s }} />}
      {night && <div className="glam-stars" style={{ height: (horizon - 4) * s }}>{Array.from({ length: 46 }, (_, i) => <i key={i} style={{ left: `${rnd(i, 1) * 100}%`, top: `${rnd(i, 2) * 100}%`, width: (rnd(i, 3) < 0.15 ? 1.6 : 0.9) * s, height: (rnd(i, 3) < 0.15 ? 1.6 : 0.9) * s, animationDelay: `${-rnd(i, 4) * 4}s` }} />)}</div>}
      {moonUp && <i className="moon-halo" style={{ left: sky!.x * s, top: sky!.y * s, width: 44 * s, height: 44 * s }} />}
      {sunUp && (
        <div className="sun-rays-clip" style={{ height: horizon * s }}>
          <i className={`sun-rays ${phase}`} style={{ left: sky!.x * s, top: sky!.y * s, width: 110 * s, height: 110 * s }} />
        </div>
      )}
      {dusk && [[10, 20, 70, 0], [70, 30, 90, -40], [120, 14, 60, -80], [30, 40, 50, -20]].map(([x, y, w, d], i) => (
        <i key={`r${i}`} className={`dusk-cloud ${phase}`} style={v({ left: x * s, top: y * s, width: w * s, height: 4 * s, '--w': `${60 * s}px`, animationDelay: `${d}s` })} />
      ))}
      <i className={`horizon-haze ${phase}`} style={{ top: (horizon - 6) * s, height: 12 * s }} />
      {/* lóe sáng ống kính (ban ngày, khi có nắng) */}
      {sunUp && phase === 'day' && [0.35, 0.6, 0.85].map((t, i) => (
        <i key={`f${i}`} className="lens-flare" style={{ left: (sky!.x + (96 - sky!.x) * t * 1.4) * s, top: (sky!.y + (120 - sky!.y) * t) * s, width: (6 + i * 5) * s, height: (6 + i * 5) * s }} />
      ))}

      {/* ── Biển ── */}
      <div className="sea-shimmer">
        {Array.from({ length: 70 }, (_, i) => {
          const t = rnd(i, 5), y = horizon + 2 + t * t * (shore - horizon - 10);
          return <i key={i} className={night ? 'n' : dusk ? 'd' : ''} style={{ left: rnd(i, 6) * 190 * s, top: y * s, width: (2 + t * 8) * s, height: Math.max(1, s * (0.6 + t * 0.6)), animationDelay: `${-rnd(i, 7) * 3}s`, animationDuration: `${2 + rnd(i, 8) * 2.5}s` }} />;
        })}
      </div>
      {[[60, 70, 0], [140, 80, -5], [100, 92, -9]].map(([x, y, d], i) => (
        <div key={`j${i}`} className="fish-jump" style={v({ left: x * s, top: y * s, '--s': s, animationDelay: `${d}s` })}><b /><i /></div>
      ))}

      {/* ── Bãi cát ── */}
      {phase === 'day' && <div className="leaf-shadows" style={{ top: (shore + 6) * s, height: (144 - shore - 6) * s }}>{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ left: `${[2, 14, 70, 82, 92][i]}%`, animationDelay: `${-i * 0.9}s` }} />)}</div>}

      {/* ── Khung lá dừa hai góc trên ── */}
      <img src={frond.url} alt="" className={`frond-frame left ${night ? 'dim' : ''}`} style={{ width: frond.w * s * 0.72, height: frond.h * s * 0.72 }} />
      <img src={frond.url} alt="" className={`frond-frame right ${night ? 'dim' : ''}`} style={{ width: frond.w * s * 0.62, height: frond.h * s * 0.62 }} />

      {/* ── Chỉnh màu theo giờ + tối góc ── */}
      <div className={`lounge-grade ${phase}`} />
    </>
  );
}
