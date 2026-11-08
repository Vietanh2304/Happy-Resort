// Quà mỗi ngày: hộp quà tự hiện lần đầu vào game trong ngày, chạm để mở (mỗi ngày một bất ngờ).
// Đố vui mỗi ngày: 5 câu, đúng câu nào được +30 xu câu đó (mỗi câu trả lời một lần).
import { useState } from 'react';
import * as api from '../lib/api';
import { item } from '../lib/content';
import { QUIZ_COINS, QUIZ_N, quizOf, surpriseOf } from '../lib/daily';
import { emojiSprite } from '../lib/pixel';
import { notify } from '../lib/realtime';
import { toast, toastError } from '../lib/toast';
import { Sheet } from './Sheet';

/** Chuỗi ngày ghé liên tiếp (lưu trên máy) */
function bumpStreak(date: string) {
  try {
    const raw = JSON.parse(localStorage.getItem('hy:streak') ?? '{}') as { last?: string; n?: number };
    if (raw.last === date) return raw.n ?? 1;
    const y = new Date(Date.parse(`${date}T12:00:00`) - 86400e3).toISOString().slice(0, 10);
    const n = raw.last === y ? (raw.n ?? 0) + 1 : 1;
    localStorage.setItem('hy:streak', JSON.stringify({ last: date, n }));
    return n;
  } catch { return 1; }
}

export function DailyGift({ me, date, onClose }: { me: api.Profile; date: string; onClose: () => void }) {
  const gift = surpriseOf(me.id, date);
  const [open, setOpen] = useState(false);
  const [streak] = useState(() => bumpStreak(date));
  const unwrap = async () => {
    setOpen(true);
    try {
      const ok = gift.kind === 'coins' ? await api.grantCoins(`gift:${date}`, gift.n) : await api.claim(`gift:${date}`, [{ id: gift.id, n: gift.n }]);
      if (ok) notify('claims', 'profiles', 'inventory', 'collection');
    } catch (e) { toastError(e); }
  };
  return (
    <Sheet title="🎁 Quà hôm nay" onClose={onClose}>
      <p className="muted small-note center">🔥 Chuỗi ghé liên tiếp: <b>{streak} ngày</b></p>
      {!open ? (
        <button className="gift-box" onClick={() => void unwrap()} aria-label="Mở quà">🎁<small>Chạm để mở</small></button>
      ) : (
        <div className="gift-open">
          <div className="gift-burst">{gift.kind === 'coins' ? '🪙' : <img src={emojiSprite(item(gift.id).icon, 20).url} className="px-img" alt="" />}</div>
          <b>{gift.title}</b>
          {gift.kind === 'item' && <span>{item(gift.id).icon} {item(gift.id).name} — đã vào túi đồ</span>}
          <p className="muted">{gift.note}</p>
          <button className="btn" onClick={onClose}>Tuyệt quá! 💕</button>
        </div>
      )}
    </Sheet>
  );
}

export function DailyQuiz({ date, claimed, onClose }: { date: string; claimed: string[]; onClose: () => void }) {
  const qs = quizOf(date);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const done = (i: number) => claimed.includes(`quiz:${date}:${i}`) || claimed.includes(`quizx:${date}:${i}`) || picked[i] !== undefined;
  const answer = async (i: number, j: number) => {
    if (done(i)) return;
    setPicked(p => ({ ...p, [i]: j }));
    try {
      if (j === qs[i].ok) { if (await api.grantCoins(`quiz:${date}:${i}`, QUIZ_COINS)) toast(`✅ Chính xác! +${QUIZ_COINS} xu`); }
      else { await api.claim(`quizx:${date}:${i}`); toast(`❌ Chưa đúng — đáp án: ${qs[i].a[qs[i].ok]}`); }
      notify('claims', 'profiles');
    } catch (e) { toastError(e); }
  };
  const right = qs.filter((_, i) => claimed.includes(`quiz:${date}:${i}`) || picked[i] === qs[i].ok).length;
  return (
    <Sheet title="🧠 Đố vui hôm nay" onClose={onClose}>
      <p className="muted small-note">Mỗi ngày {QUIZ_N} câu, đúng câu nào được +{QUIZ_COINS} xu câu đó (mỗi câu trả lời một lần). Đúng hôm nay: <b>{right}/{QUIZ_N}</b></p>
      {qs.map((q, i) => {
        const wasRight = claimed.includes(`quiz:${date}:${i}`);
        const mine = picked[i];
        return (
          <div key={i} className="hw-q">
            <p><b>Câu {i + 1}.</b> {q.q}</p>
            <div className="row wrap">
              {q.a.map((o, j) => {
                const reveal = done(i);
                const cls = reveal && j === q.ok ? 'right active' : mine === j ? 'wrong' : '';
                return <button key={j} disabled={reveal} className={`chip ${cls}`} onClick={() => void answer(i, j)}>{o}</button>;
              })}
              {(wasRight || mine === q.ok) && <span className="ok-tag">+{QUIZ_COINS} xu ✅</span>}
            </div>
          </div>
        );
      })}
    </Sheet>
  );
}
