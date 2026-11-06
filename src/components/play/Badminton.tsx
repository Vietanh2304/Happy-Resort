// 🏸 Cầu lông: sân nhìn ngang, mỗi người một nửa sân (id nhỏ hơn bên trái). Di chuyển trái/phải, bấm "Đánh"
// khi quả cầu tới gần. Cầu rơi bên sân ai thì máy người đó phân xử (đỡ được hay mất điểm).
// Hai kiểu chơi: đối kháng (chạm 11 điểm) hoặc giữ cầu (đếm số lần đánh qua lại).
import { useEffect, useRef, useState } from 'react';
import { canHit, COURT, landT, landX, NET_H, NET_X, plan, posAt, type Shot } from '../../lib/badminton';
import { characterSprite } from '../../lib/sprites';
import { reward } from '../gameKit';
import { PlayScreen, typing, useFrame, usePeer, useViewport, type PlayProps } from './kit';

const WIN = 11, SPEED = 7;
type Mode = 'versus' | 'coop';
interface Game { mode: Mode; score: Record<string, number>; serve: string; rally: number; best: number; over: boolean; last: string | null }

export function Badminton({ me, partner, date, onLeave }: PlayProps) {
  const them = partner?.id ?? '';
  const name = partner?.display_name ?? 'Người ấy';
  const left = !them || me.id < them;
  const dir: 1 | -1 = left ? 1 : -1;
  const [game, setGame] = useState<Game | null>(null);
  const gRef = useRef(game); gRef.current = game;
  const [shot, setShot] = useState<(Shot & { at: number }) | null>(null);
  const shotRef = useRef(shot); shotRef.current = shot;
  const [theirX, setTheirX] = useState(left ? 15 : 5);
  const [swing, setSwing] = useState<{ who: string; at: number } | null>(null);
  const myX = useRef(left ? 5 : 15);
  const [, force] = useState(0);
  const judged = useRef('');

  const point = (g: Game, winner: string | null): Game => {
    if (g.mode === 'coop') return { ...g, best: Math.max(g.best, g.rally), rally: 0, last: winner };
    const score = winner ? { ...g.score, [winner]: (g.score[winner] ?? 0) + 1 } : g.score;
    return { ...g, score, serve: winner ?? g.serve, rally: 0, over: Object.values(score).some(v => v >= WIN), last: winner };
  };
  const { send, here } = usePeer('badminton', me.id, (m, mine) => {
    if (m.t === 'start') { setGame({ mode: m.mode, score: {}, serve: m.by, rally: 0, best: 0, over: false, last: null }); setShot(null); }
    if (m.t === 'sync' && !mine && !gRef.current) setGame(m.game);
    if (m.t === 'x' && !mine) setTheirX(m.x);
    if (m.t === 'hit') {
      setShot({ ...m.s, at: Date.now() });
      setSwing({ who: m.by, at: Date.now() });
      setGame(g => (g ? { ...g, rally: g.rally + 1 } : g));
    }
    if (m.t === 'point') { setShot(null); setGame(g => (g ? point({ ...g, serve: m.serve ?? g.serve }, m.winner) : g)); }
  }, () => { if (gRef.current) send('sync', { game: gRef.current }); send('x', { x: myX.current }); });
  useEffect(() => { if (game?.over || (game?.mode === 'coop' && game.best >= 10)) reward('badminton', date); }, [game?.over, game?.best]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = useFrame();
  const t = shot ? (now - shot.at) / 1000 : 0;
  const cock = shot ? posAt(shot, t) : null;

  // Di chuyển trái/phải trên nửa sân của mình
  const keys = useRef({ l: false, r: false });
  const lastT = useRef(performance.now()), lastSent = useRef(0);
  useEffect(() => {
    const tt = performance.now(), dt = Math.min(0.05, (tt - lastT.current) / 1000);
    lastT.current = tt;
    const d = (keys.current.r ? 1 : 0) - (keys.current.l ? 1 : 0);
    if (d) {
      const [lo, hi] = left ? [0.8, NET_X - 0.7] : [NET_X + 0.7, COURT - 0.8];
      myX.current = Math.max(lo, Math.min(hi, myX.current + d * SPEED * dt));
      if (tt - lastSent.current > 80) { lastSent.current = tt; send('x', { x: myX.current }); }
      force(v => v + 1);
    }
    // Phân xử: cầu của người ấy rơi bên sân mình mà mình chưa đỡ → mất điểm
    const s = shotRef.current, g = gRef.current;
    if (s && g && s.by !== me.id && (now - s.at) / 1000 >= landT(s)) {
      const key = `${s.at}`;
      const mySide = left ? landX(s) < NET_X : landX(s) > NET_X;
      if (mySide && judged.current !== key) { judged.current = key; send('point', { winner: g.mode === 'coop' ? null : s.by, serve: s.by }); }
    }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  const hit = () => {
    const g = gRef.current;
    if (!g || g.over) return;
    const s = shotRef.current;
    if (!s) {
      if (g.serve !== me.id) return;
      send('hit', { s: plan(me.id, myX.current + dir * 0.6, 1.2, dir, false, Math.random()) });
      return;
    }
    if (s.by === me.id) return;
    const c = posAt(s, (Date.now() - s.at) / 1000);
    if (!canHit(myX.current, c)) { setSwing({ who: me.id, at: Date.now() }); return; }
    send('hit', { s: plan(me.id, c.x, c.y, dir, c.y > 1.7, Math.random()) });
  };
  const hitRef = useRef(hit); hitRef.current = hit;
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (typing(e)) return;
      if (['a', 'A', 'ArrowLeft'].includes(e.key)) { keys.current.l = true; e.preventDefault(); }
      else if (['d', 'D', 'ArrowRight'].includes(e.key)) { keys.current.r = true; e.preventDefault(); }
      else if ((e.key === ' ' || e.key === 'j' || e.key === 'ArrowUp' || e.key === 'w') && !e.repeat) { e.preventDefault(); hitRef.current(); }
    };
    const ku = (e: KeyboardEvent) => {
      if (['a', 'A', 'ArrowLeft'].includes(e.key)) keys.current.l = false;
      if (['d', 'D', 'ArrowRight'].includes(e.key)) keys.current.r = false;
    };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const vw = useViewport();
  const W = Math.min(vw.w - 16, 1000), u = W / COURT, H = u * 7.5;
  const ground = H - u * 1.1;
  const X = (x: number) => x * u, Y = (y: number) => ground - y * u;
  const sp = Math.max(1.5, u / 12);
  const moved = useRef<Record<string, { x: number; at: number }>>({});
  const player = (look: typeof me.avatar, x: number, who: string, faceRight: boolean, label?: string) => {
    const swinging = swing && swing.who === who && now - swing.at < 300;
    const mv = moved.current[who];
    if (!mv || Math.abs(mv.x - x) > 0.01) moved.current[who] = { x, at: now };
    const running = !!mv && now - mv.at < 140;
    // Vung vợt: giơ lên rồi đập xuống; đang chạy thì bước chân
    const spr = swinging ? characterSprite(look, 'act', undefined, 'front', now - swing!.at < 120 ? 6 : 7)
      : characterSprite(look, running ? 'walk' : 'idle', undefined, 'side', running ? Math.floor(now / 110) % 4 : 0);
    return (
      <div className="bad-player" style={{ left: X(x), top: ground }}>
        <img src={spr.url} alt="" style={{ width: spr.w * sp, height: spr.h * sp, marginLeft: -spr.w * sp / 2, marginTop: -spr.h * sp, transform: faceRight ? undefined : 'scaleX(-1)' }} />
        <span className={`bad-racket ${swinging ? 'swing' : ''}`} style={{ fontSize: sp * 11, top: -spr.h * sp * 0.75, left: faceRight ? sp * 3 : -sp * 14, transform: faceRight ? undefined : 'scaleX(-1)' }}>🏸</span>
        {label && <span className="k-name">{label}</span>}
      </div>
    );
  };
  const serving = game && !shot && !game.over;
  const ready = !!shot && shot.by !== me.id && cock && canHit(myX.current, cock);
  const myScore = game?.score[me.id] ?? 0, theirScore = game?.score[them] ?? 0;

  return (
    <PlayScreen title="🏸 Cầu lông" here={here} partnerName={name} onLeave={onLeave}
      bottom={
        <div className="row center wrap bad-bar">
          {!game || game.over ? (
            <>
              {game?.over && <b className="game-big">{myScore > theirScore ? '🏆 Bạn thắng!' : `🏆 ${name} thắng!`} ({myScore} – {theirScore})</b>}
              <span className="k-hint">Máy tính: <kbd>A</kbd>/<kbd>D</kbd> (hoặc ◀ ▶) chạy, <kbd>Space</kbd> đánh khi cầu tới gần (cầu càng cao càng đập mạnh). Điện thoại: giữ ◀ ▶, chạm 🏸 để đánh.</span>
              <button className="btn" disabled={!here} onClick={() => send('start', { mode: 'versus' })}>⚔️ Đối kháng (chạm {WIN})</button>
              <button className="btn ghost" disabled={!here} onClick={() => send('start', { mode: 'coop' })}>🤝 Giữ cầu cùng nhau</button>
            </>
          ) : (
            <>
              {game.mode === 'versus' ? <b>Bạn {myScore} – {theirScore} {name}</b> : <b>🤝 Chuỗi {game.rally} · kỷ lục {game.best}</b>}
              <span className="k-hint">{serving ? (game.serve === me.id ? '👉 Bạn giao cầu: bấm 🏸' : `⏳ ${name} giao cầu…`) : ready ? '⚡ ĐÁNH NGAY!' : ' '}</span>
              <span className="bad-pad">
                <button onPointerDown={e => { e.preventDefault(); keys.current.l = true; }} onPointerUp={() => { keys.current.l = false; }} onPointerCancel={() => { keys.current.l = false; }} onPointerLeave={() => { keys.current.l = false; }}>◀</button>
                <button className={`hit ${ready ? 'ready' : ''}`} onPointerDown={e => { e.preventDefault(); hit(); }}>🏸</button>
                <button onPointerDown={e => { e.preventDefault(); keys.current.r = true; }} onPointerUp={() => { keys.current.r = false; }} onPointerCancel={() => { keys.current.r = false; }} onPointerLeave={() => { keys.current.r = false; }}>▶</button>
              </span>
            </>
          )}
        </div>
      }>
      <div className="k-view bad-court" style={{ width: W, height: H }}>
        <div className="bad-ground" style={{ top: ground, height: H - ground }} />
        <div className="bad-line" style={{ left: X(0.3), width: X(COURT - 0.6), top: ground }} />
        <div className="bad-net" style={{ left: X(NET_X) - 2, top: Y(NET_H), height: NET_H * u }} />
        {player(me.avatar, myX.current, me.id, left)}
        {partner && here && player(partner.avatar, theirX, them, !left, name)}
        {cock && <span className="bad-cock" style={{ left: X(cock.x), top: Y(cock.y), fontSize: u * 0.55 }}>🪶</span>}
        {serving && game.serve === me.id && <span className="bad-cock" style={{ left: X(myX.current + dir * 0.6), top: Y(1.2), fontSize: u * 0.55 }}>🪶</span>}
        {serving && game.serve === them && <span className="bad-cock" style={{ left: X(theirX - dir * 0.6), top: Y(1.2), fontSize: u * 0.55 }}>🪶</span>}
        {game?.last !== undefined && game?.last !== null && !shot && game.mode === 'versus' && <span className="bad-pt">{game.last === me.id ? '🎉 Điểm cho bạn!' : `Điểm cho ${name}`}</span>}
      </div>
    </PlayScreen>
  );
}
