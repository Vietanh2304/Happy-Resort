// Khu vui chơi: các trò hai người, đồng bộ bằng sự kiện realtime ('game').
// Mỗi máy tự chạy cùng một luật trên cùng một chuỗi nước đi nên hai bên luôn khớp nhau.
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as api from '../lib/api';
import { content, item } from '../lib/content';
import { seeded } from '../lib/rng';
import { toast } from '../lib/toast';
import type { GameId } from '../lib/world';
import { notify } from '../lib/realtime';
import { Sheet } from './Sheet';
import { nameOf, reward, useGameChannel, type GP, type Msg, type Props } from './gameKit';
import { Castle, Dance, FishRace, Focus, Puzzle, Quiz } from './Games2';

export const TITLES: Record<GameId, string> = {
  caro: '⭕ Cờ ca-rô', rps: '✊ Oẳn tù tì', memory: '🃏 Lật thẻ tìm cặp', draw: '🎨 Vẽ đoán', cook: '👩‍🍳 Nấu ăn cùng nhau',
  quiz: '💞 Cậu hiểu tớ bao nhiêu', fishrace: '🎣 Câu cá thi', puzzle: '🧩 Ghép tranh cùng nhau', dance: '💃 Khiêu vũ đôi', castle: '🏰 Xây lâu đài cát', focus: '📚 Cùng học / làm việc',
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
      {p.game === 'cook' && <Cook {...p} them={them} />}
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

// ───────── Vẽ đoán: một người vẽ, người kia đoán (nói qua mic càng vui) ─────────

const WORDS = ['con mèo', 'trái tim', 'cây dừa', 'mặt trời', 'ngôi nhà', 'cá voi', 'bánh kem', 'máy bay', 'hoa hồng', 'cầu vồng', 'kem ốc quế',
  'con thỏ', 'mặt trăng', 'ngôi sao', 'xe đạp', 'cái ô', 'con cá', 'quả táo', 'bông hoa', 'con vịt', 'trà sữa', 'bánh bao', 'chiếc nhẫn',
  'núi', 'con gấu', 'quả dâu', 'ly cà phê', 'đôi giày', 'con bướm', 'thuyền buồm', 'kim chi', 'đèn lồng', 'người tuyết', 'cây thông'];
const COLORS = ['#3a2838', '#e8607a', '#f6a95e', '#f6c64e', '#86c257', '#8db8ef', '#b7a6e8', '#ffffff'];
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/\s+/g, ' ').trim();

function Draw(p: GP) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawer, setDrawer] = useState<string | null>(null);
  const [word, setWord] = useState('');
  const [len, setLen] = useState(0);
  const [color, setColor] = useState(COLORS[0]);
  const [guess, setGuess] = useState('');
  const [log, setLog] = useState<{ who: string; text: string; ok?: boolean }[]>([]);
  const [solved, setSolved] = useState<string | null>(null);
  const wordRef = useRef(word);
  wordRef.current = word;

  const ctx = () => canvas.current?.getContext('2d') ?? null;
  const stroke = (pts: number[], c: string) => {
    const g = ctx(); if (!g || !canvas.current) return;
    const { width: w, height: h } = canvas.current;
    g.strokeStyle = c; g.lineWidth = c === '#ffffff' ? 14 : 4; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i < pts.length; i += 2) (i ? g.lineTo : g.moveTo).call(g, pts[i] * w, pts[i + 1] * h);
    g.stroke();
  };
  const clear = () => { const g = ctx(); if (g && canvas.current) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, canvas.current.width, canvas.current.height); } };
  useEffect(clear, []);

  const send = useGameChannel('draw', p.me.id, m => {
    if (m.t === 'new') { setDrawer(m.by); setLen(m.len); setSolved(null); setLog([]); clear(); if (m.by !== p.me.id) setWord(''); }
    if (m.t === 'stroke' && m.by !== p.me.id) stroke(m.pts, m.c);
    if (m.t === 'clear') clear();
    if (m.t === 'guess') {
      const ok = !!wordRef.current && norm(m.text) === norm(wordRef.current);
      setLog(l => [...l.slice(-6), { who: m.by, text: m.text }]);
      if (ok && m.by !== p.me.id) send('solved', { word: wordRef.current, guesser: m.by });
    }
    if (m.t === 'solved') { setSolved(m.word); setLog(l => [...l, { who: m.guesser, text: m.word, ok: true }]); reward('draw', p.date); }
  });

  function start() {
    const w = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(w);
    send('new', { len: w.replace(/\s/g, '').length });
  }

  // Nét vẽ: gom điểm rồi gửi từng đoạn ngắn
  const pts = useRef<number[]>([]);
  const drawing = useRef(false);
  const amDrawer = drawer === p.me.id && !solved;
  function pos(e: React.PointerEvent) {
    const r = canvas.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  }
  function flush() {
    if (pts.current.length >= 4) { send('stroke', { pts: pts.current, c: color }); }
    pts.current = pts.current.slice(-2);
  }

  return (
    <div className="gamebox">
      <p className="game-status">
        {solved ? `🎉 Đoán đúng rồi: “${solved}”!` : !drawer ? 'Bấm "Mình vẽ" để nhận một từ bí mật và vẽ cho người ấy đoán.'
          : amDrawer ? <>Vẽ từ: <b>{word}</b> (đừng viết chữ nha 🤫)</> : `${nameOf(p, drawer)} đang vẽ — từ có ${len} chữ cái. Đoán đi!`}
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
        </div>
      )}
      {drawer && !amDrawer && !solved && (
        <form className="row" onSubmit={e => { e.preventDefault(); if (guess.trim()) { send('guess', { text: guess.trim() }); setGuess(''); } }}>
          <input value={guess} maxLength={40} onChange={e => setGuess(e.target.value)} placeholder="Đoán là…" />
          <button className="btn small">Đoán</button>
        </form>
      )}
      <ul className="chat-log">{log.map((l, i) => <li key={i} className={l.who === p.me.id ? 'me' : 'partner'}>{l.ok ? '✅ ' : ''}{l.text}</li>)}</ul>
      <button className="btn small" onClick={start}>✏️ Mình vẽ</button>
    </div>
  );
}

// ───────── Nấu ăn cùng nhau: mỗi người làm một công đoạn, thay phiên nhau ─────────

type StepKind = 'chop' | 'stir' | 'heat' | 'pick';
interface CookStep { a: StepKind; label: string; pick?: string[] }
const COOK: { dish: string; steps: CookStep[] }[] = [
  { dish: 'kimchi_stew', steps: [{ a: 'chop', label: '🔪 Thái kimchi và đậu phụ' }, { a: 'heat', label: '🔥 Canh lửa sôi vừa' }, { a: 'stir', label: '🥄 Khuấy nồi canh' }, { a: 'pick', label: '🧂 Nêm cho đậm đà', pick: ['🌶️', '🍯', '🍋'] }, { a: 'heat', label: '🍲 Tắt bếp đúng lúc' }] },
  { dish: 'tteokbokki', steps: [{ a: 'chop', label: '🔪 Cắt bánh gạo và chả cá' }, { a: 'pick', label: '🌶️ Cho sốt gochujang', pick: ['🌶️', '🧈', '🍫'] }, { a: 'stir', label: '🥢 Đảo đều cho sệt' }, { a: 'heat', label: '🔥 Rim lửa nhỏ' }] },
  { dish: 'bibimbap', steps: [{ a: 'chop', label: '🥕 Thái rau củ sợi' }, { a: 'heat', label: '🍳 Ốp trứng lòng đào' }, { a: 'pick', label: '🍚 Xếp topping lên cơm', pick: ['🥚', '🍓', '🍦'] }, { a: 'stir', label: '🥄 Trộn đều với tương ớt' }] },
  { dish: 'strawberry_cake', steps: [{ a: 'stir', label: '🥣 Đánh bông trứng và bột' }, { a: 'heat', label: '♨️ Nướng bánh vừa chín' }, { a: 'chop', label: '🍓 Bổ dâu tây' }, { a: 'pick', label: '🎂 Phủ lớp kem', pick: ['🍦', '🧂', '🧄'] }] },
  { dish: 'noodles', steps: [{ a: 'heat', label: '🔥 Đun sôi nước dùng' }, { a: 'chop', label: '🧅 Thái hành lá' }, { a: 'stir', label: '🍜 Trụng mì cho tơi' }, { a: 'pick', label: '🥚 Thêm topping', pick: ['🥚', '🍫', '🍬'] }] },
  { dish: 'pumpkin_pie', steps: [{ a: 'chop', label: '🎃 Cắt bí đỏ' }, { a: 'stir', label: '🥣 Nghiền bí với sữa' }, { a: 'pick', label: '🫙 Rắc gia vị', pick: ['🍯', '🌶️', '🧄'] }, { a: 'heat', label: '♨️ Nướng vàng mặt' }] },
];
const ACTION_HINT: Record<StepKind, string> = { chop: 'Bấm thật nhanh 10 lần!', stir: 'Bấm luân phiên ⟲ ⟳ 8 lần!', heat: 'Dừng kim ở vùng xanh!', pick: 'Chọn đúng nguyên liệu!' };

interface CookState { r: number; first: string; step: number; scores: number[]; tick: number }
function Cook(p: GP) {
  const [st, dispatch] = useReducer((s: CookState, m: Msg): CookState => {
    if (m.t === 'new') return { r: m.r, first: m.first, step: 0, scores: [], tick: 0 };
    if (m.t === 'tick') return m.i === s.step ? { ...s, tick: m.n } : s;
    if (m.t === 'done') return m.i === s.step ? { ...s, step: s.step + 1, scores: [...s.scores, m.score], tick: 0 } : s;
    return s;
  }, { r: -1, first: '', step: 0, scores: [], tick: 0 });
  const send = useGameChannel('cook', p.me.id, dispatch);
  const recipe = st.r >= 0 ? COOK[st.r] : null;
  const finished = !!recipe && st.step >= recipe.steps.length;
  const actor = (i: number) => (i % 2 === 0 ? st.first : st.first === p.me.id ? p.them : p.me.id);
  const stars = recipe ? st.scores.reduce((a, b) => a + b, 0) / recipe.steps.length : 0;

  useEffect(() => {
    if (!finished || !recipe) return;
    api.claim(`cook:${p.date}`, [{ id: recipe.dish, n: 1 }]).then(ok => {
      if (ok) { toast(`🍽️ Món ${item(recipe.dish).icon} ${item(recipe.dish).name} đã vào túi — mang ra nhà hàng ăn cùng nhau nhé!`); notify('inventory', 'collection'); }
    }, console.error);
    api.grantCoins(`coins:cook:${p.date}`, content.economy.cook).then(ok => ok && (toast(`🪙 Nấu ngon quá: +${content.economy.cook} xu`), notify('profiles')), console.error);
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!recipe) {
    return (
      <div className="gamebox">
        <p className="game-status">Hai bạn cùng nấu một món: mỗi người làm một công đoạn, thay phiên nhau. Nấu xong món đầu tiên mỗi ngày được mang món đó về túi.</p>
        <button className="btn" onClick={() => send('new', { r: Math.floor(Math.random() * COOK.length), first: p.me.id })}>🍳 Vào bếp — bạn làm công đoạn đầu</button>
      </div>
    );
  }
  const step = recipe.steps[st.step];
  const mine = !finished && actor(st.step) === p.me.id;

  return (
    <div className="gamebox cook">
      <p className="game-status">{item(recipe.dish).icon} {item(recipe.dish).name}</p>
      <ol className="cook-steps">
        {recipe.steps.map((x, i) => (
          <li key={i} className={i < st.step ? 'done' : i === st.step ? 'now' : ''}>
            {x.label} <small>· {actor(i) === p.me.id ? 'Bạn' : nameOf(p, p.them)}</small> {i < st.step && <b>{'⭐'.repeat(st.scores[i])}</b>}
          </li>
        ))}
      </ol>
      {finished ? (
        <>
          <p className="game-big">{stars >= 2.6 ? '😋 Ngon tuyệt cú mèo!' : stars >= 1.8 ? '🙂 Ngon lắm nha!' : '😅 Hơi khét… nhưng nấu cùng nhau là vui rồi!'}</p>
          <p className="game-status">{'⭐'.repeat(Math.round(stars))} · {stars.toFixed(1)} sao</p>
          <button className="btn small" onClick={() => send('new', { r: (st.r + 1) % COOK.length, first: st.first === p.me.id ? p.them || p.me.id : p.me.id })}>🍳 Nấu món khác</button>
        </>
      ) : mine ? (
        <CookStepPlay key={`${st.r}-${st.step}`} step={step} seed={`${st.r}-${st.step}`}
          onTick={n => send('tick', { i: st.step, n })} onDone={score => send('done', { i: st.step, score })} />
      ) : (
        <p className="game-status">👀 {nameOf(p, actor(st.step))} đang {step.label.slice(2).toLowerCase()}… {st.tick > 0 && `(${st.tick})`}</p>
      )}
    </div>
  );
}

function CookStepPlay({ step, seed, onTick, onDone }: { step: CookStep; seed: string; onTick: (n: number) => void; onDone: (score: number) => void }) {
  const t0 = useRef(Date.now());
  const [n, setN] = useState(0);
  const [last, setLast] = useState<'l' | 'r' | null>(null);
  const [needle, setNeedle] = useState(0);
  const done = useRef(false);
  const finish = (score: number) => { if (!done.current) { done.current = true; onDone(score); } };
  const bySpeed = (ms: number, a: number, b: number) => (ms < a ? 3 : ms < b ? 2 : 1);
  useEffect(() => {
    if (step.a !== 'heat') return;
    let raf = 0;
    const loop = () => { setNeedle((Math.sin((Date.now() - t0.current) / 380) + 1) / 2); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [step.a]);
  const options = useMemo(() => {
    if (!step.pick) return [];
    const r = seeded(seed);
    return [...step.pick].sort(() => r() - 0.5);
  }, [step.pick, seed]);

  const tap = (side?: 'l' | 'r') => {
    if (step.a === 'stir' && side === last) return;
    setLast(side ?? null);
    const k = n + 1;
    setN(k);
    onTick(k);
    const need = step.a === 'chop' ? 10 : 8;
    if (k >= need) finish(bySpeed(Date.now() - t0.current, step.a === 'chop' ? 2600 : 3200, 4800));
  };
  return (
    <div className="cook-play">
      <p className="game-status">Tới lượt bạn: <b>{step.label}</b> — {ACTION_HINT[step.a]}</p>
      {step.a === 'chop' && <button className="btn cook-big" onClick={() => tap()}>🔪 Thái! ({n}/10)</button>}
      {step.a === 'stir' && (
        <div className="row center">
          <button className="btn cook-big" disabled={last === 'l'} onClick={() => tap('l')}>⟲</button>
          <span className="game-status">{n}/8</span>
          <button className="btn cook-big" disabled={last === 'r'} onClick={() => tap('r')}>⟳</button>
        </div>
      )}
      {step.a === 'heat' && (
        <>
          <div className="heat-gauge"><b /><i style={{ left: `${needle * 100}%` }} /></div>
          <button className="btn cook-big" onClick={() => { const d = Math.abs(needle - 0.7); finish(d < 0.06 ? 3 : d < 0.14 ? 2 : 1); }}>✋ Dừng!</button>
        </>
      )}
      {step.a === 'pick' && (
        <div className="row center">
          {options.map(o => <button key={o} className="btn cook-big" onClick={() => finish(o === step.pick![0] ? bySpeed(Date.now() - t0.current, 2500, 5000) : 1)}>{o}</button>)}
        </div>
      )}
    </div>
  );
}
