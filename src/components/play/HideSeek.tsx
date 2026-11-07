// 🙈 Trốn tìm trong góc làng: người trốn có 15 giây chui vào một chỗ (bụi cây, đống rơm, thùng, hộp),
// người tìm bịt mắt đếm rồi có 60 giây đi tìm. Chỗ trốn chỉ máy người trốn biết; thỉnh thoảng chỗ trốn rung lên 🍃.
import { useEffect, useMemo, useRef, useState } from 'react';
import { makeSprite, type Sprite } from '../../lib/pixel';
import { barrelSprite, crateSprite, haystackSprite, houseSprite, leafSprite } from '../../lib/playSprites';
import { bushSprite, pineSprite } from '../../lib/townSprites';
import type { Act } from '../../lib/acts';
import { reward } from '../gameKit';
import { Chibi, DPad, PlayScreen, typing, useFrame, useGlide, usePeer, useViewport, useWalker, type PlayProps, type Pos } from './kit';

const T = 16;
const MAP = [
  '..................',
  '.TT....##....T..x.',
  '.TT....##.b.......',
  '....h.........##..',
  '..........T...##..',
  '.b...##.......k...',
  '.....##..x........',
  '..T.........b..T..',
  '.........##.......',
  '.k..b....##...h...',
  '..................',
];
const COLS = MAP[0].length, ROWS = MAP.length;
const SPOT_ICON: Record<string, (i: number) => Sprite> = { b: i => bushSprite(i), h: () => haystackSprite(), k: () => barrelSprite(), x: () => crateSprite() };
const SPOT_NAME: Record<string, string> = { b: 'bụi cây', h: 'đống rơm', k: 'thùng gỗ', x: 'thùng các-tông' };
const SPOTS: [number, number][] = [];
MAP.forEach((r, y) => [...r].forEach((c, x) => { if (SPOT_ICON[c]) SPOTS.push([x, y]); }));
const HIDE_MS = 15000, SEEK_MS = 60000, RUSTLE = [20000, 40000];
const blocked = (x: number, y: number) => { const r = MAP[Math.floor(y)]; return !r || r[Math.floor(x)] !== '.'; };
const free = (x: number, y: number) => [[x - 0.3, y - 0.25], [x + 0.3, y - 0.25], [x - 0.3, y + 0.15], [x + 0.3, y + 0.15]].every(([a, b]) => !blocked(a, b));
const near = (p: Pos, i: number) => Math.max(Math.abs(Math.floor(p.x) - SPOTS[i][0]), Math.abs(Math.floor(p.y) - SPOTS[i][1])) <= 1;
const nearest = (p: Pos) => SPOTS.map((s, i) => ({ i, d: Math.hypot(s[0] + 0.5 - p.x, s[1] + 0.5 - p.y) })).sort((a, b) => a.d - b.d)[0].i;

interface Round { at: number; hider: string; checked: number[]; result: null | { winner: string; how: 'found' | 'escaped'; spot: number }; rustle: { spot: number; at: number } | null }

export function HideSeek({ me, partner, date, onLeave }: PlayProps) {
  const them = partner?.id ?? '';
  const name = partner?.display_name ?? 'Người ấy';
  const [round, setRound] = useState<Round | null>(null);
  const rRef = useRef(round); rRef.current = round;
  const [score, setScore] = useState<Record<string, number>>({});
  const [theirPos, setTheirPos] = useState<Pos | null>(null);
  const [mySpot, setMySpot] = useState<number | null>(null);
  const spotRef = useRef(mySpot); spotRef.current = mySpot;
  const center: Pos = { x: 8.5, y: 4.5, f: 'd', mv: false };
  const [acts, setActs] = useState<{ me?: Act; them?: Act }>({});
  const actNow = (who: 'me' | 'them', n: Act['n'], delay = 0) => setActs(a => ({ ...a, [who]: { n, at: Date.now() + delay } }));

  const finish = (winner: string, how: 'found' | 'escaped', spot: number) => {
    setRound(r => (r && !r.result ? { ...r, result: { winner, how, spot } } : r));
    if (!rRef.current?.result) setScore(sc => ({ ...sc, [winner]: (sc[winner] ?? 0) + 1 }));
  };
  const { send, here } = usePeer('hide', me.id, (m, mine) => {
    if (m.t === 'round') {
      setRound({ at: Date.now() + 800, hider: m.hider, checked: [], result: null, rustle: null });
      setMySpot(null); setTheirPos(null);
      walker.teleport(m.hider === me.id ? center : { ...center, x: 9.5 });
    }
    if (m.t === 'pos' && !mine) setTheirPos({ x: m.x, y: m.y, f: m.f, mv: m.mv });
    const r = rRef.current;
    if (!r) return;
    if (m.t === 'check') {
      setRound(v => (v ? { ...v, checked: [...v.checked, m.spot] } : v));
      actNow(mine ? 'me' : 'them', 'rummage');
      if (!mine && r.hider === me.id) send(spotRef.current === m.spot ? 'found' : 'empty', { spot: m.spot });
    }
    if (m.t === 'found') { finish(r.hider === me.id ? them : me.id, 'found', m.spot); actNow(r.hider === me.id ? 'me' : 'them', 'ouch', 300); actNow(r.hider === me.id ? 'them' : 'me', 'cheer', 300); }
    if (m.t === 'escaped') { finish(r.hider, 'escaped', m.spot); actNow(r.hider === me.id ? 'me' : 'them', 'cheer'); }
    if (m.t === 'rustle') setRound(v => (v ? { ...v, rustle: { spot: m.spot, at: Date.now() } } : v));
  }, () => send('pos', walker.ref.current));

  const now = useFrame();
  const theirShown = useGlide(theirPos, 4.4);
  const t = round ? now - round.at : 0;
  const amHider = round?.hider === me.id;
  const phase = !round ? 'lobby' : round.result ? 'done' : t < HIDE_MS ? 'hide' : t < HIDE_MS + SEEK_MS ? 'seek' : 'end';
  const walker = useWalker(center, free, {
    speed: 4.4,
    enabled: () => {
      const r = rRef.current;
      if (!r || r.result) return true;
      const tt = Date.now() - r.at;
      return r.hider === me.id ? tt < HIDE_MS && spotRef.current === null : tt >= HIDE_MS;
    },
    // Người trốn không gửi vị trí trong lúc chơi (để không lộ chỗ)
    onMove: p => { const r = rRef.current; if (!r || r.result || r.hider !== me.id) send('pos', p); },
    onArrive: () => { if (goal.current !== null) { const i = goal.current; goal.current = null; touchSpot(i); } },
  });
  const goal = useRef<number | null>(null);

  // Người trốn: hết giờ trốn mà chưa chui vào đâu thì tự chui vào chỗ gần nhất; người trốn báo rung bụi và báo thoát
  const flags = useRef<Record<string, boolean>>({});
  useEffect(() => { flags.current = {}; }, [round?.at]);
  useEffect(() => {
    const r = rRef.current;
    if (!r || r.result || r.hider !== me.id) return;
    const f = flags.current;
    if (t >= HIDE_MS && spotRef.current === null && !f.auto) { f.auto = true; setMySpot(nearest(walker.ref.current)); }
    RUSTLE.forEach((ms, k) => { if (t >= HIDE_MS + ms && !f[`r${k}`] && spotRef.current !== null) { f[`r${k}`] = true; send('rustle', { spot: spotRef.current }); } });
    if (t >= HIDE_MS + SEEK_MS && !f.esc) { f.esc = true; send('escaped', { spot: spotRef.current ?? 0 }); }
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (round?.result) reward('hide', date); }, [round?.result]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Dùng một chỗ trốn: người trốn chui vào, người tìm lật lên xem */
  function touchSpot(i: number) {
    const r = rRef.current;
    if (!r || r.result || !near(walker.ref.current, i)) return;
    const tt = Date.now() - r.at;
    if (r.hider === me.id) { if (tt < HIDE_MS) setMySpot(i); }
    else if (tt >= HIDE_MS && !r.checked.includes(i)) send('check', { spot: i });
  }
  const touchRef = useRef(touchSpot); touchRef.current = touchSpot;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (typing(e) || (e.key !== ' ' && e.key !== 'e' && e.key !== 'Enter')) return;
      e.preventDefault();
      const p = walker.ref.current;
      const i = SPOTS.findIndex((_, j) => near(p, j));
      if (i >= 0) touchRef.current(i);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const vw = useViewport();
  const s = Math.max(1.4, Math.min(5, (vw.w - 16) / (COLS * T), (vw.h - 250) / (ROWS * T)));
  const tile = T * s;
  const bg = useMemo(villageSprite, []);
  const board = useRef<HTMLDivElement>(null);
  const tap = (e: React.MouseEvent) => {
    const b = board.current!.getBoundingClientRect();
    const x = Math.floor((e.clientX - b.left) / tile), y = Math.floor((e.clientY - b.top) / tile);
    const i = SPOTS.findIndex(([a, c]) => a === x && c === y);
    if (i >= 0 && near(walker.ref.current, i)) { touchSpot(i); return; }
    goal.current = i >= 0 ? i : null;
    walker.walkTo(x, y, COLS, ROWS);
  };
  const blind = phase === 'hide' && !amHider;
  const showThem = theirPos && partner && (phase === 'lobby' || phase === 'done' || (round && round.hider === them ? false : true));
  const hiding = amHider && mySpot !== null && (phase === 'hide' || phase === 'seek');
  const rustling = round?.rustle && now - round.rustle.at < 1600 ? round.rustle.spot : -1;

  return (
    <PlayScreen title="🙈 Trốn tìm" here={here} partnerName={name} onLeave={onLeave}
      bottom={
        <div className="row center wrap">
          <b>Bạn {score[me.id] ?? 0} – {score[them] ?? 0} {name}</b>
          {phase === 'lobby' || phase === 'done' || phase === 'end' ? (
            <>
              {round?.result && <b className="game-big">{round.result.how === 'found' ? `🔎 ${round.result.winner === me.id ? 'Bạn' : name} tìm ra rồi!` : `🎉 ${round.result.winner === me.id ? 'Bạn' : name} trốn giỏi quá, không ai tìm ra!`}</b>}
              <span className="k-hint">Người trốn có 15 giây chọn chỗ ({Object.values(SPOT_NAME).join(', ')}), người tìm có 60 giây. Chạm vào chỗ trốn để đi tới và chui vào / lật lên xem (máy tính: <kbd>WASD</kbd> + <kbd>Space</kbd>).</span>
              <button className="btn" disabled={!here} onClick={() => send('round', { hider: me.id })}>🙈 Mình trốn</button>
              <button className="btn ghost" disabled={!here} onClick={() => send('round', { hider: them })}>🔎 Mình tìm</button>
            </>
          ) : amHider ? (
            <span>{phase === 'hide' ? (mySpot === null ? `🏃 Mau đi trốn! Còn ${Math.ceil((HIDE_MS - t) / 1000)}s — chạm vào bụi cây, đống rơm, thùng…` : `🤫 Đã trốn trong ${SPOT_NAME[MAP[SPOTS[mySpot][1]][SPOTS[mySpot][0]]]} — còn ${Math.ceil((HIDE_MS - t) / 1000)}s ${name} mới bắt đầu tìm`)
              : `🤫 Nín thở… ${name} đang tìm (còn ${Math.ceil((HIDE_MS + SEEK_MS - t) / 1000)}s)${rustling === mySpot ? ' · Ối, chỗ trốn vừa rung lên 🍃' : ''}`}
              {phase === 'hide' && mySpot !== null && <button className="btn small ghost" onClick={() => setMySpot(null)}>Chui ra đổi chỗ</button>}</span>
          ) : (
            <span>{phase === 'hide' ? `🙈 Bịt mắt đếm… ${Math.ceil((HIDE_MS - t) / 1000)}` : `🔎 Đi tìm ${name}! Còn ${Math.ceil((HIDE_MS + SEEK_MS - t) / 1000)}s · đã lật ${round!.checked.length} chỗ · để ý chỗ nào rung 🍃`}</span>
          )}
          {(phase === 'hide' || phase === 'seek') && <DPad hold={walker.hold} />}
        </div>
      }>
      <div ref={board} className="k-view" style={{ width: COLS * tile, height: ROWS * tile }} onClick={tap}>
        <img className="k-bg" src={bg.url} alt="" draggable={false} style={{ width: COLS * tile, height: ROWS * tile }} />
        {MAP.flatMap((row, y) => [...row].map((c, x) => {
          if (c === 'T') { const sp = pineSprite(), k = s * 0.62; return <img key={`${x},${y}`} className="snow-obst" src={sp.url} alt="" style={{ left: (x + 0.5) * tile - (sp.w * k) / 2, top: (y + 0.95) * tile - sp.h * k, width: sp.w * k, height: sp.h * k, zIndex: y * 10 + 6 }} />; }
          if (c === '#' && MAP[y - 1]?.[x] !== '#' && row[x - 1] !== '#') { const sp = houseSprite(); return <img key={`${x},${y}`} className="snow-obst" src={sp.url} alt="" style={{ left: x * tile, top: (y + 2) * tile - sp.h * s, width: sp.w * s, height: sp.h * s, zIndex: y * 10 + 16 }} />; }
          return null;
        }))}
        {SPOTS.map(([x, y], i) => (
          <div key={i} className={`hide-spot ${rustling === i ? 'rustle' : ''} ${round?.checked.includes(i) ? 'checked' : ''}`} style={{ left: x * tile, top: y * tile, width: tile, height: tile, zIndex: y * 10 + 7 }}>
            {(() => { const sp = SPOT_ICON[MAP[y][x]](i); return <img src={sp.url} alt="" style={{ width: sp.w * s, height: sp.h * s, left: (tile - sp.w * s) / 2, top: tile * 0.95 - sp.h * s }} />; })()}
            {rustling === i && <img className="hide-leaf" src={leafSprite().url} alt="" style={{ width: 5 * s, height: 4 * s }} />}
            {round?.checked.includes(i) && !(round.result?.how === 'found' && round.result.spot === i) && <span className="hide-x">✗</span>}
            {round?.result?.spot === i && <span className="hide-x found">{round.result.how === 'found' ? '😳' : '😎'}</span>}
          </div>
        ))}
        {/* Hết ván: người trốn chui ra khỏi chỗ trốn */}
        {round?.result && (() => {
          const [x, y] = SPOTS[round.result.spot];
          const hid = round.hider === me.id ? me : partner;
          return hid ? <Chibi look={hid.avatar} p={{ x: x + 0.5, y: y + 1.25, f: 'd', mv: false }} tile={tile} s={s} act={round.hider === me.id ? acts.me : acts.them} /> : null;
        })()}
        {!hiding && !(round?.result && amHider) && <Chibi look={me.avatar} p={walker.pos} tile={tile} s={s} act={acts.me} />}
        {hiding && <div className="hide-me" style={{ left: (SPOTS[mySpot!][0] + 0.5) * tile, top: SPOTS[mySpot!][1] * tile, fontSize: tile * 0.5 }}>👀</div>}
        {showThem && !(round?.result && round.hider === them) && <Chibi look={partner!.avatar} p={theirShown ?? theirPos!} tile={tile} s={s} name={name} className="them" act={acts.them} />}
        {blind && <div className="hide-blind"><span>🙈</span><b>{Math.ceil((HIDE_MS - t) / 1000)}</b><small>{name} đang đi trốn…</small></div>}
      </div>
    </PlayScreen>
  );
}

function villageSprite() {
  return makeSprite('hide-village', COLS * T, ROWS * T, p => {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const X = x * T, Y = y * T;
      const path = y === 10 || x === 8 || y === 4;
      p.rect(X, Y, T, T, path ? ((x + y) % 2 ? '#e8d4a8' : '#e2cc9c') : (x + y) % 2 ? '#9ed672' : '#94cc68');
      if (!path) { p.px(X + 4, Y + 5, '#7fb85a'); p.px(X + 11, Y + 10, '#7fb85a'); }
    }
  }, null);
}
