// Khu vui chơi: các trò hai người, đồng bộ bằng sự kiện realtime ('game').
// Mỗi máy tự chạy cùng một luật trên cùng một chuỗi nước đi nên hai bên luôn khớp nhau.
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { seeded } from '../lib/rng';
import type { GameId } from '../lib/world';
import { Sheet } from './Sheet';
import { nameOf, reward, useGameChannel, type GP, type Msg, type Props } from './gameKit';
import { Castle, Dance, FishRace, Focus, Puzzle, Quiz } from './Games2';
import { Cards } from './Cards';

export const TITLES: Record<GameId, string> = {
  caro: '⭕ Cờ ca-rô', rps: '✊ Oẳn tù tì', memory: '🃏 Lật thẻ tìm cặp', draw: '🎨 Vẽ đoán', cook: '👩‍🍳 Nấu ăn cùng nhau',
  quiz: '💞 Cậu hiểu tớ bao nhiêu', fishrace: '🎣 Câu cá thi', puzzle: '🧩 Ghép tranh cùng nhau', dance: '💃 Khiêu vũ đôi', castle: '🏰 Xây lâu đài cát', focus: '📚 Cùng học / làm việc',
  golf: '⛳ Golf mini quanh làng', snow: '⛄ Ném tuyết / 💦 Té nước', boat: '🛶 Chèo thuyền đôi', hide: '🙈 Trốn tìm', cards: '🃏 Sâm & 🤥 Nói dối',
};

export function GameSheet(p: Props) {
  const them = p.partner?.id ?? '';
  return (
    <Sheet title={TITLES[p.game]} onClose={p.onClose}>
      {!p.partnerOnline && <p className="muted">💤 {p.partner?.display_name ?? 'Người ấy'} chưa online — rủ người ấy vào game rồi cùng chơi nhé.</p>}
      {p.game === 'caro' && <Caro {...p} them={them} />}
      {p.game === 'rps' && <Rps {...p} them={them} />}
      {p.game === 'memory' && <Memory {...p} them={them} />}
      {p.game === 'draw' && <Draw {...p} them={them} />}
      {p.game === 'cards' && <Cards {...p} them={them} />}
      {p.game === 'quiz' && <Quiz {...p} them={them} />}
      {p.game === 'fishrace' && <FishRace {...p} them={them} />}
      {p.game === 'puzzle' && <Puzzle {...p} them={them} />}
      {p.game === 'dance' && <Dance {...p} them={them} />}
      {p.game === 'castle' && <Castle {...p} them={them} />}
      {p.game === 'focus' && <Focus {...p} them={them} />}
    </Sheet>
  );
}

// ───────── Cờ ca-rô 12×12, 5 quân liền là thắng ─────────

const N = 12;
interface CaroState { board: (string | null)[]; turn: string | null; winner: string | null; last: number; line: number[] }
function caroWin(b: (string | null)[], i: number, who: string): number[] {
  const x = i % N, y = Math.floor(i / N);
  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    const line = [i];
    for (const s of [1, -1]) {
      for (let k = 1; k < 5; k++) {
        const nx = x + dx * k * s, ny = y + dy * k * s;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || b[ny * N + nx] !== who) break;
        line.push(ny * N + nx);
      }
    }
    if (line.length >= 5) return line;
  }
  return [];
}
function Caro(p: GP) {
  const [st, dispatch] = useReducer((s: CaroState, m: Msg): CaroState => {
    if (m.t === 'new') return { board: Array(N * N).fill(null), turn: m.first, winner: null, last: -1, line: [] };
    if (m.t === 'move') {
      if (s.winner || s.turn !== m.by || s.board[m.i]) return s;
      const board = [...s.board];
      board[m.i] = m.by;
      const line = caroWin(board, m.i, m.by);
      return { board, turn: m.by === p.me.id ? p.them : p.me.id, winner: line.length ? m.by : null, last: m.i, line };
    }
    return s;
  }, { board: Array(N * N).fill(null), turn: null, winner: null, last: -1, line: [] });
  const send = useGameChannel('caro', p.me.id, dispatch);
  useEffect(() => { if (st.winner) reward('caro', p.date); }, [st.winner]); // eslint-disable-line react-hooks/exhaustive-deps
  const mark = (id: string | null) => (id ? (id < (id === p.me.id ? p.them : p.me.id) ? '🌸' : '🌟') : '');

  return (
    <div className="gamebox">
      <p className="game-status">
        {st.winner ? `🎉 ${nameOf(p, st.winner)} thắng rồi!` : st.turn ? (st.turn === p.me.id ? `Lượt của bạn (${mark(p.me.id)})` : `Chờ ${nameOf(p, st.turn)} đi (${mark(p.them)})…`) : 'Bấm "Ván mới" để bắt đầu — 5 quân liền nhau là thắng.'}
      </p>
      <div className="caro" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {st.board.map((c, i) => (
          <button key={i} className={`${i === st.last ? 'last' : ''} ${st.line.includes(i) ? 'win' : ''}`}
            disabled={!!c || !!st.winner || st.turn !== p.me.id} onClick={() => send('move', { i })}>{mark(c)}</button>
        ))}
      </div>
      <button className="btn small" onClick={() => send('new', { first: st.winner && st.winner !== p.me.id ? p.me.id : p.them || p.me.id })}>🔄 Ván mới</button>
    </div>
  );
}

// ───────── Oẳn tù tì: ai thắng 3 lượt trước ─────────

const HANDS = [{ id: 'rock', icon: '✊', name: 'Búa' }, { id: 'paper', icon: '✋', name: 'Bao' }, { id: 'scissors', icon: '✌️', name: 'Kéo' }];
const BEATS: Record<string, string> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
interface RpsState { round: number; picks: Record<number, Record<string, string>>; game: number }
function Rps(p: GP) {
  const [st, dispatch] = useReducer((s: RpsState, m: Msg): RpsState => {
    if (m.t === 'new') return { round: 0, picks: {}, game: s.game + 1 };
    if (m.t === 'pick') {
      if (m.round !== s.round || s.picks[s.round]?.[m.by]) return s;
      return { ...s, picks: { ...s.picks, [s.round]: { ...s.picks[s.round], [m.by]: m.hand } } };
    }
    if (m.t === 'next') return m.round === s.round ? { ...s, round: s.round + 1 } : s;
    return s;
  }, { round: 0, picks: {}, game: 0 });
  const send = useGameChannel('rps', p.me.id, dispatch);
  const score = useMemo(() => {
    const sc: Record<string, number> = { [p.me.id]: 0, [p.them]: 0 };
    Object.entries(st.picks).forEach(([r, pk]) => {
      if (Number(r) >= st.round) return;
      const a = pk[p.me.id], b = pk[p.them];
      if (a && b && a !== b) sc[BEATS[a] === b ? p.me.id : p.them]++;
    });
    return sc;
  }, [st, p.me.id, p.them]);
  const cur = st.picks[st.round] ?? {};
  const both = !!cur[p.me.id] && !!cur[p.them];
  const done = score[p.me.id] >= 3 || score[p.them] >= 3;
  useEffect(() => {
    if (!both) return;
    const t = setTimeout(() => dispatch({ g: 'rps', t: 'next', by: '', round: st.round }), 1800);
    return () => clearTimeout(t);
  }, [both, st.round]);
  useEffect(() => { if (done) reward('rps', p.date); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const hand = (id?: string) => HANDS.find(h => h.id === id)?.icon ?? '❔';
  const result = both ? (cur[p.me.id] === cur[p.them] ? 'Hòa!' : BEATS[cur[p.me.id]] === cur[p.them] ? 'Bạn thắng lượt này 🎉' : `${nameOf(p, p.them)} thắng lượt này`) : '';

  return (
    <div className="gamebox">
      <p className="game-status">Bạn {score[p.me.id]} – {score[p.them]} {nameOf(p, p.them)} · ai được 3 điểm trước là thắng</p>
      {done ? (
        <p className="game-big">{score[p.me.id] >= 3 ? '🏆 Bạn thắng chung cuộc!' : `🏆 ${nameOf(p, p.them)} thắng chung cuộc!`}</p>
      ) : (
        <>
          <div className="rps-face">
            <span className={both ? 'reveal' : ''}>{both || cur[p.me.id] ? hand(cur[p.me.id]) : '🤔'}</span>
            <small>vs</small>
            <span className={both ? 'reveal' : ''}>{both ? hand(cur[p.them]) : cur[p.them] ? '✅' : '🤔'}</span>
          </div>
          <p className="game-status">{result || (cur[p.me.id] ? `Chờ ${nameOf(p, p.them)} chọn…` : cur[p.them] ? `${nameOf(p, p.them)} chọn xong rồi, tới bạn!` : 'Chọn tay của bạn:')}</p>
          <div className="row center">
            {HANDS.map(h => (
              <button key={h.id} className="btn rps-btn" disabled={!!cur[p.me.id]} onClick={() => send('pick', { round: st.round, hand: h.id })}>{h.icon}<small>{h.name}</small></button>
            ))}
          </div>
        </>
      )}
      <button className="btn small ghost" onClick={() => send('new')}>🔄 Chơi lại</button>
    </div>
  );
}

// ───────── Lật thẻ tìm cặp (thay phiên, lật trúng được lật tiếp) ─────────

const FACES = ['🍓', '🐱', '🌸', '🍰', '🐳', '🌙', '🎈', '🍀', '🦊', '🍩'];
interface MemState { deck: string[]; open: number[]; owner: Record<number, string>; turn: string | null }
function Memory(p: GP) {
  const [st, dispatch] = useReducer((s: MemState, m: Msg): MemState => {
    if (m.t === 'new') {
      const r = seeded(String(m.seed));
      const deck = [...FACES.slice(0, 8), ...FACES.slice(0, 8)];
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      return { deck, open: [], owner: {}, turn: m.first };
    }
    if (m.t === 'flip') {
      if (s.turn !== m.by || s.open.length >= 2 || s.open.includes(m.i) || s.owner[m.i]) return s;
      const open = [...s.open, m.i];
      if (open.length === 2 && s.deck[open[0]] === s.deck[open[1]]) return { ...s, open: [], owner: { ...s.owner, [open[0]]: m.by, [open[1]]: m.by } };
      return { ...s, open };
    }
    if (m.t === 'hide') return s.open.length === 2 ? { ...s, open: [], turn: s.turn === p.me.id ? p.them : p.me.id } : s;
    return s;
  }, { deck: [], open: [], owner: {}, turn: null });
  const send = useGameChannel('memory', p.me.id, dispatch);
  useEffect(() => {
    if (st.open.length !== 2) return;
    const t = setTimeout(() => dispatch({ g: 'memory', t: 'hide', by: '' }), 1000);
    return () => clearTimeout(t);
  }, [st.open]);
  const mine = Object.values(st.owner).filter(o => o === p.me.id).length / 2;
  const theirs = Object.values(st.owner).filter(o => o === p.them).length / 2;
  const done = st.deck.length > 0 && Object.keys(st.owner).length === st.deck.length;
  useEffect(() => { if (done) reward('memory', p.date); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="gamebox">
      <p className="game-status">
        {done ? (mine === theirs ? '🤝 Hòa nhau, hợp ý quá!' : mine > theirs ? `🎉 Bạn thắng ${mine}–${theirs}!` : `🎉 ${nameOf(p, p.them)} thắng ${theirs}–${mine}!`)
          : st.turn ? `${st.turn === p.me.id ? 'Lượt của bạn' : `Lượt của ${nameOf(p, st.turn)}`} · Bạn ${mine} – ${theirs} ${nameOf(p, p.them)}`
            : 'Bấm "Ván mới" để chia bài.'}
      </p>
      <div className="memory">
        {st.deck.map((f, i) => {
          const up = st.open.includes(i) || !!st.owner[i];
          return (
            <button key={i} className={`card ${up ? 'up' : ''} ${st.owner[i] === p.me.id ? 'mine' : st.owner[i] ? 'theirs' : ''}`}
              disabled={up || st.turn !== p.me.id} onClick={() => send('flip', { i })}>{up ? f : '💗'}</button>
          );
        })}
      </div>
      <button className="btn small" onClick={() => send('new', { seed: Date.now(), first: p.them || p.me.id })}>🔄 Ván mới</button>
    </div>
  );
}

// ───────── Vẽ đoán: thay phiên vẽ theo chủ đề, đoán nhanh được nhiều điểm, ai chạm mốc trước thì thắng ─────────

export const DRAW_TOPICS: { id: string; name: string; words: string[] }[] = [
  { id: 'food', name: '🍜 Đồ ăn & đồ uống', words: ['phở', 'bánh mì', 'trà sữa', 'kem ốc quế', 'pizza', 'sushi', 'gà rán', 'bánh kem', 'mì cay', 'cà phê', 'dưa hấu', 'bánh bao', 'kimbap', 'bắp rang', 'trứng ốp la'] },
  { id: 'animal', name: '🐾 Động vật', words: ['con mèo', 'con chó', 'con thỏ', 'cá voi', 'chim cánh cụt', 'con gấu', 'con hổ', 'con voi', 'con rùa', 'con bướm', 'con vịt', 'hươu cao cổ', 'con khỉ', 'bạch tuộc', 'con cua'] },
  { id: 'home', name: '🏠 Đồ vật quanh nhà', words: ['cái ô', 'đồng hồ', 'điện thoại', 'đôi giày', 'cái gối', 'bàn chải đánh răng', 'kính mắt', 'cái ghế', 'tivi', 'chìa khóa', 'máy giặt', 'đèn ngủ', 'ba lô', 'cái cốc', 'chiếc nhẫn'] },
  { id: 'date', name: '💑 Hẹn hò & đi chơi', words: ['xem phim', 'nắm tay', 'đi biển', 'cắm trại', 'vòng đu quay', 'chụp ảnh', 'nấu ăn', 'ngắm sao', 'đạp xe', 'hát karaoke', 'ôm nhau', 'đi máy bay', 'thả diều', 'picnic', 'gọi video'] },
  { id: 'asia', name: '🌏 Hàn – Đài – Việt', words: ['kim chi', 'tteokbokki', 'hanbok', 'tháp Namsan', 'soju', 'Taipei 101', 'chợ đêm', 'đèn trời', 'nón lá', 'áo dài', 'bánh chưng', 'đôi đũa', 'tàu điện ngầm', 'đèn lồng', 'trà sữa trân châu'] },
];
const DRAW_MS = 90_000;
const COLORS = ['#3a2838', '#e8607a', '#f6a95e', '#f6c64e', '#86c257', '#8db8ef', '#b7a6e8', '#ffffff'];
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  .replace(/^(con|cai|chiec|doi|qua|ly|cay|ban|mot) /, '');
const sameWord = (a: string, b: string) => norm(a) === norm(b);
/** Điểm: đoán đúng trong 30 giây đầu +3, trong 60 giây +2, sau đó +1; người vẽ được +1 khi có người đoán ra */
const guessPts = (ms: number) => (ms < 30_000 ? 3 : ms < 60_000 ? 2 : 1);

interface DrawState {
  target: number; topic: string; scores: Record<string, number>; drawer: string | null; lastDrawer: string | null;
  pattern: number[]; topicOf: string; at: number; solved: { word: string; by: string | null; pts: number } | null; winner: string | null; round: number;
}
const DRAW0: DrawState = { target: 10, topic: 'mix', scores: {}, drawer: null, lastDrawer: null, pattern: [], topicOf: '', at: 0, solved: null, winner: null, round: 0 };

function Draw(p: GP) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [word, setWord] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [guess, setGuess] = useState('');
  const [log, setLog] = useState<{ who: string; text: string; ok?: boolean }[]>([]);
  const [now, setNow] = useState(Date.now());
  const used = useRef(new Set<string>());
  const wordRef = useRef(word); wordRef.current = word;
  const stRef = useRef<DrawState>(DRAW0);

  const ctx = () => canvas.current?.getContext('2d') ?? null;
  const stroke = (pts: number[], c: string) => {
    const g = ctx(); if (!g || !canvas.current) return;
    const { width: w, height: h } = canvas.current;
    g.strokeStyle = c; g.lineWidth = c === '#ffffff' ? 16 : 4; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i < pts.length; i += 2) (i ? g.lineTo : g.moveTo).call(g, pts[i] * w, pts[i + 1] * h);
    g.stroke();
  };
  const clear = () => { const g = ctx(); if (g && canvas.current) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, canvas.current.width, canvas.current.height); } };
  useEffect(clear, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);

  const [st, dispatch] = useReducer((s: DrawState, m: Msg): DrawState => {
    switch (m.t) {
      case 'state': return m.by !== p.me.id && !s.round ? m.st : s;
      case 'match': return { ...DRAW0, target: m.target, topic: m.topic, scores: { [p.me.id]: 0, [p.them]: 0 } };
      case 'topic': return { ...s, topic: m.topic };
      case 'new': return { ...s, drawer: m.by, lastDrawer: m.by, pattern: m.pattern, topicOf: m.topicOf, at: m.at, solved: null, round: s.round + 1 };
      case 'solved': {
        if (s.solved || s.winner) return s;
        const scores = { ...s.scores };
        if (m.guesser) { scores[m.guesser] = (scores[m.guesser] ?? 0) + m.pts; scores[s.drawer!] = (scores[s.drawer!] ?? 0) + 1; }
        const winner = Object.entries(scores).find(([, v]) => v >= s.target)?.[0] ?? null;
        return { ...s, scores, solved: { word: m.word, by: m.guesser, pts: m.pts }, winner };
      }
      default: return s;
    }
  }, DRAW0);
  stRef.current = st;

  const send = useGameChannel('draw', p.me.id, m => {
    if (m.t === 'hello' && m.by !== p.me.id && stRef.current.round) send('state', { st: stRef.current });
    if (m.t === 'new') { setLog([]); clear(); if (m.by !== p.me.id) setWord(''); }
    if (m.t === 'match') { setLog([]); clear(); setWord(''); used.current.clear(); }
    if (m.t === 'stroke' && m.by !== p.me.id) stroke(m.pts, m.c);
    if (m.t === 'clear') clear();
    if (m.t === 'guess') {
      setLog(l => [...l.slice(-6), { who: m.by, text: m.text }]);
      const s = stRef.current;
      if (s.drawer === p.me.id && !s.solved && m.by !== p.me.id && wordRef.current && sameWord(m.text, wordRef.current)) {
        send('solved', { word: wordRef.current, guesser: m.by, pts: guessPts(Date.now() - s.at) });
      }
    }
    if (m.t === 'solved') setLog(l => [...l, { who: m.guesser ?? '', text: m.guesser ? `${m.word} (+${m.pts})` : `Hết giờ — từ là “${m.word}”`, ok: !!m.guesser }]);
    dispatch(m);
  });
  useEffect(() => { send('hello'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Người vẽ canh giờ: hết 90 giây thì lộ đáp án, không ai được điểm
  const left = st.drawer && !st.solved ? Math.max(0, st.at + DRAW_MS - now) : 0;
  useEffect(() => {
    if (st.drawer === p.me.id && !st.solved && st.at && left === 0 && wordRef.current) send('solved', { word: wordRef.current, guesser: null, pts: 0 });
  }, [left === 0]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (st.winner) reward('draw', p.date); }, [st.winner]); // eslint-disable-line react-hooks/exhaustive-deps

  function draw() {
    const pool = st.topic === 'mix' ? DRAW_TOPICS : DRAW_TOPICS.filter(t => t.id === st.topic);
    const all = pool.flatMap(t => t.words.map(w => ({ w, t: t.name })));
    const fresh = all.filter(x => !used.current.has(x.w));
    const pick = (fresh.length ? fresh : all)[Math.floor(Math.random() * (fresh.length || all.length))];
    used.current.add(pick.w);
    setWord(pick.w);
    send('new', { pattern: pick.w.split(' ').map(x => x.length), topicOf: pick.t, at: Date.now() });
  }

  const pts = useRef<number[]>([]);
  const drawing = useRef(false);
  const amDrawer = st.drawer === p.me.id && !st.solved;
  const myTurnNext = !st.lastDrawer ? true : st.lastDrawer !== p.me.id;
  function pos(e: React.PointerEvent) {
    const r = canvas.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  }
  function flush() {
    if (pts.current.length >= 4) send('stroke', { pts: pts.current, c: color });
    pts.current = pts.current.slice(-2);
  }
  const playing = st.round > 0 || Object.keys(st.scores).length > 0;
  const sc = (id: string) => st.scores[id] ?? 0;

  if (!playing) return (
    <div className="gamebox">
      <p className="game-status">Thay phiên nhau vẽ — đoán đúng càng nhanh càng nhiều điểm (+3 / +2 / +1), người vẽ +1 khi có người đoán ra.</p>
      <div className="field"><span>Chủ đề</span>
        <div className="choice-row wrap">
          <button className={`chip ${st.topic === 'mix' ? 'active' : ''}`} onClick={() => send('topic', { topic: 'mix' })}>🎲 Trộn tất cả</button>
          {DRAW_TOPICS.map(t => <button key={t.id} className={`chip ${st.topic === t.id ? 'active' : ''}`} onClick={() => send('topic', { topic: t.id })}>{t.name}</button>)}
        </div>
      </div>
      <div className="field"><span>Ai đạt trước bao nhiêu điểm thì thắng?</span>
        <div className="choice-row">{[5, 10, 15].map(n => <button key={n} className="btn small ghost" onClick={() => send('match', { target: n, topic: st.topic })}>🏁 {n} điểm</button>)}</div>
      </div>
    </div>
  );

  return (
    <div className="gamebox">
      <div className="draw-score">
        {[p.me.id, p.them].map(id => (
          <div key={id} className={`draw-player ${st.winner === id ? 'win' : ''}`}>
            <span>{nameOf(p, id)}{st.drawer === id && !st.solved ? ' ✏️' : ''}</span>
            <i><b style={{ width: `${Math.min(100, (sc(id) / st.target) * 100)}%` }} /></i>
            <strong>{sc(id)}/{st.target}</strong>
          </div>
        ))}
      </div>
      <p className="game-status">
        {st.winner ? (st.winner === p.me.id ? '🏆 Bạn thắng ván này!' : `🏆 ${nameOf(p, st.winner)} thắng ván này!`)
          : st.solved ? (st.solved.by ? `🎉 ${nameOf(p, st.solved.by)} đoán đúng “${st.solved.word}” (+${st.solved.pts})` : `⏰ Hết giờ! Từ là “${st.solved.word}”`)
            : !st.drawer ? (myTurnNext ? 'Tới lượt bạn vẽ!' : `Chờ ${nameOf(p, p.them)} vẽ…`)
              : amDrawer ? <>Vẽ: <b>{word}</b> <small>({st.topicOf})</small> · ⏱️ {Math.ceil(left / 1000)}s</>
                : <>{st.topicOf} · <span className="draw-blanks">{st.pattern.map(n => '_'.repeat(n).split('').join(' ')).join('   ')}</span> · ⏱️ {Math.ceil(left / 1000)}s</>}
      </p>
      <canvas ref={canvas} width={480} height={320} className={`draw-canvas ${amDrawer ? 'can-draw' : ''}`}
        onPointerDown={e => { if (!amDrawer) return; drawing.current = true; (e.target as Element).setPointerCapture(e.pointerId); pts.current = pos(e); }}
        onPointerMove={e => {
          if (!drawing.current) return;
          const [x, y] = pos(e);
          stroke([...pts.current.slice(-2), x, y], color);
          pts.current.push(x, y);
          if (pts.current.length > 12) flush();
        }}
        onPointerUp={() => { if (drawing.current) flush(); drawing.current = false; pts.current = []; }} />
      {amDrawer && (
        <div className="row wrap center">
          {COLORS.map(c => <button key={c} className={`swatch ${c === color ? 'active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={c === '#ffffff' ? 'Tẩy' : 'Màu'} />)}
          <button className="btn small ghost" onClick={() => send('clear')}>🧽 Xóa hết</button>
          <button className="btn small ghost" onClick={() => send('solved', { word, guesser: null, pts: 0 })}>⏭️ Bỏ qua</button>
        </div>
      )}
      {st.drawer && !amDrawer && !st.solved && (
        <form className="row" onSubmit={e => { e.preventDefault(); if (guess.trim()) { send('guess', { text: guess.trim() }); setGuess(''); } }}>
          <input value={guess} maxLength={40} onChange={e => setGuess(e.target.value)} placeholder="Đoán là…" autoFocus />
          <button className="btn small">Đoán</button>
        </form>
      )}
      <ul className="chat-log">{log.map((l, i) => <li key={i} className={l.who === p.me.id ? 'me' : 'partner'}>{l.ok ? '✅ ' : ''}{l.text}</li>)}</ul>
      <div className="row center wrap">
        {!st.winner && (!st.drawer || st.solved) && myTurnNext && <button className="btn" onClick={draw}>✏️ {st.round ? 'Tới lượt mình vẽ' : 'Mình vẽ trước'}</button>}
        <button className="btn small ghost" onClick={() => send('match', { target: st.target, topic: st.topic })}>🔄 Ván mới</button>
      </div>
    </div>
  );
}
