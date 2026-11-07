// Những điều lãng mạn ở ghế ngắm biển:
//  - Đêm: sóng phát sáng xanh (sinh vật phù du), dây đèn giăng giữa hai cây dù, đuốc tiki, nến trên bàn, đèn thuyền câu mực ngoài khơi
//  - Hoàng hôn/bình minh: đàn chim bay hình chữ V; ban ngày: mây hình trái tim, máy bay kéo băng rôn tên hai đứa
//  - Cùng làm: nắm tay (cả hai cùng bấm → tim bay lên), viết tên lên cát (sóng xóa dần), thả đèn hoa đăng trôi ra khơi
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Phase } from '../lib/content';
import { onEvent } from '../lib/realtime';
import { emojiSprite } from '../lib/pixel';
import { gullSprite, LOUNGE } from '../lib/seaView';
import { lotusSprite } from '../lib/seaGlam';
import { planeSprite } from '../lib/skydive';
import type { LiveState } from '../lib/useLive';
import { Spr, Tag, useScale } from './Stage';

const v = (o: Record<string, string | number>) => o as CSSProperties;
export const SAND_MS = 3 * 60_000;           // chữ trên cát còn chừng này rồi sóng xóa mất
const LANTERN_MS = 40_000;

/** Bấm "thả đèn hoa đăng" ở bảng điều khiển → cảnh hiện đèn (người ấy nhận qua realtime) */
export const releaseLantern = (x: number) => window.dispatchEvent(new CustomEvent('hy:lantern', { detail: { x, mine: true } }));

interface Lantern { key: number; x: number; mine: boolean }

export function Romance({ phase, mine, theirs, meName, themName }: { phase: Phase; mine: LiveState; theirs: LiveState | null; meName: string; themName: string | null }) {
  const s = useScale();
  const night = phase === 'night', dusk = phase === 'sunset' || phase === 'dawn';
  const lit = night || phase === 'sunset';
  const { horizon, shore } = LOUNGE;

  // Đèn hoa đăng (của mình và của người ấy)
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const n = useRef(0);
  useEffect(() => {
    const add = (x: number, mineL: boolean) => {
      const key = ++n.current;
      setLanterns(l => [...l.slice(-7), { key, x, mine: mineL }]);
      setTimeout(() => setLanterns(l => l.filter(i => i.key !== key)), LANTERN_MS);
    };
    const local = (e: Event) => add((e as CustomEvent).detail.x, true);
    window.addEventListener('hy:lantern', local);
    const off = onEvent('sea-lantern', (d: { x?: number }) => add(d?.x ?? 96, false));
    return () => { window.removeEventListener('hy:lantern', local); off?.(); };
  }, []);

  // Chữ viết trên cát: lấy lần viết mới nhất của hai người
  const sand = [mine.sand, theirs?.sand].filter(Boolean).sort((a, b) => b!.at - a!.at)[0];
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);
  const sandAge = sand ? now - sand.at : Infinity;

  const holding = mine.act === 'hold' && theirs?.act === 'hold';
  const reaching = !holding && (mine.act === 'hold' || theirs?.act === 'hold');
  const plane = planeSprite();
  const gull = gullSprite(0), gull2 = gullSprite(1);

  return (
    <>
      {/* Mây hình trái tim trôi chậm (ban ngày) */}
      {phase === 'day' && <i className="heart-cloud" style={v({ top: 12 * s, width: 16 * s, height: 14 * s, '--w': `${220 * s}px` })} />}
      {/* Máy bay kéo băng rôn tên hai đứa, mỗi phút bay ngang một lần */}
      {!night && (
        <div className="banner-plane" style={v({ top: 6 * s, '--w': `${260 * s}px` })}>
          <span className="banner" style={{ fontSize: Math.max(9, 4.2 * s), padding: `${0.6 * s}px ${2 * s}px` }}>{themName ? `${meName} 💗 ${themName}` : `💗 ${meName}`}</span>
          <i className="banner-rope" style={{ width: 6 * s }} />
          <img src={plane.url} alt="" style={{ width: plane.w * s * 0.3, height: plane.h * s * 0.3 }} />
        </div>
      )}
      {/* Đàn chim chữ V lúc hoàng hôn / bình minh */}
      {dusk && (
        <div className="v-flock" style={v({ top: 16 * s, '--w': `${240 * s}px` })}>
          {[[0, 0], [-6, -3], [-6, 3], [-12, -6], [-12, 6]].map(([dx, dy], i) => <img key={i} src={(i % 2 ? gull2 : gull).url} alt="" style={{ left: (12 + dx) * s, top: (8 + dy) * s, width: gull.w * s * 0.8, height: gull.h * s * 0.8, animationDelay: `${i * 0.12}s` }} />)}
        </div>
      )}
      {/* Đèn thuyền câu mực lấp lánh ngoài khơi */}
      {night && [[18, 1], [44, 2], [70, 1], [128, 2], [150, 1], [176, 3]].map(([x, dy], i) => <i key={`sq${i}`} className="squid-light" style={{ left: x * s, top: (horizon + dy) * s, width: 1.6 * s, height: 1.6 * s, animationDelay: `${i * 0.4}s` }} />)}
      {/* Dây đèn giăng giữa hai cây dù + quanh mép dù */}
      {lit && (
        <div className="string-lights">
          {Array.from({ length: 22 }, (_, i) => {
            const t = i / 21, x = 34 + t * 124;
            const y = x < 76 ? 87 + Math.sin(((x - 31) / 45) * Math.PI) * 1.5 : x > 116 ? 87 + Math.sin(((x - 117) / 45) * Math.PI) * 1.5 : 87 + Math.sin(((x - 76) / 40) * Math.PI) * 7;
            return <i key={i} style={{ left: x * s, top: y * s, width: 1.6 * s, height: 1.6 * s, background: ['#fff1a8', '#ffb0d0', '#a8e0ff'][i % 3], animationDelay: `${(i % 5) * 0.3}s` }} />;
          })}
        </div>
      )}
      {/* Đuốc tiki + nến trên bàn */}
      {lit && <>
        <div className="tiki" style={{ left: 187 * s, top: 104 * s, width: 3 * s, height: 24 * s, zIndex: 125 }}><b style={{ width: 5 * s, height: 7 * s }} /></div>
        <Spr sprite={emojiSprite('🕯️', 6)} x={LOUNGE.table.x + 5} y={LOUNGE.table.y + 1} z={133} />
        <i className="candle-glow" style={{ left: (LOUNGE.table.x + 5) * s, top: (LOUNGE.table.y - 6) * s, width: 24 * s, height: 24 * s }} />
      </>}

      {/* Chữ viết trên cát: mờ dần, gần hết giờ thì sóng tràn lên xóa */}
      {sand && sandAge < SAND_MS && (
        <div className={`sand-writing ${sandAge > SAND_MS - 15_000 ? 'washing' : ''}`} style={{ left: 158 * s, top: (shore + 4) * s, fontSize: Math.max(10, (sand.text.length > 12 ? 5.5 - Math.min(2, (sand.text.length - 12) * 0.2) : 6.5) * s) }}>
          {sand.text}
        </div>
      )}

      {/* Đèn hoa đăng trôi từ bờ ra khơi */}
      {lanterns.map(l => (
        <div key={l.key} className={`sea-lantern ${l.mine ? 'mine' : ''}`} style={v({ left: l.x * s, top: (shore - 2) * s, '--rise': `${-(shore - horizon - 4) * s}px`, '--drift': `${(96 - l.x) * 0.4 * s}px`, animationDuration: `${LANTERN_MS}ms` })}>
          <b style={{ width: 22 * s, height: 8 * s }} /><img src={lotusSprite(l.mine).url} alt="" style={{ width: 16 * s, height: 13 * s }} />
        </div>
      ))}

      {/* Nắm tay: cả hai cùng nắm thì tim bay lên giữa hai ghế */}
      {holding && <div className="hold-hearts" style={{ left: 96 * s, top: (LOUNGE.chairTop - 6) * s }}>{['💗', '💕', '💞', '💗'].map((h, i) => <span key={i} style={{ animationDelay: `${i * 0.8}s`, left: (i % 2 ? 3 : -3) * s }}>{h}</span>)}</div>}
      {holding && <Tag x={96} y={LOUNGE.chairTop + 3} className="label hold-tag">🤝</Tag>}
      {reaching && <Tag x={96} y={LOUNGE.chairTop + 3} className="label">🤚 …</Tag>}
    </>
  );
}
