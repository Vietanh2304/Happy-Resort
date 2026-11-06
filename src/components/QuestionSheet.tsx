import { useState } from 'react';
import * as api from '../lib/api';
import { content } from '../lib/content';
import { questionFor } from '../lib/game';
import { useSynced } from '../lib/hooks';
import { notify } from '../lib/realtime';
import { toastError } from '../lib/toast';
import { Sheet } from './Sheet';

interface Props {
  me: api.Profile;
  partner: api.Profile | null;
  date: string;
  answers: api.Answer[];
  onClose: () => void;
}

export function QuestionSheet({ me, partner, date, answers, onClose }: Props) {
  const q = questionFor(me.couple_id, date);
  const [partnerDone] = useSynced('answers', () => api.partnerAnswered(date), false, [date]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const partnerName = partner?.display_name || 'Người ấy';

  const mine = answers.find(a => a.user_id === me.id && a.day === date);
  const theirs = answers.find(a => a.user_id !== me.id && a.day === date);

  // Lịch sử: những ngày cả hai đã trả lời (RLS chỉ trả câu của người ấy khi mình đã trả lời)
  const history = Object.values(
    answers.reduce<Record<string, api.Answer[]>>((acc, a) => ((acc[a.day] ??= []).push(a), acc), {}),
  ).filter(list => list.length === 2 && list[0].day !== date);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.sendAnswer(me, date, q.id, text.trim());
      notify('answers');
    } catch (err) {
      toastError(err);
    }
    setBusy(false);
  }

  return (
    <Sheet title="💬 Câu hỏi hôm nay" onClose={onClose}>
      <div className="question-card">
        <p>{q.text}</p>
      </div>

      {!mine ? (
        <form className="stack" onSubmit={submit}>
          <textarea rows={3} maxLength={500} value={text} onChange={e => setText(e.target.value)} placeholder="Câu trả lời của bạn…" required />
          <button className="btn" disabled={busy || !text.trim()}>Gửi câu trả lời</button>
          <p className="muted">
            {partnerDone ? `${partnerName} đã trả lời rồi — trả lời để xem nhé 👀` : `Câu trả lời sẽ ẩn cho tới khi cả hai cùng trả lời.`}
          </p>
        </form>
      ) : (
        <div className="answers">
          <AnswerBubble who="Bạn" text={mine.answer} mine />
          {theirs
            ? <AnswerBubble who={partnerName} text={theirs.answer} />
            : <p className="muted">Đang chờ {partnerName} trả lời… câu của bạn sẽ hiện với người ấy khi họ trả lời.</p>}
        </div>
      )}

      {history.length > 0 && (
        <>
          <h3 className="section-title">Những câu đã cùng trả lời</h3>
          <ul className="history">
            {history.map(list => {
              const text = content.questions.find(x => x.id === list[0].question_id)?.text ?? '';
              const my = list.find(a => a.user_id === me.id)!;
              const their = list.find(a => a.user_id !== me.id)!;
              return (
                <li key={list[0].day}>
                  <small className="muted">{list[0].day.split('-').reverse().join('/')}</small>
                  <b>{text}</b>
                  <AnswerBubble who="Bạn" text={my.answer} mine />
                  <AnswerBubble who={partnerName} text={their.answer} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}

function AnswerBubble({ who, text, mine }: { who: string; text: string; mine?: boolean }) {
  return (
    <div className={`answer ${mine ? 'from-me' : 'from-them'}`}>
      <small>{who}</small>
      <p>{text}</p>
    </div>
  );
}
