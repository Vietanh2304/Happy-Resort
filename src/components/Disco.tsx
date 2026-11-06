// Phòng sàn nhảy: mũi tên chạy dưới chân màn hình, bấm đúng nhịp thì nhân vật trong phòng làm động tác.
// Hai người cùng trúng một nhịp = "đồng điệu" 💞. Đồng bộ bằng kênh trò chơi 'dance'.
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as api from '../lib/api';
import { seeded } from '../lib/rng';
import { reward, useGameChannel, type Msg } from './gameKit';

export const BEATS = 32, BEAT_MS = 900, WINDOW = 260, AHEAD = 4200;
const DIRS = [{ k: 'ArrowLeft', icon: '⬅️' }, { k: 'ArrowUp', icon: '⬆️' }, { k: 'ArrowDown', icon: '⬇️' }, { k: 'ArrowRight', icon: '➡️' }];
/** Động tác ứng với mũi tên và nhịp (mỗi mũi tên có 2 kiểu cho đỡ nhàm) */
export const moveOf = (d: number, k: number) => (d * 2 + (k % 2)) % 8;
interface State { at: number; seed: number; hits: Record<string, number[]> }

export function DanceBar({ me, them, themName, date, onMove, onLeave }: {
  me: api.Profile; them: string; themName: string; date: string;
  onMove: (who: 'me' | 'them', move: number, both: boolean) => void; onLeave: () => void;
}) {
  const stRef = useRef<State | null>(null);
  const seqRef = useRef<number[]>([]);
  const [st, dispatch] = useReducer((s: State, m: Msg): State => {
    if (m.t === 'state' && m.by !== me.id && !s.at) return m.st;
    if (m.t === 'new') return { at: m.at, seed: m.seed, hits: {} };
    if (m.t === 'hit') return (s.hits[m.by] ?? []).includes(m.k) ? s : { ...s, hits: { ...s.hits, [m.by]: [...(s.hits[m.by] ?? []), m.k] } };
    return s;
  }, { at: 0, seed: 0, hits: {} });
  stRef.current = st;
  const send = useGameChannel('dance', me.id, m => {
    if (m.t === 'hello' && m.by !== me.id && stRef.current?.at) send('state', { st: stRef.current });
    if (m.t === 'hit' && m.by !== me.id) {
      const both = (stRef.current?.hits[me.id] ?? []).includes(m.k);
      onMove('them', moveOf(seqRef.current[m.k] ?? 0, m.k), both);
    }
    dispatch(m);
  });
  useEffect(() => { send('hello'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const seq = useMemo(() => { const r = seeded(`dance:${st.seed}`); return Array.from({ length: BEATS }, () => Math.floor(r() * 4)); }, [st.seed]);
  seqRef.current = seq;
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  useEffect(() => { let raf = 0; const loop = () => { setNow(Date.now()); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf); }, []);
  const beatTime = (k: number) => st.at + k * BEAT_MS;
  const end = st.at + BEATS * BEAT_MS + 800;
  const running = st.at > 0 && now >= st.at - 300 && now < end;
  const over = st.at > 0 && now >= end;
  const mine = st.hits[me.id] ?? [], theirs = st.hits[them] ?? [];
  const sync = mine.filter(k => theirs.includes(k)).length;
  useEffect(() => { if (over) reward('dance', date); }, [over]); // eslint-disable-line react-hooks/exhaustive-deps

  const press = (d: number) => {
    if (!running) return;
    const t = Date.now();
    const k = Math.round((t - st.at) / BEAT_MS);
    const ok = k >= 0 && k < BEATS && Math.abs(t - beatTime(k)) <= WINDOW && seq[k] === d && !mine.includes(k);
    setFlash(ok ? 'hit' : 'miss'); setTimeout(() => setFlash(null), 200);
    if (ok) { send('hit', { k }); onMove('me', moveOf(d, k), theirs.includes(k)); }
  };
  const pressRef = useRef(press); pressRef.current = press;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { const d = DIRS.findIndex(x => x.k === e.key); if (d >= 0) { e.preventDefault(); pressRef.current(d); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="dance-bar">
      <div className="dance-head">
        {running ? <span>💃 Bạn {mine.length} · {themName} {theirs.length} · <b>💞 Đồng điệu {sync}</b></span>
          : over ? <span>🎉 Đồng điệu <b>{sync}/{BEATS}</b> · Bạn {mine.length} · {themName} {theirs.length} — {sync >= 22 ? 'Cặp đôi sàn nhảy! 🔥' : sync >= 12 ? 'Ăn ý ghê 💞' : 'Nhảy thêm vài bài nữa nào 😆'}</span>
            : st.at && now < st.at ? <span>🎶 Vào nhạc… {Math.ceil((st.at - now) / 1000)}</span>
              : <span>🪩 Mũi tên chạy tới vòng tròn thì bấm đúng hướng (máy tính: phím mũi tên). Cùng trúng một nhịp = 💞</span>}
        <div className="row">
          {!running && <button className="btn small" onClick={() => send('new', { at: Date.now() + 3000, seed: Date.now() })}>{st.at ? '🔄 Bài khác' : '🎶 Bắt đầu nhảy'}</button>}
          <button className="btn small ghost" onClick={onLeave}>🚪 Ra ngoài</button>
        </div>
      </div>
      <div className={`dance-lane ${flash ?? ''}`}>
        <div className="dance-target" />
        {running && seq.map((d, k) => {
          const dt = beatTime(k) - now;
          if (dt < -500 || dt > AHEAD) return null;
          const hit = mine.includes(k), both = hit && theirs.includes(k);
          return <span key={k} className={`dance-arrow ${hit ? 'hit' : ''} ${both ? 'both' : ''}`} style={{ left: `calc(10% + ${(dt / AHEAD) * 86}%)` }}>{DIRS[d].icon}</span>;
        })}
      </div>
      <div className="dance-keys">
        {DIRS.map((d, i) => <button key={d.k} className="btn" disabled={!running} onPointerDown={e => { e.preventDefault(); press(i); }}>{d.icon}</button>)}
      </div>
    </div>
  );
}
