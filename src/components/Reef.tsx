// Lặn biển ngắm san hô: cá bơi qua lại, rùa, cá đuối, sứa, cá ngựa, bạch tuộc, cá chình thò đầu, tia nắng xuyên nước,
// ánh sáng gợn trên cát, hạt lấp lánh, tảo bẹ đung đưa, bong bóng. Chạm vào sinh vật hay san hô → bơi tới tận nơi
// rồi chạm thật: lấp lánh tỏa ra, cá giật mình vụt đi, san hô phát sáng; ghi tên vào "Sổ lặn".
import { useRef, useState, type CSSProperties } from 'react';
import type { Phase } from '../lib/content';
import { chestSprite, clamLidSprite, CORALS, creature, CREATURES, kelpSprite, LOG_TOTAL, logName, POPULATION, REEF, whaleSharkSprite, type Creature } from '../lib/reef';
import type { Live } from '../lib/useLive';
import type { Pt } from '../lib/world';
import { Chat, status } from './Places';
import { Spr, Tag, useScale } from './Stage';

const v = (o: Record<string, string | number>) => o as CSSProperties;
const KELP: [number, number][] = [[6, 40], [48, 30], [88, 22], [126, 34], [170, 28], [188, 38]];
const WALK = { x0: 8, x1: 184, y0: 26, y1: 134 };
const clampPt = (p: Pt): Pt => ({ x: Math.max(WALK.x0, Math.min(WALK.x1, p.x)), y: Math.max(WALK.y0, Math.min(WALK.y1, p.y)) });

/** Điểm giữa của phần tử (đang bơi) theo tọa độ cảnh */
function centerOf(el: Element, s: number): Pt {
  const stage = el.closest('.stage')!.getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - stage.left) / s, y: (r.top + r.height / 2 - stage.top) / s };
}

function Swimmer({ c, s, i, onTouch, night, startled }: { c: Creature; s: number; i: number; onTouch: (id: string, at: Pt) => void; night: boolean; startled: boolean }) {
  const sp = c.sprite();
  const tap = (e: React.MouseEvent) => { e.stopPropagation(); onTouch(c.id, centerOf(e.currentTarget.querySelector('img') ?? e.currentTarget, s)); };
  const img = (k: number, dx = 0, dy = 0) => <img key={k} src={sp.url} alt={c.name} draggable={false} style={{ width: sp.w * s, height: sp.h * s, left: dx * s, top: dy * s }} />;
  const fx = `${night && (c.id === 'jelly' || c.id === 'manta') ? ' glow' : ''}${startled ? ' startled' : ''}`;
  if (c.move === 'swim') {
    const back = i % 2 === 1, dur = 230 / (c.speed ?? 12);
    const n = c.school ?? 1;
    return (
      <div className={`rf-swim ${back ? 'back' : ''}${fx}`} title={c.name} onClick={tap}
        style={v({ top: c.y * s, zIndex: c.y, '--w': `${230 * s}px`, animationDuration: `${dur}s`, animationDelay: `${-((i * 37) % 100) / 100 * dur}s` })}>
        <div className="rf-body">{Array.from({ length: n }, (_, k) => img(k, n > 1 ? (k % 3) * 8 - (k > 2 ? 4 : 0) + (k === 1 && n === 2 ? 4 : 0) : 0, n > 1 ? Math.floor(k / 3) * 5 + (k % 2) * 2 : 0))}</div>
      </div>
    );
  }
  return (
    <div className={`rf-${c.move}${fx}`} title={c.name} onClick={tap}
      style={{ left: ((c.x ?? 96) - sp.w / 2) * s, top: (c.y - sp.h / 2) * s, zIndex: c.move === 'peek' ? 3 : Math.round(c.y), width: sp.w * s, height: sp.h * s }}>
      {img(0)}
    </div>
  );
}

interface Spark { key: number; x: number; y: number; icon: string }

export function ReefContent({ phase, go, onSee, chestOpen, onChest }: {
  phase: Phase; go: (to: Pt, then?: () => void) => void; onSee: (id: string) => void; chestOpen: boolean; onChest: () => void;
}) {
  const s = useScale();
  const night = phase === 'night';
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [startled, setStartled] = useState<string | null>(null);
  const [glow, setGlow] = useState<string | null>(null);
  const n = useRef(0);
  // Chạm: bơi tới sát sinh vật, tới nơi thì chạm (lấp lánh + phản ứng của nó)
  const touch = (id: string, at: Pt, coral = false) => {
    const to = clampPt({ x: at.x + (at.x > 96 ? -8 : 8), y: at.y + 6 });
    go(to, () => {
      const key = ++n.current;
      setSparks(v => [...v.slice(-4), { key, x: at.x, y: at.y, icon: logName(id)?.icon ?? '✨' }]);
      setTimeout(() => setSparks(v => v.filter(x => x.key !== key)), 1600);
      if (coral) { setGlow(id); setTimeout(() => setGlow(g => (g === id ? null : g)), 2200); }
      else { setStartled(id); setTimeout(() => setStartled(g => (g === id ? null : g)), 1400); }
      onSee(id);
    });
  };
  return (
    <>
      {!night && <div className={`reef-rays ${phase}`}>{[0, 1, 2, 3, 4].map(i => <i key={i} style={{ left: `${8 + i * 21}%`, animationDelay: `${-i * 1.3}s` }} />)}</div>}
      <div className={`reef-caustics ${night ? 'night' : ''}`} style={{ top: (REEF.sand - 30) * s }} />
      <div className="reef-motes">{Array.from({ length: night ? 26 : 16 }, (_, i) => <i key={i} className={night ? 'n' : ''} style={{ left: `${(i * 41) % 98}%`, top: `${(i * 23) % 80 + 6}%`, animationDelay: `${-(i % 9) * 0.9}s`, animationDuration: `${6 + (i % 5)}s` }} />)}</div>
      {KELP.map(([x, h], i) => <Spr key={`k${i}`} sprite={kelpSprite(h)} x={x} y={REEF.sand + 4 + (i % 2) * 3} z={5 + i} className="kelp-sway" style={v({ animationDelay: `${-i * 0.7}s` })} />)}
      {/* Bong bóng nổi lên từ khe đá, hải quỳ */}
      {[[REEF.eel.x + 6, 98], [REEF.anemone.x, 108], [140, 116], [180, 100]].map(([x, y], i) => (
        <div key={`b${i}`} className="reef-bubbles" style={{ left: x * s, top: y * s, height: y * s }}>
          {[0, 1, 2].map(k => <i key={k} style={{ width: (1.5 + k * 0.6) * s, height: (1.5 + k * 0.6) * s, animationDelay: `${-(i * 1.7 + k * 1.1)}s` }} />)}
        </div>
      ))}
      {/* San hô chạm được: phát sáng khi chạm */}
      {CORALS.map(c => (
        <button key={c.id} className={`reef-touch ${glow === c.id ? 'lit' : ''}`} title={c.name} aria-label={c.name}
          style={{ left: (c.x - c.w / 2) * s, top: (c.y - c.h / 2) * s, width: c.w * s, height: c.h * s }}
          onClick={e => { e.stopPropagation(); touch(c.id, { x: c.x, y: c.y }, true); }} />
      ))}
      {CREATURES.map((c, i) => <Swimmer key={c.id} c={c} s={s} i={i} onTouch={(id, at) => touch(id, at)} night={night} startled={startled === c.id} />)}
      {POPULATION.filter(e => !e.nightOnly || night).map((e, i) => {
        const base = creature(e.id)!;
        return <Swimmer key={`pop${i}`} c={{ ...base, y: e.y, x: e.x ?? base.x, speed: e.speed ?? base.speed }} s={s} i={i + 3} onTouch={(id, at) => touch(id, at)} night={night} startled={startled === e.id} />;
      })}
      {/* Đàn cá xoáy tròn (bait ball) — chạm vào thì tính là đàn cá cơm */}
      <div className="bait-ball" style={{ left: 150 * s, top: 70 * s, width: 30 * s, height: 22 * s, zIndex: 70 }} onClick={e => { e.stopPropagation(); touch('school', { x: 150, y: 70 }); }}>
        {Array.from({ length: 18 }, (_, i) => <i key={i} style={v({ '--a': `${(i / 18) * 360}deg`, '--r': `${(7 + (i % 3) * 3.5) * s}px`, animationDuration: `${5 + (i % 3)}s`, width: 4 * s, height: 1.5 * s })} />)}
      </div>
      {/* Cá mập voi khổng lồ thỉnh thoảng lướt qua phía xa */}
      <div className="whale-shark" title="Cá mập voi" style={v({ top: 18 * s, '--w': `${300 * s}px` })}>
        <img src={whaleSharkSprite().url} alt="Cá mập voi" style={{ width: 72 * s, height: 24 * s }} />
      </div>
      {/* Ban đêm: san hô phát sáng neon */}
      {night && CORALS.filter(c => c.id !== 'kelp' && c.id !== 'star').map((c, i) => (
        <i key={`neon${i}`} className="coral-neon" style={{ left: c.x * s, top: c.y * s, width: c.w * 1.6 * s, height: c.h * 1.6 * s, color: ['#ff5ad0', '#5af0ff', '#b07aff', '#7aff9a', '#ffd84a'][i % 5], animationDelay: `${-i * 0.7}s` }} />
      ))}
      {/* Sò tai tượng: mở khép, có viên ngọc lấp lánh bên trong */}
      <div className="clam" style={{ left: REEF.clam.x * s, top: (REEF.clam.y - 3) * s, zIndex: REEF.clam.y }}>
        <i className="clam-pearl" style={{ width: 3 * s, height: 3 * s }} />
        <img src={clamLidSprite().url} alt="" style={{ width: 20 * s, height: 8 * s }} />
      </div>
      {sparks.map(k => (
        <div key={k.key} className="reef-spark" style={{ left: k.x * s, top: k.y * s }}>
          {Array.from({ length: 8 }, (_, i) => <i key={i} style={v({ '--a': `${i * 45}deg` })} />)}
          <b>{k.icon}</b>
        </div>
      ))}
      <Spr sprite={chestSprite(chestOpen)} x={REEF.chest.x} y={REEF.chest.y} z={REEF.chest.y} title={chestOpen ? 'Rương báu (đã mở hôm nay)' : '💎 Rương báu — mở thử xem'}
        onClick={() => go({ x: REEF.chest.x - 12, y: REEF.chest.y - 4 }, onChest)} className={chestOpen ? '' : 'twinkle-soft'} />
      {!chestOpen && <Tag x={REEF.chest.x} y={REEF.chest.y - 16} className="label" onClick={() => go({ x: REEF.chest.x - 12, y: REEF.chest.y - 4 }, onChest)}>💎 Rương báu</Tag>}
    </>
  );
}

export function ReefPanel({ live, partnerHere, partnerName, seen, onLeave }: { live: Live; partnerHere: boolean; partnerName: string; seen: string[]; onLeave: () => void }) {
  const all = [...CREATURES, ...CORALS];
  const got = all.filter(c => seen.includes(c.id)).length;
  return (
    <div className="room-bar">
      <div className="room-panel">
        {status(partnerHere, partnerName, `Đang lặn một mình… rủ ${partnerName} xuống ngắm san hô cùng nhé 🤿`)}
        <p className="muted small-note">🤿 Chạm vào nước để bơi · chạm vào cá, rùa, sứa, san hô… để bơi tới chạm thử — <b>Sổ lặn {got}/{LOG_TOTAL}</b></p>
        <div className="reef-log">
          {all.map(c => <span key={c.id} className={`chip ${seen.includes(c.id) ? 'active' : 'locked'}`} title={seen.includes(c.id) ? c.fact : 'Chưa chạm'}>{seen.includes(c.id) ? `${c.icon} ${c.name}` : '❔'}</span>)}
        </div>
        <div className="row wrap">
          <button className="btn small ghost" onClick={() => live.say('👌 Ổn cả!')}>👌 Ổn</button>
          <button className="btn small ghost" onClick={() => live.say('👉 Nhìn kìa!')}>👉 Nhìn kìa</button>
          <button className="btn small ghost" onClick={() => live.say('🫧💕')}>🫧💕</button>
          <button className="btn small ghost" onClick={() => live.say('⬆️ Lên thôi?')}>⬆️ Lên nhé?</button>
        </div>
        <Chat live={live} placeholder="Nói qua bong bóng…" />
      </div>
      <button className="btn small ghost leave" onClick={onLeave}>⬆️ Ngoi lên</button>
    </div>
  );
}
