// Trò chơi đôi mới: Cậu hiểu tớ bao nhiêu, Câu cá thi, Ghép tranh cùng nhau, Khiêu vũ đôi, Xây lâu đài cát.
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as api from '../lib/api';
import { cityKind, citySprite } from '../lib/places';
import { makeSprite, type Sprite } from '../lib/pixel';
import { notify } from '../lib/realtime';
import { seeded } from '../lib/rng';
import { characterSprite } from '../lib/sprites';
import { toast, toastError } from '../lib/toast';
import { nameOf, reward, useGameChannel, type GP, type Msg } from './gameKit';

const pair = (p: GP) => [p.me.id, p.them].sort();

// ───────── Cậu hiểu tớ bao nhiêu ─────────
// Mỗi câu một người trả lời thật về mình, người kia đoán. Đổi vai mỗi câu, 6 câu một ván, điểm chung của cả hai.

const QUIZ: { q: string; o: string[] }[] = [
  { q: 'Món ăn tớ thích nhất?', o: ['Lẩu 🍲', 'Gà rán 🍗', 'Phở / bún 🍜', 'Sushi 🍣'] },
  { q: 'Đồ uống tớ hay gọi nhất?', o: ['Trà sữa 🧋', 'Cà phê ☕', 'Nước ép 🧃', 'Trà đào 🍑'] },
  { q: 'Được nghỉ một ngày, tớ sẽ…', o: ['Ngủ nướng tới trưa 😴', 'Đi chơi xa 🚗', 'Cày phim 🎬', 'Đi ăn khắp nơi 🍜'] },
  { q: 'Tớ sợ nhất cái gì?', o: ['Gián 🪳', 'Ma 👻', 'Độ cao 🏔️', 'Bị cậu giận 🥺'] },
  { q: 'Mùa tớ thích nhất?', o: ['Xuân 🌸', 'Hạ ☀️', 'Thu 🍂', 'Đông ❄️'] },
  { q: 'Kiểu hẹn hò tớ thích?', o: ['Đi ăn ngon 🍽️', 'Xem phim 🍿', 'Dạo phố 🚶', 'Ở nhà ôm nhau 🛋️'] },
  { q: 'Khi buồn, tớ thường…', o: ['Im lặng một mình 🌧️', 'Ăn thật nhiều 🍰', 'Gọi cho cậu 📞', 'Đi ngủ sớm 🛌'] },
  { q: 'Tớ muốn nuôi con gì nhất?', o: ['Mèo 🐱', 'Chó 🐶', 'Thỏ 🐰', 'Cá 🐟'] },
  { q: 'Thể loại phim tớ mê?', o: ['Tình cảm 💕', 'Hành động 💥', 'Kinh dị 😱', 'Hoạt hình 🧸'] },
  { q: 'Bữa sáng lý tưởng của tớ?', o: ['Bánh mì 🥖', 'Xôi / cơm 🍚', 'Bỏ bữa luôn 🙈', 'Ngũ cốc + sữa 🥣'] },
  { q: 'Đi du lịch, tớ thích…', o: ['Biển 🏖️', 'Núi ⛰️', 'Thành phố lớn 🏙️', 'Làng quê yên bình 🌾'] },
  { q: 'Quà tớ thích nhận nhất?', o: ['Thư tay 💌', 'Đồ ăn 🍫', 'Quần áo 👗', 'Một chuyến đi ✈️'] },
  { q: 'Điều tớ để ý đầu tiên ở cậu?', o: ['Nụ cười 😊', 'Đôi mắt 👀', 'Giọng nói 🎵', 'Sự tử tế 🤍'] },
  { q: 'Siêu năng lực tớ muốn có?', o: ['Dịch chuyển tức thời 🌀', 'Bay 🕊️', 'Đọc suy nghĩ 🧠', 'Ngừng thời gian ⏸️'] },
  { q: 'Tớ thấy được yêu nhất khi…', o: ['Được khen 💬', 'Được ôm 🤗', 'Được tặng quà 🎁', 'Được dành thời gian ⏰'] },
  { q: 'Tớ thường ngủ lúc mấy giờ?', o: ['Trước 11h 🌙', '11h – 1h 🦉', 'Sau 1h 🌌', 'Tùy hứng 🎲'] },
  { q: 'Giận nhau, tớ muốn cậu…', o: ['Dỗ ngay 🥹', 'Để tớ bình tĩnh 🧊', 'Mua đồ ăn 🍰', 'Ôm thật chặt 🤗'] },
  { q: 'Màu tớ thích nhất?', o: ['Hồng 🩷', 'Xanh dương 💙', 'Đen ⚫', 'Trắng 🤍'] },
  { q: 'Tớ có thể ăn mãi không chán?', o: ['Mì cay 🌶️', 'Kem 🍦', 'Tteokbokki 🍢', 'Bánh ngọt 🍰'] },
  { q: 'Ước mơ hai đứa làm cùng?', o: ['Đi vòng quanh thế giới 🌍', 'Có nhà riêng 🏡', 'Nuôi một bé mèo 🐈', 'Mở quán nhỏ ☕'] },
  { q: 'Tớ thích được gọi là…', o: ['Bé 🍼', 'Cục cưng 🧸', 'Tên thật 📛', 'Vợ / chồng 💍'] },
  { q: 'Cuối tuần lý tưởng của tớ?', o: ['Cafe sách ☕', 'Đi chợ, nấu ăn 🛒', 'Leo núi / thể thao 🏃', 'Gọi video với cậu cả ngày 📱'] },
  { q: 'Tớ dở nhất cái gì?', o: ['Dậy sớm ⏰', 'Nấu ăn 🍳', 'Nhớ đường 🗺️', 'Giấu cảm xúc 🫣'] },
  { q: 'Gặp nhau lần tới, tớ muốn làm gì đầu tiên?', o: ['Ôm thật lâu 🤗', 'Đi ăn ngay 🍜', 'Chụp thật nhiều ảnh 📸', 'Nắm tay đi dạo 🚶'] },
];
const QN = 6;
interface QuizState { seed: number; i: number; picks: Record<number, Record<string, number>> }

export function Quiz(p: GP) {
  const [st, dispatch] = useReducer((s: QuizState, m: Msg): QuizState => {
    if (m.t === 'new') return { seed: m.seed, i: 0, picks: {} };
    if (m.t === 'pick') {
      if (m.i !== s.i || s.picks[s.i]?.[m.by] !== undefined) return s;
      return { ...s, picks: { ...s.picks, [s.i]: { ...s.picks[s.i], [m.by]: m.opt } } };
    }
    if (m.t === 'next') return m.i === s.i ? { ...s, i: s.i + 1 } : s;
    return s;
  }, { seed: 0, i: 0, picks: {} });
  const send = useGameChannel('quiz', p.me.id, dispatch);
  const order = useMemo(() => {
    const r = seeded(`quiz:${st.seed}`), ix = QUIZ.map((_, i) => i);
    for (let i = ix.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ix[i], ix[j]] = [ix[j], ix[i]]; }
    return ix.slice(0, QN);
  }, [st.seed]);
  const ids = pair(p);
  const score = useMemo(() => Object.entries(st.picks).filter(([i, pk]) => Number(i) < st.i && pk[ids[0]] !== undefined && pk[ids[0]] === pk[ids[1]]).length, [st, ids]);
  const done = st.seed > 0 && st.i >= QN;
  useEffect(() => { if (done) reward('quiz', p.date); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!st.seed) return (
    <div className="gamebox">
      <p className="game-status">Mỗi câu, một người trả lời thật về mình, người kia đoán. {QN} câu, đổi vai liên tục.</p>
      <button className="btn" onClick={() => send('new', { seed: Date.now() })}>💞 Bắt đầu</button>
    </div>
  );
  if (done) {
    const pct = Math.round((score / QN) * 100);
    return (
      <div className="gamebox">
        <p className="game-big">💞 Hiểu nhau {pct}%</p>
        <p className="game-status">{pct >= 80 ? 'Đúng là tri kỷ! Nói gì cũng đoán ra 🥰' : pct >= 50 ? 'Khá lắm, còn vài bí mật để khám phá 😉' : 'Có nhiều điều mới để kể cho nhau nghe rồi 🤭'}</p>
        <button className="btn" onClick={() => send('new', { seed: Date.now() })}>🔄 Ván mới (câu khác)</button>
      </div>
    );
  }
  const q = QUIZ[order[st.i]];
  const subject = ids[st.i % 2], iAmSubject = subject === p.me.id;
  const cur = st.picks[st.i] ?? {};
  const mine = cur[p.me.id], both = cur[ids[0]] !== undefined && cur[ids[1]] !== undefined;
  const match = both && cur[ids[0]] === cur[ids[1]];
  return (
    <div className="gamebox">
      <p className="game-status">Câu {st.i + 1}/{QN} · Đúng {score} câu</p>
      <p className="quiz-q">{iAmSubject ? `Trả lời thật nhé: ${q.q}` : `Đoán xem ${nameOf(p, subject)} chọn gì: ${q.q.replace(/tớ/g, nameOf(p, subject)).replace('Tớ', nameOf(p, subject))}`}</p>
      <div className="quiz-opts">
        {q.o.map((o, k) => {
          const cls = both ? (k === cur[subject] ? 'truth' : k === cur[ids.find(x => x !== subject)!] ? 'wrong' : '') : mine === k ? 'picked' : '';
          return <button key={k} className={`btn quiz-opt ${cls}`} disabled={mine !== undefined} onClick={() => send('pick', { i: st.i, opt: k })}>{o}</button>;
        })}
      </div>
      <p className="game-status">
        {both ? (match ? '🎯 Đoán trúng! Hiểu nhau ghê 💞' : '🙈 Trật rồi, giờ thì biết rồi nhé!')
          : mine !== undefined ? `Chờ ${nameOf(p, p.them)}…` : cur[p.them] !== undefined ? `${nameOf(p, p.them)} chọn xong rồi, tới bạn!` : ''}
      </p>
      {both && <button className="btn" onClick={() => send('next', { i: st.i })}>{st.i + 1 >= QN ? '🏁 Xem kết quả' : '➡️ Câu tiếp'}</button>}
    </div>
  );
}

// ───────── Câu cá thi: 45 giây, ai kéo được nhiều kg cá hơn ─────────

const RACE_MS = 45_000;
const FISHES: { icon: string; name: string; kg: [number, number] }[] = [
  { icon: '🐟', name: 'Cá nhỏ', kg: [0.3, 1.2] }, { icon: '🐠', name: 'Cá vàng', kg: [0.5, 1.6] },
  { icon: '🐡', name: 'Cá nóc', kg: [1, 2.5] }, { icon: '🦑', name: 'Mực', kg: [1.2, 3] }, { icon: '🐙', name: 'Bạch tuộc', kg: [2, 4] },
  { icon: '🦈', name: 'Cá mập con', kg: [4, 8] }, { icon: '👢', name: 'Chiếc ủng cũ', kg: [0.1, 0.2] },
];
interface RaceState { at: number; got: Record<string, { icon: string; kg: number }[]> }

export function FishRace(p: GP) {
  const [st, dispatch] = useReducer((s: RaceState, m: Msg): RaceState => {
    if (m.t === 'new') return { at: m.at, got: {} };
    if (m.t === 'catch' && s.at && m.ts <= s.at + RACE_MS + 500) return { ...s, got: { ...s.got, [m.by]: [...(s.got[m.by] ?? []), { icon: m.icon, kg: m.kg }] } };
    return s;
  }, { at: 0, got: {} });
  const send = useGameChannel('fishrace', p.me.id, dispatch);
  const [now, setNow] = useState(Date.now());
  const [rod, setRod] = useState<'wait' | 'bite' | 'scare'>('wait');
  const biteAt = useRef(0);
  const running = st.at > 0 && now >= st.at && now < st.at + RACE_MS;
  const over = st.at > 0 && now >= st.at + RACE_MS;
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 100); return () => clearInterval(t); }, []);
  // Phao: chờ 1–3,5 giây thì cá cắn, cắn trong 0,9 giây rồi chạy mất
  useEffect(() => {
    if (!running) return;
    if (rod === 'wait') { const t = setTimeout(() => { biteAt.current = Date.now(); setRod('bite'); }, 1000 + Math.random() * 2500); return () => clearTimeout(t); }
    if (rod === 'bite') { const t = setTimeout(() => setRod('wait'), 900); return () => clearTimeout(t); }
    const t = setTimeout(() => setRod('wait'), 1300); return () => clearTimeout(t);
  }, [rod, running]);
  const total = (id: string) => (st.got[id] ?? []).reduce((a, f) => a + f.kg, 0);
  const mine = total(p.me.id), theirs = total(p.them);
  useEffect(() => { if (over) reward('fishrace', p.date); }, [over]); // eslint-disable-line react-hooks/exhaustive-deps
  const pull = () => {
    if (!running) return;
    if (rod !== 'bite') { setRod('scare'); return; }
    const quick = Date.now() - biteAt.current < 400;                 // kéo nhanh dễ được cá to
    const pool = quick ? FISHES.slice(2) : FISHES;
    const f = pool[Math.floor(Math.random() * pool.length)];
    const kg = Math.round((f.kg[0] + Math.random() * (f.kg[1] - f.kg[0])) * 10) / 10;
    send('catch', { icon: f.icon, kg, ts: Date.now() });
    setRod('wait');
  };
  const max = Math.max(mine, theirs, 5);
  return (
    <div className="gamebox">
      {!st.at ? <p className="game-status">Cùng thả câu 45 giây. Phao giật thì bấm Kéo thật nhanh — kéo càng nhanh càng dễ dính cá to!</p>
        : now < st.at ? <p className="game-big">Chuẩn bị… {Math.ceil((st.at - now) / 1000)}</p>
          : <p className="game-status">⏱️ {over ? 'Hết giờ!' : `${Math.ceil((st.at + RACE_MS - now) / 1000)} giây`}</p>}
      <div className="race-bars">
        {[[p.me.id, 'Bạn', mine], [p.them, nameOf(p, p.them), theirs]].map(([id, n, kg]) => (
          <div key={id as string} className="race-row">
            <span>{n as string}</span>
            <i style={{ width: `${((kg as number) / max) * 100}%` }} />
            <b>{(kg as number).toFixed(1)} kg {(st.got[id as string] ?? []).slice(-3).map(f => f.icon).join('')}</b>
          </div>
        ))}
      </div>
      {running && (
        <div className={`race-pond ${rod}`} onClick={pull}>
          <span className="race-bob">{rod === 'bite' ? '❗' : '🎈'}</span>
          <small>{rod === 'bite' ? 'KÉO!' : rod === 'scare' ? 'Kéo sớm quá, cá sợ chạy mất 💨' : 'Chờ phao giật…'}</small>
        </div>
      )}
      {running && <button className={`btn ${rod === 'bite' ? 'pull' : ''}`} onClick={pull}>🎣 Kéo!</button>}
      {over && <p className="game-big">{mine === theirs ? '🤝 Hòa nhau!' : mine > theirs ? '🏆 Bạn thắng!' : `🏆 ${nameOf(p, p.them)} thắng!`}</p>}
      {!running && <button className="btn" onClick={() => send('new', { at: Date.now() + 3000 })}>{st.at ? '🔄 Thi lại' : '🏁 Bắt đầu thi'}</button>}
    </div>
  );
}

// ───────── Ghép tranh cùng nhau: tranh thành phố của hai bạn bị xáo, hai người cùng đổi chỗ các mảnh ─────────

const PZ = 4;
interface PuzState { seed: number; pic: 0 | 1; order: number[]; moves: number; sel: Record<string, number | null> }
const solved = (o: number[]) => o.length > 0 && o.every((t, i) => t === i);

export function Puzzle(p: GP) {
  const stRef = useRef<PuzState | null>(null);
  const [st, dispatch] = useReducer((s: PuzState, m: Msg): PuzState => {
    if (m.t === 'state' && m.by !== p.me.id && !s.seed) return m.st;
    if (m.t === 'new') {
      const r = seeded(`pz:${m.seed}`), order = Array.from({ length: PZ * PZ }, (_, i) => i);
      do { for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } } while (solved(order));
      return { seed: m.seed, pic: m.pic, order, moves: 0, sel: {} };
    }
    if (m.t === 'sel') return { ...s, sel: { ...s.sel, [m.by]: m.i } };
    if (m.t === 'swap') {
      if (solved(s.order)) return s;
      const order = [...s.order];[order[m.a], order[m.b]] = [order[m.b], order[m.a]];
      return { ...s, order, moves: s.moves + 1, sel: { ...s.sel, [m.by]: null } };
    }
    return s;
  }, { seed: 0, pic: 0, order: [], moves: 0, sel: {} });
  stRef.current = st;
  const send = useGameChannel('puzzle', p.me.id, m => {
    if (m.t === 'hello' && m.by !== p.me.id && stRef.current?.seed) send('state', { st: stRef.current });
    dispatch(m);
  });
  useEffect(() => { send('hello'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const who = st.pic === 0 ? p.me : p.partner ?? p.me;
  const picUrl = useMemo(() => citySprite(cityKind(who.city), 'sunset', who.city ?? who.id).url, [who.city, who.id]);
  const done = solved(st.order);
  useEffect(() => { if (done) reward('puzzle', p.date); }, [done]); // eslint-disable-line react-hooks/exhaustive-deps
  const tap = (i: number) => {
    if (done) return;
    const cur = st.sel[p.me.id];
    if (cur === null || cur === undefined) send('sel', { i });
    else if (cur === i) send('sel', { i: null });
    else send('swap', { a: cur, b: i });
  };
  const right = st.order.filter((t, i) => t === i).length;
  return (
    <div className="gamebox">
      <p className="game-status">
        {!st.seed ? 'Cùng ghép lại bức tranh thành phố của hai bạn. Chạm một mảnh rồi chạm mảnh khác để đổi chỗ — hai người làm cùng lúc được!'
          : done ? `🎉 Xong rồi! ${st.moves} lần đổi chỗ` : `Đúng chỗ ${right}/${PZ * PZ} · ${st.moves} lần đổi`}
      </p>
      {st.seed > 0 && (
        <div className={`puzzle ${done ? 'done' : ''}`}>
          {st.order.map((t, i) => (
            <button key={i} className={`pz-tile ${st.sel[p.me.id] === i ? 'mine' : ''} ${st.sel[p.them] === i ? 'theirs' : ''} ${t === i ? 'ok' : ''}`}
              style={{ backgroundImage: `url(${picUrl})`, backgroundPosition: `${((t % PZ) / (PZ - 1)) * 100}% ${(Math.floor(t / PZ) / (PZ - 1)) * 100}%` }}
              onClick={() => tap(i)} aria-label={`Mảnh ${i + 1}`} />
          ))}
        </div>
      )}
      {st.seed > 0 && <p className="muted small-note">Viền hồng: mảnh bạn đang cầm · viền xanh: mảnh {nameOf(p, p.them)} đang cầm</p>}
      <div className="row center">
        <button className="btn small" onClick={() => send('new', { seed: Date.now(), pic: 0 })}>🏙️ Tranh {p.me.city || 'thành phố bạn'}</button>
        {p.partner && <button className="btn small" onClick={() => send('new', { seed: Date.now(), pic: 1 })}>🌆 Tranh {p.partner.city || 'thành phố người ấy'}</button>}
      </div>
    </div>
  );
}

// ───────── Khiêu vũ đôi: bấm đúng nhịp mũi tên, cùng trúng một nhịp là "đồng điệu" ─────────

const BEATS = 24, BEAT_MS = 700, WINDOW = 220;
const DIRS = [{ k: 'ArrowLeft', icon: '⬅️' }, { k: 'ArrowUp', icon: '⬆️' }, { k: 'ArrowDown', icon: '⬇️' }, { k: 'ArrowRight', icon: '➡️' }];
interface DanceState { at: number; seed: number; hits: Record<string, number[]> }

export function Dance(p: GP) {
  const [st, dispatch] = useReducer((s: DanceState, m: Msg): DanceState => {
    if (m.t === 'new') return { at: m.at, seed: m.seed, hits: {} };
    if (m.t === 'hit') return (s.hits[m.by] ?? []).includes(m.k) ? s : { ...s, hits: { ...s.hits, [m.by]: [...(s.hits[m.by] ?? []), m.k] } };
    return s;
  }, { at: 0, seed: 0, hits: {} });
  const send = useGameChannel('dance', p.me.id, dispatch);
  const seq = useMemo(() => { const r = seeded(`dance:${st.seed}`); return Array.from({ length: BEATS }, () => Math.floor(r() * 4)); }, [st.seed]);
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const [hop, setHop] = useState<Record<string, number>>({});
  useEffect(() => { let raf = 0; const loop = () => { setNow(Date.now()); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf); }, []);
  const beatTime = (k: number) => st.at + k * BEAT_MS;
  const end = st.at + BEATS * BEAT_MS + 600;
  const running = st.at > 0 && now >= st.at - 200 && now < end;
  const over = st.at > 0 && now >= end;
  const mine = st.hits[p.me.id] ?? [], theirs = st.hits[p.them] ?? [];
  const sync = mine.filter(k => theirs.includes(k)).length;
  useEffect(() => { if (over) reward('dance', p.date); }, [over]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const last = theirs[theirs.length - 1]; if (last !== undefined) setHop(h => ({ ...h, them: Date.now() })); }, [theirs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const press = (d: number) => {
    if (!running) return;
    const t = Date.now();
    const k = Math.round((t - st.at) / BEAT_MS);
    const ok = k >= 0 && k < BEATS && Math.abs(t - beatTime(k)) <= WINDOW && seq[k] === d && !mine.includes(k);
    setFlash(ok ? 'hit' : 'miss'); setTimeout(() => setFlash(null), 180);
    if (ok) { send('hit', { k }); setHop(h => ({ ...h, me: Date.now() })); }
  };
  const pressRef = useRef(press); pressRef.current = press;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { const d = DIRS.findIndex(x => x.k === e.key); if (d >= 0) { e.preventDefault(); pressRef.current(d); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dancer = (look: api.Profile['avatar'], key: 'me' | 'them') => {
    const sp = characterSprite(look ?? {}, 'idle', undefined, 'front', 0);
    return <img src={sp.url} alt="" className={`dancer ${now - (hop[key] ?? 0) < 250 ? 'hop' : ''}`} style={{ width: sp.w * 4, height: sp.h * 4 }} />;
  };
  return (
    <div className="gamebox">
      <div className="dance-floor">
        {dancer(p.me.avatar, 'me')}
        <div className="dance-mid">{sync > 0 && <b>💞 {sync}</b>}</div>
        {p.partner && dancer(p.partner.avatar, 'them')}
      </div>
      {st.at > 0 && now < st.at && <p className="game-big">Vào nhịp… {Math.ceil((st.at - now) / 1000)}</p>}
      {running && (
        <div className={`dance-track ${flash ?? ''}`}>
          <div className="dance-zone" />
          {seq.map((d, k) => {
            const dt = beatTime(k) - now;
            if (dt < -400 || dt > 3000) return null;
            const done2 = mine.includes(k), both = done2 && theirs.includes(k);
            return <span key={k} className={`dance-note ${done2 ? 'hit' : ''} ${both ? 'both' : ''}`} style={{ left: `calc(12% + ${(dt / 3000) * 85}%)` }}>{DIRS[d].icon}</span>;
          })}
        </div>
      )}
      {running && <div className="dance-pad">{DIRS.map((d, i) => <button key={d.k} className="btn" onPointerDown={e => { e.preventDefault(); press(i); }}>{d.icon}</button>)}</div>}
      {over && (
        <>
          <p className="game-big">💃🕺 Đồng điệu {sync}/{BEATS}</p>
          <p className="game-status">Bạn trúng {mine.length} · {nameOf(p, p.them)} trúng {theirs.length} · {sync >= 18 ? 'Cặp đôi sàn nhảy! 🔥' : sync >= 10 ? 'Ăn ý ghê 💞' : 'Tập thêm vài lần nữa nhé 😆'}</p>
        </>
      )}
      {!running && <button className="btn" onClick={() => send('new', { at: Date.now() + 3000, seed: Date.now() })}>{st.at ? '🔄 Nhảy bài khác' : '🎶 Bắt đầu nhảy'}</button>}
      {!st.at && <p className="muted small-note">Mũi tên chạy từ phải sang, tới vòng tròn thì bấm đúng hướng (máy tính bấm phím mũi tên). Cả hai cùng trúng một nhịp = 💞 đồng điệu.</p>}
    </div>
  );
}

// ───────── Xây lâu đài cát cùng nhau ─────────

const CW = 10, CH = 7;
const SAND = '#f2d9a6', SAND_D = '#d9b57a';
function piece(k: string): Sprite {
  return makeSprite(`castle:${k}`, 12, 12, p => {
    switch (k) {
      case 'tower': p.rect(2, 3, 8, 9, SAND); p.rect(2, 1, 2, 2, SAND); p.rect(5, 1, 2, 2, SAND); p.rect(8, 1, 2, 2, SAND); p.rect(5, 6, 2, 3, '#8a6a4a'); p.rect(8, 4, 2, 8, SAND_D); break;
      case 'wall': p.rect(0, 5, 12, 7, SAND); p.rect(0, 3, 3, 2, SAND); p.rect(5, 3, 3, 2, SAND); p.rect(10, 3, 2, 2, SAND); p.rect(0, 8, 12, 1, SAND_D); break;
      case 'gate': p.rect(1, 2, 10, 10, SAND); p.rect(4, 6, 4, 6, '#6a4a3a'); p.rect(5, 5, 2, 1, '#6a4a3a'); p.rect(1, 0, 2, 2, SAND); p.rect(9, 0, 2, 2, SAND); break;
      case 'moat': p.rect(0, 0, 12, 12, '#7cc8e8'); p.rect(2, 3, 4, 1, '#c8f0ff'); p.rect(6, 8, 4, 1, '#c8f0ff'); break;
      case 'flag': p.rect(5, 1, 1, 11, '#8a5a3c'); p.rect(6, 1, 5, 4, '#f06283'); p.rect(3, 10, 6, 2, SAND); break;
      case 'shell': p.map(['....PP....', '..PPWPP...', '.PPWPPWP..', 'PPWPPWPPP.', 'PPPPPPPPP.', '.PPPPPPP..', '..PPPPP...'], { P: '#f7a1b8', W: '#ffd8e4' }, 1, 3); break;
      case 'star': p.map(['....O....', '...OOO...', 'OOOOOOOOO', '.OOOOOOO.', '..OOOOO..', '.OO...OO.', 'OO.....OO'], { O: '#f2863a' }, 1, 2); break;
      case 'crab': p.map(['R..R.R..R', '.RR...RR.', '..RRRRR..', '.RRWRWRR.', 'RRRRRRRRR', '.R.R.R.R.'], { R: '#e8505b', W: '#ffffff' }, 1, 3); break;
    }
  }, k === 'moat' ? null : '#8a6a4a');
}
const TOOLS = [
  { k: 'tower', name: 'Tháp' }, { k: 'wall', name: 'Tường' }, { k: 'gate', name: 'Cổng' }, { k: 'moat', name: 'Hào nước' },
  { k: 'flag', name: 'Cờ' }, { k: 'shell', name: 'Vỏ sò' }, { k: 'star', name: 'Sao biển' }, { k: 'crab', name: 'Cua' }, { k: '', name: 'Xóa' },
];
interface CastleState { cells: Record<number, string>; started: boolean }

export function Castle(p: GP) {
  const stRef = useRef<CastleState | null>(null);
  const [st, dispatch] = useReducer((s: CastleState, m: Msg): CastleState => {
    if (m.t === 'state' && m.by !== p.me.id && !s.started) return m.st;
    if (m.t === 'put') { const cells = { ...s.cells }; if (m.k) cells[m.i] = m.k; else delete cells[m.i]; return { cells, started: true }; }
    if (m.t === 'clear') return { cells: {}, started: true };
    return s;
  }, { cells: {}, started: false });
  stRef.current = st;
  const send = useGameChannel('castle', p.me.id, m => {
    if (m.t === 'hello' && m.by !== p.me.id && stRef.current?.started) send('state', { st: stRef.current });
    dispatch(m);
  });
  useEffect(() => { send('hello'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [tool, setTool] = useState('tower');
  const [saving, setSaving] = useState(false);
  const painting = useRef(false);
  const put = (i: number) => { if ((st.cells[i] ?? '') !== tool) send('put', { i, k: tool }); };
  const count = Object.keys(st.cells).length;

  async function save() {
    setSaving(true);
    try {
      const S = 24, c = document.createElement('canvas');
      c.width = CW * S; c.height = CH * S + 20;
      const g = c.getContext('2d')!;
      g.fillStyle = SAND; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#7cc8e8'; g.fillRect(0, CH * S, c.width, 20);
      g.imageSmoothingEnabled = false;
      const imgs = await Promise.all(Object.entries(st.cells).map(([i, k]) => new Promise<[number, HTMLImageElement]>(res => { const im = new Image(); im.onload = () => res([Number(i), im]); im.src = piece(k).url; })));
      for (const [i, im] of imgs) g.drawImage(im, (i % CW) * S, Math.floor(i / CW) * S, S, S);
      await api.addPhoto(p.me, 'beach', '🏰 Lâu đài cát hai đứa xây', c.toDataURL('image/jpeg', 0.9));
      notify('photos');
      toast('📸 Đã lưu lâu đài vào album!');
    } catch (e) { toastError(e); }
    setSaving(false);
  }

  useEffect(() => { if (count >= 15) reward('castle', p.date); }, [count >= 15]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="gamebox">
      <p className="game-status">Hai bạn cùng xây trên một bãi cát — chạm hoặc kéo để đặt. {count >= 15 ? '🏰 Lâu đài đẹp quá!' : `Đặt ${count}/15 món để nhận thưởng`}</p>
      <div className="castle-grid" onPointerUp={() => { painting.current = false; }} onPointerLeave={() => { painting.current = false; }}>
        {Array.from({ length: CW * CH }, (_, i) => {
          const k = st.cells[i];
          return (
            <button key={i} className="castle-cell" onPointerDown={e => { e.preventDefault(); painting.current = true; put(i); }} onPointerEnter={() => painting.current && put(i)} aria-label={`Ô ${i + 1}`}>
              {k && <img src={piece(k).url} alt="" />}
            </button>
          );
        })}
      </div>
      <div className="castle-tools">
        {TOOLS.map(t => (
          <button key={t.k} className={`chip ${tool === t.k ? 'active' : ''}`} onClick={() => setTool(t.k)}>
            {t.k ? <img src={piece(t.k).url} alt="" /> : '🧽'} {t.name}
          </button>
        ))}
      </div>
      <div className="row center">
        <button className="btn small" disabled={saving || count === 0} onClick={save}>📸 Lưu vào album</button>
        <button className="btn small ghost" onClick={() => send('clear')}>🌊 Sóng cuốn sạch</button>
      </div>
    </div>
  );
}

// ───────── Cùng học / làm việc: hẹn giờ Pomodoro chung, hai bạn cùng tập trung rồi cùng nghỉ ─────────

interface FocusState { at: number; mins: number; mode: 'focus' | 'break' | null; rounds: number }

export function Focus(p: GP) {
  const stRef = useRef<FocusState | null>(null);
  const [st, dispatch] = useReducer((s: FocusState, m: Msg): FocusState => {
    if (m.t === 'state' && m.by !== p.me.id && !s.mode) return m.st;
    if (m.t === 'start') return { at: m.at, mins: m.mins, mode: m.mode, rounds: s.rounds + (m.mode === 'break' ? 1 : 0) };
    if (m.t === 'stop') return { ...s, mode: null };
    return s;
  }, { at: 0, mins: 25, mode: null, rounds: 0 });
  stRef.current = st;
  const send = useGameChannel('focus', p.me.id, m => {
    if (m.t === 'hello' && m.by !== p.me.id && stRef.current?.mode) send('state', { st: stRef.current });
    dispatch(m);
  });
  useEffect(() => { send('hello'); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  const left = st.mode ? st.at + st.mins * 60_000 - now : 0;
  const finished = !!st.mode && left <= 0;
  useEffect(() => {
    if (!finished) return;
    if (st.mode === 'focus') {
      toast('🎉 Xong một phiên tập trung! Nghỉ 5 phút nào');
      api.grantCoins(`coins:focus:${st.at}`, 40).then(ok => { if (ok) { toast('🪙 +40 xu vì chăm chỉ'); notify('profiles'); } }, console.error);
      reward('focus', p.date);
    } else toast('⏰ Hết giờ nghỉ, vào phiên mới nhé!');
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps
  const mm = Math.max(0, Math.floor(left / 60000)), ss = Math.max(0, Math.floor((left % 60000) / 1000));
  const desk = (look: api.Profile['avatar']) => {
    const sp = characterSprite(look ?? {}, 'sit', st.mode === 'focus' && !finished ? { spec: { kind: 'book', color: '#8db8ef' }, mode: 'read', phase: 0 } : undefined);
    return <img src={sp.url} alt="" style={{ width: sp.w * 4, height: sp.h * 4, imageRendering: 'pixelated' }} />;
  };
  return (
    <div className="gamebox">
      <div className={`focus-desk ${st.mode ?? ''}`}>
        {desk(p.me.avatar)}
        <div className="focus-clock">
          <b>{st.mode ? (finished ? (st.mode === 'focus' ? '☕' : '📚') : `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`) : '📚'}</b>
          <small>{st.mode === 'focus' ? (finished ? 'Xong rồi!' : 'Đang tập trung') : st.mode === 'break' ? (finished ? 'Hết giờ nghỉ' : 'Đang nghỉ') : 'Cùng học nhé'}</small>
        </div>
        {p.partner && desk(p.partner.avatar)}
      </div>
      <p className="game-status">{st.rounds ? `Hai bạn đã xong ${st.rounds} phiên hôm nay 💪` : 'Cùng bật giờ, mỗi người làm việc của mình, hết giờ cùng nghỉ. Mỗi phiên xong được +40 xu.'}</p>
      <div className="row center wrap">
        {(!st.mode || finished) && <>
          <button className="btn" onClick={() => send('start', { at: Date.now(), mins: 25, mode: 'focus' })}>📚 Tập trung 25 phút</button>
          <button className="btn ghost" onClick={() => send('start', { at: Date.now(), mins: 50, mode: 'focus' })}>📚 50 phút</button>
          {finished && st.mode === 'focus' && <button className="btn ghost" onClick={() => send('start', { at: Date.now(), mins: 5, mode: 'break' })}>☕ Nghỉ 5 phút</button>}
        </>}
        {st.mode && !finished && <button className="btn small ghost" onClick={() => send('stop')}>⏹️ Dừng</button>}
      </div>
      <p className="muted small-note">Mẹo: bật mic để nghe tiếng nhau gõ phím như đang ngồi cạnh nhau ở thư viện 🤫</p>
    </div>
  );
}
