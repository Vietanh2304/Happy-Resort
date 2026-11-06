// ⛄ Ném tuyết (mùa đông / làng có tuyết) hoặc 💦 té súng nước ở bãi biển (các mùa khác).
// Mỗi máy tự lo quả ném của mình: tự tính trúng/trượt theo vị trí người kia rồi báo 'hit'. Ai trúng 10 lần trước thì thắng.
import { useEffect, useMemo, useRef, useState } from 'react';
import { emojiSprite, makeSprite } from '../../lib/pixel';
import type { Act } from '../../lib/acts';
import { reward } from '../gameKit';
import { Chibi, DPad, PlayScreen, typing, useFrame, usePeer, useViewport, useWalker, type PlayProps, type Pos } from './kit';

const T = 16, COLS = 16, ROWS = 10;
const MAP = [
  '................',
  '................',
  '...o.......o....',
  '.......oo.......',
  '................',
  '..o..........o..',
  '.......oo.......',
  '....o......o....',
  '................',
  '................',
];
const SPEED = 9, RANGE = 12, WIN = 10, ROUND_MS = 90000, AMMO = 3, RELOAD = 1000, STUN = 700;
const blocked = (x: number, y: number) => { const r = MAP[Math.floor(y)]; return !r || r[Math.floor(x)] !== '.'; };
const free = (x: number, y: number) => [[x - 0.3, y - 0.25], [x + 0.3, y - 0.25], [x - 0.3, y + 0.15], [x + 0.3, y + 0.15]].every(([a, b]) => !blocked(a, b));
interface Shot { id: string; by: string; x: number; y: number; dx: number; dy: number; at: number; len: number }
/** Quả ném bay tới đâu thì vướng vật cản/hết tầm */
const flight = (x: number, y: number, dx: number, dy: number) => { let d = 0; while (d < RANGE && !blocked(x + dx * d, y + dy * d)) d += 0.1; return d; };

export function Snowball({ me, partner, date, onLeave, theme = 'water' }: PlayProps) {
  const them = partner?.id ?? '';
  const snow = theme === 'snow';
  const [round, setRound] = useState<{ at: number; hits: Record<string, number> } | null>(null);
  const roundRef = useRef(round); roundRef.current = round;
  const [shots, setShots] = useState<Shot[]>([]);
  const shotsRef = useRef(shots); shotsRef.current = shots;
  const [theirPos, setTheirPos] = useState<Pos | null>(null);
  const theirRef = useRef(theirPos); theirRef.current = theirPos;
  const [splat, setSplat] = useState<{ who: string; at: number } | null>(null);
  const stunUntil = useRef(0);
  const [acts, setActs] = useState<{ me?: Act; them?: Act }>({});
  const actNow = (who: 'me' | 'them', n: Act['n']) => setActs(a => ({ ...a, [who]: { n, at: Date.now() } }));
  const left = me.id < them;
  const start: Pos = left ? { x: 2.5, y: 4.5, f: 'r', mv: false } : { x: 13.5, y: 4.5, f: 'l', mv: false };

  const { send, here } = usePeer('snow', me.id, (m, mine) => {
    if (m.t === 'start') { setRound({ at: Date.now() + 2500, hits: {} }); setShots([]); walker.teleport(start); }
    if (m.t === 'sync' && !mine && !roundRef.current) setRound({ at: Date.now() - m.elapsed, hits: m.hits });
    if (m.t === 'pos' && !mine) setTheirPos({ x: m.x, y: m.y, f: m.f, mv: m.mv });
    if (m.t === 'throw' && !mine) { setShots(v => [...v, { ...m.s, at: Date.now() }]); actNow('them', 'throw'); }
    if (m.t === 'hit') {
      setShots(v => v.filter(s => s.id !== m.id));
      setRound(r => (r ? { ...r, hits: { ...r.hits, [m.by]: (r.hits[m.by] ?? 0) + 1 } } : r));
      setSplat({ who: m.by === me.id ? them : me.id, at: Date.now() });
      if (m.by !== me.id) stunUntil.current = Date.now() + STUN;
      actNow(m.by === me.id ? 'them' : 'me', 'ouch');
    }
  }, () => { const r = roundRef.current; if (r) send('sync', { elapsed: Date.now() - r.at, hits: r.hits }); send('pos', walker.ref.current); });

  const now = useFrame();
  const elapsed = round ? now - round.at : 0;
  const myHits = round?.hits[me.id] ?? 0, theirHits = round?.hits[them] ?? 0;
  const over = !!round && (myHits >= WIN || theirHits >= WIN || elapsed >= ROUND_MS);
  const live = !!round && elapsed >= 0 && !over;
  const walker = useWalker(start, free, { speed: 4.2, enabled: () => !!roundRef.current && Date.now() >= stunUntil.current, onMove: p => send('pos', p) });
  useEffect(() => { if (over) reward('snow', date); }, [over]); // eslint-disable-line react-hooks/exhaustive-deps

  // Đạn: nạp lại dần
  const [ammo, setAmmo] = useState(AMMO);
  useEffect(() => { const t = setInterval(() => setAmmo(a => Math.min(AMMO, a + 1)), RELOAD); return () => clearInterval(t); }, []);
  const ammoRef = useRef(ammo); ammoRef.current = ammo;

  const throwAt = (tx: number, ty: number) => {
    if (!live || ammoRef.current < 1 || Date.now() < stunUntil.current) return;
    const p = walker.ref.current, x = p.x, y = p.y - 0.5;
    const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy);
    if (d < 0.2) return;
    const s: Shot = { id: `${me.id.slice(0, 4)}${Date.now()}`, by: me.id, x, y, dx: dx / d, dy: dy / d, at: Date.now(), len: flight(x, y, dx / d, dy / d) };
    setAmmo(a => a - 1);
    actNow('me', 'throw');
    setShots(v => [...v, s]);
    send('throw', { s });
  };
  const throwRef = useRef(throwAt); throwRef.current = throwAt;
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (typing(e) || (e.key !== ' ' && e.key !== 'j' && e.key !== 'Enter')) return;
      e.preventDefault();
      const t = theirRef.current;
      if (t) throwRef.current(t.x, t.y - 0.5);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  // Quả của mình: kiểm tra trúng người ấy; quả bay hết tầm thì bỏ
  useEffect(() => {
    const t = theirRef.current;
    const keep: Shot[] = [];
    let changed = false;
    for (const s of shotsRef.current) {
      const d = ((now - s.at) / 1000) * SPEED;
      if (d >= s.len) { changed = true; continue; }
      if (s.by === me.id && t) {
        const x = s.x + s.dx * d, y = s.y + s.dy * d;
        if (Math.hypot(x - t.x, y - (t.y - 0.5)) < 0.5) { changed = true; send('hit', { id: s.id }); continue; }
      }
      keep.push(s);
    }
    if (changed) setShots(keep);
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const vw = useViewport();
  const s = Math.max(1.4, Math.min(5, (vw.w - 16) / (COLS * T), (vw.h - 250) / (ROWS * T)));
  const tile = T * s;
  const bg = useMemo(() => fieldSprite(snow), [snow]);
  const board = useRef<HTMLDivElement>(null);
  const tap = (e: React.PointerEvent) => {
    const b = board.current!.getBoundingClientRect();
    throwAt((e.clientX - b.left) / tile, (e.clientY - b.top) / tile);
  };
  const ball = snow ? '⚪' : '💧';
  const name = partner?.display_name ?? 'Người ấy';
  const wet = (who: string) => splat && splat.who === who && now - splat.at < 900;

  return (
    <PlayScreen title={snow ? '⛄ Ném tuyết' : '💦 Té súng nước'} here={here} partnerName={name} onLeave={onLeave}
      bottom={
        <div className="row center wrap snow-bar">
          {!round || over ? (
            <>
              {over && <b className="game-big">{myHits === theirHits ? '🤝 Hoà!' : myHits > theirHits ? '🏆 Bạn thắng!' : `🏆 ${name} thắng!`} ({myHits} – {theirHits})</b>}
              <span className="k-hint">Máy tính: <kbd>WASD</kbd> chạy, <b>bấm chuột</b> vào đâu là ném tới đó (hoặc <kbd>Space</kbd> ném thẳng vào người ấy). Điện thoại: giữ nút ◀▲▶▼ để chạy, chạm vào sân để ném. Trúng {WIN} lần trước là thắng!</span>
              <button className="btn" disabled={!here} onClick={() => send('start')}>{here ? (over ? '🔄 Chơi lại' : snow ? '⛄ Bắt đầu ném!' : '💦 Bắt đầu té nước!') : '⏳ Chờ người ấy vào'}</button>
            </>
          ) : (
            <>
              <b>Bạn {myHits} – {theirHits} {name}</b>
              <span>{elapsed < 0 ? `Chuẩn bị… ${Math.ceil(-elapsed / 1000)}` : `⏱️ ${Math.ceil((ROUND_MS - elapsed) / 1000)}s`}</span>
              <span className="snow-ammo">{Array.from({ length: AMMO }, (_, i) => <i key={i} className={i < ammo ? 'on' : ''}>{ball}</i>)}</span>
              <DPad hold={walker.hold} />
            </>
          )}
        </div>
      }>
      <div ref={board} className="k-view snow-board" style={{ width: COLS * tile, height: ROWS * tile, touchAction: 'none' }} onPointerDown={tap}>
        <img className="k-bg" src={bg.url} alt="" draggable={false} style={{ width: COLS * tile, height: ROWS * tile }} />
        {MAP.flatMap((row, y) => [...row].map((c, x) => c === 'o' ? (
          <img key={`${x},${y}`} className="snow-obst" src={emojiSprite(snow ? ((x + y) % 2 ? '⛄' : '🌲') : ((x + y) % 2 ? '🏰' : '⛱️')).url} alt=""
            style={{ left: x * tile, top: (y - 0.35) * tile, width: tile * 1.05, height: tile * 1.05, zIndex: y * 10 + 6 }} />
        ) : null))}
        <Chibi look={me.avatar} p={walker.pos} tile={tile} s={s} act={acts.me} tint={wet(me.id) ? (snow ? 'brightness(1.4)' : 'hue-rotate(160deg) saturate(1.6)') : undefined}
          held={!snow ? <span className="snow-gun">🔫</span> : undefined} bubble={wet(me.id) ? (snow ? '❄️ Á lạnh!' : '💦 Ướt rồi!') : null} />
        {theirPos && partner && <Chibi look={partner.avatar} p={theirPos} tile={tile} s={s} name={partner.display_name} className="them" act={acts.them}
          tint={wet(them) ? (snow ? 'brightness(1.4)' : 'hue-rotate(160deg) saturate(1.6)') : undefined}
          held={!snow ? <span className="snow-gun">🔫</span> : undefined} bubble={wet(them) ? (snow ? '❄️ Trúng rồi!' : '💦 Ướt nhẹp!') : null} />}
        {shots.map(sh => {
          const d = Math.min(sh.len, ((now - sh.at) / 1000) * SPEED);
          const arc = Math.sin((d / Math.max(1, sh.len)) * Math.PI) * 0.4;
          return <span key={sh.id} className={`snow-shot ${snow ? 'snow' : 'water'}`} style={{ left: (sh.x + sh.dx * d) * tile, top: (sh.y + sh.dy * d - arc) * tile, fontSize: tile * 0.45 }}>{ball}</span>;
        })}
      </div>
    </PlayScreen>
  );
}

function fieldSprite(snow: boolean) {
  return makeSprite(`field:${snow}`, COLS * T, ROWS * T, p => {
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const X = x * T, Y = y * T;
      if (snow) {
        p.rect(X, Y, T, T, (x + y) % 2 ? '#f4f9fd' : '#eaf3fa');
        p.px(X + 3, Y + 4, '#cfe2f0'); p.px(X + 11, Y + 9, '#cfe2f0'); p.px(X + 7, Y + 13, '#dbe9f4');
      } else {
        p.rect(X, Y, T, T, (x + y) % 2 ? '#f6e2ae' : '#f0d79c');
        p.px(X + 4, Y + 5, '#e2c27e'); p.px(X + 12, Y + 11, '#e2c27e');
        if (y === 0) { p.rect(X, Y, T, 6, '#7cc4ea'); p.rect(X, Y + 6, T, 2, '#fff8e6'); p.rect(X + (x % 3) * 4, Y + 2, 5, 1, '#b8e2f6'); }
      }
    }
  }, null);
}
