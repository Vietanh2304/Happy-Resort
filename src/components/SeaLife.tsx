// Cảnh biển sống động: mây trôi, hải âu vỗ cánh, cá heo nhảy, cua bò, sao lấp lánh + sao băng ban đêm,
// và vài thứ riêng của từng nơi (cáp treo chạy, người lướt sóng, thuyền buồm trôi). Toàn bộ là CSS chạy sẵn, không tốn JS.
import type { CSSProperties } from 'react';
import type { Phase } from '../lib/content';
import { cableCarSprite, cableY, crabSprite, dolphinSprite, gullSprite, LOUNGE, sailboatSprite, sugarY, surferSprite, type SeaSpot } from '../lib/seaView';
import { cloudSprite } from '../lib/sprites';
import { useScale } from './Stage';

const v = (o: Record<string, string | number>) => o as CSSProperties;

/** Hải âu: hai khung cánh luân phiên, bay ngang trời */
function Gull({ y, dur, delay, s, flip }: { y: number; dur: number; delay: number; s: number; flip?: boolean }) {
  const a = gullSprite(0), b = gullSprite(1);
  return (
    <div className={`gull ${flip ? 'back' : ''}`} style={v({ top: y * s, '--w': `${200 * s}px`, animationDuration: `${dur}s`, animationDelay: `${delay}s` })}>
      <img src={a.url} alt="" style={{ width: a.w * s, height: a.h * s }} />
      <img src={b.url} alt="" style={{ width: b.w * s, height: b.h * s }} className="f2" />
    </div>
  );
}

/** Đường đi (CSS offset-path) qua các điểm, tính theo pixel màn hình */
const pathOf = (pts: [number, number][], s: number) => `path('M ${pts.map(([x, y]) => `${(x * s).toFixed(1)} ${(y * s).toFixed(1)}`).join(' L ')}')`;

export function SeaLife({ phase, spot, beach = false }: { phase: Phase; spot: SeaSpot; beach?: boolean }) {
  const s = useScale();
  const night = phase === 'night';
  const { horizon, shore } = LOUNGE;
  const crab = [crabSprite(0), crabSprite(1)], dolphin = dolphinSprite(), cloud = cloudSprite(false);
  return (
    <div className="sealife">
      {/* Mây trôi chậm (ban ngày) / sao lấp lánh + sao băng (ban đêm) */}
      {!night && [[8, 90, -20], [22, 130, -75]].map(([y, dur, delay], i) => (
        <img key={`c${i}`} src={cloud.url} alt="" className="sl-cloud" style={v({ top: y * s, width: cloud.w * s * (i ? 0.8 : 1), height: cloud.h * s * (i ? 0.8 : 1), '--w': `${230 * s}px`, animationDuration: `${dur}s`, animationDelay: `${delay}s`, opacity: phase === 'day' ? 0.95 : 0.8 })} />
      ))}
      {night && Array.from({ length: 12 }, (_, i) => (
        <i key={`t${i}`} className="sl-star" style={{ left: ((i * 53) % 186 + 3) * s, top: ((i * 29) % (horizon - 14) + 3) * s, width: s * 1.2, height: s * 1.2, animationDelay: `${(i % 6) * 0.6}s` }} />
      ))}
      {night && <i className="sl-meteor" style={v({ left: 120 * s, top: 6 * s, width: 22 * s, '--d': `${-60 * s}px` })} />}

      {/* Hải âu */}
      {!night && !beach && <>
        <Gull y={14} dur={26} delay={-4} s={s} />
        <Gull y={22} dur={32} delay={-18} s={s} />
        <Gull y={10} dur={40} delay={-9} s={s} flip />
      </>}
      {!night && beach && <><Gull y={8} dur={24} delay={-6} s={s} /><Gull y={16} dur={34} delay={-20} s={s} flip /></>}

      {/* Cá heo nhảy lên khỏi mặt nước, thỉnh thoảng một lần */}
      {!beach && [[42, 76, 0], [132, 82, -7]].map(([x, y, delay], i) => (
        <div key={`d${i}`} className="sl-dolphin" style={v({ left: x * s, top: y * s, '--s': s, animationDelay: `${delay}s` })}>
          <img src={dolphin.url} alt="" style={{ width: dolphin.w * s, height: dolphin.h * s }} />
          <i className="sl-splash" style={{ width: 12 * s, height: 3 * s }} />
        </div>
      ))}

      {/* Cua bò ngang trên cát ướt */}
      {!night && (
        <div className="sl-crab" style={v({ top: (beach ? 116 : shore + 4) * s, '--w': `${(beach ? 60 : 40) * s}px`, left: (beach ? 100 : 136) * s })}>
          <img src={crab[0].url} alt="" style={{ width: crab[0].w * s, height: crab[0].h * s }} />
          <img src={crab[1].url} alt="" style={{ width: crab[1].w * s, height: crab[1].h * s }} className="f2" />
        </div>
      )}

      {/* Riêng từng nơi */}
      {!beach && spot === 'phuquoc' && [0, -9].map(d => {
        const c = cableCarSprite(d ? '#5aa8e0' : '#e8604a');
        return <img key={d} src={c.url} alt="" className="sl-cable" style={{ width: c.w * s, height: c.h * s, offsetPath: pathOf(Array.from({ length: 16 }, (_, i) => [i * 10, cableY(i * 10) + 1] as [number, number]), s), animationDuration: '18s', animationDelay: `${d}s` }} />;
      })}
      {!beach && spot === 'copacabana' && (() => {
        const c = cableCarSprite('#f6c64e');
        return <img src={c.url} alt="" className="sl-cable" style={{ width: c.w * s, height: c.h * s, offsetPath: pathOf(Array.from({ length: 9 }, (_, i) => [64 - i * 4.25, sugarY(64 - i * 4.25) + 1] as [number, number]), s), animationDuration: '12s' }} />;
      })()}
      {!beach && (spot === 'waikiki' || spot === 'copacabana' || spot === 'home') && (() => {
        const sf = surferSprite();
        return <img src={sf.url} alt="" className="sl-surfer" style={v({ top: (shore - 20) * s, width: sf.w * s, height: sf.h * s, '--w': `${120 * s}px`, left: 30 * s })} />;
      })()}
      {!beach && (spot === 'boracay' || spot === 'maldives' || spot === 'whitehaven') && (() => {
        const b = sailboatSprite();
        return <img src={b.url} alt="" className="sl-boat" style={v({ top: (horizon + 14) * s, width: b.w * s, height: b.h * s, '--w': `${220 * s}px` })} />;
      })()}
    </div>
  );
}
