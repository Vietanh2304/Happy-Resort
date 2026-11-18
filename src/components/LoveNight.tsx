// Đêm thân mật kiểu "tắt đèn kéo rèm": không vẽ gì cụ thể, chỉ không khí, cảm xúc và kỷ niệm.
// Trình tự: (tắm bồn) → phòng mờ đèn, quần áo vắt dưới sàn, hộp Hy's Feel trên tủ → rèm khép, tim đập
// → màn đêm + lời nhắn + đồng hồ tua nhanh → rèm mở, hai đứa ôm nhau, má ửng hồng → mỗi người viết vài dòng.
import { useEffect, useState } from 'react';
import type { Profile } from '../lib/api';
import { item } from '../lib/content';
import { tubBackSprite, tubFrontSprite } from '../lib/interiors';
import { emojiSprite, makeSprite } from '../lib/pixel';
import { characterSprite } from '../lib/sprites';
import { avatarPx } from './Avatar';
import { Spr, useScale } from './Stage';

export type LoveStyle = 'candle' | 'stars' | 'bath';
export const LOVE_STYLES: { id: LoveStyle; icon: string; name: string; note: string }[] = [
  { id: 'candle', icon: '🕯️', name: 'Nến & hoa hồng', note: 'Đèn tắt, nến lung linh quanh giường' },
  { id: 'stars', icon: '🌌', name: 'Đêm đầy sao', note: 'Trần nhà hoá bầu trời sao lấp lánh' },
  { id: 'bath', icon: '🛁', name: 'Tắm bồn trước', note: 'Ngâm bồn bọt xà phòng cùng nhau đã' },
];
export const LOVE_CAPTIONS = ['Đêm nay chỉ có hai đứa mình thôi…', 'Ở gần nhau thế này là đủ rồi', 'Cảm ơn vì đã luôn ở đây với anh/em', 'Thế giới ngoài kia tạm tắt đèn nhé'];

export interface LoveNightCfg { style: LoveStyle; can: string | null; caption: string; start: number; startMin: number }
export type LovePhase = 'bath' | 'room' | 'curtain' | 'fade' | 'after';

const BATH_MS = 7000, ROOM_MS = 4000, CURTAIN_MS = 7000, FADE_MS = 8000;
/** Giai đoạn hiện tại và số phút đồng hồ đã tua qua */
export function useLoveNight(cfg: LoveNightCfg | null) {
  const [now, setNow] = useState(() => Date.now());
  const done = cfg ? Date.now() - cfg.start > (cfg.style === 'bath' ? BATH_MS : 0) + ROOM_MS + CURTAIN_MS + FADE_MS : true;
  useEffect(() => {
    if (!cfg || done) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [cfg, done]);
  if (!cfg) return null;
  const t = now - cfg.start, b = cfg.style === 'bath' ? BATH_MS : 0;
  const phase: LovePhase = t < b ? 'bath' : t < b + ROOM_MS ? 'room' : t < b + ROOM_MS + CURTAIN_MS ? 'curtain' : t < b + ROOM_MS + CURTAIN_MS + FADE_MS ? 'fade' : 'after';
  const ff = Math.max(0, Math.min(1, (t - b - ROOM_MS - CURTAIN_MS - 1500) / (FADE_MS - 3000)));
  const min = Math.round(cfg.startMin + ff * 150);
  const clock = `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  return { phase, clock, cfg };
}
export type LoveNight = NonNullable<ReturnType<typeof useLoveNight>>;

/** Quần áo vắt dưới sàn: áo sơ mi xanh, váy hồng nơ, đôi tất */
const clothesSprite = () => makeSprite('love-clothes', 26, 9, p => {
  p.map([
    '..........................',
    '...bbbbbb.................',
    '..bBbbbbbbb.....pppp......',
    '.bBbbwwbbbbb...pPpppppp...',
    '..bbbwwbbbb...pPppkkpppp..',
    '...bbbbbb....pPpppkkppppp.',
    '.....bb.....ppppppppppppp.',
    '..........ww.pPpPpPpPpPp..',
    '.........ww...............',
  ], { b: '#8ec4ec', B: '#b8dcf6', w: '#ffffff', p: '#f4a0bc', P: '#ffc8d8', k: '#e05a86' });
});
/** Cây nến nhỏ (lửa nhảy bằng CSS) */
const candleSprite = () => makeSprite('love-candle', 3, 7, p => { p.rect(0, 2, 3, 5, '#fff4e0'); p.rect(0, 2, 1, 5, '#ffffff'); p.px(1, 1, '#4a3020'); });
/** Bông hồng đặt cạnh nến */
const roseSprite = () => makeSprite('love-rose', 5, 6, p => p.map(['.rRr.', 'rRrRr', '.rrr.', '..g..', '.gg..', '..g..'], { r: '#d8304a', R: '#ff6a86', g: '#5a9a4a' }));

function Heart({ cls = '' }: { cls?: string }) {
  return <svg className={cls} viewBox="0 0 32 30"><path d="M16 29 C3 19 0 12 0 8 A8 8 0 0 1 16 5 A8 8 0 0 1 32 8 C32 12 29 19 16 29Z" /></svg>;
}

/** Các lớp hiệu ứng phủ lên phòng ngủ — vẽ trong BedLayer khi cả hai đang thân mật */
export function LoveScene({ night, me, partner, firstSeat, heads, nightstand, floor }: {
  night: LoveNight; me: Profile; partner: Profile | null; firstSeat: boolean;
  /** vị trí gối của mình và người ấy */
  heads: { x: number; y: number }[];
  /** chỗ đặt hộp Hy's Feel (cạnh đầu giường) và chỗ vắt quần áo (dưới sàn) */
  nightstand: { x: number; y: number }; floor: { x: number; y: number };
}) {
  const s = useScale();
  const { phase, cfg, clock } = night;
  const ps = avatarPx(s);
  const style = cfg.style === 'stars' ? 'stars' : 'candle';
  const lit = phase !== 'bath';
  const candles: [number, number][] = [[-30, 6], [-24, 10], [30, 6], [24, 10], [-6, 20], [6, 20]];
  return (
    <>
      {lit && <div className={`love-dim ${style} ${phase === 'after' ? 'soft' : ''}`} />}
      {lit && style === 'stars' && <div className="love-stars">{Array.from({ length: 34 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 46}%`, animationDelay: `${(i % 7) * 0.4}s` }} />)}</div>}
      {lit && style === 'candle' && candles.map(([dx, dy], i) => (
        <span key={i}>
          <Spr sprite={candleSprite()} x={floor.x + dx} y={floor.y + dy - 8} z={406} />
          <i className="love-flame" style={{ left: (floor.x + dx - 1) * s, top: (floor.y + dy - 18) * s, width: 3 * s, height: 4 * s }} />
          <i className="lightglow love-glow" style={{ left: (floor.x + dx - 12) * s, top: (floor.y + dy - 26) * s, width: 24 * s, height: 24 * s }} />
          {i % 2 === 0 && <Spr sprite={roseSprite()} x={floor.x + dx + 4} y={floor.y + dy - 7} z={406} />}
        </span>
      ))}
      {lit && <Spr sprite={clothesSprite()} x={floor.x} y={floor.y} z={406} className="love-pop" />}
      {lit && cfg.can && <Spr sprite={emojiSprite(item(cfg.can).icon, 9)} x={nightstand.x} y={nightstand.y} z={406} className="love-pop" title={item(cfg.can).name} />}
      {lit && <div className={`love-haze lite ${phase === 'after' ? 'after' : ''}`}>{Array.from({ length: phase === 'after' ? 10 : 18 }, (_, i) => <i key={i} style={{ left: `${(i * 23) % 96}%`, animationDelay: `${i * 0.45}s` }}>{['💕', '🌸', '✨', '💗', '🌹'][i % 5]}</i>)}</div>}
      {(phase === 'curtain' || phase === 'fade') && <div className="love-curtain sway"><i /><i /></div>}
      {phase === 'after' && <div className="love-curtain open"><i /><i /></div>}
      {phase === 'curtain' && <div className="love-beat"><Heart cls="beat" /><small>thình thịch… thình thịch…</small></div>}
      {phase === 'fade' && (
        <div className="love-night">
          <p className="love-cap">“{cfg.caption}”</p>
          <p className="love-clock">🌙 {clock}</p>
          <div className="love-dots"><i /><i /><i /></div>
        </div>
      )}
      {phase === 'after' && heads.map((h, i) => (
        <span key={i}>
          <i className="love-blush" style={{ left: (h.x - 5) * s, top: (h.y - 9) * s, width: 3 * s, height: 2 * s }} />
          <i className="love-blush" style={{ left: (h.x + 2) * s, top: (h.y - 9) * s, width: 3 * s, height: 2 * s }} />
          <i className="love-tuft" style={{ left: (h.x - 2 + i * 3) * s, top: (h.y - 20) * s }}>〰</i>
        </span>
      ))}
      {phase === 'after' && <div className="love-after-hearts"><Heart /><Heart /><Heart /></div>}
      {phase === 'bath' && (
        <div className="love-bath">
          <Spr sprite={tubBackSprite('rose')} x={108} y={128} z={431} />
          {[me, partner].map((who, i) => {
            if (!who) return null;
            const sp = characterSprite(who.avatar ?? {}, 'idle', undefined, 'front', 0);
            const left = (i === 0) === firstSeat;
            const x = 108 + (left ? -9 : 9);
            return <img key={i} src={sp.url} alt="" className="spr" draggable={false}
              style={{ left: Math.round(x * s - (sp.w * ps) / 2), top: Math.round(98 * s - sp.h * ps * 0.32), width: sp.w * ps, height: sp.h * ps, zIndex: 432, clipPath: 'inset(0 0 58% 0)', transform: left ? 'rotate(8deg)' : 'scaleX(-1) rotate(8deg)' }} />;
          })}
          <Spr sprite={tubFrontSprite('rose')} x={108} y={128} z={433} />
          <div className="love-steam" style={{ left: 70 * s, top: 54 * s, width: 76 * s, height: 40 * s }}>{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.5}s` }} />)}</div>
          <p className="love-bath-cap">🛁 Ngâm bồn hoa hồng cùng nhau…</p>
        </div>
      )}
    </>
  );
}

/** Sau đêm: mỗi người viết vài dòng cho người kia, lưu vào nhật ký */
export function LoveNoteCard({ callThem, theirNote, onSave }: { callThem: string; theirNote?: string; onSave: (text: string) => Promise<boolean> }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="love-note">
      {theirNote && <p className="love-note-their">💌 {callThem}: “{theirNote}”</p>}
      {saved ? <p className="muted small-note">✅ Đã cất vào 📓 Nhật ký → Những đêm của hai đứa</p> : (
        <div className="row wrap">
          <input value={text} maxLength={200} onChange={e => setText(e.target.value)} placeholder={`Viết vài dòng cho ${callThem} về đêm nay…`} style={{ flex: 1, minWidth: 160 }} />
          <button className="btn small" disabled={!text.trim() || busy} onClick={async () => { setBusy(true); if (await onSave(text.trim())) setSaved(true); setBusy(false); }}>💌 Gửi</button>
        </div>
      )}
    </div>
  );
}
