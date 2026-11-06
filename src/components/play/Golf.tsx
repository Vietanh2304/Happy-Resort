// ⛳ Golf mini quanh làng: thay lượt, kéo ngược từ bóng để ngắm (kéo càng xa càng mạnh), thả tay để đánh.
import { useEffect, useMemo, useRef, useState } from 'react';
import { DECO, HOLES, MAX_POWER, shoot, simulate, startGolf, type Golf as G } from '../../lib/golf';
import { makeSprite, type Sprite } from '../../lib/pixel';
import { beachUmbrellaSprite, flowerBedSprite, golfFlagSprite, haystackSprite, miniFountainSprite, miniPalmSprite, rockSprite } from '../../lib/playSprites';

const DECO_SPRITE: Record<string, () => Sprite> = { F: miniFountainSprite, P: miniPalmSprite, R: rockSprite, H: haystackSprite, B: flowerBedSprite, U: beachUmbrellaSprite };
import { reward } from '../gameKit';
import { Chibi, PlayScreen, useFrame, usePeer, useViewport, type PlayProps } from './kit';

const T = 16;

export function Golf({ me, partner, date, onLeave }: PlayProps) {
  const them = partner?.id ?? '';
  const name = (id: string) => (id === me.id ? 'Bạn' : partner?.display_name ?? 'Người ấy');
  const [g, setG] = useState<G | null>(null);
  const gRef = useRef(g); gRef.current = g;
  const [anim, setAnim] = useState<{ by: string; path: { x: number; y: number }[]; at: number } | null>(null);
  const { send, here } = usePeer('golf', me.id, (m) => {
    if (m.t === 'start') setG(startGolf(me.id, them || 'solo', m.first));
    if (m.t === 'sync' && m.by !== me.id && !gRef.current) setG(m.st);
    if (m.t === 'shot') {
      const cur = gRef.current;
      if (!cur || cur.turn !== m.by) return;
      const nx = shoot(cur, m.by, m.vx, m.vy);
      const l = nx.last!;
      setAnim({ by: m.by, path: simulate(HOLES[l.hole], l.from.x, l.from.y, l.vx, l.vy).path, at: Date.now() });
      setG(nx);
    }
  }, () => { if (gRef.current) send('sync', { st: gRef.current }); });
  useEffect(() => { if (g?.over) reward('golf', date); }, [g?.over]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = useFrame();
  const frame = anim ? Math.floor((now - anim.at) / (1000 / 60)) : 0;
  const animating = !!anim && frame < anim.path.length + 20;
  useEffect(() => { if (anim && !animating) setAnim(null); }, [anim, animating]);

  const vw = useViewport();
  const hole = g ? HOLES[animating && g.last ? g.last.hole : g.hole] : HOLES[0];
  const cols = hole.map[0].length, rows = hole.map.length;
  const s = Math.max(1.2, Math.min(5, (vw.w - 16) / (cols * T), (vw.h - 210) / (rows * T)));
  const tile = T * s;
  const bg = useMemo(() => holeSprite(hole.map), [hole]);

  // Vị trí bóng để vẽ: bóng đang lăn đi theo đường mô phỏng
  const ballAt = (id: string) => {
    if (anim && animating && anim.by === id) return anim.path[Math.min(frame, anim.path.length - 1)];
    if (animating && g?.last && g.last.hole !== g.hole) return null;   // vừa sang lỗ: chờ bóng lăn xong
    return g?.balls[id] ?? null;
  };
  const myTurn = !!g && !g.over && g.turn === me.id && !animating;

  // Kéo để ngắm
  const [drag, setDrag] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const toTile = (e: React.PointerEvent) => { const b = board.current!.getBoundingClientRect(); return { x: (e.clientX - b.left) / tile, y: (e.clientY - b.top) / tile }; };
  const aim = drag ? (() => {
    const dx = drag.x0 - drag.x, dy = drag.y0 - drag.y, len = Math.hypot(dx, dy);
    const power = Math.min(1, len / 3);
    return len < 0.05 ? null : { ux: dx / len, uy: dy / len, power };
  })() : null;
  const release = () => {
    if (aim && aim.power > 0.04 && myTurn) send('shot', { vx: aim.ux * aim.power * MAX_POWER, vy: aim.uy * aim.power * MAX_POWER });
    setDrag(null);
  };
  const mine = g?.balls[me.id];

  const total = (id: string) => (g ? g.total[id] + (g.over ? 0 : g.balls[id]?.strokes ?? 0) : 0);
  return (
    <PlayScreen title="⛳ Golf mini quanh làng" here={here} partnerName={partner?.display_name ?? 'Người ấy'} onLeave={onLeave}
      bottom={!g ? (
        <div className="row center wrap">
          <span className="k-hint">6 lỗ quanh làng, thay phiên đánh. <b>Kéo ngược</b> từ quả bóng (như bắn ná) rồi thả tay — kéo càng xa đánh càng mạnh. Rơi xuống nước bị phạt 1 gậy. Tổng ít gậy hơn thì thắng!</span>
          <button className="btn" disabled={!here} onClick={() => send('start', { first: me.id })}>{here ? '⛳ Bắt đầu (bạn đánh trước)' : '⏳ Chờ người ấy vào'}</button>
        </div>
      ) : g.over ? (
        <div className="row center wrap">
          <b className="game-big">{g.total[me.id] === g.total[them] ? '🤝 Hoà nhau!' : `🏆 ${name(g.total[me.id] < (g.total[them] ?? 99) ? me.id : them)} thắng!`}</b>
          <span>Bạn {g.total[me.id]} gậy · {name(them)} {g.total[them] ?? '-'} gậy</span>
          <button className="btn" onClick={() => send('start', { first: me.id })}>🔄 Chơi lại</button>
        </div>
      ) : (
        <div className="row center wrap golf-bar">
          <b>Lỗ {g.hole + 1}/6 · {HOLES[g.hole].name} · par {HOLES[g.hole].par}</b>
          <span>Bạn: {g.balls[me.id]?.strokes} gậy (tổng {total(me.id)}) · {name(them)}: {g.balls[them]?.strokes ?? 0} gậy (tổng {total(them)})</span>
          <span className="k-hint">{animating ? '⛳ Bóng đang lăn…' : myTurn ? '👉 Tới lượt bạn: kéo ngược từ bóng rồi thả' : `⏳ Chờ ${name(g.turn)} đánh…`}</span>
          {g.last?.water && !animating && <span className="chip">💦 Rơi xuống nước, phạt 1 gậy</span>}
        </div>
      )}>
      <div ref={board} className="k-view golf-board" style={{ width: cols * tile, height: rows * tile, touchAction: 'none' }}
        onPointerDown={e => { if (!myTurn) return; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); const p = toTile(e); setDrag({ x0: p.x, y0: p.y, x: p.x, y: p.y }); }}
        onPointerMove={e => { if (drag) { const p = toTile(e); setDrag({ ...drag, x: p.x, y: p.y }); } }}
        onPointerUp={release} onPointerCancel={() => setDrag(null)}>
        <img className="k-bg" src={bg.url} alt="" draggable={false} style={{ width: cols * tile, height: rows * tile }} />
        {hole.map.flatMap((row, y) => [...row].map((c, x) => {
          if (!DECO[c]) return null;
          // Đài phun nước chiếm khối 2×2: chỉ vẽ một lần ở ô góc trên trái
          if (c === 'F' && (row[x - 1] === 'F' || hole.map[y - 1]?.[x] === 'F')) return null;
          const sp = DECO_SPRITE[c](), cw = c === 'F' ? 2 : 1;
          return <img key={`${x},${y}`} className="golf-deco" src={sp.url} alt="" style={{ left: (x + cw / 2) * tile - (sp.w * s) / 2, top: (y + cw * 0.95) * tile - sp.h * s, width: sp.w * s, height: sp.h * s, zIndex: y * 10 + 6 }} />;
        }))}
        {(() => { for (let y = 0; y < rows; y++) { const x = hole.map[y].indexOf('O'); if (x >= 0) { const f = golfFlagSprite(); return <img className="golf-flag" src={f.url} alt="" style={{ left: (x + 0.5) * tile - s, top: (y + 0.5) * tile - f.h * s, width: f.w * s, height: f.h * s }} />; } } return null; })()}
        {g && [me.id, them].filter(Boolean).map(id => {
          const b = ballAt(id);
          if (!b) return null;
          const sunk = !animating && g.balls[id]?.done;
          return <i key={id} className={`golf-ball ${id === me.id ? 'me' : 'them'} ${sunk ? 'sunk' : ''}`} style={{ left: b.x * tile, top: b.y * tile, width: tile * 0.42, height: tile * 0.42 }} />;
        })}
        {g && !g.over && [me.id, them].filter(Boolean).map(id => {
          // Người vừa đánh đứng ở chỗ phát bóng làm động tác vung gậy; người đang ngắm giữ tư thế vung ra sau
          const shooting = animating && anim?.by === id && g.last;
          const b = shooting ? g.last!.from : g.balls[id];
          if (!b || (!shooting && g.balls[id]?.done)) return null;
          const look = id === me.id ? me.avatar : partner?.avatar;
          if (!look) return null;
          return <Chibi key={id} look={look} p={{ x: b.x - 0.45, y: b.y + 0.2, f: 'r', mv: false }} tile={tile} s={s * 0.8}
            name={id === me.id ? undefined : partner?.display_name} act={shooting ? { n: 'golf', at: anim!.at - 420 } : null} frame={id === me.id && aim ? 8 : undefined} />;
        })}
        {aim && mine && (
          <>
            <i className="golf-aim" style={{ left: mine.x * tile, top: mine.y * tile, width: aim.power * 4 * tile, transform: `rotate(${Math.atan2(aim.uy, aim.ux)}rad)` }} />
            <span className="golf-power" style={{ left: mine.x * tile, top: (mine.y - 0.8) * tile }}>💪 {Math.round(aim.power * 100)}%</span>
          </>
        )}
      </div>
    </PlayScreen>
  );
}

function holeSprite(map: string[]) {
  const W = map[0].length * T, H = map.length * T;
  return makeSprite(`golf:${map.join('')}`, W, H, p => {
    map.forEach((row, y) => [...row].forEach((c, x) => {
      const X = x * T, Y = y * T;
      const grass = () => { p.rect(X, Y, T, T, (x + y) % 2 ? '#8fd16a' : '#84c860'); };
      if (c === '#') { p.rect(X, Y, T, T, '#5e8a3e'); p.rect(X, Y, T, 3, '#77a452'); p.rect(X + 3, Y + 6, 2, 2, '#4a7030'); p.rect(X + 10, Y + 10, 2, 2, '#4a7030'); return; }
      if (c === 's') { p.rect(X, Y, T, T, '#f2dc9a'); p.px(X + 4, Y + 5, '#e0c47a'); p.px(X + 11, Y + 9, '#e0c47a'); p.px(X + 7, Y + 13, '#e0c47a'); return; }
      if (c === 'w') { p.rect(X, Y, T, T, '#5aa8e0'); p.rect(X + 2, Y + 4, 5, 1, '#9fd4f5'); p.rect(X + 9, Y + 10, 5, 1, '#9fd4f5'); return; }
      grass();
      if ('<>^v'.includes(c)) {
        const d = '#6fb04e';
        if (c === '>') { p.rect(X + 5, Y + 7, 6, 2, d); p.rect(X + 9, Y + 5, 2, 6, d); }
        if (c === '<') { p.rect(X + 5, Y + 7, 6, 2, d); p.rect(X + 5, Y + 5, 2, 6, d); }
        if (c === 'v') { p.rect(X + 7, Y + 5, 2, 6, d); p.rect(X + 5, Y + 9, 6, 2, d); }
        if (c === '^') { p.rect(X + 7, Y + 5, 2, 6, d); p.rect(X + 5, Y + 5, 6, 2, d); }
      }
      if (c === 'T') { p.rect(X + 3, Y + 3, 10, 10, '#d8f0c0'); p.rect(X + 3, Y + 3, 10, 1, '#fff'); }
      if (c === 'O') { p.rect(X + 5, Y + 6, 6, 4, '#2a2a2a'); p.rect(X + 6, Y + 5, 4, 6, '#2a2a2a'); }
    }));
  }, null);
}
