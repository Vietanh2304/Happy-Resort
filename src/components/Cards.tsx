// 🃏 Đánh bài hai người: Sâm lốc (10 lá) hoặc 🤥 Nói dối (J Q K A + Joker). Ai thua bị búng tai:
// người thắng bấm "Búng!", nhân vật người thua trong làng kêu "Á đau!".
import { useEffect, useReducer, useState } from 'react';
import { classify, dealLiar, dealSam, JOKER, KIND_NAME, label, liarCall, liarPlay, mustCall, passSam, playSam, red, type LCard, type Liar, type Sam } from '../lib/cards';
import { nameOf, reward, useGameChannel, type GP, type Msg } from './gameKit';

type Mode = 'sam' | 'liar';
interface St { mode: Mode | null; round: number; sam: Sam | null; liar: Liar | null; flicks: number; tally: Record<string, number>; err: string }
const apply = <T,>(s: St, by: string, me: string, r: T | string, set: (v: T) => St): St => (typeof r === 'string' ? { ...s, err: by === me ? r : s.err } : { ...set(r), err: '' });

export function Cards(p: GP) {
  const ids = [p.me.id, p.them].sort();
  const [st, dispatch] = useReducer((s: St, m: Msg): St => {
    if (m.t === 'deal') {
      const base = { ...s, mode: m.mode, round: s.round + 1, flicks: 0, err: '' };
      return m.mode === 'sam' ? { ...base, sam: dealSam(m.seed, ids[0], ids[1], m.first), liar: null } : { ...base, liar: dealLiar(m.seed, ids[0], ids[1], m.first ?? m.by), sam: null };
    }
    if (m.t === 'state' && !s.mode) return m.st;
    if (m.t === 'play' && s.sam) return apply(s, m.by, p.me.id, playSam(s.sam, m.by, m.cards), sam => ({ ...s, sam }));
    if (m.t === 'pass' && s.sam) return apply(s, m.by, p.me.id, passSam(s.sam, m.by), sam => ({ ...s, sam }));
    if (m.t === 'lplay' && s.liar) return apply(s, m.by, p.me.id, liarPlay(s.liar, m.by, m.idx), liar => ({ ...s, liar }));
    if (m.t === 'call' && s.liar) return apply(s, m.by, p.me.id, liarCall(s.liar, m.by), liar => ({ ...s, liar }));
    if (m.t === 'flick') return { ...s, flicks: s.flicks + 1, tally: { ...s.tally, [m.loser]: (s.tally[m.loser] ?? 0) + 1 } };
    return s;
  }, { mode: null, round: 0, sam: null, liar: null, flicks: 0, tally: {}, err: '' });
  const send = useGameChannel('cards', p.me.id, m => {
    if (m.t === 'hello' && m.by !== p.me.id && st.mode) send('state', { st });
    if (m.t === 'flick') { p.act?.(m.loser === p.me.id ? 'ouch' : 'flick'); p.say?.(m.loser === p.me.id ? '👂 Á! Đau quá 😣' : '👉 Búng nè!'); }
    dispatch(m);
  });
  useEffect(() => { send('hello'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Ai thua, bị búng mấy cái: sâm = số lá còn trên tay; nói dối = số lá vừa úp
  const loser = st.sam?.winner ? (st.sam.winner === p.me.id ? p.them : p.me.id) : st.liar?.reveal?.loser ?? null;
  const need = st.sam?.winner && loser ? Math.min(10, Math.max(1, st.sam.hands[loser]?.length ?? 1)) : st.liar?.reveal ? st.liar.reveal.cards.length : 0;
  const finished = !!loser;
  useEffect(() => { if (finished) reward('cards', p.date); }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const [sel, setSel] = useState<number[]>([]);
  useEffect(() => setSel([]), [st.round, st.sam?.table?.join(), st.sam?.turn, st.liar?.turn]);
  const deal = (mode: Mode) => send('deal', { mode, seed: `${Date.now()}:${Math.random()}`, first: loser ?? p.me.id });
  const toggle = (k: number) => setSel(v => (v.includes(k) ? v.filter(x => x !== k) : [...v, k]));
  const card = (c: number, o: { on?: boolean; click?: () => void; back?: boolean; key?: number | string } = {}) => (
    <button key={o.key ?? c} className={`pcard ${o.back ? 'back' : red(c) ? 'red' : ''} ${o.on ? 'on' : ''}`} onClick={o.click} disabled={!o.click}>{o.back ? '' : label(c)}</button>
  );
  const lcard = (c: LCard | null, o: { on?: boolean; click?: () => void; key: number | string; good?: boolean }) => (
    <button key={o.key} className={`pcard liar ${c === null ? 'back' : c === JOKER ? 'joker' : ''} ${o.on ? 'on' : ''} ${o.good === false ? 'bad' : ''}`} onClick={o.click} disabled={!o.click}>
      {c === null ? '' : c === JOKER ? '🃏' : c}
    </button>
  );
  const tally = <small className="muted">👂 Đã bị búng: Bạn {st.tally[p.me.id] ?? 0} · {nameOf(p, p.them)} {st.tally[p.them] ?? 0}</small>;

  if (!st.mode) {
    return (
      <div className="gamebox cards">
        <p className="game-status">Chọn trò. Ai thua bị <b>búng tai</b> 👂 nha 😆</p>
        <div className="row center wrap">
          <button className="btn" onClick={() => deal('sam')}>🃏 Sâm (10 lá)</button>
          <button className="btn ghost" onClick={() => deal('liar')}>🤥 Nói dối</button>
        </div>
        <p className="muted small-note">🤥 Nói dối: bàn gọi một lá (J/Q/K/A). Tới lượt thì úp 1–3 lá và "tuyên bố" đều là lá đó (Joker thay được mọi lá). Người kia tin thì úp tiếp, không tin thì hô <b>Nói dối!</b> để lật — ai sai bị búng tai.</p>
      </div>
    );
  }

  const after = finished && loser && (
    <div className="cards-after">
      <p className="game-big">{loser === p.me.id ? '😭 Bạn thua rồi!' : `🎉 Bạn thắng! ${nameOf(p, p.them)} bị búng tai`}</p>
      <div className="flick">
        <span key={st.flicks} className={st.flicks ? 'ear hit' : 'ear'}>👂{st.flicks ? '💥' : ''}</span>
        <b>{st.flicks}/{need} cái</b>
        {loser !== p.me.id && st.flicks < need && <button className="btn" onClick={() => send('flick', { loser })}>👉 Búng!</button>}
        {loser === p.me.id && st.flicks < need && <span className="muted">😖 Chuẩn bị chịu búng…</span>}
        {st.flicks >= need && <span>✅ Búng xong!</span>}
      </div>
      <div className="row center">
        <button className="btn small" onClick={() => deal(st.mode!)}>🔄 Ván mới</button>
        <button className="btn small ghost" onClick={() => deal(st.mode === 'sam' ? 'liar' : 'sam')}>Đổi sang {st.mode === 'sam' ? 'Nói dối' : 'Sâm'}</button>
      </div>
      {tally}
    </div>
  );

  if (st.mode === 'liar' && st.liar) {
    const L = st.liar;
    const hand = L.hands[p.me.id] ?? [];
    const myTurn = L.turn === p.me.id && !L.reveal;
    const forced = myTurn && mustCall(L, p.me.id);
    const canCall = myTurn && !!L.pile && L.pile.by !== p.me.id;
    const rv = L.reveal;
    return (
      <div className="gamebox cards">
        <p className="game-status liar-table">🍷 Bàn gọi: <b className="liar-rank">{L.table}</b> <small>(Joker 🃏 thay mọi lá)</small></p>
        <div className="cards-row"><small>{nameOf(p, p.them)} · còn {L.hands[p.them]?.length ?? 0} lá</small>
          <div className="hand mini">{(L.hands[p.them] ?? []).map((_, i) => lcard(null, { key: i }))}</div></div>
        <div className="cards-table">
          {rv ? (
            <>
              <small>{rv.caller === p.me.id ? 'Bạn' : nameOf(p, p.them)} hô "Nói dối!" — lật bài của {rv.by === p.me.id ? 'bạn' : nameOf(p, p.them)}:</small>
              <div className="hand">{rv.cards.map((c, i) => lcard(c, { key: i, good: c === L.table || c === JOKER }))}</div>
              <b>{rv.lied ? '🤥 Nói dối thật!' : '😇 Bài thật 100%!'}</b>
            </>
          ) : L.pile ? (
            <>
              <small>{L.pile.by === p.me.id ? 'Bạn' : nameOf(p, p.them)} úp {L.pile.cards.length} lá và nói: "Đều là <b>{L.table}</b> đó!"</small>
              <div className="hand">{L.pile.cards.map((_, i) => lcard(null, { key: i }))}</div>
            </>
          ) : <small>{myTurn ? 'Bạn' : nameOf(p, p.them)} úp trước</small>}
        </div>
        <div className="cards-row"><small>Bài của bạn {myTurn ? '· 👉 tới lượt bạn' : rv ? '' : `· chờ ${nameOf(p, p.them)}…`}</small>
          <div className="hand">{hand.map((c, i) => lcard(c, { key: i, on: sel.includes(i), click: myTurn && !forced ? () => toggle(i) : undefined }))}</div></div>
        {myTurn && (
          <div className="row center wrap">
            {!forced && <button className="btn" disabled={sel.length < 1 || sel.length > 3} onClick={() => send('lplay', { idx: sel })}>
              {sel.length ? `Úp ${sel.length} lá — "đều là ${L.table}!"` : 'Chọn 1–3 lá để úp'}</button>}
            {canCall && <button className="btn liar-call" onClick={() => send('call')}>🫵 Nói dối!</button>}
            {forced && <span className="muted">Hết bài để úp rồi — phải lật thôi!</span>}
          </div>
        )}
        {st.err && <p className="muted">⚠️ {st.err}</p>}
        {after || tally}
      </div>
    );
  }

  const S = st.sam!;
  const hand = S.hands[p.me.id] ?? [];
  const myTurn = S.turn === p.me.id && !S.winner;
  const selCombo = sel.length ? classify(sel) : null;
  const tableCombo = S.table ? classify(S.table) : null;
  return (
    <div className="gamebox cards">
      <p className="game-status">🃏 Sâm — không xét chất, tứ quý chặt heo. Hết bài trước là thắng; người thua còn bao nhiêu lá bị búng bấy nhiêu cái 👂</p>
      <div className="cards-row"><small>{nameOf(p, p.them)} · còn {S.hands[p.them]?.length ?? 0} lá</small>
        <div className="hand mini">{(S.hands[p.them] ?? []).map((c, i) => card(c, { back: !S.winner, key: i }))}</div></div>
      <div className="cards-table">
        {S.table ? <><small>{S.lastBy === p.me.id ? 'Bạn' : nameOf(p, p.them)} đánh {tableCombo ? KIND_NAME[tableCombo.kind] : ''}:</small><div className="hand">{S.table.map(c => card(c))}</div></>
          : <small>{S.winner ? '' : `${myTurn ? 'Bạn' : nameOf(p, p.them)} được đánh tự do`}</small>}
      </div>
      <div className="cards-row"><small>Bài của bạn {myTurn ? '· 👉 tới lượt bạn' : S.winner ? '' : `· chờ ${nameOf(p, p.them)}…`}</small>
        <div className="hand">{hand.map(c => card(c, { on: sel.includes(c), click: myTurn ? () => toggle(c) : undefined }))}</div></div>
      {myTurn && (
        <div className="row center wrap">
          <button className="btn" disabled={!selCombo} onClick={() => send('play', { cards: sel })}>{selCombo ? `Đánh ${KIND_NAME[selCombo.kind]}` : 'Chọn lá để đánh'}</button>
          {S.table && <button className="btn ghost" onClick={() => send('pass')}>Bỏ lượt</button>}
        </div>
      )}
      {st.err && <p className="muted">⚠️ {st.err}</p>}
      {after || tally}
    </div>
  );
}
