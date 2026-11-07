// Cảnh "ghế dài ngắm biển": nhìn từ sau lưng hai chiếc ghế ra biển. Nằm ghế thì thấy sau đầu nhô khỏi lưng ghế,
// xuống tắm thì thấy cả hai bơi ngoài biển (nước ngang vai, nhấp nhô theo sóng).
import type { Profile } from '../lib/api';
import { content } from '../lib/content';
import type { Phase } from '../lib/content';
import { emojiSprite } from '../lib/pixel';
import { beachBarSprite, celestial, LOUNGE, loungerBackSprite, parasolSprite, sailboatSprite, sideTableSprite } from '../lib/seaView';
import { characterSprite, palmSprite } from '../lib/sprites';
import type { LiveState } from '../lib/useLive';
import { avatarPx } from './Avatar';
import { Spr, Tag, useScale } from './Stage';
import { SeaLife } from './SeaLife';
import type { SeaSpot } from '../lib/seaView';

/** Món ở quầy bar dừa (tên → biểu tượng) */
export const BAR_ICON = (name: string | null | undefined) => content.beachBar.flatMap(c => c.items).find(i => i.name === name)?.icon;

interface Props {
  phase: Phase; hour: number; minute: number;
  me: { look: Profile['avatar']; live: LiveState; bubble?: string };
  them: { look: Profile['avatar']; live: LiveState; bubble?: string; name: string } | null;
  firstSeat: boolean;
  spot: SeaSpot;
  onBar: () => void;
}

export function LoungeContent({ phase, hour, minute, me, them, firstSeat, spot, onBar }: Props) {
  const s = useScale();
  const ps = avatarPx(s);
  const sky = celestial(hour, minute);
  const { horizon, shore } = LOUNGE;
  const glow = sky?.kind === 'moon' ? '#e8ecff' : phase === 'sunset' || phase === 'dawn' ? '#ffb070' : '#fff6c8';
  const people = [{ who: 'me' as const, ...me, seat: firstSeat ? 0 : 1 }, ...(them ? [{ who: 'them' as const, ...them, seat: firstSeat ? 1 : 0 }] : [])];

  return (
    <>
      {/* Mặt trời / mặt trăng theo giờ thật (khuất dưới chân trời thì không thấy) */}
      <div className="lounge-sky" style={{ height: horizon * s }}>
        {sky && <i className={`lounge-${sky.kind} ${phase}`} style={{ left: sky.x * s, top: sky.y * s, width: (sky.kind === 'sun' ? 12 : 9) * s, height: (sky.kind === 'sun' ? 12 : 9) * s }} />}
      </div>
      {/* Vệt lấp lánh trên mặt nước dưới mặt trời/mặt trăng */}
      {sky && sky.y < horizon && (
        <div className="lounge-glitter" style={{ left: (sky.x - 10) * s, top: (horizon + 1) * s, width: 20 * s, height: (shore - horizon - 4) * s, color: glow }}>
          {Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 90}%`, top: `${(i * 23) % 95}%`, animationDelay: `${(i % 7) * 0.35}s` }} />)}
        </div>
      )}
      {/* Sóng: các lớp bọt chạy vào bờ, mép nước vỗ lên cát */}
      <div className="lounge-waves" style={{ top: (shore - 22) * s, height: 30 * s }}>
        {[0, 1, 2].map(i => <i key={i} style={{ animationDelay: `${i * 1.7}s` }} />)}
        <b />
      </div>
      <SeaLife phase={phase} spot={spot} />
      <Spr sprite={sailboatSprite()} x={0} y={horizon + 6} z={2} className="sail-drift" />
      {spot !== 'navagio' && spot !== 'seychelles' && <Spr sprite={palmSprite(1)} x={182} y={124} className="palm-sway" />}
      <Spr sprite={beachBarSprite()} x={LOUNGE.bar.x} y={LOUNGE.bar.y} title="🥥 Quầy bar dừa — gọi nước, hải sản" onClick={onBar} />
      <Tag x={LOUNGE.bar.x} y={LOUNGE.bar.y - 52} className="label" onClick={onBar}>🥥 Bar dừa</Tag>

      {LOUNGE.chairs.map((c, i) => <Spr key={`p${i}`} sprite={parasolSprite(i ? '#5aa8e0' : '#f08aa6')} x={c.x + (i ? 17 : -17)} y={128} z={110} />)}
      {people.map(p => {
        const c = LOUNGE.chairs[p.seat];
        const swim = p.live.act === 'swim';
        if (swim) {
          // Bơi: thấy mặt (kính râm), nước ngang vai, nhấp nhô
          const at = LOUNGE.swim[p.seat], sp = characterSprite(p.look, 'idle', undefined, 'front');
          return (
            <div key={p.who} className={`swimmer ${p.who}`} style={{ left: at.x * s, top: at.y * s, zIndex: 60 }}>
              <img src={sp.url} alt="" draggable={false} style={{ width: sp.w * ps, height: sp.h * ps, marginLeft: -(sp.w * ps) / 2, marginTop: -sp.h * ps * 0.5, clipPath: 'inset(0 0 52% 0)' }} />
              <i className="swim-ripple" style={{ width: 16 * s, height: 4 * s, marginLeft: -8 * s, marginTop: -2 * s }} />
              {p.bubble && <span className="speech" style={{ bottom: sp.h * ps + 4 }}>{p.bubble}</span>}
            </div>
          );
        }
        // Nằm ghế: nhìn từ sau lưng, đầu nhô khỏi lưng ghế
        const sp = characterSprite(p.look, 'idle', undefined, 'back');
        return (
          <div key={p.who} className="lounger-rider" style={{ left: c.x * s, top: (LOUNGE.chairTop - 11) * s, zIndex: 118 }}>
            <img src={sp.url} alt="" draggable={false} style={{ width: sp.w * ps, height: sp.h * ps, marginLeft: -(sp.w * ps) / 2 }} />
            {p.bubble && <span className="speech" style={{ bottom: `calc(100% + 4px)` }}>{p.bubble}</span>}
          </div>
        );
      })}
      {LOUNGE.chairs.map((c, i) => <Spr key={`l${i}`} sprite={loungerBackSprite(i ? '#5aa8e0' : '#f08aa6')} x={c.x} y={144} z={130} />)}
      <Spr sprite={sideTableSprite()} x={LOUNGE.table.x} y={LOUNGE.table.y + 12} z={131} />
      {people.flatMap(p => [p.live.drink, p.live.dish].map((n, k) => {
        const icon = BAR_ICON(n);
        return icon ? <Spr key={`${p.who}${k}`} sprite={emojiSprite(icon, 8)} x={LOUNGE.table.x + (p.seat ? 3 : -3) + (k ? (p.seat ? 2 : -2) : 0)} y={LOUNGE.table.y + 2 - k} z={132} className="bob" /> : null;
      }))}
    </>
  );
}
